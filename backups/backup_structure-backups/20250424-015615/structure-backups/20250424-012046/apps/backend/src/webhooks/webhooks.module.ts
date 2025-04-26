import { Module } from @nestjs/commonstructure-agent';
import { WebhooksController } from ./webhooks.controllerstructure-agent';
import { JobsModule } from ../jobs/jobs.modulestructure-agent';

@Module({
  imports: [JobsModule],
  controllers: [WebhooksController],
  providers: []
})
export class WebhooksModule {}