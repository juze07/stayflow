/** Anexos guardados no bucket privado `attachments` (limites iguais aos da base de dados). */

export const ATTACHMENTS_BUCKET = "attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_ITEM = 20;

export const ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;
export type AttachmentMimeType = (typeof ATTACHMENT_MIME_TYPES)[number];

const EXTENSIONS: Record<AttachmentMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

export function isAttachmentMimeType(value: string): value is AttachmentMimeType {
  return (ATTACHMENT_MIME_TYPES as readonly string[]).includes(value);
}

export function attachmentExtension(mime: AttachmentMimeType): string {
  return EXTENSIONS[mime];
}

/** Os browsers mostram estes formatos numa <img>; HEIC e PDF abrem à parte. */
export function isPreviewableImage(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

/** Entidades que recebem anexos: pasta no Storage e coluna em `attachments`. */
export const ATTACHMENT_PARENTS = {
  task: { folder: "tasks", column: "task_id" },
  inspection: { folder: "inspections", column: "inspection_id" },
  maintenance_issue: { folder: "maintenance", column: "maintenance_issue_id" },
  expense: { folder: "expenses", column: "expense_id" },
} as const;
export type AttachmentParentType = keyof typeof ATTACHMENT_PARENTS;
export const ATTACHMENT_PARENT_TYPES = Object.keys(ATTACHMENT_PARENTS) as AttachmentParentType[];

export type AttachmentParent = { type: AttachmentParentType; id: string };

/** Pasta de uma entidade no Storage: {empresa}/{pasta}/{id}/ */
export function attachmentFolder(businessId: string, parent: AttachmentParent): string {
  return `${businessId}/${ATTACHMENT_PARENTS[parent.type].folder}/${parent.id}/`;
}
