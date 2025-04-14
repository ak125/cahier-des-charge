import { Controller, Get, Post, Param, Body, Patch, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisService } from '../redis/redis.service';
import { McpJobsService } from './mcp-jobs.service';

@Controller('jobs')
export class JobsController {
  private readonly clients = new Map<string, (data: any) => void>();

  constructor(
    private redisService: RedisService,
    private mcpJobsService: McpJobsService
  ) {
    // S'abonner aux événements Redis
    this.redisService.subscribe('job_finished', (data) => {
      // Diffuser aux clients SSE connectés
      this.clients.forEach(client => client(data));
    });
  }

  @Get()
  async getJobs(@Query('status') status?: string, @Query('limit') limit = '20') {
    const limitNum = parseInt(limit, 10);
    if (status) {
      return this.mcpJobsService.getJobsByStatus(status, limitNum);
    }
    return this.mcpJobsService.getRecentJobs(limitNum);
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    return this.mcpJobsService.getJobById(jobId);
  }

  @Post()
  async createJob(@Body() data: any) {
    return this.mcpJobsService.createJob({
      jobId: data.jobId,
      status: data.status || 'pending',
      filePath: data.filePath,
      result: data.result || {},
    });
  }

  @Patch(':jobId/status')
  async updateJobStatus(
    @Param('jobId') jobId: string,
    @Body() data: { status: string; result?: any }
  ) {
    return this.mcpJobsService.updateJobStatus(jobId, data.status, data.result);
  }

  @Sse('events')
  events(): Observable<MessageEvent> {
    return new Observable(observer => {
      const clientId = Date.now().toString();
      
      // Gestionnaire d'événements pour ce client
      const handler = (data: any) => {
        observer.next({ data } as MessageEvent);
      };
      
      // Ajouter ce client à la liste des clients connectés
      this.clients.set(clientId, handler);
      
      // Nettoyage lorsque la connexion est fermée
      return () => {
        this.clients.delete(clientId);
      };
    });
  }
}