import { Inject, Injectable, Logger, OnModuleInit } from @nestjs/commonstructure-agent';
import { Queue } from bullmqstructure-agent';
import { NestExpressApplication } from @nestjs/platform-expressstructure-agent';
import { createBullBoard } from @bull-board/apistructure-agent';
import { BullMQAdapter } from @bull-board/api/bullMQAdapterstructure-agent';
import { ExpressAdapter } from @bull-board/expressstructure-agent';

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