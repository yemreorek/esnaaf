const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const node = await prisma.graphNode.findUnique({where: {id: 'ev-temizligi_step_detaylar'}});
  console.log("DB Node:", node);
}

main().finally(() => prisma.$disconnect());
