import { describe, expect, it } from "vitest";
import { buildHref, getEnumParam, getPage, getParam, pageRange, toIlikePattern } from "./search-params";

describe("getParam / getEnumParam", () => {
  it("lê o primeiro valor e ignora vazios", () => {
    expect(getParam({ q: ["  casa ", "outra"] }, "q")).toBe("casa");
    expect(getParam({ q: "   " }, "q")).toBeUndefined();
    expect(getParam({}, "q")).toBeUndefined();
  });

  it("só aceita valores da lista", () => {
    expect(getEnumParam({ estado: "completed" }, "estado", ["pending", "completed"])).toBe("completed");
    expect(getEnumParam({ estado: "hack" }, "estado", ["pending", "completed"])).toBeUndefined();
  });
});

describe("paginação", () => {
  it("lê a página com limites", () => {
    expect(getPage({ pagina: "3" })).toBe(3);
    expect(getPage({ pagina: "0" })).toBe(1);
    expect(getPage({ pagina: "-2" })).toBe(1);
    expect(getPage({ pagina: "abc" })).toBe(1);
    expect(getPage({ pagina: "2.5" })).toBe(1);
  });

  it("calcula o intervalo de linhas", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 19 });
    expect(pageRange(3, 10)).toEqual({ from: 20, to: 29 });
  });
});

describe("toIlikePattern", () => {
  it("envolve o texto em curingas", () => {
    expect(toIlikePattern("Alfama")).toBe("%Alfama%");
  });

  it("remove caracteres que alterariam o filtro do PostgREST", () => {
    expect(toIlikePattern("a,b),name.eq.(x%_*\\")).toBe("%a b name.eq. x%");
  });

  it("devolve null para pesquisas vazias", () => {
    expect(toIlikePattern("  ,() ")).toBeNull();
    expect(toIlikePattern(undefined)).toBeNull();
  });
});

describe("buildHref", () => {
  it("omite parâmetros vazios", () => {
    expect(buildHref("/tarefas", { q: "limpeza", estado: undefined, pagina: 2, x: "" })).toBe(
      "/tarefas?q=limpeza&pagina=2",
    );
    expect(buildHref("/tarefas", {})).toBe("/tarefas");
  });
});
