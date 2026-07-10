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
  const user = await prisma.user.findUnique({
    where: { id: '34617f1a-e264-4afa-938d-618d534b5cb6' }
  });
  console.log(`Kemal Usta Decrypted: ${decryptPhone(user.phone)}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
