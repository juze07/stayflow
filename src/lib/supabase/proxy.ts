import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { isAuthRoute, isPublicRoute } from "@/lib/routes";
import type { Database } from "./database.types";

/**
 * Renova a sessão Supabase em cada pedido e encaminha quem não tem sessão
 * para o login. Isto é conforto de navegação: a proteção real dos dados é o
 * RLS na base de dados, e cada página/ação volta a verificar a sessão.
 */
export async function updateSession(request: NextRequest) {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Não colocar código entre createServerClient e getClaims: getClaims valida
  // o token e renova-o se necessário.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = new URLSearchParams(params).toString();
    const redirect = NextResponse.redirect(url);
    // Mantém os cookies de sessão renovados no redirecionamento.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (pathname === "/") {
    return redirectTo(isSignedIn ? "/dashboard" : "/entrar");
  }

  if (!isSignedIn && !isPublicRoute(pathname)) {
    return redirectTo("/entrar", { next: pathname + search });
  }

  if (isSignedIn && isAuthRoute(pathname)) {
    return redirectTo("/dashboard");
  }

  return response;
}
