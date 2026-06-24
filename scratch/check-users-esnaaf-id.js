const { PrismaClient } = require('../backend-api/node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'
    }
  }
});

// Custom 5-digit code generator (skipping confusing letters: I, O, L, 0, 1)
const ALPHANUMERIC_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateEsnaafId() {
  let result = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHANUMERIC_CHARS.length);
    result += ALPHANUMERIC_CHARS[randomIndex];
  }
  return `ESN-${result}`;
}

async function run() {
  const users = await prisma.user.findMany();
  console.log(`Total users in production: ${users.length}`);

  let missingCount = 0;
  for (const u of users) {
    if (!u.esnaaf_id) {
      missingCount++;
      let esnaafId;
      let exists = true;
      while (exists) {
        esnaafId = generateEsnaafId();
        const existingUser = await prisma.user.findUnique({ where: { esnaaf_id: esnaafId } });
        if (!existingUser) exists = false;
      }
      await prisma.user.update({
        where: { id: u.id },
        data: { esnaaf_id: esnaafId }
      });
      console.log(`Assigned ${esnaafId} to User: ${u.name || 'Anonymous'}`);
    } else {
      console.log(`User: ${u.name || 'Anonymous'} already has Esnaaf ID: ${u.esnaaf_id}`);
    }
  }
  console.log(`\nUpdated ${missingCount} users with new Esnaaf IDs.`);
  await prisma.$disconnect();
}

run().catch(console.error);
