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
import { createPaymentAction, updatePaymentAction } from "../actions";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "../constants";
import { paymentSchema, type PaymentInput, type PaymentValues } from "../schemas";

type StayOption = { id: string; name: string; propertyId: string };

type PaymentFormProps = {
  paymentId?: string;
  defaultValues: PaymentInput;
  properties: { id: string; name: string }[];
  stays: StayOption[];
  today: string;
  cancelHref: string;
};

export function PaymentForm({ paymentId, defaultValues, properties, stays, today, cancelHref }: PaymentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PaymentInput, unknown, PaymentValues>({ resolver: zodResolver(paymentSchema), defaultValues });
  const { errors } = form.formState;
  const [stayId, paid] = useWatch({ control: form.control, name: ["stayId", "paid"] });
  const stay = stays.find((s) => s.id === stayId);

  const onSubmit = form.handleSubmit(() => {
    setError(null);
    const values = form.getValues();
    startTransition(async () => {
      const result = paymentId ? await updatePaymentAction(paymentId, values) : await createPaymentAction(values);
      const message = applyServerErrors(result, form.setError);
      if (message) setError(message);
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <FormField
            label="Descrição"
            error={errors.description?.message}
            hint="Ex.: Renda de novembro, reserva Airbnb."
          >
            <Input autoFocus={!paymentId} {...form.register("description")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Valor (€)" error={errors.amount?.message}>
              <Input inputMode="decimal" placeholder="0,00" {...form.register("amount")} />
            </FormField>
            <FormField label="Vencimento" error={errors.dueOn?.message}>
              <Input type="date" {...form.register("dueOn")} />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Estadia"
              optional
              error={errors.stayId?.message}
              hint="Pagamentos de uma estadia aparecem no portal do inquilino."
            >
              <Select
                {...form.register("stayId", {
                  onChange: (event) => {
                    const chosen = stays.find((s) => s.id === event.target.value);
                    if (chosen) form.setValue("propertyId", chosen.propertyId);
                  },
                })}
              >
                <option value="">Sem estadia (ex.: plataforma)</option>
                {stays.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Propriedade"
              error={errors.propertyId?.message}
              hint={stay ? "A propriedade da estadia escolhida." : undefined}
            >
              <Select {...form.register("propertyId")}>
                <option value="">Escolha a propriedade</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 accent-[var(--color-primary)]"
              {...form.register("paid", {
                onChange: (event) => {
                  if (event.target.checked && !form.getValues("paidOn")) form.setValue("paidOn", today);
                },
              })}
            />
            Já foi recebido
          </label>

          {paid && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Recebido em" error={errors.paidOn?.message}>
                <Input type="date" max={today} {...form.register("paidOn")} />
              </FormField>
              <FormField label="Método" optional error={errors.method?.message}>
                <Select {...form.register("method")}>
                  <option value="">Não indicado</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          )}

          <FormField label="Notas internas" optional error={errors.notes?.message}>
            <Textarea rows={3} {...form.register("notes")} />
          </FormField>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" asChild>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button type="submit" loading={isPending}>
            {paymentId ? "Guardar alterações" : "Registar pagamento"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
