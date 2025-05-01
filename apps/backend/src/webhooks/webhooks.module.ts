import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [JobsModule],
  controllers: [WebhooksController],
  providers: [],
})
export class WebhooksModule {}
