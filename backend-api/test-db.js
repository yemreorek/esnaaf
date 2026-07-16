const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'Melike' } },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: { id: true, phone: true, name: true, role: true }
  });
  console.log("MELIKE USERS:", JSON.stringify(users, null, 2));

  const jobs = await prisma.serviceRequest.findMany({
    orderBy: { created_at: 'desc' },
    take: 3,
    select: { id: true, seeker_id: true, status: true, created_at: true, title: true }
  });
  console.log("LATEST JOBS:", JSON.stringify(jobs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
