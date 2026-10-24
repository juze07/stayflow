"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/lib/forms";
import { ISSUE_CATEGORIES, ISSUE_CATEGORY_LABELS } from "@/modules/maintenance/constants";
import { reportIssueAction } from "../actions";
import { reportIssueSchema, type ReportIssueInput } from "../schemas";

const EMPTY: ReportIssueInput = { title: "", description: "", category: "other" };

export function ReportIssueForm({ stayId }: { stayId: string }) {
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ReportIssueInput>({ resolver: zodResolver(reportIssueSchema), defaultValues: EMPTY });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await reportIssueAction(stayId, values);
      const message = applyServerErrors(result, form.setError);
      if (message) setFeedback({ tone: "danger", message });
      else if (result.ok) {
        form.reset(EMPTY);
        setFeedback({ tone: "success", message: result.message ?? "Problema enviado." });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}
      <FormField label="O que se passa?" error={errors.title?.message}>
        <Input placeholder="Ex.: Não há água quente" {...form.register("title")} />
      </FormField>
      <FormField label="Tipo" error={errors.category?.message}>
        <Select {...form.register("category")}>
          {ISSUE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {ISSUE_CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Detalhes" optional error={errors.description?.message}>
        <Textarea rows={3} placeholder="Onde é, desde quando, o que já tentou..." {...form.register("description")} />
      </FormField>
      <Button type="submit" loading={isPending} className="w-full sm:w-auto">
        Enviar à empresa
      </Button>
    </form>
  );
}
