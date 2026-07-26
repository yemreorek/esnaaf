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

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.city) state.collected_data.city = parsed.city;
      if (parsed.district) state.collected_data.district = parsed.district;
      if (parsed.neighborhood) state.collected_data.neighborhood = parsed.neighborhood;
      state.collected_data.address = `${parsed.city || ''}, ${parsed.district || ''}, ${parsed.neighborhood || ''}`;
    } catch {
      state.collected_data.address = trimmed;
    }

    state.step = 'ask_time';

    return {
      step: state.step,
      responseMessage: 'Talebiniz ne zaman gerçekleşsin?',
      options: [
        'Belirli Bir Zamanda (Üç Hafta İçinde veya bugün hemen)',
        'İki ay içinde',
        'Altı ay içinde'
      ],
      inputType: 'single_choice',
    };
  }

  /**
   * Process time collection step
   */
  public handleTimeStep(state: SessionState, message: string): {
    step: string;
    responseMessage: string;
    options: string[];
    inputType: string;
  } {
    const timeVal = message.trim();
    state.collected_data.tarih = timeVal;
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
    state.collected_data.name = trimmed;
    state.step = 'ask_phone';

    return {
      step: state.step,
      responseMessage: 'Son adım: Teklifleri ve SMS bilgilendirmesini alabilmeniz için Cep Telefonu numaranızı giriniz (Örn: 05xx xxx xx xx).',
      options: [],
      inputType: 'text',
    };
  }

  /**
   * Process customer phone collection step -> transitions to OTP verification
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
    state.collected_data.phone = cleanPhone;
    state.step = 'otp_verification';

    return {
      step: state.step,
      responseMessage: 'Lütfen telefonunuza gelen 6 haneli SMS doğrulama kodunu giriniz (Test için: 123456).',
      options: [],
      inputType: 'text',
    };
  }

  /**
   * Process SMS OTP verification step -> transitions to confirm_form
   */
  public handleOtpStep(state: SessionState, message: string): {
    step: string;
    responseMessage: string;
    options: string[];
    inputType: string;
  } {
    const cleanOtp = message.replace(/\D/g, '');
    if (cleanOtp.length < 6) {
      return {
        step: 'otp_verification',
        responseMessage: 'Lütfen telefonunuza gelen 6 haneli doğrulama kodunu giriniz (Test için: 123456).',
        options: [],
        inputType: 'text',
      };
    }

    state.step = 'confirm_form';

    return {
      step: state.step,
      responseMessage: 'Tüm bilgiler alındı! Talebinizi onaylıyor musunuz?',
      options: ['Onayla', 'İptal Et'],
      inputType: 'single_choice',
    };
  }
}
