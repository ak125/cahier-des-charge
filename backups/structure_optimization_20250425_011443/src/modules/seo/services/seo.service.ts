import { Injectable, Logger } from @nestjs/commonstructure-agent';
import { ConfigService } from @nestjs/configstructure-agent';
import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';
import { ISeoService } from ../interfaces/seo-service.interfacestructure-agent';
import { ISeoRepository } from ../interfaces/seo-repository.interfacestructure-agent';
import { SeoStrategyRegistry } from ./seo-strategy.registrystructure-agent';

@Injectable()
export class SeoService implements ISeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    private seoRepository: ISeoRepository,
    private configService: ConfigService,
    private strategyRegistry: SeoStrategyRegistry,
  ) {}

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
    return this.seoRepository.getAllPages(filters);
  }

  /**
   * Récupère les détails d'une page SEO spécifique
   */
  async getSeoPageDetails(url: string) {
    return this.seoRepository.getPageDetails(url);
  }

  /**
   * Récupère les statistiques globales du SEO
   */
  async getSeoStats() {
    return this.seoRepository.getSeoStats();
  }

  /**
   * Lancer un audit SEO complet
   */
  async runSeoAudit() {
    try {
      this.logger.log('Démarrage d\'un audit SEO complet');
      
      // Lire la configuration SEO
      const configPath = this.configService.get<string>('SEO_CONFIG_PATH', path.resolve(process.cwd(), 'config/seo-config.json'));
      const configExists = fs.existsSync(configPath);
      
      if (!configExists) {
        throw new Error(`Fichier de configuration SEO introuvable: ${configPath}`);
      }
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      // Créer un rapport d'audit vide
      const auditReport = await this.seoRepository.createAuditReport({
        name: `Audit SEO complet ${new Date().toLocaleDateString('fr-FR')}`,
        summary: {},
        averageScore: 0,
        totalUrls: 0,
        criticalIssues: 0,
        warnings: 0,
        successful: 0,
      });
      
      // On déclenche ici le job d'audit qui sera traité par notre agent MCP
      // dans un processus asynchrone
      const auditJobId = `seo-audit-${Date.now()}`;
      
      await this.seoRepository.createJob({
        jobId: auditJobId,
        status: 'pending',
        filePath: null,
        result: {
          reportId: auditReport.id,
          config: config,
          timestamp: new Date().toISOString(),
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
    return this.seoRepository.getAllIssues(filters);
  }

  /**
   * Lance un audit SEO sur une page spécifique
   */
  async auditSinglePage(url: string) {
    try {
      this.logger.log(`Démarrage d'un audit SEO pour la page: ${url}`);

      // Vérifier si la page existe déjà dans la base de données
      let page = await this.seoRepository.getPageDetails(url);

      if (!page) {
        // Créer la page si elle n'existe pas
        page = await this.seoRepository.updatePage(0, { 
          url,
          status: 'pending',
          score: 0,
        });
      }
      
      // On déclenche ici le job d'audit pour une page qui sera traité par notre agent MCP
      const auditJobId = `seo-page-audit-${Date.now()}`;
      
      await this.seoRepository.createJob({
        jobId: auditJobId,
        status: 'pending',
        filePath: null,
        result: {
          pageId: page.id,
          url: url,
          timestamp: new Date().toISOString(),
        },
      });
      
      this.logger.log(`Audit SEO de page planifié pour: ${url}`);
      
      return {
        message: `Audit SEO démarré pour ${url}`,
        pageId: page.id,
        jobId: auditJobId,
      };
    } catch (error) {
      this.logger.error(`Erreur lors du lancement de l'audit SEO de page: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Met à jour les données d'une page après un audit
   */
  async updatePageAfterAudit(pageId: number, auditData: {
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
  }) {
    const { title, description, canonical, score, status, issues } = auditData;
    
    // Récupérer la page existante pour vérifier les changements de score
    const existingPage = await this.seoRepository.getPageDetails(`pageId:${pageId}`);
    
    // Mise à jour de la page
    const updatedPage = await this.seoRepository.updatePage(pageId, {
      title,
      description,
      canonical,
      score,
      status: status as any,
      lastChecked: new Date(),
    });
    
    // Supprimer les anciens problèmes non résolus
    await this.seoRepository.deleteIssues(pageId, true);
    
    // Ajouter les nouveaux problèmes
    if (issues && issues.length > 0) {
      await this.seoRepository.createManyIssues(issues.map(issue => ({
        pageId,
        type: issue.type,
        severity: issue.severity as any,
        message: issue.message,
        details: issue.details || {},
        fixed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })));
    }
    
    // Ajouter une entrée d'historique si le score a changé
    if (!existingPage || existingPage.score !== score) {
      await this.seoRepository.addToHistory({
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
      });
    }
    
    return updatedPage;
  }

  /**
   * Marque un problème comme résolu
   */
  async fixIssue(issueId: number) {
    return this.seoRepository.fixIssue(issueId);
  }

  /**
   * Génère un rapport d'audit SEO au format PDF
   */
  async generateSeoReport() {
    // Récupérer les données nécessaires pour le rapport
    const [stats, pages, issues] = await Promise.all([
      this.getSeoStats(),
      this.getAllSeoPages({ limit: 100 }),
      this.getAllSeoIssues({ limit: 1000 }),
    ]);

    // Dans un environnement réel, nous utiliserions une bibliothèque comme PDFKit
    // pour générer un PDF avec ces données
    
    // Pour l'exemple, nous retournons simplement les données structurées
    return {
      timestamp: new Date().toISOString(),
      stats,
      pages: pages.pages.map(p => ({
        url: p.url,
        score: p.score,
        status: p.status,
        issuesCount: p.issues.length,
      })),
      issuesSummary: Object.entries(issues.issues.reduce((acc, issue) => {
        const key = `${issue.type}-${issue.severity}`;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key]++;
        return acc;
      }, {} as Record<string, number>)).map(([key, count]) => {
        const [type, severity] = key.split('-');
        return { type, severity, count };
      }),
    };
  }
  
  /**
   * Gère les redirections SEO
   */
  async getRedirects(active?: boolean) {
    return this.seoRepository.getRedirects(active);
  }
  
  /**
   * Ajoute une redirection
   */
  async addRedirect(data: { source: string; destination: string; statusCode?: number }) {
    return this.seoRepository.addRedirect(data);
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
    const result = await this.seoRepository.addManyRedirects(redirects);
    
    return { imported: result.count };
  }

  /**
   * Récupère l'historique SEO
   */
  async getSeoHistory(limit = 50) {
    return this.seoRepository.getHistory(limit);
  }
}