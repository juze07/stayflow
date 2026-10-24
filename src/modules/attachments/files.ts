import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { ATTACHMENTS_BUCKET } from "./constants";

type Client = Awaited<ReturnType<typeof createClient>>;
type ParentColumn = "task_id" | "inspection_id" | "maintenance_issue_id" | "expense_id";

/**
 * Caminhos dos ficheiros anexados a entidades que vão ser apagadas. A base de
 * dados apaga os registos em cascata, mas os ficheiros do Storage têm de ser
 * removidos pela aplicação.
 */
export async function attachmentPaths(
  supabase: Client,
  businessId: string,
  column: ParentColumn,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("business_id", businessId)
    .in(column, ids);
  if (error) {
    console.error("list attachment paths failed", error);
    return [];
  }
  return (data ?? []).map((row) => row.storage_path);
}

/** Remove ficheiros do Storage; uma falha fica registada mas não bloqueia a operação. */
export async function removeStoredFiles(supabase: Client, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).remove(paths);
  if (error) console.error("remove stored files failed", error);
}
