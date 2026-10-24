import { describe, expect, it } from "vitest";
import { nextIssueStatuses } from "./constants";
import { issueFinalCostSchema, issueSchema } from "./schemas";

const valid = {
  propertyId: "0b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b",
  title: "Torneira a pingar",
  description: "",
  category: "plumbing",
  priority: "high",
  assigneeId: "",
  estimatedCost: "45,90",
  sourceInspectionId: "",
} as const;

describe("issueSchema", () => {
  it("converte o custo em euros para cêntimos e normaliza opcionais", () => {
    const parsed = issueSchema.parse(valid);
    expect(parsed.estimatedCost).toBe(4590);
    expect(parsed.assigneeId).toBeNull();
    expect(parsed.description).toBeNull();
  });

  it("aceita o custo por definir e rejeita valores inválidos", () => {
    expect(issueSchema.parse({ ...valid, estimatedCost: "" }).estimatedCost).toBeNull();
    expect(issueSchema.safeParse({ ...valid, estimatedCost: "abc" }).success).toBe(false);
    expect(issueSchema.safeParse({ ...valid, estimatedCost: "-5" }).success).toBe(false);
  });

  it("exige título e categoria válida", () => {
    expect(issueSchema.safeParse({ ...valid, title: " " }).success).toBe(false);
    expect(issueSchema.safeParse({ ...valid, category: "magic" }).success).toBe(false);
  });

  it("valida o custo final", () => {
    expect(issueFinalCostSchema.parse({ issueId: valid.propertyId, finalCost: "1 234,50" }).finalCost).toBe(123450);
  });
});

describe("nextIssueStatuses", () => {
  it("só permite reabrir problemas fechados", () => {
    expect(nextIssueStatuses("resolved")).toEqual(["open"]);
    expect(nextIssueStatuses("open")).toContain("resolved");
  });
});
