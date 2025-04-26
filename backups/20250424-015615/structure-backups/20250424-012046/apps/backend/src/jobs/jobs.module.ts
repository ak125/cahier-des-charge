import { Module } from @nestjs/commonstructure-agent';
import { JobsController } from ./jobs.controllerstructure-agent';
import { RedisModule } from ../redis/redis.modulestructure-agent';
import { McpJobsService } from .DoDotmcp-jobs.servicestructure-agent';

@Module({
  imports: [RedisModule],
  controllers: [JobsController],
  providers: [McpJobsService],
  exports: [McpJobsService]
})
export class JobsModule {}