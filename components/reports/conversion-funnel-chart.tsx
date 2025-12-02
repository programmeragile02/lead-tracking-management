"use client"

const stages = [
  { name: "Lead Baru", count: 328, percentage: 100, color: "from-violet-500 to-purple-600" },
  { name: "Sudah Dihubungi", count: 245, percentage: 75, color: "from-purple-500 to-blue-600" },
  { name: "Hot/Warm", count: 156, percentage: 48, color: "from-blue-500 to-cyan-600" },
  { name: "Closing Berhasil", count: 87, percentage: 27, color: "from-green-500 to-emerald-600" },
]

export function ConversionFunnelChart() {
  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <div key={stage.name} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-gray-900">{stage.name}</span>
            <span className="text-gray-600 font-semibold">
              {stage.count} lead ({stage.percentage}%)
            </span>
          </div>
          <div className="relative h-14 bg-gray-100 rounded-xl overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${stage.color} flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all`}
              style={{ width: `${stage.percentage}%` }}
            >
              {stage.count}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
