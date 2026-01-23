import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import getDatabaseConfig from 'src/configs/database.config';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionFilter } from 'src/filters/all-exception.filter';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { getRedisConfig } from 'src/configs/redis.config';
import { StartTimingMiddleware } from './middlewares/start-timing.middleware';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { SeedModule } from './modules/seeding/seed.module';
import { CartsModule } from './modules/carts/carts.module';
import { AddressModule } from './modules/address/address.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { WishlistsModule } from './modules/wishlists/wishlists.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { getMailConfig } from './configs/mail.config';
import { StockModule } from './modules/stock/stock.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ChatModule } from 'src/modules/chat/chat.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { PostsModule } from './modules/posts/posts.module';
import { LivestreamsModule } from './modules/livestreams/livestreams.module';
import { MinioModule } from './modules/minio/minio.module';
import { BackupModule } from './modules/backup/backup.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }),
    //use module globally
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    //config postgres
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getRedisConfig,
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getMailConfig,
    }),
    //config postgres
    AuthModule,
    CloudinaryModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    SeedModule,
    CartsModule,
    AddressModule,
    OrdersModule,
    CouponsModule,
    DepartmentsModule,
    AttributesModule,
    WishlistsModule,
    NotificationsModule,
    ReviewsModule,
    PaymentsModule,
    StockModule,
    DashboardModule,
    ChatbotModule,
    PostsModule,
    ChatModule,
    LivestreamsModule,
    MinioModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // xet global Interceptor
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    // xet global Exception
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
    //xet global pipe nhung khong tan dung dc DI
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard, // chạy trước
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(StartTimingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
