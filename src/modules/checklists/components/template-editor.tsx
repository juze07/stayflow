"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";
import { saveChecklistTemplateAction } from "../actions";
import {
  CHECKLIST_KIND_LABELS,
  checklistTemplateSchema,
  type ChecklistTemplateInput,
  type ChecklistTemplateValues,
} from "../schemas";

type TemplateEditorProps = { templateId: string | null; defaultValues: ChecklistTemplateInput };

export function TemplateEditor({ templateId, defaultValues }: TemplateEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ChecklistTemplateInput, unknown, ChecklistTemplateValues>({
    resolver: zodResolver(checklistTemplateSchema),
    defaultValues,
  });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "items" });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setError(null);
    const values = form.getValues();
    startTransition(async () => {
      // Em caso de sucesso, a ação volta à lista de modelos.
      const result = await saveChecklistTemplateAction(templateId, values);
      const message = applyServerErrors(result, form.setError);
      if (message) setError(message);
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-5">
          {error && <Alert tone="danger">{error}</Alert>}
          <p className="text-sm text-muted-foreground">
            Lista de {CHECKLIST_KIND_LABELS[defaultValues.kind].toLowerCase()}. As alterações aplicam-se às tarefas
            criadas a partir de agora; as que já existem mantêm a sua lista.
          </p>

          <FormField label="Nome da lista" error={errors.name?.message}>
            <Input {...form.register("name")} />
          </FormField>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Itens</legend>
            {errors.items?.root?.message || errors.items?.message ? (
              <p className="text-sm text-destructive">{errors.items?.root?.message ?? errors.items?.message}</p>
            ) : null}
            <ol className="space-y-2">
              {fields.map((field, index) => (
                <li key={field.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-2.5 w-6 text-right text-sm tabular-nums text-muted-foreground">
                      {index + 1}.
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        aria-label={`Item ${index + 1}`}
                        aria-invalid={errors.items?.[index]?.label ? true : undefined}
                        {...form.register(`items.${index}.label`)}
                      />
                      {errors.items?.[index]?.label && (
                        <p className="text-sm text-destructive">{errors.items[index]?.label?.message}</p>
                      )}
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--color-primary)]"
                          {...form.register(`items.${index}.required`)}
                        />
                        Obrigatório para concluir
                      </label>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Subir item ${index + 1}`}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                      >
                        <ArrowUp aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Descer item ${index + 1}`}
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, index + 1)}
                      >
                        <ArrowDown aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover item ${index + 1}`}
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="text-destructive" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="secondary"
              disabled={fields.length >= 100}
              onClick={() => append({ label: "", required: true }, { shouldFocus: true })}
            >
              <Plus aria-hidden />
              Adicionar item
            </Button>
          </fieldset>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" asChild>
            <Link href="/definicoes/listas">Cancelar</Link>
          </Button>
          <Button type="submit" loading={isPending}>
            {templateId ? "Guardar lista" : "Criar lista"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
