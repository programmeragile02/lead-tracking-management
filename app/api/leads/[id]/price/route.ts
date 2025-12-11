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

    if (value < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nominal harga tidak boleh negatif.",
        },
        { status: 400 }
      );
    }

    // Ambil lead + info status sekarang
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        salesId: true,
        statusId: true,
        status: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
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

    // ==== Tentukan status otomatis ====
    // input harga penawaran / nego  -> HOT
    // input harga closing           -> CLOSE_WON
    let targetStatusCode: "HOT" | "CLOSE_WON" | null = null;

    if (field === "priceClosing") {
      targetStatusCode = "CLOSE_WON";
    } else {
      targetStatusCode = "HOT";
    }

    let newStatusId: number | null = null;
    let newStatusCode: string | null = null;
    let newStatusName: string | null = null;
    const prevStatusId = existingLead.statusId;
    const prevStatusCode = existingLead.status?.code ?? null;
    const prevStatusName = existingLead.status?.name ?? null;

    if (targetStatusCode) {
      const targetStatus = await prisma.leadStatus.findUnique({
        where: { code: targetStatusCode },
        select: { id: true, code: true, name: true },
      });

      // kalau master statusnya ada dan berbeda dengan status sekarang → update
      if (targetStatus && targetStatus.id !== prevStatusId) {
        newStatusId = targetStatus.id;
        newStatusCode = targetStatus.code;
        newStatusName = targetStatus.name;
      }
    }

    // ==== Update lead (harga + optional status) ====
    const dataToUpdate: any = {
      [field]: value,
    };

    if (newStatusId) {
      dataToUpdate.statusId = newStatusId;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: dataToUpdate,
      select: {
        id: true,
        priceOffering: true,
        priceNegotiation: true,
        priceClosing: true,
        statusId: true,
      },
    });

    // ==== Catat aktivitas harga ====
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

    const newValue = updatedLead[field];

    let description = "";
    if (prevValue === null || prevValue === undefined) {
      description = `${label} diset ke ${formatRupiah(newValue)}.`;
    } else {
      description = `${label} diubah dari ${formatRupiah(
        prevValue
      )} menjadi ${formatRupiah(newValue)}.`;
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

    // ==== Kalau status ikut berubah, catat ke LeadStatusHistory juga ====
    if (newStatusId && newStatusCode && newStatusName) {
      await prisma.leadStatusHistory.create({
        data: {
          leadId: leadId,
          statusId: newStatusId,
          changedById: user.id ?? null,
          salesId: existingLead.salesId ?? null,
          note:
            field === "priceClosing"
              ? `Status otomatis menjadi "${newStatusName}" setelah mengisi harga closing.`
              : `Status otomatis menjadi "${newStatusName}" setelah mengisi harga ${label.toLowerCase()}.`,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: updatedLead.id,
          priceOffering: updatedLead.priceOffering,
          priceNegotiation: updatedLead.priceNegotiation,
          priceClosing: updatedLead.priceClosing,
          statusId: updatedLead.statusId,
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
