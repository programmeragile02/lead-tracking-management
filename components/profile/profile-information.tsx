import { User, Mail, Phone, MapPin, Briefcase, Calendar } from "lucide-react"

export function ProfileInformation() {
  const fields = [
    { label: "Nama Lengkap", value: "Andi Saputra", icon: User },
    { label: "Email", value: "andi@company.com", icon: Mail },
    { label: "Nomor Telepon", value: "+62 812 3456 7890", icon: Phone },
    { label: "Alamat", value: "Jakarta Selatan, DKI Jakarta", icon: MapPin },
    { label: "Posisi", value: "Sales Representative", icon: Briefcase },
    { label: "Bergabung Sejak", value: "15 Januari 2024", icon: Calendar },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Pribadi</h3>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.label} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <field.icon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">{field.label}</p>
              <p className="text-base font-semibold text-gray-900">{field.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
