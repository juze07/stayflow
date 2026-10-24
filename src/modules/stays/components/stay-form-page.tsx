import { zonedToday } from "@/lib/dates";
import { requestTime } from "@/lib/now";
import { getParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listPropertyOptions } from "@/modules/properties/queries";
import { getStay } from "../queries";
import { StayForm } from "./stay-form";
import { StaysManagersOnly } from "./stays-only";

export async function NewStayForm({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ business, role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) return <StaysManagersOnly />;

  const properties = await listPropertyOptions(business.id);
  const requested = getParam(params, "propriedade");

  return (
    <StayForm
      properties={properties}
      cancelHref="/estadias"
      defaultValues={{
        propertyId: properties.some((p) => p.id === requested) ? requested! : "",
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        startsOn: zonedToday(business.timezone, requestTime()),
        endsOn: "",
        notes: "",
      }}
    />
  );
}

export async function EditStayForm({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) return <StaysManagersOnly />;

  const [stay, properties] = await Promise.all([
    getStay(business.id, id),
    listPropertyOptions(business.id, { includeArchived: true }),
  ]);

  return (
    <StayForm
      stayId={stay.id}
      properties={properties
        .filter((p) => !p.archived || p.id === stay.property?.id)
        .map((p) => ({ id: p.id, name: p.archived ? `${p.name} (arquivada)` : p.name }))}
      cancelHref={`/estadias/${stay.id}`}
      defaultValues={{
        propertyId: stay.property?.id ?? "",
        guestName: stay.guestName,
        guestEmail: stay.guestEmail,
        guestPhone: stay.guestPhone ?? "",
        startsOn: stay.startsOn,
        endsOn: stay.endsOn ?? "",
        notes: stay.notes ?? "",
      }}
    />
  );
}
