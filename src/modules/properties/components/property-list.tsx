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
      <table className="hidden w-full text-sm md:table">
        <thead className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Propriedade
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Localidade
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Capacidade
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {properties.map((property) => (
            <tr key={property.id} className="hover:bg-muted/40">
              <td className="px-4 py-3">
                <Link href={`/propriedades/${property.id}`} className="font-medium text-foreground hover:underline">
                  {property.name}
                </Link>
                {property.archivedAt && <Badge className="ml-2">Arquivada</Badge>}
                <p className="text-xs text-muted-foreground">{property.addressLine}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {property.postalCode} {property.city}
              </td>
              <td className="px-4 py-3">
                <Capacity property={property} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {properties.map((property) => (
          <li key={property.id}>
            <Link href={`/propriedades/${property.id}`} className="block space-y-1 px-4 py-3 hover:bg-muted/40">
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
