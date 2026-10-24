"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { failure, GENERIC_ERROR, parseInput, success, type ActionResult } from "@/lib/action-result";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_BUSINESS_COOKIE } from "./active-business";
import { requireBusiness, requireSession } from "./queries";
import { canInvite, canManageBusiness, canManageOperations } from "./roles";
import {
  businessSettingsSchema,
  createBusinessSchema,
  idSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  type BusinessSettingsInput,
  type CreateBusinessInput,
  type InviteMemberInput,
} from "./schemas";

const NO_PERMISSION = "Não tem permissão para esta ação.";

async function setActiveBusinessCookie(businessId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function createBusinessAction(input: CreateBusinessInput): Promise<ActionResult> {
  await requireSession();
  const parsed = parseInput(createBusinessSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data: businessId, error } = await supabase.rpc("create_business", { p_name: parsed.data.name });
  if (error || !businessId) {
    console.error("create_business failed", error);
    return failure(GENERIC_ERROR);
  }

  await setActiveBusinessCookie(businessId);
  redirect("/dashboard");
}

export async function switchBusinessAction(businessId: string): Promise<ActionResult> {
  const context = await requireSession();
  const parsedId = idSchema.safeParse(businessId);
  if (!parsedId.success || !context.memberships.some((m) => m.business.id === parsedId.data)) {
    return failure(NO_PERMISSION);
  }

  const supabase = await createClient();
  await supabase.from("profiles").update({ last_business_id: parsedId.data }).eq("id", context.user.id);
  await setActiveBusinessCookie(parsedId.data);
  redirect("/dashboard");
}

export async function updateBusinessSettingsAction(input: BusinessSettingsInput): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageBusiness(role)) return failure(NO_PERMISSION);

  const parsed = parseInput(businessSettingsSchema, input);
  if (!parsed.ok) return parsed;
  const values = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      name: values.name,
      tax_id: values.taxId,
      email: values.email,
      phone: values.phone,
      address_line: values.addressLine,
      postal_code: values.postalCode,
      city: values.city,
      timezone: values.timezone,
      payment_instructions: values.paymentInstructions,
    })
    .eq("id", business.id);

  if (error) {
    console.error("update business failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/", "layout");
  return success(undefined, "Dados da empresa guardados.");
}

export async function inviteMemberAction(input: InviteMemberInput): Promise<ActionResult<{ link: string }>> {
  const { business, role, user } = await requireBusiness();
  const parsed = parseInput(inviteMemberSchema, input);
  if (!parsed.ok) return parsed;
  if (!canInvite(role, parsed.data.role)) return failure(NO_PERMISSION);
  if (parsed.data.email === user.email.toLowerCase()) {
    return failure("Já faz parte desta empresa.", { email: ["Este é o seu próprio email."] });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({ business_id: business.id, email: parsed.data.email, role: parsed.data.role, invited_by: user.id })
    .select("token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return failure("Já existe um convite pendente para este email.", {
        email: ["Já existe um convite pendente para este email."],
      });
    }
    console.error("create invitation failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/definicoes/equipa");
  return success(
    { link: siteUrl(`/convite/${data.token}`) },
    "Convite criado. Partilhe o link com a pessoa convidada.",
  );
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageOperations(role)) return failure(NO_PERMISSION);
  const parsedId = idSchema.safeParse(invitationId);
  if (!parsedId.success) return failure(NO_PERMISSION);

  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .eq("business_id", business.id);

  if (error) {
    console.error("revoke invitation failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/definicoes/equipa");
  return success(undefined, "Convite cancelado.");
}

export async function updateMemberRoleAction(input: unknown): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageBusiness(role)) return failure(NO_PERMISSION);
  const parsed = parseInput(updateMemberRoleSchema, input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.membershipId)
    .eq("business_id", business.id);

  if (error) {
    if (error.message.includes("at least one active admin")) {
      return failure("A empresa precisa de pelo menos um administrador.");
    }
    console.error("update member role failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/definicoes/equipa");
  return success(undefined, "Função atualizada.");
}

export async function removeMemberAction(membershipId: string): Promise<ActionResult> {
  const { business, role } = await requireBusiness();
  if (!canManageBusiness(role)) return failure(NO_PERMISSION);
  const parsedId = idSchema.safeParse(membershipId);
  if (!parsedId.success) return failure(NO_PERMISSION);

  const supabase = await createClient();
  const { error } = await supabase.from("memberships").delete().eq("id", parsedId.data).eq("business_id", business.id);

  if (error) {
    if (error.message.includes("at least one active admin")) {
      return failure("A empresa precisa de pelo menos um administrador.");
    }
    console.error("remove member failed", error);
    return failure(GENERIC_ERROR);
  }

  revalidatePath("/definicoes/equipa");
  return success(undefined, "Membro removido.");
}

export async function acceptInvitationAction(token: string): Promise<ActionResult> {
  await requireSession();
  const parsedToken = idSchema.safeParse(token);
  if (!parsedToken.success) return failure("Este convite não é válido.");

  const supabase = await createClient();
  const { data: businessId, error } = await supabase.rpc("accept_invitation", { p_token: parsedToken.data });

  if (error || !businessId) {
    if (error?.message.includes("invitation_email_mismatch")) {
      return failure("Este convite foi enviado para outro email. Entre com a conta desse email para o aceitar.");
    }
    if (error?.message.includes("invitation_invalid")) {
      return failure("Este convite expirou, foi cancelado ou já foi utilizado.");
    }
    console.error("accept invitation failed", error);
    return failure(GENERIC_ERROR);
  }

  await setActiveBusinessCookie(businessId);
  redirect("/dashboard");
}
