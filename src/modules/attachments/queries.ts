import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ATTACHMENT_PARENTS, ATTACHMENTS_BUCKET, type AttachmentParent } from "./constants";

export type AttachmentItem = {
  id: string;
  kind: string;
  fileName: string | null;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  createdBy: string | null;
  /** Endereço temporário (1 hora) para ver ou descarregar o ficheiro privado. */
  url: string | null;
};

const SIGNED_URL_SECONDS = 60 * 60;

export async function listAttachments(businessId: string, parent: AttachmentParent): Promise<AttachmentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .select("id, kind, file_name, mime_type, size_bytes, created_at, created_by, storage_path")
    .eq("business_id", businessId)
    .eq(ATTACHMENT_PARENTS[parent.type].column, parent.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data?.length) return [];

  const { data: signed, error: signError } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrls(
    data.map((row) => row.storage_path),
    SIGNED_URL_SECONDS,
  );
  if (signError) console.error("sign attachment urls failed", signError);
  const urls = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]));

  return data.map((row) => ({
    id: row.id,
    kind: row.kind,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    createdBy: row.created_by,
    url: urls.get(row.storage_path) || null,
  }));
}
