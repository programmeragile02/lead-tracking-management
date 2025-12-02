export function ChannelPerformanceTable() {
  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-violet-50 to-purple-50">
            <tr>
              <th className="text-left p-4 text-sm font-bold text-gray-900">Channel</th>
              <th className="text-right p-4 text-sm font-bold text-gray-900">Lead</th>
              <th className="text-right p-4 text-sm font-bold text-gray-900">Closing</th>
              <th className="text-right p-4 text-sm font-bold text-gray-900">Pendapatan</th>
              <th className="text-right p-4 text-sm font-bold text-gray-900">Konversi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="p-4 font-bold text-gray-900">Instagram Ads</td>
              <td className="p-4 text-right font-semibold text-gray-700">128</td>
              <td className="p-4 text-right font-semibold text-gray-700">35</td>
              <td className="p-4 text-right font-semibold text-gray-700">175jt</td>
              <td className="p-4 text-right text-green-600 font-bold">27.3%</td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="p-4 font-bold text-gray-900">Website</td>
              <td className="p-4 text-right font-semibold text-gray-700">95</td>
              <td className="p-4 text-right font-semibold text-gray-700">28</td>
              <td className="p-4 text-right font-semibold text-gray-700">140jt</td>
              <td className="p-4 text-right text-green-600 font-bold">29.5%</td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="p-4 font-bold text-gray-900">Referral</td>
              <td className="p-4 text-right font-semibold text-gray-700">72</td>
              <td className="p-4 text-right font-semibold text-gray-700">18</td>
              <td className="p-4 text-right font-semibold text-gray-700">90jt</td>
              <td className="p-4 text-right text-green-600 font-bold">25.0%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
