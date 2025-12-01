/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../orders/entities';
import { Payment } from './entities/payment.entity';
import { PaypalSdkService } from './paypal-sdk.service';
import { PaymentMethod } from 'src/constants/payment-method.enum';
import { PaymentStatus } from 'src/constants/payment-status.enum';
import { verify } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly paypalSdk: PaypalSdkService,
    private readonly dataSource: DataSource,
  ) {}

  async createPaypalPayment(
    userId: number,
    orderId: number,
    returnUrl: string,
    cancelUrl: string,
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['payment', 'user'],
    });

    if (!order) throw new HttpException('Order not found', HttpStatus.NOT_FOUND);

    if (order.paymentMethod !== PaymentMethod.PAYPAL) 
      throw new HttpException('Order is not using PayPal payment method', HttpStatus.BAD_REQUEST);
    if (order.paymentStatus === PaymentStatus.COMPLETED)
      throw new HttpException('Order is already paid', HttpStatus.BAD_REQUEST);

    const amount = Number(order.totalAmount);
    if (!amount || amount <= 0) {
      throw new HttpException(
        'Invalid order amount',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Tạo PayPal order
    const paypalOrder = await this.paypalSdk.createOrder(
      amount,
      returnUrl,
      cancelUrl,
    );

    const approveLink = paypalOrder.links?.find((l) => l.rel === 'approve')
      ?.href;

    if (!approveLink) {
      throw new HttpException(
        'PayPal approve link not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Lưu payment trong DB (transaction cho chắc)
    await this.dataSource.transaction(async (manager) => {
      let payment = await manager.findOne(Payment, { where: { orderId: order.id } });
      if (!payment) {
        payment = manager.create(Payment, {
          orderId: order.id,
          method: PaymentMethod.PAYPAL,
          amount,
        });
      }

      payment.status = PaymentStatus.PENDING;
      payment.providerPaymentId = paypalOrder.id;
      payment.rawResponse = paypalOrder;
      order.payment = payment
      payment.order = order;

      await manager.save(payment);

      order.paymentStatus = PaymentStatus.PENDING;
      await manager.save(order);
    });

    return {
      orderId: order.id,
      paypalOrderId: paypalOrder.id,
      approveUrl: approveLink,
    };
  }

  // ============= PAYPAL CAPTURE =============
  async capturePaypalPayment(token: string) {
    // gọi PayPal capture
    const captureRes = await this.paypalSdk.captureOrder(token);

    const payment = await this.paymentRepo.findOne({
      where: { providerPaymentId: token },
      relations: ['order'],
    });

    if (!payment) {
      throw new HttpException(
        'Payment not found for this PayPal token',
        HttpStatus.NOT_FOUND,
      );
    }

    const paypalAmountString = captureRes.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    const paypalCurrency = captureRes.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code;

    const paypalAmount = parseFloat(paypalAmountString);
    const dbAmount = Number(payment.amount);

    console.log(`Verifying Payment: DB=${dbAmount} - PayPal=${paypalAmount}`);

    if (!paypalAmount) {
       // Trường hợp PayPal trả về cấu trúc lạ hoặc chưa capture thành công
       throw new HttpException('Failed to verify payment amount from PayPal response', HttpStatus.BAD_REQUEST);
    }

    if (Math.abs(paypalAmount - dbAmount) > 0.01) {
      
      payment.status = PaymentStatus.FAILED;
      payment.rawResponse = captureRes;
      payment.order.paymentStatus = PaymentStatus.FAILED; 
      
      await this.paymentRepo.save(payment);
      await this.orderRepo.save(payment.order);

      throw new HttpException(`Payment amount mismatch! Expected: ${dbAmount}, Received: ${paypalAmount}`,HttpStatus.BAD_REQUEST);
    }

    if (paypalCurrency !== 'USD') { 
       // Giả sử hệ thống bạn chỉ chấp nhận USD
       payment.status = PaymentStatus.FAILED;
       await this.paymentRepo.save(payment);
       throw new HttpException(
         `Invalid currency! Expected: USD, Received: ${paypalCurrency}`,
         HttpStatus.BAD_REQUEST
       );
    }

    const paypalStatus: string = captureRes.status;
    const isSuccess = paypalStatus === 'COMPLETED';

    payment.status = isSuccess
      ? PaymentStatus.COMPLETED
      : PaymentStatus.FAILED;
    payment.rawResponse = captureRes;

    await this.paymentRepo.save(payment);

    payment.order.paymentStatus = payment.status;
    await this.orderRepo.save(payment.order);

    return {
      orderId: payment.order.id,
      paymentStatus: payment.status,
      paypalStatus,
      verifiedAmount: paypalAmount
    };
  }

  async handleWebhook(event: any) {
    // Chỉ quan tâm sự kiện Approved
    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const resource = event.resource;
      const paypalOrderId = resource.id; // Đây là token

      console.log(`Webhook: Processing Order ${paypalOrderId}`);

      try {
        // Kiểm tra xem đơn này đã hoàn thành chưa để tránh capture 2 lần
        // (Do cả Frontend và Webhook cùng gọi)
        const payment = await this.paymentRepo.findOne({
            where: { providerPaymentId: paypalOrderId },
            relations: ['order']
        });

        if (payment && payment.status === PaymentStatus.COMPLETED) {
            console.log('Webhook: Order already completed. Ignore.');
            return;
        }

        // Tái sử dụng hàm capture bạn đã viết
        await this.capturePaypalPayment(paypalOrderId);
        console.log('Webhook: Auto-captured successfully!');

      } catch (error) {
        console.error('Webhook Error:', error.message);
      }
    }
  }
}
