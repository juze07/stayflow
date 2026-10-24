import { GENERIC_ERROR } from "@/lib/action-result";

/** Traduz os códigos de erro do Supabase Auth para mensagens compreensíveis. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email ou palavra-passe incorretos.",
  email_not_confirmed: "Ainda não confirmou o seu email. Verifique a sua caixa de correio.",
  user_already_exists: "Já existe uma conta com este email.",
  email_exists: "Já existe uma conta com este email.",
  weak_password: "Palavra-passe demasiado fraca. Use pelo menos 8 caracteres, com letras e números.",
  same_password: "A nova palavra-passe tem de ser diferente da anterior.",
  over_email_send_rate_limit: "Foram enviados demasiados emails. Aguarde alguns minutos e tente novamente.",
  over_request_rate_limit: "Demasiadas tentativas. Aguarde alguns minutos e tente novamente.",
  signup_disabled: "O registo de novas contas está desativado.",
  session_not_found: "A sua sessão expirou. Peça um novo link.",
  otp_expired: "O link expirou ou já foi utilizado. Peça um novo.",
};

export function authErrorMessage(code: string | undefined): string {
  return (code && AUTH_ERROR_MESSAGES[code]) || GENERIC_ERROR;
}
