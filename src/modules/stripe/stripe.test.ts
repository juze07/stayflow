import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import type { PendingPayment, StripeDb } from "./db";
import { formatIban, parseVirtualIban } from "./schemas";
import { applyCashBalance, paymentIntentMethod } from "./service";
import { handleStripeEvent } from "./webhook";

const PAYMENT_ID = "0b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b";
const OTHER_PAYMENT_ID = "1b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b";

function fakeDb(overrides: Partial<StripeDb> = {}): StripeDb {
  return {
    saveAccount: vi.fn(async (_b, account) => account),
    updateAccount: vi.fn(async () => {}),
    stayContext: vi.fn(async () => null),
    paymentContext: vi.fn(async () => null),
    saveStayCustomer: vi.fn(async (_s, customer) => customer),
    saveStayIban: vi.fn(async () => {}),
    attachPaymentIntent: vi.fn(async () => {}),
    pendingPaymentsForCustomer: vi.fn(async () => []),
    markPaymentPaid: vi.fn(async () => "paid" as const),
    eventProcessed: vi.fn(async () => false),
    recordEvent: vi.fn(async () => {}),
    ...overrides,
  };
}

function event(type: string, object: object, account: string | null = "acct_Empresa1") {
  return { id: "evt_1", type, account, data: { object } } as unknown as Stripe.Event;
}

const pending = (id: string, amountCents: number, paymentIntentId: string | null = null): PendingPayment => ({
  paymentId: id,
  stayId: "s",
  businessId: "b",
  description: "Renda",
  amountCents,
  paymentIntentId,
});

describe("IBAN virtual", () => {
  it("extrai o IBAN das instruções de transferência", () => {
    expect(
      parseVirtualIban({
        bank_transfer: {
          financial_addresses: [
            {
              type: "iban",
              iban: {
                iban: "nl91 test 0123 4567 89",
                bic: "TESTNL2A",
                bank_name: "Banco",
                account_holder_name: "Empresa",
                country: "NL",
              },
            },
          ],
        },
      }),
    ).toEqual({
      iban: "NL91TEST0123456789",
      bic: "TESTNL2A",
      bankName: "Banco",
      accountHolderName: "Empresa",
      country: "NL",
    });
  });

  it("devolve null quando não há IBAN válido", () => {
    expect(parseVirtualIban({ bank_transfer: { financial_addresses: [{ type: "sort_code" }] } })).toBeNull();
    expect(parseVirtualIban({ bank_transfer: { financial_addresses: [{ type: "iban", iban: { iban: "x" } }] } })).toBe(
      null,
    );
    expect(parseVirtualIban(null)).toBeNull();
  });

  it("formata o IBAN em grupos de 4", () => {
    expect(formatIban("NL91TEST0123456789")).toBe("NL91 TEST 0123 4567 89");
  });
});

describe("webhook", () => {
  const stripe = {} as Stripe;

  it("verifica a assinatura com o corpo original", () => {
    const sdk = new Stripe("sk_test_123");
    const secret = "whsec_teste";
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "account.updated" });
    const header = sdk.webhooks.generateTestHeaderString({ payload, secret });
    expect(sdk.webhooks.constructEvent(payload, header, secret).id).toBe("evt_1");
    expect(() => sdk.webhooks.constructEvent(payload.replace("evt_1", "evt_2"), header, secret)).toThrow();
    expect(() => sdk.webhooks.constructEvent(payload, header, "whsec_outro")).toThrow();
  });

  it("ignora eventos repetidos", async () => {
    const db = fakeDb({ eventProcessed: vi.fn(async () => true) });
    const result = await handleStripeEvent(event("payment_intent.succeeded", {}), { stripe, db });
    expect(result).toBe("duplicate");
    expect(db.markPaymentPaid).not.toHaveBeenCalled();
    expect(db.recordEvent).not.toHaveBeenCalled();
  });

  it("atualiza o estado da conta ligada", async () => {
    const db = fakeDb();
    await handleStripeEvent(
      event("account.updated", { id: "acct_Empresa1", charges_enabled: true, details_submitted: true }),
      { stripe, db },
    );
    expect(db.updateAccount).toHaveBeenCalledWith("acct_Empresa1", true, true);
    expect(db.recordEvent).toHaveBeenCalledWith("evt_1", "account.updated");
  });

  it("marca o pagamento como recebido com o valor recebido e o método", async () => {
    const db = fakeDb();
    const result = await handleStripeEvent(
      event("payment_intent.succeeded", {
        id: "pi_1",
        amount_received: 80000,
        payment_method_types: ["customer_balance"],
        metadata: { stayflow_payment_id: PAYMENT_ID },
      }),
      { stripe, db },
    );
    expect(result).toBe("paid");
    expect(db.markPaymentPaid).toHaveBeenCalledWith({
      accountId: "acct_Empresa1",
      paymentId: PAYMENT_ID,
      paymentIntentId: "pi_1",
      amountCents: 80000,
      method: "transfer",
    });
  });

  it("ignora pagamentos sem metadados da app e eventos da própria plataforma", async () => {
    const db = fakeDb();
    await handleStripeEvent(
      event("payment_intent.succeeded", {
        id: "pi_1",
        amount_received: 1,
        payment_method_types: ["card"],
        metadata: {},
      }),
      { stripe, db },
    );
    await handleStripeEvent(
      event(
        "payment_intent.succeeded",
        {
          id: "pi_1",
          amount_received: 1,
          payment_method_types: ["card"],
          metadata: { stayflow_payment_id: PAYMENT_ID },
        },
        null,
      ),
      { stripe, db },
    );
    expect(db.markPaymentPaid).not.toHaveBeenCalled();
    expect(db.recordEvent).toHaveBeenCalledTimes(2);
  });

  it("não regista o evento se o processamento falhar (a Stripe volta a enviar)", async () => {
    const db = fakeDb({ updateAccount: vi.fn(async () => Promise.reject(new Error("db"))) });
    await expect(
      handleStripeEvent(
        event("account.updated", { id: "acct_Empresa1", charges_enabled: true, details_submitted: true }),
        {
          stripe,
          db,
        },
      ),
    ).rejects.toThrow("db");
    expect(db.recordEvent).not.toHaveBeenCalled();
  });
});

describe("saldo recebido por transferência", () => {
  it("aplica o saldo aos pagamentos mais antigos e pára quando não chega", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ id: "pi_a", status: "succeeded", amount_received: 50000 })
      .mockResolvedValueOnce({ id: "pi_b", status: "requires_action", amount_received: 0 });
    const stripe = { paymentIntents: { create, retrieve: vi.fn() } } as unknown as Stripe;
    const db = fakeDb({
      pendingPaymentsForCustomer: vi.fn(async () => [
        pending(PAYMENT_ID, 50000),
        pending(OTHER_PAYMENT_ID, 50000),
        pending("2b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b", 50000),
      ]),
    });

    const paid = await applyCashBalance(stripe, db, "acct_Empresa1", "cus_1");

    expect(paid).toBe(1);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0]).toMatchObject({
      amount: 50000,
      currency: "eur",
      customer: "cus_1",
      allowed_payment_method_types: ["customer_balance"],
      confirm: true,
      metadata: { stayflow_payment_id: PAYMENT_ID },
    });
    expect(create.mock.calls[0][1]).toEqual({
      stripeAccount: "acct_Empresa1",
      idempotencyKey: `stayflow-balance-${PAYMENT_ID}-50000`,
    });
    expect(db.attachPaymentIntent).toHaveBeenCalledWith(PAYMENT_ID, "pi_a");
    expect(db.markPaymentPaid).toHaveBeenCalledTimes(1);
  });

  it("reutiliza o PaymentIntent de transferência já criado", async () => {
    const retrieve = vi.fn(async () => ({
      id: "pi_old",
      status: "succeeded",
      amount_received: 50000,
      payment_method_types: ["customer_balance"],
    }));
    const create = vi.fn();
    const stripe = { paymentIntents: { create, retrieve } } as unknown as Stripe;
    const db = fakeDb({ pendingPaymentsForCustomer: vi.fn(async () => [pending(PAYMENT_ID, 50000, "pi_old")]) });

    expect(await applyCashBalance(stripe, db, "acct_Empresa1", "cus_1")).toBe(1);
    expect(create).not.toHaveBeenCalled();
    expect(retrieve).toHaveBeenCalledWith("pi_old", {}, { stripeAccount: "acct_Empresa1" });
  });

  it("identifica o método do pagamento", () => {
    expect(paymentIntentMethod({ payment_method_types: ["card"] })).toBe("card");
    expect(paymentIntentMethod({ payment_method_types: ["customer_balance"] })).toBe("transfer");
  });
});
