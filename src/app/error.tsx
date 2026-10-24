"use client";

import { ErrorView, type ErrorViewProps } from "@/components/layout/error-view";

export default function RootError(props: ErrorViewProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <ErrorView {...props} />
    </div>
  );
}
