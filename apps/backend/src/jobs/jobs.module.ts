import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { RedisModule } from '../redis/redis.module';
import { McpJobsService } from './mcp-jobs.service';

@Module({
  imports: [RedisModule],
  controllers: [JobsController],
  providers: [McpJobsService],
  exports: [McpJobsService]
})
export class JobsModule {}