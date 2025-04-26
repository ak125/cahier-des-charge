import { Module } from @nestjs/commonstructure-agent';
import { JobsController } from ./jobs.controllerstructure-agent';
import { BullQueueModule } from ../bullmq/bullmq.modulestructure-agent';

@Module({
  imports: [BullQueueModule],
  controllers: [JobsController],
  providers: [],
})
export class JobsModule {}