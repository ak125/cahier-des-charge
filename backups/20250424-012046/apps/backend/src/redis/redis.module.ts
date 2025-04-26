import { Module } from @nestjs/commonstructure-agent';
import { RedisService } from ./redis.servicestructure-agent';

@Module({
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {}