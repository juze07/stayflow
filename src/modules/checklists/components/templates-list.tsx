import { ClipboardList, Plus } from "@/components/ui/icons";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireBusiness } from "@/modules/business/queries";
import { canManageOperations } from "@/modules/business/roles";
import { listChecklistTemplates } from "../queries";
import { CHECKLIST_KINDS, CHECKLIST_KIND_LABELS } from "../schemas";
import { TemplateActiveToggle } from "./template-active-toggle";

export async function TemplatesList() {
  const { business, role } = await requireBusiness();
  const canManage = canManageOperations(role);
  const templates = await listChecklistTemplates(business.id);

  return (
    <div className="space-y-6">
      {!canManage && (
        <p className="text-sm text-muted-foreground">Só administradores e gestores podem alterar as listas.</p>
      )}
      {CHECKLIST_KINDS.map((kind) => {
        const ofKind = templates.filter((template) => template.kind === kind);
        return (
          <Card key={kind}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Listas de {CHECKLIST_KIND_LABELS[kind].toLowerCase()}</CardTitle>
                <CardDescription>
                  {kind === "cleaning"
                    ? "Os passos que a equipa marca durante cada limpeza."
                    : "Os pontos verificados em cada inspeção."}
                </CardDescription>
              </div>
              {canManage && (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/definicoes/listas/nova?tipo=${kind}`}>
                    <Plus aria-hidden />
                    Nova
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {ofKind.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há listas deste tipo.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {ofKind.map((template) => (
                    <li key={template.id} className="flex items-center gap-3 py-3">
                      <ClipboardList className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0 flex-1">
                        {canManage ? (
                          <Link
                            href={`/definicoes/listas/${template.id}`}
                            className="text-sm font-medium text-foreground hover:underline"
                          >
                            {template.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-foreground">{template.name}</span>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {template.itemCount} {template.itemCount === 1 ? "item" : "itens"}
                        </p>
                      </div>
                      {!template.isActive && <Badge>Desativada</Badge>}
                      {canManage && <TemplateActiveToggle templateId={template.id} isActive={template.isActive} />}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
