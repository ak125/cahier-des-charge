#!/usr/bin/env ts-node
/**
 * 🔎 mcp-verifier.ts — Vérificateur de cohérence pour les fichiers générés par MCP
 * 
 * Cet agent valide les fichiers générés par les agents MCP (.tsx, .loader.ts, .meta.ts, .dto.ts, .zod.ts),
 * en les comparant à une spécification fonctionnelle et typée, et en ajoutant un tag clair
 * à chaque fichier : ✅ Validé, ❌ À corriger, ⏳ À vérifier.
 */

import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import * as glob from 'glob';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { Z_ASCII } from 'zlib';

// Conversion de glob en Promise
const globAsync = promisify(glob.glob);

// Interface pour les options de l'agent
interface VerifierOptions {
  // Préfixe du nom des fichiers à vérifier (ex: "fiche" vérifiera fiche.tsx, fiche.loader.ts, etc.)
  filePrefix?: string;
  
  // Chemin du dossier contenant les fichiers générés
  generatedDir?: string;
  
  // Chemin du dossier contenant les spécifications (*.spec.ts, *.zod.ts)
  specsDir?: string;
  
  // Vérifier tous les fichiers dans le dossier généré
  verifyAll?: boolean;
  
  // Niveau de détail des logs (0-3)
  verbosity?: number;
  
  // Générer un rapport JSON
  generateReport?: boolean;
  
  // Marquer les fichiers avec des tags de commentaires
  addTags?: boolean;
  
  // Effectuer une vérification TypeScript (compilation à sec)
  typeCheck?: boolean;
}

// Interface pour le résultat de la vérification d'un fichier
interface FileVerificationResult {
  // Nom du fichier
  file: string;
  
  // Type de fichier (.tsx, .loader.ts, etc.)
  fileType: string;
  
  // Statut de la vérification
  status: 'success' | 'warning' | 'error' | 'not-found';
  
  // Tags associés au fichier
  tags: string[];
  
  // Messages d'erreur ou d'avertissement
  messages: string[];
  
  // Problèmes de validation détaillés
  validationIssues?: {
    structuralIssues: {
      missingElements: string[];
      unexpectedElements: string[];
    };
    typeIssues: {
      missingTypes: string[];
      incompatibleTypes: string[];
    };
    functionalIssues: {
      missingFunctionality: string[];
      incorrectImplementation: string[];
    }
  };
  
  // Détails de vérification par rapport à la spécification
  specVerification?: {
    specFile: string;
    matchPercentage: number;
    matchDetails: {
      types: { matched: boolean; details?: string };
      props: { matched: boolean; details?: string };
      exports: { matched: boolean; details?: string };
      imports: { matched: boolean; details?: string };
    }
  };
}

// Interface pour le rapport global
interface VerificationReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    verifiedFiles: number;
    warningFiles: number;
    errorFiles: number;
    notFoundFiles: number;
  };
  fileResults: {
    [filePrefix: string]: {
      status: string;
      tags: string[];
      results: {
        [fileType: string]: FileVerificationResult
      }
    }
  };
}

/**
 * Agent de vérification de cohérence pour les fichiers générés par MCP
 */
export const mcpVerifier = {
  name: 'mcp-verifier',
  description: 'Vérifie la cohérence des fichiers générés par MCP',
  
  /**
   * Point d'entrée principal de l'agent
   */
  async run(options: VerifierOptions = {}) {
    // Initialiser les logs
    const logs: string[] = [];
    const verbosity = options.verbosity || 1;
    
    // Log avec niveau de détail
    const log = (message: string, level = 1) => {
      if (level <= verbosity) {
        logs.push(message);
        if (level <= 2) console.log(message);
      }
    };
    
    try {
      log(`🚀 Démarrage de l'agent MCP Verifier`, 1);
      
      // Paramètres par défaut
      const generatedDir = options.generatedDir || './apps/frontend/app/generated';
      const specsDir = options.specsDir || './apps/frontend/app/specs';
      
      // Structure pour le rapport global
      const report: VerificationReport = {
        timestamp: new Date().toISOString(),
        summary: {
          totalFiles: 0,
          verifiedFiles: 0,
          warningFiles: 0,
          errorFiles: 0,
          notFoundFiles: 0
        },
        fileResults: {}
      };
      
      // Déterminer quels fichiers vérifier
      let filePrefixes: string[] = [];
      
      if (options.filePrefix) {
        // Vérifier un préfixe spécifique
        filePrefixes = [options.filePrefix];
        log(`📄 Vérification des fichiers avec préfixe: ${options.filePrefix}`, 1);
      } else if (options.verifyAll) {
        // Vérifier tous les fichiers dans le dossier généré
        log(`🔍 Recherche de tous les fichiers générés dans ${generatedDir}`, 1);
        
        // Trouver tous les fichiers .tsx et extraire leurs préfixes
        const tsxFiles = await globAsync(`${generatedDir}/**/*.tsx`);
        const prefixes = new Set<string>();
        
        for (const file of tsxFiles) {
          const basename = path.basename(file, '.tsx');
          // Ignorer les fichiers avec .d.ts, .test.ts, .spec.ts, etc.
          if (!basename.includes('.')) {
            prefixes.add(basename);
          }
        }
        
        filePrefixes = Array.from(prefixes);
        log(`🔍 ${filePrefixes.length} préfixes de fichiers trouvés`, 1);
      } else {
        log(`❌ Erreur: Aucun filePrefix spécifié et verifyAll n'est pas activé`, 1);
        return { 
          status: 'error', 
          logs, 
          error: 'Aucun fichier spécifié à vérifier. Utilisez filePrefix ou verifyAll.' 
        };
      }
      
      // Vérifier chaque préfixe de fichier
      for (const filePrefix of filePrefixes) {
        log(`\n📝 Vérification du groupe: ${filePrefix}`, 1);
        
        const fileTypes = ['.tsx', '.loader.ts', '.meta.ts', '.dto.ts', '.zod.ts'];
        const fileResults: { [fileType: string]: FileVerificationResult } = {};
        let groupStatus = 'success';
        const groupTags: string[] = [];
        
        // Vérifier chaque type de fichier
        for (const fileType of fileTypes) {
          const filePath = path.join(generatedDir, `${filePrefix}${fileType}`);
          
          log(`🔍 Vérification de ${filePath}`, 2);
          
          // Vérifier si le fichier existe
          if (!fs.existsSync(filePath)) {
            log(`⚠️ Fichier non trouvé: ${filePath}`, 2);
            
            fileResults[fileType] = {
              file: filePath,
              fileType,
              status: 'not-found',
              tags: ['⏳ À vérifier', '❓ Fichier manquant'],
              messages: [`Fichier ${filePrefix}${fileType} non trouvé dans ${generatedDir}`]
            };
            
            report.summary.notFoundFiles++;
            
            // Mettre à jour le statut du groupe si nécessaire
            if (groupStatus === 'success') {
              groupStatus = 'warning';
              if (!groupTags.includes('⏳ À vérifier')) {
                groupTags.push('⏳ À vérifier');
              }
            }
            
            continue;
          }
          
          // Lire le contenu du fichier
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          
          // Résultat initial de la vérification
          const result: FileVerificationResult = {
            file: filePath,
            fileType,
            status: 'success',
            tags: ['✅ Validé'],
            messages: [],
            validationIssues: {
              structuralIssues: {
                missingElements: [],
                unexpectedElements: []
              },
              typeIssues: {
                missingTypes: [],
                incompatibleTypes: []
              },
              functionalIssues: {
                missingFunctionality: [],
                incorrectImplementation: []
              }
            }
          };
          
          // 1. Vérification des problèmes de compilation TypeScript
          if (options.typeCheck) {
            const typeCheckResult = this.performTypeCheck(filePath);
            
            if (typeCheckResult.errors.length > 0) {
              result.status = 'error';
              result.tags = ['❌ À corriger'];
              result.messages = [...result.messages, ...typeCheckResult.errors];
              
              // Ajouter des détails aux problèmes de type
              for (const error of typeCheckResult.errors) {
                if (error.includes('Type') && error.includes('is not assignable')) {
                  result.validationIssues!.typeIssues.incompatibleTypes.push(error);
                }
              }
              
              log(`❌ Erreurs TypeScript dans ${filePrefix}${fileType}`, 1);
            } else {
              log(`✓ Pas d'erreur TypeScript dans ${filePrefix}${fileType}`, 2);
            }
          }
          
          // 2. Vérification de structure selon le type de fichier
          switch (fileType) {
            case '.tsx':
              this.verifyTsxFile(fileContent, result, filePrefix);
              break;
            case '.loader.ts':
              this.verifyLoaderFile(fileContent, result, filePrefix);
              break;
            case '.meta.ts':
              this.verifyMetaFile(fileContent, result, filePrefix);
              break;
            case '.dto.ts':
              this.verifyDtoFile(fileContent, result, filePrefix);
              break;
            case '.zod.ts':
              this.verifyZodFile(fileContent, result, filePrefix);
              break;
          }
          
          // 3. Vérification par rapport à la spécification
          // Chercher s'il existe un fichier de spec correspondant
          const specFile = path.join(specsDir, `${filePrefix}${fileType.replace('.ts', '.spec.ts')}`);
          
          if (fs.existsSync(specFile)) {
            log(`📝 Spécification trouvée: ${specFile}`, 2);
            const specContent = fs.readFileSync(specFile, 'utf-8');
            this.verifyAgainstSpec(fileContent, specContent, result);
          } else {
            log(`ℹ️ Pas de spécification pour ${filePrefix}${fileType}`, 2);
          }
          
          // Déterminer le statut final du fichier
          if (result.messages.length > 0) {
            if (result.status === 'success') {
              result.status = 'warning';
              result.tags = ['⏳ À vérifier'];
            }
            
            // Mettre à jour le statut du groupe si nécessaire
            if (groupStatus === 'success') {
              groupStatus = 'warning';
              if (!groupTags.includes('⏳ À vérifier')) {
                groupTags.push('⏳ À vérifier');
              }
            } else if (result.status === 'error' && groupStatus !== 'error') {
              groupStatus = 'error';
              if (!groupTags.includes('❌ À corriger')) {
                groupTags.push('❌ À corriger');
              }
            }
          }
          
          // Si demandé, ajouter des tags au fichier sous forme de commentaires
          if (options.addTags && result.tags.length > 0) {
            this.addTagsToFile(filePath, fileContent, result.tags[0]);
          }
          
          // Enregistrer le résultat
          fileResults[fileType] = result;
          
          // Mettre à jour les compteurs du rapport
          report.summary.totalFiles++;
          switch (result.status) {
            case 'success': report.summary.verifiedFiles++; break;
            case 'warning': report.summary.warningFiles++; break;
            case 'error': report.summary.errorFiles++; break;
          }
          
          log(`${result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'} ${filePrefix}${fileType} - ${result.tags.join(', ')}`, 1);
        }
        
        // Enregistrer les résultats pour ce groupe de fichiers
        report.fileResults[filePrefix] = {
          status: groupStatus,
          tags: groupTags.length > 0 ? groupTags : ['✅ Validé'],
          results: fileResults
        };
        
        // Générer un rapport JSON pour ce groupe
        if (options.generateReport) {
          const reportDir = path.join(generatedDir, 'reports');
          if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
          }
          
          const reportPath = path.join(reportDir, `${filePrefix}.verification_report.json`);
          fs.writeFileSync(reportPath, JSON.stringify({
            file: filePrefix,
            status: report.fileResults[filePrefix].status,
            tags: report.fileResults[filePrefix].tags,
            results: Object.values(fileResults).map(result => ({
              fileType: result.fileType,
              status: result.status,
              tags: result.tags,
              messages: result.messages
            }))
          }, null, 2));
          
          log(`📊 Rapport généré: ${reportPath}`, 1);
        }
      }
      
      // Rapport global
      if (options.generateReport) {
        const globalReportPath = path.join(generatedDir, 'verification_report.json');
        fs.writeFileSync(globalReportPath, JSON.stringify(report, null, 2));
        log(`📊 Rapport global généré: ${globalReportPath}`, 1);
      }
      
      // Rapport de synthèse
      log('\n📋 Synthèse de la vérification:', 1);
      log(`   Total des fichiers vérifiés: ${report.summary.totalFiles}`, 1);
      log(`   ✅ Validés: ${report.summary.verifiedFiles}`, 1);
      log(`   ⚠️ Avec avertissements: ${report.summary.warningFiles}`, 1);
      log(`   ❌ Avec erreurs: ${report.summary.errorFiles}`, 1);
      log(`   ❓ Non trouvés: ${report.summary.notFoundFiles}`, 1);
      
      return {
        status: 'success',
        logs,
        report,
        summary: report.summary
      };
    } catch (err: any) {
      log(`❌ Erreur: ${err.message}`, 1);
      return {
        status: 'error',
        logs,
        error: err.message
      };
    }
  },
  
  /**
   * Effectue une vérification TypeScript (compilation à sec)
   */
  performTypeCheck(filePath: string) {
    try {
      const program = ts.createProgram([filePath], {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        noEmit: true
      });
      
      const diagnostics = ts.getPreEmitDiagnostics(program);
      
      if (diagnostics.length === 0) {
        return { success: true, errors: [] };
      }
      
      const formatHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: path => path,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine
      };
      
      const errors = diagnostics.map(diagnostic => {
        if (diagnostic.file) {
          const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          return `Ligne ${line + 1}, Caractère ${character + 1}: ${message}`;
        } else {
          return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        }
      });
      
      return { success: false, errors };
    } catch (err: any) {
      return { success: false, errors: [err.message] };
    }
  },
  
  /**
   * Vérifie un fichier TSX (composant Remix)
   */
  verifyTsxFile(content: string, result: FileVerificationResult, filePrefix: string) {
    // Vérifier la présence d'un composant React par défaut
    if (!content.includes('export default function') && !content.includes('export default ')) {
      result.status = 'error';
      result.tags = ['❌ À corriger'];
      result.messages.push('Le fichier TSX ne contient pas d\'export par défaut');
      result.validationIssues!.structuralIssues.missingElements.push('export default function');
    }
    
    // Vérifier l'utilisation de useLoaderData si un loader existe
    if (fs.existsSync(path.join(path.dirname(result.file), `${filePrefix}.loader.ts`))) {
      if (!content.includes('useLoaderData')) {
        result.status = 'warning';
        if (!result.tags.includes('⏳ À vérifier')) {
          result.tags = ['⏳ À vérifier'];
        }
        result.messages.push('Le fichier TSX n\'utilise pas useLoaderData alors qu\'un loader existe');
        result.validationIssues!.functionalIssues.missingFunctionality.push('useLoaderData');
      }
    }
    
    // Vérifier que le fichier contient du JSX (balises)
    if (!content.includes('<') || !content.includes('>')) {
      result.status = 'warning';
      if (!result.tags.includes('⏳ À vérifier')) {
        result.tags = ['⏳ À vérifier'];
      }
      result.messages.push('Le fichier TSX ne semble pas contenir de JSX');
      result.validationIssues!.functionalIssues.missingFunctionality.push('JSX markup');
    }
    
    // Vérifier l'import des types du loader si applicable
    if (fs.existsSync(path.join(path.dirname(result.file), `${filePrefix}.loader.ts`))) {
      const loaderTypePattern = new RegExp(`import\\s+{\\s*.*LoaderData.*\\s*}\\s+from`);
      if (!loaderTypePattern.test(content)) {
        result.validationIssues!.typeIssues.missingTypes.push('LoaderData type import');
      }
    }
    
    // Vérifier les imports des composants UI
    const uiImportPattern = /import.*from\s+['"]~\/components\/ui/;
    if (!uiImportPattern.test(content)) {
      result.validationIssues!.structuralIssues.missingElements.push('UI component imports');
    }
  },
  
  /**
   * Vérifie un fichier loader.ts (Remix loader)
   */
  verifyLoaderFile(content: string, result: FileVerificationResult, filePrefix: string) {
    // Vérifier l'export d'une fonction loader
    if (!content.includes('export const loader') && !content.includes('export async function loader')) {
      result.status = 'error';
      result.tags = ['❌ À corriger'];
      result.messages.push('Le fichier loader ne contient pas d\'export de fonction loader');
      result.validationIssues!.structuralIssues.missingElements.push('export const loader');
    }
    
    // Vérifier l'export de LoaderData
    if (!content.includes('export type LoaderData') && !content.includes('export interface LoaderData')) {
      result.validationIssues!.typeIssues.missingTypes.push('LoaderData type export');
    }
    
    // Vérifier l'utilisation de json/redirect de Remix
    if (!content.includes('json(') && !content.includes('redirect(')) {
      result.validationIssues!.functionalIssues.missingFunctionality.push('json() or redirect() from Remix');
    }
    
    // Vérifier l'appel à fetch ou à des services de données
    const fetchPattern = /fetch\(|service\.|api\.|load|get|find|prisma\./;
    if (!fetchPattern.test(content)) {
      result.status = 'warning';
      if (!result.tags.includes('⏳ À vérifier')) {
        result.tags = ['⏳ À vérifier'];
      }
      result.messages.push('Le loader ne semble pas effectuer de requête de données');
      result.validationIssues!.functionalIssues.missingFunctionality.push('Data fetching (API call, service, Prisma)');
    }
    
    // Vérifier la gestion d'erreur
    if (!content.includes('try') || !content.includes('catch')) {
      result.validationIssues!.functionalIssues.missingFunctionality.push('Error handling (try/catch)');
    }
    
    // Vérifier l'utilisation des schémas Zod si applicable
    if (fs.existsSync(path.join(path.dirname(result.file), `${filePrefix}.zod.ts`))) {
      if (!content.includes('.parse(') && !content.includes('.safeParse(')) {
        result.validationIssues!.functionalIssues.missingFunctionality.push('Zod schema validation');
      }
    }
  },
  
  /**
   * Vérifie un fichier meta.ts (Remix meta)
   */
  verifyMetaFile(content: string, result: FileVerificationResult, filePrefix: string) {
    // Vérifier l'export d'une fonction meta
    if (!content.includes('export const meta') && !content.includes('export function meta') && !content.includes('export default')) {
      result.status = 'error';
      result.tags = ['❌ À corriger'];
      result.messages.push('Le fichier meta ne contient pas d\'export de fonction meta');
      result.validationIssues!.structuralIssues.missingElements.push('export meta function');
    }
    
    // Vérifier la présence de balises meta essentielles
    const requiredMetaTags = ['title'];
    const recommendedMetaTags = ['description', 'keywords', 'canonical'];
    
    for (const tag of requiredMetaTags) {
      if (!content.includes(`"${tag}"`) && !content.includes(`'${tag}'`)) {
        result.status = 'error';
        result.tags = ['❌ À corriger'];
        result.messages.push(`La balise meta "${tag}" est manquante`);
        result.validationIssues!.structuralIssues.missingElements.push(`"${tag}" meta tag`);
      }
    }
    
    for (const tag of recommendedMetaTags) {
      if (!content.includes(`"${tag}"`) && !content.includes(`'${tag}'`)) {
        result.validationIssues!.structuralIssues.missingElements.push(`"${tag}" meta tag (recommended)`);
      }
    }
  },
  
  /**
   * Vérifie un fichier dto.ts (Data Transfer Object)
   */
  verifyDtoFile(content: string, result: FileVerificationResult, filePrefix: string) {
    // Vérifier la présence d'au moins une classe ou interface
    if (!content.includes('class ') && !content.includes('interface ')) {
      result.status = 'error';
      result.tags = ['❌ À corriger'];
      result.messages.push('Le fichier DTO ne contient ni classe ni interface');
      result.validationIssues!.structuralIssues.missingElements.push('class or interface definition');
    }
    
    // Vérifier la présence de décorateurs NestJS pour API (si c'est un DTO NestJS)
    const nestDecorators = ['@ApiProperty', '@IsString', '@IsNumber', '@IsBoolean', '@IsDate', '@IsOptional'];
    const hasNestDecorators = nestDecorators.some(dec => content.includes(dec));
    
    if (content.includes('import') && content.includes('@nestjs/') && !hasNestDecorators) {
      result.status = 'warning';
      if (!result.tags.includes('⏳ À vérifier')) {
        result.tags = ['⏳ À vérifier'];
      }
      result.messages.push('Le DTO NestJS ne contient pas de décorateurs de validation');
      result.validationIssues!.structuralIssues.missingElements.push('Validation decorators (@ApiProperty, etc.)');
    }
    
    // Vérifier correspondance avec schéma Zod si applicable
    if (fs.existsSync(path.join(path.dirname(result.file), `${filePrefix}.zod.ts`))) {
      const zodContent = fs.readFileSync(path.join(path.dirname(result.file), `${filePrefix}.zod.ts`), 'utf-8');
      
      // Extraction des propriétés du DTO
      const dtoPropsPattern = /(\w+)(\??)\s*:\s*(\w+)/g;
      const dtoProps = Array.from(content.matchAll(dtoPropsPattern)).map(m => m[1]);
      
      // Extraction des propriétés du schéma Zod
      const zodPropsPattern = /\.?(\w+)\s*:.*z\./g;
      const zodProps = Array.from(zodContent.matchAll(zodPropsPattern)).map(m => m[1]);
      
      // Vérifier la correspondance
      const missingInDto = zodProps.filter(prop => !dtoProps.includes(prop));
      const missingInZod = dtoProps.filter(prop => !zodProps.includes(prop));
      
      if (missingInDto.length > 0) {
        result.validationIssues!.typeIssues.missingTypes.push(`Properties defined in Zod but missing in DTO: ${missingInDto.join(', ')}`);
      }
      
      if (missingInZod.length > 0) {
        result.validationIssues!.typeIssues.missingTypes.push(`Properties defined in DTO but missing in Zod: ${missingInZod.join(', ')}`);
      }
    }
  },
  
  /**
   * Vérifie un fichier zod.ts (schéma de validation Zod)
   */
  verifyZodFile(content: string, result: FileVerificationResult, filePrefix: string) {
    // Vérifier l'import de Zod
    if (!content.includes('import { z }') && !content.includes('import z ')) {
      result.status = 'error';
      result.tags = ['❌ À corriger'];
      result.messages.push('Le fichier Zod ne contient pas d\'import de la bibliothèque Zod');
      result.validationIssues!.structuralIssues.missingElements.push('import { z } from "zod"');
    }
    
    // Vérifier l'export d'au moins un schéma
    const pascalCase = filePrefix.charAt(0).toUpperCase() + filePrefix.slice(1);
    const camelCase = filePrefix.charAt(0).toLowerCase() + filePrefix.slice(1);
    
    if (!content.includes(`export const ${pascalCase}Schema`) && 
        !content.includes(`export const ${camelCase}Schema`) && 
        !content.includes('export const schema') &&
        !content.includes('export default')) {
      result.status = 'error';
      result.tags = ['❌ À corriger'];
      result.messages.push('Le fichier Zod ne contient pas d\'export de schéma');
      result.validationIssues!.structuralIssues.missingElements.push(`export const ${camelCase}Schema`);
    }
    
    // Vérifier la présence de différentes variantes du schéma (création, mise à jour)
    const schemaVariants = ['CreateSchema', 'UpdateSchema', 'ResponseSchema'];
    let foundVariants = 0;
    
    for (const variant of schemaVariants) {
      if (content.includes(`${pascalCase}${variant}`) || content.includes(`${camelCase}${variant}`)) {
        foundVariants++;
      }
    }
    
    if (foundVariants === 0) {
      result.validationIssues!.structuralIssues.missingElements.push(`Schema variants (CreateSchema, UpdateSchema, etc.)`);
    }
    
    // Vérifier l'export des types dérivés
    if (!content.includes('export type') && !content.includes('export interface')) {
      result.validationIssues!.typeIssues.missingTypes.push(`Derived types (export type)`);
    }
  },
  
  /**
   * Vérifie un fichier par rapport à sa spécification
   */
  verifyAgainstSpec(fileContent: string, specContent: string, result: FileVerificationResult) {
    // Cette fonction pourrait être étendue pour effectuer une vérification plus sophistiquée
    // Pour l'instant, on effectue des vérifications de base
    
    // Structure pour les détails de vérification
    result.specVerification = {
      specFile: result.file.replace('.ts', '.spec.ts').replace('.tsx', '.spec.tsx'),
      matchPercentage: 100, // Par défaut
      matchDetails: {
        types: { matched: true },
        props: { matched: true },
        exports: { matched: true },
        imports: { matched: true }
      }
    };
    
    // 1. Extraire les exports de la spec et du fichier
    const specExports = this.extractExports(specContent);
    const fileExports = this.extractExports(fileContent);
    
    // Vérifier que tous les exports de la spec sont présents dans le fichier
    const missingExports = specExports.filter(exp => !fileExports.includes(exp));
    
    if (missingExports.length > 0) {
      result.status = 'warning';
      if (!result.tags.includes('⏳ À vérifier')) {
        result.tags = ['⏳ À vérifier'];
      }
      result.messages.push(`Exports manquants par rapport à la spec: ${missingExports.join(', ')}`);
      result.specVerification.matchDetails.exports = { 
        matched: false, 
        details: `Missing exports: ${missingExports.join(', ')}` 
      };
      result.specVerification.matchPercentage -= 20 * (missingExports.length / specExports.length);
    }
    
    // 2. Extraire les imports et vérifier leur présence
    const specImports = this.extractImports(specContent);
    const fileImports = this.extractImports(fileContent);
    
    // Seuls les imports essentiels devraient être vérifiés
    const essentialImports = specImports.filter(imp => 
      !imp.includes('test') && 
      !imp.includes('jest') &&
      !imp.includes('mock') &&
      !imp.includes('spec') 
    );
    
    const missingImports = essentialImports.filter(imp => 
      !fileImports.some(fimp => fimp.includes(imp.split(' from ')[1]))
    );
    
    if (missingImports.length > 0) {
      result.validationIssues!.structuralIssues.missingElements.push(`Essential imports: ${missingImports.join(', ')}`);
      result.specVerification.matchDetails.imports = { 
        matched: false, 
        details: `Missing imports: ${missingImports.join(', ')}` 
      };
      result.specVerification.matchPercentage -= 10 * (missingImports.length / essentialImports.length);
    }
    
    // 3. Extraire les types et vérifier leur présence
    const specTypes = this.extractTypes(specContent);
    const fileTypes = this.extractTypes(fileContent);
    
    const missingTypes = specTypes.filter(type => !fileTypes.includes(type));
    
    if (missingTypes.length > 0) {
      result.validationIssues!.typeIssues.missingTypes.push(`Types from spec: ${missingTypes.join(', ')}`);
      result.specVerification.matchDetails.types = { 
        matched: false, 
        details: `Missing types: ${missingTypes.join(', ')}` 
      };
      result.specVerification.matchPercentage -= 20 * (missingTypes.length / specTypes.length);
    }
    
    // 4. Extraire les props des composants React
    if (result.file.endsWith('.tsx')) {
      const specProps = this.extractProps(specContent);
      const fileProps = this.extractProps(fileContent);
      
      const missingProps = specProps.filter(prop => !fileProps.includes(prop));
      
      if (missingProps.length > 0) {
        result.validationIssues!.structuralIssues.missingElements.push(`Props from spec: ${missingProps.join(', ')}`);
        result.specVerification.matchDetails.props = { 
          matched: false, 
          details: `Missing props: ${missingProps.join(', ')}` 
        };
        result.specVerification.matchPercentage -= 20 * (missingProps.length / specProps.length);
      }
    }
    
    // Ajuster le statut en fonction du pourcentage de correspondance
    if (result.specVerification.matchPercentage < 60) {
      result.status = 'error';
      result.tags = ['❌ À corriger'];
      result.messages.push(`Faible correspondance avec la spécification (${Math.round(result.specVerification.matchPercentage)}%)`);
    } else if (result.specVerification.matchPercentage < 90) {
      result.status = 'warning';
      if (!result.tags.includes('⏳ À vérifier')) {
        result.tags = ['⏳ À vérifier'];
      }
      result.messages.push(`Correspondance partielle avec la spécification (${Math.round(result.specVerification.matchPercentage)}%)`);
    }
  },
  
  /**
   * Extrait les exports d'un fichier TypeScript
   */
  extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportPattern = /export\s+(const|let|var|function|class|interface|type|enum|default)\s+(\w+)/g;
    
    let match;
    while ((match = exportPattern.exec(content)) !== null) {
      exports.push(match[2]);
    }
    
    return exports;
  },
  
  /**
   * Extrait les imports d'un fichier TypeScript
   */
  extractImports(content: string): string[] {
    const imports: string[] = [];
    const importPattern = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[0]);
    }
    
    return imports;
  },
  
  /**
   * Extrait les types d'un fichier TypeScript
   */
  extractTypes(content: string): string[] {
    const types: string[] = [];
    const typePatterns = [
      /interface\s+(\w+)/g,
      /type\s+(\w+)\s*=/g,
      /class\s+(\w+)/g,
      /enum\s+(\w+)/g
    ];
    
    for (const pattern of typePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        types.push(match[1]);
      }
    }
    
    return types;
  },
  
  /**
   * Extrait les props d'un composant React
   */
  extractProps(content: string): string[] {
    const props: string[] = [];
    
    // Chercher les interfaces de props
    const propsInterfacePattern = /interface\s+(\w+Props)\s*{([^}]*)}/g;
    let match;
    
    while ((match = propsInterfacePattern.exec(content)) !== null) {
      const propsContent = match[2];
      const propPattern = /(\w+)(\??)\s*:/g;
      
      let propMatch;
      while ((propMatch = propPattern.exec(propsContent)) !== null) {
        props.push(propMatch[1]);
      }
    }
    
    // Chercher aussi les props destructurées dans les fonctions
    const destructuredPropsPattern = /function\s+\w+\(\{\s*(.*?)\s*\}/g;
    
    while ((match = destructuredPropsPattern.exec(content)) !== null) {
      const propsContent = match[1];
      const propNames = propsContent.split(',').map(p => p.trim().split(':')[0].trim());
      
      for (const prop of propNames) {
        if (prop && !props.includes(prop)) {
          props.push(prop);
        }
      }
    }
    
    return props;
  },
  
  /**
   * Ajoute un tag au début d'un fichier sous forme de commentaire
   */
  addTagsToFile(filePath: string, content: string, tag: string): void {
    // Vérifier si le tag existe déjà
    if (content.includes(`/* ${tag}`)) {
      return;
    }
    
    // Récupérer la date actuelle
    const now = new Date().toISOString();
    
    // Créer le commentaire avec le tag
    const tagComment = `/* ${tag} - Vérifié le ${now} */\n`;
    
    // Ajouter le commentaire au début du fichier
    const updatedContent = tagComment + content;
    
    // Écrire le contenu mis à jour
    fs.writeFileSync(filePath, updatedContent);
  }
};

/**
 * Fonction principale (pour utilisation en ligne de commande)
 */
async function main() {
  // Extraire les arguments de ligne de commande
  const args = process.argv.slice(2);
  const options: VerifierOptions = {};
  
  // Traiter les arguments de base
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file' && i + 1 < args.length) {
      options.filePrefix = args[++i];
    } else if (arg === '--dir' && i + 1 < args.length) {
      options.generatedDir = args[++i];
    } else if (arg === '--specs' && i + 1 < args.length) {
      options.specsDir = args[++i];
    } else if (arg === '--all') {
      options.verifyAll = true;
    } else if (arg === '--report') {
      options.generateReport = true;
    } else if (arg === '--tags') {
      options.addTags = true;
    } else if (arg === '--type-check') {
      options.typeCheck = true;
    } else if (arg === '--verbose') {
      options.verbosity = 3;
    } else if (arg === '--quiet') {
      options.verbosity = 1;
    } else if (arg.startsWith('--')) {
      console.log(`Option non reconnue: ${arg}`);
    }
  }
  
  console.log(`🚀 Démarrage de MCP Verifier avec options:`, options);
  
  try {
    const result = await mcpVerifier.run(options);
    
    // Afficher le résultat
    if (result.status === 'success') {
      console.log('\n✅ Vérification terminée avec succès');
      console.log(`   Total: ${result.summary.totalFiles}`);
      console.log(`   ✅ Validés: ${result.summary.verifiedFiles}`);
      console.log(`   ⚠️ Avec avertissements: ${result.summary.warningFiles}`);
      console.log(`   ❌ Avec erreurs: ${result.summary.errorFiles}`);
      console.log(`   ❓ Non trouvés: ${result.summary.notFoundFiles}`);
      
      // Sortir avec un code d'erreur si des fichiers ont des problèmes
      if (result.summary.errorFiles > 0) {
        process.exit(2);
      } else if (result.summary.warningFiles > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } else {
      console.error(`❌ Erreur: ${result.error}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Erreur non gérée: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

// Si le script est exécuté directement
if (require.main === module) {
  main();
}