import { describe, expect, it } from "vitest";
import { attachmentFolder } from "./constants";
import { registerAttachmentSchema } from "./schemas";

const business = "0b5a3f0e-7f0e-4d5c-9b1a-1c2d3e4f5a6b";
const task = "1c6b4a1f-8a1f-4e6d-8c2b-2d3e4f5a6b7c";
const file = "2d7c5b2a-9b2a-4f7e-9d3c-3e4f5a6b7c8d";

const valid = {
  parentType: "task",
  parentId: task,
  storagePath: `${business}/tasks/${task}/${file}.jpg`,
  fileName: "cozinha.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 2048,
} as const;

describe("registerAttachmentSchema", () => {
  it("aceita um anexo válido", () => {
    expect(registerAttachmentSchema.parse(valid).fileName).toBe("cozinha.jpg");
    expect(registerAttachmentSchema.parse({ ...valid, fileName: " " }).fileName).toBeNull();
  });

  it("rejeita caminhos fora do formato, formatos e tamanhos não suportados", () => {
    expect(registerAttachmentSchema.safeParse({ ...valid, storagePath: `${business}/../x.jpg` }).success).toBe(false);
    expect(registerAttachmentSchema.safeParse({ ...valid, storagePath: `${valid.storagePath}.exe` }).success).toBe(
      false,
    );
    expect(registerAttachmentSchema.safeParse({ ...valid, mimeType: "image/gif" }).success).toBe(false);
    expect(registerAttachmentSchema.safeParse({ ...valid, sizeBytes: 11 * 1024 * 1024 }).success).toBe(false);
    expect(registerAttachmentSchema.safeParse({ ...valid, parentType: "property" }).success).toBe(false);
  });
});

describe("attachmentFolder", () => {
  it("monta a pasta da entidade dentro da pasta da empresa", () => {
    expect(attachmentFolder(business, { type: "maintenance_issue", id: task })).toBe(
      `${business}/maintenance/${task}/`,
    );
  });
});
