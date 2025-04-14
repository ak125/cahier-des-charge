import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { ListenersModule } from './listeners/listeners.module';
import { JobsModule } from './jobs/jobs.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { WebhooksModule } from './webhooks/webhooks.module';

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