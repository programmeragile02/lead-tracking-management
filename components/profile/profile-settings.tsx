import { Bell, Lock, Globe, HelpCircle } from "lucide-react";
import { ChevronRight } from "lucide-react";

type ProfileSettingsProps = {
  onSecurityClick?: () => void;
};

export function ProfileSettings({ onSecurityClick }: ProfileSettingsProps) {
  const settings = [
    {
      key: "notification",
      label: "Notifikasi",
      description: "Atur preferensi notifikasi Anda",
      icon: Bell,
      onClick: () => {
        // TODO: nanti kalau ada
      },
    },
    {
      key: "security",
      label: "Keamanan",
      description: "Ubah password dan keamanan akun",
      icon: Lock,
      onClick: onSecurityClick,
    },
    {
      key: "language",
      label: "Bahasa & Region",
      description: "Pilih bahasa dan zona waktu",
      icon: Globe,
      onClick: () => {
        // TODO: nanti
      },
    },
    {
      key: "help",
      label: "Bantuan & Dukungan",
      description: "Pusat bantuan dan FAQ",
      icon: HelpCircle,
      onClick: () => {
        // TODO: nanti
      },
    },
  ];

  return (
    <div className="bg-secondary rounded-2xl p-6 shadow-md border-2 border-border">
      <h3 className="text-lg font-bold text-foreground mb-4">Pengaturan</h3>
      <div className="space-y-2">
        {settings.map((setting) => (
          <button
            key={setting.key}
            type="button"
            onClick={setting.onClick}
            className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted-foreground/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <setting.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">{setting.label}</p>
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
