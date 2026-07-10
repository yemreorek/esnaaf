const crypto = require('crypto');

function encryptPhone(phone) {
  if (!phone) return '';
  const key = Buffer.from('718e244ef06b4da7ba60e1d8cc5c28ad'.substring(0, 32).padEnd(32, 'a'));
  const iv = Buffer.from('92a83bd82c6742fb'.substring(0, 16).padEnd(16, 'b'));
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

console.log(encryptPhone('+905329999901'));
