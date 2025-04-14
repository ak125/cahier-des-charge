import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { BullQueueModule } from '../bullmq/bullmq.module';

@Module({
  imports: [BullQueueModule],
  controllers: [JobsController],
  providers: [],
})
export class JobsModule {}