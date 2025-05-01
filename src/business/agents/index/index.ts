/**
 * QA Analyzer - Agent de vérification qualité pour les migrations PHP vers Remix
 * 
 * Cet agent compare les fichiers PHP sources avec les fichiers Remix générés pour s'assurer
 * que tous les éléments essentiels ont été correctement migrés et respectent les standards de qualité.
 */

import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { createClient } from '@supabase/supabase-js';
import { diffLines } from 'diff';
import fs from 'fs-extra';
import { parse as parsePhp } from 'php-parser';
import * as DashboardIntegration from '../apps/dashboard/integration/qa-dashboard';
import { BusinessAgent } from '../core/interfaces/BaseAgent';
import { AgentResult, AuditSection, BaseAgent } from './core/BaseAgent';


const execAsync = promisify(exec);

// Types
export interface QAAnalysisResult {
  status: 'OK' | 'Partial' | 'Failed';
  sourceFile: string;
  targetFiles: string[];
  missingFields: FieldAnalysis[];
  presentFields: FieldAnalysis[];
  seoIssues: QAIssue[];
  typeIssues: QAIssue[];
  validationIssues: QAIssue[];
  behaviorIssues: QAIssue[];
  recommendations: string[];
  score: number; // 0-100
  tags: string[];
}

export interface FieldAnalysis {
  name: string;
  sourceLocation?: string;
  targetLocation?: string;
  status: 'missing' | 'present' | 'partial';
  type?: string;
  hasValidation: boolean;
  issues?: string[];
}

export interface QAIssue {
  type: 'seo' | 'type' | 'validation' | 'behavior' | 'missing-field';
  severity: 'info' | 'warning' | 'error';
  message: string;
  sourceLocation?: string;
  targetLocation?: string;
  recommendation?: string;
}

export interface QAAnalyzerOptions {
  supabaseUrl?: string;
  supabaseKey?: string;
  outputDir?: string;
  verbose?: boolean;
  threshold?: number; // Seuil de score au-dessous duquel on considère l'analyse comme échouée
 DoDoDoDoDoDotgithubToken?: string;
 DoDoDoDoDoDotgithubRepo?: string;
 DoDoDoDoDoDotgithubOwner?: string;
  dashboardEnabled?: boolean;
  autoRetryOnFail?: boolean;
  taggingEnabled?: boolean;
  aiMatching?: boolean;
}

/**
 * Classe principale de l'analyseur QA dérivée de BaseAgent
 */
export class QAAnalyzer extends BaseAgent implements BusinessAgent {
  private readonly logger = new Logger('QAAnalyzer');
  private supabase: any | null = null;
  private octokit: Octokit | null = null;
  private options: QAAnalyzerOptions;
  private sourcePhpPath: string;
  private generatedFiles: Record<string, string>;
  private qaResult: QAAnalysisResult | null = null;
  
  // Propriétés héritées de BaseAgent mais déclarées ici pour la clarté
  protected fileContent = '';
  protected errors: Error[] = [];
  protected artifacts: string[] = [];
  
  // Propriétés de l'agent correctement déclarées
  private id = '';
  private type = '';
  private version = '1.0.0';
  private name = 'QAAnalyzer';

  constructor(sourcePhpPath: string, generatedFiles: Record<string, string>, options: QAAnalyzerOptions = {}) {
    super(sourcePhpPath); // Appel du constructeur de BaseAgent
    this.sourcePhpPath = sourcePhpPath;
    this.generatedFiles = generatedFiles;
    this.options = {
      outputDir: './docs',
      verbose: false,
      threshold: 70,
      dashboardEnabled: true,
      autoRetryOnFail: false,
      taggingEnabled: true,
      aiMatching: true,
      ...options
    };

    // Initialiser Supabase si les credentials sont fournis
    if (this.options.supabaseUrl && this.options.supabaseKey) {
      this.supabase = createClient(
        this.options.supabaseUrl,
        this.options.supabaseKey
      );
      this.logger.log('🔌 Connexion à Supabase établie');
    }

    // Initialiser l'API GitHub si le token est fourni
    if (this.optionsDoDoDoDoDoDotgithubToken) {
      this.octokit = new Octokit({
        auth: this.optionsDoDoDoDoDoDotgithubToken
      });
      this.logger.log('🔌 Connexion à GitHub établie');
    }
  }

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(_options?: Record<string, any>): Promise<void> {
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

  /**
   * Renvoie le nom de l'agent
   */
  public getName(): string {
    return 'QAAnalyzer';
  }

  /**
   * Renvoie la version de l'agent
   */
  public getVersion(): string {
    return '2.0.0';
  }
  
  /**
   * Renvoie les agents dont celui-ci dépend
   */
  public getDependencies(): string[] {
    return ['DiffVerifier']; // Dépend de l'agent de vérification des différences
  }

  /**
   * Charge le contenu du fichier PHP source et des fichiers générés
   */
  public async loadFile(): Promise<void> {
    try {
      this.fileContent = await fs.readFile(this.sourcePhpPath, 'utf-8');
      
      // Charger également les fichiers générés
      for (const [type, filePath] of Object.entries(this.generatedFiles)) {
        if (await fs.pathExists(filePath)) {
          this.generatedFiles[type] = await fs.readFile(filePath, 'utf-8');
        } else {
          this.addWarning(`Fichier généré non trouvé: ${filePath}`);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      const newError = new Error(`Erreur lors du chargement des fichiers: ${errorMessage}`);
      this.errors.push(newError);
      throw newError;
    }
  }

  /**
   * Méthode principale d'analyse (implémente l'abstract method de BaseAgent)
   */
  public async analyze(): Promise<void> {
    try {
      this.logger.log(`🔍 Analyse de la migration: ${path.basename(this.sourcePhpPath)}`);
      
      // 1. Extraire les champs et variables du PHP
      const phpFields = this.extractPhpFields(this.fileContent);
      
      // 2. Analyser les champs dans les fichiers générés
      const fieldAnalysis = this.analyzeFields(phpFields);
      
      // 3. Vérifier les problèmes SEO
      const seoIssues = this.analyzeSEO();
      
      // 4. Analyser le typage et la validation
      const typeIssues = this.analyzeTypes();
      const validationIssues = this.analyzeValidation();
      
      // 5. Analyser le comportement
      const behaviorIssues = this.analyzeBehavior();
      
      // 6. Générer des recommandations
      const recommendations = this.generateRecommendations(
        fieldAnalysis.missingFields, 
        seoIssues, 
        typeIssues, 
        validationIssues, 
        behaviorIssues
      );

      // 7. Calculer le score
      const score = this.calculateScore(
        fieldAnalysis.missingFields,
        fieldAnalysis.presentFields,
        seoIssues,
        typeIssues,
        validationIssues,
        behaviorIssues
      );

      // 8. Déterminer le statut global
      const status = this.determineStatus(score);

      // 9. Générer les tags
      const tags = this.generateTags(status, fieldAnalysis, seoIssues, typeIssues, validationIssues, behaviorIssues);

      // 10. Construire le résultat
      this.qaResult = {
        status,
        sourceFile: this.sourcePhpPath,
        targetFiles: Object.values(this.generatedFiles),
        missingFields: fieldAnalysis.missingFields,
        presentFields: fieldAnalysis.presentFields,
        seoIssues,
        typeIssues,
        validationIssues,
        behaviorIssues,
        recommendations,
        score,
        tags
      };

      // 11. Enregistrer le résultat dans Supabase si disponible
      if (this.supabase) {
        await this.saveToSupabase();
      }

      // 12. Générer le fichier de rapport
      const reportPath = await this.generateReport();
      this.artifacts.push(reportPath);

      // 13. Créer une section d'audit pour l'agent BaseAgent
      this.addSection(
        `qa-analysis-${path.basename(this.sourcePhpPath)}`,
        `Analyse QA: ${path.basename(this.sourcePhpPath)} → ${path.basename(Object.values(this.generatedFiles)[0] || '')}`,
        `Score: ${score}/100 - Statut: ${status}`,
        'qa-analysis',
        status === 'Failed' ? 'critical' : (status === 'Partial' ? 'warning' : 'info'),
        {
          score,
          status,
          missingFieldsCount: fieldAnalysis.missingFields.length,
          presentFieldsCount: fieldAnalysis.presentFields.length,
          tags
        }
      );

      // 14. Intégrer avec le dashboard si activé
      if (this.options.dashboardEnabled) {
        await this.updateDashboard();
      }

      // 15. Commenter sur GitHub PR si octokit est configuré
      if (this.octokit && this.optionsDoDoDoDoDoDotgithubOwner && this.optionsDoDoDoDoDoDotgithubRepo) {
        await this.commentOnPR();
      }

      // 16. Déclencher un retry automatique si nécessaire
      if (this.options.autoRetryOnFail && status === 'Failed') {
        await this.triggerRetry();
      }

      this.logger.log(`✅ Analyse terminée avec le statut: ${status} (Score: ${score}/100)`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'analyse: ${error.message}`);
      throw error;
    }
  }

  // Méthodes d'analyse existantes - inchangées
  
  private extractPhpFields(sourcePhp: string): string[] {
    try {
      const fields: Set<string> = new Set();
      
      // 1. Extraire les variables du PHP
      const variableRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
      let match;
      
      while ((match = variableRegex.exec(sourcePhp)) !== null) {
        // Ignorer les variables de contrôle courantes
        if (!['i', 'j', 'k', 'key', 'value'].includes(match[1])) {
          fields.add(match[1]);
        }
      }
      
      // 2. Extraire les éléments de formulaire
      const formElementRegex = /name=["']([^"']+)["']/g;
      
      while ((match = formElementRegex.exec(sourcePhp)) !== null) {
        fields.add(match[1]);
      }
      
      // 3. Extraire les clés d'un tableau $_POST ou $_GET
      const arrayAccessRegex = /\$_(POST|GET)\[["']([^"']+)["']\]/g;
      
      while ((match = arrayAccessRegex.exec(sourcePhp)) !== null) {
        fields.add(match[2]);
      }
      
      // 4. Extraire les noms de colonnes SQL
      const sqlColumnRegex = /SELECT\s+(.+?)\s+FROM/gi;
      
      while ((match = sqlColumnRegex.exec(sourcePhp)) !== null) {
        const columns = match[1].split(',').map(col => col.trim());
        
        for (const col of columns) {
          if (col !== '*') {
            // Extraire le nom de la colonne sans alias
            const colName = col.includes(' AS ') 
              ? col.split(' AS ')[0].trim() 
              : col;
            
            // Enlever les préfixes de table si présents
            const finalName = colName.includes('.') 
              ? colName.split('.')[1].trim() 
              : colName.trim();
            
            fields.add(finalName);
          }
        }
      }
      
      // 5. Extraire les champs du HTML (td, div avec data-field, etc.)
      const htmlFieldRegex = /data-field=["']([^"']+)["']/g;
      
      while ((match = htmlFieldRegex.exec(sourcePhp)) !== null) {
        fields.add(match[1]);
      }
      
      return Array.from(fields);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'extraction des champs PHP: ${error.message}`);
      return [];
    }
  }

  private analyzeFields(phpFields: string[]): { 
    missingFields: FieldAnalysis[], 
    presentFields: FieldAnalysis[] 
  } {
    const missingFields: FieldAnalysis[] = [];
    const presentFields: FieldAnalysis[] = [];
    
    // Concaténer tous les fichiers générés pour la recherche
    const allGeneratedContent = Object.values(this.generatedFiles).join('\n');
    
    for (const field of phpFields) {
      // Ignorer les champs/variables courantes du système
      if (['i', 'j', 'index', 'temp', 'tmp', 'row', 'item', 'result', 'conn', 'db', 'mysqli'].includes(field)) {
        continue;
      }
      
      // Construire des variations possibles du nom de champ en TypeScript/React
      const variations = [
        field,
        field.replace(/_([a-z])/g, (g) => g[1].toUpperCase()), // snake_case to camelCase
        field.replace(/([a-z])_([a-z])/g, (g) => g[0] + g[2].toUpperCase()), // autre variation de camelCase
        `${field}State`, // pour les états React
        `set${field.charAt(0).toUpperCase() + field.slice(1)}` // pour les setters React
      ];
      
      // Chercher les variations dans le contenu généré
      const fieldPresent = variations.some(v => allGeneratedContent.includes(v));
      
      // Vérifier si le champ a une validation
      const hasValidation = allGeneratedContent.includes(`z.string().${field}`) || 
                           allGeneratedContent.includes(`z.number().${field}`) ||
                           allGeneratedContent.includes(`${field}: z.`);
      
      if (fieldPresent) {
        presentFields.push({
          name: field,
          status: 'present',
          hasValidation,
          type: this.inferTypeFromContent(field, allGeneratedContent)
        });
      } else {
        missingFields.push({
          name: field,
          status: 'missing',
          hasValidation: false,
          issues: ['Champ non trouvé dans les fichiers générés']
        });
      }
    }
    
    return { missingFields, presentFields };
  }

  /**
   * Utilise des techniques avancées (regex intelligentes, heuristiques, etc.) 
   * pour faire correspondre les champs PHP aux propriétés TypeScript
   */
  private aiFieldMatching(phpFields: string[]): {
    missingFields: FieldAnalysis[],
    presentFields: FieldAnalysis[]
  } {
    const missingFields: FieldAnalysis[] = [];
    const presentFields: FieldAnalysis[] = [];
    
    // Concaténer tous les fichiers générés pour la recherche
    const allGeneratedContent = Object.values(this.generatedFiles).join('\n');
    
    // Patterns de transformation courants PHP -> TypeScript/React
    const transformationPatterns = [
      // snake_case -> camelCase
      { pattern: (field: string) => field.replace(/_([a-z])/g, (g) => g[1].toUpperCase()) },
      // ID majuscules -> id minuscules
      { pattern: (field: string) => field.replace(/ID/g, 'Id').replace(/Id$/, 'id') },
      // prefixe get/set
      { pattern: (field: string) => `get${field.charAt(0).toUpperCase() + field.slice(1)}` },
      { pattern: (field: string) => `set${field.charAt(0).toUpperCase() + field.slice(1)}` },
      // Suffixe State pour les états React
      { pattern: (field: string) => `${field}State` },
      // Suffixe pluriel pour les tableaux
      { pattern: (field: string) => `${field}s` },
      // Préfixe is pour les booléens
      { pattern: (field: string) => `is${field.charAt(0).toUpperCase() + field.slice(1)}` },
      // Suffixe Ref pour les références React
      { pattern: (field: string) => `${field}Ref` },
      // Préfixe handle pour les gestionnaires d'événements
      { pattern: (field: string) => `handle${field.charAt(0).toUpperCase() + field.slice(1)}Change` },
      { pattern: (field: string) => `handle${field.charAt(0).toUpperCase() + field.slice(1)}Click` },
      // Versions abrégées courantes
      { pattern: (field: string) => field.replace('number', 'num').replace('reference', 'ref') },
      // Versions complètes d'abréviations courantes
      { pattern: (field: string) => field.replace('num', 'number').replace('ref', 'reference') },
    ];
    
    for (const field of phpFields) {
      // Ignorer les champs/variables courantes du système
      if (['i', 'j', 'index', 'temp', 'tmp', 'row', 'item', 'result', 'conn', 'db', 'mysqli'].includes(field)) {
        continue;
      }
      
      // Construire des variations possibles du nom de champ
      const variations = [field];
      
      // Appliquer tous les patterns de transformation
      for (const { pattern } of transformationPatterns) {
        variations.push(pattern(field));
        
        // Pour les champs en snake_case, appliquer également les patterns à la version camelCase
        if (field.includes('_')) {
          const camelCaseField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          variations.push(pattern(camelCaseField));
        }
      }
      
      // Déduplication des variations
      const uniqueVariations = [...new Set(variations)];
      
      // Recherche des variations dans le contenu généré
      const matchedVariation = uniqueVariations.find(v => allGeneratedContent.includes(v));
      const fieldPresent = !!matchedVariation;
      
      // Vérifier si le champ a une validation
      const zodPatterns = [
        new RegExp(`z\\s*\\.\\s*object\\([^)]*['"]${field}['"]\\s*:\\s*z\\.`, 'i'),
        new RegExp(`z\\s*\\.\\s*object\\([^)]*${this.camelCase(field)}\\s*:\\s*z\\.`, 'i'),
        new RegExp(`${field}\\s*:\\s*z\\.`, 'i'),
        new RegExp(`${this.camelCase(field)}\\s*:\\s*z\\.`, 'i')
      ];
      
      const hasValidation = zodPatterns.some(pattern => pattern.test(allGeneratedContent));
      
      if (fieldPresent) {
        // Trouver la localisation du champ dans les fichiers générés
        const targetLocation = this.findFieldLocation(matchedVariation!, this.generatedFiles);
        
        presentFields.push({
          name: field,
          status: 'present',
          hasValidation,
          targetLocation,
          type: this.inferTypeFromContent(field, allGeneratedContent)
        });
      } else {
        missingFields.push({
          name: field,
          status: 'missing',
          hasValidation: false,
          issues: ['Champ non trouvé dans les fichiers générés']
        });
      }
    }
    
    return { missingFields, presentFields };
  }

  /**
   * Trouve la localisation d'un champ dans les fichiers générés (fichier:ligne)
   */
  private findFieldLocation(field: string, files: Record<string, string>): string | undefined {
    for (const [type, content] of Object.entries(files)) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(field)) {
          return `${type}:${i + 1}`;
        }
      }
    }
    return undefined;
  }

  /**
   * Convertit une chaîne snake_case en camelCase
   */
  private camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }

  private inferTypeFromContent(field: string, content: string): string {
    // Recherche de pattern pour les types dans TypeScript
    const camelCaseField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    
    const patterns = [
      { regex: new RegExp(`${field}:\\s*string`, 'i'), type: 'string' },
      { regex: new RegExp(`${camelCaseField}:\\s*string`, 'i'), type: 'string' },
      { regex: new RegExp(`${field}:\\s*number`, 'i'), type: 'number' },
      { regex: new RegExp(`${camelCaseField}:\\s*number`, 'i'), type: 'number' },
      { regex: new RegExp(`${field}:\\s*boolean`, 'i'), type: 'boolean' },
      { regex: new RegExp(`${camelCaseField}:\\s*boolean`, 'i'), type: 'boolean' },
      { regex: new RegExp(`${field}:\\s*Date`, 'i'), type: 'Date' },
      { regex: new RegExp(`${camelCaseField}:\\s*Date`, 'i'), type: 'Date' },
      { regex: new RegExp(`${field}:\\s*\\[`, 'i'), type: 'array' },
      { regex: new RegExp(`${camelCaseField}:\\s*\\[`, 'i'), type: 'array' },
      { regex: new RegExp(`${field}:\\s*\\{`, 'i'), type: 'object' },
      { regex: new RegExp(`${camelCaseField}:\\s*\\{`, 'i'), type: 'object' },
    ];
    
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        return pattern.type;
      }
    }
    
    // Par défaut, retourner unknown
    return 'unknown';
  }

  private analyzeSEO(): QAIssue[] {
    const issues: QAIssue[] = [];
    
    // 1. Vérifier la présence de balises meta dans le fichier PHP
    const phpMetaTags = this.extractMetaTags(this.fileContent);
    
    // 2. Vérifier les meta dans le fichier meta.ts
    if (this.generatedFiles.meta) {
      // Vérifier que chaque meta tag du PHP est présent dans le meta.ts
      for (const [name, _content] of Object.entries(phpMetaTags)) {
        if (!this.generatedFiles.meta.includes(name)) {
          issues.push({
            type: 'seo',
            severity: 'warning',
            message: `Meta tag "${name}" présent dans le PHP mais absent dans meta.ts`,
            recommendation: `Ajouter le meta tag "${name}" dans le fichier meta.ts`
          });
        }
      }
      
      // Vérifier la présence de la balise canonical
      if (this.fileContent.includes('rel="canonical"') && !this.generatedFiles.meta.includes('canonical')) {
        issues.push({
          type: 'seo',
          severity: 'error',
          message: 'Balise canonical absente dans meta.ts',
          recommendation: 'Ajouter une balise canonical dans meta.ts pour le référencement'
        });
      }
    } else {
      // Si le fichier meta.ts n'existe pas
      issues.push({
        type: 'seo',
        severity: 'error',
        message: 'Fichier meta.ts manquant',
        recommendation: 'Créer un fichier meta.ts pour optimiser le référencement'
      });
    }
    
    return issues;
  }

  private extractMetaTags(php: string): Record<string, string> {
    const metaTags: Record<string, string> = {};
    const metaRegex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']*)["']\s*\/?>/g;
    
    let match;
    while ((match = metaRegex.exec(php)) !== null) {
      metaTags[match[1]] = match[2];
    }
    
    return metaTags;
  }

  private analyzeTypes(): QAIssue[] {
    const issues: QAIssue[] = [];
    
    // Vérifier la présence de types explicites
    if (this.generatedFiles.loader) {
      // Vérifier les retours de fonction sans type explicite
      if (this.generatedFiles.loader.includes('export async function loader(') && 
          !this.generatedFiles.loader.includes('loader(') && 
          !this.generatedFiles.loader.includes(': Promise<')) {
        issues.push({
          type: 'type',
          severity: 'warning',
          message: 'Type de retour manquant pour la fonction loader',
          recommendation: 'Ajouter un type de retour explicite à la fonction loader'
        });
      }
      
      // Vérifier la présence de any
      const anyCount = (this.generatedFiles.loader.match(/: any/g) || []).length;
      if (anyCount > 0) {
        issues.push({
          type: 'type',
          severity: 'warning',
          message: `${anyCount} utilisations du type "any" détectées`,
          recommendation: 'Remplacer les types "any" par des types spécifiques'
        });
      }
      
      // Vérifier l'absence de typage pour les paramètres de fonction
      const untypedParams = (this.generatedFiles.loader.match(/\(([^:)]+)\)/g) || []).length;
      if (untypedParams > 0) {
        issues.push({
          type: 'type',
          severity: 'info',
          message: 'Paramètres sans type explicite détectés',
          recommendation: 'Ajouter des types explicites à tous les paramètres de fonction'
        });
      }
    }
    
    // Vérifier les types dans le composant principal
    if (this.generatedFiles.component) {
      // Vérifier les props du composant
      if (!this.generatedFiles.component.includes('type Props') && !this.generatedFiles.component.includes('interface Props')) {
        issues.push({
          type: 'type',
          severity: 'warning',
          message: 'Type Props manquant pour le composant',
          recommendation: 'Définir un type Props explicite pour le composant'
        });
      }
      
      // Vérifier l'utilisation de useLoaderData sans typage
      if (this.generatedFiles.component.includes('useLoaderData()') && !this.generatedFiles.component.includes('useLoaderData<')) {
        issues.push({
          type: 'type',
          severity: 'warning',
          message: 'useLoaderData() utilisé sans typage générique',
          recommendation: 'Ajouter un type générique à useLoaderData<LoaderData>()'
        });
      }
    }
    
    return issues;
  }

  private analyzeValidation(): QAIssue[] {
    const issues: QAIssue[] = [];
    
    // Vérifier l'utilisation de Zod pour la validation
    if (this.generatedFiles.loader) {
      // Vérifier si Zod est importé
      const hasZodImport = this.generatedFiles.loader.includes('import { z }') || this.generatedFiles.loader.includes('import z from');
      
      if (!hasZodImport && !this.generatedFiles.loader.includes('zod')) {
        issues.push({
          type: 'validation',
          severity: 'warning',
          message: 'Aucune validation avec Zod détectée',
          recommendation: 'Utiliser Zod pour valider les entrées utilisateur et les données'
        });
      } else {
        // Vérifier si les paramètres de requête sont validés
        if (this.generatedFiles.loader.includes('request.url') && !this.generatedFiles.loader.includes('z.string().url()')) {
          issues.push({
            type: 'validation',
            severity: 'info',
            message: 'Les paramètres d\'URL pourraient ne pas être validés',
            recommendation: 'Ajouter une validation pour les paramètres d\'URL avec Zod'
          });
        }
        
        // Vérifier si les paramètres de formulaire sont validés
        if (this.generatedFiles.loader.includes('formData') && !this.generatedFiles.loader.includes('z.object({')) {
          issues.push({
            type: 'validation',
            severity: 'warning',
            message: 'Les données de formulaire pourraient ne pas être validées',
            recommendation: 'Ajouter une validation pour les données de formulaire avec Zod'
          });
        }
      }
    }
    
    return issues;
  }

  private analyzeBehavior(): QAIssue[] {
    const issues: QAIssue[] = [];
    
    // Vérifier la gestion des erreurs
    if (this.generatedFiles.loader) {
      // Vérifier si le PHP a une gestion d'erreur
      const phpHasErrorHandling = this.fileContent.includes('try') || 
                                 this.fileContent.includes('catch') || 
                                 this.fileContent.includes('die(') ||
                                 this.fileContent.includes('exit(');
      
      // Vérifier si le loader a une gestion d'erreur
      const loaderHasErrorHandling = this.generatedFiles.loader.includes('try') || 
                                     this.generatedFiles.loader.includes('catch') ||
                                     this.generatedFiles.loader.includes('throw new');
      
      if (phpHasErrorHandling && !loaderHasErrorHandling) {
        issues.push({
          type: 'behavior',
          severity: 'error',
          message: 'La gestion des erreurs présente dans le PHP est absente du loader',
          recommendation: 'Ajouter des blocs try/catch pour la gestion des erreurs'
        });
      }
      
      // Vérifier si le loader renvoie null sans gestion d'erreur
      if (this.generatedFiles.loader.includes('return null') && !this.generatedFiles.loader.includes('try') && !this.generatedFiles.loader.includes('throw')) {
        issues.push({
          type: 'behavior',
          severity: 'warning',
          message: 'Le loader renvoie null sans gestion d\'erreur explicite',
          recommendation: 'Remplacer les "return null" par des exceptions appropriées pour une meilleure UX'
        });
      }
    }
    
    // Vérifier la gestion des redirections
    if (this.fileContent.includes('header(\'Location:') || this.fileContent.includes('header("Location:')) {
      const hasRedirect = this.generatedFiles.loader && (this.generatedFiles.loader.includes('redirect(') || this.generatedFiles.loader.includes('return redirect'));
      
      if (!hasRedirect) {
        issues.push({
          type: 'behavior',
          severity: 'error',
          message: 'Redirection présente dans le PHP mais absente du loader',
          recommendation: 'Ajouter les redirections équivalentes dans le loader avec redirect()'
        });
      }
    }
    
    // Vérifier la préservation des sessions
    if (this.fileContent.includes('$_SESSION')) {
      const hasSessionHandling = this.generatedFiles.loader && (this.generatedFiles.loader.includes('session') || this.generatedFiles.loader.includes('cookie'));
      
      if (!hasSessionHandling) {
        issues.push({
          type: 'behavior',
          severity: 'warning',
          message: 'Gestion de session présente dans le PHP mais absente du loader',
          recommendation: 'Ajouter la gestion de session équivalente dans le loader'
        });
      }
    }
    
    return issues;
  }

  private generateRecommendations(
    missingFields: FieldAnalysis[],
    seoIssues: QAIssue[],
    typeIssues: QAIssue[],
    validationIssues: QAIssue[],
    behaviorIssues: QAIssue[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Recommandations pour les champs manquants
    if (missingFields.length > 0) {
      if (missingFields.length <= 3) {
        missingFields.forEach(field => {
          recommendations.push(`Ajouter le champ manquant '${field.name}' dans les fichiers générés`);
        });
      } else {
        recommendations.push(`Ajouter les ${missingFields.length} champs manquants dans les fichiers générés`);
      }
    }
    
    // Ajouter les recommandations des problèmes détectés
    const allIssues = [
      ...seoIssues, 
      ...typeIssues, 
      ...validationIssues, 
      ...behaviorIssues
    ].filter(issue => issue.recommendation);
    
    allIssues.forEach(issue => {
      if (issue.recommendation) {
        recommendations.push(issue.recommendation);
      }
    });
    
    return recommendations;
  }

  private calculateScore(
    missingFields: FieldAnalysis[],
    presentFields: FieldAnalysis[],
    seoIssues: QAIssue[],
    typeIssues: QAIssue[],
    validationIssues: QAIssue[],
    behaviorIssues: QAIssue[]
  ): number {
    let score = 100;
    
    // Pénalité pour les champs manquants
    const totalFields = missingFields.length + presentFields.length;
    if (totalFields > 0) {
      const fieldCoverage = presentFields.length / totalFields;
      score -= (1 - fieldCoverage) * 30; // Jusqu'à 30 points de pénalité
    }
    
    // Pénalités pour les différents types de problèmes
    const seoErrorCount = seoIssues.filter(i => i.severity === 'error').length;
    const seoWarningCount = seoIssues.filter(i => i.severity === 'warning').length;
    score -= seoErrorCount * 5 + seoWarningCount * 2;
    
    const typeErrorCount = typeIssues.filter(i => i.severity === 'error').length;
    const typeWarningCount = typeIssues.filter(i => i.severity === 'warning').length;
    score -= typeErrorCount * 4 + typeWarningCount * 1;
    
    const validationErrorCount = validationIssues.filter(i => i.severity === 'error').length;
    const validationWarningCount = validationIssues.filter(i => i.severity === 'warning').length;
    score -= validationErrorCount * 5 + validationWarningCount * 2;
    
    const behaviorErrorCount = behaviorIssues.filter(i => i.severity === 'error').length;
    const behaviorWarningCount = behaviorIssues.filter(i => i.severity === 'warning').length;
    score -= behaviorErrorCount * 8 + behaviorWarningCount * 3;
    
    // Assurer que le score est entre 0 et 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineStatus(score: number): 'OK' | 'Partial' | 'Failed' {
    if (score >= 85) {
      return 'OK';
    }if (score >= this.options.threshold!) {
      return 'Partial';
    }
      return 'Failed';
  }

  /**
   * Génère des tags à partir des résultats de l'analyse
   */
  private generateTags(
    status: 'OK' | 'Partial' | 'Failed',
    fieldAnalysis: { missingFields: FieldAnalysis[], presentFields: FieldAnalysis[] },
    seoIssues: QAIssue[],
    typeIssues: QAIssue[],
    validationIssues: QAIssue[],
    behaviorIssues: QAIssue[]
  ): string[] {
    const tags: string[] = [];
    
    // Tag de statut
    tags.push(`qa:${status.toLowerCase()}`);
    
    // Tag de migration PHP vers Remix
    tags.push('PhpToRemix');
    
    // Tag de qualité des champs
    const totalFields = fieldAnalysis.missingFields.length + fieldAnalysis.presentFields.length;
    if (totalFields > 0) {
      const fieldCoverage = fieldAnalysis.presentFields.length / totalFields;
      if (fieldCoverage === 1) {
        tags.push('fields:complete');
      } else if (fieldCoverage >= 0.75) {
        tags.push('fields:partial');
      } else {
        tags.push('fields:poor');
      }
    }
    
    // Tags pour les différents types de problèmes
    if (seoIssues.some(i => i.severity === 'error')) {
      tags.push('seo:error');
    } else if (seoIssues.some(i => i.severity === 'warning')) {
      tags.push('seo:warning');
    } else if (seoIssues.length > 0) {
      tags.push('seo:info');
    }
    
    if (typeIssues.some(i => i.severity === 'error')) {
      tags.push('type:error');
    } else if (typeIssues.some(i => i.severity === 'warning')) {
      tags.push('type:warning');
    }
    
    if (validationIssues.some(i => i.severity === 'error')) {
      tags.push('validation:error');
    } else if (validationIssues.some(i => i.severity === 'warning')) {
      tags.push('validation:warning');
    }
    
    if (behaviorIssues.some(i => i.severity === 'error')) {
      tags.push('behavior:error');
    } else if (behaviorIssues.some(i => i.severity === 'warning')) {
      tags.push('behavior:warning');
    }
    
    return tags;
  }

  /**
   * Sauvegarde les résultats dans Supabase
   */
  private async saveToSupabase(): Promise<void> {
    if (!this.supabase || !this.qaResult) {
      this.addWarning('Supabase non configuré ou résultat QA non disponible');
      return;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('audit.qa_results')
        .insert({
          source_file: this.qaResult.sourceFile,
          target_files: this.qaResult.targetFiles,
          status: this.qaResult.status,
          score: this.qaResult.score,
          missing_fields_count: this.qaResult.missingFields.length,
          present_fields_count: this.qaResult.presentFields.length,
          seo_issues_count: this.qaResult.seoIssues.length,
          type_issues_count: this.qaResult.typeIssues.length,
          validation_issues_count: this.qaResult.validationIssues.length,
          behavior_issues_count: this.qaResult.behaviorIssues.length,
          recommendations: this.qaResult.recommendations,
          tags: this.qaResult.tags,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        this.addWarning(`Erreur lors de l'enregistrement dans Supabase: ${error.message}`);
      } else {
        this.logger.log('💾 Résultats sauvegardés dans Supabase');
      }
    } catch (error: any) {
      this.addWarning(`Exception lors de l'enregistrement dans Supabase: ${error.message}`);
    }
  }

  /**
   * Génère un rapport de l'analyse en format Markdown
   */
  private async generateReport(): Promise<string> {
    try {
      if (!this.qaResult) {
        throw new Error('Résultat QA non disponible');
      }
      
      const sourceFileName = path.basename(this.qaResult.sourceFile);
      const targetFileName = path.basename(this.qaResult.targetFiles[0] || '');
      
      let statusEmoji;
      switch(this.qaResult.status) {
        case 'OK': statusEmoji = '✅'; break;
        case 'Partial': statusEmoji = '⚠'; break;
        case 'Failed': statusEmoji = '❌'; break;
      }
      
      let report = `# Vérification IA – ${sourceFileName} → ${targetFileName}\n\n`;
      report += `## Résultat : ${statusEmoji} ${this.qaResult.status}\n\n`;
      report += `Score : ${this.qaResult.score}/100\n\n`;
      
      // Analyse des champs
      report += "## Analyse des champs\n\n";
      
      // Champs présents
      if (this.qaResult.presentFields.length > 0) {
        report += "### Champs correctement migrés\n\n";
        this.qaResult.presentFields.forEach(field => {
          const validationStatus = field.hasValidation ? '+ validé' : '';
          const typeInfo = field.type ? `(${field.type})` : '';
          report += `- ✅ \`${field.name}\` ➝ présent ${typeInfo} ${validationStatus}\n`;
        });
        report += '\n';
      }
      
      // Champs manquants
      if (this.qaResult.missingFields.length > 0) {
        report += "### Champs manquants\n\n";
        this.qaResult.missingFields.forEach(field => {
          report += `- ❌ \`${field.name}\` ➝ absent\n`;
        });
        report += '\n';
      }
      
      // Problèmes SEO
      if (this.qaResult.seoIssues.length > 0) {
        report += "## Problèmes SEO\n\n";
        this.qaResult.seoIssues.forEach(issue => {
          const severityEmoji = issue.severity === 'error' ? '❌' : (issue.severity === 'warning' ? '⚠' : 'ℹ️');
          report += `- ${severityEmoji} ${issue.message}\n`;
        });
        report += '\n';
      }
      
      // Problèmes de typage
      if (this.qaResult.typeIssues.length > 0) {
        report += "## Problèmes de typage\n\n";
        this.qaResult.typeIssues.forEach(issue => {
          const severityEmoji = issue.severity === 'error' ? '❌' : (issue.severity === 'warning' ? '⚠' : 'ℹ️');
          report += `- ${severityEmoji} ${issue.message}\n`;
        });
        report += '\n';
      }
      
      // Problèmes de validation
      if (this.qaResult.validationIssues.length > 0) {
        report += "## Problèmes de validation\n\n";
        this.qaResult.validationIssues.forEach(issue => {
          const severityEmoji = issue.severity === 'error' ? '❌' : (issue.severity === 'warning' ? '⚠' : 'ℹ️');
          report += `- ${severityEmoji} ${issue.message}\n`;
        });
        report += '\n';
      }
      
      // Problèmes de comportement
      if (this.qaResult.behaviorIssues.length > 0) {
        report += "## Problèmes de comportement\n\n";
        this.qaResult.behaviorIssues.forEach(issue => {
          const severityEmoji = issue.severity === 'error' ? '❌' : (issue.severity === 'warning' ? '⚠' : 'ℹ️');
          report += `- ${severityEmoji} ${issue.message}\n`;
        });
        report += '\n';
      }
      
      // Recommandations
      if (this.qaResult.recommendations.length > 0) {
        report += "## Recommandations\n\n";
        this.qaResult.recommendations.forEach(recommendation => {
          report += `- ${recommendation}\n`;
        });
        report += '\n';
      }
      
      // Informations sur l'analyse et tags
      report += "---\n\n";
      report += `*Analyse générée automatiquement par QA Analyzer le ${new Date().toLocaleString()}*\n\n`;
      
      if (this.qaResult.tags.length > 0) {
        report += `**Tags**: ${this.qaResult.tags.join(', ')}\n`;
      }
      
      // Créer le répertoire de sortie si nécessaire
      const outputDir = this.options.outputDir!;
      await fs.ensureDir(outputDir);
      
      // Définir le chemin du fichier de sortie
      const baseFileName = path.basename(sourceFileName, path.extname(sourceFileName));
      const outputPath = path.join(outputDir, `${baseFileName}.qa.md`);
      
      // Écrire le rapport dans un fichier
      await fs.writeFile(outputPath, report, 'utf-8');
      this.logger.log(`📝 Rapport généré : ${outputPath}`);
      
      // Créer également une version JSON si tagging est activé
      if (this.options.taggingEnabled) {
        const jsonOutputPath = path.join(outputDir, `${baseFileName}.qa.json`);
        await fs.writeFile(jsonOutputPath, JSON.stringify(this.qaResult, null, 2), 'utf-8');
        this.artifacts.push(jsonOutputPath);
      }
      
      return outputPath;
    } catch (error: any) {
      this.addWarning(`Erreur lors de la génération du rapport: ${error.message}`);
      throw error;
    }
  }

  /**
   * Met à jour le dashboard Remix avec les résultats QA
   */
  private async updateDashboard(): Promise<void> {
    if (!this.qaResult) {
      this.addWarning('Résultat QA non disponible pour la mise à jour du dashboard');
      return;
    }
    
    try {
      // Appeler l'API de mise à jour du dashboard
      await DashboardIntegration.updateQAResults({
        sourceFile: this.qaResult.sourceFile,
        targetFiles: this.qaResult.targetFiles,
        status: this.qaResult.status,
        score: this.qaResult.score,
        missingFieldsCount: this.qaResult.missingFields.length,
        presentFieldsCount: this.qaResult.presentFields.length,
        issuesCount: 
          this.qaResult.seoIssues.length + 
          this.qaResult.typeIssues.length + 
          this.qaResult.validationIssues.length + 
          this.qaResult.behaviorIssues.length,
        recommendations: this.qaResult.recommendations,
        tags: this.qaResult.tags,
        timestamp: new Date().toISOString()
      });
      
      this.logger.log('📊 Résultats QA mis à jour dans le dashboard Remix');
    } catch (error: any) {
      this.addWarning(`Erreur lors de la mise à jour du dashboard: ${error.message}`);
    }
  }

  /**
   * Commente les résultats QA sur la Pull Request GitHub
   */
  private async commentOnPR(): Promise<void> {
    if (!this.octokit || !this.qaResult || !this.optionsDoDoDoDoDoDotgithubOwner || !this.optionsDoDoDoDoDoDotgithubRepo) {
      this.addWarning('Configuration GitHub incomplète pour le commentaire PR');
      return;
    }
    
    try {
      // Trouver la PR associée au fichier
      const { stdout } = await execAsync(DoDoDoDotgit branch --show-current');
      const currentBranch = stdout.trim();
      
      // Rechercher les PRs ouvertes pour cette branche
      const { data: pullRequests } = await this.octokit.pulls.list({
        owner: this.optionsDoDoDoDoDoDotgithubOwner,
        repo: this.optionsDoDoDoDoDoDotgithubRepo,
        state: 'open',
        head: `${this.optionsDoDoDoDoDoDotgithubOwner}:${currentBranch}`
      });
      
      if (pullRequests.length === 0) {
        this.addWarning('Aucune PR trouvée pour la branche actuelle');
        return;
      }
      
      const prNumber = pullRequests[0].number;
      
      // Construire le commentaire
      let statusEmoji;
      switch(this.qaResult.status) {
        case 'OK': statusEmoji = '✅'; break;
        case 'Partial': statusEmoji = '⚠️'; break;
        case 'Failed': statusEmoji = '❌'; break;
      }
      
      const sourceFileName = path.basename(this.qaResult.sourceFile);
      const targetFileName = path.basename(this.qaResult.targetFiles[0] || '');
      
      let comment = `## ${statusEmoji} QA Analyzer: ${sourceFileName} → ${targetFileName}\n\n`;
      comment += `**Score**: ${this.qaResult.score}/100\n\n`;
      
      // Résumé des problèmes
      comment += "### Résumé\n";
      comment += `- Champs: ${this.qaResult.presentFields.length} présents, ${this.qaResult.missingFields.length} manquants\n`;
      comment += `- Problèmes SEO: ${this.qaResult.seoIssues.length}\n`;
      comment += `- Problèmes de typage: ${this.qaResult.typeIssues.length}\n`;
      comment += `- Problèmes de validation: ${this.qaResult.validationIssues.length}\n`;
      comment += `- Problèmes de comportement: ${this.qaResult.behaviorIssues.length}\n\n`;
      
      // Top 5 recommandations
      if (this.qaResult.recommendations.length > 0) {
        comment += "### Principales recommandations\n";
        this.qaResult.recommendations.slice(0, 5).forEach(rec => {
          comment += `- ${rec}\n`;
        });
        
        if (this.qaResult.recommendations.length > 5) {
          comment += `- _${this.qaResult.recommendations.length - 5} recommandations supplémentaires..._\n`;
        }
        comment += '\n';
      }
      
      // Lien vers le rapport complet
      comment += `[Voir le rapport complet](${this.qaResult.sourceFile}.qa.md)\n\n`;
      comment += `**Tags**: ${this.qaResult.tags.join(', ')}\n`;
      
      // Ajouter le commentaire à la PR
      await this.octokit.issues.createComment({
        owner: this.optionsDoDoDoDoDoDotgithubOwner,
        repo: this.optionsDoDoDoDoDoDotgithubRepo,
        issue_number: prNumber,
        body: comment
      });
      
      this.logger.log(`💬 Commentaire ajouté à la PR #${prNumber}`);
    } catch (error: any) {
      this.addWarning(`Erreur lors de l'ajout du commentaire GitHub: ${error.message}`);
    }
  }

  /**
   * Déclenche un nouveau job MCP pour les fichiers ayant échoué
   */
  private async triggerRetry(): Promise<void> {
    if (!this.qaResult || this.qaResult.status !== 'Failed') {
      return;
    }
    
    try {
      this.logger.log(`🔄 Déclenchement d'un nouveau job MCP pour ${path.basename(this.qaResult.sourceFile)}`);
      
      // Exécuter le script de retry MCP
      const sourceFilePath = this.qaResult.sourceFile;
      await execAsync(`npm runDoDotmcp:retry -- --file="${sourceFilePath}" --reason="qa-failed"`);
      
      this.logger.log(`✅ Nouveau job MCP déclenché pour ${path.basename(sourceFilePath)}`);
    } catch (error: any) {
      this.addWarning(`Erreur lors du déclenchement du retry MCP: ${error.message}`);
    }
  }

  /**
   * Ajoute un avertissement à l'agent
   */
  protected addWarning(message: string): void {
    this.logger.warn(`⚠️ ${message}`);
    // Si la classe parente a une méthode addWarning, l'appeler aussi
    if (super.addWarning) {
      super.addWarning(message);
    }
  }

  /**
   * Ajoute une section au rapport d'audit
   */
  protected addSection(
    id: string,
    title: string,
    summary: string,
    type = 'info',
    severity: 'info' | 'warning' | 'critical' = 'info',
    metadata: Record<string, any> = {}
  ): void {
    const section: AuditSection = {
      id,
      title,
      summary,
      type,
      severity,
      metadata
    };
    
    // Si la classe parente a une méthode addSection, l'appeler aussi
    if (super.addSection) {
      super.addSection(section);
    }
  }

  /**
   * Méthode principale pour exécuter l'analyse
   */
  public async process(): Promise<AgentResult> {
    // Utilise la méthode process de BaseAgent
    return super.process();
  }
}

/**
 * Fonction principale pour exécuter l'analyse QA
 */
export async function runQAAnalyzer(sourcePhpPath: string, generatedFiles: Record<string, string>, options: QAAnalyzerOptions = {}): Promise<QAAnalysisResult> {
  const analyzer = new QAAnalyzer(sourcePhpPath, generatedFiles, options);
  const result = await analyzer.process();
  
  if (!result.success) {
    throw new Error(`L'analyse QA a échoué: ${result.errors?.map(e => e.message).join(', ')}`);
  }
  
  // Récupérer le résultat QA
  // @ts-ignore - Nous savons que qaResult est défini si l'analyse a réussi
  return analyzer.qaResult;
}

/**
 * Fonction d'aide pour mettre à jour les tags dans un fichier .final.md
 */
export async function updateFinalMdTags(finalMdPath: string, tags: string[]): Promise<void> {
  try {
    if (!await fs.pathExists(finalMdPath)) {
      throw new Error(`Le fichier ${finalMdPath} n'existe pas`);
    }
    
    const content = await fs.readFile(finalMdPath, 'utf-8');
    
    // Vérifier si les tags existent déjà
    const tagsRegex = /\*\*Tags\*\*: (.*?)(?:\n|$)/;
    const tagsMatch = content.match(tagsRegex);
    
    let newContent;
    if (tagsMatch) {
      // Mettre à jour les tags existants
      const existingTags = tagsMatch[1].split(', ');
      
      // Fusionner les tags existants et nouveaux
      const mergedTags = [...new Set([...existingTags, ...tags])];
      
      // Remplacer les tags
      newContent = content.replace(tagsRegex, `**Tags**: ${mergedTags.join(', ')}\n`);
    } else {
      // Ajouter les tags à la fin du fichier
      newContent = content.trim() + `\n\n**Tags**: ${tags.join(', ')}\n`;
    }
    
    // Écrire le contenu mis à jour
    await fs.writeFile(finalMdPath, newContent, 'utf-8');
    console.log(`✅ Tags mis à jour dans ${finalMdPath}`);
  } catch (error: any) {
    console.error(`❌ Erreur lors de la mise à jour des tags: ${error.message}`);
    throw error;
  }
}

// Exécution autonome si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: ts-node QaAnalyzer.ts <source-php-path> <generated-files-json> [options-json]');
    console.error('Exemple: ts-node QaAnalyzer.ts ./src/fiche.php \'{"component":"./app/routes/fiche.tsx","loader":"./app/routes/fiche.loader.ts","meta":"./app/routes/FicheDotmeta.ts"}\'');
    process.exit(1);
  }
  
  const sourcePhpPath = args[0];
  let generatedFiles: Record<string, string>;
  let options: QAAnalyzerOptions = {};
  
  try {
    // Détecter si le second argument est un chemin de fichier JSON ou une chaîne JSON
    if (args[1].endsWith('.json') && fs.existsSync(args[1])) {
      const jsonContent = fs.readFileSync(args[1], 'utf-8');
      generatedFiles = JSON.parse(jsonContent);
    } else {
      generatedFiles = JSON.parse(args[1]);
    }
    
    // Charger les options si fournies
    if (args[2]) {
      if (args[2].endsWith('.json') && fs.existsSync(args[2])) {
        const jsonContent = fs.readFileSync(args[2], 'utf-8');
        options = JSON.parse(jsonContent);
      } else {
        options = JSON.parse(args[2]);
      }
    }
    
    runQAAnalyzer(sourcePhpPath, generatedFiles, options)
      .then(result => {
        console.log(`✅ Analyse QA terminée avec statut: ${result.status}`);
        console.log(`📝 Score: ${result.score}/100`);
        console.log(`📊 Champs: ${result.presentFields.length} présents, ${result.missingFields.length} manquants`);
        console.log(`🚨 Problèmes: ${result.seoIssues.length + result.typeIssues.length + result.validationIssues.length + result.behaviorIssues.length}`);
        console.log(`💡 Recommandations: ${result.recommendations.length}`);
        console.log(`🏷️ Tags: ${result.tags.join(', ')}`);
        
        // Mettre à jour les tags dans le fichier .final.md si disponible
        const finalMdPath = sourcePhpPath.replace(/\.php$/, '.final.md');
        if (fs.existsSync(finalMdPath)) {
          updateFinalMdTags(finalMdPath, result.tags)
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
        } else {
          process.exit(0);
        }
      })
      .catch(error => {
        console.error(`❌ Erreur: ${error.message}`);
        process.exit(1);
      });
  } catch (error: any) {
    console.error(`❌ Erreur lors du parsing des arguments: ${error.message}`);
    process.exit(1);
  }
}