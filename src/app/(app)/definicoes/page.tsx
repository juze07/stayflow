import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/layout/form-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/modules/business/queries";
import { ProfileForm } from "@/modules/profile/components/profile-form";

export const metadata: Metadata = { title: "Perfil" };

async function Profile() {
  const { user, profile } = await requireSession();
  return <ProfileForm email={user.email} defaultValues={{ fullName: profile.fullName, phone: profile.phone ?? "" }} />;
}

export default function ProfileSettingsPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent>
            <FormSkeleton fields={3} />
          </CardContent>
        </Card>
      }
    >
      <Profile />
    </Suspense>
  );
}
