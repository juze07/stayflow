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
import { createStayAction, updateStayAction } from "../actions";
import { staySchema, type StayInput, type StayValues } from "../schemas";

type StayFormProps = {
  stayId?: string;
  defaultValues: StayInput;
  properties: { id: string; name: string }[];
  cancelHref: string;
};

export function StayForm({ stayId, defaultValues, properties, cancelHref }: StayFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<StayInput, unknown, StayValues>({ resolver: zodResolver(staySchema), defaultValues });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setError(null);
    const values = form.getValues();
    startTransition(async () => {
      // Em caso de sucesso, a ação redireciona para a página da estadia.
      const result = stayId ? await updateStayAction(stayId, values) : await createStayAction(values);
      const message = applyServerErrors(result, form.setError);
      if (message) setError(message);
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <FormField label="Propriedade" error={errors.propertyId?.message}>
            <Select {...form.register("propertyId")}>
              <option value="">Escolha a propriedade</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome do inquilino" error={errors.guestName?.message}>
              <Input autoComplete="off" {...form.register("guestName")} />
            </FormField>
            <FormField label="Telefone" optional error={errors.guestPhone?.message}>
              <Input type="tel" autoComplete="off" {...form.register("guestPhone")} />
            </FormField>
          </div>

          <FormField
            label="Email do inquilino"
            error={errors.guestEmail?.message}
            hint="Só a conta com este email pode usar o link de acesso ao portal."
          >
            <Input type="email" autoComplete="off" {...form.register("guestEmail")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Entrada" error={errors.startsOn?.message}>
              <Input type="date" {...form.register("startsOn")} />
            </FormField>
            <FormField
              label="Saída"
              optional
              error={errors.endsOn?.message}
              hint="Deixe vazio num arrendamento sem data de fim."
            >
              <Input type="date" {...form.register("endsOn")} />
            </FormField>
          </div>

          <FormField
            label="Notas internas"
            optional
            error={errors.notes?.message}
            hint="Não são visíveis para o inquilino."
          >
            <Textarea rows={3} {...form.register("notes")} />
          </FormField>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" asChild>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button type="submit" loading={isPending}>
            {stayId ? "Guardar alterações" : "Registar estadia"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
