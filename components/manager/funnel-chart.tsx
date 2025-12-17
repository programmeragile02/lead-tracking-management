export function FunnelChart() {
  const stages = [
    { name: "Lead Baru", count: 328, width: 100 },
    { name: "Sudah Dihubungi", count: 245, width: 75 },
    { name: "Hot/Warm", count: 156, width: 48 },
    { name: "Closing Berhasil", count: 87, width: 27 },
    { name: "Closing Gagal", count: 69, width: 21 },
  ]

  return (
    <div className="bg-secondary rounded-2xl p-6 shadow-md border-2 border-border">
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-foreground">{stage.name}</span>
              <span className="text-muted-foreground font-semibold">{stage.count} lead</span>
            </div>
            <div
              className="h-12 bg-primary rounded-lg flex items-center justify-center text-foreground font-bold shadow-md"
              style={{ width: `${stage.width}%` }}
            >
              {stage.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
