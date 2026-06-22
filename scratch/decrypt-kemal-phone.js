const crypto = require('crypto');
const dotenv = require('c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/node_modules/dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend-api/.env') });

const ALGORITHM = 'aes-256-cbc';
const encryptedHex = '78a429136b6f2b2465d946224a390d0f';

function getKeys() {
  const key = process.env.ENCRYPTION_KEY || 'default_32_chars_long_key_12345';
  const iv = process.env.ENCRYPTION_IV || 'default_16_ch_iv';
  return {
    key: Buffer.from(key.substring(0, 32).padEnd(32, 'a')),
    iv: Buffer.from(iv.substring(0, 16).padEnd(16, 'b')),
  };
}

function decryptPhone(encryptedPhone) {
  try {
    const { key, iv } = getKeys();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedPhone, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return error.message;
  }
}

console.log('Decrypted Phone:', decryptPhone(encryptedHex));
