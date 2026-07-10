const crypto = require('crypto');

function getKeys() {
  const key = process.env.ENCRYPTION_KEY || 'default_32_chars_long_key_12345';
  const iv = process.env.ENCRYPTION_IV || 'default_16_ch_iv';
  return {
    key: Buffer.from(key.substring(0, 32).padEnd(32, 'a')),
    iv: Buffer.from(iv.substring(0, 16).padEnd(16, 'b')),
  };
}

function encryptPhone(phone) {
  if (!phone) return '';
  const { key, iv } = getKeys();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// In .env, we have: ENCRYPTION_KEY=EsnaafProdDbPass2026! 
process.env.ENCRYPTION_KEY = 'EsnaafProdDbPass2026!';

console.log(encryptPhone('+905329999901'));
