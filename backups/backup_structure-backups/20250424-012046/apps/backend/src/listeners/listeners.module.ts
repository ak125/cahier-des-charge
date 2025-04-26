import { Module } from @nestjs/commonstructure-agent';
import { JobListenerService } from ./job.listenerstructure-agent';
import { RedisModule } from ../redis/redis.modulestructure-agent';

@Module({
  imports: [RedisModule],
  providers: [JobListenerService],
  exports: []
})
export class ListenersModule {}