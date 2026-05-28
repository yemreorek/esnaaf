import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getKeys() {
  const key = process.env.ENCRYPTION_KEY || 'default_32_chars_long_key_12345';
  const iv = process.env.ENCRYPTION_IV || 'default_16_ch_iv';
  return {
    key: Buffer.from(key.substring(0, 32).padEnd(32, 'a')),
    iv: Buffer.from(iv.substring(0, 16).padEnd(16, 'b')),
  };
}

export function encryptPhone(phone: string): string {
  if (!phone) return '';
  const { key, iv } = getKeys();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptPhone(encryptedPhone: string): string {
  if (!encryptedPhone) return '';
  try {
    const { key, iv } = getKeys();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedPhone, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return encryptedPhone;
  }
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  let localDigits = digits;
  if (digits.startsWith('90') && digits.length === 12) {
    localDigits = digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    localDigits = digits.substring(1);
  }
  if (localDigits.length === 10) {
    const area = localDigits.substring(0, 3);
    const last = localDigits.substring(8);
    return `0${area} *** ** ${last}`;
  }
  return phone.substring(0, 4) + ' *** ** ' + phone.substring(phone.length - 2);
}

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+90${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+90${digits.substring(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('90')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}
