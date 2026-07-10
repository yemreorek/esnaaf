const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgres://neondb_owner:n81oZlqXhKpb@ep-shrill-cell-a2qg04ol-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'admin' }
  });
  console.log('Admins:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
