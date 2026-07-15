const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { phone_masked: { contains: '00000009' } },
    orderBy: { created_at: 'desc' },
    take: 5
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
