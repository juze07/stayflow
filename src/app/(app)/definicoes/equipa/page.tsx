import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { siteUrl } from "@/lib/env";
import { InvitationsList } from "@/modules/business/components/invitations-list";
import { InviteMemberForm } from "@/modules/business/components/invite-member-form";
import { MembersList } from "@/modules/business/components/members-list";
import { requireBusiness } from "@/modules/business/queries";
import { canManageBusiness, invitableRoles } from "@/modules/business/roles";
import { listPendingInvitations, listTeamMembers } from "@/modules/business/team-queries";

export const metadata: Metadata = { title: "Equipa" };

async function Team() {
  const { business, role, user } = await requireBusiness();
  const roles = invitableRoles(role);
  const [members, invitations] = await Promise.all([
    listTeamMembers(business.id),
    roles.length > 0 ? listPendingInvitations(business.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      {roles.length > 0 && <InviteMemberForm roles={roles} />}
      <InvitationsList
        timeZone={business.timezone}
        invitations={invitations.map((invitation) => ({
          ...invitation,
          link: siteUrl(`/convite/${invitation.token}`),
        }))}
      />
      <MembersList members={members} currentUserId={user.id} canEdit={canManageBusiness(role)} />
    </div>
  );
}

export default function TeamSettingsPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent>
            <FormSkeleton fields={2} />
          </CardContent>
        </Card>
      }
    >
      <Team />
    </Suspense>
  );
}
