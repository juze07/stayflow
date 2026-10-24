"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";
import { resetPasswordAction } from "../actions";
import { PASSWORD_MIN_LENGTH, resetPasswordSchema, type ResetPasswordInput } from "../schemas";

export function ResetPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(values);
      setServerError(applyServerErrors(result, form.setError));
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && <Alert tone="danger">{serverError}</Alert>}

      <FormField
        label="Nova palavra-passe"
        error={errors.password?.message}
        hint={`Pelo menos ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.`}
      >
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </FormField>

      <FormField label="Confirmar palavra-passe" error={errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
      </FormField>

      <Button type="submit" className="w-full" loading={isPending}>
        Guardar palavra-passe
      </Button>
    </form>
  );
}
