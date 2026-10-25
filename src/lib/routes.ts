/** Rotas públicas de autenticação (quem já tem sessão é enviado para o dashboard). */
export const AUTH_ROUTES = ["/entrar", "/registar", "/recuperar-palavra-passe", "/verificar-email"] as const;

/** Rotas acessíveis sem sessão. Todas as outras exigem login. */
export const PUBLIC_ROUTES = [...AUTH_ROUTES, "/auth/confirm", "/api/stripe/webhook"] as const;

function matches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => matches(pathname, route));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matches(pathname, route));
}
