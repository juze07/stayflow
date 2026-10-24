import { describe, expect, it } from "vitest";
import { stayStatus } from "./constants";
import { staySchema } from "./schemas";

const valid = {
  propertyId: "0b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b",
  guestName: " Ana Silva ",
  guestEmail: " Ana@Example.COM ",
  guestPhone: "",
  startsOn: "2026-11-01",
  endsOn: "2026-11-05",
  notes: "",
};

describe("staySchema", () => {
  it("normaliza o email e os campos opcionais", () => {
    const parsed = staySchema.parse(valid);
    expect(parsed.guestName).toBe("Ana Silva");
    expect(parsed.guestEmail).toBe("ana@example.com");
    expect(parsed.guestPhone).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("aceita arrendamentos sem data de fim", () => {
    expect(staySchema.parse({ ...valid, endsOn: "" }).endsOn).toBeNull();
  });

  it("recusa saída antes da entrada, email inválido e propriedade em falta", () => {
    expect(staySchema.safeParse({ ...valid, endsOn: "2026-10-31" }).success).toBe(false);
    expect(staySchema.safeParse({ ...valid, guestEmail: "ana" }).success).toBe(false);
    expect(staySchema.safeParse({ ...valid, propertyId: "" }).success).toBe(false);
  });
});

describe("stayStatus", () => {
  const stay = { startsOn: "2026-11-01", endsOn: "2026-11-05", cancelledAt: null };

  it("calcula o estado pelas datas (saída inclusiva)", () => {
    expect(stayStatus(stay, "2026-10-31")).toBe("upcoming");
    expect(stayStatus(stay, "2026-11-01")).toBe("current");
    expect(stayStatus(stay, "2026-11-05")).toBe("current");
    expect(stayStatus(stay, "2026-11-06")).toBe("finished");
  });

  it("sem data de fim nunca termina; cancelada tem prioridade", () => {
    expect(stayStatus({ ...stay, endsOn: null }, "2030-01-01")).toBe("current");
    expect(stayStatus({ ...stay, cancelledAt: "2026-10-01T10:00:00Z" }, "2026-11-02")).toBe("cancelled");
  });
});
