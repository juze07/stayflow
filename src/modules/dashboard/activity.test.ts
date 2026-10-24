import { describe, expect, it } from "vitest";
import { activityHref, describeActivity } from "./activity";

const base = { entityId: "e1", summary: "Limpeza T2", metadata: {} };

describe("describeActivity", () => {
  it("descreve criações, arquivos e mudanças de estado", () => {
    expect(describeActivity({ ...base, entityType: "task", action: "created" })).toBe('criou a tarefa "Limpeza T2"');
    expect(describeActivity({ ...base, entityType: "property", action: "archived", summary: "T2" })).toBe(
      'arquivou a propriedade "T2"',
    );
    expect(
      describeActivity({ ...base, entityType: "task", action: "status_changed", metadata: { to: "completed" } }),
    ).toBe('concluiu a tarefa "Limpeza T2"');
    expect(
      describeActivity({ ...base, entityType: "task", action: "status_changed", metadata: { to: "pending" } }),
    ).toBe('mudou a tarefa "Limpeza T2" para "Por iniciar"');
  });

  it("concorda o artigo com o tipo de registo", () => {
    expect(
      describeActivity({ ...base, entityType: "maintenance_issue", action: "status_changed", summary: "Torneira" }),
    ).toBe('atualizou o estado do problema "Torneira"');
    expect(describeActivity({ ...base, entityType: "inspection", action: "status_changed", summary: "" })).toBe(
      "atualizou o estado da inspeção",
    );
  });

  it("só liga a páginas que existem", () => {
    expect(activityHref({ ...base, entityType: "task", action: "created" })).toBe("/tarefas/e1");
    expect(activityHref({ ...base, entityType: "task", action: "deleted" })).toBeNull();
    expect(activityHref({ ...base, entityType: "maintenance_issue", action: "created" })).toBe("/manutencao/e1");
    expect(activityHref({ ...base, entityType: "expense", action: "created" })).toBeNull();
  });
});
