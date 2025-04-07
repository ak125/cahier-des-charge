import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as glob from 'glob';
import { promisify } from 'util';

import { DocumentAnalyzer } from './analyzers/document-analyzer';
import { CodeAnalyzer } from './analyzers/code-analyzer';
import { ModelComparator } from './comparators/model-comparator';
import { MismatchReporter } from './reporters/mismatch-reporter';
import { NotificationService } from '../notification/notification.service';

import {
  MismatchResult,
  MismatchReport,
  MismatchRecord,
  DocumentModel,
  CodeModel
} from './interfaces';

const globPromise = promisify(glob);

@Injectable()
export class MismatchTrackerService {
  private readonly logger = new Logger(MismatchTrackerService.name);
  private readonly cdcDir: string;
  private readonly srcDir: string;
  private readonly reportDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly documentAnalyzer: DocumentAnalyzer,
    private readonly codeAnalyzer: CodeAnalyzer,
    private readonly modelComparator: ModelComparator,
    private readonly mismatchReporter: MismatchReporter,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel('MismatchRecord') private mismatchModel: Model<MismatchRecord>
  ) {
    this.cdcDir = this.configService.get<string>('CDC_DIRECTORY', 'cahier-des-charges');
    this.srcDir = this.configService.get<string>('SOURCE_DIRECTORY', 'src');
    this.reportDir = this.configService.get<string>('REPORT_DIRECTORY', 'reports');
  }

  /**
   * Détection programmée des incohérences - quotidienne
   */
  @Cron('0 2 * * *')  // À 2h du matin tous les jours
  async scheduledMismatchDetection() {
    this.logger.log('Démarrage de la détection programmée des incohérences');
    await this.detectMismatches();
  }

  /**
   * Détecte les incohérences entre la documentation et le code
   */
  async detectMismatches(): Promise<MismatchReport> {
    try {
      this.logger.log('Démarrage de l\'analyse des incohérences');
      
      // 1. Identifier les fichiers à analyser
      const docFiles = await globPromise(`${this.cdcDir}/**/*.md`);
      const srcFiles = await globPromise(`${this.srcDir}/**/*.{ts,js}`);
      
      this.logger.debug(`Analyse de ${docFiles.length} fichiers de documentation et ${srcFiles.length} fichiers de code`);
      
      // 2. Extraire les modèles
      const docModels = await this.documentAnalyzer.extractModels(docFiles);
      const codeModels = await this.codeAnalyzer.extractModels(srcFiles);
      
      // 3. Comparer les modèles
      const mismatches = await this.modelComparator.compare(docModels, codeModels);
      
      // 4. Générer le rapport
      const report = this.mismatchReporter.generateReport(mismatches);
      
      // 5. Sauvegarder le rapport
      await this.saveReport(report);
      
      // 6. Enregistrer les incohérences dans la base de données
      await this.saveMismatchesToDatabase(report.mismatches);
      
      // 7. Notifier les équipes concernées
      this.notifyTeams(report);
      
      // 8. Émettre un événement pour les autres services
      this.eventEmitter.emit('mismatches.detected', {
        count: report.summary.total,
        critical: report.summary.bySeverity.critical,
        report: report
      });
      
      return report;
    } catch (error) {
      this.logger.error(`Erreur lors de la détection des incohérences: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sauvegarde le rapport d'incohérences
   */
  private async saveReport(report: MismatchReport): Promise<void> {
    // Créer le répertoire de rapports s'il n'existe pas
    await fs.mkdir(this.reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(this.reportDir, `mismatches-${timestamp}.json`);
    const htmlPath = path.join(this.reportDir, `mismatches-${timestamp}.html`);
    
    // Sauvegarder en JSON
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    
    // Générer et sauvegarder en HTML
    const htmlReport = this.mismatchReporter.generateHtmlReport(report);
    await fs.writeFile(htmlPath, htmlReport, 'utf8');
    
    this.logger.log(`Rapport sauvegardé: ${jsonPath} et ${htmlPath}`);
  }
  
  /**
   * Enregistre les incohérences dans la base de données
   */
  private async saveMismatchesToDatabase(mismatches: MismatchResult[]): Promise<void> {
    // Pour chaque incohérence détectée
    for (const mismatch of mismatches) {
      // Vérifier si cette incohérence existe déjà
      const existingMismatch = await this.mismatchModel.findOne({ 
        'details.documentPath': mismatch.details.documentPath,
        'details.codePath': mismatch.details.codePath,
        'type': mismatch.type,
        'status': { $ne: 'resolved' }
      });
      
      if (existingMismatch) {
        // Mettre à jour l'incohérence existante
        await this.mismatchModel.updateOne(
          { _id: existingMismatch._id },
          { 
            $set: {
              severity: mismatch.severity,
              details: mismatch.details,
              suggestedFix: mismatch.suggestedFix,
              lastDetected: new Date()
            }
          }
        );
      } else {
        // Créer une nouvelle entrée
        await this.mismatchModel.create({
          ...mismatch,
          id: `MISM-${Date.now().toString(36)}`,
          detectedAt: new Date(),
          lastDetected: new Date(),
          status: 'open'
        });
      }
    }
    
    this.logger.log(`${mismatches.length} incohérences enregistrées dans la base de données`);
  }
  
  /**
   * Notifie les équipes concernées
   */
  private notifyTeams(report: MismatchReport): void {
    const { critical, high } = report.summary.bySeverity;
    
    // Notifier uniquement s'il y a des problèmes critiques ou importants
    if (critical > 0 || high > 0) {
      this.logger.log(`Notification des équipes: ${critical} critiques, ${high} importantes`);
      
      // Regrouper par équipe/composant
      const teamMismatches = this.groupMismatchesByTeam(report.mismatches);
      
      // Notifier chaque équipe
      for (const [team, teamReport] of Object.entries(teamMismatches)) {
        const criticalCount = teamReport.filter(m => m.severity === 'critical').length;
        const highCount = teamReport.filter(m => m.severity === 'high').length;
        
        if (criticalCount > 0) {
          this.notificationService.sendNotification({
            channel: 'slack',
            recipient: `#${team}-alerts`,
            subject: `🚨 ${criticalCount} incohérences critiques détectées`,
            message: this.formatTeamNotification(team, teamReport),
            priority: 'high'
          });
        } else if (highCount > 0) {
          this.notificationService.sendNotification({
            channel: 'slack',
            recipient: `#${team}`,
            subject: `⚠️ ${highCount} incohérences importantes détectées`,
            message: this.formatTeamNotification(team, teamReport),
            priority: 'medium'
          });
        }
      }
    }
  }
  
  /**
   * Regroupe les incohérences par équipe
   */
  private groupMismatchesByTeam(mismatches: MismatchResult[]): Record<string, MismatchResult[]> {
    const teamMismatches: Record<string, MismatchResult[]> = {};
    
    // Extraire l'équipe depuis le chemin du fichier ou le composant
    for (const mismatch of mismatches) {
      const team = this.determineResponsibleTeam(mismatch);
      
      if (!teamMismatches[team]) {
        teamMismatches[team] = [];
      }
      
      teamMismatches[team].push(mismatch);
    }
    
    return teamMismatches;
  }
  
  /**
   * Détermine l'équipe responsable d'une incohérence
   */
  private determineResponsibleTeam(mismatch: MismatchResult): string {
    // Version simplifiée - en production, utilisez une cartographie plus sophistiquée
    const pathSegments = mismatch.details.codePath.split('/');
    
    // Chercher un segment qui correspond à un composant ou module
    const moduleIndex = Math.max(
      pathSegments.indexOf('modules'),
      pathSegments.indexOf('components'),
      pathSegments.indexOf('services')
    );
    
    if (moduleIndex >= 0 && moduleIndex < pathSegments.length - 1) {
      return pathSegments[moduleIndex + 1];
    }
    
    // Fallback sur un nom de composant trouvé dans le chemin
    const knownComponents = ['auth', 'user', 'product', 'cart', 'payment', 'order', 'admin'];
    for (const component of knownComponents) {
      if (mismatch.details.codePath.includes(component)) {
        return component;
      }
    }
    
    return 'core';  // Équipe par défaut
  }
  
  /**
   * Formate une notification pour une équipe
   */
  private formatTeamNotification(team: string, mismatches: MismatchResult[]): string {
    const criticalMismatches = mismatches.filter(m => m.severity === 'critical');
    const highMismatches = mismatches.filter(m => m.severity === 'high');
    
    let message = `*Incohérences détectées pour l'équipe ${team}*\n\n`;
    
    if (criticalMismatches.length > 0) {
      message += `🚨 *${criticalMismatches.length} incohérences critiques*:\n`;
      criticalMismatches.slice(0, 5).forEach(m => {
        message += `- \`${m.details.codePath}\`: ${m.description}\n`;
      });
      if (criticalMismatches.length > 5) {
        message += `- ... et ${criticalMismatches.length - 5} autres\n`;
      }
      message += '\n';
    }
    
    if (highMismatches.length > 0) {
      message += `⚠️ *${highMismatches.length} incohérences importantes*:\n`;
      highMismatches.slice(0, 3).forEach(m => {
        message += `- \`${m.details.codePath}\`: ${m.description}\n`;
      });
      if (highMismatches.length > 3) {
        message += `- ... et ${highMismatches.length - 3} autres\n`;
      }
    }
    
    message += `\nVoir le rapport complet: ${this.configService.get('APP_URL')}/admin/mismatches?team=${team}`;
    
    return message;
  }

  /**
   * Obtient les incohérences non résolues
   */
  async getOpenMismatches(filter?: Record<string, any>): Promise<MismatchRecord[]> {
    const query = { status: { $ne: 'resolved' }, ...filter };
    return this.mismatchModel.find(query).sort({ severity: 1, detectedAt: -1 });
  }

  /**
   * Marque une incohérence comme résolue
   */
  async resolveMismatch(mismatchId: string, resolution: {
    resolvedBy: string;
    resolution: 'documentation_updated' | 'code_updated' | 'false_positive';
    comment: string;
  }): Promise<MismatchRecord> {
    const mismatch = await this.mismatchModel.findOne({ id: mismatchId });
    
    if (!mismatch) {
      throw new Error(`Incohérence non trouvée: ${mismatchId}`);
    }
    
    mismatch.status = 'resolved';
    mismatch.resolution = resolution;
    mismatch.resolvedAt = new Date();
    
    await mismatch.save();
    
    this.logger.log(`Incohérence ${mismatchId} marquée comme résolue par ${resolution.resolvedBy}`);
    
    // Émettre un événement
    this.eventEmitter.emit('mismatches.resolved', {
      mismatchId,
      resolution
    });
    
    return mismatch;
  }
}
