"use client";

import { ErrorView, type ErrorViewProps } from "@/components/layout/error-view";

export default function AppError(props: ErrorViewProps) {
  return <ErrorView {...props} />;
}
