import { zonedToday } from "@/lib/dates";
import { formatCentsInput } from "@/lib/format";
import { requestTime } from "@/lib/now";
import { getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listPropertyOptions } from "@/modules/properties/queries";
import { StaysManagersOnly } from "@/modules/stays/components/stays-only";
import { listStayOptions } from "@/modules/stays/queries";
import { getPayment } from "../queries";
import { PaymentForm } from "./payment-form";

export async function NewPaymentForm({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) return <StaysManagersOnly />;

  const [properties, stays] = await Promise.all([listPropertyOptions(business.id), listStayOptions(business.id)]);
  const today = zonedToday(business.timezone, requestTime());
  // Ao registar a partir de uma estadia, o pagamento fica ligado a ela e à sua propriedade.
  const stay = stays.find((s) => s.id === getParam(params, "estadia"));

  return (
    <PaymentForm
      properties={properties}
      stays={stays}
      today={today}
      cancelHref={stay ? `/estadias/${stay.id}` : "/receitas/pagamentos"}
      defaultValues={{
        description: "",
        amount: "",
        dueOn: today,
        propertyId: stay?.propertyId ?? "",
        stayId: stay?.id ?? "",
        paid: false,
        paidOn: "",
        method: "",
        notes: "",
      }}
    />
  );
}

export async function EditPaymentForm({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) return <StaysManagersOnly />;

  const [payment, properties, stays] = await Promise.all([
    getPayment(business.id, id),
    listPropertyOptions(business.id, { includeArchived: true }),
    listStayOptions(business.id),
  ]);
  const linkedStay = payment.stay;
  const stayOptions =
    linkedStay && !stays.some((s) => s.id === linkedStay.id)
      ? [
          ...stays,
          { id: linkedStay.id, name: linkedStay.guestName, startsOn: "", propertyId: payment.property?.id ?? "" },
        ]
      : stays;

  return (
    <PaymentForm
      paymentId={payment.id}
      properties={properties
        .filter((p) => !p.archived || p.id === payment.property?.id)
        .map((p) => ({ id: p.id, name: p.archived ? `${p.name} (arquivada)` : p.name }))}
      stays={stayOptions}
      today={zonedToday(business.timezone, requestTime())}
      cancelHref={linkedStay ? `/estadias/${linkedStay.id}` : "/receitas/pagamentos"}
      defaultValues={{
        description: payment.description,
        amount: formatCentsInput(payment.amountCents),
        dueOn: payment.dueOn,
        propertyId: payment.property?.id ?? "",
        stayId: linkedStay?.id ?? "",
        paid: payment.status === "paid",
        paidOn: payment.paidOn ?? "",
        method: payment.method ?? "",
        notes: payment.notes ?? "",
      }}
    />
  );
}
