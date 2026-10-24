import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("aceita caminhos internos", () => {
    expect(safeRedirectPath("/convite/abc?x=1")).toBe("/convite/abc?x=1");
  });

  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "/ok\r\nSet-Cookie:x"])(
    "rejeita %s",
    (value) => {
      expect(safeRedirectPath(value)).toBe("/dashboard");
    },
  );
});
