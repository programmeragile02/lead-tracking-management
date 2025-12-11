import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type PriceField = "priceOffering" | "priceNegotiation" | "priceClosing";

const FIELD_LABEL: Record<PriceField, string> = {
  priceOffering: "Harga Penawaran",
  priceNegotiation: "Harga Negosiasi",
  priceClosing: "Harga Closing",
};

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Belum login" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const leadId = Number(id);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "Lead id tidak valid" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      field?: string;
      value?: any;
    } | null;

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Body request tidak valid" },
        { status: 400 }
      );
    }

    const field = body.field as PriceField | undefined;
    let { value } = body;

    // Validasi field
    if (
      !field ||
      !["priceOffering", "priceNegotiation", "priceClosing"].includes(field)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Field tidak valid. Gunakan salah satu: priceOffering, priceNegotiation, priceClosing.",
        },
        { status: 400 }
      );
    }

    if (value === null || value === undefined || value === "") {
      return NextResponse.json(
        {
          ok: false,
          error: "Nominal harga tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    // Terima number atau string, kita paksa ke number
    if (typeof value === "string") {
      // buang karakter non angka (koma, titik, dll)
      const cleaned = value.replace(/[^0-9.]/g, "");
      value = Number(cleaned);
    }

    if (typeof value !== "number" || Number.isNaN(value)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nominal harga harus berupa angka.",
        },
        { status: 400 }
      );
    }

    // Boleh 0? Untuk safety, kita izinkan 0, tapi kalau mau bisa diset minimal 1
    if (value < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nominal harga tidak boleh negatif.",
        },
        { status: 400 }
      );
    }

    // Ambil lead dulu untuk dapat nilai sebelumnya
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        salesId: true,
        priceOffering: true,
        priceNegotiation: true,
        priceClosing: true,
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { ok: false, error: "Lead tidak ditemukan" },
        { status: 404 }
      );
    }

    const prevValue = existingLead[field];

    // Update hanya field harga yang diminta
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        [field]: value,
      },
      select: {
        id: true,
        priceOffering: true,
        priceNegotiation: true,
        priceClosing: true,
      },
    });

    // Catat ke LeadActivity sebagai timeline harga
    const label = FIELD_LABEL[field];

    const formatRupiah = (n: any) => {
      if (n === null || n === undefined) return "-";
      const num = typeof n === "number" ? n : Number(n);
      if (Number.isNaN(num)) return String(n);
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(num);
    };

    let description = "";
    const newValue = updatedLead[field];

    if (prevValue === null || prevValue === undefined) {
      description = `${label} diset ke ${formatRupiah(newValue)}`;
    } else {
      description = `${label} diubah dari ${formatRupiah(
        prevValue
      )} menjadi ${formatRupiah(newValue)}`;
    }

    await prisma.leadActivity.create({
      data: {
        leadId: leadId,
        title: `Update ${label}`,
        description,
        happenedAt: new Date(),
        createdById: user.id ?? null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: updatedLead.id,
          priceOffering: updatedLead.priceOffering,
          priceNegotiation: updatedLead.priceNegotiation,
          priceClosing: updatedLead.priceClosing,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error update price lead:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Terjadi kesalahan di server saat menyimpan harga.",
      },
      { status: 500 }
    );
  }
}
