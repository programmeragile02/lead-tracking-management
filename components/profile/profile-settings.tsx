import { Bell, Lock, Globe, HelpCircle } from "lucide-react"
import { ChevronRight } from "lucide-react"

export function ProfileSettings() {
  const settings = [
    { label: "Notifikasi", description: "Atur preferensi notifikasi Anda", icon: Bell },
    { label: "Keamanan", description: "Ubah password dan keamanan akun", icon: Lock },
    { label: "Bahasa & Region", description: "Pilih bahasa dan zona waktu", icon: Globe },
    { label: "Bantuan & Dukungan", description: "Pusat bantuan dan FAQ", icon: HelpCircle },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Pengaturan</h3>
      <div className="space-y-2">
        {settings.map((setting) => (
          <button
            key={setting.label}
            className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <setting.icon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">{setting.label}</p>
              <p className="text-sm text-gray-600">{setting.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}
