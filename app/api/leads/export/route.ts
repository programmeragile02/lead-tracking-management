import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const subStatus = searchParams.get("subStatus");
  const stage = searchParams.get("stage");
  const teamLeader = searchParams.get("teamLeader");
  const sales = searchParams.get("sales");
  const month = searchParams.get("month");

  const where: any = { isExcluded: false };

  if (status && status !== "ALL") where.status = { code: status };
  if (subStatus && subStatus !== "ALL") where.subStatus = { code: subStatus };
  if (stage && stage !== "ALL") where.stageId = Number(stage);
  if (sales && sales !== "ALL") where.salesId = Number(sales);
  if (teamLeader && teamLeader !== "ALL") {
    where.sales = { teamLeaderId: Number(teamLeader) };
  }

  if (month) {
    const [year, m] = month.split("-");
    where.createdAt = {
      gte: new Date(Number(year), Number(m) - 1, 1),
      lt: new Date(Number(year), Number(m), 1),
    };
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      product: true,
      status: true,
      subStatus: true,
      sales: {
        include: { teamLeader: true },
      },
      source: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = leads.map((l) => ({
    "Nama Lead": l.name,
    "No HP": l.phone ?? "",
    Alamat: l.address ?? "",
    Kota: l.city ?? "",
    Produk: l.product?.name ?? "-",
    "Sumber Lead": l.source?.name ?? "-",
    Status: l.status?.name ?? "-",
    "Sub Status": l.subStatus?.name ?? "-",
    "Harga Penawaran": l.priceOffering ?? "",
    "Harga Negosiasi": l.priceNegotiation ?? "",
    "Harga Closing": l.priceClosing ?? "",
    Sales: l.sales?.name ?? "-",
    "Team Leader": l.sales?.teamLeader?.name ?? "-",
    "Tanggal Masuk": l.createdAt.toLocaleDateString("id-ID"),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // SET LEBAR KOLOM (dalam karakter)
  worksheet["!cols"] = [
    { wch: 20 }, // Nama Lead
    { wch: 15 }, // No HP
    { wch: 25 }, // Alamat
    { wch: 15 }, // Kota
    { wch: 20 }, // Produk
    { wch: 18 }, // Sumber Lead
    { wch: 12 }, // Status
    { wch: 15 }, // Sub Status
    { wch: 16 }, // Harga Penawaran
    { wch: 16 }, // Harga Negosiasi
    { wch: 16 }, // Harga Closing
    { wch: 18 }, // Sales
    { wch: 18 }, // Team Leader
    { wch: 18 }, // Tanggal Masuk
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=leads_export.xlsx`,
    },
  });
}
