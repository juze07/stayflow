import { describe, expect, it } from "vitest";
import { reportIssueSchema, reportPaymentSchema } from "./schemas";

describe("reportIssueSchema", () => {
  it("aceita um problema com categoria conhecida", () => {
    const parsed = reportIssueSchema.parse({ title: " Sem água quente ", description: "", category: "plumbing" });
    expect(parsed.title).toBe("Sem água quente");
  });

  it("recusa títulos curtos e categorias desconhecidas", () => {
    expect(reportIssueSchema.safeParse({ title: "a", description: "", category: "other" }).success).toBe(false);
    expect(reportIssueSchema.safeParse({ title: "Porta", description: "", category: "x" }).success).toBe(false);
  });
});

describe("reportPaymentSchema", () => {
  it("limita a referência", () => {
    expect(reportPaymentSchema.safeParse({ reference: "" }).success).toBe(true);
    expect(reportPaymentSchema.safeParse({ reference: "x".repeat(201) }).success).toBe(false);
  });
});
