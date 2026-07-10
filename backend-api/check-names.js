const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});
prisma.user.findMany({where: {role: 'service_provider'}, select: {name: true}}).then(users => {
  console.log('All Provider Names:', users.map(u => u.name).join(', '));
  return prisma.$disconnect();
});
