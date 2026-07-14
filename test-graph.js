const { PrismaClient } = require('./backend-api/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Categories:");
  const cats = await prisma.category.findMany();
  console.log(cats.map(c => c.slug));

  console.log("\nRoutes:");
  const routes = await prisma.graphCategoryRoute.findMany();
  console.log(routes);

  console.log("\nNodes matching bos-ev-temizligi:");
  const nodes = await prisma.graphNode.findMany({
    where: { id: { startsWith: 'bos-ev-temizligi' } },
    include: { options: true }
  });
  console.log(JSON.stringify(nodes, null, 2));

  console.log("\nNodes matching ev-temizligi:");
  const evNodes = await prisma.graphNode.findMany({
    where: { id: { startsWith: 'ev-temizligi' } },
    include: { options: true }
  });
  console.log(JSON.stringify(evNodes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
