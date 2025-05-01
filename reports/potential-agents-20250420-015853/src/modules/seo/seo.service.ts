import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(private prisma: PrismaService, private configService: ConfigService) {}

  /**
   * Récupère toutes les pages SEO avec filtres
   */
  async getAllSeoPages(filters: {
    status?: string;
    score?: string;
    sort?: string;
    dir?: string;
    limit?: number;
    offset?: number;
  }) {
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
    });

    return {
      pages,
      total,
      limit,
      offset,
    };
  }

  /**
   * Récupère les détails d'une page SEO spécifique
   */
  async getSeoPageDetails(url: string) {
    return this.prisma.seoPage.findUnique({
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
  }

  /**
   * Récupère les statistiques globales du SEO
   */
  async getSeoStats() {
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

  /**
   * Lancer un audit SEO complet
   */
  async runSeoAudit() {
    try {
      this.logger.log("Démarrage d'un audit SEO complet");

      // Lire la configuration SEO
      const configPath = this.configService.get<string>(
        'SEO_CONFIG_PATH',
        path.resolve(process.cwd(), 'config/seo-config.json')
      );
      const configExists = fs.existsSync(configPath);

      if (!configExists) {
        throw new Error(`Fichier de configuration SEO introuvable: ${configPath}`);
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Créer un rapport d'audit vide
      const auditReport = await this.prisma.seoAuditReport.create({
        data: {
          name: `Audit SEO complet ${new Date().toLocaleDateString('fr-FR')}`,
          summary: {},
          averageScore: 0,
          totalUrls: 0,
          criticalIssues: 0,
          warnings: 0,
          successful: 0,
        },
      });

      // On déclenche ici le job d'audit qui sera traité par notre agent MCP
      // dans un processus asynchrone

      // Dans un environnement réel, nous utiliserions un système de file d'attente comme BullMQ
      // pour gérer les tâches d'audit de manière asynchrone
      const auditJobId = `seo-audit-${Date.now()}`;

      await this.prismaDoDotmcpJob.create({
        data: {
          jobId: auditJobId,
          status: 'pending',
          filePath: null,
          result: {
            reportId: auditReport.id,
            config: config,
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Audit SEO planifié avec l'ID: ${auditReport.id}`);

      return {
        message: 'Audit SEO démarré avec succès',
        reportId: auditReport.id,
        jobId: auditJobId,
      };
    } catch (error) {
      this.logger.error(`Erreur lors du lancement de l'audit SEO: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère tous les problèmes SEO avec filtres
   */
  async getAllSeoIssues(filters: {
    severity?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
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
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    return {
      issues,
      total,
      limit,
      offset,
    };
  }

  /**
   * Lance un audit SEO sur une page spécifique
   */
  async auditSinglePage(url: string) {
    try {
      this.logger.log(`Démarrage d'un audit SEO pour la page: ${url}`);

      // Vérifier si la page existe déjà dans la base de données
      let page = await this.prisma.seoPage.findUnique({
        where: { url },
      });

      if (!page) {
        // Créer la page si elle n'existe pas
        page = await this.prisma.seoPage.create({
          data: {
            url,
            status: 'pending',
          },
        });
      }

      // On déclenche ici le job d'audit pour une page qui sera traité par notre agent MCP
      const auditJobId = `seo-page-audit-${Date.now()}`;

      await this.prismaDoDotmcpJob.create({
        data: {
          jobId: auditJobId,
          status: 'pending',
          filePath: null,
          result: {
            pageId: page.id,
            url: url,
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Audit SEO de page planifié pour: ${url}`);

      return {
        message: `Audit SEO démarré pour ${url}`,
        pageId: page.id,
        jobId: auditJobId,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du lancement de l'audit SEO de page: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Met à jour les données d'une page après un audit
   */
  async updatePageAfterAudit(
    pageId: number,
    auditData: {
      title?: string;
      description?: string;
      canonical?: string;
      score: number;
      status: string;
      issues: Array<{
        type: string;
        severity: string;
        message: string;
        details?: any;
      }>;
    }
  ) {
    const { title, description, canonical, score, status, issues } = auditData;

    // Récupérer la page existante pour vérifier les changements de score
    const existingPage = await this.prisma.seoPage.findUnique({
      where: { id: pageId },
      select: { score: true },
    });

    // Mise à jour de la page
    const updatedPage = await this.prisma.seoPage.update({
      where: { id: pageId },
      data: {
        title,
        description,
        canonical,
        score,
        status,
        lastChecked: new Date(),
      },
    });

    // Supprimer les anciens problèmes non résolus
    await this.prisma.seoIssue.deleteMany({
      where: {
        pageId,
        fixed: false,
      },
    });

    // Ajouter les nouveaux problèmes
    if (issues && issues.length > 0) {
      await this.prisma.seoIssue.createMany({
        data: issues.map((issue) => ({
          type: issue.type,
          severity: issue.severity,
          message: issue.message,
          details: issue.details || {},
          pageId,
        })),
      });
    }

    // Ajouter une entrée d'historique si le score a changé
    if (!existingPage || existingPage.score !== score) {
      await this.prisma.seoHistory.create({
        data: {
          pageId,
          score,
          event: existingPage
            ? `Score SEO passé de ${existingPage.score} à ${score}`
            : `Premier audit SEO: score ${score}`,
          details: {
            oldScore: existingPage?.score || null,
            newScore: score,
            issuesCount: issues.length,
          },
        },
      });
    }

    return updatedPage;
  }

  /**
   * Marque un problème comme résolu
   */
  async fixIssue(issueId: number) {
    return this.prisma.seoIssue.update({
      where: { id: issueId },
      data: {
        fixed: true,
        fixedAt: new Date(),
      },
    });
  }

  /**
   * Génère un rapport d'audit SEO au format PDF
   */
  async generateSeoReport() {
    // Récupérer les données nécessaires pour le rapport
    const [stats, pages, issues] = await Promise.all([
      this.getSeoStats(),
      this.prisma.seoPage.findMany({
        orderBy: { score: 'asc' },
        take: 100,
        include: { issues: true },
      }),
      this.prisma.seoIssue.groupBy({
        by: ['type', 'severity'],
        _count: { _all: true },
      }),
    ]);

    // Dans un environnement réel, nous utiliserions une bibliothèque comme PDFKit
    // pour générer un PDF avec ces données

    // Pour l'exemple, nous retournons simplement les données structurées
    return {
      timestamp: new Date().toISOString(),
      stats,
      pages: pages.map((p) => ({
        url: p.url,
        score: p.score,
        status: p.status,
        issuesCount: p.issues.length,
      })),
      issuesSummary: issues,
    };
  }

  /**
   * Gère les redirections SEO
   */
  async getRedirects(active?: boolean) {
    const where = active !== undefined ? { active } : {};

    return this.prisma.seoRedirect.findMany({
      where,
      orderBy: { source: 'asc' },
    });
  }

  /**
   * Ajoute une redirection
   */
  async addRedirect(data: { source: string; destination: string; statusCode?: number }) {
    const { source, destination, statusCode = 301 } = data;

    return this.prisma.seoRedirect.create({
      data: {
        source,
        destination,
        statusCode,
      },
    });
  }

  /**
   * Importe des redirections depuis un fichier htaccess
   */
  async importRedirectsFromHtaccess(htaccessContent: string) {
    const redirects = [];
    const lines = htaccessContent.split('\n');

    // Expression régulière simplifiée pour les règles de redirection dans htaccess
    const redirectRegex = /RedirectMatch\s+(\d+)\s+(.+?)\s+(.+)/i;
    const rewriteRegex = /RewriteRule\s+(.+?)\s+(.+?)\s+\[R=(\d+).*\]/i;

    for (const line of lines) {
      let match = line.match(redirectRegex);

      if (match) {
        redirects.push({
          source: match[2],
          destination: match[3],
          statusCode: parseInt(match[1], 10),
        });
        continue;
      }

      match = line.match(rewriteRegex);

      if (match) {
        redirects.push({
          source: match[1],
          destination: match[2],
          statusCode: parseInt(match[3], 10) || 301,
        });
      }
    }

    if (redirects.length === 0) {
      return { imported: 0 };
    }

    // Insérer les redirections dans la base de données
    const result = await this.prisma.seoRedirect.createMany({
      data: redirects,
      skipDuplicates: true,
    });

    return { imported: result.count };
  }

  /**
   * Récupère l'historique SEO
   */
  async getSeoHistory(limit = 50) {
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
    });
  }
}
