import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, message: "File harus berupa gambar" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // batasan ukuran misal 3MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, message: "Ukuran gambar maksimal 2MB" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products"
    );
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, buffer);

    // URL yang bisa dipakai di <Image src=... />
    const publicUrl = `/uploads/products/${fileName}`;

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (err) {
    console.error("Upload product image error:", err);
    return NextResponse.json(
      { ok: false, message: "Gagal mengupload gambar" },
      { status: 500 }
    );
  }
}
