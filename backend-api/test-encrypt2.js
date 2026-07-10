const crypto = require('crypto');

function getKeys() {
  const key = 'some_32_character_encryption_key_';
  const iv = 'some_16_char_iv_';
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

console.log(encryptPhone('+905329999901'));
