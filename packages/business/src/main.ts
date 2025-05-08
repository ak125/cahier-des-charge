import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LegacyPhpRedirectMiddleware } from './common/middleware/legacy-php-redirect-middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Activer le middleware de redirection des URL PHP legacy
  const legacyPhpMiddleware = new LegacyPhpRedirectMiddleware();
  app.use(legacyPhpMiddleware.use.bind(legacyPhpMiddleware));

  // Configuration CORS si nécessaire
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application démarrée sur le port ${port}`);
}

bootstrap();
