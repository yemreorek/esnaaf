const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const route = await prisma.graphCategoryRoute.findUnique({where: {category_slug: 'ev-temizligi'}});
  console.log('Route:', route);
  if(route) {
    const node = await prisma.graphNode.findUnique({where: {id: route.start_node_id}, include: {options: true}});
    console.log('Node:', JSON.stringify(node, null, 2));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
