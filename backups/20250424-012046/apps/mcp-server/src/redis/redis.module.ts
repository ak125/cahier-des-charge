import { Module, Global } from @nestjs/commonstructure-agent';
import { RedisService } from ./redis.servicestructure-agent';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}