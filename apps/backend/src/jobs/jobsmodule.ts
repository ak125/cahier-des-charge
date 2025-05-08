import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { JobsController } from './jobs.controller';
import { McpJobsService } from '.DoDotmcp-jobs.service';

@Module({
  imports: [RedisModule],
  controllers: [JobsController],
  providers: [McpJobsService],
  exports: [McpJobsService],
})
export class JobsModule {}
