import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import getDatabaseConfig from 'src/configs/database.config';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionFilter } from 'src/filters/all-exception.filter';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true, }),
    //use module globally
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
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
  ],
})
export class AppModule { }
