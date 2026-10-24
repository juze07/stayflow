"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/business/queries";
import { idSchema } from "@/modules/business/schemas";
import { reportIssueSchema, reportPaymentSchema, type ReportIssueInput, type ReportPaymentInput } from "./schemas";

export async function acceptStayInvitationAction(token: string): Promise<ActionResult> {
  await requireSession();
  const parsedToken = idSchema.safeParse(token);
  if (!parsedToken.success) return failure("Este link não é válido.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_stay_invitation", { p_token: parsedToken.data });
  if (error) {
    if (error.message.includes("invitation_email_mismatch")) {
      return failure("Este link foi enviado para outro email. Entre com a conta desse email.");
    }
    if (error.message.includes("invitation_invalid")) {
      return failure("Este link já não é válido. Peça um novo à empresa.");
    }
    console.error("accept stay invitation failed", error);
    return failure(GENERIC_ERROR);
  }

  redirect("/inquilino");
}

/** "Já paguei": avisa a empresa, que confirma o recebimento. */
export async function reportPaymentAction(paymentId: string, input: ReportPaymentInput): Promise<ActionResult> {
  await requireSession();
  const id = idSchema.safeParse(paymentId);
  if (!id.success) return failure("Pagamento não encontrado.");
  const parsed = parseInput(reportPaymentSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.rpc("report_stay_payment", {
    p_payment_id: id.data,
    p_reference: parsed.data.reference,
  });
  if (error) {
    if (error.message.includes("payment_not_found")) return failure("Este pagamento já não está por pagar.");
    console.error("report payment failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/inquilino");
  return success(undefined, "Obrigado! A empresa vai confirmar o pagamento.");
}

export async function reportIssueAction(stayId: string, input: ReportIssueInput): Promise<ActionResult> {
  await requireSession();
  const id = idSchema.safeParse(stayId);
  if (!id.success) return failure("Estadia não encontrada.");
  const parsed = parseInput(reportIssueSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.rpc("report_stay_issue", {
    p_stay_id: id.data,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_category: parsed.data.category,
  });
  if (error) {
    if (error.message.includes("too_many_reports")) {
      return failure("Já reportou muitos problemas hoje. Contacte a empresa diretamente.");
    }
    if (error.message.includes("stay_not_found")) return failure("Esta estadia já não está disponível.");
    console.error("report issue failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/inquilino");
  return success(undefined, "Problema enviado. A empresa foi avisada.");
}
