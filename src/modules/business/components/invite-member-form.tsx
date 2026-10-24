"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { applyServerErrors } from "@/lib/forms";
import { inviteMemberAction } from "../actions";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "../roles";
import { inviteMemberSchema, type InviteMemberInput } from "../schemas";

export function InviteMemberForm({ roles }: { roles: Role[] }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ email: string; link: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "staff" },
  });
  const { errors } = form.formState;
  const selectedRole = useWatch({ control: form.control, name: "role" });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setInvite(null);
    startTransition(async () => {
      const result = await inviteMemberAction(values);
      if (result.ok) {
        setInvite({ email: values.email, link: result.data.link });
        form.reset({ email: "", role: values.role });
      } else {
        setServerError(applyServerErrors(result, form.setError));
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convidar pessoa</CardTitle>
        <CardDescription>
          É criado um link de convite para partilhar (por exemplo, por WhatsApp ou email). A pessoa entra ou cria conta
          com o email indicado e fica associada à empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && <Alert tone="danger">{serverError}</Alert>}
        {invite && (
          <Alert tone="success">
            <p>Convite criado para {invite.email}. Partilhe este link (válido durante 7 dias):</p>
            <p className="font-mono text-xs break-all text-foreground">{invite.link}</p>
            <CopyButton value={invite.link} />
          </Alert>
        )}
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-start" noValidate>
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" inputMode="email" autoComplete="off" {...form.register("email")} />
          </FormField>
          <FormField label="Função" error={errors.role?.message}>
            <Select {...form.register("role")}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </FormField>
          <Button type="submit" loading={isPending} className="sm:mt-6">
            Criar convite
          </Button>
        </form>
        {selectedRole && <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[selectedRole]}</p>}
      </CardContent>
    </Card>
  );
}
