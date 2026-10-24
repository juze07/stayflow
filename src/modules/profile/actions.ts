"use server";

import { revalidatePath } from "next/cache";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/business/queries";
import { profileSchema, type ProfileInput } from "./schemas";

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const { user } = await requireSession();
  const parsed = parseInput(profileSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.id);

  if (error) {
    console.error("update profile failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/", "layout");
  return success(undefined, "Perfil guardado.");
}
