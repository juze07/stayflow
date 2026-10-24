import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/entrar" className="mb-8">
        <Logo />
      </Link>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
