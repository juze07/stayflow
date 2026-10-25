# Pagamentos online (Stripe Connect)

Cada empresa liga a sua própria conta Stripe em **Definições > Pagamentos online**. O dinheiro vai diretamente para a
conta da empresa; a plataforma nunca o recebe.

- **Cartão**: Stripe Checkout na conta da empresa.
- **Transferência**: cada estadia recebe um IBAN virtual só seu (Stripe "Bank transfers", IBAN de NL; a Stripe não
  emite IBAN de PT). Quando chega dinheiro, a Stripe envia `cash_balance.funds_available` e a app aplica o saldo aos
  pagamentos por receber da estadia, do mais antigo para o mais recente. O pagamento fica "Recebido" sem intervenção.
- O estado da conta ligada (Accounts v2) é lido da Stripe ao regressar da verificação, com o botão "Atualizar estado" e quando chega `account.updated`.
- Em modo de teste os IBAN são inválidos e podem repetir-se; os IBAN reais só existem depois da verificação da empresa.

## Configuração (uma vez por ambiente)

1. Conta Stripe da plataforma em modo de teste, com **Connect** ativado e, em Settings > Payment methods, **Cards** e
   **Bank transfers** ligados.
2. Variáveis na Vercel (nunca no código nem no browser): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_DB_SECRET`.
3. No editor SQL do Supabase: `select private.set_integration_secret('stripe', '<o valor de STRIPE_DB_SECRET>');`
4. Stripe > Developers > Webhooks > Add endpoint, a ouvir **Connected accounts**:
   - URL: `https://<domínio>/api/stripe/webhook`
   - Eventos: `account.updated`, `payment_intent.succeeded`, `cash_balance.funds_available`
   - O "Signing secret" (`whsec_...`) vai para `STRIPE_WEBHOOK_SECRET`.

## Segurança

- A assinatura de cada webhook é verificada antes de qualquer escrita; eventos repetidos são ignorados
  (`private.stripe_events`) e cada escrita é idempotente.
- A app não usa `service_role`. O webhook chama funções `stripe_*` que exigem o segredo partilhado; a base de dados só
  guarda o hash SHA-256 desse segredo.
- Contas, clientes e ligações de pagamentos à Stripe não podem ser alterados pela API (RLS e triggers).
- Valores sempre em cêntimos; um pagamento só fica recebido se o valor recebido cobrir o valor em dívida.
- Sem pagamentos em duplicado: quando um pagamento fica pago, as páginas de cartão ainda abertas para ele são fechadas
  e a transferência que esperava saldo é cancelada. Se mesmo assim entrar dinheiro para um pagamento já pago (ou
  cancelado), a Stripe devolve-o ao inquilino (reembolso; numa transferência volta ao saldo do cliente).

## Testar em modo de teste

Simular uma transferência para o IBAN de um inquilino: Stripe Dashboard (conta da empresa) > Customers > cliente >
Cash balance > "Simulate bank transfer", ou
`stripe test_helpers customers fund_cash_balance cus_... --amount 80000 --currency eur --stripe-account acct_...`.
