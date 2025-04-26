import { Module } from @nestjs/commonstructure-agent';
import { WebhooksController } from ./webhooks.controllerstructure-agent';
import { RedisModule } from ../redis/redis.modulestructure-agent';

@Module({
  imports: [RedisModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}