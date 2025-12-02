import { Target, Award, TrendingUp, Calendar } from "lucide-react"

export function ProfileStats() {
  const stats = [
    { label: "Total Lead", value: "45", icon: Target, color: "from-violet-500 to-purple-600" },
    { label: "Total Closing", value: "12", icon: Award, color: "from-blue-500 to-cyan-600" },
    { label: "Tingkat Konversi", value: "26.7%", icon: TrendingUp, color: "from-purple-500 to-pink-600" },
    { label: "Hari Aktif", value: "87", icon: Calendar, color: "from-green-500 to-emerald-600" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
            <stat.icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
          <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
