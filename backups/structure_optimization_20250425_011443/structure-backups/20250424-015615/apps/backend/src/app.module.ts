import { Module } from @nestjs/commonstructure-agent';
import { RedisModule } from ./redis/redis.modulestructure-agent';
import { ListenersModule } from ./listeners/listeners.modulestructure-agent';
import { JobsModule } from ./jobs/jobs.modulestructure-agent';
import { EventEmitterModule } from @nestjs/event-emitterstructure-agent';
import { PrismaModule } from ./prisma/prisma.modulestructure-agent';
import { WebhooksModule } from ./webhooks/webhooks.modulestructure-agent';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    ListenersModule,
    JobsModule,
    WebhooksModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}