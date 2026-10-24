import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { getEnumParam, type SearchParams } from "@/lib/search-params";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { TemplateEditor } from "@/modules/checklists/components/template-editor";
import { CHECKLIST_KINDS } from "@/modules/checklists/schemas";

export const metadata: Metadata = { title: "Nova lista de verificação" };

async function NewTemplate({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ role }, params] = await Promise.all([requireBusiness(), searchParams]);
  if (!canManageOperations(role)) redirect("/definicoes/listas");
  const kind = getEnumParam(params, "tipo", CHECKLIST_KINDS) ?? "cleaning";

  return (
    <TemplateEditor templateId={null} defaultValues={{ kind, name: "", items: [{ label: "", required: true }] }} />
  );
}

export default function NewTemplatePage({ searchParams }: PageProps<"/definicoes/listas/nova">) {
  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
      <NewTemplate searchParams={searchParams} />
    </Suspense>
  );
}
