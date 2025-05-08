import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [RedisModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
