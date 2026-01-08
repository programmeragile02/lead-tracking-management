"use client";

import { Badge } from "@/components/ui/badge";

export function CityTable({
  data,
  onSelectCity,
}: {
  data: {
    cityId: number | null;
    cityName: string;
    count: number;
    percent: number;
  }[];
  onSelectCity: (cityId: number | null) => void;
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left">Kota</th>
            <th className="px-4 py-2 text-right">Lead</th>
            <th className="px-4 py-2 text-right">Presentase</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.cityId ?? row.cityName}
              onClick={() => onSelectCity(row.cityId)}
            >
              <td className="px-4 py-2 font-medium">{row.cityName}</td>
              <td className="px-4 py-2 text-right">{row.count}</td>
              <td className="px-4 py-2 text-right">
                <Badge variant="secondary">{row.percent}%</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
