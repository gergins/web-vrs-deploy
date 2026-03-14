import { getPrismaClient } from "./prisma-client";

async function main() {
  const prisma = getPrismaClient();
  await prisma.$connect();

  await prisma.user.upsert({
    where: { email: "signer@example.com" },
    update: { role: "signer" },
    create: {
      id: "user-signer-1",
      email: "signer@example.com",
      role: "signer"
    }
  });

  await prisma.user.upsert({
    where: { email: "interpreter@example.com" },
    update: { role: "interpreter" },
    create: {
      id: "user-interpreter-1",
      email: "interpreter@example.com",
      role: "interpreter"
    }
  });

  await prisma.user.upsert({
    where: { email: "interpreter2@example.com" },
    update: { role: "interpreter" },
    create: {
      id: "user-interpreter-2",
      email: "interpreter2@example.com",
      role: "interpreter"
    }
  });

  await prisma.interpreter.upsert({
    where: { userId: "user-interpreter-1" },
    update: { status: "available" },
    create: {
      id: "interpreter-1",
      userId: "user-interpreter-1",
      status: "available"
    }
  });

  await prisma.interpreter.upsert({
    where: { userId: "user-interpreter-2" },
    update: { status: "available" },
    create: {
      id: "interpreter-2",
      userId: "user-interpreter-2",
      status: "available"
    }
  });

  console.log("Prisma seed scaffold completed");
  await prisma.$disconnect();
}

void main().catch(async (error) => {
  console.error("Prisma seed scaffold failed", error);
  const prisma = getPrismaClient();
  await prisma.$disconnect();
  process.exitCode = 1;
});
