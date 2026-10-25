import { z } from "zod";

/** Metadados que a app coloca em cada pagamento criado na Stripe. */
export const paymentMetadataSchema = z.object({
  stayflow_payment_id: z.uuid(),
});

export const accountIdSchema = z.string().regex(/^acct_[A-Za-z0-9]{1,64}$/);
export const customerIdSchema = z.string().regex(/^cus_[A-Za-z0-9]{1,64}$/);

const ibanAddressSchema = z.object({
  type: z.literal("iban"),
  iban: z.object({
    iban: z
      .string()
      .transform((value) => value.replace(/\s+/g, "").toUpperCase())
      .pipe(z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{8,30}$/)),
    bic: z.string().max(11).nullish(),
    bank_name: z.string().max(200).nullish(),
    account_holder_name: z.string().max(200).nullish(),
    country: z.string().regex(/^[A-Z]{2}$/),
  }),
});

export type VirtualIban = {
  iban: string;
  bic: string | null;
  bankName: string | null;
  accountHolderName: string | null;
  country: string;
};

/** Extrai o IBAN das instruções de transferência devolvidas pela Stripe. */
export function parseVirtualIban(fundingInstructions: unknown): VirtualIban | null {
  const parsed = z
    .object({ bank_transfer: z.object({ financial_addresses: z.array(z.unknown()) }) })
    .safeParse(fundingInstructions);
  if (!parsed.success) return null;

  for (const address of parsed.data.bank_transfer.financial_addresses) {
    const iban = ibanAddressSchema.safeParse(address);
    if (iban.success) {
      const { iban: value, bic, bank_name, account_holder_name, country } = iban.data.iban;
      return {
        iban: value,
        bic: bic ?? null,
        bankName: bank_name ?? null,
        accountHolderName: account_holder_name ?? null,
        country,
      };
    }
  }
  return null;
}

/** IBAN em grupos de 4 caracteres, como aparece nos bancos. */
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})(?=.)/g, "$1 ");
}
