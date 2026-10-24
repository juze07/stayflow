"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/lib/forms";
import { createTaskAction, updateTaskAction } from "../actions";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_TYPES, TASK_TYPE_LABELS } from "../constants";
import { taskSchema, type TaskInput, type TaskValues } from "../schemas";

type Option = { id: string; name: string };

type TaskFormProps = {
  taskId?: string;
  defaultValues: TaskInput;
  properties: Option[];
  assignees: Option[];
  timeZoneLabel: string;
  cancelHref: string;
};

export function TaskForm({ taskId, defaultValues, properties, assignees, timeZoneLabel, cancelHref }: TaskFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<TaskInput, unknown, TaskValues>({ resolver: zodResolver(taskSchema), defaultValues });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setError(null);
    const values = form.getValues();
    startTransition(async () => {
      // Em caso de sucesso, a ação redireciona para a página da tarefa.
      const result = taskId ? await updateTaskAction(taskId, values) : await createTaskAction(values);
      const message = applyServerErrors(result, form.setError);
      if (message) setError(message);
    });
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Propriedade" error={errors.propertyId?.message}>
              <Select {...form.register("propertyId")}>
                <option value="" disabled>
                  Escolha a propriedade
                </option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Tipo" error={errors.type?.message}>
              <Select {...form.register("type")}>
                {TASK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TASK_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField
            label="Título"
            error={errors.title?.message}
            hint="Ex.: Limpeza de check-out, Trocar lâmpada da sala."
          >
            <Input {...form.register("title")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Data" error={errors.date?.message}>
              <Input type="date" {...form.register("date")} />
            </FormField>
            <FormField label="Hora" error={errors.time?.message} hint={timeZoneLabel}>
              <Input type="time" step={300} {...form.register("time")} />
            </FormField>
            <FormField label="Duração prevista (min)" optional error={errors.estimatedMinutes?.message}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                step={5}
                {...form.register("estimatedMinutes", {
                  setValueAs: (value: string | number | null) =>
                    value === "" || value === null || value === undefined ? null : Number(value),
                })}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Responsável" optional error={errors.assigneeId?.message}>
              <Select {...form.register("assigneeId")}>
                <option value="">Sem responsável</option>
                {assignees.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Prioridade" error={errors.priority?.message}>
              <Select {...form.register("priority")}>
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {TASK_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Descrição" optional error={errors.description?.message}>
            <Textarea rows={3} {...form.register("description")} />
          </FormField>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" asChild>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button type="submit" loading={isPending}>
            {taskId ? "Guardar alterações" : "Criar tarefa"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
