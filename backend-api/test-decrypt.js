require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('./node_modules/@prisma/client');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

function getKeys() {
  const key = process.env.ENCRYPTION_KEY || 'default_32_chars_long_key_12345';
  const iv = process.env.ENCRYPTION_IV || 'default_16_ch_iv';
  return {
    key: Buffer.from(key.substring(0, 32).padEnd(32, 'a')),
    iv: Buffer.from(iv.substring(0, 16).padEnd(16, 'b')),
  };
}

function decryptPhone(encryptedPhone) {
  if (!encryptedPhone) return '';
  try {
    const { key, iv } = getKeys();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedPhone, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return 'FAILED';
  }
}

const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`ID: ${u.id} | Masked: ${u.phone_masked} | Decrypted: ${decryptPhone(u.phone)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
