import { describe, expect, it } from "vitest";
import { isAuthRoute, isPublicRoute } from "./routes";

describe("rotas", () => {
  it("identifica páginas de autenticação", () => {
    expect(isAuthRoute("/entrar")).toBe(true);
    expect(isAuthRoute("/entrarx")).toBe(false);
    expect(isAuthRoute("/dashboard")).toBe(false);
  });

  it("só deixa públicas as páginas de autenticação e a confirmação de email", () => {
    expect(isPublicRoute("/auth/confirm")).toBe(true);
    expect(isPublicRoute("/redefinir-palavra-passe")).toBe(false);
    expect(isPublicRoute("/convite/123")).toBe(false);
    expect(isPublicRoute("/definicoes")).toBe(false);
  });
});
