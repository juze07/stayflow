import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { TemplateEditor } from "@/modules/checklists/components/template-editor";
import { getChecklistTemplate } from "@/modules/checklists/queries";

export const metadata: Metadata = { title: "Editar lista de verificação" };

async function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
  const [{ business, role }, { id }] = await Promise.all([requireBusiness(), params]);
  if (!canManageOperations(role)) redirect("/definicoes/listas");
  const template = await getChecklistTemplate(business.id, id);

  return (
    <TemplateEditor
      templateId={template.id}
      defaultValues={{ kind: template.kind, name: template.name, items: template.items }}
    />
  );
}

export default function EditTemplatePage({ params }: PageProps<"/definicoes/listas/[id]">) {
  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
      <EditTemplate params={params} />
    </Suspense>
  );
}
