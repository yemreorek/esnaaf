import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

@Injectable()
export class IyzicoService {
  private readonly logger = new Logger(IyzicoService.name);
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly isProd: boolean;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('IYZICO_API_KEY') || 'mock-api-key';
    this.secretKey = this.configService.get<string>('IYZICO_SECRET_KEY') || 'mock-secret-key';
    this.baseUrl = this.configService.get<string>('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    this.isProd = this.configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * iyzico Checkout Formunu başlatır
   */
  async createCheckoutForm(providerId: string, packageType: string, price: number, callbackUrl: string) {
    if (!this.isProd || this.apiKey === 'mock-api-key') {
      // DEVELOPMENT / MOCK MODU
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.logger.log(`[IYZICO MOCK] Initializing checkout form for Provider: ${providerId}, Package: ${packageType}, Price: ${price} TL`);
      
      const mockIframeHtml = `
        <div id="iyzico-checkout-form" class="responsive">
          <h3>Esnaaf Güvenli Ödeme Arayüzü (Sandbox Simülasyonu)</h3>
          <p>Paket: <strong>${packageType.toUpperCase()}</strong></p>
          <p>Tutar: <strong>${price} TL / ay</strong></p>
          <form action="${callbackUrl}" method="POST">
            <input type="hidden" name="token" value="${mockToken}" />
            <input type="hidden" name="providerId" value="${providerId}" />
            <input type="hidden" name="packageType" value="${packageType}" />
            <input type="hidden" name="price" value="${price}" />
            <button type="submit" style="background-color: #D4F54E; color: #232323; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
              Simüle Ödemeyi Tamamla
            </button>
          </form>
        </div>
      `;

      return {
        success: true,
        token: mockToken,
        checkoutFormContent: mockIframeHtml,
        paymentPageUrl: `${this.baseUrl}/mock-payment-page?token=${mockToken}`,
      };
    }

    // REAL PRODUCTION API CALL (iyzico REST client)
    try {
      // iyzico API'sine v2 subscription checkoutform initialize isteği
      const requestBody = {
        locale: 'tr',
        conversationId: providerId,
        pricingPlanReferenceCode: `plan_${packageType}`, // Pakete göre iyzico plan referans kodu
        subscriptionAddress: {
          contactName: 'Esnaaf Hizmet Veren',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Kadikoy',
          zipCode: '34710',
        },
        customer: {
          name: 'Esnaaf Usta',
          surname: 'Usta',
          identityNumber: '11111111111',
          email: 'partner@esnaaf.com',
          gsmNumber: '+905320000000',
          shippingAddress: {
            contactName: 'Esnaaf Hizmet Veren',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Kadikoy',
            zipCode: '34710',
          },
          billingAddress: {
            contactName: 'Esnaaf Hizmet Veren',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Kadikoy',
            zipCode: '34710',
          },
        },
        callbackUrl,
      };

      const response = await fetch(`${this.baseUrl}/v2/subscription/checkoutform/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.generateHeaders(requestBody, '/v2/subscription/checkoutform/initialize'),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.errorMessage || 'iyzico checkout form başlatılamadı.');
      }

      return {
        success: true,
        token: data.token,
        checkoutFormContent: data.checkoutFormContent,
        paymentPageUrl: data.paymentPageUrl,
      };
    } catch (error) {
      this.logger.error('iyzico API hatası:', error.message);
      throw new Error(`Ödeme sayfası açılamadı. Tekrar deneyin. Hata: ${error.message}`);
    }
  }

  /**
   * checkoutform sonucunu iyzico'dan sorgular
   */
  async retrieveCheckoutForm(token: string) {
    if (!this.isProd || this.apiKey === 'mock-api-key') {
      // DEVELOPMENT / MOCK MODU
      this.logger.log(`[IYZICO MOCK] Retrieving checkout form result for token: ${token}`);
      return {
        status: 'success',
        subscriptionReferenceCode: `sub_ref_${Date.now()}`,
        parentReferenceCode: `parent_ref_${Date.now()}`,
        paymentStatus: 'success',
      };
    }

    try {
      const requestBody = { token };
      const response = await fetch(`${this.baseUrl}/v2/subscription/checkoutform/retrieve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.generateHeaders(requestBody, '/v2/subscription/checkoutform/retrieve'),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.errorMessage || 'iyzico sonuç sorgulama başarısız.');
      }

      return data;
    } catch (error) {
      this.logger.error('iyzico API hatası (retrieve):', error.message);
      throw new Error(`Ödeme sonucu doğrulanamadı. Hata: ${error.message}`);
    }
  }

  /**
   * Abonelik iptali gerçekleştirir
   */
  async cancelSubscription(iyzicoSubRef: string) {
    if (!this.isProd || this.apiKey === 'mock-api-key') {
      // DEVELOPMENT / MOCK MODU
      this.logger.log(`[IYZICO MOCK] Cancelling subscription with iyzico ref: ${iyzicoSubRef}`);
      return {
        status: 'success',
        message: 'Abonelik iptal edildi (Mock)',
      };
    }

    try {
      const path = `/v2/subscription/subscriptions/${iyzicoSubRef}/cancel`;
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.generateHeaders({}, path),
        },
      });

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.errorMessage || 'Abonelik iptal isteği iyzico tarafından reddedildi.');
      }

      return data;
    } catch (error) {
      this.logger.error('iyzico API hatası (cancel):', error.message);
      throw new Error(`Abonelik iptal edilemedi. Hata: ${error.message}`);
    }
  }

  /**
   * iyzico v2 imza doğrulamasını (HMAC-SHA256) yapar
   */
  verifyWebhookSignature(headers: any, payload: any): boolean {
    const receivedSignature = headers['x-iyz-signature-v3'];
    if (!receivedSignature) {
      this.logger.warn('iyzico webhook request missing X-IYZ-SIGNATURE-V3 header.');
      return false;
    }

    try {
      // Webhook payload parametrelerine göre imza mesajını oluştur
      // subscriptionReferenceCode, customerReferenceCode, orderReferenceCode, merchantId, eventType
      const merchantId = payload.merchantId || '';
      const eventType = payload.eventType || '';
      const subRef = payload.subscriptionReferenceCode || '';
      const orderRef = payload.orderReferenceCode || '';
      const custRef = payload.customerReferenceCode || '';

      const dataToHash = `${merchantId}${this.secretKey}${eventType}${subRef}${orderRef}${custRef}`;

      const calculatedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(dataToHash)
        .digest('hex');

      // Constant time safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(calculatedSignature, 'utf-8'),
        Buffer.from(receivedSignature, 'utf-8')
      );
    } catch (error) {
      this.logger.error('İmza doğrulama hatası:', error.message);
      return false;
    }
  }

  /**
   * iyzico API istekleri için Authorization başlığı üretir (IYZWSv2)
   */
  private generateHeaders(body: any, uri: string): Record<string, string> {
    const randomString = Date.now().toString() + Math.random().toString(36).substring(2, 10);
    const bodyStr = Object.keys(body).length > 0 ? JSON.stringify(body) : '';
    
    // IYZWSv2 formatında imza
    const signatureStr = randomString + 'POST' + uri + bodyStr;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(signatureStr)
      .digest('hex');

    const authorization = `IYZWSv2 ${Buffer.from(`${this.apiKey}:${signature}`).toString('base64')}`;

    return {
      'Authorization': authorization,
      'x-iyz-rnd': randomString,
    };
  }
}
