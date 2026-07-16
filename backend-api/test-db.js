const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'owner' } },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: { id: true, phone: true, name: true, created_at: true }
  });
  console.log("OWNER USERS:", JSON.stringify(users, null, 2));

  const jobs = await prisma.serviceRequest.findMany({
    where: { seeker_id: users.length > 0 ? users[0].id : undefined },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: { id: true, seeker_id: true, title: true, created_at: true }
  });
  console.log("OWNER JOBS:", JSON.stringify(jobs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

