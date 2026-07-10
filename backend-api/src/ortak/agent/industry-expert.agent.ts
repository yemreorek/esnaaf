import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class IndustryExpertAgent {
  private readonly logger = new Logger(IndustryExpertAgent.name);
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-2.5-flash';

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    }
  }

  async generateQuestionsForCategory(categoryId: string, categoryName: string): Promise<any> {
    if (!this.ai) {
      this.logger.warn('Gemini API is not available, skipping expert agent generation.');
      return null;
    }

    try {
      const prompt = `Sen bir pazar araştırması ve sektör uzmanısın. Amacın, bir hizmet platformunda (armut.com gibi) "${categoryName}" kategorisinde hizmet almak isteyen bir müşteriye sorulması gereken en kritik 3-5 adet soruyu belirlemektir. 
Bu sorular, fiyatlandırmayı ve işin kapsamını (maliyet kalemi oluşturan) doğrudan etkileyen sorular olmalıdır. 

Kurallar:
1. Soru metinleri ('question_text') samimi ve net olmalıdır.
2. Tüm soruların hazır tıklanabilir buton şıkları ('options') olmalıdır. Açık uçlu soru üretme.
3. Her soruya benzersiz bir 'key' (İngilizce ve camelCase) tanımla. Örneğin oda sayısı için 'roomCount'.
4. 'input_type' değeri 'single_choice' veya 'multi_choice' olabilir.
5. Sadece yanıt olarak bana bir JSON array dönmelisin. Hiçbir açıklama ekleme.

Format örneği:
[
  {
    "key": "roomCount",
    "question_text": "Boyatmak istediğiniz alanın yaklaşık büyüklüğü veya oda sayısı nedir?",
    "input_type": "single_choice",
    "options": ["1+1 Ev", "2+1 Ev", "3+1 Ev", "4+1 ve üzeri"]
  },
  {
    "key": "materialSupply",
    "question_text": "Boya malzemesini kim temin edecek?",
    "input_type": "single_choice",
    "options": ["Malzemeyi usta getirsin", "Malzemeyi ben alacağım"]
  }
]`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING },
                question_text: { type: Type.STRING },
                input_type: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
              } as any,
              required: ['key', 'question_text', 'input_type', 'options'],
            },
          },
        },
      });

      if (!response.text) {
        throw new Error('Gemini did not return any text.');
      }

      const questionsFlow = JSON.parse(response.text);

      await this.prisma.category.update({
        where: { id: categoryId },
        data: { questions_flow: questionsFlow },
      });

      this.logger.log(`Successfully generated and saved expert questions for category: ${categoryName}`);
      return questionsFlow;
    } catch (error) {
      this.logger.error(`Failed to generate expert questions for ${categoryName}: ${error}`);
      return null;
    }
  }

  async backfillExistingCategories(): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: {
        questions_flow: {
          equals: null,
        },
      },
    });

    this.logger.log(`Found ${categories.length} categories needing question backfill.`);
    
    for (const cat of categories) {
      this.logger.log(`Generating flow for ${cat.name}...`);
      await this.generateQuestionsForCategory(cat.id, cat.name);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
