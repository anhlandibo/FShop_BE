import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // somewhere in your initialization file
  app.use(cookieParser());
  app.enableCors({
    origin: [process.env.FE_URL],
    credentials: true,
  });
  // prefix API
  app.setGlobalPrefix('api/v1');
  // swagger
  const config = new DocumentBuilder()
    .setTitle('Fashion Shop API')
    .setDescription('Build APIs cho fashion shop website')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, documentFactory);
  const logger = new Logger('bootstrap');
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Server is running on port ${port}`);
  logger.log(`Swagger is running on http://localhost:${port}/api/v1/docs`);
}
bootstrap();
