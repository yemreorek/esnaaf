import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI | null = null;
  private readonly logger = new Logger(OpenAIService.name);
  private modelName = 'gpt-4o-mini';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      this.logger.log(`Initialized with model: ${this.modelName}`);
    } else {
      this.logger.warn('OPENAI_API_KEY is not defined. Fallback to OpenAI is disabled.');
    }
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }

  private getTools(): any[] {
    return [
      {
        type: "function",
        function: {
          name: 'detectCategory',
          description: 'Müşterinin talep ettiği hizmetin kategorisini tespit eder. Bu araç, müşteri hangi hizmete ihtiyacı olduğunu ilk kez söylediğinde çağrılmalıdır.',
          parameters: {
            type: "object",
            properties: {
              categorySlug: {
                type: "string",
                description: 'Hizmetin kategorisi (Desteklenen sluglar: ev-temizligi, boya-badana, nakliyat, su-tesisati, elektrik-tesisati, ev-tadilat, hali-koltuk-yikama, insaat-sonrasi-temizlik, fayans-parke, hasere-ilaclama, kombi-klima, mantolama-discephe, marangoz-mobilya, ozel-ders, cam-balkon-pvc, ofis-temizligi, dogalgaz-tesisati, ic-mimar-dekorasyon, fotografci, organizasyon-etkinlik)',
              },
              confidence: {
                type: "number",
                description: 'Kategori tespitinin güven skoru (0 ile 1 arasında, örn: 0.95)',
              },
            },
            required: ['categorySlug', 'confidence'],
          },
        }
      },
      {
        type: "function",
        function: {
          name: 'sendOTP',
          description: 'Müşterinin Ad-Soyad ve Telefon bilgilerini doğrulayıp SMS ile 6 haneli doğrulama kodu (OTP) gönderir. Telefon numarası ve ad-soyad alındığında çağrılmalıdır. Çağrılırken o ana kadar toplanan tüm form verileri de formData parametresi ile iletilmelidir.',
          parameters: {
            type: "object",
            properties: {
              phone: {
                type: "string",
                description: 'Kullanıcının telefon numarası (örn: "05321234567")',
              },
              name: {
                type: "string",
                description: 'Kullanıcının adı ve soyadı (örn: "Ahmet Yılmaz")',
              },
              formData: {
                type: "object",
                description: 'Kategoriye özel toplanan tüm detaylar ve form verileri.',
              },
            },
            required: ['phone', 'name', 'formData'],
          },
        }
      },
      {
        type: "function",
        function: {
          name: 'createServiceRequest',
          description: 'Tüm bilgiler (kategori, konum/ilçe, detaylar vb.) toplanıp telefon OTP ile doğrulandıktan sonra veritabanında nihai hizmet talebini oluşturur.',
          parameters: {
            type: "object",
            properties: {
              seekerName: {
                type: "string",
                description: 'Müşterinin adı soyadı',
              },
              phone: {
                type: "string",
                description: 'Müşterinin doğrulanmış telefon numarası',
              },
              categorySlug: {
                type: "string",
                description: 'Hizmet kategorisi slugı',
              },
              formData: {
                type: "object",
                description: 'Kategoriye özel toplanan tüm detaylar ve form verileri',
              },
            },
            required: ['seekerName', 'phone', 'categorySlug', 'formData'],
          },
        }
      },
      {
        type: "function",
        function: {
          name: 'getPlatformStats',
          description: 'Esnaaf platformundaki kayıtlı ve onaylı usta sayısı, hizmet koşulları, fiyatlandırma veya genel istatistikler hakkında bilgi almak için kullanılır.',
          parameters: {
            type: "object",
            properties: {
              categorySlug: {
                type: "string",
                description: 'Sorgulanmak istenen hizmet kategorisi slugı',
              },
              city: {
                type: "string",
                description: 'Sorgulanmak istenen şehir',
              },
            },
          },
        }
      },
    ];
  }

  async generateResponse(
    history: { role: 'system' | 'user' | 'assistant'; content: string }[],
    systemInstruction: string,
    options?: { modelName?: string; temperature?: number },
  ) {
    if (!this.openai) {
      throw new Error('OpenAI API Client is not initialized.');
    }

    const messages: any[] = [{ role: 'system', content: systemInstruction }];
    for (const msg of history) {
      if (msg.role !== 'system') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Calling OpenAI with model: ${this.modelName} (Attempt ${attempt}/${maxRetries})`);
        
        const response = await this.openai.chat.completions.create({
          model: this.modelName,
          messages: messages,
          tools: this.getTools(),
          temperature: options?.temperature !== undefined ? options.temperature : 0.7,
        });

        const choice = response.choices[0];
        const message = choice.message;

        // Map OpenAI Tool Calls to Gemini Function Calls format so chat.service.ts doesn't break
        let functionCalls: any[] | null = null;
        if (message.tool_calls && message.tool_calls.length > 0) {
          functionCalls = message.tool_calls.map(tc => {
            let args = {};
            try { args = JSON.parse(tc.function.arguments); } catch (e) {}
            return {
              name: tc.function.name,
              args: args
            };
          });
        }

        return {
          text: message.content || '',
          functionCalls: functionCalls,
        };

      } catch (error: any) {
        lastError = error;
        this.logger.warn(`OpenAI failed: ${error.message}. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw lastError || new Error('OpenAI Fallback failed.');
  }
}
