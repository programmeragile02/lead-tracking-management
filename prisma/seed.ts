import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Roles & Default Users...");

  const roles = [
    {
      code: "MANAGER",
      name: "Manager",
      description: "Owner / penanggung jawab tim",
    },
    {
      code: "TEAM_LEADER",
      name: "Team Leader",
      description: "Pimpinan tim sales",
    },
    {
      code: "SALES",
      name: "Sales",
      description: "Petugas follow up lead",
    },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        description: r.description,
        isActive: true,
      },
      create: r,
    });
  }

  console.log("Roles ready.");

  // password PLAIN untuk dikasih ke user (yang di-hash ke DB)
  const defaultUsers = [
    {
      name: "Manager Utama",
      email: "manager@lead.local",
      plainPassword: "manager123",
      roleCode: "MANAGER",
    },
    {
      name: "Team Leader",
      email: "leader@lead.local",
      plainPassword: "leader123",
      roleCode: "TEAM_LEADER",
    },
    {
      name: "Sales Demo",
      email: "sales@lead.local",
      plainPassword: "sales123",
      roleCode: "SALES",
    },
  ];

  for (const u of defaultUsers) {
    const role = await prisma.role.findUnique({ where: { code: u.roleCode } });
    if (!role) throw new Error(`Role ${u.roleCode} tidak ditemukan`);

    const hashed = await bcrypt.hash(u.plainPassword, 10);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: hashed,
        roleId: role.id,
        isActive: true,
      },
      create: {
        name: u.name,
        email: u.email,
        password: hashed,
        phone: "",
        roleId: role.id,
      },
    });
  }

  console.log("Default users created (plain password untuk login dev):");
  defaultUsers.forEach((u) => {
    console.log(`${u.roleCode} | ${u.email} | ${u.plainPassword}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
