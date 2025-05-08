import { createBullBoard } from '@bull-board/api';
import { FastifyAdapter } from '@bull-board/fastify';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { StandardizedOrchestratorAdapter } from '../../../../src/orchestration/adapters/bull-board-adapter';

@Injectable()
export class BullBoardService implements OnModuleInit {
  private readonly logger = new Logger(BullBoardService.name);
  private readonly serverAdapter = new FastifyAdapter();

  constructor(
    @Inject('PHP_ANALYZER_QUEUE') private readonly _phpQueue: any,
    @Inject('JS_ANALYZER_QUEUE') private readonly _jsQueue: any,
    @Inject('MIGRATION_QUEUE') private readonly _migrationQueue: any,
    @Inject('VERIFICATION_QUEUE') private readonly _verificationQueue: any
  ) { }

  onModuleInit() {
    this.logger.log('🚀 Initialisation de Bull Board...');

    createBullBoard({
      queues: [
        new StandardizedOrchestratorAdapter('PhpAnalyzer'),
        new StandardizedOrchestratorAdapter('js-analyzer'),
        new StandardizedOrchestratorAdapter('migration'),
        new StandardizedOrchestratorAdapter('verification')
      ],
      serverAdapter: this.serverAdapter
    });

    this.logger.log('✅ Bull Board initialisé avec succès');
  }

  /**
   * Configure le middleware Fastify pour Bull Board
   */
  setup(app: NestFastifyApplication) {
    const path = '/queues';
    this.serverAdapter.setBasePath(path);

    // Intégration de l'adaptateur avec l'instance Fastify
    const fastifyInstance = app.getHttpAdapter().getInstance();

    // Middleware optionnel pour la sécurité basique
    fastifyInstance.addHook('preHandler', (req, reply, done) => {
      const routePath = req.routerPath || req.raw.url;
      if (routePath.startsWith(path)) {
        const isAuthorized = process.env.NODE_ENV !== 'production' ||
          req.headers.authorization === `Bearer ${process.env.BULL_BOARD_TOKEN}`;

        if (!isAuthorized) {
          return reply.code(401).send('Non autorisé');
        }
      }
      done();
    });

    // Enregistrer les routes Bull Board sur l'instance Fastify
    this.serverAdapter.registerPlugin(fastifyInstance);

    this.logger.log(`🌐 Interface Bull Board disponible à l'adresse: ${path}`);

    return this;
  }
}