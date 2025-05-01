import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import { parse as parseMarkdown } from 'marked';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';

import { DocumentUpdater } from '../documentation/document-updater.service';
import {
  ObsolescenceAlert,
  Technology,
  TechnologyAssessment,
  TechnologyStatus
} from './interfaces';

@Injectable()
export class ObsolescenceDetectorService {
  private readonly logger = new Logger(ObsolescenceDetectorService.name);
  private readonly cdcDir: string;
  private readonly npmRegistry: string;
  private readonlyDoDoDoDoDoDotgithubApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly documentUpdater: DocumentUpdater,
    @InjectModel('Technology') private _technologyModel: Model<Technology>
  ) {
    this.cdcDir = this.configService.get<string>('CDC_DIRECTORY', 'cahier-des-charges');
    this.npmRegistry = 'https://registry.npmjs.org';
    thisDoDoDoDoDoDotgithubApiUrl = 'https://apiDoDoDoDoDoDotgithub.com';
  }

  /**
   * Analyse programmée des technologies - une fois par semaine
   */
  @Cron('0 0 * * 0')
  async scheduledTechnologyAnalysis() {
    this.logger.log('Démarrage de l\'analyse programmée des technologies');
    await this.detectObsoleteTechnologies();
  }

  /**
   * Analyse manuelle des technologies
   */
  async detectObsoleteTechnologies(): Promise<ObsolescenceAlert[]> {
    // 1. Extraire les technologies du cahier des charges
    const technologies = await this.extractTechnologiesFromDocs();
    
    // 2. Analyser chaque technologie
    const assessments: TechnologyAssessment[] = [];
    const alerts: ObsolescenceAlert[] = [];
    
    for (const tech of technologies) {
      try {
        const assessment = await this.assessTechnology(tech);
        assessments.push(assessment);
        
        // Créer une alerte si score d'obsolescence élevé
        if (assessment.obsolescenceScore >= 50) {
          const alert: ObsolescenceAlert = {
            technology: tech.name,
            score: assessment.obsolescenceScore,
            lastUpdate: assessment.lastUpdate,
            alternatives: assessment.alternatives,
            affectedSections: tech.sections,
            status: this.determineAlertStatus(assessment.obsolescenceScore),
            recommendation: this.generateRecommendation(assessment)
          };
          
          alerts.push(alert);
        }
        
        // Mettre à jour la base de données
        await this.technologyModel.findOneAndUpdate(
          { name: tech.name },
          { 
            ...tech, 
            lastAssessment: new Date(),
            currentStatus: this.mapScoreToStatus(assessment.obsolescenceScore),
            obsolescenceScore: assessment.obsolescenceScore,
            alternatives: assessment.alternatives
          },
          { upsert: true }
        );
      } catch (error) {
        this.logger.error(`Erreur lors de l'analyse de ${tech.name}: ${error.message}`);
      }
    }
    
    // 3. Traiter les alertes critiques
    for (const alert of alerts.filter(a => a.status === 'critical')) {
      await this.processObsolescenceAlert(alert);
    }
    
    this.logger.log(`Analyse terminée: ${alerts.length} alertes générées`);
    
    return alerts;
  }
  
  /**
   * Extraire les technologies mentionnées dans la documentation
   */
  private async extractTechnologiesFromDocs(): Promise<Technology[]> {
    const technologies: Map<string, Technology> = new Map();
    
    // Parcourir tous les fichiers markdown du cahier des charges
    const files = await this.getMarkdownFiles();
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Extraire les technologies mentionnées
      const techs = this.extractTechnologiesFromContent(content);
      
      for (const tech of techs) {
        const existing = technologies.get(tech.name);
        
        if (existing) {
          // Fusionner les sections
          existing.sections.push(...tech.sections.filter(s => !existing.sections.includes(s)));
          technologies.set(tech.name, existing);
        } else {
          tech.sections = [path.relative(this.cdcDir, file)];
          technologies.set(tech.name, tech);
        }
      }
    }
    
    return Array.from(technologies.values());
  }
  
  /**
   * Extraire les technologies d'un fichier markdown
   */
  private extractTechnologiesFromContent(content: string): Technology[] {
    const technologies: Technology[] = [];
    
    // Rechercher les technologies connues
    const knownTechs = [
      { name: 'React', pattern: /\breact\b/i, category: 'framework' },
      { name: 'Angular', pattern: /\bangular\b/i, category: 'framework' },
      { name: 'Vue', pattern: /\bvue\.?js\b/i, category: 'framework' },
      { name: 'NestJS', pattern: /\bnest\.?js\b/i, category: 'framework' },
      { name: 'Express', pattern: /\bexpress\.?js\b/i, category: 'framework' },
      { name: 'Remix', pattern: /\bremix\b/i, category: 'framework' },
      { name: 'TypeScript', pattern: /\btypescript\b/i, category: 'language' },
      { name: 'MongoDB', pattern: /\bmongodb\b/i, category: 'database' },
      { name: 'PostgreSQL', pattern: /\bpostgre(?:s|sql)\b/i, category: 'database' },
      { name: 'MySQL', pattern: /\bmysql\b/i, category: 'database' },
      { name: 'Redis', pattern: /\bredis\b/i, category: 'database' },
      { name: 'Docker', pattern: /\bdocker\b/i, category: 'infrastructure' },
      { name: 'Kubernetes', pattern: /\bkubernetes\b|\bk8s\b/i, category: 'infrastructure' },
      { name: 'Webpack', pattern: /\bwebpack\b/i, category: 'tool' },
      { name: 'Jest', pattern: /\bjest\b/i, category: 'testing' },
      { name: 'Cypress', pattern: /\bcypress\b/i, category: 'testing' },
    ];
    
    // Rechercher les patterns dans le contenu
    for (const tech of knownTechs) {
      if (tech.pattern.test(content)) {
        // Extraire la version si disponible
        const versionMatch = content.match(new RegExp(`${tech.name}\\s+([0-9]+(?:\\.[0-9]+)*)`));
        const version = versionMatch ? versionMatch[1] : null;
        
        technologies.push({
          name: tech.name,
          category: tech.category,
          version,
          sections: [],
          mentions: (content.match(tech.pattern) || []).length
        });
      }
    }
    
    return technologies;
  }
  
  /**
   * Obtenir tous les fichiers markdown du cahier des charges
   */
  private async getMarkdownFiles(): Promise<string[]> {
    const files: string[] = [];
    
    async function scanDir(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    await scanDir(this.cdcDir);
    return files;
  }
  
  /**
   * Évaluer l'obsolescence d'une technologie
   */
  private async assessTechnology(tech: Technology): Promise<TechnologyAssessment> {
    // Rechercher des informations sur npm si applicable
    let npmInfo = null;
    try {
      npmInfo = await this.getNpmInfo(tech.name.toLowerCase());
    } catch (error) {
      this.logger.debug(`Pas d'infos npm pour ${tech.name}: ${error.message}`);
    }
    
    // Rechercher des informations sur GitHub si applicable
    letDoDoDoDoDoDotgithubInfo = null;
    try {
     DoDoDoDoDoDotgithubInfo = await this.getGithubInfo(tech.name);
    } catch (error) {
      this.logger.debug(`Pas d'infos GitHub pour ${tech.name}: ${error.message}`);
    }
    
    // Calculer le score d'obsolescence
    let obsolescenceScore = 0;
    let lastUpdate = new Date();
    let communityActivity = 100;
    let securityIssues = 0;
    
    // Facteur 1: Dernière mise à jour
    if (npmInfo?.time?.modified) {
      const lastModified = new Date(npmInfo.time.modified);
      lastUpdate = lastModified;
      const daysSinceUpdate = Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24));
      obsolescenceScore += Math.min(daysSinceUpdate / 365 * 25, 25);
    } else if DoDoDoDoDoDotgithubInfo?.updated_at) {
      const lastModified = new DateDoDoDoDoDoDotgithubInfo.updated_at);
      lastUpdate = lastModified;
      const daysSinceUpdate = Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24));
      obsolescenceScore += Math.min(daysSinceUpdate / 365 * 25, 25);
    } else {
      // Pas d'information récente, considérer comme potentiellement obsolète
      obsolescenceScore += 15;
    }
    
    // Facteur 2: Activité communautaire
    if DoDoDoDoDoDotgithubInfo) {
      // Calculer un score d'activité basé sur stars, forks, issues, etc.
      const activityScore = (
        Math.minDoDoDoDoDoDotgithubInfo.stargazers_count / 1000, 10) +
        Math.minDoDoDoDoDoDotgithubInfo.forks / 500, 10) +
        DoDoDoDoDoDotgithubInfo.open_issues_count < 50 ? 10 : 5)
      ) / 3;
      
      communityActivity = activityScore * 10;
      obsolescenceScore += (100 - communityActivity) / 4;
    } else if (npmInfo) {
      // Estimer l'activité à partir des téléchargements npm
      const monthlyDownloads = npmInfo.downloads || 0;
      communityActivity = Math.min(monthlyDownloads / 10000, 100);
      obsolescenceScore += (100 - communityActivity) / 4;
    } else {
      // Pas d'info communautaire, score moyen
      communityActivity = 50;
      obsolescenceScore += 12.5;
    }
    
    // Facteur 3: Vulnérabilités non corrigées (simulé)
    securityIssues = await this.getSecurityIssueCount(tech.name);
    obsolescenceScore += Math.min(securityIssues * 5, 25);
    
    // Facteur 4: Alternatives viables
    const alternatives = await this.findAlternatives(tech.name, tech.category);
    obsolescenceScore += alternatives.length > 0 ? 25 : 0;
    
    return {
      name: tech.name,
      category: tech.category,
      currentVersion: tech.version,
      lastUpdate,
      communityActivity,
      securityScore: 100 - Math.min(securityIssues * 5, 25) * 4,
      alternatives,
      obsolescenceScore
    };
  }
  
  /**
   * Traiter une alerte d'obsolescence
   */
  private async processObsolescenceAlert(alert: ObsolescenceAlert): Promise<void> {
    this.logger.log(`Traitement de l'alerte pour ${alert.technology} (score: ${alert.score})`);
    
    for (const section of alert.affectedSections) {
      const filePath = path.join(this.cdcDir, section);
      
      try {
        // Lire le contenu actuel
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Ajouter le marqueur d'obsolescence s'il n'existe pas déjà
        if (!content.includes("[!OBSOLESCENCE]") && !content.includes("technology-status: obsolete")) {
          const warningBox = this.generateObsolescenceWarning(alert);
          
          // Trouver la première occurrence de la technologie
          const techRegex = new RegExp(`\\b${alert.technology}\\b`, 'i');
          const match = content.match(techRegex);
          
          if (match) {
            // Insérer le marqueur avant la section contenant la technologie
            const sectionStart = content.lastIndexOf('#', match.index);
            
            if (sectionStart !== -1) {
              const updatedContent = 
                `${content.substring(0, sectionStart) +
                warningBox}\n\n${content.substring(sectionStart)}`;
              
              // Mettre à jour le fichier
              await fs.writeFile(filePath, updatedContent, 'utf-8');
              this.logger.log(`Marqueur d'obsolescence ajouté pour ${alert.technology} dans ${section}`);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Erreur lors du traitement du fichier ${section}: ${error.message}`);
      }
    }
  }
  
  /**
   * Générer un avertissement d'obsolescence
   */
  private generateObsolescenceWarning(alert: ObsolescenceAlert): string {
    const alternativesText = alert.alternatives.length > 0
      ? `\n> **Alternatives recommandées:** ${alert.alternatives.join(', ')}`
      : '';
    
    return `
> [!OBSOLESCENCE]
> **${alert.technology}** est considéré comme ${this.mapStatusToLabel(alert.status)}.
> 
> **Score d'obsolescence:** ${alert.score}/100
> **Dernière mise à jour:** ${alert.lastUpdate.toLocaleDateString()}${alternativesText}
> 
> ${alert.recommendation}
`;
  }
  
  /**
   * Trouver des alternatives à une technologie
   */
  private async findAlternatives(name: string, _category: string): Promise<string[]> {
    // Mapping des alternatives connues
    const alternativesMap = {
      Express: ['Fastify', 'NestJS', 'Koa'],
      'Moment.js': ['Day.js', 'date-fns', 'Luxon'],
      jQuery: ['Vanilla JS', 'React', 'Vue'],
      Redux: ['Zustand', 'MobX', 'Recoil'],
      Webpack: ['Vite', 'Parcel', 'esbuild'],
      MongoDB: ['PostgreSQL', 'MySQL', 'SQLite'],
      MySQL: ['PostgreSQL', 'MariaDB'],
      Enzyme: ['React Testing Library', 'Vitest'],
      CoffeeScript: ['TypeScript', 'JavaScript'],
      Bower: ['npm', 'Yarn', 'pnpm'],
      Grunt: ['Webpack', 'npm scripts', 'Vite'],
      Gulp: ['npm scripts', 'Webpack', 'Vite'],
    };
    
    return alternativesMap[name] || [];
  }
  
  /**
   * Obtenir le nombre de problèmes de sécurité
   */
  private async getSecurityIssueCount(name: string): Promise<number> {
    // Simuler un service de vulnérabilités
    // Dans une implémentation réelle, cela interrogerait une API comme Snyk ou GitHub Security Advisories
    const securityIssuesMap = {
      'Express 4': 2,
      'Moment.js': 3,
      jQuery: 5,
      Lodash: 1,
      'Webpack 4': 2
    };
    
    return securityIssuesMap[name] || 0;
  }
  
  /**
   * Obtenir les informations npm pour un package
   */
  private async getNpmInfo(packageName: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.npmRegistry}/${packageName}`)
      );
      
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des informations npm: ${error.message}`);
    }
  }
  
  /**
   * Obtenir les informations GitHub pour un projet
   */
  private async getGithubInfo(repoName: string): Promise<any> {
    constDoDoDoDoDoDotgithubToken = this.configService.get('GITHUB_TOKEN');
    
    try {
      const headers =DoDoDoDoDoDotgithubToken 
        ? { Authorization: "token $DoDoDoDoDoDotgithubToken}" }
        : {};
      
      const response = await firstValueFrom(
        this.httpService.get(`${thisDoDoDoDoDoDotgithubApiUrl}/search/repositories?q=${repoName}`, { headers })
      );
      
      if (response.data.items && response.data.items.length > 0) {
        // Prendre le premier résultat le plus pertinent
        return response.data.items[0];
      }
      
      throw new Error('Aucun dépôt trouvé');
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des informations GitHub: ${error.message}`);
    }
  }
  
  /**
   * Déterminer le statut d'une alerte en fonction du score
   */
  private determineAlertStatus(score: number): 'info' | 'warning' | 'critical' {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'warning';
    return 'info';
  }
  
  /**
   * Générer une recommandation basée sur l'évaluation
   */
  private generateRecommendation(assessment: TechnologyAssessment): string {
    const { obsolescenceScore, alternatives } = assessment;
    
    if (obsolescenceScore >= 75) {
      return alternatives.length > 0
        ? `**Action recommandée:** Migration urgente vers ${alternatives[0]}.`
        : "**Action recommandée:** Réévaluation immédiate de cette technologie.";
    }
    
    if (obsolescenceScore >= 50) {
      return alternatives.length > 0
        ? `**Action recommandée:** Planifier la migration vers ${alternatives[0]}.`
        : "**Action recommandée:** Surveiller cette technologie de près.";
    }
    
    return "**Action recommandée:** Mettre à jour régulièrement.";
  }
  
  /**
   * Convertir un score en statut technologique
   */
  private mapScoreToStatus(score: number): TechnologyStatus {
    if (score >= 75) return 'obsolete';
    if (score >= 50) return 'declining';
    if (score >= 25) return 'mature';
    return 'adopted';
  }
  
  /**
   * Convertir un statut en libellé français
   */
  private mapStatusToLabel(status: string): string {
    switch (status) {
      case 'critical': return 'obsolète';
      case 'warning': return 'en déclin';
      case 'info': return 'à surveiller';
      default: return 'à surveiller';
    }
  }
}
