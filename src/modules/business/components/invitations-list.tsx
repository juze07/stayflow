"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { formatDate } from "@/lib/format";
import { revokeInvitationAction } from "../actions";
import { ROLE_LABELS } from "../roles";
import type { PendingInvitation } from "../team-queries";

type InvitationsListProps = { invitations: (PendingInvitation & { link: string })[]; timeZone: string };

export function InvitationsList({ invitations, timeZone }: InvitationsListProps) {
  const [error, setError] = useState<string | null>(null);
  if (invitations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convites pendentes ({invitations.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <ul className="divide-y divide-border">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{invitation.email}</p>
                <p className="text-sm text-muted-foreground">
                  {ROLE_LABELS[invitation.role]} ·{" "}
                  {invitation.expired ? "expirado" : `válido até ${formatDate(invitation.expiresAt, timeZone)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {invitation.expired ? <Badge tone="warning">Expirado</Badge> : <CopyButton value={invitation.link} />}
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="sm">
                      Cancelar
                    </Button>
                  }
                  title="Cancelar convite?"
                  description={`O link enviado para ${invitation.email} deixa de funcionar.`}
                  confirmLabel="Cancelar convite"
                  cancelLabel="Voltar"
                  onConfirm={async () => {
                    setError(null);
                    const result = await revokeInvitationAction(invitation.id);
                    if (!result.ok) setError(result.error);
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
