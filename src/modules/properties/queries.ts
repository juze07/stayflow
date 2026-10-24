import "server-only";
import { notFound } from "next/navigation";
import { PAGE_SIZE, pageRange, toIlikePattern } from "@/lib/search-params";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/modules/business/schemas";
import type { PropertyStatusFilter } from "./schemas";

export type PropertyListItem = {
  id: string;
  name: string;
  addressLine: string;
  postalCode: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  archivedAt: string | null;
};

export type PropertyDetail = PropertyListItem & {
  accessInstructions: string | null;
  internalNotes: string | null;
  createdAt: string;
};

const LIST_COLUMNS = "id, name, address_line, postal_code, city, bedrooms, bathrooms, max_guests, archived_at";

type PropertyRow = {
  id: string;
  name: string;
  address_line: string;
  postal_code: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  archived_at: string | null;
};

function toListItem(row: PropertyRow): PropertyListItem {
  return {
    id: row.id,
    name: row.name,
    addressLine: row.address_line,
    postalCode: row.postal_code,
    city: row.city,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    maxGuests: row.max_guests,
    archivedAt: row.archived_at,
  };
}

type ListPropertiesOptions = {
  businessId: string;
  search?: string;
  city?: string;
  status?: PropertyStatusFilter;
  page: number;
};

export async function listProperties({ businessId, search, city, status = "ativas", page }: ListPropertiesOptions) {
  const supabase = await createClient();
  const { from, to } = pageRange(page);

  let query = supabase
    .from("properties")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("business_id", businessId)
    .order("name", { ascending: true })
    .range(from, to);

  query = status === "arquivadas" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (city) query = query.eq("city", city);

  const pattern = toIlikePattern(search);
  if (pattern) query = query.or(`name.ilike.${pattern},address_line.ilike.${pattern},city.ilike.${pattern}`);

  const { data, count, error } = await query;
  if (error) throw error;

  return { items: (data ?? []).map(toListItem), total: count ?? 0, pageSize: PAGE_SIZE };
}

/** Localidades com propriedades, para o filtro da lista. */
export async function listPropertyCities(businessId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("properties").select("city").eq("business_id", businessId);
  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.city))].sort((a, b) => a.localeCompare(b, "pt"));
}

/** Propriedades para escolher numa lista (ex.: ao criar uma tarefa). */
export async function listPropertyOptions(
  businessId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<{ id: string; name: string; archived: boolean }[]> {
  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select("id, name, archived_at")
    .eq("business_id", businessId)
    .order("name", { ascending: true });
  if (!includeArchived) query = query.is("archived_at", null);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, archived: row.archived_at !== null }));
}

export async function getProperty(businessId: string, propertyId: string): Promise<PropertyDetail> {
  if (!idSchema.safeParse(propertyId).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(`${LIST_COLUMNS}, access_instructions, internal_notes, created_at`)
    .eq("business_id", businessId)
    .eq("id", propertyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  return {
    ...toListItem(data),
    accessInstructions: data.access_instructions,
    internalNotes: data.internal_notes,
    createdAt: data.created_at,
  };
}

/**
 * Despesas recentes da propriedade. O RLS só as
 * devolve a administradores e gestores.
 */
export async function listPropertyExpenses(businessId: string, propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, description, amount_cents, incurred_on")
    .eq("business_id", businessId)
    .eq("property_id", propertyId)
    .order("incurred_on", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    incurredOn: row.incurred_on,
  }));
}
