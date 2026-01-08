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
import { Badge } from "@/components/ui/badge";
import type { City } from "@/types/region-types";

interface Props {
  cities: City[];
  onEdit: (city: City) => void;
  onDelete: (city: City) => void;
}

export function CityTable({ cities, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border overflow-hidden bg-secondary">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary">
            <TableHead className="text-white">Kode</TableHead>
            <TableHead className="text-white">Nama</TableHead>
            <TableHead className="text-white">Tipe</TableHead>
            <TableHead className="text-white">Provinsi</TableHead>
            <TableHead className="text-white text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cities.map((c) => (
            <TableRow key={c.id} className="hover:bg-muted/40">
              <TableCell className="font-mono">{c.code}</TableCell>
              <TableCell className="font-semibold">{c.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {c.type === "KOTA" ? "Kota" : "Kabupaten"}
                </Badge>
              </TableCell>
              <TableCell>{c.province.name}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(c)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(c)}
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
