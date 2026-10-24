"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";
import { signInAction } from "../actions";
import { signInSchema, type SignInInput } from "../schemas";

export function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const linkError = searchParams.get("erro") === "link-invalido";
  const [serverError, setServerError] = useState<string | null>(
    linkError ? "O link expirou ou já foi utilizado. Peça um novo." : null,
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signInAction({ ...values, next });
      setServerError(applyServerErrors(result, form.setError));
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {serverError && <Alert tone="danger">{serverError}</Alert>}

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
      </FormField>

      <FormField label="Palavra-passe" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...form.register("password")} />
      </FormField>

      <div className="flex justify-end">
        <Link href="/recuperar-palavra-passe" className="text-sm font-medium text-primary hover:underline">
          Esqueceu-se da palavra-passe?
        </Link>
      </div>

      <Button type="submit" className="w-full" loading={isPending}>
        Entrar
      </Button>
    </form>
  );
}
