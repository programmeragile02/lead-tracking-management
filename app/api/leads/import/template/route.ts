import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function GET() {
  const headers = [
    "Tanggal Lead Masuk",
    "Nama Lead *",
    "No. WhatsApp",
    "Alamat",
    "Kota",
    "Nama Produk",
    "Sumber Lead (Kode)",
    "Tahap Lead (Kode)",
    "Status Utama (Kode)",
    "Sub Status (Kode)",
    "Harga Penawaran",
    "Harga Negosiasi",
    "Harga Closing",
  ];

  const sample = [
    {
      "Tanggal Lead Masuk": "2025/12/15",
      "Nama Lead *": "Budi Santoso",
      "No. WhatsApp": "6281234567890",
      Alamat: "Jl. Sudirman No. 10",
      Kota: "Jakarta Selatan",
      "Nama Produk": "SevenRent",
      "Sumber Lead (Kode)": "INSTAGRAM",
      "Tahap Lead (Kode)": "KONTAK_AWAL",
      "Sub Status (Kode)": "NO_RESPON",
      "Status Utama (Kode)": "",
      "Harga Penawaran": "12000000",
      "Harga Negosiasi": "",
      "Harga Closing": "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample, { header: headers });
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="leads_template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
