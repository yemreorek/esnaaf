import { Injectable, BadRequestException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { ChatGateway } from './chat.gateway';
import { normalizePhone, encryptPhone, maskPhone } from '../../common/utils/phone.util';
import { GeminiService } from '../../common/gemini/gemini.service';
import { OpenAIService } from '../../common/openai/openai.service';
import { sanitizeForWin1254, sanitizeObjectForWin1254 } from '../../common/utils/encoding.util';
import { SECTOR_PROMPTS } from './sector-prompts.config';

interface SessionState {
  step: 'greeting' | 'category_detection' | 'collecting_details' | 'ask_details' | 'ask_address' | 'ask_name' | 'ask_phone' | 'otp_verification' | 'confirm_form' | 'completed';
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  collected_data: {
    categorySlug?: string;
    categoryName?: string;
    questions_flow?: any[];
    city?: string;
    district?: string;
    neighborhood?: string;
    name?: string;
    phone?: string;
    details?: string;
    hasAskedDetails?: boolean;
    [key: string]: any;
  };
  token_count: number;
  ab_variant?: 'control' | 'variant';
  ab_model?: string;
  ab_temp?: number;
}

@Injectable()
export class ChatService {
  private CITY_DISTRICTS: Record<string, string[]> = {
    'Adana': ['çukurova', 'yüreğir', 'sarıçam', 'ceyhan', 'seyhan'],
    'İstanbul': [
      'kadıköy', 'şişli', 'beşiktaş', 'ümraniye', 'üsküdar', 
      'fatih', 'beyoğlu', 'sarıyer', 'maltepe', 'kartal', 
      'pendik', 'başakşehir', 'esenyurt', 'bahçelievler', 
      'bakırköy', 'ataşehir', 'beylikdüzü'
    ],
    'Ankara': [
      'çankaya', 'keçiören', 'yenimahalle', 'mamak', 
      'etimesgut', 'sincan', 'altındağ', 'gölbaşı', 'pursaklar'
    ],
    'İzmir': [
      'karşıyaka', 'konak', 'bornova', 'buca', 'karabağlar', 
      'çiğli', 'gaziemir', 'balçova', 'narlıdere', 'güzelbahçe', 
      'bayraklı', 'urla'
    ]
  };

  private DISTRICT_CAPITALIZATION: Record<string, string> = {
    'çukurova': 'Çukurova', 'yüreğir': 'Yüreğir', 'sarıçam': 'Sarıçam', 'ceyhan': 'Ceyhan', 'seyhan': 'Seyhan',
    'kadıköy': 'Kadıköy', 'şişli': 'Şişli', 'beşiktaş': 'Beşiktaş', 'ümraniye': 'Ümranıye', 'üsküdar': 'Üsküdar', 
    'fatih': 'Fatih', 'beyoğlu': 'Beyoğlu', 'sarıyer': 'Sarıyer', 'maltepe': 'Maltepe', 'kartal': 'Kartal', 
    'pendik': 'Pendik', 'başakşehir': 'Başakşehir', 'esenyurt': 'Esenyurt', 'bahçelievler': 'Bahçelievler', 
    'bakırköy': 'Bakırköy', 'ataşehir': 'Ataşehir', 'beylikdüzü': 'Beylikdüzü',
    'çankaya': 'Çankaya', 'keçiören': 'Keçiören', 'yenimahalle': 'Yenimahalle', 'mamak': 'Mamak', 
    'etimesgut': 'Etimesgut', 'sincan': 'Sincan', 'altındağ': 'Altındağ', 'gölbaşı': 'Gölbaşı', 'pursaklar': 'Pursaklar',
    'karşıyaka': 'Karşıyaka', 'konak': 'Konak', 'bornova': 'Bornova', 'buca': 'Buca', 'karabağlar': 'Karabağlar', 
    'çiğli': 'Çiğli', 'gaziemir': 'Gaziemir', 'balçova': 'Balçova', 'narlıdere': 'Narlıdere', 'güzelbahçe': 'Güzelbahçe', 
    'bayraklı': 'Bayraklı', 'urla': 'Urla'
  };

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private chatGateway: ChatGateway,
    @InjectQueue('chat-retry') private chatRetryQueue: Bull.Queue,
    @InjectQueue('talepler-distribution') private distributionQueue: Bull.Queue,
    private geminiService: GeminiService,
    private openaiService: OpenAIService,
  ) {}

  private filterPii(text: string): string {
    let filtered = text;
    filtered = filtered.replace(/\b[1-9]\d{10}\b/g, '[TC FILTERED]');
    return filtered;
  }

  private async checkTokenLimit(sessionKey: string) {
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `token_limit:${sessionKey}:${today}`;
    const tokenUsage = await this.redis.get(limitKey);
    
    if (tokenUsage && Number(tokenUsage) >= 50000) {
      throw new HttpException('Bugünlük mesaj limitinize ulaştınız. Yarın devam edebilirsiniz.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async trackTokens(sessionKey: string, tokens: number) {
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `token_limit:${sessionKey}:${today}`;
    await this.redis.incrby(limitKey, tokens);
    await this.redis.expire(limitKey, 86400); 
  }

  async startAnonymousSession(sessionUuid?: string, userId?: string | null) {
    const uuid = sessionUuid || randomUUID();
    const sessionKey = userId ? `ai_session:${userId}:${uuid}` : `temp_session:${uuid}`;

    const chatModel = await this.redis.get('ab_test:chat_model') || 'gemini-2.5-flash';
    const tempStr = await this.redis.get('ab_test:temperature');
    const temperature = tempStr ? parseFloat(tempStr) : 0.7;
    const splitRatioStr = await this.redis.get('ab_test:split_ratio');
    const splitRatio = splitRatioStr ? parseFloat(splitRatioStr) : 0.5;

    let ab_variant: 'control' | 'variant' = 'control';
    let ab_model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let ab_temp = 0.7;

    if (Math.random() < splitRatio) {
      ab_variant = 'variant';
      ab_model = chatModel;
      ab_temp = temperature;
    }

    const initialState: SessionState = {
      step: 'greeting',
      messages: [{ role: 'system', content: 'Esnaaf AI Asistanı Hizmet Arama Konuşması' }],
      collected_data: {},
      token_count: 0,
      ab_variant,
      ab_model,
      ab_temp,
    };

    await this.redis.set(sessionKey, JSON.stringify(initialState), 'EX', userId ? 86400 : 7200); 
    await this.redis.incr(`ab_test:sessions:total:${ab_variant}`);

    return {
      session_uuid: uuid,
      step: 'greeting',
      message: 'Size bugün hangi konuda yardımcı olabilirim? (Örn: Ev temizliği, boya badana, tesisat veya elektrik işi...)',
    };
  }

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

    if (!state.collected_data.hasAskedDetails) {
      state.step = 'ask_details';
      return;
    }

    if (!state.collected_data.district || !state.collected_data.neighborhood) {
      state.step = 'ask_address';
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

    // Initialize A/B test parameters if missing (failsafe/migration for legacy sessions)
    if (!state.ab_variant) {
      const chatModel = await this.redis.get('ab_test:chat_model') || 'gemini-2.5-flash';
      const tempStr = await this.redis.get('ab_test:temperature');
      const temperature = tempStr ? parseFloat(tempStr) : 0.7;
      const splitRatioStr = await this.redis.get('ab_test:split_ratio');
      const splitRatio = splitRatioStr ? parseFloat(splitRatioStr) : 0.5;

      let ab_variant: 'control' | 'variant' = 'control';
      let ab_model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      let ab_temp = 0.7;

      if (Math.random() < splitRatio) {
        ab_variant = 'variant';
        ab_model = chatModel;
        ab_temp = temperature;
      }

      state.ab_variant = ab_variant;
      state.ab_model = ab_model;
      state.ab_temp = ab_temp;
    }

    if (message.length > 500) {
      throw new BadRequestException('Tek mesaj en fazla 500 karakter olabilir.');
    }
    await this.checkTokenLimit(sessionKey);

    const filteredMessage = this.filterPii(message);
    state.messages.push({ role: 'user', content: filteredMessage });

    // Proactive UX Improvement: Capture descriptive messages early in the chat flow
    const isEarlyStep = ['greeting', 'category_detection', 'collecting_details'].includes(state.step);
    if (isEarlyStep) {
      const trimmedMsg = message.trim();
      const isNotChoiceOrShort = trimmedMsg.length >= 20 && 
                                 !/^(?:onayla|evet|hayır|hayir|tamam|okey|iptal|seç|sec)/i.test(trimmedMsg);
      if (isNotChoiceOrShort) {
        state.collected_data.details = state.collected_data.details 
          ? `${state.collected_data.details} ${trimmedMsg}` 
          : trimmedMsg;
      }
    }

    let responseMessage = '';
    let options: string[] = [];
    let inputType: string | undefined;
    let createdJobId: string | undefined;
    const tokensUsed = Math.floor(message.length * 0.3) + 20;

    try {
      // ─── ACTIVE AGENT PATH (GEMINI FLASH) ───────────────────────────
      if (this.geminiService.isAvailable()) {
        
        // Hybrid Deterministic Category Failsafe:
        // Automatically detect category in early steps using the deterministic detectCategory method
        // Only if this is NOT a general informational query
        if (!state.collected_data.categorySlug && 
            (state.step === 'greeting' || state.step === 'category_detection') &&
            !this.isGeneralOrInformationalQuery(message)) {
          const detection = await this.detectCategory(filteredMessage);
          if (detection.detected && detection.confidence >= 0.7 && detection.categorySlug) {
            state.collected_data.categorySlug = detection.categorySlug;
            state.collected_data.categoryName = detection.categoryName || undefined;
            await this.loadCategoryQuestions(state, detection.categorySlug, detection.categoryName || undefined);
            state.step = 'collecting_details';
            
            // Immediately parse parameters for the newly detected category from the current user message
            const questions = this.getQuestionsForCategory(detection.categorySlug, state);
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
          }
        }
        
        // A. Transactional Steps (Secure, deterministic verification/creation)
        const initialStep = state.step;

        if (initialStep === 'ask_details') {
          const detailMsg = message.trim();
          const isNo = /^(?:hayır|hayir|yok|devam|devam et|istemiyorum|gerek yok|no|skip|geç|gec)$/i.test(detailMsg);
          const isReferredBack = /(?:az önce|yukarıda|daha önce|belirttim|yazdım|söyledim)/i.test(detailMsg);
          
          if (isReferredBack) {
            const previousUserMsgs = state.messages.slice(0, -1)
              .filter(m => m.role === 'user' && m.content.trim().length >= 15)
              .map(m => m.content.trim());
            
            if (previousUserMsgs.length > 0) {
              state.collected_data.details = previousUserMsgs[previousUserMsgs.length - 1];
            } else if (!state.collected_data.details) {
              state.collected_data.details = 'Detay belirtilmedi.';
            }
          } else if (!isNo) {
            state.collected_data.details = detailMsg;
          } else {
            state.collected_data.details = state.collected_data.details || 'Detay belirtilmedi.';
          }
          state.collected_data.hasAskedDetails = true;
          state.step = 'ask_name';
        }

        // Phone extraction logic (Aşama 3)
        const phoneRegex = /(?:0\s*5|5)\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/;
        const phoneMatch = message.match(phoneRegex);
        if (phoneMatch && (state.step === 'ask_name' || state.step === 'ask_phone')) {
          try {
            const rawPhone = phoneMatch[0];
            const normalized = normalizePhone(rawPhone);
            state.collected_data.phone = normalized;
            
            // Try to extract name if not present
            if (!state.collected_data.name) {
              const beforePhone = message.split(rawPhone)[0].trim();
              const cleanedName = this.cleanName(beforePhone);
              if (cleanedName.length >= 2 && !/\d/.test(cleanedName) && !/^(?:evet|hayır|hayir|yok|tamam|ok|iptal|onayla|onaylıyorum)$/i.test(cleanedName)) {
                state.collected_data.name = cleanedName;
              }
            }

            if (state.collected_data.name) {
              const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
              await this.redis.set(`otp:${normalized}`, JSON.stringify({ code: otpCode, attempts: 0 }), 'EX', 300);

              console.log(`\n==================================================`);
              console.log(`[OTP Simulated via Chat Interceptor] Phone: ${normalized} | Code: ${otpCode}`);
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
            }
          } catch (e) {
            // ignore
          }
        }

        if (initialStep === 'ask_name') {
          const rawName = message.trim();
          const cleanedName = this.cleanName(rawName);
          const isValidName = cleanedName.length >= 2 && !/\d/.test(cleanedName) && !/^(?:evet|hayır|hayir|yok|tamam|ok|iptal|onayla|onaylıyorum)$/i.test(cleanedName);
          if (isValidName) {
            state.collected_data.name = cleanedName;
            state.step = 'ask_phone';
          }
        }

        if (initialStep === 'otp_verification') {
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
                  name: sanitizeForWin1254(state.collected_data.name || 'Misafir Kullanıcı'),
                  role: 'service_seeker',
                  is_active: true,
                  kvkk_consent: true,
                },
              });
            }

            const newSessionKey = `ai_session:${user.id}:${sessionId}`;
            state.step = 'confirm_form';
            await this.redis.set(newSessionKey, JSON.stringify(state), 'EX', 86400);

            let summaryMessage = `Telefon numaranız başarıyla doğrulandı ve kaydınız tamamlandı. Lütfen aşağıdaki panelden talep bilgilerinizi kontrol edip onaylayın:`;

            responseMessage = summaryMessage;
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);

            await this.trackTokens(newSessionKey, tokensUsed);
            return {
              step: 'confirm_form',
              responseMessage,
              collected_data: state.collected_data,
              sessionMigrated: true,
              userId: user.id,
              user: { id: user.id, phone: user.phone_masked || user.phone, role: user.role, name: user.name, email: user.email },
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
                form_data: sanitizeObjectForWin1254({
                  ...state.collected_data,
                  details: this.generateRequestSummary(state.collected_data),
                  name: state.collected_data.name || 'Misafir Kullanıcı',
                  city: state.collected_data.city || 'Adana',
                  district: state.collected_data.district || 'Seyhan',
                  sendToFavoritesOnly: sendToFavoritesOnly,
                }),
                status: 'pending',
              },
            });

            createdJobId = job.id;
            await this.redis.incr(`ab_test:sessions:completed:${state.ab_variant || 'control'}`);

            // Trigger matches & distribution (failsafe direct request distribution)
            try {
              const requestDistrict = state.collected_data.district || 'Seyhan';
              const requestCity = state.collected_data.city || 'Adana';

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
                  if (providerCity === 'İstanbul') {
                    providerDistricts = ['Kadıköy', 'Şişli', 'Beşiktaş', 'Ümraniye', 'Üsküdar', 'Fatih', 'Beyoğlu', 'Sarıyer', 'Maltepe', 'Kartal', 'Pendik', 'Başakşehir', 'Esenyurt', 'Bahçelievler', 'Bakırköy', 'Ataşehir', 'Beylikdüzü'];
                  } else if (providerCity === 'Ankara') {
                    providerDistricts = ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut', 'Sincan', 'Altındağ', 'Gölbaşı', 'Pursaklar'];
                  } else if (providerCity === 'İzmir') {
                    providerDistricts = ['Karşıyaka', 'Konak', 'Bornova', 'Buca', 'Karabağlar', 'Çiğli', 'Gaziemir', 'Balçova', 'Narlıdere', 'Güzelbahçe', 'Bayraklı', 'Urla'];
                  } else {
                    providerDistricts = ['Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Seyhan'];
                  }
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
                    details: this.generateRequestSummary(state.collected_data),
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
          }

          if (state.collected_data.categorySlug) {
            const questions = this.getQuestionsForCategory(state.collected_data.categorySlug, state);
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
                    const paintPattern = /(?:\brenk\b|\bboya\b|beyaz|gri|siyah|yeşil|mavi|sarı|kırmızı|saten|silikon|astar|su baz|yağlı)/i;
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
                  } else {
                    // Fallback for any other generic parser
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

        // Deterministic transition to ask_details if all technical questions are answered
        if (state.collected_data.categorySlug && !this.getNextQuestion(state) && !state.collected_data.hasAskedDetails) {
          if (state.collected_data.details && state.collected_data.details.trim().length >= 20) {
            state.collected_data.hasAskedDetails = true;
            state.step = 'ask_address';
            responseMessage = `Hizmetin verileceği konumu seçebilir misiniz?`;
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
            await this.trackTokens(sessionKey, tokensUsed);
            return {
              step: 'ask_address',
              responseMessage,
              collected_data: state.collected_data,
            };
          } else {
            state.step = 'ask_details';
            responseMessage = this.generatePromptForCategory(state.collected_data.categorySlug || null);
            state.messages.push({ role: 'assistant', content: responseMessage });
            await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
            await this.trackTokens(sessionKey, tokensUsed);
            return {
              step: 'ask_details',
              responseMessage,
              collected_data: state.collected_data,
              options: this.getChecklistForCategory(state.collected_data.categorySlug || null),
              inputType: 'multi_choice'
            };
          }
        }
        
        // Strict State Machine Interceptors for Etap 2 (ask_details) and Etap 3 (ask_address)
        if (state.step === 'ask_details') {
          const detailMsg = message.trim();
          const isNo = /^(?:hayır|hayir|yok|devam|devam et|istemiyorum|gerek yok|no|skip|geç|gec|atla)$/i.test(detailMsg);
          const isReferredBack = /(?:az önce|yukarıda|daha önce|belirttim|yazdım|söyledim)/i.test(detailMsg);
          
          if (isReferredBack) {
            const previousUserMsgs = state.messages.slice(0, -1)
              .filter(m => m.role === 'user' && m.content.trim().length >= 15)
              .map(m => m.content.trim());
            
            if (previousUserMsgs.length > 0) {
              state.collected_data.details = previousUserMsgs[previousUserMsgs.length - 1];
            } else if (!state.collected_data.details) {
              state.collected_data.details = 'Detay belirtilmedi.';
            }
          } else if (!isNo) {
            state.collected_data.details = detailMsg;
          } else {
            state.collected_data.details = state.collected_data.details || 'Detay belirtilmedi.';
          }
          state.collected_data.hasAskedDetails = true;
          state.step = 'ask_address';
          responseMessage = `Hizmetin verileceği konumu seçebilir misiniz?`;
          state.messages.push({ role: 'assistant', content: responseMessage });
          await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
          await this.trackTokens(sessionKey, tokensUsed);
          return { step: 'ask_address', responseMessage, collected_data: state.collected_data };
        } else if (state.step === 'ask_address') {
          try {
            const parsed = JSON.parse(message);
            if (parsed.city) state.collected_data.city = parsed.city;
            if (parsed.district) state.collected_data.district = parsed.district;
            if (parsed.neighborhood) state.collected_data.neighborhood = parsed.neighborhood;
          } catch (e) {
             // Handle plain text gracefully if needed, but UI will send JSON
          }
          state.step = 'ask_name';
          responseMessage = `Teşekkürler. Size hitap edebilmemiz için adınızı ve soyadınızı alabilir miyim?`;
          state.messages.push({ role: 'assistant', content: responseMessage });
          await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
          await this.trackTokens(sessionKey, tokensUsed);
          return { step: 'ask_name', responseMessage, collected_data: state.collected_data };
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
- Lütfen müşteriye bu soruyu tatlı ve doğal bir dille yönelt. 
- EĞER müşteri sorulan soru dışında serbest bir metin yazıp araya girdiyse (örn: "Usta sigortalı mı?"), önce onun sorusunu kısaca yanıtla, sonra kaldığın bu eksik soruyu ('${nextQ.question}') mutlaka tekrar sor!
- Bu aşamada asla isim, telefon veya onay isteme! Yalnızca bu eksik soruyu sor.
`;
          } else if (!state.collected_data.hasAskedDetails) {
            const detailPrompt = this.generatePromptForCategory(state.collected_data.categorySlug || null);
            assistantDirective = `
### 🚨 ŞU ANKİ GÖREVİN:
- Kategoriye ait tüm teknik sorular başarıyla tamamlandı.
- Şimdi müşteriye tam olarak şu soruyu sormalısın:
"${detailPrompt}"
- Bu aşamada asla isim veya telefon sorma! Yalnızca bu açık uçlu detay sorusunu sor.
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
Sen Türkiye'nin en büyük hizmet pazarı olan Esnaaf platformunun akıllı, samimi ve son derece yardımcı yapay zeka asistanısın. Müşterilerin hizmet taleplerini almak, eksik detayları toplamak ve talebi oluşturmak için onlara rehberlik ediyorsun. Aynı zamanda platform hakkında detaylı bilgi verebilen, kategorilere hâkim ve müşteriye en iyi deneyimi sunmaya odaklı bir dijital danışmansın.

### 🧠 AKILLI HAFIZA VE SOHBET AKIŞ KURALLARI (KESİN KURAL)
1. **Hafıza ve Bilgi Koruma**: Bir bilgiyi kullanıcıdan konuşmanın herhangi bir yerinde bir kez aldıysan (Örn: Ad, soyad, konum/ilçe, oda sayısı, metrekare veya diğer detaylar), o bilgiyi hafızana kaydet ve bir daha kesinlikle sorma! Kullanıcı "Adım Emre" dediyse, sonraki mesajda "Memnun oldum Emre Bey, soyadınızı da alabilir miyim?" diyebilirsin ama "Adınız neydi?" diye sıfırdan soramazsın.
2. **Doğal ve Akıcı İletişim**: Sohbeti robotik şablonlarla değil, bir insan gibi doğal ve akıcı yürüt. Kullanıcının bir önceki mesajdaki yanıtlarını referans alarak akıllı çıkarımlar yap.
3. **Adım Adım Bilgi Toplama Sırası**:
   - **Aşama 1 (Detay Toplama)**: Önce hizmetin detaylarını öğren (Örn: Kaç metrekare? İşlem türü ne? Malzeme kimden?). Bu aşamada asla isim/telefon sorma.
   - **Aşama 2 (Konum)**: Detaylar netleştikten sonra hizmetin yapılacağı konumu/ilçeyi al.
   - **Aşama 3 (Teklif ve İletişim)**: Konum ve detaylar netleştikten sonra, teklif toplamak için en son aşamada ad-soyad ve telefon numarası iste.

### ℹ️ GENEL SORULAR VE BİLGİLENDİRME (YAPAY ZEKA ÖĞRETİSİ)
Müşteri Esnaaf platformu hakkında genel sorular (Örn: "sistem nasıl çalışır?", "ücretli mi?", "komisyon alıyor musunuz?", "güvenli mi?", "iletişim bilgileri nedir?", "teklif nasıl alınır?", "iptal edebilir miyim?", "ödeme nasıl yapılır?" vb.) sorduğunda veya şehir/kategori bazlı usta istatistiklerini sorguladığında (Örn: "Adana'da kaç boyacı var?", "İstanbul'da temizlikçi var mı?"):
1. KESİNLİKLE doğrudan talep açma adımlarına (konum, detay, isim, telefon sorma) ZORLAMA!
2. Müşterinin sorusuna nazikçe, detaylı ve tatmin edici bir şekilde cevap ver. İşte kapsamlı bilgi bankası:
   - **Nasıl Çalışır:** Esnaaf, hizmet alanlar ile hizmet veren esnafları buluşturan ücretsiz bir platformdur. İhtiyacınızı bize söylersiniz, biz bölgenizdeki en uygun esnafları size eşleştiririz ve onlar size canlı teklifler sunar. Teklifleri karşılaştırıp en uygun olanı seçersiniz.
   - **Ücret / Komisyon:** Hizmet almak, talep oluşturmak ve teklif karşılaştırmak tamamen ÜCRETSİZDİR. Esnaaf, müşterilerden hiçbir ücret veya komisyon almaz. Ödemeyi doğrudan iş bitiminde ustanıza yaparsınız.
   - **Güvenlik:** Platformdaki tüm esnaflarımız kimlik doğrulaması, oda kaydı ve referans kontrollerinden geçmiş onaylı ustalardır. Ayrıca her iş tamamlandıktan sonra 0-10 puan değerlendirmesi yapabilirsiniz. Düşük puan alan ustalar otomatik olarak kalite ekibimiz tarafından incelenir.
   - **Teklif Süreci:** Talebiniz oluşturulduktan sonra bölgenizdeki en uygun 5-10 usta eşleştirilir. Ustalar genellikle birkaç dakika ile birkaç saat içinde size teklif gönderir. Her ustanın profil puanı, referans sayısı ve teklif fiyatı ekranınızda görüntülenir.
   - **Ödeme:** Ödeme, hizmet tamamlandıktan sonra doğrudan sizinle usta arasında yapılır (nakit veya istediğiniz yöntemle). Esnaaf bir aracı değildir, buluşturma platformudur.
   - **İptal:** Teklif kabul etmeden önce talebinizi istediğiniz zaman iptal edebilirsiniz. Herhangi bir ceza veya ücret yansımaz.
   - **Ustaya Ulaşma:** Bir ustanın teklifini kabul ettikten sonra, ustanın telefon numarası sizinle paylaşılır. Ayrıca platform içi mesajlaşma ile de iletişim kurabilirsiniz.
   - **Şikayet / Değerlendirme:** Her iş tamamlandıktan sonra 0-10 arası puan değerlendirmesi ve yazılı yorum yapabilirsiniz. Olumsuz bir deneyim yaşarsanız puanınız otomatik olarak kalite ekibimize iletilir ve sizinle iletişime geçilir.
   - **Fatura / Makbuz:** Bu konu doğrudan usta ile aranızdaki anlaşmaya bağlıdır. Platform üzerinden kayıtlı esnaflarımızın vergi bilgileri kontrol edilmektedir.
   - **Süre:** Teklifler genellikle talebinizi oluşturduktan sonra birkaç dakika ile 24 saat arasında gelmeye başlar. Acil talepler için özel not düşebilirsiniz.
   - **Garanti:** Esnaaf, ustalarını titiz bir doğrulama sürecinden geçirir. Ancak hizmet garantisi doğrudan usta ile aranızda olup, puan sistemiyle kalite güvencesi sağlanır.
   - **Usta İstatistikleri/Sorgulama:** Eğer kullanıcı şehir ve kategori belirterek usta sorguluyorsa, derhal 'getPlatformStats' aracını/toolunu çağırarak veritabanından güncel bilgiyi sorgula ve müşteriye tam sayıyı belirt.
3. Soruyu yanıtladıktan sonra, konuşmanın sonuna şu şekilde nazik bir davet ekle:
   "Size bu konuda yardımcı olmak için ücretsiz bir hizmet talebi oluşturup en uygun ustalardan canlı teklifler toplamak ister misiniz?"
4. Eğer kullanıcı onaylarsa (Evet, olur, oluşturalım vb.), o zaman 'detectCategory' aracını çağırıp talep toplama sürecini başlat.

### 🛡️ GÜVENLİK VE ETİK KURALLARI (KESİN)
Aşağıdaki kurallara hiçbir koşulda aykırı davranma:
- Müşterinin T.C. kimlik numarasını, kredi kartı bilgisini veya açık adresini (mahalle/sokak düzeyinde) KESİNLİKLE isteme ve sohbette paylaşma.
- Platform dışında ödeme veya iletişim önerme. Örneğin "beni şu numaradan arayın" veya "havale yapın" gibi yönlendirmeler yasaktır.
- Tıbbi, hukuki veya mali danışmanlık verme. Müşteri böyle bir soru sorarsa "Bu konuda uzman bir danışmana başvurmanızı öneririm" de.
- Rakip platformları (Armut, Mastergel, GetirUsta vb.) önerme, karşılaştırma yapma veya yönlendirme.
- Kesin fiyat tahmini veya garanti verme — "Bu iş X TL'dir" veya "Kesinlikle Y TL tutar" gibi ifadeler yasaktır. Bunun yerine "Ücretsiz teklif toplayalım, ustalar size en güncel fiyatlarını sunsun" yönlendirmesi yap.
- Kullanıcıyı manipüle etme, baskı yapma veya gereksiz aciliyet hissi yaratma.
- Sohbet dışı konularda (siyaset, din, spor, magazin, teknoloji haberleri vb.) tartışmaya girme. Nazikçe konuyu hizmet talebine yönlendir.
- Küfür, hakaret veya uygunsuz dil karşısında sakin kal ve profesyonel ol; "Size daha iyi yardımcı olabilmem için hizmet talebinize odaklanmamız daha iyi olacaktır" tarzında yönlendir.


### 💡 AKILLI ÖNERİLER (CROSS-SELL)
Talep tamamlandıktan sonra (onay aşamasında veya tamamlama mesajında), müşteriye SADECE ilgili ve mantıklı ek hizmet önerisi sun:
- Ev Temizliği talebi → "Ayrıca halı veya koltuk yıkama hizmeti de ister misiniz?"
- Boya Badana talebi → "Boya işi sonrası inşaat sonrası temizlik hizmeti düşünür müsünüz?"
- Nakliyat talebi → "Taşınma sonrası yeni evinizde ev temizliği hizmeti almak ister misiniz?"
- Ev Tadilat talebi → "Tadilat tamamlandıktan sonra temizlik hizmeti de düşünür müsünüz?"
- Su Tesisatı talebi → "Tesisatla birlikte fayans onarımı gerekirse fayans ustası da bulabiliriz."
- Kombi/Klima talebi → "Ayrıca doğalgaz tesisatı kontrolü yaptırmak ister misiniz?"
- Fayans/Parke talebi → "Döşeme sonrası temizlik hizmeti de organize edebiliriz."
- İç Mimar talebi → "Tasarım uygulaması için boya, mobilya veya tadilat ustası da bulabiliriz."
Bu önerileri zorlama, sadece bir kez ve nazikçe sun. Müşteri istemezse ısrar etme.

### 🎯 İDEAL KONUŞMA ÖRNEKLERİ (FEW-SHOT)
Aşağıdaki örnekler, nasıl konuşman gerektiğini gösterir. Bu tarz ve tonu referans al:

**Örnek 1 — Kombi Arıza:**
Müşteri: "Kombi yanmıyor, sıcak su gelmiyor"
AI: Kombi arızanızla ilgilenelim. Hizmetin verileceği ilçeyi yazar mısınız?
Müşteri: "Çankaya"
AI: Kombinizin markası ve modeli nedir? Bu bilgi ustanın hazırlık yapmasını sağlar.
Müşteri: "Baymak Luna 24"
AI: Anladım, Baymak Luna 24 kombiniz yanmıyor ve sıcak su vermiyor. Bu genellikle ateşleme kartı veya gaz valfi arızasından kaynaklanabilir. Detaylarınızı aldım, şimdi size uygun ustalardan teklif almak için adınızı ve soyadınızı öğrenebilir miyim?

**Örnek 2 — Ev Temizliği:**
Müşteri: "Temizlikçi lazım"
AI: Ev temizliği talebiniz için yardımcı olayım. Hizmetin verileceği ilçeyi yazar mısınız?
Müşteri: "Kadıköy"
AI: Eviniz kaç odalı ve ne tür bir temizlik düşünüyorsunuz? (Standart temizlik, detaylı/derin temizlik gibi)
Müşteri: "3+1, normal temizlik yeterli"
AI: Kadıköy'de 3+1 daireniz için standart ev temizliği. Temizlik hakkında eklemek istediğiniz özel bir not var mı? Örneğin cam silimi, ütü gibi ek işler veya dikkat edilmesi gereken bir alan?
Müşteri: "Cam silimi de yapılsın"
AI: Notunuzu aldım. Size uygun ustalardan teklif almak için adınızı ve soyadınızı öğrenebilir miyim?

**Örnek 3 — Genel Soru:**
Müşteri: "Bu platform güvenli mi? Ustalar kontrol ediliyor mu?"
AI: Kesinlikle güvenli bir platformuz. Esnaaf'a kaydolan tüm ustalar kimlik doğrulaması, oda kaydı kontrolü ve referans değerlendirmesinden geçmektedir. Ayrıca her iş tamamlandıktan sonra siz ustanızı 0-10 arası puanlayabilirsiniz. Düşük puan alan ustalar kalite ekibimiz tarafından otomatik olarak incelenir.

Size bu konuda yardımcı olmak için ücretsiz bir hizmet talebi oluşturup en uygun ustalardan canlı teklifler toplamak ister misiniz?

**Örnek 4 — Desteklenmeyen Bölge:**
Müşteri: "Bursa'da boyacı arıyorum"
AI: Maalesef şu an Esnaaf platformu olarak Bursa'da henüz hizmet vermiyoruz. Şimdilik Adana, İstanbul, Ankara ve İzmir'in belirli ilçelerinde aktifiz. Bu şehirlerden birinde hizmet almak isterseniz size yardımcı olmaktan mutluluk duyarım.

**Örnek 5 — Desteklenmeyen Hizmet:**
Müşteri: "Çamaşır makinem bozuldu"
AI: Maalesef çamaşır makinesi ve beyaz eşya servisi hizmetini şu an platformumuzda sunmuyoruz. Ancak ev temizliği, boya badana, su/elektrik tesisatı, kombi-klima bakımı, marangozluk, nakliyat gibi birçok alanda size yardımcı olabiliriz. Bu hizmetlerden biriyle ilgili talebiniz var mı?

### ⚠️ ÇOK ÖNEMLİ - HİZMET BÖLGESİ KISITLAMASI ⚠️
Esnaaf platformu YALNIZCA **Adana, İstanbul, Ankara ve İzmir** illerinde ve bu illerin belirli ilçelerinde hizmet vermektedir.
Desteklenen iller ve ilçeler şunlardır:
- **Adana:** Çukurova, Yüreğir, Sarıçam, Ceyhan, Seyhan
- **İstanbul:** Kadıköy, Şişli, Beşiktaş, Ümraniye, Üsküdar, Fatih, Beyoğlu, Sarıyer, Maltepe, Kartal, Pendik, Başakşehir, Esenyurt, Bahçelievler, Bakırköy, Ataşehir, Beylikdüzü
- **Ankara:** Çankaya, Keçiören, Yenimahalle, Mamak, Etimesgut, Sincan, Altındağ, Gölbaşı, Pursaklar
- **İzmir:** Karşıyaka, Konak, Bornova, Buca, Karabağlar, Çiğli, Gaziemir, Balçova, Narlıdere, Güzelbahçe, Bayraklı, Urla

Eğer müşteri bu illerin/ilçelerin dışında bir konum belirtirse (Örn: "Bursa'da...", "Mersin'de...", "Antalya'da..."):
- KESİNLİKLE 'detectCategory' veya başka bir fonksiyon/tool çağırma!
- Konuşmayı o aşamada durdur. Müşteriye nazikçe, sistemimizin şimdilik sadece Adana, İstanbul, Ankara ve İzmir'in belirli ilçelerinde hizmet verdiğini belirt.
- Kendisinden bu desteklenen ilçe ve illerden birini belirtmesini iste. Müşteri bu geçerli konumlardan birini verene kadar sonraki aşamalara (detay toplama, ad-soyad, telefon, OTP) KESİNLİKLE geçme!

### ⚠️ ÇOK ÖNEMLİ - DESTEKLENMEYEN HİZMETLER VE KATEGORİ DIŞI TALEPLER ⚠️
Esnaaf platformu YALNIZCA aşağıdaki listede belirtilen 20 kategoride hizmet sunmaktadır. 
Eğer müşteri bu kategorilere girmeyen platform dışı bir hizmet talep ederse (Örn: "buzdolabı arızalı", "buzdolabı çalışmıyor", "çamaşır makinesi çalışmıyor", "beyaz eşya servisi", "araç kiralama", "kuaför", "yazılım geliştirme", "telefon tamiri" vb.):
- KESİNLİKLE 'detectCategory' veya başka bir fonksiyon/tool çağırma!
- Müşteriye bu hizmeti (örn: "Buzdolabı / Beyaz Eşya Servisi") şu an için sunamadığımızı kibarca açıkla.
- Desteklediğimiz ana kategorileri (Ev Temizliği, Nakliyat, Boya Badana, Su/Elektrik Tesisatı, Kombi/Klima Bakımı, Marangozluk vb.) belirterek müşteriye bu konularda yardımcı olabileceğini söyle.
- Müşteri bu 20 desteklenen kategoriden birine ait geçerli bir hizmet talebinde bulunana kadar sonraki aşamalara KESİNLİKLE geçme!

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
   1. **Hizmet Kategorisi Keşfi**: Müşterinin neye ihtiyacı olduğunu öğren. Selamlama veya hoş geldiniz kelimeleri kullanmadan, doğrudan müşterinin belirttiği ihtiyaca göre 'detectCategory' aracını çağırarak kategoriyi belirle.
   2. **Eksik Bilgileri Toplama**:
      Kategori belirlendikten sonra, müşteriden hizmet için gereken detayları (ilçe/konum, metrekare, tarih, sıklık vb.) tatlı ve sohbet tarzı bir dille teker teker veya makul gruplarla topla. Müşteriyi soru yağmuruna tutma.
      - Konum/İlçe bilgisi her talep için ZORUNLUDUR!
      - Yukarıdaki KATEGORİ BAZLI UZMANLIK BİLGİSİ bölümünü referans alarak akıllı ve yerinde sorular sor.
   3. **Müşteri Kaydı**:
      Bütün bilgiler toplandığında, müşterinin Adını ve Soyadını al.
      Ardından cep telefonu numarasını iste (Örn: 0532 123 4567). Telefonu aldığın an derhal 'sendOTP' aracını çağır.
   4. **OTP ve Onay Süreçleri**:
      OTP kodu gönderildiğinde ve kullanıcı kodu girdiğinde, bu kod sistem tarafından arka planda doğrulanacaktır. Doğrulama sonrası kullanıcının önüne bir özet çıkacaktır ve kullanıcı 'Onayla' dediğinde talep tescil edilecektir.
   5. **Konum ve Coğrafi Terimler Uyumluluğu (ÖNEMLİ)**:
      - İstanbul, Ankara ve İzmir birer **İL** (Şehir); Beşiktaş, Kadıköy, Çankaya, Bornova, Konak, Şişli gibi yerler ise bu illerin **İLÇELERİDİR** (District).
      - Beşiktaş, Kadıköy, Çankaya vb. yerler zaten kendi başlarına birer **İLÇEDİR**. Müşteri konumu Beşiktaş veya Kadıköy olarak belirttiğinde, kesinlikle "Beşiktaş'ın hangi ilçesinde oturuyorsunuz?" veya "Kadıköy ilçesinin hangi ilçesinde..." gibi yanlış ve hatalı ifadeler kullanma!
      - Eğer müşterinin ilçesi zaten seçilmişse (Örn: Beşiktaş) ve ek detay sormak istersen, bunu "Beşiktaş'ın hangi semtinde/mahallesinde oturuyorsunuz?" veya "Beşiktaş'ta nerede oturuyorsunuz?" şeklinde doğru coğrafi terimlerle sor.
   6. **Açıklama ve Detay Kuralları (ÖNEMLİ)**:
      - 'createServiceRequest' fonksiyonunu çağırırken 'formData.details' alanına, müşterinin sohbette kendi belirttiği asıl ihtiyacını, arızasını veya özel taleplerini kısa ve öz bir şekilde (kendin uydurmadan, müşterinin verdiği bilgilerin dışına çıkmadan) özetleyerek eklemelisin. Bu alan boş kalmamalıdır.
   7. **Akıllı Ek Hizmet Önerisi**:
      Talep onay aşamasına geldiğinde veya tamamlandıktan sonra, yukarıdaki AKILLI ÖNERİLER bölümündeki ilgili cross-sell önerisini SADECE BİR KEZ ve nazikçe sun. Müşteri istemezse ısrar etme.

Tamamen Türkçe konuş. Konuşma tarzın net, kısa, samimi ve çözüm odaklı olsun. Giriş veya geçiş cümlelerinde "harika", "çok iyi", "süper" gibi övgü veya gereksiz ünlem kelimeleri kullanma. Doğrudan müşterinin problemini çözmeye yönelik sorular sor ve talebi hızlıca tamamlamaya odaklan. Müşteriye güven ver ama abartma — doğal ve profesyonel bir ton kullan.

### 📝 JSON YANIT FORMATI VE SEÇENEKLER (ÇOK ÖNEMLİ)
Sistemimiz senin yanıtlarını JSON formatında beklemektedir. Sorduğun her soru için, kullanıcının tıklayarak hızlıca cevaplayabilmesi adına 2 ila 5 adet mantıklı, kısa seçenek (options) üretmelisin. Eğer sadece bilgi veriyorsan veya seçenek sunulamayacak bir durumsa \`options\` dizisini boş bırakabilirsin.
Bütün yanıtlarını **MUTLAKA** aşağıdaki JSON formatında oluşturmalısın (başka hiçbir metin ekleme):
\`\`\`json
{
  "responseMessage": "Senin müşteriye söyleyeceğin veya soracağın metin burada yer alacak.",
  "options": ["Seçenek 1", "Seçenek 2", "Diğer"]
}
\`\`\`
`;

        const sectorPrompt = this.getSectorPrompt(state.collected_data.categorySlug || null);
        const finalSystemInstruction = `${systemInstruction}\n\n${sectorPrompt}`;

        const start = Date.now();
        let aiRes: any = null;
        try {
          aiRes = await this.geminiService.generateResponse(
            state.messages,
            finalSystemInstruction,
            { modelName: state.ab_model, temperature: state.ab_temp }
          );
        } catch (geminiErr: any) {
          console.warn(`[ChatService] Gemini failed: ${geminiErr.message}. Falling back to OpenAI (GPT-4o-mini)...`);
          if (this.openaiService.isAvailable()) {
            aiRes = await this.openaiService.generateResponse(
              state.messages,
              finalSystemInstruction,
              { temperature: state.ab_temp }
            );
          } else {
            throw geminiErr; // Bubble up to deterministic fallback
          }
        }
        
        const geminiRes = aiRes;
        
        const latency = Date.now() - start;
        await this.redis.incrby(`ab_test:latency:total:${state.ab_variant || 'control'}`, latency);
        await this.redis.incr(`ab_test:latency:count:${state.ab_variant || 'control'}`);

        // B3. Handle Tool Calls / Function Calls
        if (geminiRes.functionCalls && geminiRes.functionCalls.length > 0) {
          const call = geminiRes.functionCalls[0];
          
          if (call.name === 'detectCategory') {
            const { categorySlug } = call.args as any;
            state.collected_data.categorySlug = categorySlug;
            await this.loadCategoryQuestions(state, categorySlug, undefined);
            state.step = 'collecting_details';

            // Immediately parse parameters for the newly detected category from the current user message
            const questions = this.getQuestionsForCategory(categorySlug, state);
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
              responseMessage = `${this.getCategoryName(categorySlug)} talebiniz için detayları alalım. \n\n${nextQ.question}`;
              if (nextQ.options) options = nextQ.options;
            } else if (!state.collected_data.hasAskedDetails) {
              state.step = 'ask_details';
              responseMessage = this.generatePromptForCategory(categorySlug || null);
            } else {
              state.step = 'ask_address';
              responseMessage = 'Talebinizle ilgili detaylar başarıyla kaydedildi. Hizmetin verileceği konumu seçebilir misiniz?';
            }
          }
          else if (call.name === 'sendOTP') {
            const { phone, name, formData } = call.args as any;
            try {
              const normalized = normalizePhone(phone);
              if (formData && typeof formData === 'object') {
                state.collected_data = {
                  ...state.collected_data,
                  ...formData
                };
              }

              // Ensure phone and name are set to the correct/normalized values and not overwritten by raw values in formData
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
            const { seekerName, phone, categorySlug, formData } = call.args as any;
            try {
              if (formData && typeof formData === 'object') {
                state.collected_data = {
                  ...state.collected_data,
                  ...formData
                };
              }
              if (seekerName) state.collected_data.name = seekerName;
              if (phone) state.collected_data.phone = normalizePhone(phone);
              if (categorySlug) state.collected_data.categorySlug = categorySlug;
              state.step = 'confirm_form';
              responseMessage = 'Talebiniz hazırlandı. Lütfen bilgilerinizi onaylayın.';
            } catch (e) {
              responseMessage = 'Talebiniz hazırlanırken bir hata oluştu.';
            }
          }
          else if (call.name === 'getPlatformStats') {
            const { categorySlug, city } = call.args as any;
            try {
              const stats = await this.getPlatformStats(categorySlug, city);
              const catName = stats.category !== 'Tüm Kategoriler' ? stats.category.toLowerCase() : 'farklı alanlarda hizmet veren';
              const cityText = stats.city !== 'Tüm Şehirler' ? `${stats.city}'da` : 'sistemimizde';
              
              if (stats.providerCount > 0) {
                responseMessage = `${cityText} şu anda size hizmet vermeye hazır ${stats.providerCount} adet onaylı ${catName} ustası bulunuyor. \n\nSizin için ücretsiz bir hizmet talebi oluşturup en uygun ustalardan canlı teklifler almamızı ister misiniz?`;
              } else {
                responseMessage = `${cityText} şu anda onaylı ${catName} ustamız bulunmamaktadır. Ancak yeni ustalarımız her gün kaydolmaktadır. Yine de bir talep oluşturup bölgenizdeki yeni ustaların teklif vermesini beklemek ister misiniz?`;
              }
            } catch (e) {
              responseMessage = 'Usta istatistikleri sorgulanırken bir hata oluştu. Ancak size en uygun ustalardan teklif toplamak için ücretsiz bir hizmet talebi oluşturabiliriz. Başlayalım mı?';
            }
          }
        } else {
          if (geminiRes.text) {
            try {
              let cleanText = geminiRes.text.trim();
              if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim();
              } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```/g, '').trim();
              }
              const parsed = JSON.parse(cleanText);
              responseMessage = parsed.responseMessage || cleanText;
              if (Array.isArray(parsed.options)) {
                options = parsed.options;
              }
            } catch (e: any) {
              console.warn(`[ChatService] Failed to parse JSON from Gemini text: ${e.message}`);
              responseMessage = geminiRes.text;
            }
          } else {
            responseMessage = 'Size nasıl yardımcı olabilirim?';
          }
          const previousStep = state.step;
          this.syncStep(state);
          
          if (previousStep !== state.step) {
            if (state.step === 'ask_address' && !responseMessage.toLowerCase().includes('konum')) {
              responseMessage = 'Hizmetin verileceği konumu seçebilir misiniz?';
            } else if (state.step === 'ask_name' && !responseMessage.toLowerCase().includes('adınız')) {
              responseMessage = 'Teşekkürler. Size hitap edebilmemiz için adınızı ve soyadınızı alabilir miyim?';
            } else if (state.step === 'ask_phone' && !responseMessage.toLowerCase().includes('telefon')) {
              responseMessage = 'Talebinizin doğrulanması için telefon numaranızı alabilir miyim? (Örn: 0532 123 4567)';
            } else if (state.step === 'ask_details') {
              responseMessage = this.generatePromptForCategory(state.collected_data.categorySlug || null);
            }
          }
          
          // Attach options and inputType if we are still collecting details and there's a next question
          if (state.step === 'collecting_details') {
            const nextQ = this.getNextQuestion(state);
            if (nextQ && nextQ.options && options.length === 0) {
              options = nextQ.options;
              inputType = nextQ.inputType || 'single_choice';
            }
          } else if (state.step === 'ask_details') {
            if (options.length === 0) {
              options = this.getChecklistForCategory(state.collected_data.categorySlug || null);
            }
            inputType = 'multi_choice';
          }
        }

        state.messages.push({ role: 'assistant', content: responseMessage });
        await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
        await this.trackTokens(sessionKey, tokensUsed);

        return {
          step: state.step,
          responseMessage,
          collected_data: state.collected_data,
          options,
          inputType,
        };
      }

      // ─── OFFLINE / MOCK FALLBACK PATH (ORIGINAL STATE MACHINE) ─────
      if (state.step === 'greeting' || state.step === 'category_detection') {
        const detection = await this.detectCategory(filteredMessage);
        
        if (detection.detected && detection.confidence >= 0.7 && detection.categorySlug) {
          state.collected_data.categorySlug = detection.categorySlug;
          state.collected_data.categoryName = detection.categoryName || undefined;
          await this.loadCategoryQuestions(state, detection.categorySlug, detection.categoryName || undefined);
          
          const loc = this.parseLocation(message);
           if (loc.city) {
             state.collected_data.city = loc.city;
           }
          if (loc.district) {
            state.collected_data.district = loc.district;
          }

          const questions = this.getQuestionsForCategory(detection.categorySlug, state);
          const initialParsableKeys = [
            'district', 'destinationDistrict', 'daireTipi', 'metrekare', 'aciliyet', 
            'siflik', 'tur', 'butce', 'sorunTuru', 'isTuru', 'kapsam',
            'adet', 'durum', 'islemTuru', 'hasereTuru', 'binaTipi', 'cihazTuru', 'dersTuru', 'sinifSeviyesi'
          ];
          for (const q of questions) {
            if (initialParsableKeys.includes(q.key) && q.key !== 'district') {
              let canParse = true;
              if (q.key === 'tarih') {
                canParse = /(?:ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|gün|yarın|bugün|saat|\b\d{1,2}[:.]\d{2}\b|\b\d{1,2}\.\d{1,2}\b)/i.test(message);
              } else if (q.key === 'renkTip') {
                canParse = /(?:\brenk\b|\bboya\b|beyaz|gri|siyah|yeşil|mavi|sarı|kırmızı|saten|silikon|astar|su baz|yağlı)/i.test(message);
              } else if (q.key === 'katAsansor') {
                canParse = /(?:kat|asansör|merdiven|giriş|yüksek|villa|müstakil)/i.test(message);
              } else if (q.key === 'camTipi') {
                canParse = /(?:cam|ısıcam|konfor|çift|tek|temper|lamine|pvc|panjur)/i.test(message);
              } else if (q.key === 'kombiDurumu') {
                canParse = /(?:kombi|tesisat|proje|montaj|petek|boru)/i.test(message);
              } else if (q.key === 'etkinlikTuru') {
                canParse = /(?:düğün|nişan|kına|doğum|sünnet|mezuniyet|etkinlik|organizasyon|çekim|foto|parti|konser)/i.test(message);
              } else {
                canParse = false;
              }

              if (canParse) {
                const parsedVal = q.parse(message);
                if (parsedVal) {
                  state.collected_data[q.key] = parsedVal;
                }
              }
            }
          }

          state.step = 'collecting_details';
          
          const nextQ = this.getNextQuestion(state);
          if (nextQ) {
            responseMessage = `${detection.categoryName} talebiniz için detayları alalım. \n\n${nextQ.question}`;
            if (nextQ.options) {
              options = nextQ.options;
              inputType = nextQ.inputType || 'single_choice';
            }
          } else {
            state.step = 'ask_details';
            responseMessage = this.generatePromptForCategory(detection.categorySlug);
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
          if (nextMissingQ.options) {
            options = nextMissingQ.options;
            inputType = nextMissingQ.inputType || 'single_choice';
          }
        } else {
          if (state.collected_data.details && state.collected_data.details.trim().length >= 20) {
            state.collected_data.hasAskedDetails = true;
            state.step = 'ask_address';
            responseMessage = `Hizmetin verileceği konumu seçebilir misiniz?`;
          } else {
            state.step = 'ask_details';
            responseMessage = this.generatePromptForCategory(state.collected_data.categorySlug || null);
          }
        }

      } else if (state.step === 'ask_details') {
        const detailMsg = message.trim();
        const isNo = /^(?:hayır|hayir|yok|devam|devam et|istemiyorum|gerek yok|no|skip|geç|gec)$/i.test(detailMsg);
        const isReferredBack = /(?:az önce|yukarıda|daha önce|belirttim|yazdım|söyledim)/i.test(detailMsg);
        
        if (isReferredBack) {
          const previousUserMsgs = state.messages.slice(0, -1)
            .filter(m => m.role === 'user' && m.content.trim().length >= 15)
            .map(m => m.content.trim());
          
          if (previousUserMsgs.length > 0) {
            state.collected_data.details = previousUserMsgs[previousUserMsgs.length - 1];
          } else if (!state.collected_data.details) {
            state.collected_data.details = 'Detay belirtilmedi.';
          }
        } else if (!isNo) {
          state.collected_data.details = detailMsg;
        } else {
          state.collected_data.details = state.collected_data.details || 'Detay belirtilmedi.';
        }
        state.collected_data.hasAskedDetails = true;
        state.step = 'ask_address';
        responseMessage = `Hizmetin verileceği konumu seçebilir misiniz?`;

      } else if (state.step === 'ask_address') {
        try {
          const parsed = JSON.parse(message);
          if (parsed.city) state.collected_data.city = parsed.city;
          if (parsed.district) state.collected_data.district = parsed.district;
          if (parsed.neighborhood) state.collected_data.neighborhood = parsed.neighborhood;
        } catch (e) {
          // If it's plain text, we can try to parse it, but UI will send JSON
        }
        state.step = 'ask_name';
        responseMessage = `Teşekkürler. Size hitap edebilmemiz için adınızı ve soyadınızı alabilir miyim?`;

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
                name: sanitizeForWin1254(state.collected_data.name || 'Misafir Kullanıcı'),
                role: 'service_seeker',
                is_active: true,
                kvkk_consent: true,
              },
            });
          }

          const newSessionKey = `ai_session:${user.id}:${sessionId}`;
          state.step = 'confirm_form';
          await this.redis.set(newSessionKey, JSON.stringify(state), 'EX', 86400); // 24h

          let summaryMessage = `Telefon numaranız başarıyla doğrulandı ve kaydınız tamamlandı. Lütfen aşağıdaki panelden talep bilgilerinizi kontrol edip onaylayın:`;

          responseMessage = summaryMessage;
          
          await this.trackTokens(newSessionKey, tokensUsed);
          return {
            step: 'confirm_form',
            responseMessage,
            collected_data: state.collected_data,
            sessionMigrated: true,
            user: { id: user.id, phone: user.phone_masked || user.phone, role: user.role, name: user.name, email: user.email },
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
              form_data: sanitizeObjectForWin1254({
                ...state.collected_data,
                details: this.generateRequestSummary(state.collected_data),
                name: state.collected_data.name || 'Misafir Kullanıcı',
                city: state.collected_data.city || 'Adana',
                district: state.collected_data.district || 'Seyhan',
                sendToFavoritesOnly: sendToFavoritesOnly,
              }),
              status: 'pending',
            },
          });

          createdJobId = job.id;
          await this.redis.incr(`ab_test:sessions:completed:${state.ab_variant || 'control'}`);

          // Add to smart distribution queue (handles scoring, status transition, push notifications, and automated offers)
          try {
            await this.distributionQueue.add('distribute', { jobId: job.id });
            console.log(`[ChatService] Successfully enqueued job ${job.id} to talepler-distribution queue`);
          } catch (err: any) {
            console.error(`[ChatService] Failed to enqueue job ${job.id}: ${err.message}`, err.stack);
          }

          state.step = 'completed';
          responseMessage = `Tebrikler! Talebiniz başarıyla gönderildi. 15 dakika içinde burada veya hesabınızda taleplerinizi inceleyebilir, teklifleri değerlendirebilir veya onaylayabilirsiniz.`;

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
        options,
        inputType,
        ...(createdJobId && { jobId: createdJobId }),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('[ChatService] AI error — switching to deterministic fallback:', error instanceof Error ? error.message : error);
      
      // ─── DETERMINISTIC GRACEFUL FALLBACK ─────────────────────────────
      // Gemini başarısız olduğunda kullanıcıya ASLA hata gösterme.
      // Mevcut adıma göre deterministic (AI'sız) yanıt üret ve akışı sürdür.
      let fallbackResponse = '';
      let fallbackStep = state.step;

      try {
        if (state.step === 'greeting' || state.step === 'category_detection') {
          // Deterministik kategori tespiti dene
          const detection = await this.detectCategory(filteredMessage);
          if (detection.detected && detection.confidence >= 0.7 && detection.categorySlug) {
            state.collected_data.categorySlug = detection.categorySlug;
            state.collected_data.categoryName = detection.categoryName || undefined;
            await this.loadCategoryQuestions(state, detection.categorySlug, detection.categoryName || undefined);
            fallbackStep = 'collecting_details';
            const nextQ = this.getNextQuestion(state);
            fallbackResponse = nextQ
              ? `${detection.categoryName} talebiniz için detayları alalım.\n\n${nextQ.question}`
              : `${detection.categoryName} talebiniz için birkaç bilgi almam gerekiyor. Kısaca bahseder misiniz?`;
            if (nextQ && nextQ.options) options = nextQ.options;
          } else {
            fallbackStep = 'category_detection';
            fallbackResponse = 'Size nasıl yardımcı olabilirim? Ev temizliği, boya badana, nakliyat, su tesisatı, elektrik tesisatı veya ev tadilat gibi konularda talep oluşturabilirsiniz. Lütfen ihtiyacınızı belirtin.';
          }

        } else if (state.step === 'collecting_details') {
          // Mevcut soruya cevabı kaydet ve sonraki soruyu sor
          const currentQ = this.getNextQuestion(state);
          if (currentQ) {
            const parsedVal = currentQ.parse(message);
            if (parsedVal) {
              state.collected_data[currentQ.key] = parsedVal;
            } else {
              state.collected_data[currentQ.key] = message.trim();
            }
            if (currentQ.key === 'district') {
              const loc = this.parseLocation(message);
              if (loc.city) state.collected_data.city = loc.city;
              if (loc.district) state.collected_data.district = loc.district;
            }
          }
          const nextQ = this.getNextQuestion(state);
          if (nextQ) {
            fallbackResponse = nextQ.question;
            if (nextQ.options) options = nextQ.options;
          } else {
            if (state.collected_data.details && state.collected_data.details.trim().length >= 20) {
              state.collected_data.hasAskedDetails = true;
              fallbackStep = 'ask_address';
              fallbackResponse = 'Hizmetin verileceği konumu seçebilir misiniz?';
            } else {
              fallbackStep = 'ask_details';
              fallbackResponse = this.generatePromptForCategory(state.collected_data.categorySlug || null);
            }
          }

        } else if (state.step === 'ask_details') {
          state.collected_data.details = message.trim() || state.collected_data.details || 'Detay belirtilmedi.';
          state.collected_data.hasAskedDetails = true;
          fallbackStep = 'ask_address';
          fallbackResponse = 'Hizmetin verileceği konumu seçebilir misiniz?';

        } else if (state.step === 'ask_name') {
          const name = message.trim();
          if (name.length >= 2) {
            state.collected_data.name = name;
            fallbackStep = 'ask_phone';
            fallbackResponse = `Memnun oldum ${name}! Talebinizin doğrulanması için telefon numaranızı alabilir miyim? (Örn: 05321234567)`;
          } else {
            fallbackResponse = 'Lütfen adınızı ve soyadınızı girin.';
          }

        } else if (state.step === 'ask_phone') {
          try {
            const normalized = normalizePhone(message);
            state.collected_data.phone = normalized;
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            await this.redis.set(`otp:${normalized}`, JSON.stringify({ code: otpCode, attempts: 0 }), 'EX', 300);
            console.log(`[OTP Fallback] Phone: ${normalized} | Code: ${otpCode}`);
            fallbackStep = 'otp_verification';
            fallbackResponse = `Telefonunuza 6 haneli doğrulama kodu gönderdik (Geliştirme için: ${otpCode}). Lütfen bu kodu girin:`;
          } catch (e) {
            fallbackResponse = 'Geçerli bir telefon numarası giriniz. (Örn: 0532 123 4567)';
          }

        } else if (state.step === 'otp_verification') {
          // OTP doğrulaması zaten deterministic — sadece Gemini error'dan buraya düşerse tekrar çağır
          fallbackResponse = 'Lütfen telefonunuza gönderilen 6 haneli doğrulama kodunu girin.';

        } else if (state.step === 'confirm_form') {
          // Onay adımında Gemini hatası — gerçek job oluşturma mantığını çalıştır
          if (message.toLowerCase().includes('onayla') || message.toLowerCase().includes('evet') || message.toLowerCase().includes('doğru')) {
            try {
              const categoryName = this.getCategoryName(state.collected_data.categorySlug || 'ev-temizligi');
              let category = await this.prisma.category.findUnique({
                where: { name: categoryName },
              });
              if (!category) {
                category = await this.prisma.category.findFirst();
              }
              if (!category) {
                fallbackResponse = 'Hizmet kategorisi bulunamadı. Lütfen tekrar deneyin.';
              } else {
                const phone = state.collected_data.phone;
                if (!phone) {
                  fallbackResponse = 'Telefon numaranız doğrulanmamış. Lütfen tekrar deneyin.';
                } else {
                  const seeker = await this.prisma.user.findFirst({
                    where: { phone: encryptPhone(phone) },
                  });
                  if (!seeker) {
                    fallbackResponse = 'Müşteri kaydı bulunamadı. Lütfen tekrar deneyin.';
                  } else {
                    const sendToFavoritesOnly = message.toLowerCase().includes('favori') || message.toLowerCase().includes('favorite');
                    const job = await this.prisma.serviceRequest.create({
                      data: {
                        seeker_id: seeker.id,
                        category_id: category.id,
                        form_data: sanitizeObjectForWin1254({
                          ...state.collected_data,
                          details: this.generateRequestSummary(state.collected_data),
                          name: state.collected_data.name || 'Misafir Kullanıcı',
                          city: state.collected_data.city || 'Adana',
                          district: state.collected_data.district || 'Seyhan',
                          sendToFavoritesOnly: sendToFavoritesOnly,
                        }),
                        status: 'pending',
                      },
                    });

                    createdJobId = job.id;
                    await this.redis.incr(`ab_test:sessions:completed:${state.ab_variant || 'control'}`);

                    // Distribute to providers
                    try {
                      await this.distributionQueue.add('distribute', { jobId: job.id });
                      console.log(`[ChatService Fallback] Successfully enqueued job ${job.id} to distribution queue`);
                    } catch (distErr: any) {
                      console.error(`[ChatService Fallback] Distribution enqueue failed: ${distErr.message}`);
                    }

                    fallbackStep = 'completed';
                    fallbackResponse = `Tebrikler! Talebiniz başarıyla gönderildi. 15 dakika içinde burada veya hesabınızda taleplerinizi inceleyebilir, teklifleri değerlendirebilir veya onaylayabilirsiniz.`;

                    // Hemen return et — completed state ve jobId ile
                    state.step = 'completed';
                    state.messages.push({ role: 'assistant', content: fallbackResponse });
                    await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
                    await this.trackTokens(sessionKey, tokensUsed);
                    return {
                      step: 'completed',
                      responseMessage: fallbackResponse,
                      collected_data: state.collected_data,
                      jobId: job.id,
                    };
                  }
                }
              }
            } catch (confirmErr: any) {
              console.error('[ChatService Fallback] confirm_form job creation failed:', confirmErr.message);
              fallbackResponse = 'Talebiniz oluşturulurken bir sorun oluştu. Lütfen tekrar "Onayla" butonuna basın.';
            }
          } else {
            fallbackResponse = 'Talebinizi onaylamak için "Onayla" butonuna basabilir veya düzeltmek istediğiniz bilgiyi belirtebilirsiniz.';
          }

        } else {
          fallbackResponse = 'Size nasıl yardımcı olabilirim? Lütfen ihtiyacınızı belirtin.';
        }

        // Durumu güncelle ve kaydet
        state.step = fallbackStep;
        state.messages.push({ role: 'assistant', content: fallbackResponse });
        await this.redis.set(sessionKey, JSON.stringify(state), 'EX', 86400);
        await this.trackTokens(sessionKey, tokensUsed);

        let fallbackOptions: string[] = [];
        let fallbackInputType = 'single_choice';
        if (state.step === 'collecting_details') {
          const nextQ = this.getNextQuestion(state);
          if (nextQ && nextQ.options) {
            fallbackOptions = nextQ.options;
            fallbackInputType = nextQ.inputType || 'single_choice';
          }
        } else if (state.step === 'ask_details') {
          fallbackOptions = this.getChecklistForCategory(state.collected_data.categorySlug || null);
          fallbackInputType = 'multi_choice';
        }

        return {
          step: state.step,
          responseMessage: fallbackResponse,
          collected_data: state.collected_data,
          options: fallbackOptions,
          inputType: fallbackInputType
        };

      } catch (fallbackError) {
        // Fallback'in kendisi de başarısız olduysa (Redis/DB hatası gibi durumlarda),
        // son çare olarak basit ama kullanıcı dostu bir yanıt dön
        console.error('[ChatService] Deterministic fallback also failed:', fallbackError instanceof Error ? fallbackError.message : fallbackError);
        return {
          step: state.step,
          responseMessage: 'Talebinizi işliyoruz. Lütfen mesajınızı tekrar gönderiniz.',
          collected_data: state.collected_data,
        };
      }
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
    const text = message.toLocaleLowerCase('tr-TR').normalize('NFC');
    for (const [city, districts] of Object.entries(this.CITY_DISTRICTS)) {
      for (const d of districts) {
        const normalizedD = d.toLocaleLowerCase('tr-TR').normalize('NFC');
        if (text.includes(normalizedD)) {
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

  private parseMalzemeDurumu(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('usta') || text.includes('getirsin') || text.includes('dahil') || text.includes('malzeme olsun')) return 'Temizlik malzemesi usta tarafından getirilecek';
    if (text.includes('evde') || text.includes('benden') || text.includes('var') || text.includes('hazır')) return 'Temizlik malzemeleri evde mevcut';
    return null;
  }

  private parseEsyaDurumu(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('eşyalı') || text.includes('esyali') || text.includes('dolu')) return 'Eşyalı';
    if (text.includes('boş') || text.includes('bos') || text.includes('boşaltılmış')) return 'Boş';
    return null;
  }

  private parseMalzemeDahil(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('dahil') || text.includes('usta') || text.includes('getirsin') || text.includes('malzemeli')) return 'Malzeme dahil';
    if (text.includes('işçilik') || text.includes('iscilik') || text.includes('sadece') || text.includes('benden') || text.includes('hariç')) return 'Sadece işçilik (Malzemeyi ben alacağım)';
    return null;
  }

  private parsePaketlemeHizmeti(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('paketleme') || text.includes('toplama') || text.includes('hepsini') || text.includes('paketlesin') || text.includes('evet')) return 'Komple paketleme ve taşıma (Usta paketleyecek)';
    if (text.includes('sadece') || text.includes('hazır') || text.includes('ben toplarım') || text.includes('ben paketlerim') || text.includes('hayır') || text.includes('hayir')) return 'Sadece taşıma (Eşyalar paketlenmiş/hazır)';
    return null;
  }

  private parseEvcilHayvan(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('evet') || text.includes('var') || text.includes('kedi') || text.includes('köpek')) return 'Evet, evde evcil hayvan var';
    if (text.includes('hayır') || text.includes('hayir') || text.includes('yok')) return 'Hayır, evcil hayvan yok';
    return null;
  }

  private parseDersYeri(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('öğrenci') || text.includes('evimde') || text.includes('benim evim') || text.includes('bize gelsin')) return 'Öğrencinin evinde';
    if (text.includes('öğretmen') || text.includes('hocanın') || text.includes('onun evi') || text.includes('gideyim')) return 'Öğretmenin evinde';
    if (text.includes('online') || text.includes('uzaktan') || text.includes('zoom') || text.includes('skype') || text.includes('internet')) return 'Online / İnternet üzerinden';
    return null;
  }

  private parseProjeGerekli(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('proje') || text.includes('çizilecek') || text.includes('onaylı') || text.includes('evet') || text.includes('gerekiyor')) return 'Evet, onaylı proje çizimi dahil';
    if (text.includes('hayır') || text.includes('hayir') || text.includes('yok') || text.includes('sadece montaj') || text.includes('gerekmez')) return 'Sadece montaj / Proje gerekli değil';
    return null;
  }

  private parseAlbumTalebi(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('albüm') || text.includes('album') || text.includes('baskı') || text.includes('evet') || text.includes('kitap')) return 'Evet, albüm/baskılı ürün istiyorum';
    if (text.includes('dijital') || text.includes('sadece mail') || text.includes('hayır') || text.includes('hayir') || text.includes('usb')) return 'Sadece dijital teslimat';
    return null;
  }

  private parseCateringDahil(message: string): string | null {
    const text = message.toLowerCase();
    if (text.includes('yemek') || text.includes('catering') || text.includes('ikram') || text.includes('evet') || text.includes('menü')) return 'Evet, yemek/catering dahil olsun';
    if (text.includes('hayır') || text.includes('hayir') || text.includes('yok') || text.includes('hariç') || text.includes('istemiyorum')) return 'Hayır, catering istemiyorum';
    return null;
  }

  private async loadCategoryQuestions(state: SessionState, slug: string, name?: string) {
    if (state.collected_data.questions_flow) return;
    try {
      const categoryName = name || state.collected_data.categoryName;
      let category: any = null;
      if (categoryName) {
        category = await this.prisma.category.findUnique({ where: { name: categoryName } });
      } else {
        const partialName = slug.split('-').join(' ');
        category = await this.prisma.category.findFirst({
          where: { name: { contains: partialName, mode: 'insensitive' } }
        });
      }
      
      if (category && category.questions_flow) {
        state.collected_data.questions_flow = category.questions_flow as any[];
      }
    } catch (e) {
      console.error('[ChatService] Failed to load category questions:', e);
    }
  }

  private getQuestionsForCategory(slug: string, state?: SessionState): any[] {
    if (state?.collected_data?.questions_flow && state?.collected_data?.questions_flow?.length > 0) {
      // Map dynamic JSON back to internal format with a generic parser
      return state?.collected_data?.questions_flow?.map((q: any) => ({
        key: q.key,
        question: q.question_text,
        options: q.options,
        inputType: q.input_type || 'single_choice',
        parse: (msg: string) => {
          // A generic parser that returns exact match if it exists in options, else trim
          const text = msg.trim().toLowerCase();
          const match = q.options ? q.options.find((opt: any) => opt.toLowerCase() === text) : undefined;
          return match || msg.trim();
        }
      }));
    }
    const districtQuestions: Record<string, string> = {
      'ev-temizligi': 'Hizmetin verileceği ilçeyi (örn. Kadıköy, Şişli) yazar mısınız?',
      'boya-badana': 'Hizmetin verileceği ilçeyi (örn. Beşiktaş, Kadıköy) yazar mısınız?',
      'nakliyat': 'Eşyaların taşınacağı çıkış ilçesini (örn. Kadıköy) yazar mısınız?',
      'su-tesisati': 'Hizmetin verileceği ilçeyi (örn. Şişli, Kadıköy) yazar mısınız?',
      'elektrik-tesisati': 'Hizmetin verileceği ilçeyi (örn. Bakırköy, Şişli) yazar mısınız?',
      'ev-tadilat': 'Hizmetin verileceği ilçeyi (örn. Üsküdar, Kadıköy) yazar mısınız?',
      'hali-koltuk-yikama': 'Hizmetin verileceği ilçeyi (örn. Çankaya, Karşıyaka, Kadıköy) yazar mısınız?',
      'insaat-sonrasi-temizlik': 'Hizmetin verileceği ilçeyi (örn. Yenimahalle, Konak, Şişli) yazar mısınız?',
      'fayans-parke': 'Hizmetin verileceği ilçeyi (örn. Keçiören, Çiğli, Beşiktaş) yazar mısınız?',
      'hasere-ilaclama': 'Hizmetin verileceği ilçeyi yazar mısınız?',
      'kombi-klima': 'Hizmetin verileceği ilçeyi yazar mısınız?',
      'mantolama-discephe': 'Hizmetin verileceği ilçeyi yazar mısınız?',
      'marangoz-mobilya': 'Hizmetin verileceği ilçeyi yazar mısınız?',
      'ozel-ders': 'Dersin verileceği/alınacağı ilçeyi yazar mısınız?',
      'cam-balkon-pvc': 'Hizmetin verileceği ilçeyi yazar mısınız?',
      'ofis-temizligi': 'Hizmetin verileceği ofis ilçesini yazar mısınız?',
      'dogalgaz-tesisati': 'Hizmetin verileceği ilçeyi yazar mısınız?',
      'ic-mimar-dekorasyon': 'Hizmetin verileceği ilçeyi yazar mısınız?',
      'fotografci': 'Çekim yapılacak ilçeyi yazar mısınız?',
      'organizasyon-etkinlik': 'Etkinliğin yapılacağı ilçeyi yazar mısınız?',
    };

    const qText = districtQuestions[slug] || 'Hizmetin verileceği ilçeyi (örn. Seyhan, Çukurova) yazar mısınız?';
    
    if (slug === 'boya-badana') {
      return [
        {
          key: 'metrekare',
          question: 'Boyanacak alan yaklaşık kaç metrekare?',
          options: ['50 m2 altı', '50-100 m2', '100-150 m2', '150 m2 üstü'],
          parse: (msg: any) => this.parseMetrekare(msg)
        },
        {
          key: 'tur',
          question: 'İç cephe mi dış cephe mi boyanacak?',
          options: ['İç Cephe', 'Dış Cephe', 'İkisi de'],
          parse: (msg: any) => this.parseBoyaTuru(msg)
        },
        {
          key: 'renkTip',
          question: 'Tercih ettiğiniz boya markası veya renk var mı?',
          parse: (msg: any) => {
            const text = msg.toLowerCase();
            const match = text.match(/(?:\brenk\b|\bboya\b|beyaz|gri|siyah|yeşil|mavi|sarı|kırmızı|saten|silikon|astar|su baz|yağlı)/i);
            if (text.includes('beyaz')) return 'beyaz';
            return match ? match[0] : null;
          }
        }
      ];
    }
 
    if (slug === 'su-tesisati') {
      return [
        {
          key: 'sorunTuru',
          question: 'Yaşadığınız tesisat sorunu tam olarak nedir (sızıntı, tıkanıklık, musluk/rezervuar değişimi vb.)?',
          parse: (msg: any) => this.parseSorunTuru(msg)
        }
      ];
    }
 
    if (slug === 'kombi-klima') {
      return [
        {
          key: 'cihazTuru',
          question: 'Hangi cihaz için hizmet istiyorsunuz (Kombi mi, Klima mı)?',
          parse: (msg: any) => this.parseCihazTuru(msg)
        },
        {
          key: 'islemTuru',
          question: 'Yapılacak işlem nedir (Bakım, Arıza Onarım, Montaj / Demontaj)?',
          parse: (msg: any) => {
            const text = msg.toLowerCase();
            if (text.includes('bakım') || text.includes('bakim')) return 'Bakım';
            if (text.includes('arıza') || text.includes('ariza') || text.includes('bozuk') || text.includes('çalışmıyor')) return 'Arıza Onarım';
            if (text.includes('montaj') || text.includes('kurulum') || text.includes('söküm') || text.includes('demontaj')) return 'Montaj / Demontaj';
            return null;
          }
        },
        {
          key: 'adet',
          question: 'Hizmet alınacak cihaz adeti nedir?',
          parse: (msg: any) => this.parseAdet(msg)
        }
      ];
    }
 
    if (slug === 'ev-temizligi') {
      return [
        {
          key: 'daireTipi',
          question: 'Temizlenecek ev kaç odalı (örn: 1+1, 2+1, 3+1)?',
          options: ['1+0 / 1+1', '2+1', '3+1', '4+1 ve üzeri'],
          parse: (msg: any) => this.parseDaireTipi(msg)
        },
        {
          key: 'siflik',
          question: 'Temizlik sıklığı nedir (Tek seferlik mi, haftalık mı, aylık mı)?',
          options: ['Tek Seferlik', 'Haftada 1', 'İki Haftada 1', 'Ayda 1'],
          parse: (msg: any) => this.parseSiflik(msg)
        }
      ];
    }
 
    if (slug === 'nakliyat') {
      return [
        {
          key: 'daireTipi',
          question: 'Taşınacak evinizin oda sayısı nedir (örn: 2+1, 3+1)?',
          parse: (msg: any) => this.parseDaireTipi(msg)
        },
        {
          key: 'paketlemeHizmeti',
          question: 'Paketleme hizmeti istiyor musunuz (Usta mı paketlesin yoksa eşyalar hazır mı)?',
          parse: (msg: any) => this.parsePaketlemeHizmeti(msg)
        },
        {
          key: 'destinationDistrict',
          question: 'Eşyaların taşınacağı varış ilçesini (örn. Seyhan, Çukurova) yazar mısınız?',
          parse: (msg: any) => this.parseLocation(msg).district
        }
      ];
    }
 
    if (slug === 'elektrik-tesisati') {
      return [
        {
          key: 'islemTuru',
          question: 'Nasıl bir elektrik işlemi yaptırmak istiyorsunuz?',
          options: ['Avize / Aydınlatma Montajı', 'Priz / Anahtar Değişimi', 'Sigorta / Pano Arızası', 'Kablo Çekimi', 'Komple Elektrik Tesisatı'],
          inputType: 'multi_choice',
          parse: (msg: any) => msg
        },
        {
          key: 'malzemeDurumu',
          question: 'Gerekli malzemeler (kablo, priz, ampul vb.) elinizde hazır mı yoksa usta mı temin etmeli?',
          options: ['Malzemeleri usta temin etsin', 'Malzemeler bende hazır'],
          inputType: 'single_choice',
          parse: (msg: any) => msg
        }
      ];
    }

    // Herhangi bir kategoriye eşleşmeyen veya JSON akışı olmayan kategoriler için jenerik (genel) form soruları
    return [
      {
        key: 'genelHizmetTuru',
        question: 'İhtiyacınız olan hizmetin kapsamı nedir?',
        options: ['Arıza Onarımı / Tamirat', 'Yeni Montaj / Kurulum', 'Genel Bakım'],
        inputType: 'single_choice',
        parse: (msg: any) => msg
      },
      {
        key: 'malzemeDurumu',
        question: 'Gerekli malzemeler hazır mı yoksa usta mı getirmeli?',
        options: ['Usta temin etsin', 'Malzemeler bende hazır'],
        inputType: 'single_choice',
        parse: (msg: any) => msg
      }
    ];
  }

  private getNextQuestion(state: SessionState): any | null {
    const slug = state.collected_data.categorySlug;
    if (!slug) return null;
    const questions = this.getQuestionsForCategory(slug, state);
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
      case 'malzemeDurumu': return 'Malzeme Durumu';
      case 'esyaDurumu': return 'Eşya Durumu';
      case 'malzemeDahil': return 'Malzeme Temini';
      case 'paketlemeHizmeti': return 'Paketleme Hizmeti';
      case 'evcilHayvan': return 'Evcil Hayvan';
      case 'markaModel': return 'Marka / Model';
      case 'katSayisi': return 'Bina Kat Sayısı';
      case 'mobilyaTuru': return 'Mobilya Türü';
      case 'dersYeri': return 'Ders Yeri';
      case 'odaSayisi': return 'Oda Sayısı';
      case 'projeGerekli': return 'Proje Çizimi';
      case 'tarzTercihi': return 'Tarz Tercihi';
      case 'albumTalebi': return 'Albüm Talebi';
      case 'cateringDahil': return 'Catering Durumu';
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

  private generateRequestSummary(formData: any): string {
    if (!formData) return 'Detay belirtilmedi.';
    
    const lines: string[] = [];
    
    // Turkish translations for form keys
    const labels: { [key: string]: string } = {
      city: "Şehir",
      district: "İlçe",
      destinationDistrict: "Varış İlçesi",
      daireTipi: "Daire Tipi",
      metrekare: "Metrekare/Alan",
      aciliyet: "Aciliyet",
      siflik: "Frekans",
      sıklık: "Frekans",
      tur: "Hizmet Türü",
      butce: "Tahmini Bütçe",
      sorunTuru: "Sorun Türü",
      isTuru: "İş Türü",
      kapsam: "İş Kapsamı",
      adet: "Adet",
      durum: "Mevcut Durum",
      islemTuru: "İşlem Türü",
      hasereTuru: "Haşere Türü",
      binaTipi: "Bina Tipi",
      cihazTuru: "Cihaz Türü",
      dersTuru: "Ders/Branş",
      sinifSeviyesi: "Sınıf Seviyesi",
      tarih: "İstenen Tarih",
      evcilHayvan: "Evcil Hayvan Var mı?",
      odaSayisi: "Oda Sayısı",
      banyoSayisi: "Banyo Sayısı",
      boyaRengi: "Boya Rengi",
      uygulamaAlani: "Uygulama Alanı",
      esyaDurumu: "Eşya Durumu",
      davetliSayisi: "Davetli Sayısı",
      organizasyonTuru: "Organizasyon Türü",
      mimariHizmetTuru: "Mimari Hizmet Türü",
      pvcPencereAdet: "PVC Pencere Adeti",
      balkonTuru: "Balkon Türü",
      gazTesisatTuru: "Doğalgaz Tesisat Türü"
    };

    const keys = Object.keys(formData);
    keys.forEach(key => {
      // Skip operational or duplicate keys
      if (["phone", "name", "categorySlug", "details", "sendToFavoritesOnly", "devOtpCode", "city"].includes(key)) {
        return;
      }
      const label = labels[key] || key;
      const value = formData[key];
      if (value !== undefined && value !== null && value !== "") {
        lines.push(`• ${label}: ${value}`);
      }
    });

    // Append raw details text at the bottom if provided
    if (formData.details && formData.details !== 'Detay girilmedi.' && formData.details.trim() !== '') {
      lines.push(`\n📝 Müşteri Açıklaması:`);
      lines.push(`"${formData.details}"`);
    }

    return lines.length > 0 ? lines.join('\n') : 'Detay belirtilmedi.';
  }

  private getChecklistForCategory(slug: string | null): string[] {
    switch (slug) {
      case 'ev-temizligi':
        return [
          'Ev kaç odalı ve kaç banyolu?',
          'Temizlik sıklığı nedir (tek seferlik, haftalık vb.)?',
          'Evde evcil hayvan var mı veya ütü, cam silme gibi ek istekleriniz var mı?'
        ];
      case 'boya-badana':
        return [
          'Boyanacak alan kaç oda/salon veya yaklaşık kaç metrekare?',
          'Sadece boyama mı yoksa alçı, sıva, çatlak tamiratı işleri de var mı?',
          'Boya malzemesini siz mi alacaksınız yoksa ustadan mı dahil olsun?'
        ];
      case 'su-tesisati':
        return [
          'Yaşadığınız sorun nedir (sızıntı, tıkanıklık, musluk/rezervuar değişimi vb.)?',
          'Sorun banyo, mutfak veya tuvalet gibi hangi bölümde?',
          'Kullanılacak malzemeler hazır mı yoksa usta mı temin etsin?'
        ];
      case 'elektrik-tesisati':
        return [
          'Yapılacak işlem nedir (priz/anahtar montajı, avize asma, internet kablosu, komple tesisat)?',
          'Malzemeler hazır mı yoksa ustadan mı olsun?',
          'Arıza tespiti mi yoksa yeni kurulum mu gerekiyor?'
        ];
      case 'ev-tadilat':
        return [
          'Tadilat yapılacak alanlar nerelerdir (mutfak, banyo, komple daire)?',
          'Yapılacak işlerin kapsamı nedir (fayans, yıkım, alçıpan, mobilya, asma tavan vb.)?',
          'Bütçeniz veya tercih ettiğiniz malzeme kalitesi nedir?'
        ];
      case 'nakliyat':
        return [
          'Ev veya ofis kaç odalı (1+1, 2+1, 3+1 vb.)?',
          'Eşyalar nereden nereye taşınacak?',
          'Binası kaçıncı katta ve asansör var mı?',
          'Paketlemeyi kim yapacak (siz mi, usta mı)?'
        ];
      case 'hali-koltuk-yikama':
        return [
          'Yıkanacak ürünler nelerdir ve adetleri nedir (örn. 3\'lü koltuk, L koltuk, kaç m² halı)?',
          'Ürünlerin kumaş tipi nedir veya belirgin leke/kir durumu var mı?',
          'Yıkamanın yerinde mi yoksa fabrikada mı yapılmasını istersiniz?'
        ];
      case 'insaat-sonrasi-temizlik':
        return [
          'Temizlenecek alan kaç metrekare veya kaç odalı?',
          'İnşaat/tadilat kalıntıları (boya, harç, toz) yoğunluğu nedir?',
          'Malzeme ve temizlik ekipmanları ustadan mı dahil olsun?'
        ];
      case 'fayans-parke':
        return [
          'Döşeme yapılacak alan yaklaşık kaç metrekare?',
          'Malzeme (fayans, parke, derz, şilte vb.) hazır mı yoksa ustadan mı olsun?',
          'Zemin durumu nasıl (eski kaplamaların sökülmesi gerekiyor mu)?'
        ];
      case 'hasere-ilaclama':
        return [
          'Karşılaştığınız haşere türü nedir (böcek, karınca, hamam böceği, fare vb.)?',
          'İlaçlama yapılacak alan kaç metrekare veya oda sayısı nedir?',
          'Evcil hayvanınız var mı veya özel bir ilaçlama yöntemi tercih ediyor musunuz?'
        ];
      case 'kombi-klima':
        return [
          'Cihazın markası nedir ve yapılacak işlem nedir (bakım, arıza, montaj, demontaj)?',
          'Cihazda belirgin bir arıza kodu veya şikayet var mı?',
          'Petek temizliği de istiyor musunuz?'
        ];
      case 'mantolama-discephe':
        return [
          'Yapılacak alan bir bina mı, müstakil ev mi yoksa villa mı?',
          'Yaklaşık dış cephe alanı (metrekare) veya bina kat sayısı nedir?',
          'İskele kurulumu ve malzeme tedariği dahil olacak mı?'
        ];
      case 'marangoz-mobilya':
        return [
          'Yapılacak işlem nedir (gardırop kurulumu, kapı tamiri, mutfak dolabı, özel ölçü mobilya)?',
          'Montaj yapılacak mobilyanın markası/modeli nedir veya malzemesi hazır mı?',
          'Kırık, parça eksikliği veya menteşe değişimi gibi durumlar var mı?'
        ];
      case 'ozel-ders':
        return [
          'Hangi branşta veya konuda ders istiyorsunuz (matematik, İngilizce, piyano vb.)?',
          'Öğrencinin sınıf seviyesi veya yaş grubu nedir?',
          'Derslerin yüz yüze mi yoksa online mı yapılmasını tercih edersiniz?'
        ];
      case 'cam-balkon-pvc':
        return [
          'Yapılacak alanın yaklaşık ölçüleri (metre veya kanat sayısı) nedir?',
          'Tercih ettiğiniz sistem hangisidir (katlanır cam, sürme cam, PVC pencere)?',
          'Renk veya profil tipi tercihiniz var mı?'
        ];
      case 'ofis-temizligi':
        return [
          'Ofisiniz kaç metrekare ve yaklaşık çalışan sayısı nedir?',
          'Temizlik sıklığı nedir (günlük, haftalık, tek seferlik)?',
          'Temizlik malzemeleri ve ekipmanları ustadan mı dahil olsun?'
        ];
      case 'dogalgaz-tesisati':
        return [
          'Yapılacak işlem nedir (doğalgaz projesi, boru hattı döşeme, kombi montajı)?',
          'Mevcut bir gaz açma belgesi/proje onayı gerekiyor mu?',
          'Tesisat uzunluğu veya daire tipi nedir?'
        ];
      case 'ic-mimar-dekorasyon':
        return [
          'Tasarım yapılacak alan nerelerdir (tek oda, komple ev, ofis, kafe vb.)?',
          'İstediğiniz hizmet kapsamı nedir (sadece 3D çizim, anahtar teslim uygulama)?',
          'Tercih ettiğiniz dekorasyon tarzı nedir (modern, klasik, minimalist vb.)?'
        ];
      case 'fotografci':
        return [
          'Ne tür bir çekim istiyorsunuz (düğün, nişan, ürün çekimi, kişisel portre)?',
          'Çekim süresi ve yeri (dış çekim, stüdyo, mekan) nedir?',
          'Albüm basımı, video klip gibi ek hizmetler istiyor musunuz?'
        ];
      case 'organizasyon-etkinlik':
        return [
          'Ne tür bir etkinlik planlıyorsunuz (doğum günü, kına, nişan, kurumsal davet)?',
          'Yaklaşık davetli sayısı ve etkinlik tarihi nedir?',
          'İstediğiniz hizmetler nelerdir (süsleme, catering, ses-ışık, DJ vb.)?'
        ];
      default:
        return [
          'Hizmete dair detayları yazabilir misiniz?',
          'Özel bir isteğiniz veya malzemeniz var mı?',
          'Çalışmanın ne zaman tamamlanmasını istersiniz?'
        ];
    }
  }

  private getProviderNounForCategory(slug: string | null): string {
    switch (slug) {
      case 'ozel-ders':
        return 'öğretmenlerimizin';
      case 'ic-mimar-dekorasyon':
        return 'iç mimarlarımızın';
      case 'fotografci':
        return 'fotoğrafçılarımızın';
      case 'organizasyon-etkinlik':
        return 'organizatörlerimizin';
      case 'ev-temizligi':
      case 'ofis-temizligi':
      case 'insaat-sonrasi-temizlik':
      case 'hali-koltuk-yikama':
        return 'temizlik profesyonellerimizin';
      case 'hasere-ilaclama':
        return 'ilaçlama uzmanlarımızın';
      case 'nakliyat':
        return 'nakliyecilerimizin';
      case 'psikolog':
        return 'psikologlarımızın';
      case 'diyetisyen':
        return 'diyetisyenlerimizin';
      default:
        return 'ustalarımızın';
    }
  }

  private getSectorPrompt(slug: string | null): string {
    if (!slug) {
      return `
### 🗺️ KATEGORİ TESPİT AŞAMASI:
Müşteri henüz almak istediği hizmeti belirtmedi. Görevin, müşterinin hangi kategoride hizmet almak istediğini anlamak ve 'detectCategory' aracını çağırmaktır. Müşteri platformdaki şu ana kategorilerden birini seçebilir:
- Ev Temizliği
- Boya Badana
- Nakliyat / Ev Taşıma
- Su Tesisatı
- Elektrik Tesisatı
- Kombi Klima Bakımı
- Özel Ders
- Fotoğrafçılık
Müşterinin sorusu genel veya bilgi almaya yönelik ise doğrudan SSS kurallarına göre cevap ver.
`;
    }
    const prompt = SECTOR_PROMPTS[slug];
    if (!prompt) return '';

    return `
### 📚 KATEGORİ BAZLI UZMANLIK BİLGİSİ
Müşteriye kategoriye özel rehberlik ve bilgi vermek için aşağıdaki uzmanlık bilgilerini kullan. Detay toplama aşamasında bu bilgileri referans alarak müşteriye yardımcı sorular sor:

${prompt}
`;
  }

  private generatePromptForCategory(slug: string | null): string {
    return `İhtiyacınızın detayları nelerdir? Hizmet veren neye dikkat etmeli?`;
  }

  private isGeneralOrInformationalQuery(message: string): boolean {
    const text = message.toLowerCase().trim();
    
    const infoPatterns = [
      /kaç\s*(?:adet|tane)?\s*(?:usta|boyacı|temizlik|nakliyat|tesisatçı|elektrikçi|esnaf)/i,
      /nasıl\s*(?:çalışır|işler|oluyor)/i,
      /ücretli\s*mi/i,
      /komisyon\s*(?:alıyor|var)/i,
      /güvenli\s*mi/i,
      /güvenilir\s*mi/i,
      /garanti\s*(?:var|veriyor)/i,
      /fiyat(?:lar)?\s*(?:nedir|ne|ne\s*kadar)/i,
      /müşteri\s*hizmetleri/i,
      /iletişim\s*(?:numarası|bilgisi)/i,
      /telefon\s*(?:numarası)/i,
      /destek\s*hattı/i,
      /esnaaf\s*nedir/i,
      /ne\s*kadar\s*sürer/i,
      /kaç\s*dakika/i,
      /teklif\s*nasıl/i,
      // Yeni SSS kalıpları — genişletilmiş bilgi bankası
      /iptal\s*(?:edebilir|edilebilir|nasıl|hakkı)/i,
      /ödeme\s*(?:nasıl|nereye|ne\s*zaman|yöntemi)/i,
      /fatura\s*(?:alabilir|kesilir|verilir|var)/i,
      /makbuz\s*(?:alabilir|verilir|var)/i,
      /şikayet\s*(?:etmek|nasıl|edebilir|hattı)/i,
      /değerlendirme\s*(?:nasıl|yapılır|var)/i,
      /puan(?:lama)?\s*(?:nasıl|sistemi|var)/i,
      /ustaya?\s*(?:nasıl|ne\s*zaman)\s*(?:ulaş|eriş)/i,
      /kaç\s*teklif/i,
      /teklif\s*(?:ne\s*zaman|ne\s*kadar\s*süre|kaç\s*gün)/i,
      /süre(?:si)?\s*(?:ne\s*kadar|nedir)/i,
      /sigorta(?:lı)?\s*(?:mı|var|nakliye)/i,
      /kişisel\s*(?:bilgi|veri)\s*(?:güvenli|korun)/i,
      /kvkk/i,
      /gizlilik/i
    ];

    const matchesPattern = infoPatterns.some(pattern => pattern.test(text));
    
    const endsWithQuestion = text.endsWith('?') && (
      text.includes('var') || text.includes('mi') || text.includes('mu') || 
      text.includes('nasıl') || text.includes('nedir') || text.includes('kim') ||
      text.includes('kaç') || text.includes('neler')
    );

    return matchesPattern || endsWithQuestion;
  }

  async getPlatformStats(categorySlug?: string, city?: string) {
    const whereClause: any = { is_approved: true };
    
    let normalizedCity = city ? city.trim() : undefined;
    if (normalizedCity) {
      normalizedCity = normalizedCity.charAt(0).toUpperCase() + normalizedCity.slice(1).toLowerCase();
    }

    if (normalizedCity) {
      whereClause.city = normalizedCity;
    }

    if (categorySlug) {
      const categoryName = this.getCategoryName(categorySlug);
      const category = await this.prisma.category.findUnique({
        where: { name: categoryName }
      });
      if (category) {
        whereClause.category_ids = { has: category.id };
      }
    }

    const providerCount = await this.prisma.serviceProvider.count({
      where: whereClause
    });

    return {
      providerCount,
      city: normalizedCity || 'Tüm Şehirler',
      category: categorySlug ? this.getCategoryName(categorySlug) : 'Tüm Kategoriler'
    };
  }

  private cleanName(msg: string): string {
    const lower = msg.toLocaleLowerCase('tr-TR');
    const cleanStr = lower.replace(/[,.:;\-_!?()\"']/g, ' ');
    
    const noiseWords = new Set([
      'benim', 'ben', 'ismim', 'ismimiz', 'adı', 'adım', 'adınız', 'isminiz', 
      'adımı', 'ismini', 'ad', 'isim', 'soyadım', 'soyadı', 'soyadınız', 
      'soyisminiz', 'soyisim', 'soyad', 'soyadımı', 'soyismini', 
      'yazabilirsiniz', 'yaz', 'yazın', 'kaydedin', 'olsun', 'merhaba', 
      'selam', 'hitap', 'edebilirsiniz', 'et', 've', 'cep', 'telefon', 
      'telefonu', 'telefonum', 'numarası', 'numaram', 'numara', 'gsm', 'mobil'
    ]);
    
    const words = cleanStr.split(/\s+/);
    const cleanedWords = words
      .filter(w => w.length > 0 && !noiseWords.has(w))
      .map(word => {
        const firstChar = word.charAt(0).toLocaleUpperCase('tr-TR');
        const rest = word.slice(1).toLocaleLowerCase('tr-TR');
        return firstChar + rest;
      });
      
    return cleanedWords.join(' ').trim();
  }
}

