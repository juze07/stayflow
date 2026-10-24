import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <>
      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
        </CardContent>
      </Card>
      {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
    </>
  );
}
