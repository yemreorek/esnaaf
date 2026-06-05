import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-3.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
      console.log(`[GeminiService] Initialized with model: ${this.modelName}`);
    } else {
      console.warn('[GeminiService] GEMINI_API_KEY is not defined. Active Agent will run in Mock Fallback mode.');
    }
  }

  isAvailable(): boolean {
    return this.ai !== null;
  }

  /**
   * Tool declarations for Gemini Function Calling
   */
  private getTools(): any[] {
    return [
      {
        functionDeclarations: [
          {
            name: 'detectCategory',
            description: 'Müşterinin talep ettiği hizmetin kategorisini tespit eder. Bu araç, müşteri hangi hizmete ihtiyacı olduğunu ilk kez söylediğinde çağrılmalıdır.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                categorySlug: {
                  type: Type.STRING,
                  description: 'Hizmetin kategorisi (Desteklenen sluglar: ev-temizligi, boya-badana, nakliyat, su-tesisati, elektrik-tesisati, ev-tadilat, hali-koltuk-yikama, insaat-sonrasi-temizlik, fayans-parke, hasere-ilaclama, kombi-klima, mantolama-discephe, marangoz-mobilya, ozel-ders, cam-balkon-pvc, ofis-temizligi, dogalgaz-tesisati, ic-mimar-dekorasyon, fotografci, organizasyon-etkinlik)',
                },
                confidence: {
                  type: Type.NUMBER,
                  description: 'Kategori tespitinin güven skoru (0 ile 1 arasında, örn: 0.95)',
                },
              } as any,
              required: ['categorySlug', 'confidence'],
            },
          },
          {
            name: 'sendOTP',
            description: 'Müşterinin Ad-Soyad ve Telefon bilgilerini doğrulayıp SMS ile 6 haneli doğrulama kodu (OTP) gönderir. Telefon numarası ve ad-soyad alındığında çağrılmalıdır.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                phone: {
                  type: Type.STRING,
                  description: 'Kullanıcının telefon numarası (örn: "05321234567")',
                },
                name: {
                  type: Type.STRING,
                  description: 'Kullanıcının adı ve soyadı (örn: "Ahmet Yılmaz")',
                },
              } as any,
              required: ['phone', 'name'],
            },
          },
          {
            name: 'createServiceRequest',
            description: 'Tüm bilgiler (kategori, konum/ilçe, detaylar vb.) toplanıp telefon OTP ile doğrulandıktan sonra veritabanında nihai hizmet talebini oluşturur.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                seekerName: {
                  type: Type.STRING,
                  description: 'Müşterinin adı soyadı',
                },
                phone: {
                  type: Type.STRING,
                  description: 'Müşterinin doğrulanmış telefon numarası',
                },
                categorySlug: {
                  type: Type.STRING,
                  description: 'Hizmet kategorisi slugı',
                },
                formData: {
                  type: Type.OBJECT,
                  description: 'Kategoriye özel toplanan tüm detaylar ve form verileri (Örn: { daireTipi: "3+1", metrekare: "120 m2", siflik: "Tek seferlik", tarih: "28 Mayıs 10:00", city: "İstanbul", district: "Kadıköy" })',
                },
              } as any,
              required: ['seekerName', 'phone', 'categorySlug', 'formData'],
            },
          },
        ] as any[],
      },
    ];
  }

  /**
   * Generates response from Gemini based on the message history and active state
   */
  async generateResponse(
    history: { role: 'system' | 'user' | 'assistant'; content: string }[],
    systemInstruction: string,
    options?: { modelName?: string; temperature?: number },
  ) {
    if (!this.ai) {
      throw new Error('Gemini API Client is not initialized.');
    }

    let modelToUse = options?.modelName || this.modelName;

    // Map legacy models to actual available models in API
    if (modelToUse === 'gemini-1.5-flash' || modelToUse === 'gemini-2.5-flash') {
      modelToUse = 'gemini-3.5-flash';
    } else if (modelToUse === 'gemini-1.5-pro' || modelToUse === 'gemini-2.5-pro' || modelToUse === 'gemini-3.1-pro') {
      modelToUse = 'gemini-3.5-pro';
    }

    // Map history to Gemini API format
    // Filter out system message from contents and map 'assistant' role to 'model'
    const contents = history
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelToUse,
          contents,
          config: {
            systemInstruction,
            tools: this.getTools(),
            temperature: options?.temperature !== undefined ? options.temperature : undefined,
          },
        });

        return {
          text: response.text,
          functionCalls: response.functionCalls || null,
        };
      } catch (error: any) {
        lastError = error;
        const status = error.status || error.statusCode || (error.response && error.response.status);
        const errMsg = error.message || '';
        
        const isTransient = 
          status === 503 || 
          status === 429 || 
          errMsg.includes('high demand') || 
          errMsg.includes('UNAVAILABLE') || 
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('quota');

        if (isTransient && attempt < maxRetries) {
          const delay = attempt * 1000; // 1s, 2s backoff
          console.warn(`[GeminiService] Transient error detected (${status || errMsg}). Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        console.error('[GeminiService] generateResponse Error:', error);
        throw error;
      }
    }

    throw lastError || new Error('Gemini Service failed after max retries.');
  }
}
