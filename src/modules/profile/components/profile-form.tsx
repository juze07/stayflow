"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";
import type { z } from "@/lib/zod";
import { updateProfileAction } from "../actions";
import { profileSchema, type ProfileInput } from "../schemas";

type ProfileFormProps = { email: string; defaultValues: ProfileInput };

export function ProfileForm({ email, defaultValues }: ProfileFormProps) {
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProfileInput, unknown, z.output<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setFeedback(null);
    const values = form.getValues();
    startTransition(async () => {
      const result = await updateProfileAction(values);
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
          {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
          <FormField label="Email" hint="O email é usado para entrar na aplicação.">
            <Input value={email} disabled readOnly />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome" error={errors.fullName?.message}>
              <Input autoComplete="name" {...form.register("fullName")} />
            </FormField>
            <FormField label="Telefone" optional error={errors.phone?.message}>
              <Input type="tel" autoComplete="tel" inputMode="tel" {...form.register("phone")} />
            </FormField>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={isPending} disabled={!isDirty}>
            Guardar alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
