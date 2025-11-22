import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      passwordHash: adminPassword,
      role: "ADMIN"
    }
  });

  const guardPassword = await bcrypt.hash("Guard@123", 10);
  await prisma.user.upsert({
    where: { username: "guard1" },
    update: {},
    create: {
      name: "Guard One",
      username: "guard1",
      passwordHash: guardPassword,
      role: "GUARD"
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
