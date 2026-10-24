import { z } from "zod";

/**
 * Variáveis públicas (seguras no browser). As chaves secretas nunca começam
 * por NEXT_PUBLIC_ e nunca são lidas neste ficheiro.
 *
 * O Next.js só substitui `process.env.NEXT_PUBLIC_*` quando o nome aparece
 * escrito por extenso, por isso cada variável é lida explicitamente.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL tem de ser um URL válido" }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, { message: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em falta" }),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  if (cached) return cached;

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(`Configuração em falta. Veja o ficheiro .env.example.\n${details}`);
  }

  cached = parsed.data;
  return cached;
}

/** URL absoluto de uma rota da aplicação (usado em emails e links de convite). */
export function siteUrl(path = "/"): string {
  return new URL(path, getPublicEnv().NEXT_PUBLIC_SITE_URL).toString();
}
