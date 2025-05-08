import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { BullBoardService } from './bullmq/bull-board.service';
// Importer la fonction registerAllControllers du module consolidé
import { registerAllControllers } from '../../packages/business/temporal/controllers';
// Importer nos plugins personnalisés
import { advancedOptimizations, swaggerSchema } from '../../packages/fastify-plugins/src';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Démarrage du serveur MCP...');

  // Création de l'adaptateur Fastify avec configuration Pino avancée
  const fastifyAdapter = new FastifyAdapter({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true
          }
        }
        : undefined,
      serializers: {
        req: (request) => ({
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
          remotePort: request.socket.remotePort
        }),
        res: (reply) => ({
          statusCode: reply.statusCode,
          responseTime: reply.getResponseTime()
        }),
        err: (err) => ({
          type: err.name,
          message: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        })
      }
    }
  });

  // Enregistrer le plugin d'optimisations de base directement dans l'instance Fastify
  await fastifyAdapter.instance.register(require('@fastify/compress'), {
    global: true,
    encodings: ['gzip', 'deflate']
  });

  await fastifyAdapter.instance.register(require('@fastify/helmet'), {
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
  });

  await fastifyAdapter.instance.register(require('@fastify/rate-limit'), {
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip
  });

  // Enregistrer le plugin d'optimisations avancées
  await fastifyAdapter.instance.register(advancedOptimizations, {
    cache: true,
    session: {
      secret: process.env.SESSION_SECRET || 'change-this-in-production-please',
      cookieName: 'mcp-session'
    },
    multipart: {
      limits: {
        fileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 20 * 1024 * 1024, // 20MB
        files: 10
      }
    }
  });

  // Enregistrer le plugin de documentation Swagger si pas en production
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    await fastifyAdapter.instance.register(swaggerSchema, {
      title: 'MCP Server API',
      description: 'Documentation API du Model Context Protocol',
      version: '1.0.0',
      routePrefix: '/api-docs'
    });
    logger.log('📚 Documentation Swagger activée: http://localhost:' + (process.env.PORT || 3030) + '/api-docs');
  }

  // Création de l'application avec l'adaptateur Fastify configuré
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter
  );

  // Configuration de CORS
  app.enableCors();

  // Configuration du préfixe global pour les routes API
  app.setGlobalPrefix('api');

  // Configuration de Bull Board
  const bullBoardService = app.get(BullBoardService);
  bullBoardService.setup(app);

  // Enregistrer tous les contrôleurs Temporal consolidés
  registerAllControllers(app);
  logger.log('✅ Contrôleurs Temporal consolidés enregistrés');

  // Configurer les timeouts pour éviter les erreurs 504
  fastifyAdapter.instance.server.keepAliveTimeout = 65000;
  fastifyAdapter.instance.server.headersTimeout = 66000;

  // Démarrage du serveur
  const port = process.env.PORT || 3030;
  await app.listen(port, '0.0.0.0'); // Fastify nécessite une adresse IP explicite pour écouter sur toutes les interfaces

  logger.log(`✅ Serveur MCP démarré sur le port: ${port}`);
  logger.log(`🌐 Interface Bull Board disponible à l'adresse: http://localhost:${port}/queues`);
  logger.log(`🌐 API MCP disponible à l'adresse: http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('❌ Erreur lors du démarrage du serveur:', err);
  process.exit(1);
});
