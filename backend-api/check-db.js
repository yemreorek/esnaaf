const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const nodes = await prisma.graphNode.findMany({ select: { id: true, question_text: true } });
  console.log(nodes);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
