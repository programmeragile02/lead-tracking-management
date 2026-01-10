const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
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

  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: "admin@leadtrack.local" },
    update: {
      name: "Super Admin",
      password: hashedPassword,
      roleId: superAdminRole.id,
      isActive: true,
    },
    create: {
      name: "Super Admin",
      email: "admin@leadtrack.local",
      password: hashedPassword,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  console.log("✅ Seed SUPERADMIN berhasil");
  console.log("📧 admin@leadtrack.local");
  console.log("🔑 admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
