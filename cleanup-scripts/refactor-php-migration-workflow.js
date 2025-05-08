/**
 * Script de refactorisation du workflow de migration PHP
 * 
 * Ce script modifie le workflow de migration PHP pour utiliser
 * le workflow d'analyse PHP consolidé au lieu de dupliquer cette fonctionnalité.
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const PROJECT_ROOT = '/workspaces/cahier-des-charge';
const MIGRATION_WORKFLOW_PATH = path.join(PROJECT_ROOT, 'packages/business/temporal/workflows/php-migration.workflow.ts');
const BACKUP_PATH = path.join(PROJECT_ROOT, 'backup/obsolete-files-20250505/php-migration.workflow.ts.bak');

// Fonction pour lire un fichier et récupérer son contenu
function readFileContent(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Le fichier n'existe pas: ${filePath}`);
        process.exit(1);
    }
    return fs.readFileSync(filePath, 'utf-8');
}

// Fonction pour sauvegarder le fichier original
function backupFile(filePath, backupPath) {
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.copyFileSync(filePath, backupPath);
    console.log(`Fichier sauvegardé: ${backupPath}`);
}

// Fonction pour refactoriser le workflow de migration
function refactorMigrationWorkflow(content) {
    // 1. Ajouter l'import pour le workflow d'analyse PHP consolidé
    let updatedContent = content.replace(
        /import \{ defineWorkflow, executeActivity, setHandler, sleep, continueAsNew \} from '@temporalio\/workflow';/,
        `import { defineWorkflow, executeActivity, setHandler, sleep, continueAsNew, executeChild } from '@temporalio/workflow';
import type { ConsolidatedPhpAnalyzerInput, ConsolidatedPhpAnalyzerResult } from '../temporal/workflows/php-analysis/types';`
    );

    // 2. Remplacer l'étape d'analyse PHP par un appel au workflow consolidé
    updatedContent = updatedContent.replace(
        /\/\/ Phase 1: Analyse du code PHP source[\s\S]*?logger\.info\(`Analyse PHP terminée: \${analysisResult\.entityCount} entités détectées`\);/,
        `// Phase 1: Analyse du code PHP source
        // Cette phase utilise le workflow d'analyse PHP consolidé
        logger.info('Phase 1: Analyse du code PHP source via le workflow consolidé');
        
        // Préparer les paramètres pour le workflow d'analyse PHP
        const phpAnalysisInput: ConsolidatedPhpAnalyzerInput = {
            projectPath: input.sourceDir,
            outputDir: \`\${input.projectId}/php-analysis\`,
            staticAnalysis: {
                enabled: true
            },
            complexityAnalysis: {
                enabled: true,
                calculateCyclomaticComplexity: true,
                detectDuplication: true
            },
            securityAnalysis: {
                enabled: true
            },
            fileFilters: {
                exclude: input.analysisOptions?.exclude || [],
                useSmartSelection: true
            },
            reporting: {
                format: 'json',
                includeVisualizations: false
            }
        };
        
        // Exécuter le workflow d'analyse PHP consolidé
        const analysisResult = await executeChild({
            workflowType: 'consolidatedPhpAnalyzerWorkflow',
            args: [phpAnalysisInput],
            workflowId: \`php-analysis-\${input.projectId}-\${Date.now()}\`,
            taskQueue: 'analysis-queue'
        });
        
        // Adapter le résultat au format attendu par les phases suivantes
        const adaptedAnalysisResult = {
            entityCount: analysisResult.metadata.filesAnalyzed,
            entities: [],  // À remplir avec les données extraites de analysisResult
            issues: analysisResult.staticAnalysis?.syntaxErrors || [],
            complexity: analysisResult.complexityAnalysis?.stats || {},
            securityScore: analysisResult.securityAnalysis?.score || 100
        };
        
        // Stockage intermédiaire des résultats pour permettre la reprise
        await executeActivity('saveIntermediateResult', {
            projectId: input.projectId,
            phase: 'analysis',
            result: adaptedAnalysisResult
        });
        
        logger.info(\`Analyse PHP terminée: \${adaptedAnalysisResult.entityCount} entités détectées\`);`
    );

    return updatedContent;
}

// Fonction pour écrire le contenu mis à jour dans le fichier
function writeUpdatedContent(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fichier refactorisé: ${filePath}`);
}

// Fonction principale
async function main() {
    console.log('Refactorisation du workflow de migration PHP...');

    // 1. Vérifier si le fichier cible existe
    if (!fs.existsSync(MIGRATION_WORKFLOW_PATH)) {
        console.log(`Le fichier de migration n'existe pas encore à l'emplacement standard: ${MIGRATION_WORKFLOW_PATH}`);
        console.log('Exécutez d\'abord le script de standardisation pour déplacer le fichier.');
        process.exit(1);
    }

    // 2. Lire le contenu du fichier
    const content = readFileContent(MIGRATION_WORKFLOW_PATH);

    // 3. Sauvegarder le fichier original
    backupFile(MIGRATION_WORKFLOW_PATH, BACKUP_PATH);

    // 4. Refactoriser le contenu
    const updatedContent = refactorMigrationWorkflow(content);

    // 5. Écrire le contenu mis à jour
    writeUpdatedContent(MIGRATION_WORKFLOW_PATH, updatedContent);

    console.log('\nRefactorisation terminée. Veuillez vérifier le fichier mis à jour.');
}

main().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
});