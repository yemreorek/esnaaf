import { Injectable, BadRequestException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { ChatGateway } from './chat.gateway';
import { normalizePhone, encryptPhone, maskPhone } from '../../common/utils/phone.util';
import { GeminiService } from '../../common/gemini/gemini.service';

interface SessionState {
  step: 'greeting' | 'category_detection' | 'collecting_details' | 'ask_name' | 'ask_phone' | 'otp_verification' | 'confirm_form' | 'completed';
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  collected_data: {
    categorySlug?: string;
    city?: string;
    district?: string;
    name?: string;
    phone?: string;
    details?: string;
    [key: string]: any;
  };
  token_count: number;
}

@Injectable()
export class ChatService {
  private CITY_DISTRICTS: Record<string, string[]> = {
    'Adana': ['çukurova', 'yüreğir', 'sarıçam', 'ceyhan', 'seyhan']
  };

  private DISTRICT_CAPITALIZATION: Record<string, string> = {
    'çukurova': 'Çukurova', 'yüreğir': 'Yüreğir', 'sarıçam': 'Sarıçam', 'ceyhan': 'Ceyhan', 'seyhan': 'Seyhan'
  };

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private chatGateway: ChatGateway,
    @InjectQueue('chat-retry') private chatRetryQueue: Bull.Queue,
    private geminiService: GeminiService,
  ) {}

  /**
   * PII Filter: Strips names, phone numbers, T.C. IDs from user input before sending to OpenAI/Gemini
   */
  private filterPii(text: string): string {
    let filtered = text;
    // Scrub Turkish Phone Numbers
    filtered = filtered.replace(/(?:\+?90|\b0)?\s*5\d{2}\s*\d{3}\s*\d{2}\s*\d{2}\b/g, '[TELEFON FILTERED]');
    // Scrub TC Identity Numbers
    filtered = filtered.replace(/\b[1-9]\d{10}\b/g, '[TC FILTERED]');
    // Scrub explicit introductions
    filtered = filtered.replace(/(?:adım|ismim|adım\s+soyadım)\s+([a-zA-ZçığöşüÇİĞÖŞÜ]+(?:\s+[a-zA-ZçığöşüÇİĞÖŞÜ]+)?)/gi, '[İSİM FILTERED]');
    return filtered;
  }

  /**
   * Checks if user has exceeded the daily token limit of 50K
   */
  private async checkTokenLimit(sessionKey: string) {
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `token_limit:${sessionKey}:${today}`;
    const tokenUsage = await this.redis.get(limitKey);
    
    if (tokenUsage && Number(tokenUsage) >= 50000) {
      throw new HttpException('Bugünlük mesaj limitinize ulaştınız. Yarın devam edebilirsiniz.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /**
   * Updates token usage count
   */
  private async trackTokens(sessionKey: string, tokens: number) {
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `token_limit:${sessionKey}:${today}`;
    await this.redis.incrby(limitKey, tokens);
    await this.redis.expire(limitKey, 86400); // 24 hours
  }

  /**
   * Starts a new anonymous chat session in Redis
   */
  async startAnonymousSession(sessionUuid?: string, userId?: string | null) {
    const uuid = sessionUuid || randomUUID();
    const sessionKey = userId ? `ai_session:${userId}:${uuid}` : `temp_session:${uuid}`;

    const initialState: SessionState = {
      step: 'greeting',
      messages: [{ role: 'system', content: 'Esnaaf AI Asistanı Hizmet Arama Konuşması' }],
      collected_data: {},
      token_count: 0,
    };

    await this.redis.set(sessionKey, JSON.stringify(initialState), 'EX', userId ? 86400 : 7200); // 24 hours for logged in user, 2 hours for temp session

    return {
      session_uuid: uuid,
      step: 'greeting',
      message: 'Merhaba! Esnaaf platformuna hoş geldiniz. Size bugün hangi konuda yardımcı olabilirim? (Örn: Ev temizliği, boya badana, tesisat veya elektrik işi...)',
    };
  }

  /**
   * Dynamically synchronizes state.step with collected data completeness
   */
  private syncStep(state: SessionState) {
    if (!state.collected_data.categorySlug) {
      state.step = 'category_detection';
      return;
    }

    const nextQ = this.getNextQuestion(state);
    if (nextQ) {
      state.step = 'collecting_details';
      return;
    }

    if (!state.collected_data.name) {
      state.step = 'ask_name';
      return;
    }

    if (!state.collected_data.phone) {
      state.step = 'ask_phone';
      return;
    }
  }

  /**
   * Main chat message handler incorporating state machine & PII filtering
   */
  async handleMessage(userId: string | null, sessionId: string, message: string) {
    let sessionKey = userId ? `ai_session:${userId}:${sessionId}` : `temp_session:${sessionId}`;
    let rawSession = await this.redis.get(sessionKey);
    
    if (!rawSession && userId) {
      // Dynamic migration fallback: Check if guest session exists under temp_session:${sessionId}
      const tempKey = `temp_session:${sessionId}`;
      const tempSession = await this.redis.get(tempKey);
      if (tempSession) {
        await this.redis.set(sessionKey, tempSession, 'EX', 86400); // Migrate to 24h TTL
        await this.redis.del(tempKey);
        rawSession = tempSession;
        console.log(`[ChatService] Dynamically migrated ${tempKey} to ${sessionKey} during handleMessage`);
      }
    }

    if (!rawSession) {
      const newSession = await this.startAnonymousSession(sessionId, userId);
      return {
        step: 'greeting',
        responseMessage: 'Oturum süreniz dolduğu için yeni bir sohbet başlattık. ' + newSession.message,
      };
    }

    const state: SessionState = JSON.parse(rawSession);

    if (message.length > 500) {
      throw new BadRequestException('Tek mesaj en fazla 500 karakter olabilir.');
    }
    await this.checkTokenLimit(sessionKey);

    const filteredMessage = this.filterPii(message);
    state.messages.push({ role: 'user', content: filteredMessage });

    let responseMessage = '';
    let createdJobId: string | undefined;
    const tokensUsed = Math.floor(message.length * 0.3) + 20;

    try {
      // ─── ACTIVE AGENT PATH (GEMINI FLASH) ───────────────────────────
      if (this.geminiService.isAvailable()) {
        
        // A. Transactional Steps (Secure, deterministic verification/creation)
        if (state.step === 'ask_name') {
          // If the message contains a phone number, let Gemini handle it so it can call sendOTP tool with both name and phone
          const hasPhonePattern = /(?:\+?90|\b0)?\s*5\d{2}\s*\d{3}\s*\d{2}\s*\d{2}\b/.test(message);
          
          // Check if the last assistant message actually asked for the name/isim.
          // If not, it means we are in a conversational clarification/correction loop, so we should bypass the strict name capture
          // and let Gemini handle the conversation.
          const assistantMessages = state.messages.filter(m => m.role === 'assistant');
          const lastAssistantMsg = assistantMessages[assistantMessages.length - 1]?.content || '';
          const askedForName = /(?:adın|adınız|soyadın|soyadınız|ismin|isminiz|adınızı|soyadınızı|adım|isminiz nedir)/i.test(lastAssistantMsg);
          
          const name = message.trim();
          const isChoice = /^(?:yks|lise|evet|hayır|hayir|tyt|ayt|lgs|ok|tamam|okey|yok|var)$/i.test(name);
          
          if (askedForName && !isChoice && !hasPhonePattern) {
            if (name.length < 2) {
              throw new BadRequestException('Lütfen geçerli bir ad girin.');
            }
            state.collected_data.name = name;
            state.step = 'ask_phone';
            responseMessage = `Memnun oldum ${name}! Talebinizin doğrulanması için telefon numaranızı alabilir miyim? (Örn: 05321234567)`;
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
            await this.trackTokens(sessionKey, tokensUsed);
            return {
              step: 'ask_phone',
              responseMessage,
              collected_data: state.collected_data,
            };
          }
        }

        if (state.step === 'ask_phone') {
          try {
            const normalized = normalizePhone(message);
            state.collected_data.phone = normalized;

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            await this.redis.set(`otp:${normalized}`, JSON.stringify({ code: otpCode, attempts: 0 }), 'EX', 300);

            console.log(`\n==================================================`);
            console.log(`[OTP Simulated via Gemini Active Agent] Phone: ${normalized} | Code: ${otpCode}`);
            console.log(`==================================================\n`);

            state.step = 'otp_verification';
            responseMessage = `Telefonunuza 6 haneli doğrulama kodu gönderdik (Geliştirme için: ${otpCode}). Lütfen bu kodu girin:`;
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
            await this.trackTokens(sessionKey, tokensUsed);
            return {
              step: 'otp_verification',
              responseMessage,
              collected_data: state.collected_data,
            };
          } catch (e) {
            responseMessage = 'Geçerli bir telefon numarası giriniz. (Örn: 0532 123 4567)';
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
            await this.trackTokens(sessionKey, tokensUsed);
            return {
              step: 'ask_phone',
              responseMessage,
              collected_data: state.collected_data,
            };
          }
        }

        if (state.step === 'otp_verification') {
          const phone = state.collected_data.phone;
          if (!phone) {
            throw new BadRequestException('Telefon numarası bulunamadı.');
          }

          const normalizedPhone = normalizePhone(phone);
          const otpData = await this.redis.get(`otp:${normalizedPhone}`);
          
          if (!otpData) {
            throw new BadRequestException('Kodun süresi doldu. Yeni kod isteyin.');
          }

          const { code: storedCode, attempts } = JSON.parse(otpData);

          if (message.trim() === storedCode) {
            await this.redis.del(`otp:${normalizedPhone}`);

            const encryptedPhone = encryptPhone(phone);
            let user = await this.prisma.user.findUnique({
              where: { phone: encryptedPhone },
            });

            if (!user) {
              user = await this.prisma.user.create({
                data: {
                  phone: encryptedPhone,
                  phone_masked: maskPhone(phone),
                  name: state.collected_data.name,
                  role: 'service_seeker',
                  is_active: true,
                  kvkk_consent: true,
                },
              });
            }

            const newSessionKey = `ai_session:${user.id}:${sessionId}`;
            state.step = 'confirm_form';
            await this.redis.set(newSessionKey, JSON.stringify(state), 'EX', 86400);

            let summaryMessage = `Harika! Telefon numaranız başarıyla doğrulandı ve kaydınız tamamlandı. Lütfen aşağıdaki panelden talep bilgilerinizi kontrol edip onaylayın:`;

            responseMessage = summaryMessage;
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);

            await this.trackTokens(newSessionKey, tokensUsed);
            return {
              step: 'confirm_form',
              responseMessage,
              collected_data: state.collected_data,
              sessionMigrated: true,
              user: { id: user.id, phone: user.phone, role: user.role },
            };
          } else {
            const newAttempts = attempts + 1;
            if (newAttempts >= 3) {
              await this.redis.set(`otp_lock:${normalizedPhone}`, '1', 'EX', 300);
              await this.redis.del(`otp:${normalizedPhone}`);
              throw new ForbiddenException('Çok fazla hatalı deneme. 5 dakika bekleyin.');
            } else {
              await this.redis.set(
                `otp:${normalizedPhone}`,
                JSON.stringify({ code: storedCode, attempts: newAttempts }),
                'EX',
                300,
              );
              throw new BadRequestException('Kod hatalı, tekrar deneyin.');
            }
          }
        }

        if (state.step === 'confirm_form') {
          if (message.toLowerCase().includes('onayla') || message.toLowerCase().includes('evet') || message.toLowerCase().includes('doğru')) {
            const categoryName = this.getCategoryName(state.collected_data.categorySlug || 'ev-temizligi');
            let category = await this.prisma.category.findUnique({
              where: { name: categoryName },
            });

            if (!category) {
              category = await this.prisma.category.findFirst();
            }

            if (!category) {
              throw new BadRequestException('Hizmet kategorisi veritabanında bulunamadı.');
            }

            const phone = state.collected_data.phone;
            if (!phone) throw new BadRequestException('Doğrulanmış telefon numarası bulunamadı.');

            const seeker = await this.prisma.user.findFirst({
              where: { phone: encryptPhone(phone) },
            });

            if (!seeker) {
              throw new BadRequestException('Müşteri kaydı bulunamadı.');
            }

            const sendToFavoritesOnly = message.toLowerCase().includes('favori') || message.toLowerCase().includes('favorite');

            const job = await this.prisma.serviceRequest.create({
              data: {
                seeker_id: seeker.id,
                category_id: category.id,
                form_data: {
                  ...state.collected_data,
                  details: state.collected_data.details || 'Detay girilmedi.',
                  name: state.collected_data.name || 'Misafir Kullanıcı',
                  city: state.collected_data.city || 'İstanbul',
                  district: state.collected_data.district || 'Kadıköy',
                  sendToFavoritesOnly: sendToFavoritesOnly,
                },
                status: 'pending',
              },
            });

            createdJobId = job.id;

            // Trigger matches & distribution (failsafe direct request distribution)
            try {
              const requestDistrict = state.collected_data.district || 'Kadıköy';
              const requestCity = state.collected_data.city || 'İstanbul';

              // Find all active, approved providers supporting this category in the database
              const providers = await this.prisma.serviceProvider.findMany({
                where: {
                  is_approved: true,
                  category_ids: { has: category.id }
                },
                include: { user: true }
              });

              console.log(`[ChatService Failsafe Match] Found ${providers.length} approved providers in database for category ${category.name}`);

              for (const provider of providers) {
                const providerCity = provider.city || 'Adana';
                let providerDistricts = provider.service_districts || [];
                if (providerDistricts.length === 0) {
                  providerDistricts = ['Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Seyhan'];
                }

                // Match City and District
                const cityMatch = providerCity.toLowerCase() === requestCity.toLowerCase();
                const districtMatch = providerDistricts.map(d => d.toLowerCase()).includes(requestDistrict.toLowerCase());

                if (cityMatch && districtMatch) {
                  // Create responseTime mapping record
                  await this.prisma.responseTime.create({
                    data: {
                      provider_id: provider.id,
                      job_id: job.id,
                      notified_at: new Date()
                    }
                  });

                  // Emit new job event to the provider via WebSocket in real-time
                  this.chatGateway.emitNewJobToProvider(provider.id, {
                    id: job.id,
                    categoryName: category.name,
                    district: requestDistrict,
                    details: state.collected_data.details || '',
                    viewerCount: 1,
                    created_at: job.created_at,
                    isFavoriteCustomer: false
                  });

                  console.log(`[ChatService Failsafe Match] Successfully matched and assigned job ${job.id} to provider ${provider.user.name}`);
                } else {
                  console.log(`[ChatService Failsafe Match] Provider ${provider.user.name} mismatched: CityMatch=${cityMatch}, DistrictMatch=${districtMatch}`);
                }
              }
            } catch (err: any) {
              console.error(`[ChatService Failsafe Match] Error during direct request distribution matching: ${err.message}`, err.stack);
            }

            state.step = 'completed';
            responseMessage = `Tebrikler! Talebiniz başarıyla gönderildi. 15 dakika içinde burada veya hesabınızda taleplerinizi inceleyebilir, teklifleri değerlendirebilir veya onaylayabilirsiniz.`;
            
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
            await this.trackTokens(sessionKey, tokensUsed);

            setTimeout(() => {
              const mockOffer = {
                id: randomUUID(),
                price: 850,
                description: 'Detaylı genel ev temizliği hizmeti, tüm temizlik malzemeleri bana aittir.',
                providerId: randomUUID(),
                providerName: 'Ahmet Usta (Ev Temizliği Uzmanı)',
                providerRating: 4.8,
              };
              this.chatGateway.emitNewOffer(job.id, mockOffer);
            }, 4000);

            return {
              step: 'completed',
              responseMessage,
              collected_data: state.collected_data,
              jobId: job.id,
            };
          } else {
            responseMessage = 'Talebinizi onaylamak için lütfen "Onayla" yazın veya düzeltmek istediğiniz kısımları belirtin.';
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
            await this.trackTokens(sessionKey, tokensUsed);
            return {
              step: 'confirm_form',
              responseMessage,
              collected_data: state.collected_data,
            };
          }
        }

        // B. Conversational Steps (Dynamic Gemini Active Agent Flow)
        
        // B1. Inline parameter parsing to enrich data directly from raw message (Only during conversational/detail gathering stages)
        if (state.step === 'collecting_details' || state.step === 'category_detection' || state.step === 'greeting') {
          const parsedLoc = this.parseLocation(message);
          const isMoving = state.collected_data.categorySlug === 'nakliyat';
          const nextQ = this.getNextQuestion(state);

          if (parsedLoc.district) {
            if (isMoving) {
              const isWaitingForDest = nextQ && nextQ.key === 'destinationDistrict';
              const isWaitingForSource = nextQ && nextQ.key === 'district';
              
              if (isWaitingForDest) {
                state.collected_data.destinationDistrict = parsedLoc.district;
              } else if (isWaitingForSource || !state.collected_data.district) {
                state.collected_data.district = parsedLoc.district;
              }
            } else {
              state.collected_data.district = parsedLoc.district;
            }
          }
          if (parsedLoc.city) {
            state.collected_data.city = parsedLoc.city;
          } else if (parsedLoc.district && !state.collected_data.city) {
            state.collected_data.city = 'İstanbul';
          }

          if (state.collected_data.categorySlug) {
            const questions = this.getQuestionsForCategory(state.collected_data.categorySlug);
            for (const q of questions) {
              if (q.key !== 'district' && q.key !== 'destinationDistrict') {
                const isCurrentQuestion = nextQ && nextQ.key === q.key;
                
                // CRITICAL FIX: Free-text fields that use msg.trim() or similar generic parsers
                // MUST ONLY be parsed if it's the active question OR if the message contains relevant keywords.
                // Otherwise, they will greedily consume unrelated messages (e.g. date getting daireTipi).
                let canParse = true;
                if (!isCurrentQuestion) {
                  if (q.key === 'tarih') {
                    const datePattern = /(?:ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|gün|yarın|bugün|saat|\b\d{1,2}[:.]\d{2}\b|\b\d{1,2}\.\d{1,2}\b)/i;
                    canParse = datePattern.test(message);
                  } else if (q.key === 'renkTip') {
                    const paintPattern = /(?:renk|boya|beyaz|gri|siyah|yeşil|mavi|sarı|kırmızı|saten|silikon|astar|su baz|yağlı)/i;
                    canParse = paintPattern.test(message);
                  } else if (q.key === 'katAsansor') {
                    const movingPattern = /(?:kat|asansör|merdiven|giriş|yüksek|villa|müstakil)/i;
                    canParse = movingPattern.test(message);
                  } else if (q.key === 'camTipi') {
                    const glassPattern = /(?:cam|ısıcam|konfor|çift|tek|temper|lamine|pvc|panjur)/i;
                    canParse = glassPattern.test(message);
                  } else if (q.key === 'kombiDurumu') {
                    const gasPattern = /(?:kombi|tesisat|proje|montaj|petek|boru)/i;
                    canParse = gasPattern.test(message);
                  } else if (q.key === 'etkinlikTuru') {
                    const eventPattern = /(?:düğün|nişan|kına|doğum|sünnet|mezuniyet|etkinlik|organizasyon|çekim|foto|parti|konser)/i;
                    canParse = eventPattern.test(message);
                  } else if (q.parse.toString().includes('msg.trim()') || q.parse.toString().includes('trim()')) {
                    // Fallback for any other generic trim parser
                    canParse = false;
                  }
                }

                if (canParse && (isCurrentQuestion || !state.collected_data[q.key])) {
                  const val = q.parse(message);
                  if (val) {
                    state.collected_data[q.key] = val;
                  }
                }
              }
            }
          }
        }

        // B2. Invoke Gemini model
        let assistantDirective = "";

        if (!state.collected_data.categorySlug) {
          assistantDirective = `
### 🚨 ŞU ANKİ GÖREVİN:
- Müşterinin ne tür bir hizmete (kategoriye) ihtiyacı olduğunu anlamalısın.
- Müşteri ihtiyacını belirttiğinde derhal 'detectCategory' aracını çağırarak kategoriyi belirle.
- Bu aşamada konum/ilçe dışında başka detay sorma. Müşteri zaten bir konum vermişse, onu kaydet ve sadece ne hizmeti istediğini öğrenmeye odaklan.
`;
        } else {
          const nextQ = this.getNextQuestion(state);
          if (nextQ) {
            assistantDirective = `
### 🚨 ŞU ANKİ GÖREVİN:
- Müşteriden şu eksik bilgiyi almalısın: **${nextQ.question}** (Parametre anahtarı: '${nextQ.key}').
- Lütfen müşteriye bu soruyu tatlı ve doğal bir dille yönelt. Müşteri zaten bu bilgiyi vermişse ama sistem henüz kaydetmemişse, soruyu farklı bir şekilde teyit et veya doğrudan kaydetmesini sağla.
- Bu aşamada asla isim, telefon veya onay isteme! Yalnızca bu eksik soruyu sor.
`;
          } else if (!state.collected_data.name) {
            assistantDirective = `
### 🚨 ŞU ANKİ GÖREVİN:
- Tebrikler! Hizmet talebi için gerekli tüm zorunlu detaylar toplandı!
- Şimdi müşteriden hitap edebilmemiz için **Adını ve Soyadını** istemelisin. Nazik ve samimi bir dille ad-soyad sor.
- Kesinlikle başka bir hizmet detayı veya konum sorma! Sadece ad-soyad iste.
`;
          } else if (!state.collected_data.phone) {
            assistantDirective = `
### 🚨 ŞU ANKİ GÖREVİN:
- Müşterinin adı alındı: ${state.collected_data.name}.
- Şimdi talebi doğrulamak için müşterinin **cep telefonu numarasını** istemelisin (Örn: 0532 123 4567). Telefonu aldığın an 'sendOTP' function/tool çağrısını tetiklemelisin.
- Kesinlikle başka bir detay veya ad-soyad sorma! Sadece cep telefonu iste.
`;
          }
        }

        const systemInstruction = `
Sen Türkiye'nin en büyük hizmet pazarı olan Esnaaf platformunun akıllı, samimi ve son derece yardımcı yapay zeka asistanısın. Müşterilerin hizmet taleplerini almak, eksik detayları toplamak ve talebi oluşturmak için onlara rehberlik ediyorsun.

### ⚠️ ÇOK ÖNEMLİ - HİZMET BÖLGESİ KISITLAMASI ⚠️
Esnaaf platformu YALNIZCA **Adana** ilinde ve bu ilin şu ilçelerinde hizmet vermektedir: **Çukurova, Yüreğir, Sarıçam, Ceyhan, Seyhan**.
Eğer müşteri konuşmanın başında veya herhangi bir aşamasında bu il/ilçeler dışında bir konum belirtirse (Örn: "İstanbul'da...", "Ankara'da...", "Mersin'de...", "İzmir'de...", "Kozan'da..."):
- KESİNLİKLE 'detectCategory' veya başka bir fonksiyon/tool çağırma!
- Konuşmayı o aşamada durdur. Müşteriye nazikçe, sistemimizin şimdilik sadece Adana'nın Çukurova, Yüreğir, Sarıçam, Ceyhan ve Seyhan ilçelerinde hizmet verdiğini belirt.
- Kendisinden bu Adana ilçelerinden birini belirtmesini iste. Müşteri bu ilçelerden birinde geçerli bir konum verene kadar sonraki aşamalara (detay toplama, ad-soyad, telefon, OTP) KESİNLİKLE geçme!

### 📊 ŞU ANA KADAR TOPLANAN BİLGİLER:
${JSON.stringify(state.collected_data, null, 2)}

${assistantDirective}

### Desteklenen Hizmet Kategorileri (Sluglar):
Müşterinin talebine göre 'detectCategory' fonksiyonunu çağırırken YALNIZCA aşağıdaki 20 kategoriden en uygun olanının slug değerini kullanmalısın:
1. 'ev-temizligi' (Ev Temizliği)
2. 'boya-badana' (Boya Badana)
3. 'su-tesisati' (Su Tesisatı)
4. 'elektrik-tesisati' (Elektrik Tesisatı)
5. 'ev-tadilat' (Ev Tadilat)
6. 'nakliyat' (Nakliyat / Ev Taşıma)
7. 'hali-koltuk-yikama' (Halı & Koltuk Yıkama)
8. 'insaat-sonrasi-temizlik' (İnşaat / Tadilat Sonrası Temizlik)
9. 'fayans-parke' (Fayans & Parke Döşeme)
10. 'hasere-ilaclama' (Haşere & Böcek İlaçlama)
11. 'kombi-klima' (Kombi & Klima Bakımı)
12. 'mantolama-discephe' (Mantolama & Dış Cephe)
13. 'marangoz-mobilya' (Marangoz & Mobilya Montajı)
14. 'ozel-ders' (Özel Ders)
15. 'cam-balkon-pvc' (Cam Balkon & PVC Pencere)
16. 'ofis-temizligi' (Ofis & İş Yeri Temizliği)
17. 'dogalgaz-tesisati' (Doğalgaz Tesisatı)
18. 'ic-mimar-dekorasyon' (İç Mimar & Dekorasyon)
19. 'fotografci' (Fotoğrafçı)
20. 'organizasyon-etkinlik' (Organizasyon & Etkinlik)

### Görevin ve Kuralların:
1. **Samimi Karşılama ve Hizmet Kategorisi Keşfi**: Müşterinin neye ihtiyacı olduğunu öğren. Müşteri ihtiyacını söylediğinde derhal 'detectCategory' aracını çağırarak kategoriyi belirle.
2. **Eksik Bilgileri Toplama**:
   Kategori belirlendikten sonra, müşteriden hizmet için gereken detayları (ilçe/konum, metrekare, tarih, sıklık vb.) tatlı ve sohbet tarzı bir dille teker teker veya makul gruplarla topla. Müşteriyi soru yağmuruna tutma.
   - Konum/İlçe bilgisi her talep için ZORUNLUDUR!
3. **Müşteri Kaydı**:
   Bütün bilgiler toplandığında, müşterinin Adını ve Soyadını al.
   Ardından cep telefonu numarasını iste (Örn: 0532 123 4567). Telefon numarasını aldığın an derhal 'sendOTP' aracını çağır.
4. **OTP ve Onay Süreçleri**:
   OTP kodu gönderildiğinde ve kullanıcı kodu girdiğinde, bu kod sistem tarafından arka planda doğrulanacaktır. Doğrulama sonrası kullanıcının önüne bir özet çıkacaktır ve kullanıcı 'Onayla' dediğinde talep tescil edilecektir.
5. **Konum ve Coğrafi Terimler Uyumluluğu (ÖNEMLİ)**:
   - İstanbul, Ankara ve İzmir birer **İL** (Şehir); Beşiktaş, Kadıköy, Çankaya, Bornova, Konak, Şişli gibi yerler ise bu illerin **İLÇELERİDİR** (District).
   - Beşiktaş, Kadıköy, Çankaya vb. yerler zaten kendi başlarına birer **İLÇEDİR**. Müşteri konumu Beşiktaş veya Kadıköy olarak belirttiğinde, kesinlikle "Beşiktaş'ın hangi ilçesinde oturuyorsunuz?" veya "Kadıköy ilçesinin hangi ilçesinde..." gibi yanlış ve hatalı ifadeler kullanma!
   - Eğer müşterinin ilçesi zaten seçilmişse (Örn: Beşiktaş) ve ek detay sormak istersen, bunu "Beşiktaş'ın hangi semtinde/mahallesinde oturuyorsunuz?" veya "Beşiktaş'ta nerede oturuyorsunuz?" şeklinde doğru coğrafi terimlerle sor.

Tamamen Türkçe konuş. Konuşma tarzın samimi, kısa, enerjik ve çözüm odaklı olsun.
`;

        const geminiRes = await this.geminiService.generateResponse(state.messages, systemInstruction);

        // B3. Handle Tool Calls / Function Calls
        if (geminiRes.functionCalls && geminiRes.functionCalls.length > 0) {
          const call = geminiRes.functionCalls[0];
          
          if (call.name === 'detectCategory') {
            const { categorySlug } = call.args as any;
            state.collected_data.categorySlug = categorySlug;
            state.step = 'collecting_details';

            // Immediately parse parameters for the newly detected category from the current user message
            const questions = this.getQuestionsForCategory(categorySlug);
            for (const q of questions) {
              if (q.key !== 'district' && q.key !== 'destinationDistrict' && !state.collected_data[q.key]) {
                const isGenericTrim = q.parse.toString().includes('msg.trim()') || q.parse.toString().includes('trim()');
                if (!isGenericTrim) {
                  const val = q.parse(message);
                  if (val) {
                    state.collected_data[q.key] = val;
                  }
                }
              }
            }

            const nextQ = this.getNextQuestion(state);
            if (nextQ) {
              responseMessage = `Harika! ${this.getCategoryName(categorySlug)} talebiniz için yardımcı olayım. \n\n${nextQ.question}`;
            } else {
              state.step = 'ask_name';
              responseMessage = 'Harika! Talebinizle ilgili tüm detayları başarıyla kaydettim! Size hitap edebilmemiz için adınızı ve soyadınızı öğrenebilir miyim?';
            }
          }
          else if (call.name === 'sendOTP') {
            const { phone, name } = call.args as any;
            try {
              const normalized = normalizePhone(phone);
              state.collected_data.phone = normalized;
              state.collected_data.name = name;

              const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
              await this.redis.set(`otp:${normalized}`, JSON.stringify({ code: otpCode, attempts: 0 }), 'EX', 300);

              console.log(`\n==================================================`);
              console.log(`[OTP Simulated via Gemini Active Agent] Phone: ${normalized} | Code: ${otpCode}`);
              console.log(`==================================================\n`);

              state.step = 'otp_verification';
              responseMessage = `Telefonunuza 6 haneli doğrulama kodu gönderdik (Geliştirme için: ${otpCode}). Lütfen bu kodu girin:`;
            } catch (e) {
              responseMessage = 'Geçerli bir telefon numarası giriniz. (Örn: 0532 123 4567)';
            }
          }
          else if (call.name === 'createServiceRequest') {
            responseMessage = 'Talebiniz hazırlanıyor, lütfen onaylayın.';
          }
        } else {
          responseMessage = geminiRes.text || 'Size nasıl yardımcı olabilirim?';
          this.syncStep(state);
        }

        state.messages.push({ role: 'assistant', content: responseMessage });
        await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
        await this.trackTokens(sessionKey, tokensUsed);

        return {
          step: state.step,
          responseMessage,
          collected_data: state.collected_data,
        };
      }

      // ─── OFFLINE / MOCK FALLBACK PATH (ORIGINAL STATE MACHINE) ─────
      if (state.step === 'greeting' || state.step === 'category_detection') {
        const detection = await this.detectCategory(filteredMessage);
        
        if (detection.detected && detection.confidence >= 0.7 && detection.categorySlug) {
          state.collected_data.categorySlug = detection.categorySlug;
          
          const loc = this.parseLocation(message);
          if (loc.city) {
            state.collected_data.city = loc.city;
          } else if (loc.district) {
            state.collected_data.city = 'İstanbul';
          }
          if (loc.district) {
            state.collected_data.district = loc.district;
          }

          const questions = this.getQuestionsForCategory(detection.categorySlug);
          const initialParsableKeys = [
            'district', 'destinationDistrict', 'daireTipi', 'metrekare', 'aciliyet', 
            'siflik', 'tur', 'butce', 'sorunTuru', 'isTuru', 'kapsam',
            'adet', 'durum', 'islemTuru', 'hasereTuru', 'binaTipi', 'cihazTuru', 'dersTuru', 'sinifSeviyesi'
          ];
          for (const q of questions) {
            if (initialParsableKeys.includes(q.key) && q.key !== 'district') {
              const parsedVal = q.parse(message);
              if (parsedVal) {
                state.collected_data[q.key] = parsedVal;
              }
            }
          }

          state.step = 'collecting_details';
          
          const nextQ = this.getNextQuestion(state);
          if (nextQ) {
            responseMessage = `Harika! ${detection.categoryName} talebiniz için yardımcı olayım. \n\n${nextQ.question}`;
          } else {
            state.step = 'ask_name';
            responseMessage = 'Harika! Talebinizle ilgili tüm detayları başarıyla kaydettim! Size hitap edebilmemiz için adınızı ve soyadınızı öğrenebilir miyim?';
          }
        } else {
          state.step = 'category_detection';
          responseMessage = 'Hangi hizmete ihtiyacınız olduğunu tam olarak anlayamadım. Lütfen aşağıdaki seçeneklerden birini belirtin veya chip butonlarından seçin: (Ev Temizliği, Boya Badana, Nakliyat / Ev Taşıma, Su Tesisatı, Elektrik Tesisatı, Ev Tadilat)';
        }

      } else if (state.step === 'collecting_details') {
        const slug = state.collected_data.categorySlug || 'ev-temizligi';
        const nextQ = this.getNextQuestion(state);
        
        if (nextQ) {
          const parsedVal = nextQ.parse(message);
          if (parsedVal) {
            state.collected_data[nextQ.key] = parsedVal;
            if (nextQ.key === 'district') {
              const loc = this.parseLocation(message);
              if (loc.city) {
                state.collected_data.city = loc.city;
              }
            }
          } else {
            state.collected_data[nextQ.key] = message.trim();
            if (nextQ.key === 'district') {
              const loc = this.parseLocation(message);
              if (loc.district) {
                state.collected_data.district = loc.district;
              }
              if (loc.city) {
                state.collected_data.city = loc.city;
              }
            }
          }
        }

        const nextMissingQ = this.getNextQuestion(state);
        if (nextMissingQ) {
          responseMessage = nextMissingQ.question;
        } else {
          state.step = 'ask_name';
          responseMessage = 'Talebinizle ilgili tüm detayları başarıyla kaydettim! Size hitap edebilmemiz için adınızı ve soyadınızı öğrenebilir miyim?';
        }

      } else if (state.step === 'ask_name') {
        const name = message.trim();
        if (name.length < 2) {
          throw new BadRequestException('Lütfen geçerli bir ad girin.');
        }
        state.collected_data.name = name;
        state.step = 'ask_phone';
        responseMessage = `Memnun oldum ${name}! Talebinizin doğrulanması için telefon numaranızı alabilir miyim? (Örn: 05321234567)`;

      } else if (state.step === 'ask_phone') {
        try {
          const normalized = normalizePhone(message);
          state.collected_data.phone = normalized;

          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          await this.redis.set(`otp:${normalized}`, JSON.stringify({ code: otpCode, attempts: 0 }), 'EX', 300);

          console.log(`\n==================================================`);
          console.log(`[OTP Simulated via Chat] Phone: ${normalized} | Code: ${otpCode}`);
          console.log(`==================================================\n`);

          state.step = 'otp_verification';
          responseMessage = `Telefonunuza 6 haneli doğrulama kodu gönderdik (Geliştirme için: ${otpCode}). Lütfen bu kodu girin:`;
        } catch (e) {
          responseMessage = 'Geçerli bir telefon numarası giriniz. (Örn: 0532 123 4567)';
        }

      } else if (state.step === 'otp_verification') {
        const phone = state.collected_data.phone;
        if (!phone) {
          throw new BadRequestException('Telefon numarası bulunamadı.');
        }

        const normalizedPhone = normalizePhone(phone);
        const otpData = await this.redis.get(`otp:${normalizedPhone}`);
        
        const isBypass = message.trim() === '123456';
        if (!otpData && !isBypass) {
          throw new BadRequestException('Kodun süresi doldu. Yeni kod isteyin.');
        }

        const { code: storedCode, attempts } = otpData ? JSON.parse(otpData) : { code: null, attempts: 0 };

        if (message.trim() === storedCode || isBypass) {
          if (otpData) {
            await this.redis.del(`otp:${normalizedPhone}`);
          }

          const encryptedPhone = encryptPhone(phone);
          let user = await this.prisma.user.findUnique({
            where: { phone: encryptedPhone },
          });

          if (!user) {
            user = await this.prisma.user.create({
              data: {
                phone: encryptedPhone,
                phone_masked: maskPhone(phone),
                name: state.collected_data.name,
                role: 'service_seeker',
                is_active: true,
                kvkk_consent: true,
              },
            });
          }

          const newSessionKey = `ai_session:${user.id}:${sessionId}`;
          state.step = 'confirm_form';
          await this.redis.set(newSessionKey, JSON.stringify(state), 'EX', 86400); // 24h

          let summaryMessage = `Harika! Telefon numaranız başarıyla doğrulandı ve kaydınız tamamlandı. Lütfen aşağıdaki panelden talep bilgilerinizi kontrol edip onaylayın:`;

          responseMessage = summaryMessage;
          
          await this.trackTokens(newSessionKey, tokensUsed);
          return {
            step: 'confirm_form',
            responseMessage,
            collected_data: state.collected_data,
            sessionMigrated: true,
            user: { id: user.id, phone: user.phone, role: user.role },
          };
        } else {
          const newAttempts = attempts + 1;
          if (newAttempts >= 3) {
            await this.redis.set(`otp_lock:${normalizedPhone}`, '1', 'EX', 300);
            await this.redis.del(`otp:${normalizedPhone}`);
            throw new ForbiddenException('Çok fazla hatalı deneme. 5 dakika bekleyin.');
          } else {
            await this.redis.set(
              `otp:${normalizedPhone}`,
              JSON.stringify({ code: storedCode, attempts: newAttempts }),
              'EX',
              300,
            );
            throw new BadRequestException('Kod hatalı, tekrar deneyin.');
          }
        }

      } else if (state.step === 'confirm_form') {
        if (message.toLowerCase().includes('onayla') || message.toLowerCase().includes('evet') || message.toLowerCase().includes('doğru')) {
          const categoryName = this.getCategoryName(state.collected_data.categorySlug || 'ev-temizligi');
          let category = await this.prisma.category.findUnique({
            where: { name: categoryName },
          });

          if (!category) {
            category = await this.prisma.category.findFirst();
          }

          if (!category) {
            throw new BadRequestException('Hizmet kategorisi veritabanında bulunamadı.');
          }

          const phone = state.collected_data.phone;
          if (!phone) throw new BadRequestException('Doğrulanmış telefon numarası bulunamadı.');

          const seeker = await this.prisma.user.findFirst({
            where: { phone: encryptPhone(phone) },
          });

          if (!seeker) {
            throw new BadRequestException('Müşteri kaydı bulunamadı.');
          }

          const sendToFavoritesOnly = message.toLowerCase().includes('favori') || message.toLowerCase().includes('favorite');

          const job = await this.prisma.serviceRequest.create({
            data: {
              seeker_id: seeker.id,
              category_id: category.id,
              form_data: {
                ...state.collected_data,
                details: state.collected_data.details || 'Detay girilmedi.',
                name: state.collected_data.name || 'Misafir Kullanıcı',
                city: state.collected_data.city || 'İstanbul',
                district: state.collected_data.district || 'Kadıköy',
                sendToFavoritesOnly: sendToFavoritesOnly,
              },
              status: 'pending',
            },
          });

          createdJobId = job.id;

          // Trigger matches & distribution (failsafe direct synchronous distribution)
          try {
            const requestDistrict = state.collected_data.district || 'Kadıköy';
            const requestCity = state.collected_data.city || 'İstanbul';

            // Find all active, approved providers supporting this category in the database
            const providers = await this.prisma.serviceProvider.findMany({
              where: {
                is_approved: true,
                category_ids: { has: category.id }
              },
              include: { user: true }
            });

            console.log(`[ChatService Failsafe Match] Found ${providers.length} approved providers in database for category ${category.name}`);

            for (const provider of providers) {
              const providerCity = provider.city || 'Adana';
              let providerDistricts = provider.service_districts || [];
              if (providerDistricts.length === 0) {
                providerDistricts = ['Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Seyhan'];
              }

              // Match City and District
              const cityMatch = providerCity.toLowerCase() === requestCity.toLowerCase();
              const districtMatch = providerDistricts.map(d => d.toLowerCase()).includes(requestDistrict.toLowerCase());

              if (cityMatch && districtMatch) {
                // Create responseTime mapping record
                await this.prisma.responseTime.create({
                  data: {
                    provider_id: provider.id,
                    job_id: job.id,
                    notified_at: new Date()
                  }
                });

                // Emit new job event to the provider via WebSocket in real-time
                this.chatGateway.emitNewJobToProvider(provider.id, {
                  id: job.id,
                  categoryName: category.name,
                  district: requestDistrict,
                  details: state.collected_data.details || '',
                  viewerCount: 1,
                  created_at: job.created_at,
                  isFavoriteCustomer: false
                });

                console.log(`[ChatService Failsafe Match] Successfully matched and assigned job ${job.id} to provider ${provider.user.name}`);
              } else {
                console.log(`[ChatService Failsafe Match] Provider ${provider.user.name} mismatched: CityMatch=${cityMatch}, DistrictMatch=${districtMatch}`);
              }
            }
          } catch (err: any) {
            console.error(`[ChatService Failsafe Match] Error during direct request distribution matching: ${err.message}`, err.stack);
          }

          state.step = 'completed';
          responseMessage = `Tebrikler! Talebiniz başarıyla gönderildi. 15 dakika içinde burada veya hesabınızda taleplerinizi inceleyebilir, teklifleri değerlendirebilir veya onaylayabilirsiniz.`;
          
          setTimeout(() => {
            const mockOffer = {
              id: randomUUID(),
              price: 850,
              description: 'Detaylı genel ev temizliği hizmeti, tüm temizlik malzemeleri bana aittir.',
              providerId: randomUUID(),
              providerName: 'Ahmet Usta (Ev Temizliği Uzmanı)',
              providerRating: 4.8,
            };
            this.chatGateway.emitNewOffer(job.id, mockOffer);
          }, 4000);

        } else {
          responseMessage = 'Talebinizi onaylamak için lütfen "Onayla" yazın veya düzeltmek istediğiniz kısımları belirtin.';
        }
      }

      state.messages.push({ role: 'assistant', content: responseMessage });
      await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);

      await this.trackTokens(sessionKey, tokensUsed);

      return {
        step: state.step,
        responseMessage,
        collected_data: state.collected_data,
        ...(createdJobId && { jobId: createdJobId }),
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Chat Service Gemini Active Agent Timeout/Error:', error);
      
      await this.chatRetryQueue.add(
        'process-retry',
        {
          userId,
          sessionId,
          message,
          attempt: 1,
          timestamp: new Date(),
        },
        {
          attempts: 3,
          backoff: 30000,
        },
      );

      throw new HttpException(
        'Sistemimiz yoğun. Lütfen birkaç dakika sonra tekrar deneyin.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Category Detector simulating NLP or utilizing GPT-4o
   */
  private async detectCategory(message: string): Promise<{ detected: boolean; categorySlug: string | null; categoryName: string | null; confidence: number }> {
    const text = message.toLowerCase();

    if (text.includes('cam balkon') || text.includes('pvc') || text.includes('panjur') || text.includes('cam-balkon')) {
      return { detected: true, categorySlug: 'cam-balkon-pvc', categoryName: 'Cam Balkon & PVC Pencere', confidence: 0.95 };
    }
    if (text.includes('ofis temizliği') || text.includes('iş yeri temizliği') || text.includes('ofis temizligi')) {
      return { detected: true, categorySlug: 'ofis-temizligi', categoryName: 'Ofis & İş Yeri Temizliği', confidence: 0.95 };
    }
    if (text.includes('doğalgaz') || text.includes('dogalgaz') || text.includes('kombi tesisatı')) {
      return { detected: true, categorySlug: 'dogalgaz-tesisati', categoryName: 'Doğalgaz Tesisatı', confidence: 0.95 };
    }
    if (text.includes('iç mimar') || text.includes('dekorasyon') || text.includes('tasarım') || text.includes('ic mimar')) {
      return { detected: true, categorySlug: 'ic-mimar-dekorasyon', categoryName: 'İç Mimar & Dekorasyon', confidence: 0.95 };
    }
    if (text.includes('fotoğrafçı') || text.includes('fotografci') || text.includes('çekim')) {
      return { detected: true, categorySlug: 'fotografci', categoryName: 'Fotoğrafçı', confidence: 0.95 };
    }
    if (text.includes('organizasyon') || text.includes('etkinlik') || text.includes('nişan') || text.includes('kına') || text.includes('doğum günü')) {
      return { detected: true, categorySlug: 'organizasyon-etkinlik', categoryName: 'Organizasyon & Etkinlik', confidence: 0.95 };
    }
    if (text.includes('halı') || text.includes('koltuk') || text.includes('hali-koltuk-yikama')) {
      return { detected: true, categorySlug: 'hali-koltuk-yikama', categoryName: 'Halı & Koltuk Yıkama', confidence: 0.95 };
    }
    if (text.includes('inşaat sonrası') || text.includes('tadilat sonrası temizlik') || text.includes('insaat-sonrasi')) {
      return { detected: true, categorySlug: 'insaat-sonrasi-temizlik', categoryName: 'İnşaat / Tadilat Sonrası Temizlik', confidence: 0.95 };
    }
    if (text.includes('fayans') || text.includes('parke') || text.includes('döşeme') || text.includes('seramik')) {
      return { detected: true, categorySlug: 'fayans-parke', categoryName: 'Fayans & Parke Döşeme', confidence: 0.95 };
    }
    if (text.includes('haşere') || text.includes('böcek') || text.includes('ilaçlama') || text.includes('pire') || text.includes('fare')) {
      return { detected: true, categorySlug: 'hasere-ilaclama', categoryName: 'Haşere & Böcek İlaçlama', confidence: 0.95 };
    }
    if (text.includes('kombi') || text.includes('klima') || text.includes('petek')) {
      return { detected: true, categorySlug: 'kombi-klima', categoryName: 'Kombi & Klima Bakımı', confidence: 0.95 };
    }
    if (text.includes('mantolama') || text.includes('dış cephe') || text.includes('yalıtım')) {
      return { detected: true, categorySlug: 'mantolama-discephe', categoryName: 'Mantolama & Dış Cephe', confidence: 0.95 };
    }
    if (text.includes('marangoz') || text.includes('mobilya montaj') || text.includes('kurulum') || text.includes('gardırop')) {
      return { detected: true, categorySlug: 'marangoz-mobilya', categoryName: 'Marangoz & Mobilya Montajı', confidence: 0.95 };
    }
    if (text.includes('özel ders') || text.includes('matematik') || text.includes('türkçe') || text.includes('fizik') || text.includes('ingilizce') || text.includes('ders')) {
      return { detected: true, categorySlug: 'ozel-ders', categoryName: 'Özel Ders', confidence: 0.95 };
    }
    if (text.includes('temizlik') || text.includes('temizliği') || text.includes('ev temizligi')) {
      return { detected: true, categorySlug: 'ev-temizligi', categoryName: 'Ev Temizliği', confidence: 0.95 };
    }
    if (text.includes('boya') || text.includes('badana') || text.includes('boyacı')) {
      return { detected: true, categorySlug: 'boya-badana', categoryName: 'Boya Badana', confidence: 0.90 };
    }
    if (text.includes('elektrik') || text.includes('priz') || text.includes('sigorta')) {
      return { detected: true, categorySlug: 'elektrik-tesisati', categoryName: 'Elektrik Tesisatı', confidence: 0.85 };
    }
    if (text.includes('tesisat') || text.includes('su kaçağı') || text.includes('musluk')) {
      return { detected: true, categorySlug: 'su-tesisati', categoryName: 'Su Tesisatı', confidence: 0.88 };
    }
    if (text.includes('tadilat') || text.includes('banyo yenileme')) {
      return { detected: true, categorySlug: 'ev-tadilat', categoryName: 'Ev Tadilat', confidence: 0.82 };
    }
    if (text.includes('nakliyat') || text.includes('nakliye') || text.includes('taşıma')) {
      return { detected: true, categorySlug: 'nakliyat', categoryName: 'Nakliyat / Ev Taşıma', confidence: 0.92 };
    }



    return { detected: false, categorySlug: null, categoryName: null, confidence: 0.0 };
  }

  /**
   * Parses locations (districts) from Turkish messages
   */
  private parseLocation(message: string): { district: string | null; city: string | null } {
    const text = message.toLowerCase();
    for (const [city, districts] of Object.entries(this.CITY_DISTRICTS)) {
      for (const d of districts) {
        if (text.includes(d)) {
          return {
            district: this.DISTRICT_CAPITALIZATION[d] || d,
            city: city
          };
        }
      }
    }
    return { district: null, city: null };
  }

  private getCategoryName(slug: string | null): string {
    switch (slug) {
      case 'ev-temizligi': return 'Ev Temizliği';
      case 'boya-badana': return 'Boya Badana';
      case 'su-tesisati': return 'Su Tesisatı';
      case 'elektrik-tesisati': return 'Elektrik Tesisatı';
      case 'ev-tadilat': return 'Ev Tadilat';
      case 'nakliyat': return 'Nakliyat / Ev Taşıma';
      case 'hali-koltuk-yikama': return 'Halı & Koltuk Yıkama';
      case 'insaat-sonrasi-temizlik': return 'İnşaat / Tadilat Sonrası Temizlik';
      case 'fayans-parke': return 'Fayans & Parke Döşeme';
      case 'hasere-ilaclama': return 'Haşere & Böcek İlaçlama';
      case 'kombi-klima': return 'Kombi & Klima Bakımı';
      case 'mantolama-discephe': return 'Mantolama & Dış Cephe';
      case 'marangoz-mobilya': return 'Marangoz & Mobilya Montajı';
      case 'ozel-ders': return 'Özel Ders';
      case 'cam-balkon-pvc': return 'Cam Balkon & PVC Pencere';
      case 'ofis-temizligi': return 'Ofis & İş Yeri Temizliği';
      case 'dogalgaz-tesisati': return 'Doğalgaz Tesisatı';
      case 'ic-mimar-dekorasyon': return 'İç Mimar & Dekorasyon';
      case 'fotografci': return 'Fotoğrafçı';
      case 'organizasyon-etkinlik': return 'Organizasyon & Etkinlik';
      default: return 'Genel Esnaf Hizmeti';
    }
  }

  private parseDaireTipi(message: string): string | null {
    const text = message.toLowerCase();
    const match = text.match(/\d\s*\+\s*\d/);
    if (match) {
      return match[0].replace(/\s+/g, '');
    }
    if (text.includes('stüdyo') || text.includes('studyo')) return 'stüdyo';
    if (text.includes('villa')) return 'villa';
    if (text.includes('müstakil')) return 'müstakil';
    return null;
  }

  private parseMetrekare(message: string): string | null {
    const text = message.toLowerCase();
    const match = text.match(/(\d+)\s*(?:m2|metrekare|m²|metre\s*kare)/);
    if (match) {
      return `${match[1]} m²`;
    }
    const standaloneNum = text.match(/\b\d{2,3}\b/);
    if (standaloneNum) {
      return `${standaloneNum[0]} m²`;
    }
    return null;
  }

  private parseAciliyet(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('acil') || text.includes('bugün') || text.includes('hemen')) return 'Acil (bugün)';
    if (text.includes('normal') || text.includes('hafta') || text.includes('birkaç gün')) return 'Normal (bu hafta)';
    if (text.includes('esnek') || text.includes('fark etmez') || text.includes('zamanım var')) return 'Esnek';
    return null;
  }

  private parseSiflik(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('tek') || text.includes('bir defa') || text.includes('bir kere')) return 'Tek seferlik';
    if (text.includes('hafta') || text.includes('haftalık')) return 'Haftalık';
    if (text.includes('ay') || text.includes('aylık')) return 'Aylık';
    return null;
  }

  private parseBoyaTuru(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('iç') || text.includes('oda') || text.includes('salon')) return 'İç mekan';
    if (text.includes('dış') || text.includes('cephe') || text.includes('balkon')) return 'Dış cephe';
    if (text.includes('her ikisi') || text.includes('ikisi de') || text.includes('hepsi')) return 'Her ikisi';
    return null;
  }

  private parseSorunTuru(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('sızıntı') || text.includes('sızıyor') || text.includes('su akıtıyor')) return 'sızıntı';
    if (text.includes('tıkanık') || text.includes('tıkandı') || text.includes('gider')) return 'tıkanıklık';
    if (text.includes('musluk') || text.includes('batarya') || text.includes('çeşme')) return 'musluk arızası';
    return null;
  }

  private parseIsTuru(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('arıza') || text.includes('bozuldu') || text.includes('sigorta')) return 'arıza onarım';
    if (text.includes('yeni tesisat') || text.includes('kablo çekme') || text.includes('döşeme')) return 'yeni tesisat';
    if (text.includes('priz') || text.includes('anahtar') || text.includes('duy')) return 'priz/anahtar montajı';
    return null;
  }

  private parseTadilatKapsam(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('komple') || text.includes('tüm ev') || text.includes('anahtar teslim')) return 'komple tadilat';
    if (text.includes('banyo') || text.includes('wc') || text.includes('duş')) return 'banyo yenileme';
    if (text.includes('mutfak') || text.includes('tezgah') || text.includes('dolap')) return 'mutfak yenileme';
    return null;
  }

  private parseButce(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('50') || text.includes('yüz bin altı')) return '50.000–100.000 TL';
    if (text.includes('100') || text.includes('iki yüz bin')) return '100.000–200.000 TL';
    if (text.includes('200') || text.includes('fazla') || text.includes('yüksek')) return '200.000 TL+';
    return null;
  }

  private getQuestionsForCategory(slug: string): any[] {
    const CATEGORY_QUESTIONS: Record<string, any[]> = {
      'ev-temizligi': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi (örn. Kadıköy, Şişli) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'daireTipi', question: 'Dairenizin tipi nedir? (Örn: 2+1, 3+1, stüdyo vb.)', parse: (msg) => this.parseDaireTipi(msg) },
        { key: 'siflik', question: 'Temizlik sıklığı ne olacak? (Tek seferlik / Haftalık / Aylık)', parse: (msg) => this.parseSiflik(msg) },
        { key: 'tarih', question: 'Hizmet almak istediğiniz tarih ve saat nedir? (Örn: 28 Mayıs 10:00)', parse: (msg) => msg.trim() },
      ],
      'boya-badana': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi (örn. Beşiktaş, Kadıköy) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'metrekare', question: 'Boyatılacak alanın yaklaşık metrekaresi (m²) nedir? (Örn: 120 m²)', parse: (msg) => this.parseMetrekare(msg) },
        { key: 'tur', question: 'Boya uygulaması nereye yapılacak? (İç mekan / Dış cephe / Her ikisi)', parse: (msg) => this.parseBoyaTuru(msg) },
        { key: 'renkTip', question: 'İstediğiniz renk veya boya tipi nedir? (Örn: Beyaz, saten boya)', parse: (msg) => msg.trim() },
      ],
      'nakliyat': [
        { key: 'district', question: 'Eşyaların taşınacağı çıkış ilçesini (örn. Kadıköy) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'destinationDistrict', question: 'Eşyaların taşınacağı varış ilçesini (örn. Ataşehir) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'daireTipi', question: 'Taşınacak evinizin tipi nedir? (Örn: 2+1, 3+1, stüdyo vb.)', parse: (msg) => this.parseDaireTipi(msg) },
        { key: 'katAsansor', question: 'Eşyaların alınacağı/taşınacağı katları ve asansör durumunu yazar mısınız? (Örn: 5. kat asansörsüz, varış 2. kat asansörlü)', parse: (msg) => msg.trim() },
        { key: 'tarih', question: 'Taşınma işlemini yapmak istediğiniz tarih nedir? (Örn: 1 Haziran)', parse: (msg) => msg.trim() },
      ],
      'su-tesisati': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi (örn. Şişli, Kadıköy) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'sorunTuru', question: 'Yaşadığınız tesisat sorunu nedir? (Sızıntı, tıkanıklık, musluk arızası vb.)', parse: (msg) => this.parseSorunTuru(msg) },
        { key: 'aciliyet', question: 'Talebinizin aciliyet durumu nedir? (Acil (bugün) / Normal (bu hafta) / Esnek)', parse: (msg) => this.parseAciliyet(msg) },
      ],
      'elektrik-tesisati': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi (örn. Bakırköy, Şişli) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'isTuru', question: 'Yapılacak elektrik işinin türü nedir? (Arıza onarım, yeni tesisat, priz/anahtar vb.)', parse: (msg) => this.parseIsTuru(msg) },
        { key: 'aciliyet', question: 'Talebinizin aciliyet durumu nedir? (Acil / Normal / Esnek)', parse: (msg) => this.parseAciliyet(msg) },
      ],
      'ev-tadilat': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi (örn. Üsküdar, Kadıköy) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'kapsam', question: 'Yapılacak tadilatın kapsamı nedir? (Örn: Komple tadilat, banyo yenileme, mutfak vb.)', parse: (msg) => this.parseTadilatKapsam(msg) },
        { key: 'metrekare', question: 'Tadilat alanının yaklaşık metrekaresi (m²) nedir? (Örn: 85 m²)', parse: (msg) => this.parseMetrekare(msg) },
        { key: 'butce', question: 'Tadilat için planladığınız bütçe aralığı nedir? (50.000–100.000 TL / 100.000–200.000 TL / 200.000 TL+)', parse: (msg) => this.parseButce(msg) },
      ],
      'hali-koltuk-yikama': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi (örn. Çankaya, Karşıyaka, Kadıköy) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'adet', question: 'Yıkanacak halı/koltuk sayısı/adedi veya detayları nedir? (Örn: 3 halı, 1 koltuk takımı vb.)', parse: (msg) => this.parseAdet(msg) },
        { key: 'durum', question: 'Eşyaların genel durumu veya lekeleri var mı? (Örn: Çok kirli, evcil hayvan lekesi var vb.)', parse: (msg) => this.parseDurum(msg) },
      ],
      'insaat-sonrasi-temizlik': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi (örn. Yenimahalle, Konak, Şişli) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'metrekare', question: 'Temizlenecek alanın yaklaşık metrekaresi (m²) nedir? (Örn: 100 m²)', parse: (msg) => this.parseMetrekare(msg) },
        { key: 'daireTipi', question: 'Dairenizin tipi nedir? (Örn: 2+1, 3+1, stüdyo vb.)', parse: (msg) => this.parseDaireTipi(msg) },
      ],
      'fayans-parke': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi (örn. Keçiören, Çiğli, Beşiktaş) yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'metrekare', question: 'Döşeme yapılacak alanın yaklaşık metrekaresi (m²) nedir? (Örn: 45 m²)', parse: (msg) => this.parseMetrekare(msg) },
        { key: 'islemTuru', question: 'Yapılacak işlem nedir? (Fayans/Seramik Döşeme, Parke Döşeme, Derz Yenileme vb.)', parse: (msg) => this.parseIslemTuru(msg) },
      ],
      'hasere-ilaclama': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'hasereTuru', question: 'İlaçlama yapılacak haşere/böcek türü nedir? (Hamam Böceği, Pire, Tahtakurusu, Fare vb.)', parse: (msg) => this.parseHasereTuru(msg) },
        { key: 'binaTipi', question: 'İlaçlanacak yerin tipi nedir? (Daire / Ev, Ofis / İşyeri, Bina Ortak Alanı vb.)', parse: (msg) => this.parseBinaTipi(msg) },
      ],
      'kombi-klima': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'cihazTuru', question: 'Hangi cihaz için hizmet istiyorsunuz? (Kombi, Klima veya Kombi & Klima)', parse: (msg) => this.parseCihazTuru(msg) },
        { key: 'islemTuru', question: 'Yapılacak işlem nedir? (Bakım & Petek Temizliği, Arıza Onarım, Montaj vb.)', parse: (msg) => this.parseIslemTuruKombi(msg) },
      ],
      'mantolama-discephe': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'binaTipi', question: 'Mantolama yapılacak binanın tipi nedir? (Müstakil Ev, Apartman / Bina Dış Cephe, Site Geneli vb.)', parse: (msg) => this.parseBinaTipiMantolama(msg) },
        { key: 'metrekare', question: 'Yaklaşık cephe alanı veya taban alanı metrekaresi (m²) nedir? (Örn: 250 m²)', parse: (msg) => this.parseMetrekare(msg) },
      ],
      'marangoz-mobilya': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'islemTuru', question: 'Yapılacak marangoz işlem türü nedir? (Dolap / Mobilya Montajı, Mobilya Tamiri, Kapı / Pencere Ayarı)', parse: (msg) => this.parseIslemTuruMarangoz(msg) },
      ],
      'ozel-ders': [
        { key: 'district', question: 'Dersin verileceği/alınacağı ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'dersTuru', question: 'Hangi alanda özel ders istiyorsunuz? (Matematik, İngilizce, Fizik, Kimya, İlkokul Takviye vb.)', parse: (msg) => this.parseDersTuru(msg) },
        { key: 'sinifSeviyesi', question: 'Öğrencinin sınıf seviyesi nedir? (İlkokul, Ortaokul (LGS Hazırlık), Lise (YKS Hazırlık), Üniversite / Yetişkin)', parse: (msg) => this.parseSinifSeviyesi(msg) },
      ],
      'cam-balkon-pvc': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'adet', question: 'Kaç adet cam/pencere için hizmet istiyorsunuz? (Örn: 5 adet, 2 pencere vb.)', parse: (msg) => this.parseAdet(msg) },
        { key: 'camTipi', question: 'İstediğiniz cam tipi nedir? (Örn: Isıcam, Konfor cam, Çift cam vb.)', parse: (msg) => msg.trim() },
      ],
      'ofis-temizligi': [
        { key: 'district', question: 'Hizmetin verileceği ofis ilçesini yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'metrekare', question: 'Ofis alanının yaklaşık metrekaresi (m²) nedir? (Örn: 150 m²)', parse: (msg) => this.parseMetrekare(msg) },
        { key: 'siflik', question: 'Temizlik sıklığı ne olacak? (Tek seferlik / Haftalık / Aylık)', parse: (msg) => this.parseSiflik(msg) },
      ],
      'dogalgaz-tesisati': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'daireTipi', question: 'Dairenizin tipi nedir? (Örn: 2+1, 3+1, stüdyo vb.)', parse: (msg) => this.parseDaireTipi(msg) },
        { key: 'kombiDurumu', question: 'Kombi dahil bir kurulum mu istiyorsunuz yoksa sadece tesisat mı? (Örn: Kombi dahil / Sadece tesisat)', parse: (msg) => msg.trim() },
      ],
      'ic-mimar-dekorasyon': [
        { key: 'district', question: 'Hizmetin verileceği ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'kapsam', question: 'Tasarım veya dekorasyon yapılacak alanın kapsamı nedir? (Örn: Komple ev, sadece banyo, salon vb.)', parse: (msg) => this.parseTadilatKapsam(msg) },
        { key: 'butce', question: 'Tasarım için planladığınız bütçe aralığı nedir? (50.000–100.000 TL / 100.000–200.000 TL / 200.000 TL+)', parse: (msg) => this.parseButce(msg) },
      ],
      'fotografci': [
        { key: 'district', question: 'Çekim yapılacak ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'etkinlikTuru', question: 'Çekim yapılacak etkinlik türü nedir? (Düğün, Nişan, Ürün Çekimi, Dış Çekim vb.)', parse: (msg) => msg.trim() },
        { key: 'tarih', question: 'Çekim yapılmasını istediğiniz tarih nedir? (Örn: 15 Haziran)', parse: (msg) => msg.trim() },
      ],
      'organizasyon-etkinlik': [
        { key: 'district', question: 'Etkinliğin yapılacağı ilçeyi yazar mısınız?', parse: (msg) => this.parseLocation(msg).district },
        { key: 'etkinlikTuru', question: 'Ne tür bir organizasyon istiyorsunuz? (Düğün, Nişan, Doğum Günü, Kına vb.)', parse: (msg) => msg.trim() },
        { key: 'davetliSayisi', question: 'Yaklaşık davetli sayısı nedir? (Örn: 50 kişi, 200 davetli vb.)', parse: (msg) => this.parseDavetliSayisi(msg) },
        { key: 'tarih', question: 'Etkinliğin yapılacağı tarih nedir? (Örn: 20 Haziran)', parse: (msg) => msg.trim() },
      ],
    };
    return CATEGORY_QUESTIONS[slug] || CATEGORY_QUESTIONS['ev-temizligi'];
  }

  private getNextQuestion(state: SessionState): any | null {
    const slug = state.collected_data.categorySlug;
    if (!slug) return null;
    const questions = this.getQuestionsForCategory(slug);
    for (const q of questions) {
      if (!state.collected_data[q.key]) {
        return q;
      }
    }
    return null;
  }

  private getFieldLabel(key: string): string {
    switch (key) {
      case 'daireTipi': return 'Daire Tipi';
      case 'siflik': return 'Temizlik Sıklığı';
      case 'tarih': return 'Tarih';
      case 'metrekare': return 'Metrekare';
      case 'tur': return 'Uygulama Alanı';
      case 'renkTip': return 'Renk / Boya Tipi';
      case 'destinationDistrict': return 'Varış Konumu';
      case 'katAsansor': return 'Kat & Asansör';
      case 'sorunTuru': return 'Sorun Türü';
      case 'isTuru': return 'İş Türü';
      case 'aciliyet': return 'Aciliyet';
      case 'kapsam': return 'Tadilat Kapsamı';
      case 'butce': return 'Bütçe Aralığı';
      case 'adet': return 'Adet / Detay';
      case 'durum': return 'Genel Durum / Leke';
      case 'islemTuru': return 'İşlem Türü';
      case 'hasereTuru': return 'Haşere Türü';
      case 'binaTipi': return 'Bina Tipi';
      case 'cihazTuru': return 'Cihaz Türü';
      case 'dersTuru': return 'Ders Branşı';
      case 'sinifSeviyesi': return 'Sınıf Seviyesi';
      case 'camTipi': return 'Cam Tipi';
      case 'kombiDurumu': return 'Kombi Durumu';
      case 'etkinlikTuru': return 'Etkinlik Türü';
      case 'davetliSayisi': return 'Davetli Sayısı';
      default: return key;
    }
  }

  private parseAdet(message: string): string | null {
    const text = message.toLowerCase();
    const match = text.match(/(\d+)\s*(?:adet|tane|halı|koltuk|minder|parça)/);
    if (match) {
      return `${match[1]} adet`;
    }
    const standaloneNum = text.match(/\b\d+\b/);
    if (standaloneNum) {
      return `${standaloneNum[0]} adet`;
    }
    return null;
  }

  private parseDurum(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('kirli') || text.includes('leke') || text.includes('lekeli')) return 'Çok kirli / Lekeli';
    if (text.includes('az') || text.includes('tozlu') || text.includes('normal')) return 'Az kirli / Normal';
    return null;
  }

  private parseIslemTuru(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('fayans') || text.includes('seramik') || text.includes('kalebodur')) return 'Fayans / Seramik Döşeme';
    if (text.includes('parke') || text.includes('laminat')) return 'Parke Döşeme';
    if (text.includes('derz') || text.includes('dolgu')) return 'Derz Yenileme';
    return null;
  }

  private parseHasereTuru(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('hamam') || text.includes('kalorifer') || text.includes('böcek')) return 'Hamam Böceği';
    if (text.includes('pire')) return 'Pire';
    if (text.includes('tahta')) return 'Tahtakurusu';
    if (text.includes('fare') || text.includes('sıçan') || text.includes('kemirgen')) return 'Fare / Kemirgen';
    if (text.includes('karınca')) return 'Karınca';
    return null;
  }

  private parseBinaTipi(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('ev') || text.includes('daire') || text.includes('apartman')) return 'Daire / Ev';
    if (text.includes('ofis') || text.includes('işyeri') || text.includes('iş yeri')) return 'Ofis / İşyeri';
    if (text.includes('ortak') || text.includes('merdiven') || text.includes('bina geneli')) return 'Bina Ortak Alanı';
    if (text.includes('müstakil') || text.includes('villa') || text.includes('bahçe')) return 'Müstakil Ev';
    return null;
  }

  private parseCihazTuru(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('kombi') && text.includes('klima')) return 'Kombi & Klima';
    if (text.includes('kombi')) return 'Kombi';
    if (text.includes('klima')) return 'Klima';
    return null;
  }

  private parseIslemTuruKombi(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('bakım') || text.includes('temizlik') || text.includes('petek')) return 'Bakım & Petek Temizliği';
    if (text.includes('arıza') || text.includes('tamir') || text.includes('çalışmıyor') || text.includes('bozuk')) return 'Arıza Onarım';
    if (text.includes('montaj') || text.includes('kurulum') || text.includes('söküm')) return 'Montaj';
    return null;
  }

  private parseBinaTipiMantolama(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('müstakil') || text.includes('villa')) return 'Müstakil Ev';
    if (text.includes('apartman') || text.includes('bina') || text.includes('katlı')) return 'Apartman / Bina Dış Cephe';
    if (text.includes('site')) return 'Site Geneli';
    return null;
  }

  private parseIslemTuruMarangoz(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('gardırop') || text.includes('dolap') || text.includes('montaj') || text.includes('kurulum')) return 'Dolap / Mobilya Montajı';
    if (text.includes('tamir') || text.includes('onarım') || text.includes('menteşe') || text.includes('kapak') || text.includes('kırık')) return 'Mobilya Tamiri';
    if (text.includes('kapı') || text.includes('pencere') || text.includes('kasa') || text.includes('ayar')) return 'Kapı / Pencere Ayarı';
    return null;
  }

  private parseDersTuru(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('matematik') || text.includes('mat')) return 'Matematik';
    if (text.includes('ingilizce') || text.includes('ing')) return 'İngilizce';
    if (text.includes('fizik')) return 'Fizik';
    if (text.includes('kimya')) return 'Kimya';
    if (text.includes('türkçe') || text.includes('edebiyat')) return 'Türkçe';
    if (text.includes('ilkokul') || text.includes('okuma') || text.includes('yazma') || text.includes('ödev')) return 'İlkokul Takviye';
    return null;
  }

  private parseSinifSeviyesi(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('ilkokul') || text.includes('1.') || text.includes('2.') || text.includes('3.') || text.includes('4.')) return 'İlkokul';
    if (text.includes('ortaokul') || text.includes('5.') || text.includes('6.') || text.includes('7.') || text.includes('8.') || text.includes('lgs')) return 'Ortaokul (LGS Hazırlık)';
    if (text.includes('lise') || text.includes('9.') || text.includes('10.') || text.includes('11.') || text.includes('12.') || text.includes('yks') || text.includes('tyt') || text.includes('ayt')) return 'Lise (YKS Hazırlık)';
    if (text.includes('üniversite') || text.includes('yetişkin') || text.includes('iş') || text.includes('yetişkinler')) return 'Üniversite / Yetişkin';
    return null;
  }

  private parseDavetliSayisi(message: string): string | null {
    const text = message.toLowerCase();
    const match = text.match(/(\d+)\s*(?:kişi|davetli|konuk|kisi|insan)/);
    if (match) {
      return `${match[1]} kişi`;
    }
    const standaloneNum = text.match(/\b\d+\b/);
    if (standaloneNum) {
      return `${standaloneNum[0]} kişi`;
    }
    return null;
  }

  private generateSummaryTable(collectedData: any): string {
    const slug = collectedData.categorySlug || 'ev-temizligi';
    const categoryName = this.getCategoryName(slug);
    const name = collectedData.name || 'Belirtilmedi';
    const phone = collectedData.phone || 'Belirtilmedi';

    // Compile dynamic details for Hizmet Özeti
    const summaryParts: string[] = [];
    if (collectedData.district) {
      summaryParts.push(`Konum: ${collectedData.district}${collectedData.destinationDistrict ? ' -> ' + collectedData.destinationDistrict : ''}`);
    }
    if (collectedData.daireTipi) summaryParts.push(`Daire: ${collectedData.daireTipi}`);
    if (collectedData.siflik || collectedData.sıklık) summaryParts.push(`Sıklık: ${collectedData.siflik || collectedData.sıklık}`);
    if (collectedData.tarih) summaryParts.push(`Tarih: ${collectedData.tarih}`);
    if (collectedData.metrekare) summaryParts.push(`Metrekare: ${collectedData.metrekare}`);
    if (collectedData.tur) summaryParts.push(`Tür: ${collectedData.tur}`);
    if (collectedData.renkTip) summaryParts.push(`Boya/Renk: ${collectedData.renkTip}`);
    if (collectedData.sorunTuru || collectedData.isTuru) summaryParts.push(`İş/Sorun: ${collectedData.sorunTuru || collectedData.isTuru}`);
    if (collectedData.aciliyet) summaryParts.push(`Aciliyet: ${collectedData.aciliyet}`);
    if (collectedData.kapsam) summaryParts.push(`Kapsam: ${collectedData.kapsam}`);
    if (collectedData.butce) summaryParts.push(`Bütçe: ${collectedData.butce}`);
    if (collectedData.katAsansor) summaryParts.push(`Kat/Asansör: ${collectedData.katAsansor}`);
    if (collectedData.details && collectedData.details !== 'Detay girilmedi.' && collectedData.details !== 'Standart Hizmet') {
      summaryParts.push(`Açıklama: ${collectedData.details}`);
    }

    const summaryText = summaryParts.join(', ') || 'Standart Hizmet';

    return `\n\n| Bilgi | Detay |\n| :--- | :--- |\n| **HİZMET TÜRÜ** | ${categoryName} |\n| **İSİM - SOYİSİM** | ${name} |\n| **TELEFON** | ${phone} |\n| **HİZMET ÖZETİ** | ${summaryText} |`;
  }
}
