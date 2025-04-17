import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { CheckpointManager } from '../persistence/checkpoint-manager';
import { WorkflowCheckpoint, CheckpointStatus } from '../persistence/types';
import { createLogger } from '../../utils/logger';
import { PrometheusExporter } from '../monitoring/prometheus-exporter';
import { SystemMonitor, SystemMetrics } from '../scheduler/system-monitor';
import handlebars from 'handlebars';
import { format } from 'date-fns';

/**
 * Configuration du générateur de rapports
 */
export interface ReportGeneratorConfig {
  outputDir: string;                // Répertoire de sortie des rapports
  templateDir: string;              // Répertoire des templates
  reportTitle: string;              // Titre par défaut des rapports
  companyName: string;              // Nom de l'entreprise
  includeLogo: boolean;             // Inclure le logo
  logoPath?: string;                // Chemin vers le logo
  includeTechnicalDetails: boolean; // Inclure les détails techniques
  includeSystemMetrics: boolean;    // Inclure les métriques système
  reportTypes: {                    // Types de rapports disponibles
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    onDemand: boolean;
  };
  retention: {                      // Politique de rétention des rapports
    days: number;                   // Nombre de jours de conservation
  };
}

/**
 * Format de sortie du rapport
 */
export enum ReportFormat {
  PDF = 'pdf',
  HTML = 'html',
  JSON = 'json'
}

/**
 * Données du rapport
 */
interface ReportData {
  title: string;
  generatedAt: string;
  companyName: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
    inProgressWorkflows: number;
    successRate: number;
    averageDuration: string;
  };
  workflowDetails: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    startedAt: string;
    completedAt?: string;
    duration: string;
    errors: number;
    retryAttempts: number;
    priority: number;
  }>;
  systemMetrics?: {
    averageCpuUsage: number;
    maxCpuUsage: number;
    averageMemoryUsage: number;
    maxMemoryUsage: number;
    averageLoadAverage: number;
  };
  charts: {
    workflowStatus: {
      labels: string[];
      data: number[];
      colors: string[];
    };
    dailyWorkflowCompletion: {
      labels: string[];
      data: number[];
    };
    resourceUsage?: {
      labels: string[];
      cpu: number[];
      memory: number[];
      load: number[];
    };
  };
  errors: Array<{
    workflowId: string;
    workflowName: string;
    timestamp: string;
    message: string;
    errorType: string;
    stackTrace?: string;
  }>;
  technicalDetails?: any;
}

/**
 * Générateur de rapports de migration
 * Produit des rapports PDF et HTML exportables
 */
export class MigrationReportGenerator {
  private logger = createLogger('MigrationReportGenerator');
  private config: ReportGeneratorConfig;
  private checkpointManager: CheckpointManager;
  private prometheusExporter?: PrometheusExporter;
  private systemMonitor?: SystemMonitor;
  private htmlTemplate: string;
  private browser: puppeteer.Browser | null = null;

  constructor(
    config: Partial<ReportGeneratorConfig> = {},
    prometheusExporter?: PrometheusExporter,
    systemMonitor?: SystemMonitor
  ) {
    this.config = {
      outputDir: path.join(process.cwd(), 'reports'),
      templateDir: path.join(process.cwd(), 'packages', 'mcp-agents', 'orchestrators', 'reporting', 'templates'),
      reportTitle: 'Rapport de Migration PHP vers Remix',
      companyName: 'Entreprise',
      includeLogo: false,
      includeTechnicalDetails: true,
      includeSystemMetrics: true,
      reportTypes: {
        daily: true,
        weekly: true,
        monthly: false,
        onDemand: true
      },
      retention: {
        days: 60
      },
      ...config
    };

    this.checkpointManager = new CheckpointManager();
    this.prometheusExporter = prometheusExporter;
    this.systemMonitor = systemMonitor;

    // Charger le template HTML
    this.htmlTemplate = this.loadTemplate('report.html');

    // Enregistrer les helpers Handlebars
    this.registerHandlebarsHelpers();
    
    this.logger.info('Migration report generator initialized');
  }

  /**
   * Initialise le générateur de rapports
   */
  async initialize(): Promise<void> {
    await this.checkpointManager.initialize();
    
    // S'assurer que le répertoire de sortie existe
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
      this.logger.info(`Created output directory: ${this.config.outputDir}`);
    }
    
    // Initialiser Puppeteer pour la génération de PDF
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.logger.info('Puppeteer initialized for PDF generation');
    } catch (error) {
      this.logger.error('Failed to initialize Puppeteer:', error);
    }
    
    this.logger.info('Migration report generator ready');
  }

  /**
   * Charge un template depuis le système de fichiers
   * @param templateName Nom du fichier de template
   */
  private loadTemplate(templateName: string): string {
    const templatePath = path.join(this.config.templateDir, templateName);
    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}:`, error);
      // Template de secours minimal
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>{{title}}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>{{title}}</h1>
            <p>Rapport généré le {{generatedAt}}</p>
          </div>
          <div class="summary">
            <h2>Résumé</h2>
            <p>Total des workflows: {{summary.totalWorkflows}}</p>
            <p>Workflows complétés: {{summary.completedWorkflows}}</p>
            <p>Workflows en échec: {{summary.failedWorkflows}}</p>
            <p>Workflows en cours: {{summary.inProgressWorkflows}}</p>
            <p>Taux de réussite: {{summary.successRate}}%</p>
          </div>
        </body>
        </html>
      `;
    }
  }

  /**
   * Enregistre des helpers Handlebars personnalisés
   */
  private registerHandlebarsHelpers(): void {
    handlebars.registerHelper('formatDate', function(date: string) {
      if (!date) return '';
      return format(new Date(date), 'dd/MM/yyyy HH:mm:ss');
    });
    
    handlebars.registerHelper('formatPercent', function(value: number) {
      return (value || 0).toFixed(1) + '%';
    });
    
    handlebars.registerHelper('statusClass', function(status: string) {
      switch (status) {
        case 'completed':
          return 'status-success';
        case 'failed':
          return 'status-error';
        case 'in_progress':
          return 'status-warning';
        default:
          return 'status-info';
      }
    });
    
    handlebars.registerHelper('truncate', function(text: string, length: number) {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    });
  }

  /**
   * Génère un rapport pour une période donnée
   * @param startDate Date de début de la période
   * @param endDate Date de fin de la période
   * @param format Format de sortie du rapport
   * @param title Titre personnalisé du rapport
   */
  async generateReport(
    startDate: Date,
    endDate: Date,
    format: ReportFormat = ReportFormat.PDF,
    title?: string
  ): Promise<string> {
    this.logger.info(`Generating ${format} report from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Récupérer les données des workflows
    const reportData = await this.collectReportData(startDate, endDate, title);
    
    // Générer le rapport dans le format demandé
    let outputPath: string;
    
    switch (format) {
      case ReportFormat.HTML:
        outputPath = await this.generateHtmlReport(reportData);
        break;
      case ReportFormat.JSON:
        outputPath = await this.generateJsonReport(reportData);
        break;
      case ReportFormat.PDF:
      default:
        outputPath = await this.generatePdfReport(reportData);
        break;
    }
    
    this.logger.info(`Report generated successfully: ${outputPath}`);
    return outputPath;
  }

  /**
   * Génère un rapport quotidien
   * @param date Date du jour (par défaut: aujourd'hui)
   * @param format Format de sortie
   */
  async generateDailyReport(date: Date = new Date(), format: ReportFormat = ReportFormat.PDF): Promise<string> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const title = `Rapport Journalier de Migration - ${format(date, 'dd/MM/yyyy')}`;
    
    return this.generateReport(startDate, endDate, format, title);
  }

  /**
   * Génère un rapport hebdomadaire
   * @param date Date dans la semaine cible (par défaut: aujourd'hui)
   * @param format Format de sortie
   */
  async generateWeeklyReport(date: Date = new Date(), format: ReportFormat = ReportFormat.PDF): Promise<string> {
    const dayOfWeek = date.getDay();
    const startDate = new Date(date);
    // Régler au lundi de la semaine
    startDate.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    // Avancer au dimanche
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    const title = `Rapport Hebdomadaire de Migration - Semaine ${this.getWeekNumber(date)}`;
    
    return this.generateReport(startDate, endDate, format, title);
  }

  /**
   * Génère un rapport mensuel
   * @param date Date dans le mois cible (par défaut: aujourd'hui)
   * @param format Format de sortie
   */
  async generateMonthlyReport(date: Date = new Date(), format: ReportFormat = ReportFormat.PDF): Promise<string> {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const title = `Rapport Mensuel de Migration - ${format(date, 'MMMM yyyy')}`;
    
    return this.generateReport(startDate, endDate, format, title);
  }

  /**
   * Collecte les données pour le rapport
   * @param startDate Date de début
   * @param endDate Date de fin
   * @param title Titre personnalisé
   */
  private async collectReportData(startDate: Date, endDate: Date, title?: string): Promise<ReportData> {
    // Récupérer tous les checkpoints dans la période
    const workflows = await this.getWorkflowsInPeriod(startDate, endDate);
    
    // Calculer les statistiques des workflows
    const completedWorkflows = workflows.filter(w => w.status === CheckpointStatus.COMPLETED);
    const failedWorkflows = workflows.filter(w => w.status === CheckpointStatus.FAILED);
    const inProgressWorkflows = workflows.filter(w => 
      w.status === CheckpointStatus.IN_PROGRESS || 
      w.status === CheckpointStatus.PENDING || 
      w.status === CheckpointStatus.RESUMING
    );
    
    const successRate = workflows.length > 0 
      ? Math.round((completedWorkflows.length / workflows.length) * 100) 
      : 0;
    
    // Calculer la durée moyenne
    const durations = completedWorkflows
      .filter(w => w.createdAt && w.updatedAt)
      .map(w => {
        const duration = w.updatedAt!.getTime() - w.createdAt!.getTime();
        return duration / 1000; // en secondes
      });
    
    const averageDuration = durations.length > 0
      ? this.formatDuration(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 'N/A';
    
    // Préparer les données des workflows
    const workflowDetails = workflows.map(w => ({
      id: w.workflowId,
      name: w.metadata?.name || w.workflowId,
      status: w.status.toLowerCase(),
      progress: w.progress || 0,
      startedAt: w.createdAt ? w.createdAt.toISOString() : '',
      completedAt: w.status === CheckpointStatus.COMPLETED ? w.updatedAt?.toISOString() : undefined,
      duration: w.createdAt && w.updatedAt 
        ? this.formatDuration((w.updatedAt.getTime() - w.createdAt.getTime()) / 1000)
        : 'En cours',
      errors: w.errors?.length || 0,
      retryAttempts: w.metadata?.retryStrategy?.currentAttempt || 0,
      priority: w.metadata?.priority || 5
    }));
    
    // Préparer les données des erreurs
    const errors = workflows
      .filter(w => w.errors && w.errors.length > 0)
      .flatMap(w => (w.errors || []).map(e => ({
        workflowId: w.workflowId,
        workflowName: w.metadata?.name || w.workflowId,
        timestamp: e.timestamp.toISOString(),
        message: e.message,
        errorType: e.type,
        stackTrace: this.config.includeTechnicalDetails ? e.stack : undefined
      })));
    
    // Récupérer les métriques système si disponibles
    let systemMetrics: ReportData['systemMetrics'] | undefined = undefined;
    let resourceUsageChart: ReportData['charts']['resourceUsage'] | undefined = undefined;
    
    if (this.config.includeSystemMetrics && this.systemMonitor) {
      const metrics = this.systemMonitor.getMetricsHistory()
        .filter(m => m.timestamp >= startDate && m.timestamp <= endDate);
      
      if (metrics.length > 0) {
        // Calculer les moyennes et maximums
        const cpuUsages = metrics.map(m => m.cpuUsagePercent);
        const memUsages = metrics.map(m => m.memoryUsagePercent);
        const loadAvgs = metrics.map(m => m.loadAverage);
        
        systemMetrics = {
          averageCpuUsage: this.average(cpuUsages),
          maxCpuUsage: Math.max(...cpuUsages),
          averageMemoryUsage: this.average(memUsages),
          maxMemoryUsage: Math.max(...memUsages),
          averageLoadAverage: this.average(loadAvgs)
        };
        
        // Préparer les données pour le graphique des ressources
        // Simplifier en prenant des échantillons périodiques pour éviter trop de points
        const sampledMetrics = this.sampleMetrics(metrics, 24); // 24 points max
        
        resourceUsageChart = {
          labels: sampledMetrics.map(m => format(m.timestamp, 'HH:mm')),
          cpu: sampledMetrics.map(m => m.cpuUsagePercent),
          memory: sampledMetrics.map(m => m.memoryUsagePercent),
          load: sampledMetrics.map(m => m.loadAverage * 10) // Multiplier par 10 pour une meilleure visualisation
        };
      }
    }
    
    // Préparer les données pour le graphique du statut des workflows
    const workflowStatusChart = {
      labels: ['Complétés', 'En échec', 'En cours'],
      data: [completedWorkflows.length, failedWorkflows.length, inProgressWorkflows.length],
      colors: ['#4CAF50', '#F44336', '#2196F3']
    };
    
    // Préparer les données pour le graphique de complétion quotidienne
    const dailyCompletion = this.getDailyCompletionData(completedWorkflows, startDate, endDate);
    
    return {
      title: title || this.config.reportTitle,
      generatedAt: new Date().toISOString(),
      companyName: this.config.companyName,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalWorkflows: workflows.length,
        completedWorkflows: completedWorkflows.length,
        failedWorkflows: failedWorkflows.length,
        inProgressWorkflows: inProgressWorkflows.length,
        successRate,
        averageDuration
      },
      workflowDetails,
      errors,
      systemMetrics,
      charts: {
        workflowStatus: workflowStatusChart,
        dailyWorkflowCompletion: dailyCompletion,
        resourceUsage: resourceUsageChart
      },
      technicalDetails: this.config.includeTechnicalDetails ? {
        startTimestamp: startDate.getTime(),
        endTimestamp: endDate.getTime(),
        reportGeneratedAt: new Date().getTime(),
        dataCollectionDurationMs: Date.now() - performance.now()
      } : undefined
    };
  }

  /**
   * Récupère les workflows dans une période donnée
   * @param startDate Date de début
   * @param endDate Date de fin
   */
  private async getWorkflowsInPeriod(startDate: Date, endDate: Date): Promise<WorkflowCheckpoint[]> {
    // Cette méthode dépend de l'implémentation de votre CheckpointManager
    // Nous simulons ici une requête pour récupérer les workflows dans une période
    
    try {
      // Récupérer tous les workflows (cette méthode devra être implémentée dans CheckpointManager)
      // const workflows = await this.checkpointManager.getCheckpointsByPeriod(startDate, endDate);
      
      // Pour simuler, nous utilisons une méthode alternative
      const stuckWorkflows = await this.checkpointManager.findStuckWorkflows();
      
      // Filtrer par date si possible
      return stuckWorkflows.filter(wf => {
        // Si pas de date de création, on inclut par défaut
        if (!wf.createdAt) return true;
        
        // Inclure si créé dans la période ou mis à jour dans la période
        return (wf.createdAt >= startDate && wf.createdAt <= endDate) ||
               (wf.updatedAt && wf.updatedAt >= startDate && wf.updatedAt <= endDate);
      });
    } catch (error) {
      this.logger.error('Failed to retrieve workflows for report:', error);
      return [];
    }
  }

  /**
   * Génère un rapport au format HTML
   * @param data Données du rapport
   */
  private async generateHtmlReport(data: ReportData): Promise<string> {
    try {
      // Compiler le template avec Handlebars
      const template = handlebars.compile(this.htmlTemplate);
      const html = template(data);
      
      // Enregistrer dans un fichier
      const filename = `migration-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.html`;
      const outputPath = path.join(this.config.outputDir, filename);
      
      fs.writeFileSync(outputPath, html);
      return outputPath;
    } catch (error) {
      this.logger.error('Failed to generate HTML report:', error);
      throw new Error('HTML report generation failed');
    }
  }

  /**
   * Génère un rapport au format PDF
   * @param data Données du rapport
   */
  private async generatePdfReport(data: ReportData): Promise<string> {
    try {
      if (!this.browser) {
        throw new Error('Puppeteer browser not initialized');
      }
      
      // D'abord, générer le HTML
      const htmlPath = await this.generateHtmlReport(data);
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
      
      // Créer le PDF avec Puppeteer
      const page = await this.browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Configurer le PDF
      const pdfFilename = path.basename(htmlPath).replace('.html', '.pdf');
      const pdfPath = path.join(this.config.outputDir, pdfFilename);
      
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });
      
      await page.close();
      
      return pdfPath;
    } catch (error) {
      this.logger.error('Failed to generate PDF report:', error);
      throw new Error('PDF report generation failed');
    }
  }

  /**
   * Génère un rapport au format JSON
   * @param data Données du rapport
   */
  private async generateJsonReport(data: ReportData): Promise<string> {
    try {
      const filename = `migration-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      const outputPath = path.join(this.config.outputDir, filename);
      
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      return outputPath;
    } catch (error) {
      this.logger.error('Failed to generate JSON report:', error);
      throw new Error('JSON report generation failed');
    }
  }

  /**
   * Arrête le générateur de rapports
   */
  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    this.logger.info('Report generator stopped');
  }

  /**
   * Formatte une durée en secondes en format lisible
   * @param seconds Durée en secondes
   */
  private formatDuration(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${secs}s`;
    
    return result;
  }

  /**
   * Calcule la moyenne d'un tableau de nombres
   * @param arr Tableau de nombres
   */
  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return Math.round((sum / arr.length) * 10) / 10; // Arrondi à 1 décimale
  }

  /**
   * Échantillonne les métriques pour avoir un nombre raisonnable de points
   * @param metrics Métriques complètes
   * @param maxPoints Nombre maximum de points à conserver
   */
  private sampleMetrics(metrics: SystemMetrics[], maxPoints: number): SystemMetrics[] {
    if (metrics.length <= maxPoints) return metrics;
    
    const step = Math.ceil(metrics.length / maxPoints);
    const result: SystemMetrics[] = [];
    
    for (let i = 0; i < metrics.length; i += step) {
      result.push(metrics[i]);
    }
    
    return result;
  }

  /**
   * Calcule le numéro de la semaine dans l'année
   * @param date Date
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Génère les données de complétion quotidienne
   * @param completedWorkflows Workflows complétés
   * @param startDate Date de début
   * @param endDate Date de fin
   */
  private getDailyCompletionData(
    completedWorkflows: WorkflowCheckpoint[],
    startDate: Date,
    endDate: Date
  ): { labels: string[], data: number[] } {
    const result: { labels: string[], data: number[] } = { labels: [], data: [] };
    
    // Créer un tableau des jours dans la période
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Pour chaque jour, compter les workflows complétés ce jour-là
    days.forEach(day => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      
      // Compter les workflows complétés ce jour
      const completedToday = completedWorkflows.filter(w => 
        w.updatedAt && w.updatedAt >= day && w.updatedAt < nextDay
      ).length;
      
      result.labels.push(format(day, 'dd/MM'));
      result.data.push(completedToday);
    });
    
    return result;
  }

  /**
   * Nettoie les anciens rapports selon la politique de rétention
   */
  async cleanupOldReports(): Promise<void> {
    try {
      if (!fs.existsSync(this.config.outputDir)) return;
      
      const files = fs.readdirSync(this.config.outputDir);
      const now = new Date();
      
      files.forEach(file => {
        const filePath = path.join(this.config.outputDir, file);
        const stats = fs.statSync(filePath);
        
        // Vérifier si le fichier est plus ancien que la politique de rétention
        const fileAge = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24); // en jours
        
        if (fileAge > this.config.retention.days) {
          fs.unlinkSync(filePath);
          this.logger.info(`Deleted old report: ${file}`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to cleanup old reports:', error);
    }
  }
}