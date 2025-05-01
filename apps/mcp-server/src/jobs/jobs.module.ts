import { Module } from '@nestjs/common';
import { BullQueueModule } from '../bullmq/bullmq.module';
import { JobsController } from './jobs.controller';

@Module({
  imports: [BullQueueModule],
  controllers: [JobsController],
  providers: [],
})
export class JobsModule {}
