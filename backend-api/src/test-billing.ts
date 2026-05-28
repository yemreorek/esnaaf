import { GoogleGenAI } from '@google/genai';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY env variable is not set.');
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey });

  console.log('Testing with gemini-2.5-flash under billing...');
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello, respond with one word.' }] }],
    });
    console.log('Success! Response:', res.text);
  } catch (err: any) {
    console.error('Failed:', err.message);
  }
}

main().catch(console.error);
