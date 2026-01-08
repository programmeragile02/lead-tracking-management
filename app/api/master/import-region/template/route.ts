import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const data = [
    {
      province_code: "32",
      province_name: "Jawa Barat",
      city_code: "32.73",
      city_name: "Bandung",
      city_type: "KOTA",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Regions");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=template_wilayah.xlsx",
    },
  });
}
