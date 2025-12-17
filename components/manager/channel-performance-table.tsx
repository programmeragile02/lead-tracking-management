export function ChannelPerformanceTable() {
  return (
    <div className="bg-secondary rounded-2xl shadow-md border-2 border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary">
            <tr>
              <th className="text-left p-4 text-sm font-bold text-foreground">Channel</th>
              <th className="text-right p-4 text-sm font-bold text-foreground">Lead</th>
              <th className="text-right p-4 text-sm font-bold text-foreground">Closing</th>
              <th className="text-right p-4 text-sm font-bold text-foreground">Pendapatan</th>
              <th className="text-right p-4 text-sm font-bold text-foreground">Konversi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-background">
            <tr className="hover:bg-muted-foreground/5 transition-colors">
              <td className="p-4 font-bold text-foreground">Instagram Ads</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">128</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">35</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">175jt</td>
              <td className="p-4 text-right text-green-600 font-bold">27.3%</td>
            </tr>
            <tr className="hover:bg-muted-foreground/5 transition-colors">
              <td className="p-4 font-bold text-foreground">Website</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">95</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">28</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">140jt</td>
              <td className="p-4 text-right text-green-600 font-bold">29.5%</td>
            </tr>
            <tr className="hover:bg-muted-foreground/5 transition-colors">
              <td className="p-4 font-bold text-foreground">Referral</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">72</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">18</td>
              <td className="p-4 text-right font-semibold text-muted-foreground">90jt</td>
              <td className="p-4 text-right text-green-600 font-bold">25.0%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
