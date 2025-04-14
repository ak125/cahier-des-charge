import { Module } from '@nestjs/common';
import { BullQueueModule } from './bullmq/bullmq.module';
import { ConfigModule } from '@nestjs/config';
import { JobsModule } from './jobs/jobs.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    BullQueueModule,
    JobsModule,
    WebhooksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}