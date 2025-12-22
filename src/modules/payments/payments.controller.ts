/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation } from '@nestjs/swagger';
import { CreatePaypalPaymentDto } from './dto/create-payment.dto';
import { ConfigService } from '@nestjs/config';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('paypal/create')
  @ApiOperation({ summary: 'Create PayPal payment for an order' })
  async createPaypal(@Req() req: any, @Body() dto: CreatePaypalPaymentDto) {
    const userId = req.user.id;

    const feUrl =
      this.configService.get<string>('FE_URL') || 'http://localhost:3000';
    const returnUrl = `${feUrl}/client/checkout/payment/paypal-success`;
    const cancelUrl = `${feUrl}/client/checkout/payment/paypal-cancel`;

    return this.paymentsService.createPaypalPayment(
      userId,
      dto.orderId,
      returnUrl,
      cancelUrl,
    );
  }

  // FE sau khi PayPal redirect về FE, FE gọi endpoint này để capture
  @UseGuards(AuthGuard('jwt'))
  @Get('paypal/capture')
  @ApiOperation({ summary: 'Capture PayPal payment (after user approves)' })
  async capturePaypal(@Query('token') token: string) {
    // token chính là PayPal orderId
    return this.paymentsService.capturePaypalPayment(token);
  }

  @Post('paypal/webhook')
  @ApiOperation({ summary: 'Handle PayPal Webhook' })
  async handlePaypalWebhook(@Body() event: any, @Headers() headers: any) {
    console.log('Received Webhook Event:', event.event_type);
    await this.paymentsService.handleWebhook(event, headers);
    return { status: 'received' };
  }
}
