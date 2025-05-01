import { Module } from '@nestjs/common';
import { StandardizedOrchestratorService } from '../../orchestration/standardized-orchestrator.service';
import { BullBoardService } from './bull-board.service';
import { BullQueueService } from './bullmq.service';

@Module({
  providers: [
    {
      provide: 'PHP_ANALYZER_QUEUE',
      useFactory: (orchestrator: StandardizedOrchestratorService) => {
        return {
          add: (_name, payload, options = {}) => {
            return orchestrator.scheduleTask('PhpAnalyzer', payload, {
              taskType: 'SIMPLE',
              priority: options.priority,
              attempts: options.attempts,
              delay: options.delay,
              removeOnComplete: options.removeOnComplete,
              removeOnFail: options.removeOnFail,
            });
          },
        };
      },
      inject: [StandardizedOrchestratorService],
    },
    {
      provide: 'JS_ANALYZER_QUEUE',
      useFactory: (orchestrator: StandardizedOrchestratorService) => {
        return {
          add: (_name, payload, options = {}) => {
            return orchestrator.scheduleTask('js-analyzer', payload, {
              taskType: 'SIMPLE',
              priority: options.priority,
              attempts: options.attempts,
              delay: options.delay,
              removeOnComplete: options.removeOnComplete,
              removeOnFail: options.removeOnFail,
            });
          },
        };
      },
      inject: [StandardizedOrchestratorService],
    },
    {
      provide: 'MIGRATION_QUEUE',
      useFactory: (orchestrator: StandardizedOrchestratorService) => {
        return {
          add: (_name, payload, options = {}) => {
            return orchestrator.scheduleTask('migration', payload, {
              taskType: 'SIMPLE',
              priority: options.priority,
              attempts: options.attempts,
              delay: options.delay,
              removeOnComplete: options.removeOnComplete,
              removeOnFail: options.removeOnFail,
            });
          },
        };
      },
      inject: [StandardizedOrchestratorService],
    },
    {
      provide: 'VERIFICATION_QUEUE',
      useFactory: (orchestrator: StandardizedOrchestratorService) => {
        return {
          add: (_name, payload, options = {}) => {
            return orchestrator.scheduleTask('verification', payload, {
              taskType: 'SIMPLE',
              priority: options.priority,
              attempts: options.attempts,
              delay: options.delay,
              removeOnComplete: options.removeOnComplete,
              removeOnFail: options.removeOnFail,
            });
          },
        };
      },
      inject: [StandardizedOrchestratorService],
    },
    StandardizedOrchestratorService,
    BullQueueService,
    BullBoardService,
  ],
  exports: [
    'PHP_ANALYZER_QUEUE',
    'JS_ANALYZER_QUEUE',
    'MIGRATION_QUEUE',
    'VERIFICATION_QUEUE',
    BullQueueService,
    BullBoardService,
    StandardizedOrchestratorService,
  ],
})
export class BullQueueModule {}
