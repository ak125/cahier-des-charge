// Déclaration explicite pour que TypeScript trouve les modules
/// <reference types="n8n-workflow" />
/// <reference types="glob" />

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as child_process from 'child_process';

// Interface pour le rapport de validation
interface ValidationReport {
  missingFiles: {
    sourcePath: string;
    missingTypes: string[];
  }[];
  inconsistentFields: {
    sourcePath: string;
    fieldName: string;
    values: { [key: string]: string };
  }[];
  duplicateAnalyses: {
    slug: string;
    files: string[];
  }[];
  timestamp: string;
}

// Interface pour le rapport de retraitement
interface RecheckReport {
  timestamp: string;
  successful: string[];
  failed: string[];
  notFound: string[];
}

export class AuditValidator implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Audit Validator',
    name: 'auditValidator',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Valide et corrige automatiquement les fichiers d\'audit',
    defaults: {
      name: 'Audit Validator',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Opération',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Valider les audits',
            value: 'validate',
            description: 'Vérifie la cohérence des fichiers d\'audit',
          },
          {
            name: 'Corriger automatiquement',
            value: 'autoFix',
            description: 'Tente de corriger automatiquement les problèmes détectés',
          },
          {
            name: 'Vérifier et corriger',
            value: 'validateAndFix',
            description: 'Vérifie puis corrige si nécessaire',
          }
        ],
        default: 'validate',
        description: 'L\'opération à effectuer',
        required: true,
      },
      {
        displayName: 'Chemin de base',
        name: 'basePath',
        type: 'string',
        default: '/workspaces/cahier-des-charge',
        description: 'Chemin de base du projet',
        required: true,
      },
      {
        displayName: 'Mode verbeux',
        name: 'verbose',
        type: 'boolean',
        default: false,
        description: 'Si activé, affiche des informations détaillées',
      },
      {
        displayName: 'Force la correction',
        name: 'force',
        type: 'boolean',
        default: false,
        description: 'Si activé, force la correction même si aucun problème n\'est détecté',
        displayOptions: {
          show: {
            operation: ['autoFix', 'validateAndFix'],
          },
        },
      },
      {
        displayName: 'Dossier de rapports',
        name: 'reportFolder',
        type: 'string',
        default: 'reports',
        description: 'Dossier où stocker les rapports générés',
      }
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | null> {
    const items = this.getInputData();
    const operation = this.getNodeParameter('operation', 0) as string;
    const basePath = this.getNodeParameter('basePath', 0) as string;
    const verbose = this.getNodeParameter('verbose', 0) as boolean;
    const reportFolder = this.getNodeParameter('reportFolder', 0) as string;
    
    const returnData: INodeExecutionData[] = [];
    
    // Création du dossier de rapports s'il n'existe pas
    const reportPath = path.join(basePath, reportFolder);
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        if (operation === 'validate' || operation === 'validateAndFix') {
          // Exécuter la validation
          const validationResult = await runValidation(basePath, verbose, reportPath);
          
          if (operation === 'validateAndFix' && 
              (validationResult.hasIssues || this.getNodeParameter('force', i) as boolean)) {
            // Si on trouve des problèmes et qu'on est en mode validateAndFix, on lance la correction
            const fixResult = await runAutoFix(basePath, true, reportPath);
            returnData.push({
              json: {
                ...item.json,
                validation: validationResult,
                autoFix: fixResult,
                timestamp: new Date().toISOString(),
                operation: 'validateAndFix'
              }
            });
          } else {
            // Sinon on retourne juste les résultats de validation
            returnData.push({
              json: {
                ...item.json,
                validation: validationResult,
                timestamp: new Date().toISOString(),
                operation: 'validate'
              }
            });
          }
        } else if (operation === 'autoFix') {
          // Exécuter uniquement la correction automatique
          const force = this.getNodeParameter('force', i) as boolean;
          const fixResult = await runAutoFix(basePath, force, reportPath);
          
          returnData.push({
            json: {
              ...item.json,
              autoFix: fixResult,
              timestamp: new Date().toISOString(),
              operation: 'autoFix'
            }
          });
        }
      } catch (error: unknown) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : String(error),
            },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error instanceof Error ? error : new Error(String(error)), {
          description: `Erreur lors du traitement de l'élément ${i}`,
        });
      }
    }
    
    return [returnData];
  }
}

/**
 * Exécute le script de validation des audits
 */
async function runValidation(
  basePath: string, 
  verbose: boolean,
  reportPath: string
): Promise<any> {
  const args = ['--verbose'];
  if (verbose) {
    args.push('--verbose');
  }
  
  try {
    // Exécuter le script via ts-node
    const validateScriptPath = path.join(basePath, 'utils', 'validate-audit-outputs.ts');
    const result = child_process.spawnSync('npx', ['ts-node', validateScriptPath, ...args], {
      encoding: 'utf8',
      cwd: basePath
    });
    
    if (result.error) {
      throw new Error(`Erreur lors de l'exécution du script de validation: ${result.error.message}`);
    }
    
    // Lire le rapport généré
    const reportFilePath = path.join(reportPath, 'audit_consistency_report.json');
    if (!fs.existsSync(reportFilePath)) {
      throw new Error(`Le rapport de validation n'a pas été généré: ${reportFilePath}`);
    }
    
    const reportContent = fs.readFileSync(reportFilePath, 'utf8');
    const validationReport = JSON.parse(reportContent) as ValidationReport;
    
    // Déterminer s'il y a des problèmes
    const hasIssues = validationReport.missingFiles.length > 0 || 
                      validationReport.inconsistentFields.length > 0 || 
                      validationReport.duplicateAnalyses.length > 0;
    
    // Créer le résumé
    const summary = {
      missingFiles: validationReport.missingFiles.length,
      inconsistentFields: validationReport.inconsistentFields.length,
      duplicateAnalyses: validationReport.duplicateAnalyses.length,
      total: validationReport.missingFiles.length + 
             validationReport.inconsistentFields.length + 
             validationReport.duplicateAnalyses.length
    };
    
    return {
      report: validationReport,
      hasIssues,
      summary,
      output: result.stdout,
      errorOutput: result.stderr
    };
  } catch (error: unknown) {
    throw new Error(`Échec de la validation des audits: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Exécute le script de correction automatique des audits
 */
async function runAutoFix(
  basePath: string, 
  force: boolean,
  reportPath: string
): Promise<any> {
  const args = [];
  if (force) {
    args.push('--force');
  }
  
  try {
    // Exécuter le script via ts-node
    const recheckScriptPath = path.join(basePath, 'utils', 'recheck-missing-outputs.ts');
    const result = child_process.spawnSync('npx', ['ts-node', recheckScriptPath, ...args], {
      encoding: 'utf8',
      cwd: basePath
    });
    
    if (result.error) {
      throw new Error(`Erreur lors de l'exécution du script de correction: ${result.error.message}`);
    }
    
    // Lire le rapport généré
    const reportFilePath = path.join(reportPath, 'recheck_report.json');
    if (!fs.existsSync(reportFilePath)) {
      throw new Error(`Le rapport de correction n'a pas été généré: ${reportFilePath}`);
    }
    
    const reportContent = fs.readFileSync(reportFilePath, 'utf8');
    const recheckReport = JSON.parse(reportContent) as RecheckReport;
    
    // Créer le résumé
    const summary = {
      successful: recheckReport.successful.length,
      failed: recheckReport.failed.length,
      notFound: recheckReport.notFound.length,
      total: recheckReport.successful.length + 
             recheckReport.failed.length + 
             recheckReport.notFound.length
    };
    
    return {
      report: recheckReport,
      success: recheckReport.successful.length > 0 && recheckReport.failed.length === 0,
      summary,
      output: result.stdout,
      errorOutput: result.stderr
    };
  } catch (error: unknown) {
    throw new Error(`Échec de la correction automatique des audits: ${error instanceof Error ? error.message : String(error)}`);
  }
}