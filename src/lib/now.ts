/**
 * Hora do pedido atual. As páginas privadas são sempre geradas por pedido
 * (nunca em cache), por isso "agora" é o momento em que a pessoa abriu a página.
 */
export function requestTime(): Date {
  return new Date();
}
