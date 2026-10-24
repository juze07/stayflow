import { describe, expect, it } from "vitest";
import { resolveActiveMembership, type MembershipSummary } from "./active-business";

const membership = (id: string): MembershipSummary => ({
  role: "admin",
  business: { id, name: id, timezone: "Europe/Lisbon", locale: "pt-PT", currency: "EUR" },
});

describe("resolveActiveMembership", () => {
  const memberships = [membership("a"), membership("b")];

  it("devolve null sem empresas", () => {
    expect(resolveActiveMembership([], "a")).toBeNull();
  });

  it("usa a empresa do cookie quando o utilizador é membro", () => {
    expect(resolveActiveMembership(memberships, "b", "a")?.business.id).toBe("b");
  });

  it("ignora um cookie de uma empresa de que não é membro", () => {
    expect(resolveActiveMembership(memberships, "intrusa", "b")?.business.id).toBe("b");
  });

  it("usa a primeira empresa quando não há preferência válida", () => {
    expect(resolveActiveMembership(memberships, null, "x")?.business.id).toBe("a");
  });
});
