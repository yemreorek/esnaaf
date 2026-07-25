import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../common/gemini/gemini.service';

@Injectable()
export class AiConsultantService {
  private readonly logger = new Logger(AiConsultantService.name);

  constructor(private readonly geminiService: GeminiService) {}

  /**
   * Check if user message is general info or price inquiry
   */
  public isGeneralQuery(message: string): boolean {
    const text = message.toLowerCase();
    const keywords = ['fiyat', 'ücret', 'kaç para', 'nasıl çalışır', 'nedir', 'kimdir', 'nerede', 'tavsiye', 'bilgi'];
    return keywords.some((k) => text.includes(k));
  }

  /**
   * Answer general questions using Gemini LLM
   */
  public async answerGeneralQuery(message: string): Promise<string> {
    if (!this.geminiService.isAvailable()) {
      return 'Esnaaf hizmet platformumuza hoş geldiniz! Size en uygun ustayı bulabilmek için lütfen yaptırmak istediğiniz hizmeti seçiniz.';
    }

    try {
      const prompt = `Sen Esnaaf platformunun müşteri temsilcisisin. Nazik, yardımsever ve kısa Türkçe yanıt ver.\nMüşteri Sorusu: ${message}`;
      const response = await this.geminiService.generateText(prompt);
      return response || 'Size yardımcı olmaktan mutluluk duyarım. Hangi hizmet için usta arıyorsunuz?';
    } catch (e: any) {
      this.logger.error('Gemini error in AiConsultantService:', e);
      return 'Size yardımcı olmaktan mutlu oluruz. Lütfen ihtiyacınız olan hizmet kategorisini seçiniz.';
    }
  }
}
