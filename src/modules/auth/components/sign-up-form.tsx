"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";
import { signUpAction } from "../actions";
import { PASSWORD_MIN_LENGTH, signUpSchema, type SignUpInput } from "../schemas";

export function SignUpForm() {
  const next = useSearchParams().get("next") ?? undefined;
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", next },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signUpAction({ ...values, next });
      setServerError(applyServerErrors(result, form.setError));
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && <Alert tone="danger">{serverError}</Alert>}

      <FormField label="Nome" error={errors.fullName?.message}>
        <Input autoComplete="name" {...form.register("fullName")} />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
      </FormField>

      <FormField
        label="Palavra-passe"
        error={errors.password?.message}
        hint={`Pelo menos ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.`}
      >
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </FormField>

      <Button type="submit" className="w-full" loading={isPending}>
        Criar conta
      </Button>
    </form>
  );
}
