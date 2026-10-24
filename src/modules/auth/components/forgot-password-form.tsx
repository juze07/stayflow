"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";
import { forgotPasswordAction } from "../actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(values);
      if (result.ok) {
        setSuccessMessage(result.message ?? null);
        form.reset();
      } else {
        setServerError(applyServerErrors(result, form.setError));
      }
    });
  });

  if (successMessage) return <Alert tone="success">{successMessage}</Alert>;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && <Alert tone="danger">{serverError}</Alert>}

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
      </FormField>

      <Button type="submit" className="w-full" loading={isPending}>
        Enviar link de recuperação
      </Button>
    </form>
  );
}
