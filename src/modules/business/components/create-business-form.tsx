"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";
import { createBusinessAction } from "../actions";
import { createBusinessSchema, type CreateBusinessInput } from "../schemas";

export function CreateBusinessForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createBusinessAction(values);
      setServerError(applyServerErrors(result, form.setError));
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && <Alert tone="danger">{serverError}</Alert>}
      <FormField
        label="Nome da empresa"
        error={form.formState.errors.name?.message}
        hint="Pode alterá-lo mais tarde nas definições."
      >
        <Input autoComplete="organization" placeholder="Ex.: Lisboa Stays" {...form.register("name")} />
      </FormField>
      <Button type="submit" className="w-full" loading={isPending}>
        Criar empresa
      </Button>
    </form>
  );
}
