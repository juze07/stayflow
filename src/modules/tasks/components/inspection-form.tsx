"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveInspectionAction } from "../actions";
import { INSPECTION_RESULTS, INSPECTION_RESULT_LABELS, type InspectionResult } from "../constants";

type InspectionFormProps = {
  taskId: string;
  result: InspectionResult | null;
  observations: string | null;
};

/** Resultado e observações da inspeção. Reservas e reprovações exigem observações. */
export function InspectionForm({ taskId, result, observations }: InspectionFormProps) {
  const [values, setValues] = useState({ result: result ?? "", observations: observations ?? "" });
  const [errors, setErrors] = useState<{ result?: string; observations?: string }>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setFeedback(null);
        setErrors({});
        startTransition(async () => {
          const response = await saveInspectionAction({
            taskId,
            result: values.result as InspectionResult,
            observations: values.observations,
          });
          if (response.ok) {
            setFeedback({ tone: "success", message: response.message ?? "Guardado." });
          } else if (response.fieldErrors) {
            setErrors({
              result: response.fieldErrors.result?.[0],
              observations: response.fieldErrors.observations?.[0],
            });
          } else {
            setFeedback({ tone: "danger", message: response.error });
          }
        });
      }}
    >
      <FormField label="Resultado" error={errors.result}>
        <Select value={values.result} onChange={(event) => setValues({ ...values, result: event.target.value })}>
          <option value="" disabled>
            Escolha o resultado
          </option>
          {INSPECTION_RESULTS.map((option) => (
            <option key={option} value={option}>
              {INSPECTION_RESULT_LABELS[option]}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        label="Observações"
        optional={values.result === "approved"}
        error={errors.observations}
        hint="Obrigatórias quando há reservas ou a inspeção é reprovada."
      >
        <Textarea
          rows={3}
          maxLength={4000}
          value={values.observations}
          onChange={(event) => setValues({ ...values, observations: event.target.value })}
        />
      </FormField>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={isPending}>
          Guardar resultado
        </Button>
        {feedback && (
          <Alert tone={feedback.tone} className="flex-1 py-2">
            {feedback.message}
          </Alert>
        )}
      </div>
    </form>
  );
}
