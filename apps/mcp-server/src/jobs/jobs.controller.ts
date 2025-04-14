import { Controller, Get, Post, Body, Param, Delete, Query, Logger } from '@nestjs/common';
import { BullQueueService, McpJobOptions } from '../bullmq/bullmq.service';

@Controller('jobs')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(private readonly bullQueueService: BullQueueService) {}

  @Get('stats')
  async getStats() {
    this.logger.log('📊 Récupération des statistiques des files d\'attente');
    return await this.bullQueueService.getAllQueuesStats();
  }

  @Get('stats/:queue')
  async getQueueStats(@Param('queue') queue: 'php-analyzer' | 'js-analyzer' | 'migration' | 'verification') {
    this.logger.log(`📊 Récupération des statistiques de la file ${queue}`);
    return await this.bullQueueService.getQueueStats(queue);
  }

  @Post('php-analyzer')
  async addPhpAnalyzerJob(
    @Body('filePath') filePath: string,
    @Body('options') options?: McpJobOptions
  ) {
    this.logger.log(`➕ Ajout d'un job d'analyse PHP pour ${filePath}`);
    const job = await this.bullQueueService.addPhpAnalyzerJob(filePath, options);
    return { 
      success: true, 
      jobId: job.id, 
      message: `Job ajouté à la file d'attente php-analyzer` 
    };
  }

  @Post('js-analyzer')
  async addJsAnalyzerJob(
    @Body('filePath') filePath: string,
    @Body('options') options?: McpJobOptions
  ) {
    this.logger.log(`➕ Ajout d'un job d'analyse JS pour ${filePath}`);
    const job = await this.bullQueueService.addJsAnalyzerJob(filePath, options);
    return { 
      success: true, 
      jobId: job.id, 
      message: `Job ajouté à la file d'attente js-analyzer` 
    };
  }

  @Post('migration')
  async addMigrationJob(
    @Body() payload: {
      source: string;
      target: string;
      type: 'route' | 'component' | 'api' | 'full';
      params?: Record<string, any>;
    },
    @Body('options') options?: McpJobOptions
  ) {
    this.logger.log(`➕ Ajout d'un job de migration pour ${payload.source} -> ${payload.target}`);
    const job = await this.bullQueueService.addMigrationJob(payload, options);
    return { 
      success: true, 
      jobId: job.id,
      message: `Job ajouté à la file d'attente migration`
    };
  }
  
  @Post('verification')
  async addVerificationJob(
    @Body('filePrefix') filePrefix: string,
    @Body('options') options?: McpJobOptions & {
      generatedDir?: string;
      specsDir?: string;
      verbosity?: number;
      typeCheck?: boolean;
    }
  ) {
    this.logger.log(`➕ Ajout d'un job de vérification pour ${filePrefix}`);
    const job = await this.bullQueueService.addVerificationJob(filePrefix, options);
    return { 
      success: true, 
      jobId: job.id,
      message: `Job ajouté à la file d'attente verification`
    };
  }
  
  @Post('batch')
  async addBatchJobs(
    @Body('files') files: string[],
    @Body('type') type: 'php' | 'js',
    @Body('options') options?: McpJobOptions & { batchId?: string }
  ) {
    this.logger.log(`➕ Ajout d'un lot de ${files.length} jobs de type ${type}`);
    
    const batchId = options?.batchId || `batch-${Date.now()}`;
    const jobs = [];
    
    for (const file of files) {
      const jobOptions = { 
        ...options, 
        metadata: { 
          ...(options?.metadata || {}), 
          batchId 
        } 
      };
      
      if (type === 'php') {
        const job = await this.bullQueueService.addPhpAnalyzerJob(file, jobOptions);
        jobs.push({ id: job.id, file });
      } else if (type === 'js') {
        const job = await this.bullQueueService.addJsAnalyzerJob(file, jobOptions);
        jobs.push({ id: job.id, file });
      }
    }
    
    return { 
      success: true, 
      batchId,
      count: jobs.length,
      jobs
    };
  }
  
  @Post('verification-batch')
  async addVerificationBatchJobs(
    @Body('filePrefixes') filePrefixes: string[],
    @Body('options') options?: McpJobOptions & { 
      batchId?: string;
      generatedDir?: string;
      specsDir?: string;
      verbosity?: number;
      typeCheck?: boolean;
    }
  ) {
    this.logger.log(`➕ Ajout d'un lot de ${filePrefixes.length} jobs de vérification`);
    
    const batchId = options?.batchId || `verify-batch-${Date.now()}`;
    const jobs = [];
    
    for (const filePrefix of filePrefixes) {
      const jobOptions = { 
        ...options, 
        metadata: { 
          ...(options?.metadata || {}), 
          batchId 
        } 
      };
      
      const job = await this.bullQueueService.addVerificationJob(filePrefix, jobOptions);
      jobs.push({ id: job.id, filePrefix });
    }
    
    return { 
      success: true, 
      batchId,
      count: jobs.length,
      jobs
    };
  }

  @Delete('clear/:queue')
  async clearQueue(@Param('queue') queue: 'php-analyzer' | 'js-analyzer' | 'migration' | 'verification') {
    this.logger.warn(`🧹 Vidage de la file d'attente ${queue}`);
    return await this.bullQueueService.clearQueue(queue);
  }
}