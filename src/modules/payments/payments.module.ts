import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities';
import { Payment } from './entities/payment.entity';
import { HttpModule } from '@nestjs/axios';
import { PaypalSdkService } from './paypal-sdk.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order]), HttpModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaypalSdkService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
