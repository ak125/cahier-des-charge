import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ISeoRepository } from '../interfaces/seo-repository.interface';
import { SeoPage, SeoIssue, SeoHistory, SeoAuditReport, SeoRedirect } from '../entities';

/**
 * Implémentation du repository SEO basée sur Prisma
 * Adapte la couche Prisma à notre interface de repository
 */
@Injectable()
export class PrismaSeoRepository implements ISeoRepository {
  private readonly logger = new Logger(PrismaSeoRepository.name);

  constructor(private prisma: PrismaService) {}

  async getAllPages(filters: {
    status?: string;
    score?: string;
    sort?: string;
    dir?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ pages: SeoPage[]; total: number; limit: number; offset: number }> {
    const { status, score, sort = 'url', dir = 'asc', limit = 100, offset = 0 } = filters;
    
    // Construction des filtres
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (score && score !== 'all') {
      const [min, max] = score.split('-').map(Number);
      where.score = {
        gte: min,
        lte: max,
      };
    }
    
    // Obtenir le nombre total pour la pagination
    const total = await this.prisma.seoPage.count({ where });
    
    // Récupérer les pages avec leurs problèmes associés
    const pages = await this.prisma.seoPage.findMany({
      where,
      orderBy: {
        [sort]: dir.toLowerCase() === 'desc' ? 'desc' : 'asc',
      },
      include: {
        issues: true,
      },
      take: limit,
      skip: offset,
    }) as unknown as SeoPage[];
    
    return {
      pages,
      total,
      limit,
      offset,
    };
  }

  async getPageDetails(url: string): Promise<SeoPage | null> {
    const result = await this.prisma.seoPage.findUnique({
      where: { url },
      include: {
        issues: true,
        history: {
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
      },
    });
    
    return result as unknown as SeoPage | null;
  }

  async updatePage(pageId: number, data: Partial<SeoPage>): Promise<SeoPage> {
    return this.prisma.seoPage.update({
      where: { id: pageId },
      data,
    }) as unknown as SeoPage;
  }

  async getSeoStats(): Promise<{
    total: number;
    critical: number;
    warnings: number;
    good: number;
    averageScore: number;
  }> {
    const [total, critical, warnings, good, avgScore] = await Promise.all([
      this.prisma.seoPage.count(),
      this.prisma.seoPage.count({ where: { status: 'error' } }),
      this.prisma.seoPage.count({ where: { status: 'warning' } }),
      this.prisma.seoPage.count({ where: { status: 'success' } }),
      this.prisma.seoPage.aggregate({
        _avg: {
          score: true,
        },
      }),
    ]);

    return {
      total,
      critical,
      warnings,
      good,
      averageScore: avgScore._avg.score || 0,
    };
  }

  async getAllIssues(filters: {
    severity?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ issues: SeoIssue[]; total: number; limit: number; offset: number }> {
    const { severity, type, limit = 100, offset = 0 } = filters;
    
    // Construction des filtres
    const where: any = { fixed: false };
    
    if (severity && severity !== 'all') {
      where.severity = severity;
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    // Obtenir le nombre total pour la pagination
    const total = await this.prisma.seoIssue.count({ where });
    
    // Récupérer les problèmes avec leurs pages associées
    const issues = await this.prisma.seoIssue.findMany({
      where,
      include: {
        page: {
          select: {
            url: true,
            title: true,
            score: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }) as unknown as SeoIssue[];
    
    return {
      issues,
      total,
      limit,
      offset,
    };
  }

  async createIssue(issue: Omit<SeoIssue, 'id'>): Promise<SeoIssue> {
    return this.prisma.seoIssue.create({
      data: issue as any,
    }) as unknown as SeoIssue;
  }

  async createManyIssues(issues: Array<Omit<SeoIssue, 'id'>>): Promise<{ count: number }> {
    return this.prisma.seoIssue.createMany({
      data: issues as any[],
    });
  }

  async deleteIssues(pageId: number, onlyUnfixed: boolean = true): Promise<{ count: number }> {
    const where: any = { pageId };
    
    if (onlyUnfixed) {
      where.fixed = false;
    }
    
    return this.prisma.seoIssue.deleteMany({
      where,
    });
  }

  async fixIssue(issueId: number): Promise<SeoIssue> {
    return this.prisma.seoIssue.update({
      where: { id: issueId },
      data: {
        fixed: true,
        fixedAt: new Date(),
      },
    }) as unknown as SeoIssue;
  }

  async addToHistory(data: Omit<SeoHistory, 'id' | 'date'>): Promise<SeoHistory> {
    return this.prisma.seoHistory.create({
      data: data as any,
    }) as unknown as SeoHistory;
  }

  async getHistory(limit: number = 50): Promise<SeoHistory[]> {
    return this.prisma.seoHistory.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        page: {
          select: {
            url: true,
            title: true,
          },
        },
      },
    }) as unknown as SeoHistory[];
  }

  async createAuditReport(data: Omit<SeoAuditReport, 'id' | 'createdAt'>): Promise<SeoAuditReport> {
    return this.prisma.seoAuditReport.create({
      data: data as any,
    }) as unknown as SeoAuditReport;
  }

  async getRedirects(active?: boolean): Promise<SeoRedirect[]> {
    const where = active !== undefined ? { active } : {};
    
    return this.prisma.seoRedirect.findMany({
      where,
      orderBy: { source: 'asc' },
    }) as unknown as SeoRedirect[];
  }

  async addRedirect(data: { source: string; destination: string; statusCode?: number }): Promise<SeoRedirect> {
    const { source, destination, statusCode = 301 } = data;
    
    return this.prisma.seoRedirect.create({
      data: {
        source,
        destination,
        statusCode,
      },
    }) as unknown as SeoRedirect;
  }

  async addManyRedirects(redirects: Array<{ source: string; destination: string; statusCode?: number }>): Promise<{ count: number }> {
    return this.prisma.seoRedirect.createMany({
      data: redirects.map(r => ({
        source: r.source,
        destination: r.destination,
        statusCode: r.statusCode || 301,
      })),
      skipDuplicates: true,
    });
  }

  async createJob(data: { jobId: string; status: string; filePath: string | null; result: any }): Promise<any> {
    return this.prismaDoDotmcpJob.create({
      data,
    });
  }
}