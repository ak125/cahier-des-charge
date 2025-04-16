/**
 * SEOChecker - Classe utilitaire pour la vérification SEO
 * 
 * Fournit des fonctionnalités communes pour l'analyse et la correction
 * des problèmes SEO dans les sites Remix migrés depuis PHP
 */

import path from 'path';
import fs from 'fs-extra';
import { glob } from 'glob';
import { execSync } from 'child_process';

// Configuration de base du checker SEO
export interface SEOCheckerOptions {
  phpDir: string;
  remixDir: string;
  outputDir: string;
  useDatabase?: boolean;
  lighthouseOptions?: {
    categories?: string[];
    device?: 'mobile' | 'desktop';
    throttling?: boolean;
  };
}

// Interface pour les problèmes SEO détectés
export interface SEOIssue {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  file?: string;
  line?: number;
  autoFixable?: boolean;
  suggestion?: string;
}

/**
 * Classe utilitaire pour la vérification et correction SEO
 */
export class SEOChecker {
  private options: SEOCheckerOptions;
  
  constructor(options: SEOCheckerOptions) {
    this.options = options;
  }
  
  /**
   * Vérifie un répertoire entier pour les problèmes SEO
   */
  async checkDirectory(): Promise<{
    total: number;
    processed: number;
    success: number;
    failed: number;
    averageScore: number;
    issues: SEOIssue[];
  }> {
    console.log(`⏳ Analyse SEO du répertoire ${this.options.remixDir}`);
    
    // Trouver tous les fichiers routes dans le répertoire Remix
    const routeFiles = await glob('routes/**/*.{tsx,jsx}', {
      cwd: this.options.remixDir,
      absolute: true
    });
    
    const results = {
      total: routeFiles.length,
      processed: 0,
      success: 0,
      failed: 0,
      averageScore: 0,
      issues: [] as SEOIssue[]
    };
    
    // Traiter chaque route
    for (const file of routeFiles) {
      try {
        // Analyser le fichier pour les métadonnées SEO
        const issues = await this.analyzeRouteFile(file);
        
        // Ajouter les problèmes à la liste globale
        results.issues.push(...issues);
        
        // Mettre à jour les compteurs
        results.processed++;
        
        if (issues.some(issue => issue.severity === 'error' || issue.severity === 'critical')) {
          results.failed++;
        } else {
          results.success++;
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de l'analyse de ${file}:`, error);
        results.processed++;
        results.failed++;
      }
    }
    
    // Calculer le score moyen
    results.averageScore = this.calculateAverageScore(results.issues, results.total);
    
    return results;
  }
  
  /**
   * Analyse un fichier de route pour les problèmes SEO
   */
  private async analyzeRouteFile(filePath: string): Promise<SEOIssue[]> {
    const issues: SEOIssue[] = [];
    
    try {
      // Lire le contenu du fichier
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 1. Vérifier l'exportation des métadonnées
      if (!content.includes('export const meta')) {
        issues.push({
          type: 'missing-meta',
          severity: 'error',
          message: `La route ne comporte pas d'exportation 'meta'`,
          file: filePath,
          autoFixable: true,
          suggestion: 'Ajouter une exportation meta avec les métadonnées adéquates'
        });
      }
      
      // 2. Vérifier le titre
      if (!content.includes('title:') && !content.includes('<title>')) {
        issues.push({
          type: 'missing-title',
          severity: 'critical',
          message: 'Le titre de la page est manquant',
          file: filePath,
          autoFixable: true,
          suggestion: 'Ajouter un titre à la page via la fonction meta'
        });
      }
      
      // 3. Vérifier la description
      if (!content.includes('description:') && !content.includes('<meta name="description"')) {
        issues.push({
          type: 'missing-description',
          severity: 'error',
          message: 'La description meta est manquante',
          file: filePath,
          autoFixable: true,
          suggestion: 'Ajouter une description meta à la page'
        });
      }
      
      // 4. Vérifier les URLs canoniques
      if (!content.includes('canonical:') && !content.includes('<link rel="canonical"')) {
        issues.push({
          type: 'missing-canonical',
          severity: 'warning',
          message: 'URL canonique manquante',
          file: filePath,
          autoFixable: true,
          suggestion: 'Ajouter une URL canonique pour éviter le contenu dupliqué'
        });
      }
      
      // 5. Vérifier les méta-robots
      if (content.includes('noindex') || content.includes('nofollow')) {
        const lineNumber = this.findLineNumber(content, 'noindex') || 
                          this.findLineNumber(content, 'nofollow');
        
        issues.push({
          type: 'robots-directive',
          severity: 'warning',
          message: 'La page utilise noindex ou nofollow - vérifier si c\'est intentionnel',
          file: filePath,
          line: lineNumber,
          autoFixable: false,
        });
      }
      
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
      issues.push({
        type: 'analysis-error',
        severity: 'error',
        message: `Impossible d'analyser le fichier: ${error instanceof Error ? error.message : String(error)}`,
        file: filePath,
        autoFixable: false,
      });
    }
    
    return issues;
  }
  
  /**
   * Trouver le numéro de ligne d'une chaîne dans un contenu
   */
  private findLineNumber(content: string, searchString: string): number | undefined {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    return undefined;
  }
  
  /**
   * Calcule un score moyen basé sur les problèmes détectés
   */
  private calculateAverageScore(issues: SEOIssue[], totalFiles: number): number {
    if (totalFiles === 0) return 0;
    
    // Base score: 100 points
    let totalPenaltyPoints = 0;
    
    // Pénalités par type d'erreur
    const penalties = {
      'critical': 20,
      'error': 10,
      'warning': 5,
      'info': 0
    };
    
    // Calculer les pénalités totales
    issues.forEach(issue => {
      totalPenaltyPoints += penalties[issue.severity] || 0;
    });
    
    // Score moyen par fichier
    const averageScore = Math.max(0, 100 - (totalPenaltyPoints / totalFiles));
    
    return Math.round(averageScore);
  }
  
  /**
   * Valide les URLs canoniques
   */
  async validateCanonicals(): Promise<SEOIssue[]> {
    const issues: SEOIssue[] = [];
    
    // Implémentation de la validation des canonicals
    // Exemple simplifié, à adapter selon vos besoins réels
    
    console.log('⏳ Validation des URLs canoniques');
    
    const routeFiles = await glob('routes/**/*.{tsx,jsx}', {
      cwd: this.options.remixDir,
      absolute: true
    });
    
    for (const file of routeFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const filename = path.basename(file);
      
      // Extraire les URL canoniques
      const canonicalMatches = content.match(/canonical:[\s]*['"](.*?)['"]/);
      
      if (canonicalMatches) {
        const canonical = canonicalMatches[1];
        
        // Vérifier si l'URL canonique est correcte
        if (!canonical.startsWith('http')) {
          issues.push({
            type: 'invalid-canonical',
            severity: 'error',
            message: `URL canonique invalide: ${canonical} - doit être une URL absolue`,
            file,
            line: this.findLineNumber(content, canonicalMatches[0]),
            autoFixable: true,
            suggestion: `Utiliser une URL absolue avec https://`
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Valide les redirections
   */
  async validateRedirects(): Promise<SEOIssue[]> {
    const issues: SEOIssue[] = [];
    
    // Implémentation de la validation des redirections
    // Exemple simplifié, à adapter selon vos besoins réels
    
    console.log('⏳ Validation des redirections');
    
    // Cette implémentation devrait analyser les redirections dans les fichiers de routes Remix
    // et les comparer avec les redirections définies dans .htaccess du site PHP
    
    return issues;
  }
  
  /**
   * Valide les balises meta
   */
  async validateMetaTags(): Promise<SEOIssue[]> {
    const issues: SEOIssue[] = [];
    
    // Implémentation de la validation des balises meta
    // Exemple simplifié, à adapter selon vos besoins réels
    
    console.log('⏳ Validation des balises meta');
    
    const routeFiles = await glob('routes/**/*.{tsx,jsx}', {
      cwd: this.options.remixDir,
      absolute: true
    });
    
    for (const file of routeFiles) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Vérifier les longueurs des titres et descriptions
      const titleMatches = content.match(/title:[\s]*['"](.*?)['"]/);
      
      if (titleMatches) {
        const title = titleMatches[1];
        
        if (title.length < 20 || title.length > 70) {
          issues.push({
            type: 'title-length',
            severity: 'warning',
            message: `Longueur du titre (${title.length} caractères) hors des recommandations (20-70)`,
            file,
            line: this.findLineNumber(content, titleMatches[0]),
            autoFixable: false,
            suggestion: `Ajuster la longueur du titre entre 20 et 70 caractères`
          });
        }
      }
      
      const descMatches = content.match(/description:[\s]*['"](.*?)['"]/);
      
      if (descMatches) {
        const description = descMatches[1];
        
        if (description.length < 50 || description.length > 160) {
          issues.push({
            type: 'description-length',
            severity: 'warning',
            message: `Longueur de la description (${description.length} caractères) hors des recommandations (50-160)`,
            file,
            line: this.findLineNumber(content, descMatches[0]),
            autoFixable: false,
            suggestion: `Ajuster la longueur de la description entre 50 et 160 caractères`
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Corrige les canonicals
   */
  async fixCanonicals(): Promise<Array<{file: string, fixed: string, original: string}>> {
    const results: Array<{file: string, fixed: string, original: string}> = [];
    
    // Exemple simplifié de correction des canonicals
    console.log('⏳ Correction des URLs canoniques');
    
    const issues = await this.validateCanonicals();
    
    for (const issue of issues) {
      if (issue.autoFixable && issue.file) {
        try {
          // Lire le contenu du fichier
          const content = await fs.readFile(issue.file, 'utf-8');
          
          // Extraire le nom de la route pour générer une URL canonique
          const routePath = this.extractRoutePath(issue.file);
          const baseUrl = 'https://www.example.com'; // À remplacer par le vrai domaine
          const canonicalUrl = `${baseUrl}${routePath}`;
          
          // Remplacer l'ancien canonical par le nouveau
          const updatedContent = content.replace(
            /canonical:[\s]*['"](.*?)['"]/, 
            `canonical: '${canonicalUrl}'`
          );
          
          // Sauvegarder les modifications
          await fs.writeFile(issue.file, updatedContent, 'utf-8');
          
          // Ajouter aux résultats
          results.push({
            file: issue.file,
            original: content,
            fixed: updatedContent
          });
          
          console.log(`✅ Correction de l'URL canonique dans ${issue.file}`);
        } catch (error) {
          console.error(`❌ Impossible de corriger ${issue.file}:`, error);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Corrige les redirections
   */
  async fixRedirects(): Promise<Array<{file: string, fixed: string, original: string}>> {
    // Exemple simplifié de correction des redirections
    console.log('⏳ Correction des redirections');
    
    // La logique de conversion des règles .htaccess vers Remix serait implémentée ici
    
    return [];
  }
  
  /**
   * Extrait le chemin de route à partir d'un fichier
   */
  private extractRoutePath(filePath: string): string {
    // Remplacer les extensions
    let routePath = filePath
      .replace(/.*routes\//, '/')
      .replace(/\.(tsx|jsx|ts|js)$/, '');
    
    // Gérer les routes index
    routePath = routePath.replace(/\/index$/, '/');
    
    // Gérer les routes dynamiques
    routePath = routePath.replace(/\$(\w+)/g, ':$1');
    
    return routePath;
  }
}