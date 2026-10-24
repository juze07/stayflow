"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/lib/forms";
import { createExpenseAction, updateExpenseAction } from "../actions";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "../constants";
import { expenseSchema, type ExpenseInput, type ExpenseValues } from "../schemas";

type Option = { id: string; name: string };
type IssueOption = Option & { propertyId: string };

type ExpenseFormProps = {
  expenseId?: string;
  defaultValues: ExpenseInput;
  properties: Option[];
  issues: IssueOption[];
  cancelHref: string;
};

export function ExpenseForm({ expenseId, defaultValues, properties, issues, cancelHref }: ExpenseFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ExpenseInput, unknown, ExpenseValues>({ resolver: zodResolver(expenseSchema), defaultValues });
  const { errors } = form.formState;
  const [propertyId, issueId] = useWatch({ control: form.control, name: ["propertyId", "maintenanceIssueId"] });
  // Só os problemas da propriedade escolhida (ou todos, numa despesa geral).
  const issueOptions = issues.filter((issue) => !propertyId || issue.propertyId === propertyId || issue.id === issueId);

  const onSubmit = form.handleSubmit(() => {
    setError(null);
    const values = form.getValues();
    startTransition(async () => {
      // Em caso de sucesso, a ação redireciona para a página da despesa.
      const result = expenseId ? await updateExpenseAction(expenseId, values) : await createExpenseAction(values);
      const message = applyServerErrors(result, form.setError);
      if (message) setError(message);
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <FormField label="Descrição" error={errors.description?.message} hint="Ex.: Detergentes e papel higiénico.">
            <Input autoFocus={!expenseId} {...form.register("description")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Valor (€)" error={errors.amount?.message}>
              <Input inputMode="decimal" placeholder="0,00" {...form.register("amount")} />
            </FormField>
            <FormField label="Data" error={errors.incurredOn?.message}>
              <Input type="date" {...form.register("incurredOn")} />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Categoria" error={errors.category?.message}>
              <Select {...form.register("category")}>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {EXPENSE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Propriedade" optional error={errors.propertyId?.message}>
              <Select {...form.register("propertyId")}>
                <option value="">Geral (sem propriedade)</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {issueOptions.length > 0 && (
            <FormField
              label="Problema de manutenção"
              optional
              error={errors.maintenanceIssueId?.message}
              hint="Ligue a despesa à reparação a que diz respeito."
            >
              <Select {...form.register("maintenanceIssueId")}>
                <option value="">Nenhum</option>
                {issueOptions.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Fornecedor" optional error={errors.supplier?.message}>
            <Input autoComplete="organization" {...form.register("supplier")} />
          </FormField>

          <FormField label="Notas" optional error={errors.notes?.message}>
            <Textarea rows={3} {...form.register("notes")} />
          </FormField>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" asChild>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button type="submit" loading={isPending}>
            {expenseId ? "Guardar alterações" : "Registar despesa"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
