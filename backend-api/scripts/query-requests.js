const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.serviceRequest.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      seeker: true,
      category: true,
    }
  });

  console.log(JSON.stringify(requests, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
