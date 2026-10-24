import { describe, expect, it } from "vitest";
import { z } from "@/lib/zod";
import { parseInput } from "./action-result";

describe("parseInput", () => {
  const schema = z.object({ name: z.string().min(2, { message: "Nome curto" }) });

  it("devolve os dados validados", () => {
    expect(parseInput(schema, { name: "Ana" })).toEqual({ ok: true, data: { name: "Ana" } });
  });

  it("devolve erros por campo", () => {
    const result = parseInput(schema, { name: "A" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.name).toEqual(["Nome curto"]);
  });
});
