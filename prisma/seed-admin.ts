import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Pastikan role SUPER_ADMIN ada
  const superAdminRole = await prisma.role.upsert({
    where: { code: "SUPERADMIN" },
    update: {
      name: "Super Admin",
      description: "Akses penuh konfigurasi sistem dan data master",
      isActive: true,
    },
    create: {
      code: "SUPERADMIN",
      name: "Super Admin",
      description: "Akses penuh konfigurasi sistem dan data master",
      isActive: true,
    },
  });

  // 2. Password admin
  const password = "admin123"; // ganti nanti di production
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Buat / update user admin
  await prisma.user.upsert({
    where: { email: "admin@leadtrack.com" },
    update: {
      name: "Super Admin",
      password: hashedPassword,
      roleId: superAdminRole.id,
      isActive: true,
    },
    create: {
      name: "Super Admin",
      email: "admin@leadtrack.com",
      password: hashedPassword,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  console.log("✅ Seed SUPER_ADMIN berhasil");
  console.log("📧 Email    : admin@leadtrack.local");
  console.log("🔑 Password : admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed admin gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
