import { firstName, formatLongDate } from "@/lib/format";
import { requireBusiness } from "@/modules/business/queries";

export async function Greeting() {
  const { profile, user, business } = await requireBusiness();
  const name = firstName(profile.fullName, user.email);

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Olá, {name}</h1>
      <p className="text-sm text-muted-foreground first-letter:uppercase">
        {formatLongDate(new Date(), business.timezone)}
      </p>
    </div>
  );
}
