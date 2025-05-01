import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { JobListenerService } from './job.listener';

@Module({
  imports: [RedisModule],
  providers: [JobListenerService],
  exports: [],
})
export class ListenersModule {}
