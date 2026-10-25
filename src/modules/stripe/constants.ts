/** Moeda de todos os pagamentos online. */
export const STRIPE_CURRENCY = "eur";

/**
 * País do IBAN virtual de cada estadia. A Stripe só emite IBAN virtuais de
 * DE, FR, IE e NL (não de PT); todos são SEPA, por isso uma transferência a
 * partir de um banco português custa o mesmo que uma nacional.
 */
export const VIRTUAL_IBAN_COUNTRY = "NL";

/** País das contas Stripe criadas para as empresas. */
export const STRIPE_ACCOUNT_COUNTRY = "PT";
