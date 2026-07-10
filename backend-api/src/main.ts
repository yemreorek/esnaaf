// Sentry instrument — only loads if @sentry/nestjs is installed
try { require('./instrument'); } catch (e) { /* Sentry not installed, skipping */ }
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// Sentry is loaded dynamically to avoid build errors when not installed

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust proxy so rate limiting works correctly behind Next.js / Load Balancers
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance().set('trust proxy', 1);

  // Set payload size limits to allow base64 uploaded files in JSON body (e.g. provider photos)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // 1. Security Headers (helmet)
  app.use(helmet());

  // 2. CORS Configuration
  app.enableCors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001').split(',').map(s => s.trim()),
    credentials: true,
  });

  // 2.5 Cookie Parser
  app.use(cookieParser());

  // 3. Global Prefix (/api)
  app.setGlobalPrefix('api');

  // 4. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 5. Global HttpException Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 6. Sentry Global Error Filter (unhandled exceptions)
  if (process.env.SENTRY_DSN) {
    try {
      const SentryModule = require('@sentry/nestjs');
      app.useGlobalFilters(new SentryModule.SentryGlobalFilter());
    } catch (e) {
      console.warn('Sentry paketi yüklü değil, error tracking devre dışı.');
    }
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
