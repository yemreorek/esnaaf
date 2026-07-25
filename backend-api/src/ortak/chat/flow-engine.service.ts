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

    if (raw.includes('elektrik')) return QUESTION_FLOWS['elektrik-tesisati'] || QUESTION_FLOWS['elektrik_tesisati'];
    if (raw.includes('su-tesisat') || (raw.includes('tesisat') && !raw.includes('elektrik') && !raw.includes('dogalgaz'))) {
      return QUESTION_FLOWS['su-tesisati'] || QUESTION_FLOWS['su_tesisati'];
    }
    if (raw.includes('tadilat')) return QUESTION_FLOWS['ev-tadilat'] || QUESTION_FLOWS['ev_tadilat'];
    if (raw.includes('boya') || raw.includes('badana')) return QUESTION_FLOWS['boya-badana'] || QUESTION_FLOWS['boya_badana'];
    if (raw.includes('nakliyat') || raw.includes('tasima') || raw.includes('nakliye')) return QUESTION_FLOWS['nakliyat'];
    if (raw.includes('insaat-sonrasi') || raw.includes('insaat_sonrasi')) return QUESTION_FLOWS['insaat-sonrasi-temizlik'];
    if (raw.includes('fayans') || raw.includes('seramik')) return QUESTION_FLOWS['fayans-doseme'];
    if (raw.includes('parke')) return QUESTION_FLOWS['parke-doseme'];
    if (raw.includes('ilaclama') || raw.includes('bocek') || raw.includes('hasere')) return QUESTION_FLOWS['hasere-ilaclama'];
    if (raw.includes('kombi')) return QUESTION_FLOWS['kombi-servisi'];
    if (raw.includes('klima')) return QUESTION_FLOWS['klima-servisi'];
    if (raw.includes('marangoz') || raw.includes('mobilya')) return QUESTION_FLOWS['mobilya-montaji'];
    if (raw.includes('ders')) return QUESTION_FLOWS['ozel-ders'];
    if (raw.includes('cam-balkon') || raw.includes('cam_balkon') || raw.includes('pvc')) return QUESTION_FLOWS['cam-balkon'];

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

    const step = flow.steps.find((s: any) => s.step_id === currentStepId);
    if (!step) return null;

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

    const step = flow.steps.find((s: any) => s.step_id === currentStepId);
    if (!step) return false;

    const advanceStep = (nextStepId: string) => {
      if (!state.collected_data.step_history) state.collected_data.step_history = [];
      state.collected_data.step_history.push(currentStepId);

      if (!state.collected_data.graph_labels) state.collected_data.graph_labels = {};
      state.collected_data.graph_labels[step.step_id] = step.step_title;

      state.collected_data.current_step_id = nextStepId;
    };

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
        responseMessage = `Anlayamadım. Lütfen seçeneklerden birini belirtin:\n\n${nextQ.question}`;
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
