import { z } from "@/lib/zod";
import { ATTACHMENT_MIME_TYPES, ATTACHMENT_PARENT_TYPES, MAX_ATTACHMENT_BYTES } from "./constants";

export const registerAttachmentSchema = z.object({
  parentType: z.enum(ATTACHMENT_PARENT_TYPES),
  parentId: z.uuid(),
  // {empresa}/{pasta}/{id}/{uuid}.{extensão}; a pasta é confirmada na ação e na base de dados.
  storagePath: z
    .string()
    .max(500)
    .regex(/^[0-9a-f-]{36}\/[a-z]+\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|heic|pdf)$/),
  fileName: z
    .string()
    .trim()
    .max(255)
    .transform((value) => (value === "" ? null : value)),
  mimeType: z.enum(ATTACHMENT_MIME_TYPES, { message: "Formato não suportado. Use JPG, PNG, WEBP, HEIC ou PDF." }),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_BYTES, { message: "O ficheiro tem mais de 10 MB." }),
});
export type RegisterAttachmentInput = z.input<typeof registerAttachmentSchema>;
