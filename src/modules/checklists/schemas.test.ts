import { describe, expect, it } from "vitest";
import { checklistTemplateSchema } from "./schemas";

describe("checklistTemplateSchema", () => {
  it("aceita uma lista válida e limpa os espaços", () => {
    const parsed = checklistTemplateSchema.parse({
      kind: "cleaning",
      name: " Limpeza ",
      items: [{ label: " Cozinha ", required: true }],
    });
    expect(parsed.name).toBe("Limpeza");
    expect(parsed.items[0].label).toBe("Cozinha");
  });

  it("exige pelo menos um item e itens preenchidos", () => {
    expect(checklistTemplateSchema.safeParse({ kind: "cleaning", name: "X", items: [] }).success).toBe(false);
    expect(
      checklistTemplateSchema.safeParse({ kind: "cleaning", name: "X", items: [{ label: "  ", required: true }] })
        .success,
    ).toBe(false);
  });

  it("só aceita os tipos limpeza e inspeção", () => {
    expect(
      checklistTemplateSchema.safeParse({ kind: "other", name: "X", items: [{ label: "a", required: true }] }).success,
    ).toBe(false);
  });
});
