import { CreditCard, Landmark } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isStripeConfigured } from "@/lib/stripe";
import { requireBusiness } from "@/modules/business/queries";
import { canManageBusiness } from "@/modules/business/roles";
import { getStripeAccount } from "../queries";
import { StripeActionButton } from "./stripe-action-button";

/** Ligação da empresa à Stripe (Connect): o dinheiro vai diretamente para a empresa. */
export async function StripeSettings({ returned }: { returned: boolean }) {
  const { business, role } = await requireBusiness();
  const account = await getStripeAccount(business.id);
  const isAdmin = canManageBusiness(role);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pagamentos online
          {account?.chargesEnabled ? (
            <Badge tone="success">Ativos</Badge>
          ) : account ? (
            <Badge tone="warning">Verificação pendente</Badge>
          ) : (
            <Badge tone="neutral">Desligados</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Os inquilinos pagam por cartão ou por transferência para um IBAN só deles. O dinheiro vai diretamente para a
          conta Stripe da empresa e os pagamentos ficam marcados como recebidos automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ul className="space-y-2 text-foreground">
          <li className="flex items-start gap-2">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            Cartão: página segura da Stripe.
          </li>
          <li className="flex items-start gap-2">
            <Landmark className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            Transferência: cada inquilino recebe um IBAN SEPA próprio (emitido pela Stripe, começa por NL). O que lá
            chegar é associado aos pagamentos dele.
          </li>
        </ul>

        {!isStripeConfigured() ? (
          <Alert tone="info">Os pagamentos online ainda não estão configurados nesta aplicação.</Alert>
        ) : !isAdmin ? (
          <p className="text-muted-foreground">Só um administrador pode ligar a conta Stripe.</p>
        ) : account?.chargesEnabled ? (
          <div className="flex flex-wrap items-start gap-2">
            <Button size="sm" variant="secondary" asChild>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer">
                Abrir o painel Stripe
              </a>
            </Button>
            <StripeActionButton action="refresh" variant="secondary">
              Atualizar estado
            </StripeActionButton>
          </div>
        ) : (
          <div className="space-y-3">
            {returned && account && (
              <Alert tone="info">
                A Stripe está a verificar os dados. Se faltar alguma informação, continue a verificação.
              </Alert>
            )}
            <p className="text-muted-foreground">
              Precisa dos dados da empresa, de um documento de identificação e do IBAN para onde a Stripe envia o
              dinheiro. As comissões são cobradas pela Stripe à empresa.
            </p>
            <div className="flex flex-wrap items-start gap-2">
              <StripeActionButton action="connect">
                {account ? "Continuar verificação na Stripe" : "Ligar conta Stripe"}
              </StripeActionButton>
              {account && (
                <StripeActionButton action="refresh" variant="secondary">
                  Atualizar estado
                </StripeActionButton>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
