const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.questions_flow && JSON.stringify(cat.questions_flow).includes('tekli koltuk')) {
      console.log('Found in Category:', cat.name, cat.slug);
      console.log('Flow:', JSON.stringify(cat.questions_flow, null, 2));
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
