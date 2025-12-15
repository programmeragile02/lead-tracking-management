import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function GET() {
  const headers = [
    "created_at",
    "name",
    "phone",
    "address",
    "product_name",
    "source_code",
    "stage_code",
    "status_code",
    "price_offering",
    "price_negotiation",
    "price_closing",
  ];

  const sample = [
    {
      created_at: "2025-12-15 08:00", // boleh "2025-12-15" juga
      name: "Budi Santoso",
      phone: "0812-3456-7890",
      address: "Jakarta",
      product_name: "Paket Premium",
      source_code: "IG_ADS",
      stage_code: "KONTAK_AWAL",
      status_code: "WARM",
      price_offering: "Rp 12.000.000",
      price_negotiation: "",
      price_closing: "",
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
