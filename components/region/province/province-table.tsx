"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { Province } from "@/types/region-types";

interface Props {
  provinces: Province[];
  onEdit: (p: Province) => void;
  onDelete: (p: Province) => void;
}

export function ProvinceTable({ provinces, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-secondary ">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary">
            <TableHead className="text-white">Kode</TableHead>
            <TableHead className="text-white">Nama Provinsi</TableHead>
            <TableHead className="text-white text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {provinces.map((p) => (
            <TableRow key={p.id} className="hover:bg-muted/40">
              <TableCell className="font-mono">{p.code}</TableCell>
              <TableCell className="font-semibold">{p.name}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
