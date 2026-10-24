import { describe, expect, it } from "vitest";
import { isOverdue, nextStatuses } from "./constants";
import { inspectionSchema, taskSchema } from "./schemas";

const valid = {
  propertyId: "0b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b",
  type: "cleaning",
  title: "Limpeza check-out",
  description: "",
  date: "2026-10-25",
  time: "11:00",
  estimatedMinutes: 90,
  assigneeId: "",
  priority: "normal",
  checklistTemplateId: "",
  maintenanceIssueId: "",
} as const;

describe("taskSchema", () => {
  it("aceita uma tarefa válida e normaliza campos opcionais", () => {
    const parsed = taskSchema.parse(valid);
    expect(parsed.assigneeId).toBeNull();
    expect(parsed.description).toBeNull();
    expect(parsed.estimatedMinutes).toBe(90);
  });

  it("aceita a duração por definir (campo vazio)", () => {
    expect(taskSchema.parse({ ...valid, estimatedMinutes: null }).estimatedMinutes).toBeNull();
  });

  it("rejeita datas, horas e tipos inválidos", () => {
    expect(taskSchema.safeParse({ ...valid, date: "2026-02-30" }).success).toBe(false);
    expect(taskSchema.safeParse({ ...valid, time: "25:00" }).success).toBe(false);
    expect(taskSchema.safeParse({ ...valid, type: "party" }).success).toBe(false);
    expect(taskSchema.safeParse({ ...valid, assigneeId: "não-é-uuid" }).success).toBe(false);
    expect(taskSchema.safeParse({ ...valid, estimatedMinutes: 2000 }).success).toBe(false);
  });
});

describe("regras de estado", () => {
  const now = new Date("2026-10-24T12:00:00Z");

  it("marca como atrasadas apenas tarefas por fazer no passado", () => {
    expect(isOverdue({ status: "pending", scheduledAt: "2026-10-24T09:00:00Z" }, now)).toBe(true);
    expect(isOverdue({ status: "in_progress", scheduledAt: "2026-10-24T09:00:00Z" }, now)).toBe(true);
    expect(isOverdue({ status: "completed", scheduledAt: "2026-10-24T09:00:00Z" }, now)).toBe(false);
    expect(isOverdue({ status: "pending", scheduledAt: "2026-10-24T15:00:00Z" }, now)).toBe(false);
  });

  it("oferece mudanças de estado coerentes", () => {
    expect(nextStatuses("pending")).toContain("in_progress");
    expect(nextStatuses("completed")).toEqual(["in_progress"]);
    expect(nextStatuses("cancelled")).toEqual(["pending"]);
  });
});

describe("inspectionSchema", () => {
  const taskId = "0b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b";

  it("aceita uma aprovação sem observações", () => {
    expect(inspectionSchema.safeParse({ taskId, result: "approved", observations: "" }).success).toBe(true);
  });

  it("exige observações quando há reservas ou reprovação", () => {
    const result = inspectionSchema.safeParse({ taskId, result: "failed", observations: "  " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["observations"]);
    expect(inspectionSchema.safeParse({ taskId, result: "approved_with_notes", observations: "Mancha" }).success).toBe(
      true,
    );
  });
});
