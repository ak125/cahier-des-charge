import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class McpJobsService {
  private readonly logger = new Logger(McpJobsService.name);

  constructor(private prisma: PrismaService) {}

  async createJob(data: Prisma.McpJobCreateInput) {
    this.logger.log(`🆕 Création d'un nouveau job MCP: ${data.jobId}`);
    return this.prismaDoDotmcpJob.create({ data });
  }

  async updateJobStatus(jobId: string, status: string, result?: any) {
    this.logger.log(`🔄 Mise à jour du statut du job ${jobId} vers: ${status}`);
    return this.prismaDoDotmcpJob.update({
      where: { jobId },
      data: {
        status,
        ...(result && { result }),
        updatedAt: new Date(),
      },
    });
  }

  async getJobById(jobId: string) {
    return this.prismaDoDotmcpJob.findUnique({
      where: { jobId },
    });
  }

  async getRecentJobs(limit = 20) {
    return this.prismaDoDotmcpJob.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async getJobsByStatus(status: string, limit = 20) {
    return this.prismaDoDotmcpJob.findMany({
      where: { status },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }
}
