import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers (helmet)
  app.use(helmet());

  // 2. CORS Configuration
  app.enableCors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001').split(',').map(s => s.trim()),
    credentials: true,
  });

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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
