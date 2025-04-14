import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}