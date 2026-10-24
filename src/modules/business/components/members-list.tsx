"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { removeMemberAction, updateMemberRoleAction } from "../actions";
import { ROLE_LABELS, ROLES, isRole } from "../roles";
import type { TeamMember } from "../team-queries";

type MembersListProps = { members: TeamMember[]; currentUserId: string; canEdit: boolean };

export function MembersList({ members, currentUserId, canEdit }: MembersListProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membros ({members.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <ul className="divide-y divide-border">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            return (
              <li key={member.membershipId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={member.fullName} email={member.email} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {member.fullName || member.email}
                      {isSelf && <span className="ml-1 font-normal text-muted-foreground">(você)</span>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                {canEdit && !isSelf ? (
                  <div className="flex items-center gap-2">
                    <div className="w-40">
                      <Select
                        aria-label={`Função de ${member.fullName || member.email}`}
                        defaultValue={member.role}
                        disabled={isPending}
                        onChange={(event) => {
                          const role = event.target.value;
                          if (!isRole(role)) return;
                          setError(null);
                          startTransition(async () => {
                            const result = await updateMemberRoleAction({ membershipId: member.membershipId, role });
                            if (!result.ok) setError(result.error);
                          });
                        }}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Remover ${member.fullName || member.email}`}>
                          <Trash2 className="text-destructive" />
                        </Button>
                      }
                      title="Remover membro?"
                      description={`${member.fullName || member.email} deixa de ter acesso aos dados da empresa. As tarefas atribuídas ficam sem responsável.`}
                      confirmLabel="Remover"
                      onConfirm={async () => {
                        setError(null);
                        const result = await removeMemberAction(member.membershipId);
                        if (!result.ok) setError(result.error);
                      }}
                    />
                  </div>
                ) : (
                  <Badge tone={member.role === "admin" ? "primary" : "neutral"}>{ROLE_LABELS[member.role]}</Badge>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
