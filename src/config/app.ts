/**
 * Configuração do produto. O nome é provisório: altere `NEXT_PUBLIC_APP_NAME`
 * (ou o valor por defeito abaixo) para mudar a marca em toda a aplicação.
 */
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "StayFlow",
  description: "Gestão operacional para Alojamento Local",
  locale: "pt-PT",
  defaultTimezone: "Europe/Lisbon",
  currency: "EUR",
} as const;
