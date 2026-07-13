const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const node = await prisma.graphNode.findUnique({
    where: { id: 'ev-temizligi_1' },
    include: { options: true }
  });
  console.log(JSON.stringify(node, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
