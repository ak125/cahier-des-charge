// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/AbstractAnalyzer-agent';
import { AgentContext } from '../../coreDoDotmcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/AbstractAnalyzer-agent';
import { AgentContext } from '../../coreDoDotmcp-agent';

/**
 * QA Analyzer Agent - Model Context Protocol
 * 
 * Agent spécialisé dans l'analyse et la validation du code migré de PHP vers Remix.
 * Vérifie la correspondance des champs entre le fichier PHP source,
 * les composants Remix générés et le modèle Prisma cible.
 * 
 * Ce code s'intègre avec l'orchestrateur de migration intelligent.
 */

import fs from 'fs-extra';
import path from 'path';
import { parse as parsePhp } from 'php-parser';
import { parse as parseTs } from '@typescript-eslint/typescript-estree';
import { Logger } from '@nestjs/common';
import glob from 'glob';
import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

// Types pour l'analyse QA
interface QaResult {
  [fileName: string]: {
    matchedFields: string[];
    missingFields: string[];
    unexpectedFields: string[];
    score: number;
    status: 'success' | 'partial' | 'failed';
    details?: {
      php?: {
        formFields?: string[];
        displayFields?: string[];
        hiddenFields?: string[];
      };
      tsx?: {
        formFields?: string[];
        displayFields?: string[];
        hiddenFields?: string[];
      };
      prisma?: {
        modelFields?: string[];
      };
    };
  };
}

interface QaConfig {
  minScore: number;
  strict: boolean;
  generateTests: boolean;
  autofixMissing: boolean;
  checkPrisma: boolean;
  outputDir: string;
}

interface AnalysisContext {
  phpFilePath: string;
  tsxFilePath: string;
  loaderFilePath?: string;
  actionFilePath?: string;
  metaFilePath?: string;
  routeId: string;
  modelName?: string;
  qaConfig: QaConfig;
}

/**
 * Agent QA Analyzer qui vérifie la qualité du code migré
 */
export class QaAnalyzer implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent {
  private logger = new Logger('QaAnalyzer');
  private prismaClient: PrismaClient | null = null;
  
  constructor(
    private readonly config: {
      minScore?: number;
      strict?: boolean;
      generateTests?: boolean;
      autofixMissing?: boolean;
      checkPrisma?: boolean;
      outputDir?: string;
      prismaSchemaPath?: string;
    } = {}
  ) {
    // Initialiser la configuration avec les valeurs par défaut
    this.config = {
      minScore: config.minScore ?? 80,
      strict: config.strict ?? true,
      generateTests: config.generateTests ?? true,
      autofixMissing: config.autofixMissing ?? false,
      checkPrisma: config.checkPrisma ?? true,
      outputDir: config.outputDir ?? './qa-reports',
      prismaSchemaPath: config.prismaSchemaPath ?? './prisma/schema.prisma'
    };
  }

  /**
   * Initialise l'agent et les dépendances nécessaires
   */
  async initialize(): Promise<void> {
    this.logger.log('Initialisation du QA Analyzer');
    
    // S'assurer que le répertoire de sortie existe
    await fs.ensureDir(this.config.outputDir as string);
    
    // Initialiser Prisma si la vérification est activée
    if (this.config.checkPrisma) {
      try {
        this.prismaClient = new PrismaClient();
        await this.prismaClient.$connect();
        this.logger.log('Prisma connecté avec succès');
      } catch (error: any) {
        this.logger.warn(`Impossible de connecter Prisma: ${error.message}`);
        this.logger.warn('La vérification Prisma sera désactivée');
        this.config.checkPrisma = false;
      }
    }
  }

  /**
   * Exécute l'analyse QA sur un fichier ou un répertoire
   */
  async run(input: { 
    target: string; 
    options?: { 
      recursive?: boolean; 
      modelName?: string;
      generateTests?: boolean;
    }
  }): Promise<QaResult> {
    await this.initialize();
    
    const { target, options = {} } = input;
    const result: QaResult = {};
    
    try {
      // Vérifier si la cible est un fichier ou un répertoire
      const stats = await fs.stat(target);
      
      if (stats.isFile() && target.endsWith('.tsx')) {
        // Analyser un seul fichier TSX
        const fileResult = await this.analyzeTsxFile(target, options.modelName);
        Object.assign(result, fileResult);
      } else if (stats.isDirectory() && options.recursive) {
        // Analyser tous les fichiers TSX dans le répertoire (récursivement)
        const tsxFiles = glob.sync('**/*.tsx', { cwd: target, absolute: true });
        
        for (const tsxFile of tsxFiles) {
          // Ignorer les fichiers de test
          if (tsxFile.includes('.spec.') || tsxFile.includes('.test.')) continue;
          
          const fileResult = await this.analyzeTsxFile(tsxFile, options.modelName);
          Object.assign(result, fileResult);
        }
      } else {
        throw new Error('La cible doit être un fichier .tsx ou un répertoire (avec option recursive)');
      }
      
      // Générer les tests si demandé
      if (options.generateTests || this.config.generateTests) {
        await this.generateTestsForResults(result);
      }
      
      // Écrire le résultat dans un fichier .qa.json
      const qaOutputPath = path.join(this.config.outputDir as string, `qa-result-${Date.now()}.json`);
      await fs.writeJson(qaOutputPath, result, { spaces: 2 });
      this.logger.log(`Résultats QA enregistrés dans ${qaOutputPath}`);
      
      return result;
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'analyse QA: ${error.message}`);
      throw error;
    } finally {
      // Fermer la connexion Prisma si elle est ouverte
      if (this.prismaClient) {
        await this.prismaClient.$disconnect();
      }
    }
  }

  /**
   * Analyse un fichier TSX et ses fichiers associés (loader, action, meta)
   */
  private async analyzeTsxFile(tsxFilePath: string, modelName?: string): Promise<QaResult> {
    const fileName = path.basename(tsxFilePath);
    const dirPath = path.dirname(tsxFilePath);
    const baseName = fileName.replace('.tsx', '');
    const routeId = this.extractRouteId(tsxFilePath);
    
    this.logger.log(`Analyse de ${fileName} (Route: ${routeId})`);
    
    // Rechercher les fichiers associés
    const loaderFilePath = path.join(dirPath, `${baseName}.loader.ts`);
    const actionFilePath = path.join(dirPath, `${baseName}.action.ts`);
    const metaFilePath = path.join(dirPath, `${baseName}.meta.ts`);
    
    // Déterminer le fichier PHP source (peut être défini dans les commentaires du fichier TSX)
    const phpFilePath = await this.findPhpSourceFile(tsxFilePath, routeId);
    
    if (!phpFilePath) {
      this.logger.warn(`Aucun fichier PHP source trouvé pour ${tsxFilePath}`);
      return {
        [fileName]: {
          matchedFields: [],
          missingFields: [],
          unexpectedFields: [],
          score: 0,
          status: 'failed',
          details: {
            php: {
              formFields: [],
              displayFields: [],
              hiddenFields: []
            },
            tsx: {
              formFields: [],
              displayFields: [],
              hiddenFields: []
            }
          }
        }
      };
    }
    
    // Créer le contexte d'analyse
    const context: AnalysisContext = {
      phpFilePath,
      tsxFilePath,
      loaderFilePath: fs.existsSync(loaderFilePath) ? loaderFilePath : undefined,
      actionFilePath: fs.existsSync(actionFilePath) ? actionFilePath : undefined,
      metaFilePath: fs.existsSync(metaFilePath) ? metaFilePath : undefined,
      routeId,
      modelName,
      qaConfig: this.config as QaConfig
    };
    
    // Déterminer le modèle Prisma si pas spécifié
    if (!modelName && this.config.checkPrisma) {
      context.modelName = await this.inferModelName(context);
    }
    
    // Faire l'analyse comparative
    return await this.performComparison(context);
  }

  /**
   * Extrait l'identifiant de route à partir du chemin du fichier
   */
  private extractRouteId(filePath: string): string {
    // Logique pour extraire l'ID de route
    // Par exemple, "/app/routes/products.$id.tsx" -> "products.$id"
    const routesMatch = filePath.match(/\/routes\/(.+?)\.tsx$/);
    return routesMatch ? routesMatch[1] : path.basename(filePath, '.tsx');
  }

  /**
   * Trouve le fichier PHP source correspondant à un fichier TSX
   */
  private async findPhpSourceFile(tsxFilePath: string, routeId: string): Promise<string | undefined> {
    // 1. Essayer de lire depuis un commentaire dans le fichier TSX
    const tsxContent = await fs.readFile(tsxFilePath, 'utf-8');
    const sourceComment = tsxContent.match(/\/\*\s*@source:\s*([^\s*]+)\s*\*\//);
    
    if (sourceComment && sourceComment[1]) {
      const sourcePath = sourceComment[1];
      if (fs.existsSync(sourcePath)) {
        return sourcePath;
      }
    }
    
    // 2. Essayer de déduire du mapping de routes
    try {
      const routeMappingPath = path.resolve('migration-toolkit/route-mappings.json');
      if (fs.existsSync(routeMappingPath)) {
        const routeMappings = await fs.readJson(routeMappingPath);
        for (const mapping of routeMappings) {
          if (mapping.remix === routeId && fs.existsSync(mapping.php)) {
            return mapping.php;
          }
        }
      }
    } catch (error) {
      // Ignorer les erreurs de mapping et continuer la recherche
    }
    
    // 3. Rechercher via un pattern commun dans le répertoire legacy
    const legacyDir = path.resolve('legacy');
    if (fs.existsSync(legacyDir)) {
      // Convertir le routeId en nom de fichier PHP probable
      const possibleNames = [
        `${routeId.replace(/\.\$/g, '_')}.php`,
        `${routeId.replace(/\.\$/g, '-')}.php`,
        `${routeId.split('.')[0]}.php`
      ];
      
      for (const name of possibleNames) {
        const result = glob.sync(`**/${name}`, { cwd: legacyDir, absolute: true });
        if (result.length > 0) {
          return result[0];
        }
      }
    }
    
    return undefined;
  }

  /**
   * Infère le nom du modèle Prisma à partir du contenu des fichiers
   */
  private async inferModelName(context: AnalysisContext): Promise<string | undefined> {
    // Vérifier dans le fichier loader.ts
    if (context.loaderFilePath) {
      try {
        const loaderContent = await fs.readFile(context.loaderFilePath, 'utf-8');
        
        // Rechercher des appels à prisma.$modelName.findMany, prisma.$modelName.findUnique, etc.
        const prismaCallMatch = loaderContent.match(/prisma\.(\w+)\.(find|create|update|delete)/);
        if (prismaCallMatch) {
          return prismaCallMatch[1];
        }
      } catch (error) {
        // Ignorer les erreurs de lecture du fichier
      }
    }
    
    // Vérifier dans le fichier action.ts
    if (context.actionFilePath) {
      try {
        const actionContent = await fs.readFile(context.actionFilePath, 'utf-8');
        const prismaCallMatch = actionContent.match(/prisma\.(\w+)\.(find|create|update|delete)/);
        if (prismaCallMatch) {
          return prismaCallMatch[1];
        }
      } catch (error) {
        // Ignorer les erreurs de lecture du fichier
      }
    }
    
    // Ou déterminer à partir du nom du fichier
    const fileName = path.basename(context.tsxFilePath, '.tsx');
    const singularName = fileName
      .replace(/s$/, '') // Enlever le 's' final si présent
      .replace(/[._-]/g, '') // Enlever les caractères spéciaux
      .toLowerCase();
    
    // Vérifier si ce nom existe comme modèle Prisma
    if (this.prismaClient) {
      try {
        const models = Object.keys(this.prismaClient).filter(k => !k.startsWith('$') && !k.startsWith('_'));
        const matchingModel = models.find(m => m.toLowerCase() === singularName);
        if (matchingModel) {
          return matchingModel;
        }
      } catch (error) {
        // Ignorer les erreurs d'introspection Prisma
      }
    }
    
    return undefined;
  }

  /**
   * Extrait les champs d'un fichier PHP
   */
  private async extractPhpFields(phpFilePath: string): Promise<{ 
    formFields: string[]; 
    displayFields: string[];
    hiddenFields: string[];
  }> {
    const formFields: string[] = [];
    const displayFields: string[] = [];
    const hiddenFields: string[] = [];
    
    try {
      const phpContent = await fs.readFile(phpFilePath, 'utf-8');
      
      // Analyser la structure HTML pour trouver les champs de formulaire
      const htmlMatches = phpContent.match(/<form[^>]*>[\s\S]*?<\/form>/g);
      if (htmlMatches) {
        for (const htmlBlock of htmlMatches) {
          const $ = cheerio.load(htmlBlock);
          
          // Extraire les champs de formulaire
          $('input, select, textarea').each((_, el) => {
            const name = $(el).attr('name');
            const type = $(el).attr('type');
            
            if (name) {
              // Normaliser le nom du champ (supprimer les crochets pour les tableaux)
              const fieldName = name.replace(/\[\]$/, '');
              
              if (!formFields.includes(fieldName)) {
                formFields.push(fieldName);
                
                // Les champs cachés sont considérés séparément
                if (type === 'hidden') {
                  hiddenFields.push(fieldName);
                }
              }
            }
          });
        }
      }
      
      // Analyser les variables $_ pour détecter d'autres champs
      const getPostVars = phpContent.match(/\$_(?:GET|POST|REQUEST)\[["']([^"']+)["']\]/g);
      if (getPostVars) {
        for (const varMatch of getPostVars) {
          const match = varMatch.match(/\$_(?:GET|POST|REQUEST)\[["']([^"']+)["']\]/);
          if (match && match[1]) {
            const fieldName = match[1];
            if (!formFields.includes(fieldName)) {
              formFields.push(fieldName);
            }
          }
        }
      }
      
      // Rechercher les champs affichés dans le HTML (par exemple, dans des balises span, div, etc.)
      const displayVars = phpContent.match(/(?:<[\w]+[^>]*>)?\s*\$([a-zA-Z0-9_]+)(?:\s*<\/[\w]+>)?/g);
      if (displayVars) {
        for (const varMatch of displayVars) {
          const match = varMatch.match(/\$([a-zA-Z0-9_]+)/);
          if (match && match[1]) {
            const fieldName = match[1];
            // Exclure les variables de contrôle communes
            if (!['i', 'j', 'k', 'key', 'value', 'index', 'item'].includes(fieldName) && 
                !displayFields.includes(fieldName)) {
              displayFields.push(fieldName);
            }
          }
        }
      }
      
      // Rechercher les variables de base de données (p.ex., $row['field_name'])
      const dbVars = phpContent.match(/\$\w+\[["']([^"']+)["']\]/g);
      if (dbVars) {
        for (const varMatch of dbVars) {
          const match = varMatch.match(/\$\w+\[["']([^"']+)["']\]/);
          if (match && match[1]) {
            const fieldName = match[1];
            if (!displayFields.includes(fieldName)) {
              displayFields.push(fieldName);
            }
          }
        }
      }
      
    } catch (error: any) {
      this.logger.warn(`Erreur lors de l'analyse du fichier PHP ${phpFilePath}: ${error.message}`);
    }
    
    return { formFields, displayFields, hiddenFields };
  }

  /**
   * Extrait les champs d'un fichier TSX
   */
  private async extractTsxFields(context: AnalysisContext): Promise<{
    formFields: string[];
    displayFields: string[];
    hiddenFields: string[];
  }> {
    const formFields: string[] = [];
    const displayFields: string[] = [];
    const hiddenFields: string[] = [];
    
    try {
      // Analyser le fichier TSX principal
      const tsxContent = await fs.readFile(context.tsxFilePath, 'utf-8');
      
      // Analyser les champs de formulaire dans le JSX
      const formMatches = tsxContent.match(/<Form[^>]*>[\s\S]*?<\/Form>/g);
      if (formMatches) {
        for (const formBlock of formMatches) {
          const $ = cheerio.load(formBlock, { xmlMode: true });
          
          // Extraire les champs de formulaire (avec gestion des composants React)
          $('input, select, textarea, Input, Select, Textarea').each((_, el) => {
            const name = $(el).attr('name');
            const type = $(el).attr('type');
            
            if (name) {
              const fieldName = name.replace(/\{\s*|\s*\}/g, ''); // Enlever les accolades s'il y en a
              if (!formFields.includes(fieldName)) {
                formFields.push(fieldName);
                
                if (type === 'hidden') {
                  hiddenFields.push(fieldName);
                }
              }
            }
          });
        }
      }
      
      // Analyser les références aux champs dans le fichier TSX
      const jsxFieldRefs = tsxContent.match(/\{(?:\s*data\.([a-zA-Z0-9_]+)\s*|\s*([a-zA-Z0-9_]+)\s*)\}/g);
      if (jsxFieldRefs) {
        for (const refMatch of jsxFieldRefs) {
          const dataMatch = refMatch.match(/data\.([a-zA-Z0-9_]+)/);
          const directMatch = refMatch.match(/\{\s*([a-zA-Z0-9_]+)\s*\}/);
          
          if (dataMatch && dataMatch[1]) {
            const fieldName = dataMatch[1];
            if (!displayFields.includes(fieldName)) {
              displayFields.push(fieldName);
            }
          } else if (directMatch && directMatch[1]) {
            const fieldName = directMatch[1];
            // Exclure les variables React communes
            if (!['children', 'className', 'style', 'key'].includes(fieldName) && 
                !displayFields.includes(fieldName)) {
              displayFields.push(fieldName);
            }
          }
        }
      }
      
      // Analyser le fichier loader.ts s'il existe
      if (context.loaderFilePath && fs.existsSync(context.loaderFilePath)) {
        const loaderContent = await fs.readFile(context.loaderFilePath, 'utf-8');
        
        // Rechercher les champs retournés par le loader
        const returnMatches = loaderContent.match(/return\s*\{[\s\S]*?\}/g);
        if (returnMatches) {
          for (const returnBlock of returnMatches) {
            const fieldMatches = returnBlock.match(/(\w+)(?:\s*:\s*[^,]+)?,/g);
            if (fieldMatches) {
              for (const fieldMatch of fieldMatches) {
                const match = fieldMatch.match(/(\w+)(?:\s*:\s*[^,]+)?,/);
                if (match && match[1]) {
                  const fieldName = match[1];
                  if (!displayFields.includes(fieldName)) {
                    displayFields.push(fieldName);
                  }
                }
              }
            }
          }
        }
      }
      
      // Analyser le fichier action.ts s'il existe
      if (context.actionFilePath && fs.existsSync(context.actionFilePath)) {
        const actionContent = await fs.readFile(context.actionFilePath, 'utf-8');
        
        // Rechercher les champs utilisés dans l'action
        const formDataMatches = actionContent.match(/formData\.get\(["'](\w+)["']\)/g);
        if (formDataMatches) {
          for (const formDataMatch of formDataMatches) {
            const match = formDataMatch.match(/formData\.get\(["'](\w+)["']\)/);
            if (match && match[1]) {
              const fieldName = match[1];
              if (!formFields.includes(fieldName)) {
                formFields.push(fieldName);
              }
            }
          }
        }
      }
      
    } catch (error: any) {
      this.logger.warn(`Erreur lors de l'analyse du fichier TSX ${context.tsxFilePath}: ${error.message}`);
    }
    
    return { formFields, displayFields, hiddenFields };
  }

  /**
   * Extrait les champs d'un modèle Prisma
   */
  private async extractPrismaModelFields(modelName?: string): Promise<string[]> {
    if (!modelName || !this.prismaClient) {
      return [];
    }
    
    try {
      // Obtenir le schéma Prisma pour le modèle spécifié
      const dmmf = (this.prismaClient as any)._dmmf;
      if (!dmmf) return [];
      
      // Rechercher le modèle dans le schéma
      const model = dmmf.datamodel.models.find((m: any) => m.name === modelName);
      if (!model) {
        this.logger.warn(`Modèle Prisma "${modelName}" non trouvé`);
        return [];
      }
      
      // Extraire les noms de champs du modèle
      return model.fields.map((field: any) => field.name);
      
    } catch (error: any) {
      this.logger.warn(`Erreur lors de l'extraction des champs Prisma pour "${modelName}": ${error.message}`);
      return [];
    }
  }

  /**
   * Réalise la comparaison des champs entre PHP, TSX et Prisma
   */
  private async performComparison(context: AnalysisContext): Promise<QaResult> {
    const fileName = path.basename(context.tsxFilePath);
    
    // Extraire les champs des différentes sources
    const phpFields = await this.extractPhpFields(context.phpFilePath);
    const tsxFields = await this.extractTsxFields(context);
    const prismaFields = context.modelName ? 
      await this.extractPrismaModelFields(context.modelName) : [];
    
    // Créer un ensemble unique de tous les champs PHP
    const allPhpFields = [...new Set([
      ...phpFields.formFields,
      ...phpFields.displayFields
    ])];
    
    // Créer un ensemble unique de tous les champs TSX
    const allTsxFields = [...new Set([
      ...tsxFields.formFields,
      ...tsxFields.displayFields
    ])];
    
    // Déterminer les champs correspondants et manquants
    const matchedFields = allPhpFields.filter(field => allTsxFields.includes(field));
    const missingFields = allPhpFields.filter(field => !allTsxFields.includes(field));
    
    // Déterminer les champs inattendus (présents dans TSX mais pas dans PHP)
    // En excluant les champs spéciaux de Remix comme "intent", "redirectTo", etc.
    const remixSpecialFields = ['intent', 'redirectTo', 'returnTo', 'error', 'id', '_action', '_method'];
    const unexpectedFields = allTsxFields.filter(field => 
      !allPhpFields.includes(field) && 
      !remixSpecialFields.includes(field) &&
      (!prismaFields.length || prismaFields.includes(field))
    );
    
    // Calculer le score de qualité
    // Score maximum = 100
    // Chaque champ manquant réduit le score en fonction de l'importance du projet
    const totalRequiredFields = allPhpFields.length;
    const missingFieldsWeight = context.qaConfig.strict ? 1 : 0.5;
    
    // Calcul du score en pourcentage
    let score = 100;
    if (totalRequiredFields > 0) {
      score = Math.max(0, Math.min(100, 
        100 - (missingFields.length / totalRequiredFields) * 100 * missingFieldsWeight
      ));
    }
    score = Math.round(score);
    
    // Déterminer le statut
    let status: 'success' | 'partial' | 'failed' = 'success';
    if (score < 50) {
      status = 'failed';
    } else if (score < context.qaConfig.minScore) {
      status = 'partial';
    }
    
    return {
      [fileName]: {
        matchedFields,
        missingFields,
        unexpectedFields,
        score,
        status,
        details: {
          php: {
            formFields: phpFields.formFields,
            displayFields: phpFields.displayFields,
            hiddenFields: phpFields.hiddenFields
          },
          tsx: {
            formFields: tsxFields.formFields,
            displayFields: tsxFields.displayFields,
            hiddenFields: tsxFields.hiddenFields
          },
          prisma: {
            modelFields: prismaFields
          }
        }
      }
    };
  }

  /**
   * Génère des tests automatiques pour les résultats de l'analyse
   */
  private async generateTestsForResults(results: QaResult): Promise<void> {
    if (!this.config.generateTests) {
      return;
    }
    
    const testsDir = path.join(this.config.outputDir as string, 'tests');
    await fs.ensureDir(testsDir);
    
    // Pour chaque fichier analysé
    for (const [fileName, result] of Object.entries(results)) {
      const baseName = fileName.replace('.tsx', '');
      
      // Générer un test pour le loader
      const loaderTestPath = path.join(testsDir, `${baseName}.loader.spec.ts`);
      const loaderTest = this.generateLoaderTest(baseName, result);
      await fs.writeFile(loaderTestPath, loaderTest);
      
      // Générer un test pour les méta-données
      const metaTestPath = path.join(testsDir, `${baseName}.meta.spec.ts`);
      const metaTest = this.generateMetaTest(baseName, result);
      await fs.writeFile(metaTestPath, metaTest);
    }
    
    this.logger.log(`Tests générés dans ${testsDir}`);
  }

  /**
   * Génère un test pour le loader d'une route
   */
  private generateLoaderTest(baseName: string, result: QaResult[keyof QaResult]): string {
    const { matchedFields, missingFields } = result;
    const fields = [...matchedFields];
    
    // En mode strict, vérifier aussi les champs manquants
    if (!this.config.strict && missingFields.length > 0) {
      fields.push(...missingFields.slice(0, 3)); // Ajouter jusqu'à 3 champs manquants
    }
    
    return `/**
 * Tests générés automatiquement pour ${baseName}.loader
 * Généré par QA-Analyzer le ${new Date().toISOString()}
 */
import { loader } from '../${baseName}.loader';
import { expect, it, describe, vi } from 'vitest';

describe('${baseName} loader', () => {
  it('retourne les données avec les champs requis', async () => {
    // Mock des paramètres de requête
    const request = new Request('http://localhost/test');
    const params = { id: '123' };
    const context = {} as any;
    
    // Appeler le loader
    const result = await loader({ request, params, context });
    
    // Vérifier que les champs requis sont présents
${fields.map(field => `    expect(result).toHaveProperty('${field}');`).join('\n')}
  });
});
`;
  }

  /**
   * Génère un test pour les méta-données d'une route
   */
  private generateMetaTest(baseName: string, result: QaResult[keyof QaResult]): string {
    return `/**
 * Tests générés automatiquement pour ${baseName}.meta
 * Généré par QA-Analyzer le ${new Date().toISOString()}
 */
import { meta } from '../${baseName}.meta';
import { expect, it, describe } from 'vitest';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


describe('${baseName} meta', () => {
  it('retourne des méta-données valides', () => {
    const args = {
      data: {
        // Mock des données nécessaires aux méta-données
${result.matchedFields.slice(0, 3).map(field => `        ${field}: 'Test ${field}',`).join('\n')}
      },
      params: { id: '123' },
      location: { pathname: '/test' }
    } as any;
    
    const metaData = meta(args);
    
    expect(metaData).toBeDefined();
    expect(metaData.title).toBeDefined();
    expect(typeof metaData.title).toBe('string');
  });
});
`;

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

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

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  type: string = '';
  version: string = '1.0.0';
  }

  /**
   * Obtient la version de l'agent
   */
  getVersion(): string {
    return '1.0.0';
  }
}

// Point d'entrée pour exécution directe
if (require.main === module) {
  (async () => {
    try {
      const analyzer = new QaAnalyzer({
        minScore: 80,
        strict: true,
        generateTests: true,
        outputDir: './qa-reports'
      });
      
      const targetPath = process.argv[2];
      
      if (!targetPath) {
        console.error('Usage: node qa-analyzer.js <path-to-tsx-file-or-directory>');
        process.exit(1);
      }
      
      const result = await analyzer.run({
        target: targetPath,
        options: { recursive: true }
      });
      
      console.log('Analyse QA terminée:');
      for (const [file, data] of Object.entries(result)) {
        console.log(`\n${file}:`);
        console.log(`  Score: ${data.score}/100 (${data.status})`);
        console.log(`  Champs correspondants: ${data.matchedFields.length}`);
        console.log(`  Champs manquants: ${data.missingFields.length}`);
        console.log(`  Champs inattendus: ${data.unexpectedFields.length}`);
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      process.exit(1);
    }
  })();
}