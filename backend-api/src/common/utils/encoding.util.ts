export function sanitizeForWin1254(text: string): string {
  if (!text) return '';
  
  // Set of specifically allowed non-ASCII unicode points for Windows-1254 Turkish
  const allowedCodes = new Set([
    0x011E, // Ğ
    0x011F, // ğ
    0x0130, // İ
    0x0131, // ı
    0x015E, // Ş
    0x015F, // ş
    // Windows-1254 extensions:
    0x20AC, // €
    0x201A, // ‚
    0x0192, // ƒ
    0x201E, // „
    0x2026, // …
    0x2020, // †
    0x2021, // ‡
    0x02C6, // ˆ
    0x2030, // ‰
    0x0160, // Š
    0x2039, // ‹
    0x0152, // Œ
    0x2018, // ‘
    0x2019, // ’
    0x201C, // “
    0x201D, // ”
    0x2022, // •
    0x2013, // –
    0x2014, // —
    0x02DC, // ˜
    0x2122, // ™
    0x0161, // š
    0x203A, // ›
    0x0153, // œ
    0x0178, // Ÿ
  ]);

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);
    
    // Check if it's ASCII (0-127) or standard Latin-1 character in WIN1254
    // WIN1254 has codes 160-255 except 208, 221, 222, 240, 253, 254
    const isValidLatin1 = (code >= 160 && code <= 255) && 
      ![208, 221, 222, 240, 253, 254].includes(code);

    if (code <= 127 || isValidLatin1 || allowedCodes.has(code)) {
      result += char;
    } else {
      // If it's a surrogate pair (emoji / extra unicode character), skip the next char as well
      const isHighSurrogate = code >= 0xD800 && code <= 0xDBFF;
      if (isHighSurrogate && i + 1 < text.length) {
        i++; // skip low surrogate
      }
      result += ' ';
    }
  }
  
  // Clean up multiple consecutive spaces introduced by removals
  return result.replace(/\s+/g, ' ').trim();
}

export function sanitizeObjectForWin1254(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return sanitizeForWin1254(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForWin1254(item));
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = sanitizeObjectForWin1254(obj[key]);
    }
    return result;
  }
  return obj;
}
