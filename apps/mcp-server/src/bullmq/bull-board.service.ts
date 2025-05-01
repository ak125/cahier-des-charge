import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { StandardizedOrchestratorAdapter } from '../../../../src/orchestration/adapters/bull-board-adapter';

@Injectable()
export class BullBoardService implements OnModuleInit {
  private readonly logger = new Logger(BullBoardService.name);
  private readonly serverAdapter = new ExpressAdapter();

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
   * Configure le middleware Express pour Bull Board
   */
  setup(app: NestExpressApplication) {
    const path = '/queues';
    this.serverAdapter.setBasePath(path);

    // Middleware optionnel pour la sécurité basique
    app.use(path, (req, res, next) => {
      const isAuthorized = process.env.NODE_ENV !== 'production' || req.headers.authorization === `Bearer ${process.env.BULL_BOARD_TOKEN}`;

      if (isAuthorized) {
        return next();
      }

      res.status(401).send('Non autorisé');
    });

    app.use(path, this.serverAdapter.getRouter());

    this.logger.log(`🌐 Interface Bull Board disponible à l'adresse: ${path}`);

    return this;
  }
}