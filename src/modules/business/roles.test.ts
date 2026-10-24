import { describe, expect, it } from "vitest";
import { canInvite, canManageBusiness, canManageOperations, invitableRoles, isRole } from "./roles";

describe("funções", () => {
  it("valida nomes de funções", () => {
    expect(isRole("manager")).toBe(true);
    expect(isRole("owner")).toBe(false);
  });

  it("só administradores gerem a empresa", () => {
    expect(canManageBusiness("admin")).toBe(true);
    expect(canManageBusiness("manager")).toBe(false);
    expect(canManageBusiness("staff")).toBe(false);
  });

  it("administradores e gestores gerem operações", () => {
    expect(canManageOperations("admin")).toBe(true);
    expect(canManageOperations("manager")).toBe(true);
    expect(canManageOperations("staff")).toBe(false);
  });

  it("gestores não convidam administradores; colaboradores não convidam", () => {
    expect(canInvite("manager", "admin")).toBe(false);
    expect(canInvite("manager", "staff")).toBe(true);
    expect(invitableRoles("admin")).toEqual(["admin", "manager", "staff"]);
    expect(invitableRoles("staff")).toEqual([]);
  });
});
