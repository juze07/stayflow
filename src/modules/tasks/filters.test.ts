import { describe, expect, it } from "vitest";
import { parseTaskParams } from "./filters";

const context = {
  userId: "11111111-1111-1111-1111-111111111111",
  timeZone: "Europe/Lisbon",
  now: new Date("2026-10-24T12:00:00Z"),
};

describe("parseTaskParams", () => {
  it("usa valores por defeito sem parâmetros", () => {
    const parsed = parseTaskParams({}, context);
    expect(parsed.view).toBe("lista");
    expect(parsed.page).toBe(1);
    expect(parsed.month).toEqual({ year: 2026, month: 10 });
    expect(parsed.filters.status).toBe("abertas");
  });

  it("no calendário mostra todas as tarefas por defeito", () => {
    expect(parseTaskParams({ vista: "calendario" }, context).filters.status).toBe("todas");
  });

  it("traduz 'eu' e 'ninguem' no filtro de responsável", () => {
    expect(parseTaskParams({ responsavel: "eu" }, context).filters.assigneeId).toBe(context.userId);
    expect(parseTaskParams({ responsavel: "ninguem" }, context).filters.assigneeId).toBe("none");
  });

  it("ignora valores inválidos em vez de os enviar para a base de dados", () => {
    const parsed = parseTaskParams(
      { propriedade: "1; drop table", responsavel: "x", tipo: "festa", estado: "?", de: "2026-02-31", mes: "2026-13" },
      context,
    );
    expect(parsed.filters).toMatchObject({
      propertyId: undefined,
      assigneeId: undefined,
      type: undefined,
      status: "abertas",
      from: undefined,
    });
    expect(parsed.values.responsavel).toBeUndefined();
    expect(parsed.month).toEqual({ year: 2026, month: 10 });
  });

  it("converte o intervalo de datas para o fuso da empresa", () => {
    const parsed = parseTaskParams({ de: "2026-07-01", ate: "2026-07-31" }, context);
    expect(parsed.filters.from?.toISOString()).toBe("2026-06-30T23:00:00.000Z");
    expect(parsed.filters.to?.toISOString()).toBe("2026-07-31T23:00:00.000Z");
  });
});
