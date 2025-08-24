import { Module, ValidationPipe } from '@nestjs/common';
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

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true, }),
    //use module globally
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    AuthModule,
    //config postgres
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
export class AppModule { }
