import { NestFactory } from @nestjs/corestructure-agent';
import { AppModule } from ./app.modulestructure-agent';
import { LegacyPhpRedirectMiddleware } from ./common/middleware/legacyPhpRedirect.middlewarestructure-agent';
import { Logger } from @nestjs/commonstructure-agent';

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