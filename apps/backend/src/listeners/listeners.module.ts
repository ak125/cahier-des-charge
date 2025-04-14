import { Module } from '@nestjs/common';
import { JobListenerService } from './job.listener';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [JobListenerService],
  exports: []
})
export class ListenersModule {}