import { Body, Controller, Logger, Post } from '@nestjs/common';
import { McpJobsService } from '../jobs/mcp-jobs.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly mcpJobsService: McpJobsService;

  constructor(mcpJobsService: McpJobsService) {
    this.mcpJobsService = mcpJobsService;
  }

  @Post('mcp-job')
  async createMcpJob(@Body() data: {
    jobId?: string;
    filePath: string;
    agentType: string;
    priority?: number;
    metadata?: Record<string, any>;
  }) {
    this.logger.log(`📥 Webhook reçu pour lancer un job MCP: ${data.filePath}`);

    // Générer un jobId s'il n'est pas fourni
    const jobId = data.jobId || `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Créer le job dans la base de données
    const job = await this.mcpJobsService.createJob({
      jobId,
      status: 'pending',
      filePath: data.filePath,
      result: {
        agentType: data.agentType,
        priority: data.priority || 1,
        metadata: data.metadata || {},
        receivedAt: new Date().toISOString()
      }
    });

    this.logger.log(`✅ Job MCP créé avec succès: ${jobId}`);
    return {
      success: true,
      message: 'Job MCP créé avec succès',
      job
    };
  }
}