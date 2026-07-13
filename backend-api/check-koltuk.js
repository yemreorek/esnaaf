const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const route = await prisma.graphCategoryRoute.findUnique({where: {category_slug: 'koltuk-yikama'}});
  console.log('Koltuk Yikama Route:', route);
  if(route) {
    const node = await prisma.graphNode.findUnique({where: {id: route.start_node_id}});
    console.log('Koltuk Node:', node);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
