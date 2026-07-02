import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
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
            description: 'Müşterinin Ad-Soyad ve Telefon bilgilerini doğrulayıp SMS ile 6 haneli doğrulama kodu (OTP) gönderir. Telefon numarası ve ad-soyad alındığında çağrılmalıdır. Çağrılırken o ana kadar toplanan tüm form verileri de formData parametresi ile iletilmelidir.',
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
                formData: {
                  type: Type.OBJECT,
                  description: 'Kategoriye özel toplanan tüm detaylar ve form verileri (Örn: { city: "İstanbul", district: "Kadıköy", details: "klima arızalı çalışmıyor soğutmuyor", cihazTuru: "Klima", islemTuru: "Arıza Onarım" }). Konum bilgisi (district) mutlaka Adana, İstanbul, Ankara veya İzmir ilçelerinden biri olmalıdır. Açıklama (details) alanına müşterinin belirttiği arıza veya talebi yazın.',
                },
              } as any,
              required: ['phone', 'name', 'formData'],
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
          {
            name: 'getPlatformStats',
            description: 'Esnaaf platformundaki kayıtlı ve onaylı usta sayısı, hizmet koşulları, fiyatlandırma veya genel istatistikler hakkında bilgi almak için kullanılır.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                categorySlug: {
                  type: Type.STRING,
                  description: 'Sorgulanmak istenen hizmet kategorisi slugı (Örn: boya-badana, ev-temizligi, su-tesisati, elektrik-tesisati, kombi-klima vb.)',
                },
                city: {
                  type: Type.STRING,
                  description: 'Sorgulanmak istenen şehir (Örn: "Adana", "İstanbul", "Ankara", "İzmir")',
                },
              } as any,
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

    // Map legacy or invalid models to actual available models in API
    if (!modelToUse || typeof modelToUse !== 'string' || !modelToUse.startsWith('gemini-')) {
      modelToUse = 'gemini-2.5-flash';
    } else if (modelToUse === 'gemini-1.5-flash' || modelToUse === 'gemini-3.5-flash') {
      modelToUse = 'gemini-2.5-flash';
    } else if (modelToUse === 'gemini-1.5-pro' || modelToUse === 'gemini-3.5-pro' || modelToUse === 'gemini-3.1-pro') {
      modelToUse = 'gemini-2.5-pro';
    }

    // Map history to Gemini API format
    // Filter out system message from contents and map 'assistant' role to 'model'
    const contents = history
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // Build fallback list of models to try if the primary is overloaded
    const modelsToTry = [modelToUse];
    if (modelToUse.includes('flash')) {
      modelsToTry.push('gemini-2.0-flash');
      modelsToTry.push('gemini-2.5-pro');
    } else {
      modelsToTry.push('gemini-2.5-flash');
      modelsToTry.push('gemini-2.0-flash');
    }

    let lastError: any = null;
    const globalStart = Date.now();
    const GLOBAL_TIMEOUT = 45000; // Tüm denemeler için max 45 saniye

    for (const currentModel of modelsToTry) {
      // Global timeout kontrolü
      if (Date.now() - globalStart > GLOBAL_TIMEOUT) {
        console.warn(`[GeminiService] Global timeout (${GLOBAL_TIMEOUT}ms) reached. Stopping retries.`);
        break;
      }

      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Global timeout kontrolü (her attempt öncesi)
        if (Date.now() - globalStart > GLOBAL_TIMEOUT) {
          break;
        }

        try {
          console.log(`[GeminiService] Calling generateContent with model: ${currentModel} (Attempt ${attempt}/${maxRetries})`);
          
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout after 20 seconds')), 20000)
          );

          const response = await Promise.race([
            this.ai.models.generateContent({
              model: currentModel,
              contents,
              config: {
                systemInstruction,
                tools: this.getTools(),
                temperature: options?.temperature !== undefined ? options.temperature : undefined,
              },
            }),
            timeoutPromise,
          ]) as any;

          const elapsed = Date.now() - globalStart;
          console.log(`[GeminiService] Success with ${currentModel} in ${elapsed}ms (Attempt ${attempt})`);

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
            status === 500 ||
            errMsg.includes('high demand') || 
            errMsg.includes('UNAVAILABLE') || 
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('INTERNAL') ||
            errMsg.includes('quota') ||
            errMsg.includes('Timeout');

          if (isTransient && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s exponential backoff
            console.warn(`[GeminiService] Transient error on ${currentModel} (${status || errMsg}). Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          console.warn(`[GeminiService] Model ${currentModel} failed: ${errMsg}. Trying next fallback...`);
          break; // Break the attempt loop to try the next model in modelsToTry
        }
      }
    }

    const totalElapsed = Date.now() - globalStart;
    console.error(`[GeminiService] All models failed after ${totalElapsed}ms.`, lastError?.message);
    throw lastError || new Error('Gemini Service failed after trying all fallback models.');
  }
}
