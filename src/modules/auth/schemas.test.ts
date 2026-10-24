import { describe, expect, it } from "vitest";
import { passwordSchema, resetPasswordSchema, signUpSchema } from "./schemas";

describe("passwordSchema", () => {
  it("exige 8 caracteres com letras e números", () => {
    expect(passwordSchema.safeParse("abc12345").success).toBe(true);
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("ab1").success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("normaliza o email", () => {
    const parsed = signUpSchema.parse({ fullName: "Ana", email: " ANA@Example.com ", password: "abc12345" });
    expect(parsed.email).toBe("ana@example.com");
  });
});

describe("resetPasswordSchema", () => {
  it("exige confirmação igual", () => {
    const result = resetPasswordSchema.safeParse({ password: "abc12345", confirmPassword: "abc12346" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});
