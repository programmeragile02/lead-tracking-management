import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, message: "File is required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { ok: false, message: "File harus PDF" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, message: "Maksimal 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = ".pdf";
    const fileName = `product-education-${randomUUID()}${ext}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "product-education"
    );

    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/product-education/${fileName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
    });
  } catch (err: any) {
    console.error("POST /api/uploads/product-education error:", err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
