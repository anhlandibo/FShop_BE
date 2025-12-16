/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaypalSdkService {
  private readonly logger = new Logger(PaypalSdkService.name);
  private clientId = process.env.PAYPAL_CLIENT_ID;
  private clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  private apiUrl = process.env.PAYPAL_API_URL ?? 'https://api-m.sandbox.paypal.com';
  private webhookId = process.env.PAYPAL_WEBHOOK_ID;

  constructor(private readonly http: HttpService) {}

  private async getAccessToken(): Promise<string> {
    const basicAuth = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const res$ = this.http.post(
      `${this.apiUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const res = await firstValueFrom(res$);
    return res.data.access_token as string;
  }

  async createOrder(amount: number, returnUrl: string, cancelUrl: string) {
    const accessToken = await this.getAccessToken();

    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: 'FShop',
        user_action: 'PAY_NOW',
      },
    };

    const res$ = this.http.post(`${this.apiUrl}/v2/checkout/orders`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const res = await firstValueFrom(res$);
    return res.data;
  }

  async verifyWebhookSignature(headers: any, body: any): Promise<boolean> {
    if (!this.webhookId) {
      this.logger.error('PAYPAL_WEBHOOK_ID missing in env');
      return false;
    }

    try {
      const accessToken = await this.getAccessToken();

      const verificationBody = {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: this.webhookId,
        webhook_event: body,
      };

      const res$ = this.http.post(
        `${this.apiUrl}/v1/notifications/verify-webhook-signature`,
        verificationBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const res = await firstValueFrom(res$);
      // API trả về verification_status: "SUCCESS" hoặc "FAILURE"
      return res.data.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error('PayPal Webhook Verification Failed', error.response?.data || error.message);
      return false;
    }
  }

  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    const res$ = this.http.post(
      `${this.apiUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const res = await firstValueFrom(res$);
    return res.data;
  }
}
