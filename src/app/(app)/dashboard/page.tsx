import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardOverview, DashboardOverviewSkeleton } from "@/modules/dashboard/components/dashboard-overview";
import { Greeting } from "@/modules/dashboard/components/greeting";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        }
      >
        <Greeting />
      </Suspense>
      <Suspense fallback={<DashboardOverviewSkeleton />}>
        <DashboardOverview searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
