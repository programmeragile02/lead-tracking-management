import { PrismaClient } from "@prisma/client";

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

  // insert / update role
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

  const defaultUsers = [
    {
      name: "Manager Utama",
      email: "manager@lead.local",
      password: "manager123",
      roleCode: "MANAGER",
    },
    {
      name: "Team Leader",
      email: "leader@lead.local",
      password: "leader123",
      roleCode: "TEAM_LEADER",
    },
    {
      name: "Sales Demo",
      email: "sales@lead.local",
      password: "sales123",
      roleCode: "SALES",
    },
  ];

  for (const u of defaultUsers) {
    const role = await prisma.role.findUnique({ where: { code: u.roleCode } });

    if (!role) throw new Error(`Role ${u.roleCode} tidak ditemukan`);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: u.password,
        phone: "",
        roleId: role.id,
      },
    });
  }

  console.log("Default users created:");

  defaultUsers.forEach((u) => {
    console.log(`${u.roleCode} | ${u.email} | ${u.password}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
