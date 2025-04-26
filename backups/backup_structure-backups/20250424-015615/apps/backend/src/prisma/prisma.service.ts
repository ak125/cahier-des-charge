import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from @nestjs/commonstructure-agent';
import { PrismaClient } from @prisma/clientstructure-agent';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.logger.log('🔌 Initialisation de la connexion Prisma...');
    await this.$connect();
    this.logger.log('✅ Connexion Prisma établie avec succès');

    // Configuration optionnelle des middlewares Prisma pour le logging, etc.
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      this.logger.debug(`🔍 Opération Prisma: ${params.model}.${params.action} - ${after - before}ms`);
      return result;
    });
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Fermeture de la connexion Prisma...');
    await this.$disconnect();
  }
}