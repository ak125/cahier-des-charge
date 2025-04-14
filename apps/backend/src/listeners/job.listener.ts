import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from 'pg';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class JobListenerService implements OnModuleInit {
  private readonly logger = new Logger(JobListenerService.name);
  private pgClient = new Client(process.env.DATABASE_URL);

  constructor(private redisService: RedisService) {}

  async onModuleInit() {
    await this.pgClient.connect();
    await this.pgClient.query('LISTEN job_finished');
    this.pgClient.on('notification', async (msg) => {
      this.logger.log(`📨 Job notification reçue: ${msg.payload}`);
      const payload = JSON.parse(msg.payload!);
      // Propagation vers Redis
      await this.redisService.publishJob('job_finished', payload);
    });

    this.logger.log('🔔 PostgreSQL Listener démarré.');
  }
}