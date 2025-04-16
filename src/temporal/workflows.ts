import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

// Création d'un proxy pour accéder aux activités depuis le workflow
const { analyzeCode, transformCode, validateTransformedCode, notifyCompletion } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

/**
 * Workflow principal pour la migration de code
 * 
 * Ce workflow orchestre le processus de migration en exécutant
 * une série d'activités dans un ordre précis
 */
export async function codeTransformationWorkflow(sourceDir: string): Promise<any> {
  // Étape 1: Analyse du code source
  const analysisResult = await analyzeCode(sourceDir);
  
  // Étape 2: Transformation du code basée sur l'analyse
  const transformResult = await transformCode(analysisResult);
  
  // Étape 3: Validation du code transformé
  const validationResult = await validateTransformedCode(transformResult);
  
  // Étape 4: Notification de l'achèvement du workflow
  await notifyCompletion(validationResult);
  
  // Retourne le résultat final du workflow
  return {
    status: 'success',
    sourceDir,
    analysisResult,
    transformResult,
    validationResult,
    timestamp: new Date().toISOString()
  };
}

/**
 * Workflow pour l'audit de code source
 */
export async function codeAuditWorkflow(sourceDir: string): Promise<any> {
  // Exécute uniquement l'analyse du code
  const analysisResult = await analyzeCode(sourceDir);
  
  // Notification de l'achèvement de l'audit
  await notifyCompletion({
    type: 'audit',
    result: analysisResult
  });
  
  return {
    status: 'audit-completed',
    sourceDir,
    analysisResult,
    timestamp: new Date().toISOString()
  };
}
