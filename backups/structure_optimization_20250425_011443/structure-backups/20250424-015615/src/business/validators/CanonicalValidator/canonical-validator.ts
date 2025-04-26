/**
 * Canonical URL Validator Agent
 * 
 * Agent spécialisé dans la validation, correction et optimisation
 * des URL canoniques dans l'architecture Remix
 */

import { MCPAgent, AgentContext, AgentConfig } from ../packagesDoDotmcp-corestructure-agent';
import fs from fs-extrastructure-agent';
import path from pathstructure-agent';
import glob from globstructure-agent';
import axios from axiosstructure-agent';
import { Database } from ../packages/shared/DbConnectorstructure-agent';
import { BaseAgent, BusinessAgent } from ../core/interfaces/BaseAgentstructure-agent';


interface CanonicalValidatorConfig extends AgentConfig {
  remixDir: string;
  baseUrl: string;
  ignorePatterns: string[];
  autoCorrect: boolean;
  validateUrlStatus: boolean;
  dbTracking: boolean;
}

interface CanonicalIssue {
  route: string;
  file: string;
  canonical: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export class CanonicalValidator implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent, MCPAgent<CanonicalValidatorConfig> {
  id = 'canonical-validator';
  name = 'Canonical URL Validator';
  description = 'Valide, corrige et optimise les URL canoniques dans les routes Remix';
  version = '1.0.0';
  
  private db: Database | null = null;
  private issues: CanonicalIssue[] = [];
  
  constructor(private config: CanonicalValidatorConfig, private context: AgentContext) {
    if (config.dbTracking) {
      this.initializeDatabase();
    }
  }
  
  private async initializeDatabase(): Promise<void> {
    try {
      this.db = new Database({
        connectionString: process.env.DATABASE_URL || '',
        schema: 'public',
        table: 'seo_canonical_status'
      });
      await this.db.initialize();
    } catch (error) {
      this.context.logger.error('Erreur lors de l\'initialisation de la base de données:', error);
      this.db = null;
    }
  }
  
  async initialize(): Promise<void> {
    this.context.logger.info('Initialisation du Canonical Validator');
    this.issues = [];
  }
  
  async run(): Promise<void> {
    this.context.logger.info('Démarrage de la validation des canonicals');
    
    // Trouver tous les fichiers .meta.ts et .tsx concernés
    const metaFiles = glob.sync(path.join(this.config.remixDir, '**/*.meta.ts'));
    const routeFiles = glob.sync(path.join(this.config.remixDir, 'app/routes/**/*.{ts,tsx}'));
    
    // Analyser les fichiers de métadonnées pour extraire les canonicals
    for (const file of metaFiles) {
      await this.validateMetaFile(file);
    }
    
    // Vérifier les fichiers de routes qui n'ont pas de fichier .meta.ts
    for (const routeFile of routeFiles) {
      const baseName = routeFile.replace(/\.[^/.]+$/, '');
      const metaFile = `${baseName}.meta.ts`;
      
      if (!fs.existsSync(metaFile)) {
        this.issues.push({
          route: this.getRouteFromFile(routeFile),
          file: routeFile,
          canonical: '',
          issue: 'Fichier .meta.ts manquant',
          severity: 'warning',
          suggestion: `Générer un fichier .meta.ts pour ${path.basename(routeFile)}`
        });
      }
    }
    
    // Si la correction automatique est activée, corriger les problèmes
    if (this.config.autoCorrect) {
      await this.correctIssues();
    }
    
    // Générer un rapport
    await this.generateReport();
    
    // Résumé
    this.context.logger.info(`
    🔍 Validation des canonicals terminée:
    - ${metaFiles.length} fichiers .meta.ts analysés
    - ${this.issues.length} problèmes détectés
    - ${this.issues.filter(i => i.severity === 'error').length} erreurs
    - ${this.issues.filter(i => i.severity === 'warning').length} avertissements
    `);
  }
  
  /**
   * Valide un fichier .meta.ts pour les URL canoniques
   */
  private async validateMetaFile(filePath: string): Promise<void> {
    try {
      // Ignore les fichiers dans les motifs à ignorer
      if (this.config.ignorePatterns.some(pattern => filePath.includes(pattern))) {
        return;
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      const route = this.getRouteFromFile(filePath);
      
      // Rechercher les canonicals dans le fichier
      const canonicalMatch = content.match(/rel:\s*["']canonical["'],\s*href:\s*["']([^"']+)["']/);
      const canonicalMatch2 = content.match(/canonical['"]\s*[,:]\s*["']([^"']+)["']/);
      
      const canonical = canonicalMatch ? canonicalMatch[1] : 
                        canonicalMatch2 ? canonicalMatch2[1] : '';
      
      if (!canonical) {
        this.issues.push({
          route,
          file: filePath,
          canonical: '',
          issue: 'URL canonique manquante',
          severity: 'error',
          suggestion: `Ajouter une URL canonique au format { rel: "canonical", href: "${this.config.baseUrl}${route}" }`
        });
        return;
      }
      
      // Vérifier si l'URL canonique est complète (avec protocole et domaine)
      if (!canonical.startsWith('http')) {
        this.issues.push({
          route,
          file: filePath,
          canonical,
          issue: 'URL canonique relative',
          severity: 'warning',
          suggestion: `Remplacer par une URL absolue: ${this.config.baseUrl}${canonical}`
        });
      }
      
      // Vérifier si l'URL canonique est accessible
      if (this.config.validateUrlStatus && canonical.startsWith('http')) {
        try {
          const response = await axios.head(canonical, { 
            validateStatus: () => true,
            timeout: 5000 
          });
          
          if (response.status >= 400) {
            this.issues.push({
              route,
              file: filePath,
              canonical,
              issue: `URL canonique inaccessible (${response.status})`,
              severity: 'error',
              suggestion: `Vérifier et corriger l'URL canonique ${canonical}`
            });
          }
        } catch (error) {
          this.issues.push({
            route,
            file: filePath,
            canonical,
            issue: `Erreur lors de la vérification de l'URL canonique`,
            severity: 'warning',
            suggestion: `Vérifier la disponibilité de ${canonical}`
          });
        }
      }
      
      // Vérifier si la route et l'URL canonique correspondent
      const expectedPath = route.endsWith('/') ? route : `${route}/`;
      const canonicalPath = new URL(canonical.startsWith('http') ? canonical : 
                            `${this.config.baseUrl}${canonical}`).pathname;
                            
      if (canonicalPath !== route && canonicalPath !== expectedPath) {
        this.issues.push({
          route,
          file: filePath,
          canonical,
          issue: 'L\'URL canonique ne correspond pas à la route',
          severity: 'warning',
          suggestion: `Vérifier si l'URL canonique ${canonical} doit correspondre à la route ${route}`
        });
      }
      
      // Enregistrer dans la base de données si activé
      if (this.db) {
        try {
          await this.db.query(`
            INSERT INTO seo_canonical_status (route, canonical, status, checked_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (route) DO UPDATE 
            SET canonical = $2, status = $3, checked_at = NOW()
          `, [route, canonical, this.issues.length > 0 ? 'issue' : 'valid']);
        } catch (error) {
          this.context.logger.error(`Erreur lors de l'enregistrement en base de données pour ${route}:`, error);
        }
      }
    } catch (error) {
      this.context.logger.error(`Erreur lors de la validation de ${filePath}:`, error);
    }
  }
  
  /**
   * Extrait la route à partir du chemin du fichier
   */
  private getRouteFromFile(filePath: string): string {
    // Logique pour obtenir la route à partir du nom de fichier
    // Exemple simplifié:
    const routesDir = path.join(this.config.remixDir, 'app/routes');
    
    if (filePath.includes(routesDir)) {
      const relativePath = path.relative(routesDir, filePath);
      
      // Convertir en format de route
      return '/' + relativePath
        .replace(/\.meta\.ts$/, '')
        .replace(/\.tsx?$/, '')
        .replace(/\$/g, ':')
        .replace(/\/_/g, '/')
        .replace(/\/index$/, '/');
    }
    
    return '';
  }
  
  /**
   * Corrige automatiquement les problèmes identifiés
   */
  private async correctIssues(): Promise<void> {
    this.context.logger.info('Correction automatique des problèmes de canonicals');
    
    let corrected = 0;
    
    for (const issue of this.issues) {
      if (issue.suggestion && (issue.severity === 'error' || issue.severity === 'warning')) {
        try {
          if (!issue.canonical) {
            // Ajouter un canonical manquant
            const correctCanonical = `${this.config.baseUrl}${issue.route}`;
            await this.addCanonicalToFile(issue.file, correctCanonical);
            corrected++;
          } else if (issue.issue === 'URL canonique relative') {
            // Convertir en URL absolue
            const correctCanonical = issue.canonical.startsWith('http') ? 
                                    issue.canonical : 
                                    `${this.config.baseUrl}${issue.canonical}`;
                                    
            await this.updateCanonicalInFile(issue.file, issue.canonical, correctCanonical);
            corrected++;
          }
        } catch (error) {
          this.context.logger.error(`Erreur lors de la correction de ${issue.file}:`, error);
        }
      }
    }
    
    this.context.logger.info(`${corrected} problèmes corrigés automatiquement`);
  }
  
  /**
   * Ajoute une URL canonique à un fichier
   */
  private async addCanonicalToFile(filePath: string, canonical: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Logique pour ajouter le canonical selon le format du fichier
      // Ceci est une implémentation simplifiée
      if (filePath.endsWith('.meta.ts')) {
        // Format métadonnées Remix
        const updatedContent = content.replace(
          /return\s*\[\s*/,
          `return [\n    { rel: "canonical", href: "${canonical}" },\n    `
        );
        
        await fs.writeFile(filePath, updatedContent, 'utf-8');
      } else {
        // Fichier de route sans meta, créer un fichier .meta.ts
        const metaFilePath = filePath.replace(/\.tsx?$/, '.meta.ts');
        const metaContent = `import type { MetaFunction } from @remix-run/nodestructure-agent";

/**
 * Métadonnées SEO générées automatiquement
 * Date de génération: ${new Date().toISOString()}
 */
export const meta: MetaFunction = () => {
  return [
    { rel: "canonical", href: "${canonical}" },
    { title: "Titre à définir" },
    { name: "description", content: "Description à définir" }
  ];
};
`;
        await fs.writeFile(metaFilePath, metaContent, 'utf-8');
      }
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout du canonical à ${filePath}: ${error}`);
    }
  }
  
  /**
   * Met à jour une URL canonique dans un fichier
   */
  private async updateCanonicalInFile(filePath: string, oldCanonical: string, newCanonical: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Remplacer l'ancien canonical par le nouveau
      const updatedContent = content.replace(
        new RegExp(`(rel:\\s*["']canonical["'],\\s*href:\\s*["'])${oldCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`),
        `$1${newCanonical}$2`
      ).replace(
        new RegExp(`(canonical['"]\s*[,:]\s*["'])${oldCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`),
        `$1${newCanonical}$2`
      );
      
      await fs.writeFile(filePath, updatedContent, 'utf-8');
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du canonical dans ${filePath}: ${error}`);
    }
  }
  
  /**
   * Génère un rapport de validation des canonicals
   */
  private async generateReport(): Promise<void> {
    const reportPath = path.join(this.config.remixDir, 'reports/canonicals-report.md');
    const jsonReportPath = path.join(this.config.remixDir, 'reports/canonicals-report.json');
    
    await fs.ensureDir(path.dirname(reportPath));
    
    // Générer le rapport markdown
    let markdown = `# Rapport de validation des canonicals - ${new Date().toLocaleDateString()}

## Résumé
- **Routes analysées**: ${this.issues.length}
- **Erreurs**: ${this.issues.filter(i => i.severity === 'error').length}
- **Avertissements**: ${this.issues.filter(i => i.severity === 'warning').length}
- **Informations**: ${this.issues.filter(i => i.severity === 'info').length}

## Problèmes détectés

`;

    // Trier les problèmes par sévérité
    const sortedIssues = [...this.issues].sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    // Ajouter les détails des problèmes
    for (const issue of sortedIssues) {
      markdown += `### ${issue.route}
- **Sévérité**: ${issue.severity}
- **Problème**: ${issue.issue}
- **Fichier**: \`${issue.file}\`
- **Canonical actuel**: \`${issue.canonical || 'Aucun'}\`
${issue.suggestion ? `- **Suggestion**: ${issue.suggestion}` : ''}

`;
    }
    
    await fs.writeFile(reportPath, markdown, 'utf-8');
    this.context.logger.info(`Rapport généré: ${reportPath}`);
    
    // Enregistrer les données au format JSON pour le dashboard
    await fs.writeJson(jsonReportPath, {
      date: new Date().toISOString(),
      summary: {
        total: this.issues.length,
        errors: this.issues.filter(i => i.severity === 'error').length,
        warnings: this.issues.filter(i => i.severity === 'warning').length,
        info: this.issues.filter(i => i.severity === 'info').length
      },
      issues: sortedIssues
    }, { spaces: 2 });
  }
}

export default CanonicalValidator;