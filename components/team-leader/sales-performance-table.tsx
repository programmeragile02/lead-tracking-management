export function SalesPerformanceTable() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Sales Name</th>
              <th className="text-left p-4 text-sm font-semibold">Lead Target</th>
              <th className="text-left p-4 text-sm font-semibold">Revenue Target</th>
              <th className="text-left p-4 text-sm font-semibold">Closings</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="p-4">
                <p className="font-medium">Andi Wijaya</p>
              </td>
              <td className="p-4">
                <div className="space-y-1">
                  <p className="text-sm">6 / 10</p>
                  <div className="h-2 bg-muted rounded-full w-24">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="space-y-1">
                  <p className="text-sm">28jt / 50jt</p>
                  <div className="h-2 bg-muted rounded-full w-24">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "56%" }} />
                  </div>
                </div>
              </td>
              <td className="p-4">
                <p className="font-medium">3</p>
              </td>
            </tr>
            <tr>
              <td className="p-4">
                <p className="font-medium">Sari Dewi</p>
              </td>
              <td className="p-4">
                <div className="space-y-1">
                  <p className="text-sm">8 / 10</p>
                  <div className="h-2 bg-muted rounded-full w-24">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: "80%" }} />
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="space-y-1">
                  <p className="text-sm">42jt / 50jt</p>
                  <div className="h-2 bg-muted rounded-full w-24">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "84%" }} />
                  </div>
                </div>
              </td>
              <td className="p-4">
                <p className="font-medium">5</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
