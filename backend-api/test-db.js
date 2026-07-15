const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    select: { id: true, phone: true, name: true, is_active: true }
  });
  console.log("USERS:", JSON.stringify(users, null, 2));

  const jobs = await prisma.serviceRequest.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      seeker: true
    }
  });
  console.log("JOBS:", JSON.stringify(jobs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
