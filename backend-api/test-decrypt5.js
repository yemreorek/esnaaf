const crypto = require('crypto');
const { PrismaClient } = require('./node_modules/@prisma/client');

function decryptPhone(encryptedPhone) {
  if (!encryptedPhone) return '';
  try {
    const key = Buffer.from('718e244ef06b4da7ba60e1d8cc5c28ad'.substring(0, 32).padEnd(32, 'a'));
    const iv = Buffer.from('92a83bd82c6742fb'.substring(0, 16).padEnd(16, 'b'));
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedPhone, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return 'FAILED';
  }
}

const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  for (const u of users) {
    console.log(`ID: ${u.id} | Masked: ${u.phone_masked} | Decrypted: ${decryptPhone(u.phone)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
