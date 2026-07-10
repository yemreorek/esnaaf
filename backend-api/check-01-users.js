const { PrismaClient } = require('./node_modules/@prisma/client');
const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '12345678901234567890123456789012', 'utf-8');
const IV_LENGTH = 16;

function encryptPhone(phone) {
  const normalized = phone.replace(/\D/g, '');
  const phoneToEncrypt = normalized.startsWith('90') ? '+' + normalized : '+90' + normalized;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(phoneToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const users = await prisma.user.findMany({
    include: { service_provider: true }
  });
  
  // Try to find the user manually by decrypting? 
  // No, the phone is encrypted, so let's just print users whose masked phone ends with 01
  for (const u of users) {
    if (u.phone_masked && u.phone_masked.includes('01')) {
      console.log(`- ID: ${u.id} | Name: ${u.name} | PhoneMasked: ${u.phone_masked}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
