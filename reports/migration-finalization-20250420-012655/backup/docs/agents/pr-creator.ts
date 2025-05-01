/**
 * Agent pr-creator.ts
 * Crée automatiquement des Pull Requests sur GitHub à la fin d'une migration MCP
 */

import { execSync } from 'child_process';
import path from 'path';
import { Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import fs from 'fs-extra';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


// Configuration
interface PullRequestConfig {
  owner: string;
  repo: string;
  base?: string;
  reviewers?: string[];
  labels?: string[];
  draftPR?: boolean;
}

interface FileData {
  path: string;
  absolutePath: string;
  content?: string;
}

interface JobContext {
  file: string;
  target: string;
  generatedFiles: FileData[];
  summary?: string;
  migrationId?: string;
  metadata?: Record<string, any>;
}

export class PRCreator implements BaseAgent, BusinessAgent {
  private readonly logger = new Logger('PRCreator');
  private octokit: Octokit;
  private config: PullRequestConfig;

  constructorDoDoDoDoDoDotgithubToken: string, config: PullRequestConfig) {
    this.octokit = new Octokit({ auth:DoDoDoDoDoDotgithubToken });
    this.config = {
      base: 'main',
      draftPR: false,
      ...config
    };
  }

  /**
   * Crée une Pull Request à partir des fichiers générés par MCP
   */
  async createPullRequest(context: JobContext): Promise<string> {
    try {
      this.logger.log(`🚀 Création d'une PR pour la migration: ${context.file} → ${context.target}`);
      
      // 1. Générer un nom de branche unique
      const branch = this.generateBranchName(context);
      
      // 2. Créer une branche locale
      this.logger.log(`📁 Création de la branche locale: ${branch}`);
      this.createLocalBranch(branch);
      
      // 3. Ajouter les fichiers à la branche
      this.logger.log(`📝 Ajout des fichiers à la branche`);
      await this.addFilesToBranch(branch, context.generatedFiles);
      
      // 4. Pusher la branche vers GitHub
      this.logger.log(`📤 Push de la branche vers GitHub`);
      this.pushBranchToGitHub(branch);
      
      // 5. Générer le titre et la description de la PR
      const title = this.generatePRTitle(context);
      const body = this.generatePRDescription(context);
      
      // 6. Créer la PR sur GitHub
      this.logger.log(`📬 Création de la Pull Request sur GitHub`);
      const pr = await this.createGitHubPR(branch, title, body);
      
      // 7. Ajouter des reviewers et labels (si spécifiés)
      if (this.config.reviewers?.length || this.config.labels?.length) {
        this.logger.log(`🏷️ Ajout des reviewers et labels à la PR`);
        await this.addReviewersAndLabels(pr.number);
      }
      
      this.logger.log(`✅ Pull Request créée avec succès: ${pr.html_url}`);
      return pr.html_url;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la création de la PR: ${error.message}`);
      throw new Error(`Échec de la création de la PR: ${error.message}`);
    }
  }

  /**
   * Génère un nom de branche basé sur le fichier migré
   */
  private generateBranchName(context: JobContext): string {
    const timestamp = Date.now();
    const fileName = path.basename(context.file, path.extname(context.file));
    const sanitizedName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return `migration/${sanitizedName}-to-tsx-${timestamp}`;
  }

  /**
   * Crée une branche locale
   */
  private createLocalBranch(branch: string): void {
    try {
      // S'assurer d'être sur la branche de base
      execSync(DoDoDoDotgit checkout ${this.config.base}`, { stdio: 'inherit' });
      execSync(DoDoDoDotgit pull origin ${this.config.base}`, { stdio: 'inherit' });
      
      // Créer et basculer sur la nouvelle branche
      execSync(DoDoDoDotgit checkout -b ${branch}`, { stdio: 'inherit' });
    } catch (error) {
      this.logger.error(`❌ Erreur Git: ${error.message}`);
      throw new Error(`Échec de la création de la branche locale: ${error.message}`);
    }
  }

  /**
   * Ajoute les fichiers générés à la branche
   */
  private async addFilesToBranch(branch: string, files: FileData[]): Promise<void> {
    try {
      for (const file of files) {
        // S'assurer que le répertoire existe
        await fs.ensureDir(path.dirname(file.path));
        
        // Écrire le contenu du fichier
        if (file.content) {
          await fs.writeFile(file.path, file.content, 'utf-8');
        } else if (file.absolutePath) {
          if (fs.existsSync(file.absolutePath)) {
            await fs.copy(file.absolutePath, file.path);
          } else {
            this.logger.warn(`⚠️ Fichier source introuvable: ${file.absolutePath}`);
          }
        } else {
          this.logger.warn(`⚠️ Ni contenu ni chemin absolu fourni pour le fichier: ${file.path}`);
        }
      }
      
      // Ajouter tous les fichiers au staging
      execSync(DoDoDoDotgit add .', { stdio: 'inherit' });
      
      // Créer un commit
      execSync(DoDoDoDotgit commit -m "Migration: Fichiers générés par MCP"`, { stdio: 'inherit' });
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'ajout des fichiers: ${error.message}`);
      throw new Error(`Échec de l'ajout des fichiers à la branche: ${error.message}`);
    }
  }

  /**
   * Pousse la branche vers GitHub
   */
  private pushBranchToGitHub(branch: string): void {
    try {
      execSync(DoDoDoDotgit push -u origin ${branch}`, { stdio: 'inherit' });
    } catch (error) {
      this.logger.error(`❌ Erreur push: ${error.message}`);
      throw new Error(`Échec du push vers GitHub: ${error.message}`);
    }
  }

  /**
   * Génère le titre de la Pull Request
   */
  private generatePRTitle(context: JobContext): string {
    return `MIGRATION: ${context.file} → ${context.target}`;
  }

  /**
   * Génère la description de la Pull Request
   */
  private generatePRDescription(context: JobContext): string {
    // Récupérer la liste des fichiers par type
    const routeFiles = context.generatedFiles.filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.loader.ts') || f.path.endsWith('.meta.ts'));
    const docFiles = context.generatedFiles.filter(f => f.path.endsWith('.audit.md') || f.path.endsWith('.final.md') || f.path.endsWith('.verification_report.json'));
    const testFiles = context.generatedFiles.filter(f => f.path.endsWith('.test.ts'));
    
    // Construire la description
    let description = `## 🔄 Migration automatisée via MCP\n\n`;
    description += `### 📁 Fichier original\n\`${context.file}\`\n\n`;
    
    if (context.summary) {
      description += `### 📝 Résumé\n${context.summary}\n\n`;
    }
    
    description += `### 📊 Fichiers générés\n\n`;
    
    if (routeFiles.length > 0) {
      description += `#### 🖥️ Routes et loaders\n`;
      routeFiles.forEach(file => {
        description += `- \`${file.path}\`\n`;
      });
      description += '\n';
    }
    
    if (docFiles.length > 0) {
      description += `#### 📑 Documentation et rapport\n`;
      docFiles.forEach(file => {
        description += `- \`${file.path}\`\n`;
      });
      description += '\n';
    }
    
    if (testFiles.length > 0) {
      description += `#### 🧪 Tests\n`;
      testFiles.forEach(file => {
        description += `- \`${file.path}\`\n`;
      });
      description += '\n';
    }
    
    description += `### ✅ Checklist de vérification\n\n`;
    description += `- [ ] Les imports sont corrects et tous résolus\n`;
    description += `- [ ] Les types TypeScript sont valides\n`;
    description += `- [ ] Les routes fonctionnent comme prévu\n`;
    description += `- [ ] La migration est complète (tous les champs/fonctionnalités sont présents)\n`;
    description += `- [ ] Les tests passent\n\n`;
    
    description += `> Pour plus de détails, consulter le fichier \`docs/${path.basename(context.file, path.extname(context.file))}.final.md\` inclus dans cette PR.`;
    
    return description;
  }

  /**
   * Crée la Pull Request sur GitHub
   */
  private async createGitHubPR(branch: string, title: string, body: string) {
    try {
      const { data: pr } = await this.octokit.pulls.create({
        owner: this.config.owner,
        repo: this.config.repo,
        head: branch,
        base: this.config.base!,
        title,
        body,
        draft: this.config.draftPR
      });
      
      return pr;
    } catch (error) {
      this.logger.error(`❌ Erreur API GitHub: ${error.message}`);
      throw new Error(`Échec de la création de la PR sur GitHub: ${error.message}`);
    }

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }
  }

  /**
   * Ajoute des reviewers et labels à la PR
   */
  private async addReviewersAndLabels(prNumber: number): Promise<void> {
    try {
      // Ajouter des reviewers
      if (this.config.reviewers?.length) {
        await this.octokit.pulls.requestReviewers({
          owner: this.config.owner,
          repo: this.config.repo,
          pull_number: prNumber,
          reviewers: this.config.reviewers
        });
      }
      
      // Ajouter des labels
      if (this.config.labels?.length) {
        await this.octokit.issues.addLabels({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: prNumber,
          labels: this.config.labels
        });
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de l'ajout des reviewers/labels: ${error.message}`);
      // Continuer même si cette partie échoue
    }
  }
}

/**
 * Exécute la création d'une PR depuis un fichier de job ou un objet de contexte
 */
export async function runPRCreator(contextOrPath: string | JobContext): Promise<string> {
  const logger = new Logger('runPRCreator');
  
  try {
    // Déterminer si l'entrée est un chemin de fichier ou un objet de contexte
    let context: JobContext;
    
    if (typeof contextOrPath === 'string') {
      logger.log(`📂 Chargement du contexte depuis le fichier: ${contextOrPath}`);
      const content = await fs.readFile(contextOrPath, 'utf-8');
      context = JSON.parse(content) as JobContext;
    } else {
      context = contextOrPath;
    }
    
    // Validation basique des données d'entrée
    if (!context.file || !context.target || !context.generatedFiles) {
      throw new Error('Contexte invalide: file, target et generatedFiles sont requis');
    }
    
    // Récupérer les variables d'environnement ou valeurs par défaut
    constDoDoDoDoDoDotgithubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'your-org';
    const repo = process.env.GITHUB_REPO || 'remix-nestjs-monorepo';
    const base = process.env.GITHUB_BASE_BRANCH || 'main';
    const reviewers = process.env.GITHUB_REVIEWERS ? process.env.GITHUB_REVIEWERS.split(',') : [];
    const labels = process.env.GITHUB_LABELS ? process.env.GITHUB_LABELS.split(',') : ['migration', DoDotmcp-generated'];
    
    if (DoDoDoDoDoDotgithubToken) {
      throw new Error('Token GitHub non défini. Veuillez définir la variable d\'environnement GITHUB_TOKEN.');
    }
    
    // Créer et exécuter l'agent
    const prCreator = new PRCreatorDoDoDoDoDoDotgithubToken, {
      owner,
      repo,
      base,
      reviewers,
      labels,
      draftPR: process.env.GITHUB_CREATE_DRAFT === 'true'
    });
    
    return await prCreator.createPullRequest(context);
  } catch (error) {
    logger.error(`❌ Erreur lors de l'exécution de runPRCreator: ${error.message}`);
    throw error;
  }
}

// Exécution autonome si appelé directement
if (require.main === module) {
  const jobPath = process.argv[2];
  
  if (!jobPath) {
    console.error('❌ Veuillez spécifier le chemin vers le fichier job.json');
    console.error('Usage: ts-node pr-creator.ts path/to/job.json');
    process.exit(1);
  }
  
  runPRCreator(jobPath)
    .then(prUrl => {
      console.log(`✅ Pull Request créée: ${prUrl}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Erreur: ${error.message}`);
      process.exit(1);
    });
}