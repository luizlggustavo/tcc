/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4202',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const host = process.env.HOST ?? '0.0.0.0';
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, host);
  Logger.log(`Aplicação executando em http://${host}:${port}/api`, 'Bootstrap');
}

bootstrap();
