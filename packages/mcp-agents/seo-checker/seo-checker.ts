/**
 * SEO Checker Agent MCP
 * 
 * Cet agent analyse les éléments SEO des fichiers PHP et les migre vers Remix/NestJS
 * Fonctionnalités :
 * - Extraction des métadonnées SEO (title, description, canonical, etc.)
 * - Génération de fichiers .meta.ts pour Remix
 * - Génération de fichiers .seo.json pour le suivi et l'audit
 * - Analyse des redirections dans .htaccess
 * - Validation des URLs et des canonicals
 * - Calcul de score SEO
 */

import fs from 'fs-extra';
import path from 'path';
import { parse } from 'node-html-parser';
import * as cheerio from 'cheerio';
import glob from 'glob';
import { exec } from 'child_process';
import util from 'util';
import axios from 'axios';
import { Database } from '../shared/db-connector';

// Convertir exec en version Promise
const execPromise = util.promisify(exec);

interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

interface SEOAuditResult {
  url: string;
  sourceFile: string;
  targetFile: string;
  metadata: SEOMetadata;
  score: number;
  issues: string[];
  redirects: Redirection[];
  migrationDate: string;
  status: 'pending' | 'migrated' | 'verified' | 'failed';
  lighthouseScore?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

interface Redirection {
  source: string;
  target: string;
  type: '301' | '302' | '307' | '308' | '410' | '404';
  condition?: string;
}

export class SEOChecker {
  private phpDir: string;
  private remixDir: string;
  private outputDir: string;
  private db: Database | null = null;
  
  constructor(config: {
    phpDir: string;
    remixDir: string;
    outputDir: string;
    useDatabase?: boolean;
  }) {
    this.phpDir = config.phpDir;
    this.remixDir = config.remixDir;
    this.outputDir = config.outputDir;
    
    if (config.useDatabase) {
      this.initializeDatabase();
    }
    
    // S'assurer que les répertoires existent
    fs.ensureDirSync(this.outputDir);
  }
  
  private async initializeDatabase() {
    try {
      this.db = new Database({
        connectionString: process.env.DATABASE_URL || '',
        schema: 'public',
        table: 'seo_migration_status'
      });
      await this.db.initialize();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
      this.db = null;
    }
  }
  
  /**
   * Analyse un fichier PHP pour en extraire les métadonnées SEO
   */
  async extractSEOFromPHP(phpFilePath: string): Promise<SEOMetadata> {
    try {
      const content = await fs.readFile(phpFilePath, 'utf-8');
      
      // Analyse avec cheerio pour les balises HTML
      const $ = cheerio.load(content);
      
      // Extraire les métadonnées SEO
      const metadata: SEOMetadata = {
        title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
        description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
        canonical: $('link[rel="canonical"]').attr('href') || '',
        robots: $('meta[name="robots"]').attr('content') || 'index, follow',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        ogTitle: $('meta[property="og:title"]').attr('content') || '',
        ogDescription: $('meta[property="og:description"]').attr('content') || '',
        ogImage: $('meta[property="og:image"]').attr('content') || '',
        ogType: $('meta[property="og:type"]').attr('content') || 'website',
        ogUrl: $('meta[property="og:url"]').attr('content') || '',
        twitterCard: $('meta[name="twitter:card"]').attr('content') || 'summary',
        twitterTitle: $('meta[name="twitter:title"]').attr('content') || '',
        twitterDescription: $('meta[name="twitter:description"]').attr('content') || '',
        twitterImage: $('meta[name="twitter:image"]').attr('content') || '',
      };
      
      // Extraire également les métadonnées depuis le PHP en cherchant les motifs communs
      // Par exemple rechercher headTitle, seoDescription, etc. dans le code PHP
      const titleMatch = content.match(/[\$\.]headTitle\s*=\s*['"]([^'"]+)['"]/);
      if (titleMatch && titleMatch[1] && !metadata.title) {
        metadata.title = titleMatch[1];
      }
      
      const descMatch = content.match(/[\$\.]seoDescription\s*=\s*['"]([^'"]+)['"]/);
      if (descMatch && descMatch[1] && !metadata.description) {
        metadata.description = descMatch[1];
      }
      
      return metadata;
    } catch (error) {
      console.error(`Erreur lors de l'extraction SEO de ${phpFilePath}:`, error);
      return {
        title: '',
        description: '',
        canonical: '',
        robots: 'index, follow',
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        ogType: 'website',
        ogUrl: '',
        twitterCard: 'summary',
        twitterTitle: '',
        twitterDescription: '',
        twitterImage: '',
      };
    }
  }
  
  /**
   * Génère un fichier .meta.ts pour Remix
   */
  async generateRemixMetaFile(phpFilePath: string, targetFile: string, metadata: SEOMetadata): Promise<string> {
    const metaFileContent = `import type { MetaFunction } from "@remix-run/node";

/**
 * Métadonnées SEO migrées depuis ${path.basename(phpFilePath)}
 * Date de migration: ${new Date().toISOString()}
 */
export const meta: MetaFunction = () => {
  return [
    { title: "${this.escapeString(metadata.title)}" },
    { name: "description", content: "${this.escapeString(metadata.description)}" },
    ${metadata.canonical ? `{ tagName: "link", rel: "canonical", href: "${this.escapeString(metadata.canonical)}" },` : ''}
    ${metadata.robots ? `{ name: "robots", content: "${this.escapeString(metadata.robots)}" },` : ''}
    ${metadata.keywords ? `{ name: "keywords", content: "${this.escapeString(metadata.keywords)}" },` : ''}
    ${metadata.ogTitle ? `{ property: "og:title", content: "${this.escapeString(metadata.ogTitle)}" },` : ''}
    ${metadata.ogDescription ? `{ property: "og:description", content: "${this.escapeString(metadata.ogDescription)}" },` : ''}
    ${metadata.ogImage ? `{ property: "og:image", content: "${this.escapeString(metadata.ogImage)}" },` : ''}
    ${metadata.ogType ? `{ property: "og:type", content: "${this.escapeString(metadata.ogType)}" },` : ''}
    ${metadata.ogUrl ? `{ property: "og:url", content: "${this.escapeString(metadata.ogUrl)}" },` : ''}
    ${metadata.twitterCard ? `{ name: "twitter:card", content: "${this.escapeString(metadata.twitterCard)}" },` : ''}
    ${metadata.twitterTitle ? `{ name: "twitter:title", content: "${this.escapeString(metadata.twitterTitle)}" },` : ''}
    ${metadata.twitterDescription ? `{ name: "twitter:description", content: "${this.escapeString(metadata.twitterDescription)}" },` : ''}
    ${metadata.twitterImage ? `{ name: "twitter:image", content: "${this.escapeString(metadata.twitterImage)}" },` : ''}
  ].filter(Boolean);
};
`;

    // Écrire le fichier .meta.ts
    const metaFilePath = targetFile.replace(/\.tsx?$/, '.meta.ts');
    await fs.writeFile(metaFilePath, metaFileContent, 'utf-8');
    return metaFilePath;
  }

  /**
   * Génère un fichier .seo.json pour le suivi et l'audit
   */
  async generateSEOJsonFile(phpFilePath: string, targetFile: string, metadata: SEOMetadata): Promise<string> {
    const relativePHPPath = path.relative(this.phpDir, phpFilePath);
    const relativeTargetPath = path.relative(this.remixDir, targetFile);
    
    const seoAudit: SEOAuditResult = {
      url: this.getUrlFromFile(phpFilePath),
      sourceFile: relativePHPPath,
      targetFile: relativeTargetPath,
      metadata,
      score: this.calculateSEOScore(metadata),
      issues: this.identifySEOIssues(metadata),
      redirects: await this.findRedirectsForUrl(this.getUrlFromFile(phpFilePath)),
      migrationDate: new Date().toISOString(),
      status: 'migrated',
    };
    
    // Écrire le fichier .seo.json
    const seoJsonPath = targetFile.replace(/\.tsx?$/, '.seo.json');
    await fs.writeFile(seoJsonPath, JSON.stringify(seoAudit, null, 2), 'utf-8');
    
    // Si la base de données est initialisée, enregistrer le statut
    if (this.db) {
      await this.db.upsert({
        url: seoAudit.url,
        source_file: seoAudit.sourceFile,
        target_file: seoAudit.targetFile,
        seo_score: seoAudit.score,
        status: seoAudit.status,
        migration_date: new Date(seoAudit.migrationDate),
        metadata: JSON.stringify(seoAudit.metadata),
        issues: JSON.stringify(seoAudit.issues),
      });
    }
    
    return seoJsonPath;
  }
  
  /**
   * Calcule un score SEO basé sur les métadonnées
   */
  private calculateSEOScore(metadata: SEOMetadata): number {
    let score = 100;
    
    // Vérifier le titre
    if (!metadata.title) score -= 25;
    else if (metadata.title.length < 10) score -= 10;
    else if (metadata.title.length > 70) score -= 5;
    
    // Vérifier la description
    if (!metadata.description) score -= 25;
    else if (metadata.description.length < 50) score -= 10;
    else if (metadata.description.length > 160) score -= 5;
    
    // Vérifier le canonical
    if (!metadata.canonical) score -= 15;
    
    // Vérifier Open Graph
    if (!metadata.ogTitle) score -= 5;
    if (!metadata.ogDescription) score -= 5;
    if (!metadata.ogImage) score -= 5;
    
    // Vérifier Twitter Card
    if (!metadata.twitterCard) score -= 5;
    if (!metadata.twitterTitle) score -= 3;
    if (!metadata.twitterDescription) score -= 3;
    if (!metadata.twitterImage) score -= 3;
    
    // S'assurer que le score reste entre 0 et 100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Identifie les problèmes SEO
   */
  private identifySEOIssues(metadata: SEOMetadata): string[] {
    const issues: string[] = [];
    
    if (!metadata.title) issues.push('Titre manquant');
    else if (metadata.title.length < 10) issues.push('Titre trop court');
    else if (metadata.title.length > 70) issues.push('Titre trop long');
    
    if (!metadata.description) issues.push('Description manquante');
    else if (metadata.description.length < 50) issues.push('Description trop courte');
    else if (metadata.description.length > 160) issues.push('Description trop longue');
    
    if (!metadata.canonical) issues.push('URL canonique manquante');
    if (!metadata.ogImage) issues.push('Image Open Graph manquante');
    
    return issues;
  }
  
  /**
   * Extrait l'URL à partir du chemin du fichier
   */
  private getUrlFromFile(filePath: string): string {
    // Cette logique dépend de votre convention de nommage
    // Exemple simple : /var/www/html/produits/fiche.php -> /produits/fiche
    const relativePath = path.relative(this.phpDir, filePath);
    const urlPath = '/' + relativePath
      .replace(/\.php$/, '')
      .replace(/index$/, '');
      
    return urlPath;
  }
  
  /**
   * Cherche les redirections pour une URL dans le fichier .htaccess
   */
  private async findRedirectsForUrl(url: string): Promise<Redirection[]> {
    try {
      const htaccessPath = path.join(this.phpDir, '.htaccess');
      if (!await fs.pathExists(htaccessPath)) return [];
      
      const content = await fs.readFile(htaccessPath, 'utf-8');
      const redirects: Redirection[] = [];
      
      // Rechercher les redirections pertinentes pour cette URL
      // RewriteRule ^produits/ancien-nom$ /produits/nouveau-nom [R=301,L]
      const lines = content.split('\n');
      
      for (const line of lines) {
        // Analyser la ligne pour voir si elle contient une redirection
        if (line.includes('RewriteRule') && 
            (line.includes('[R=301') || line.includes('[R=302') || 
             line.includes('[R,L') || line.includes('RedirectPermanent'))) {
          
          const match = line.match(/RewriteRule\s+\^?(.*?)[\$\s]\s+(.*?)\s+\[(.*?)\]/);
          if (match) {
            const source = match[1];
            const target = match[2];
            const flags = match[3];
            
            // Déterminer le type de redirection
            let type: '301' | '302' | '307' | '308' = '301';
            if (flags.includes('R=302')) type = '302';
            if (flags.includes('R=307')) type = '307';
            if (flags.includes('R=308')) type = '308';
            
            // Si l'URL actuelle est impliquée dans la règle
            if (url.includes(source) || source.includes(url.replace(/^\//, ''))) {
              redirects.push({
                source: source.startsWith('/') ? source : '/' + source,
                target,
                type
              });
            }
          }
          
          // Vérifier aussi les RedirectPermanent
          const redirectMatch = line.match(/RedirectPermanent\s+(.*?)\s+(.*)/);
          if (redirectMatch) {
            const source = redirectMatch[1];
            const target = redirectMatch[2];
            
            if (url.includes(source) || source.includes(url.replace(/^\//, ''))) {
              redirects.push({
                source: source.startsWith('/') ? source : '/' + source,
                target,
                type: '301'
              });
            }
          }
        }
      }
      
      return redirects;
    } catch (error) {
      console.error('Erreur lors de la recherche des redirections:', error);
      return [];
    }
  }
  
  /**
   * Échappe les chaînes pour les intégrer dans du code JS
   */
  private escapeString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
  
  /**
   * Exécute Lighthouse pour analyser une URL
   */
  async runLighthouseAudit(url: string): Promise<{
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  } | null> {
    try {
      // Utiliser Lighthouse CI ou Lighthouse directement
      // Exemple avec Lighthouse CLI (nécessite une installation locale)
      const { stdout } = await execPromise(`lighthouse ${url} --output=json --quiet --chrome-flags="--headless"`);
      const result = JSON.parse(stdout);
      
      return {
        performance: Math.round(result.categories.performance.score * 100),
        accessibility: Math.round(result.categories.accessibility.score * 100),
        bestPractices: Math.round(result.categories['best-practices'].score * 100),
        seo: Math.round(result.categories.seo.score * 100)
      };
    } catch (error) {
      console.error(`Erreur lors de l'exécution de Lighthouse pour ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Met à jour le fichier de redirection Remix
   */
  async updateRemixRedirects(redirects: Redirection[]): Promise<void> {
    try {
      const remixConfigPath = path.join(this.remixDir, 'remix.config.js');
      let configContent = '';
      
      if (await fs.pathExists(remixConfigPath)) {
        configContent = await fs.readFile(remixConfigPath, 'utf-8');
      }
      
      // Générer le code de redirection
      let redirectsCode = 'module.exports = {\n';
      
      if (configContent.includes('module.exports =')) {
        // Modifier la configuration existante
        const existingRedirectsMatch = configContent.match(/redirects:\s*{([^}]*)}/);
        
        if (existingRedirectsMatch) {
          // Ajouter aux redirections existantes
          let existingRedirects = existingRedirectsMatch[1];
          
          for (const redirect of redirects) {
            const redirectEntry = `"${redirect.source}": "${redirect.target}",\n`;
            if (!existingRedirects.includes(redirectEntry)) {
              existingRedirects += redirectEntry;
            }
          }
          
          configContent = configContent.replace(/redirects:\s*{([^}]*)}/, `redirects: {${existingRedirects}}`);
        } else {
          // Ajouter la section de redirections
          const redirectsSection = `redirects: {\n${redirects.map(r => `    "${r.source}": "${r.target}",`).join('\n')}\n  },\n`;
          
          configContent = configContent.replace('module.exports = {', `module.exports = {\n  ${redirectsSection}`);
        }
        
        await fs.writeFile(remixConfigPath, configContent, 'utf-8');
      } else {
        // Créer une nouvelle configuration
        redirectsCode += '  redirects: {\n';
        redirectsCode += redirects.map(r => `    "${r.source}": "${r.target}",`).join('\n');
        redirectsCode += '\n  },\n';
        redirectsCode += '  // Autres configurations Remix\n';
        redirectsCode += '};\n';
        
        await fs.writeFile(remixConfigPath, redirectsCode, 'utf-8');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des redirections Remix:', error);
    }
  }
  
  /**
   * Exécute la vérification SEO sur un fichier PHP et génère les fichiers pour Remix
   */
  async checkAndMigrate(phpFilePath: string, targetFile: string): Promise<{
    metadata: SEOMetadata;
    metaFile: string;
    seoFile: string;
    score: number;
  }> {
    // Extraire les métadonnées SEO
    const metadata = await this.extractSEOFromPHP(phpFilePath);
    
    // Générer le fichier .meta.ts pour Remix
    const metaFile = await this.generateRemixMetaFile(phpFilePath, targetFile, metadata);
    
    // Générer le fichier .seo.json
    const seoFile = await this.generateSEOJsonFile(phpFilePath, targetFile, metadata);
    
    // Calculer le score SEO
    const score = this.calculateSEOScore(metadata);
    
    // Collecter les redirects et les ajouter à Remix si nécessaire
    const url = this.getUrlFromFile(phpFilePath);
    const redirects = await this.findRedirectsForUrl(url);
    
    if (redirects.length > 0) {
      await this.updateRemixRedirects(redirects);
    }
    
    return {
      metadata,
      metaFile,
      seoFile,
      score
    };
  }
  
  /**
   * Vérifie tous les fichiers PHP d'un répertoire et génère les fichiers Remix correspondants
   */
  async checkDirectory(options: {
    phpPattern?: string;
    targetPattern?: string;
    recursive?: boolean;
  } = {}): Promise<{
    processed: number;
    success: number;
    failed: number;
    averageScore: number;
  }> {
    const {
      phpPattern = '**/*.php',
      targetPattern = '**/*.{ts,tsx}',
      recursive = true
    } = options;
    
    const phpGlobPattern = recursive ? path.join(this.phpDir, phpPattern) : path.join(this.phpDir, path.basename(phpPattern));
    const phpFiles = glob.sync(phpGlobPattern);
    
    let processed = 0;
    let success = 0;
    let failed = 0;
    let totalScore = 0;
    
    for (const phpFile of phpFiles) {
      try {
        // Déterminer le fichier cible en fonction de la convention de nommage
        const relativePath = path.relative(this.phpDir, phpFile);
        let targetFilename = relativePath
          .replace(/\.php$/, '.tsx')
          .replace(/index\.tsx$/, 'route.tsx');
          
        // Pour les fichiers de routes Remix
        if (targetFilename.includes('routes/')) {
          targetFilename = targetFilename.replace(/routes\/(.+)\.tsx$/, 'routes/$1.tsx');
        }
        
        const targetFile = path.join(this.remixDir, targetFilename);
        
        // Vérifier si le fichier cible existe
        const targetExists = await fs.pathExists(targetFile);
        
        if (targetExists) {
          // Effectuer la vérification SEO et générer les fichiers
          const result = await this.checkAndMigrate(phpFile, targetFile);
          
          console.log(`✅ [${phpFile}] Migré vers ${targetFile} - Score SEO: ${result.score}`);
          
          processed++;
          success++;
          totalScore += result.score;
        } else {
          console.warn(`⚠️ [${phpFile}] Fichier cible non trouvé: ${targetFile}`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${phpFile}:`, error);
        failed++;
      }
    }
    
    const averageScore = success > 0 ? Math.round(totalScore / success) : 0;
    
    console.log(`
    📊 Migration SEO terminée:
    - Fichiers traités: ${processed}
    - Succès: ${success}
    - Échecs: ${failed}
    - Score SEO moyen: ${averageScore}/100
    `);
    
    return {
      processed,
      success,
      failed,
      averageScore
    };
  }
}

// Point d'entrée du programme
if (require.main === module) {
  // Utilisation en ligne de commande
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
    Usage:
      ts-node seo-checker.ts check <php-file> <target-file>
      ts-node seo-checker.ts check-dir <php-dir> <remix-dir> <output-dir>
      ts-node seo-checker.ts generate-redirects <htaccess-file> <remix-config>
    `);
    process.exit(1);
  }
  
  if (command === 'check') {
    const phpFile = args[1];
    const targetFile = args[2];
    
    if (!phpFile || !targetFile) {
      console.error('Veuillez spécifier le fichier PHP et le fichier cible.');
      process.exit(1);
    }
    
    const checker = new SEOChecker({
      phpDir: path.dirname(phpFile),
      remixDir: path.dirname(targetFile),
      outputDir: path.dirname(targetFile),
    });
    
    checker.checkAndMigrate(phpFile, targetFile)
      .then(result => {
        console.log(`✅ Migration SEO terminée - Score: ${result.score}/100`);
        console.log(`📄 Métadonnées générées: ${result.metaFile}`);
        console.log(`📄 Fichier SEO généré: ${result.seoFile}`);
      })
      .catch(error => {
        console.error('❌ Erreur:', error);
      });
  }
  
  if (command === 'check-dir') {
    const phpDir = args[1];
    const remixDir = args[2];
    const outputDir = args[3] || remixDir;
    
    if (!phpDir || !remixDir) {
      console.error('Veuillez spécifier les répertoires PHP et Remix.');
      process.exit(1);
    }
    
    const checker = new SEOChecker({
      phpDir,
      remixDir,
      outputDir,
    });
    
    checker.checkDirectory()
      .then(result => {
        console.log(`✅ Migration SEO terminée - Score moyen: ${result.averageScore}/100`);
      })
      .catch(error => {
        console.error('❌ Erreur:', error);
      });
  }
  
  if (command === 'generate-redirects') {
    const htaccessFile = args[1];
    const remixConfig = args[2];
    
    if (!htaccessFile || !remixConfig) {
      console.error('Veuillez spécifier le fichier .htaccess et le fichier remix.config.js.');
      process.exit(1);
    }
    
    // Logique pour extraire toutes les redirections du fichier .htaccess
    // et les ajouter au fichier remix.config.js
    console.log('Génération des redirections...');
  }
}

export default SEOChecker;