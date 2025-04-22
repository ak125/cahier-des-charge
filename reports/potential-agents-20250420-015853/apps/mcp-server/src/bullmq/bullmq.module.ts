import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BullQueueService } from './bullmq.service';
import { BullBoardService } from './bull-board.service';

@Module({
  providers: [
    {
      provide: 'PHP_ANALYZER_QUEUE',
      useFactory: () => {
        return new Queue('PhpAnalyzer', {
          connection: { 
            host: process.env.REDIS_HOST || 'localhost', 
            port: parseInt(process.env.REDIS_PORT || '6379') 
          },
        });
      },
    },
    {
      provide: 'JS_ANALYZER_QUEUE',
      useFactory: () => {
        return new Queue('js-analyzer', {
          connection: { 
            host: process.env.REDIS_HOST || 'localhost', 
            port: parseInt(process.env.REDIS_PORT || '6379') 
          },
        });
      },
    },
    {
      provide: 'MIGRATION_QUEUE',
      useFactory: () => {
        return new Queue('migration', {
          connection: { 
            host: process.env.REDIS_HOST || 'localhost', 
            port: parseInt(process.env.REDIS_PORT || '6379') 
          },
        });
      },
    },
    {
      provide: 'VERIFICATION_QUEUE',
      useFactory: () => {
        return new Queue('verification', {
          connection: { 
            host: process.env.REDIS_HOST || 'localhost', 
            port: parseInt(process.env.REDIS_PORT || '6379') 
          },
        });
      },
    },
    BullQueueService,
    BullBoardService,
  ],
  exports: [
    'PHP_ANALYZER_QUEUE', 
    'JS_ANALYZER_QUEUE', 
    'MIGRATION_QUEUE', 
    'VERIFICATION_QUEUE', 
    BullQueueService, 
    BullBoardService
  ],
})
export class BullQueueModule {}