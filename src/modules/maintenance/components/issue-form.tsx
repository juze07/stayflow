"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/lib/forms";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/modules/tasks/constants";
import { createIssueAction, updateIssueAction } from "../actions";
import { ISSUE_CATEGORIES, ISSUE_CATEGORY_LABELS } from "../constants";
import { issueSchema, type IssueInput, type IssueValues } from "../schemas";

type Option = { id: string; name: string };

type IssueFormProps = {
  issueId?: string;
  defaultValues: IssueInput;
  properties: Option[];
  assignees: Option[];
  /** Colaboradores reportam; responsável e custo ficam para a gestão. */
  canManage: boolean;
  sourceInspectionTitle?: string;
  cancelHref: string;
};

export function IssueForm({
  issueId,
  defaultValues,
  properties,
  assignees,
  canManage,
  sourceInspectionTitle,
  cancelHref,
}: IssueFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<IssueInput, unknown, IssueValues>({ resolver: zodResolver(issueSchema), defaultValues });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setError(null);
    const values = form.getValues();
    startTransition(async () => {
      // Em caso de sucesso, a ação redireciona para a página do problema.
      const result = issueId ? await updateIssueAction(issueId, values) : await createIssueAction(values);
      const message = applyServerErrors(result, form.setError);
      if (message) setError(message);
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          {sourceInspectionTitle && (
            <Alert tone="info">Problema encontrado na inspeção &quot;{sourceInspectionTitle}&quot;.</Alert>
          )}

          <FormField label="Propriedade" error={errors.propertyId?.message}>
            <Select {...form.register("propertyId")}>
              <option value="" disabled>
                Escolha a propriedade
              </option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="O que se passa?" error={errors.title?.message} hint="Ex.: Torneira da cozinha a pingar.">
            <Input autoFocus={!issueId} {...form.register("title")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Categoria" error={errors.category?.message}>
              <Select {...form.register("category")}>
                {ISSUE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {ISSUE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Prioridade" error={errors.priority?.message}>
              <Select {...form.register("priority")}>
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {TASK_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Detalhes" optional error={errors.description?.message}>
            <Textarea rows={4} {...form.register("description")} />
          </FormField>

          {canManage && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Responsável" optional error={errors.assigneeId?.message}>
                <Select {...form.register("assigneeId")}>
                  <option value="">Sem responsável</option>
                  {assignees.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Custo estimado (€)" optional error={errors.estimatedCost?.message}>
                <Input inputMode="decimal" placeholder="0,00" {...form.register("estimatedCost")} />
              </FormField>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="secondary" asChild>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button type="submit" loading={isPending}>
            {issueId ? "Guardar alterações" : "Reportar problema"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
