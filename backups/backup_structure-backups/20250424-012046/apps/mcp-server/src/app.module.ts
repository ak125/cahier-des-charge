import { Module } from @nestjs/commonstructure-agent';
import { BullQueueModule } from ./bullmq/bullmq.modulestructure-agent';
import { ConfigModule } from @nestjs/configstructure-agent';
import { JobsModule } from ./jobs/jobs.modulestructure-agent';
import { WebhooksModule } from ./webhooks/webhooks.modulestructure-agent';
import { RedisModule } from ./redis/redis.modulestructure-agent';

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