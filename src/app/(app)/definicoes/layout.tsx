import { SettingsTabs } from "@/components/layout/settings-tabs";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsLayout({ children }: LayoutProps<"/definicoes">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Definições" description="Perfil, dados da empresa e equipa." />
      <SettingsTabs />
      <div className="max-w-3xl">{children}</div>
    </div>
  );
}
