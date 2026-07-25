import { Injectable, Logger } from '@nestjs/common';

export interface SessionState {
  step: string;
  collected_data: Record<string, any>;
  messages: Array<{ role: string; content: string }>;
}

@Injectable()
export class LeadFormService {
  private readonly logger = new Logger(LeadFormService.name);

  /**
   * Process address collection step
   */
  public handleAddressStep(state: SessionState, message: string): {
    step: string;
    responseMessage: string;
    options: string[];
    inputType: string;
  } {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      return {
        step: 'ask_address',
        responseMessage: 'Lütfen geçerli bir il, ilçe veya adres bilgisi belirtin.',
        options: [],
        inputType: 'single_choice',
      };
    }

    state.collected_data.address = trimmed;
    state.step = 'ask_name';

    return {
      step: state.step,
      responseMessage: 'Harika. Hizmet alacak kişinin Ad ve Soyadını yazar mısınız?',
      options: [],
      inputType: 'text',
    };
  }

  /**
   * Process customer name collection step
   */
  public handleNameStep(state: SessionState, message: string): {
    step: string;
    responseMessage: string;
    options: string[];
    inputType: string;
  } {
    const trimmed = message.trim();
    if (trimmed.length < 2) {
      return {
        step: 'ask_name',
        responseMessage: 'Lütfen geçerli bir Ad Soyad giriniz.',
        options: [],
        inputType: 'text',
      };
    }

    state.collected_data.customerName = trimmed;
    state.step = 'ask_phone';

    return {
      step: state.step,
      responseMessage: 'Son adım: Teklifleri ve SMS bilgilendirmesini alabilmeniz için Cep Telefonu numaranızı giriniz (Örn: 05xx xxx xx xx).',
      options: [],
      inputType: 'text',
    };
  }

  /**
   * Process customer phone collection step
   */
  public handlePhoneStep(state: SessionState, message: string): {
    step: string;
    responseMessage: string;
    options: string[];
    inputType: string;
  } {
    const cleanPhone = message.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return {
        step: 'ask_phone',
        responseMessage: 'Lütfen geçerli 10 haneli bir cep telefonu numarası giriniz (Örn: 05xx xxx xx xx).',
        options: [],
        inputType: 'text',
      };
    }

    state.collected_data.customerPhone = cleanPhone;
    state.step = 'confirm_form';

    return {
      step: state.step,
      responseMessage: 'Tüm bilgiler alındı! Talebinizi onaylıyor musunuz?',
      options: ['Onayla', 'İptal Et'],
      inputType: 'single_choice',
    };
  }
}
