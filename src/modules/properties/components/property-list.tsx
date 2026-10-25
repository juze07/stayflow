import { Bath, BedDouble, Building2, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { PropertyListItem } from "../queries";

type PropertyListProps = {
  properties: PropertyListItem[];
  empty: { title: string; description?: ReactNode; action?: ReactNode };
};

function Capacity({ property }: { property: PropertyListItem }) {
  return (
    <span className="inline-flex items-center gap-3 text-muted-foreground tabular-nums">
      <span className="inline-flex items-center gap-1" title="Quartos">
        <BedDouble className="size-4" aria-hidden />
        <span className="sr-only">Quartos:</span>
        {property.bedrooms}
      </span>
      <span className="inline-flex items-center gap-1" title="Casas de banho">
        <Bath className="size-4" aria-hidden />
        <span className="sr-only">Casas de banho:</span>
        {property.bathrooms}
      </span>
      <span className="inline-flex items-center gap-1" title="Hóspedes">
        <Users className="size-4" aria-hidden />
        <span className="sr-only">Hóspedes:</span>
        {property.maxGuests}
      </span>
    </span>
  );
}

export function PropertyList({ properties, empty }: PropertyListProps) {
  if (properties.length === 0) {
    return <EmptyState icon={Building2} title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <Card className="overflow-hidden">
      <table className="data-table hidden md:table">
        <thead>
          <tr>
            <th scope="col">Propriedade</th>
            <th scope="col">Localidade</th>
            <th scope="col">Capacidade</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id} className="relative">
              <td>
                <Link
                  href={`/propriedades/${property.id}`}
                  className="font-medium text-foreground underline-offset-4 after:absolute after:inset-0 hover:underline"
                >
                  {property.name}
                </Link>
                {property.archivedAt && <Badge className="ml-2">Arquivada</Badge>}
                <p className="text-xs text-muted-foreground">{property.addressLine}</p>
              </td>
              <td className="text-muted-foreground">
                {property.postalCode} {property.city}
              </td>
              <td>
                <Capacity property={property} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {properties.map((property) => (
          <li key={property.id}>
            <Link
              href={`/propriedades/${property.id}`}
              className="block space-y-1 px-4 py-3.5 transition-colors hover:bg-muted/50"
            >
              <p className="font-medium text-foreground">
                {property.name}
                {property.archivedAt && <Badge className="ml-2">Arquivada</Badge>}
              </p>
              <p className="text-sm text-muted-foreground">
                {property.addressLine}, {property.city}
              </p>
              <p className="text-sm">
                <Capacity property={property} />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
