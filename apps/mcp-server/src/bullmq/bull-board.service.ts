import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

@Injectable()
export class BullBoardService implements OnModuleInit {
  private readonly logger = new Logger(BullBoardService.name);
  private readonly serverAdapter = new ExpressAdapter();

  constructor(
    @Inject('PHP_ANALYZER_QUEUE') private readonly phpQueue: Queue,
    @Inject('JS_ANALYZER_QUEUE') private readonly jsQueue: Queue,
    @Inject('MIGRATION_QUEUE') private readonly migrationQueue: Queue,
    @Inject('VERIFICATION_QUEUE') private readonly verificationQueue: Queue
  ) {}

  onModuleInit() {
    this.logger.log('🚀 Initialisation de Bull Board...');
    
    createBullBoard({
      queues: [
        new BullMQAdapter(this.phpQueue),
        new BullMQAdapter(this.jsQueue),
        new BullMQAdapter(this.migrationQueue),
        new BullMQAdapter(this.verificationQueue)
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