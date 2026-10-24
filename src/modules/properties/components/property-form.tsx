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
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/lib/forms";
import { createPropertyAction, updatePropertyAction } from "../actions";
import { propertySchema, type PropertyInput, type PropertyValues } from "../schemas";

type PropertyFormProps = {
  /** Sem id, o formulário cria uma propriedade nova. */
  propertyId?: string;
  defaultValues?: PropertyInput;
  cancelHref: string;
};

const EMPTY: PropertyInput = {
  name: "",
  addressLine: "",
  postalCode: "",
  city: "",
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  accessInstructions: "",
  internalNotes: "",
};

export function PropertyForm({ propertyId, defaultValues = EMPTY, cancelHref }: PropertyFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PropertyInput, unknown, PropertyValues>({
    resolver: zodResolver(propertySchema),
    defaultValues,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setError(null);
    const values = form.getValues();
    startTransition(async () => {
      // Em caso de sucesso, a ação redireciona para a página da propriedade.
      const result = propertyId ? await updatePropertyAction(propertyId, values) : await createPropertyAction(values);
      const message = applyServerErrors(result, form.setError);
      if (message) setError(message);
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <FormField label="Nome" error={errors.name?.message} hint="Como a equipa conhece a casa, ex.: T2 Alfama.">
            <Input autoFocus={!propertyId} {...form.register("name")} />
          </FormField>

          <FormField label="Morada" error={errors.addressLine?.message}>
            <Input autoComplete="street-address" {...form.register("addressLine")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Código postal" error={errors.postalCode?.message}>
              <Input autoComplete="postal-code" placeholder="0000-000" {...form.register("postalCode")} />
            </FormField>
            <FormField label="Localidade" error={errors.city?.message} className="sm:col-span-2">
              <Input autoComplete="address-level2" {...form.register("city")} />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Quartos" error={errors.bedrooms?.message}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                {...form.register("bedrooms", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Casas de banho" error={errors.bathrooms?.message}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                {...form.register("bathrooms", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Hóspedes (máx.)" error={errors.maxGuests?.message}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={500}
                {...form.register("maxGuests", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField
            label="Instruções de acesso"
            optional
            error={errors.accessInstructions?.message}
            hint="Visíveis para toda a equipa: chaves, códigos, estacionamento."
          >
            <Textarea rows={3} {...form.register("accessInstructions")} />
          </FormField>

          <FormField
            label="Notas internas"
            optional
            error={errors.internalNotes?.message}
            hint="Mostradas só a administradores e gestores, ex.: contactos do proprietário."
          >
            <Textarea rows={3} {...form.register("internalNotes")} />
          </FormField>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" asChild>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button type="submit" loading={isPending}>
            {propertyId ? "Guardar alterações" : "Criar propriedade"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
