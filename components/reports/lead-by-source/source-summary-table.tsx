"use client";

import { RowTableSource } from "@/types/report";
import { getColorByIndex } from "./source-colors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SourceSummaryTable({ data }: { data: RowTableSource[] }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[30%]">Channel</TableHead>
            <TableHead className="text-right">Jumlah Lead</TableHead>
            <TableHead className="text-right">Persentase</TableHead>
            <TableHead className="w-[30%]">Distribusi</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row, i) => (
            <TableRow key={row.sourceName}>
              <TableCell className="font-medium">{row.sourceName}</TableCell>

              <TableCell className="text-right">{row.count}</TableCell>

              <TableCell className="text-right">{row.percentage}%</TableCell>

              <TableCell>
                <div className="h-2 w-full rounded bg-muted">
                  <div
                    className="h-2 rounded transition-all"
                    style={{
                      width: `${row.percentage}%`,
                      backgroundColor: getColorByIndex(i),
                    }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-6"
              >
                Tidak ada data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}