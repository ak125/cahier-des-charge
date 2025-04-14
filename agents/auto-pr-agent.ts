/**
 * Auto PR Agent - Agent de création automatique de Pull Requests pour les migrations PHP vers Remix
 * 
 * Cet agent crée automatiquement des Pull Requests GitHub après une migration réussie,
 * en incluant un résumé détaillé des changements et des résultats de l'analyse QA.
 */

import { Octokit } from '@octokit/rest';
import { Logger } from '@nestjs/common';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { MCPManifestManager } from './mcp-manifest-manager';
import { createNotifier } from './notifier';

const execAsync = promisify(exec);

// Types
export interface AutoPRConfig {
  github: {
    token: string;
    owner: string;
    repo: string;
    baseBranch: string;
    labels: string[];
    assignees?: string[];
    reviewers?: string[];
    draft?: boolean;
    prTemplate?: string;
  };
  manifest: {
    path: string;
  };
  notifier?: {
    configPath: string;
    enabled: boolean;
  };
  dryRun?: boolean;
}

export interface PRResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  error?: string;
}

/**
 * Agent de création automatique de Pull Requests
 */
export class AutoPRAgent {
  private logger = new Logger('AutoPRAgent');
  private octokit: Octokit;
  private config: AutoPRConfig;
  private manifestManager: MCPManifestManager;
  private notifier: any;
  
  constructor(config: AutoPRConfig) {
    this.config = config;
    
    // Initialiser l'API GitHub
    this.octokit = new Octokit({
      auth: this.config.github.token
    });
    
    // Initialiser le gestionnaire de manifeste
    this.manifestManager = new MCPManifestManager(config.manifest.path);
    
    // Initialiser le notifier si activé
    if (config.notifier && config.notifier.enabled) {
      try {
        const notifierConfig = fs.readJsonSync(config.notifier.configPath);
        this.notifier = createNotifier(notifierConfig);
        this.logger.log('🔌 Notifier initialisé');
      } catch (error: any) {
        this.logger.warn(`⚠️ Impossible d'initialiser le notifier: ${error.message}`);
      }
    }
  }
  
  /**
   * Crée une Pull Request pour une migration spécifique
   */
  public async createPRForMigration(migrationId: string): Promise<PRResult> {
    try {
      // Charger le manifeste
      await this.manifestManager.load();
      
      // Récupérer les informations de la migration
      const migration = this.manifestManager.getMigration(migrationId);
      
      if (!migration) {
        throw new Error(`Migration ${migrationId} non trouvée dans le manifeste`);
      }
      
      // Vérifier si la migration est complétée
      if (migration.status !== 'completed' && migration.status !== 'in_progress') {
        throw new Error(`La migration ${migrationId} n'est pas complétée ou en cours`);
      }
      
      // Extraire les informations nécessaires pour la PR
      const sourceFile = migration.sourceFile;
      const targetFiles = migration.targetFiles;
      
      // Créer une branche pour la PR
      const branchName = await this.createBranch(migrationId, sourceFile);
      
      // Ajouter et commiter les fichiers
      await this.commitFiles(branchName, targetFiles, sourceFile);
      
      // Si c'est un dry run, arrêter ici
      if (this.config.dryRun) {
        this.logger.log(`✅ Mode dry run: branche ${branchName} créée avec les fichiers ajoutés`);
        return { success: true };
      }
      
      // Pousser la branche sur GitHub
      await this.pushBranch(branchName);
      
      // Créer la Pull Request
      const { prNumber, prUrl } = await this.createPR(branchName, migration);
      
      // Mettre à jour le manifeste avec l'URL de la PR
      migration.prUrl = prUrl;
      await this.manifestManager.save();
      
      // Envoyer une notification si le notifier est activé
      if (this.notifier) {
        await this.notifier.notify({
          type: 'pr:created',
          migrationId,
          sourceFile,
          targetFiles,
          status: migration.status,
          qaStatus: migration.qaStatus,
          seoStatus: migration.seoStatus,
          prUrl,
          timestamp: new Date().toISOString(),
          tags: migration.tags
        });
      }
      
      this.logger.log(`✅ Pull Request #${prNumber} créée avec succès: ${prUrl}`);
      
      return {
        success: true,
        prNumber,
        prUrl
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la création de la PR pour la migration ${migrationId}: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Crée une branche Git pour la migration
   */
  private async createBranch(migrationId: string, sourceFile: string): Promise<string> {
    try {
      // Construire un nom de branche basé sur le fichier source et l'ID de migration
      const fileName = path.basename(sourceFile, path.extname(sourceFile));
      const branchName = `migration/${migrationId}/${fileName}`;
      
      // Vérifier si on est déjà sur la branche principale
      const { stdout: currentBranch } = await execAsync('git branch --show-current');
      
      if (currentBranch.trim() !== this.config.github.baseBranch) {
        // Basculer vers la branche principale
        await execAsync(`git checkout ${this.config.github.baseBranch}`);
        this.logger.log(`🔄 Basculé vers la branche ${this.config.github.baseBranch}`);
      }
      
      // Mettre à jour la branche principale
      await execAsync(`git pull origin ${this.config.github.baseBranch}`);
      
      // Vérifier si la branche existe déjà
      const { stdout: branches } = await execAsync('git branch');
      
      if (branches.includes(branchName)) {
        // Supprimer la branche existante
        await execAsync(`git branch -D ${branchName}`);
        this.logger.log(`🗑️ Branche existante ${branchName} supprimée`);
      }
      
      // Créer une nouvelle branche
      await execAsync(`git checkout -b ${branchName}`);
      this.logger.log(`✅ Branche ${branchName} créée`);
      
      return branchName;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la création de la branche: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ajoute et commite les fichiers de la migration
   */
  private async commitFiles(branchName: string, targetFiles: Record<string, string>, sourceFile: string): Promise<void> {
    try {
      // Ajouter tous les fichiers générés
      const filePaths = Object.values(targetFiles);
      
      for (const filePath of filePaths) {
        // Vérifier si le fichier existe
        if (await fs.pathExists(filePath)) {
          await execAsync(`git add "${filePath}"`);
        } else {
          this.logger.warn(`⚠️ Fichier ${filePath} non trouvé, ignoré`);
        }
      }
      
      // Ajouter également le fichier .audit.md s'il existe
      const auditFilePath = sourceFile.replace(/\.php$/, '.audit.md');
      if (await fs.pathExists(auditFilePath)) {
        await execAsync(`git add "${auditFilePath}"`);
      }
      
      // Ajouter également le fichier .qa.md s'il existe
      const qaFilePath = sourceFile.replace(/\.php$/, '.qa.md');
      if (await fs.pathExists(qaFilePath)) {
        await execAsync(`git add "${qaFilePath}"`);
      }
      
      // Créer un message de commit descriptif
      const sourceFileName = path.basename(sourceFile);
      const targetFileNames = Object.values(targetFiles).map(f => path.basename(f));
      
      const commitMessage = `Migration: ${sourceFileName} vers ${targetFileNames.join(', ')}
      
Ce commit contient la migration de ${sourceFileName} vers Remix.

Fichiers générés:
${targetFileNames.map(f => `- ${f}`).join('\n')}

Migration ID: ${branchName.split('/')[1]}
`;
      
      // Commiter les fichiers
      await execAsync(`git commit -m "${commitMessage}"`);
      this.logger.log(`✅ Fichiers commités sur la branche ${branchName}`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors du commit des fichiers: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Pousse la branche sur GitHub
   */
  private async pushBranch(branchName: string): Promise<void> {
    try {
      await execAsync(`git push -u origin ${branchName}`);
      this.logger.log(`✅ Branche ${branchName} poussée sur GitHub`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors du push de la branche: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Crée une Pull Request sur GitHub
   */
  private async createPR(branchName: string, migration: any): Promise<{ prNumber: number; prUrl: string }> {
    try {
      // Préparer le corps de la PR
      let prBody;
      
      // Utiliser un template si disponible
      if (this.config.github.prTemplate) {
        if (await fs.pathExists(this.config.github.prTemplate)) {
          const template = await fs.readFile(this.config.github.prTemplate, 'utf-8');
          prBody = this.formatPRTemplate(template, migration);
        } else {
          this.logger.warn(`⚠️ Template PR non trouvé: ${this.config.github.prTemplate}`);
          prBody = this.generateDefaultPRBody(migration);
        }
      } else {
        prBody = this.generateDefaultPRBody(migration);
      }
      
      // Créer la Pull Request
      const sourceFileName = path.basename(migration.sourceFile);
      const { data } = await this.octokit.pulls.create({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        title: `Migration: ${sourceFileName} vers Remix`,
        body: prBody,
        head: branchName,
        base: this.config.github.baseBranch,
        draft: this.config.github.draft || false
      });
      
      const prNumber = data.number;
      const prUrl = data.html_url;
      
      // Ajouter les labels si configurés
      if (this.config.github.labels && this.config.github.labels.length > 0) {
        await this.octokit.issues.addLabels({
          owner: this.config.github.owner,
          repo: this.config.github.repo,
          issue_number: prNumber,
          labels: this.config.github.labels
        });
      }
      
      // Ajouter les assignés si configurés
      if (this.config.github.assignees && this.config.github.assignees.length > 0) {
        await this.octokit.issues.addAssignees({
          owner: this.config.github.owner,
          repo: this.config.github.repo,
          issue_number: prNumber,
          assignees: this.config.github.assignees
        });
      }
      
      // Ajouter les reviewers si configurés
      if (this.config.github.reviewers && this.config.github.reviewers.length > 0) {
        await this.octokit.pulls.requestReviewers({
          owner: this.config.github.owner,
          repo: this.config.github.repo,
          pull_number: prNumber,
          reviewers: this.config.github.reviewers
        });
      }
      
      return {
        prNumber,
        prUrl
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la création de la PR: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Formate le template de PR avec les informations de la migration
   */
  private formatPRTemplate(template: string, migration: any): string {
    // Remplacer les variables dans le template
    return template
      .replace(/\$\{MIGRATION_ID\}/g, migration.id)
      .replace(/\$\{SOURCE_FILE\}/g, migration.sourceFile)
      .replace(/\$\{SOURCE_FILENAME\}/g, path.basename(migration.sourceFile))
      .replace(/\$\{TARGET_FILES\}/g, Object.values(migration.targetFiles).map((f: string) => `- ${f}`).join('\n'))
      .replace(/\$\{TARGET_FILENAMES\}/g, Object.values(migration.targetFiles).map((f: string) => path.basename(f as string)).join(', '))
      .replace(/\$\{ROUTE\}/g, migration.route || 'N/A')
      .replace(/\$\{QA_STATUS\}/g, migration.qaStatus || 'N/A')
      .replace(/\$\{SEO_STATUS\}/g, migration.seoStatus || 'N/A')
      .replace(/\$\{TAGS\}/g, migration.tags ? migration.tags.join(', ') : 'N/A')
      .replace(/\$\{CREATED_AT\}/g, migration.createdAt || new Date().toISOString())
      .replace(/\$\{COMPLETED_AT\}/g, migration.completedAt || new Date().toISOString());
  }
  
  /**
   * Génère un corps de PR par défaut
   */
  private generateDefaultPRBody(migration: any): string {
    const sourceFileName = path.basename(migration.sourceFile);
    const targetFileNames = Object.values(migration.targetFiles).map((f: string) => path.basename(f as string));
    
    // Déterminer les icônes pour QA et SEO
    let qaIcon = '❔';
    if (migration.qaStatus === 'OK') qaIcon = '✅';
    else if (migration.qaStatus === 'Partial') qaIcon = '⚠️';
    else if (migration.qaStatus === 'Failed') qaIcon = '❌';
    
    let seoIcon = '❔';
    if (migration.seoStatus === 'OK') seoIcon = '✅';
    else if (migration.seoStatus === 'Partial') seoIcon = '⚠️';
    else if (migration.seoStatus === 'Failed') seoIcon = '❌';
    
    return `# Migration PHP vers Remix: ${sourceFileName}

Cette Pull Request contient la migration du fichier PHP \`${sourceFileName}\` vers des composants Remix.

## Fichiers générés

${Object.entries(migration.targetFiles).map(([type, file]) => `- **${type}**: \`${path.basename(file as string)}\``).join('\n')}

## Détails de la migration

- **ID de migration**: ${migration.id}
- **Fichier source**: \`${sourceFileName}\`
- **Route**: ${migration.route || 'N/A'}
- **QA**: ${qaIcon} ${migration.qaStatus || 'Non analysé'}
- **SEO**: ${seoIcon} ${migration.seoStatus || 'Non analysé'}
${migration.tags ? `- **Tags**: ${migration.tags.join(', ')}` : ''}

## Étapes de vérification

${migration.verificationSteps ? 
  migration.verificationSteps.map((step: any) => {
    let icon = '❔';
    if (step.status === 'passed') icon = '✅';
    else if (step.status === 'partial') icon = '⚠️';
    else if (step.status === 'failed') icon = '❌';
    
    let details = '';
    if (step.score !== undefined) details = ` (Score: ${step.score}/100)`;
    if (step.error) details = ` (Erreur: ${step.error})`;
    
    return `- ${icon} **${step.name}**: ${step.status}${details}`;
  }).join('\n') 
  : '- ❔ Aucune étape de vérification effectuée'
}

## Notes

Cette PR a été générée automatiquement par l'agent de création de PR du système MCP (Model Context Protocol).

Veuillez vérifier et valider les fichiers générés avant de fusionner.`;
  }
  
  /**
   * Vérifie si une PR existe déjà pour une migration
   */
  public async checkExistingPR(migrationId: string): Promise<string | null> {
    try {
      // Charger le manifeste
      await this.manifestManager.load();
      
      // Récupérer les informations de la migration
      const migration = this.manifestManager.getMigration(migrationId);
      
      if (!migration) {
        throw new Error(`Migration ${migrationId} non trouvée dans le manifeste`);
      }
      
      // Si l'URL de PR est déjà dans le manifeste, la retourner
      if (migration.prUrl) {
        return migration.prUrl;
      }
      
      // Rechercher les PRs qui pourraient correspondre à cette migration
      const { data: pulls } = await this.octokit.pulls.list({
        owner: this.config.github.owner,
        repo: this.config.github.repo,
        state: 'open',
        head: `${this.config.github.owner}:migration/${migrationId}`
      });
      
      if (pulls.length > 0) {
        // Mettre à jour le manifeste avec l'URL trouvée
        migration.prUrl = pulls[0].html_url;
        await this.manifestManager.save();
        
        return pulls[0].html_url;
      }
      
      return null;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la vérification des PR existantes: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Crée un agent PR avec la configuration spécifiée
 */
export function createAutoPRAgent(config: AutoPRConfig): AutoPRAgent {
  return new AutoPRAgent(config);
}

// Exécution autonome si appelé directement
if (require.main === module) {
  const configPath = process.argv[2] || path.join(process.cwd(), 'config', 'auto-pr.json');
  const migrationId = process.argv[3];
  
  if (!migrationId) {
    console.error('❌ Usage: ts-node auto-pr-agent.ts [config-path] <migration-id>');
    process.exit(1);
  }
  
  console.log(`📋 Chargement de la configuration depuis ${configPath}`);
  
  try {
    const config = fs.readJsonSync(configPath);
    const agent = createAutoPRAgent(config);
    
    console.log(`🚀 Création de PR pour la migration ${migrationId}`);
    
    agent.createPRForMigration(migrationId)
      .then(result => {
        if (result.success) {
          console.log(`✅ PR #${result.prNumber} créée avec succès: ${result.prUrl}`);
          process.exit(0);
        } else {
          console.error(`❌ Échec de la création de PR: ${result.error}`);
          process.exit(1);
        }
      })
      .catch(error => {
        console.error(`❌ Erreur: ${error.message}`);
        process.exit(1);
      });
  } catch (error: any) {
    console.error(`❌ Erreur lors du chargement de la configuration: ${error.message}`);
    process.exit(1);
  }
}