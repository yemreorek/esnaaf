import { Injectable, Logger } from '@nestjs/common';
import { QUESTION_FLOWS } from './question-flow.config';

export interface SessionState {
  step: string;
  collected_data: Record<string, any>;
  messages: Array<{ role: string; content: string }>;
}

@Injectable()
export class FlowEngineService {
  private readonly logger = new Logger(FlowEngineService.name);

  /**
   * Find the matching QUESTION_FLOWS configuration for any given category slug or keyword
   */
  public getFlowForCategory(slug?: string | null): any | null {
    if (!slug) return null;
    const raw = slug.toLowerCase().trim();
    const hyphenated = raw.replace(/_/g, '-');
    const underscored = raw.replace(/-/g, '_');

    if (QUESTION_FLOWS[raw]) return QUESTION_FLOWS[raw];
    if (QUESTION_FLOWS[hyphenated]) return QUESTION_FLOWS[hyphenated];
    if (QUESTION_FLOWS[underscored]) return QUESTION_FLOWS[underscored];

    if (raw.includes('bilgisayar') || raw.includes('kasa') || raw.includes('laptop')) return QUESTION_FLOWS['bilgisayar-temizligi'];
    if (raw.includes('dukkan') || raw.includes('dükkan') || raw.includes('is-yeri') || raw.includes('iş-yeri') || raw.includes('magaza') || raw.includes('mağaza')) return QUESTION_FLOWS['dukkan-temizligi'] || QUESTION_FLOWS['ofis-temizligi'];
    if (raw.includes('sarma') || raw.includes('manti') || raw.includes('mantı')) return QUESTION_FLOWS['yaprak-sarma-yapimi'];
    if (raw.includes('yemek')) return QUESTION_FLOWS['evde-yemek-pisirme'];
    if (raw.includes('kuru-temizleme') || raw.includes('kuru temizleme')) return QUESTION_FLOWS['kuru-temizleme'];
    if (raw.includes('yatak')) return QUESTION_FLOWS['yatak-yikama'];
    if (raw.includes('arac') || raw.includes('araç') || raw.includes('araba')) return QUESTION_FLOWS['arac-koltuk-yikama'];
    if (raw.includes('su-deposu') || raw.includes('depo')) return QUESTION_FLOWS['su-deposu-temizligi'];
    if (raw.includes('ofis-hali') || raw.includes('haliflex') || raw.includes('halıflex')) return QUESTION_FLOWS['ofis-hali-yikama'];

    if (raw.includes('petek')) return QUESTION_FLOWS['petek-temizligi'] || QUESTION_FLOWS['petek_temizligi'];
    if (raw.includes('cam')) return QUESTION_FLOWS['cam-temizligi'] || QUESTION_FLOWS['cam_temizligi'];
    if (raw.includes('hali') || raw.includes('halı')) return QUESTION_FLOWS['hali-yikama'] || QUESTION_FLOWS['hali_yikama'];
    if (raw.includes('koltuk')) return QUESTION_FLOWS['koltuk-yikama'] || QUESTION_FLOWS['evde-koltuk-yikama'] || QUESTION_FLOWS['koltuk_yikama'];
    if (raw.includes('bos-ev') || raw.includes('boş ev') || raw.includes('tasinma')) return QUESTION_FLOWS['bos-ev-temizligi'] || QUESTION_FLOWS['bos_ev_temizligi'];
    if (raw.includes('apartman') || raw.includes('merdiven')) return QUESTION_FLOWS['apartman-temizligi'] || QUESTION_FLOWS['apartman_temizligi'];
    if (raw.includes('utu') || raw.includes('ütü')) return QUESTION_FLOWS['evde-utu-hizmeti'] || QUESTION_FLOWS['utu-hizmeti'];

    if (raw.includes('elektrik')) return QUESTION_FLOWS['elektrik-tesisati'] || QUESTION_FLOWS['elektrik_tesisati'];
    if (raw.includes('su-tesisat') || (raw.includes('tesisat') && !raw.includes('elektrik') && !raw.includes('dogalgaz') && !raw.includes('petek') && !raw.includes('kombi'))) {
      return QUESTION_FLOWS['su-tesisati'] || QUESTION_FLOWS['su_tesisati'];
    }
    if (raw.includes('tadilat')) return QUESTION_FLOWS['ev-tadilat'] || QUESTION_FLOWS['ev_tadilat'];
    if (raw.includes('boya') || raw.includes('badana')) return QUESTION_FLOWS['boya-badana'] || QUESTION_FLOWS['boya_badana'];
    if (raw.includes('nakliyat') || raw.includes('tasima') || raw.includes('nakliye')) return QUESTION_FLOWS['nakliyat'];
    if (raw.includes('insaat-sonrasi') || raw.includes('insaat_sonrasi')) return QUESTION_FLOWS['insaat-sonrasi-temizlik'];
    if (raw.includes('fayans') || raw.includes('seramik')) return QUESTION_FLOWS['fayans-doseme'];
    if (raw.includes('parke')) return QUESTION_FLOWS['parke-doseme'];
    if (raw.includes('ilaclama') || raw.includes('bocek') || raw.includes('fare') || raw.includes('pire') || raw.includes('hasere')) return QUESTION_FLOWS['bocek-ilaclama'] || QUESTION_FLOWS['hasere-ilaclama'];
    if (raw.includes('kombi')) return QUESTION_FLOWS['kombi-servisi'];
    if (raw.includes('klima')) return QUESTION_FLOWS['klima-servisi'];
    if (raw.includes('fotograf')) return QUESTION_FLOWS['fotografci'];
    if (raw.includes('etkinlik') || raw.includes('organizasyon')) return QUESTION_FLOWS['organizasyon-etkinlik'] || QUESTION_FLOWS['etkinlik'];
    if (raw.includes('mimar') || raw.includes('dekorasyon')) return QUESTION_FLOWS['ic-mimar-dekorasyon'] || QUESTION_FLOWS['dekorasyon'];
    if (raw.includes('dogalgaz')) return QUESTION_FLOWS['dogalgaz-tesisati'];
    if (raw.includes('mantolama') || raw.includes('discephe') || raw.includes('dis-cephe')) return QUESTION_FLOWS['mantolama-discephe'];
    if (raw.includes('ofis')) return QUESTION_FLOWS['ofis-temizligi'];

    if (raw.includes('temizlik') || raw.includes('temizleyici') || raw.includes('kiralama') || raw.includes('buharli') || raw.includes('buharlı') || raw.includes('silme') || raw.includes('yikama')) {
      return QUESTION_FLOWS['ev-temizligi'];
    }

    return null;
  }

  /**
   * Get the current question details from flow
   */
  public getNextQuestionFromFlow(state: SessionState): any | null {
    const slug = state.collected_data.categorySlug;
    const flow = this.getFlowForCategory(slug);
    if (!slug || !flow) return null;

    const currentStepId = state.collected_data.current_step_id || flow.steps[0].step_id;
    state.collected_data.current_step_id = currentStepId;

    if (currentStepId === 'END') return null;

    // Intercept detail decision step if current step is step_detaylar or textarea detail step and decision hasn't been made
    if ((currentStepId === 'step_detaylar' || currentStepId === 'step_detaylar_aciklama' || currentStepId === 'step_ekstra_detay_text') &&
        state.collected_data['step_detay_var_mi'] === undefined) {
      return {
        key: 'step_detay_var_mi',
        question: 'İhtiyacın detaylarında hizmet verenin bilmesi gereken veya dikkat etmesi gereken bir durum var mı?',
        options: ['Hayır Yok', 'Evet Var'],
        inputType: 'single_choice',
        isComplete: false,
      };
    }

    const step = flow.steps.find((s: any) => s.step_id === currentStepId);
    if (!step) return null;

    // If step is textarea/text details step, check if decision step was skipped or answered "Hayır Yok"
    if ((step.input_type === 'textarea' || step.step_id.includes('detay')) && state.collected_data['step_detay_var_mi'] === undefined) {
      return {
        key: 'step_detay_var_mi',
        question: 'İhtiyacın detaylarında hizmet verenin bilmesi gereken veya dikkat etmesi gereken bir durum var mı?',
        options: ['Hayır Yok', 'Evet Var'],
        inputType: 'single_choice',
        isComplete: false,
      };
    }

    return {
      key: step.step_id,
      question: step.step_title,
      options: step.options?.map((o: any) => o.label) || [],
      inputType: step.input_type === 'single_select' ? 'single_choice' : step.input_type === 'multi_select' ? 'multi_choice' : step.input_type,
      isComplete: false,
    };
  }

  /**
   * Process user answer against the current step in the flow
   */
  public async processAnswerFromFlow(state: SessionState, message: string): Promise<boolean> {
    const slug = state.collected_data.categorySlug;
    const flow = this.getFlowForCategory(slug);
    if (!slug || !flow) return false;

    const currentStepId = state.collected_data.current_step_id || flow.steps[0].step_id;
    const lowerMsg = message.toLowerCase().trim();

    if (lowerMsg === 'geri dön' || lowerMsg === 'geri') {
      if (state.collected_data.step_history && state.collected_data.step_history.length > 0) {
        state.collected_data.current_step_id = state.collected_data.step_history.pop();
        return true;
      }
      return false;
    }

    if (currentStepId === 'END') return false;

    const advanceStep = (nextStepId: string) => {
      if (!state.collected_data.step_history) state.collected_data.step_history = [];
      state.collected_data.step_history.push(currentStepId);
      state.collected_data.current_step_id = nextStepId;
    };

    // Process decision question interceptor: step_detay_var_mi
    if (state.collected_data['step_detay_var_mi'] === undefined &&
        (currentStepId === 'step_detay_var_mi' || currentStepId === 'step_detaylar' || currentStepId === 'step_detaylar_aciklama' || currentStepId === 'step_ekstra_detay_text')) {
      if (lowerMsg.includes('hayır') || lowerMsg.includes('hayir')) {
        state.collected_data['step_detay_var_mi'] = 'Hayır Yok';
        advanceStep('END');
        return true;
      }
      if (lowerMsg.includes('evet')) {
        state.collected_data['step_detay_var_mi'] = 'Evet Var';
        advanceStep('step_detaylar');
        return true;
      }
    }

    const step = flow.steps.find((s: any) => s.step_id === currentStepId);
    if (!step) return false;

    if (step.input_type === 'textarea' || step.input_type === 'text') {
      state.collected_data[step.step_id] = message;
      advanceStep(step.next_step || 'END');
      return true;
    }

    // Check multi-select
    if (step.input_type === 'multi_select' && message.includes(',')) {
      const parts = message.split(',').map((p) => p.trim().toLowerCase());
      const matchedLabels: string[] = [];
      let lastNextStep = step.next_step || 'END';

      for (const part of parts) {
        const match = step.options?.find((o: any) => o.label.toLowerCase().trim() === part || o.value.toLowerCase().trim() === part);
        if (match) {
          matchedLabels.push(match.label);
          if (match.next_step) lastNextStep = match.next_step;
        }
      }

      if (matchedLabels.length > 0) {
        state.collected_data[step.step_id] = matchedLabels.join(', ');
        advanceStep(lastNextStep);
        return true;
      }
    }

    // Single select exact or label match
    const matchedOption = step.options?.find((o: any) => o.label.toLowerCase().trim() === lowerMsg || o.value.toLowerCase().trim() === lowerMsg);

    if (matchedOption) {
      state.collected_data[step.step_id] = matchedOption.label;
      advanceStep(matchedOption.next_step || step.next_step || 'END');
      return true;
    }

    // Partial label match fallback
    const partialMatch = step.options?.find((o: any) => o.label.toLowerCase().includes(lowerMsg) || lowerMsg.includes(o.label.toLowerCase()));
    if (partialMatch) {
      state.collected_data[step.step_id] = partialMatch.label;
      advanceStep(partialMatch.next_step || step.next_step || 'END');
      return true;
    }

    return false;
  }

  /**
   * Intercept and handle flow execution cleanly
   */
  public async executeFlowStep(state: SessionState, message: string): Promise<{
    isHandled: boolean;
    step: string;
    responseMessage: string;
    options: string[];
    inputType: string;
  } | null> {
    const slug = state.collected_data.categorySlug;
    const flow = this.getFlowForCategory(slug);

    if (!slug || !flow) return null;

    state.step = 'collecting_details'; // Normalize

    const isInitialCategoryMsg = !state.collected_data.current_step_id;
    if (isInitialCategoryMsg) {
      state.collected_data.current_step_id = flow.steps[0].step_id;
    }

    let processed = false;
    if (!isInitialCategoryMsg) {
      processed = await this.processAnswerFromFlow(state, message);
    }

    let nextQ: any = null;
    let responseMessage = '';
    let options: string[] = [];
    let inputType = 'single_choice';

    if (!isInitialCategoryMsg && !processed) {
      nextQ = this.getNextQuestionFromFlow(state);
      if (nextQ) {
        responseMessage = nextQ.question;
      }
    } else {
      nextQ = this.getNextQuestionFromFlow(state);
    }

    if (!nextQ) {
      state.step = 'ask_address';
      state.collected_data.hasAskedDetails = true;
      responseMessage = `Hizmetin verileceği konumu seçebilir misiniz?`;
      options = [];
      inputType = 'single_choice';
    } else {
      if (isInitialCategoryMsg) {
        responseMessage = `${state.collected_data.categoryName || flow.category_name} talebiniz için detayları alalım.\n\n${nextQ.question}`;
      } else {
        responseMessage = responseMessage || nextQ.question;
      }
      options = nextQ.options || [];
      inputType = nextQ.inputType || 'single_choice';
    }

    return {
      isHandled: true,
      step: state.step,
      responseMessage,
      options,
      inputType,
    };
  }
}
