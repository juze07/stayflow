"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { applyServerErrors } from "@/lib/forms";
import type { z } from "@/lib/zod";
import { updateBusinessSettingsAction } from "../actions";
import { businessSettingsSchema, TIMEZONES, type BusinessSettingsInput } from "../schemas";

type BusinessSettingsFormProps = { defaultValues: BusinessSettingsInput; readOnly: boolean };

export function BusinessSettingsForm({ defaultValues, readOnly }: BusinessSettingsFormProps) {
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<BusinessSettingsInput, unknown, z.output<typeof businessSettingsSchema>>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues,
    disabled: readOnly,
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setFeedback(null);
    const values = form.getValues();
    startTransition(async () => {
      const result = await updateBusinessSettingsAction(values);
      if (result.ok) {
        form.reset(values);
        setFeedback({ tone: "success", message: result.message ?? "Guardado." });
      } else {
        const message = applyServerErrors(result, form.setError);
        if (message) setFeedback({ tone: "danger", message });
      }
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {readOnly && <Alert tone="info">Só os administradores podem alterar os dados da empresa.</Alert>}
          {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome da empresa" error={errors.name?.message}>
              <Input autoComplete="organization" {...form.register("name")} />
            </FormField>
            <FormField label="NIF" optional error={errors.taxId?.message}>
              <Input inputMode="numeric" maxLength={9} {...form.register("taxId")} />
            </FormField>
            <FormField label="Email de contacto" optional error={errors.email?.message}>
              <Input type="email" inputMode="email" {...form.register("email")} />
            </FormField>
            <FormField label="Telefone" optional error={errors.phone?.message}>
              <Input type="tel" inputMode="tel" {...form.register("phone")} />
            </FormField>
          </div>

          <FormField label="Morada" optional error={errors.addressLine?.message}>
            <Input autoComplete="street-address" {...form.register("addressLine")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Código postal" optional error={errors.postalCode?.message}>
              <Input autoComplete="postal-code" placeholder="0000-000" {...form.register("postalCode")} />
            </FormField>
            <FormField label="Localidade" optional error={errors.city?.message} className="sm:col-span-2">
              <Input autoComplete="address-level2" {...form.register("city")} />
            </FormField>
          </div>

          <FormField
            label="Fuso horário"
            error={errors.timezone?.message}
            hint="Usado para calcular as tarefas de hoje e apresentar as horas."
          >
            <Select {...form.register("timezone")}>
              {TIMEZONES.map((timezone) => (
                <option key={timezone.value} value={timezone.value}>
                  {timezone.label}
                </option>
              ))}
            </Select>
          </FormField>
        </CardContent>
        {!readOnly && (
          <CardFooter>
            <Button type="submit" loading={isPending} disabled={!isDirty}>
              Guardar alterações
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
