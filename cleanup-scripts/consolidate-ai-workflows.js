/**
 * Script de consolidation des workflows de migration AI
 * 
 * Ce script consolide les deux workflows de migration AI en un seul workflow standard.
 * Il déplace les fonctionnalités uniques du workflow simplifié vers le workflow principal.
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const PROJECT_ROOT = '/workspaces/cahier-des-charge';
const CONSOLIDATED_WORKFLOW_PATH = path.join(PROJECT_ROOT, 'packages/business/temporal/workflows/ai-migration-consolidated.workflow.ts');
const PIPELINE_WORKFLOW_PATH = path.join(PROJECT_ROOT, 'packages/business/temporal/workflows/ai-migration-pipeline.workflow.ts');
const BACKUP_PATH = path.join(PROJECT_ROOT, 'backup/obsolete-files-20250505');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'packages/business/temporal/workflows/ai-migration-standard.workflow.ts');

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
    const filename = path.basename(filePath);
    const backupFilePath = path.join(backupPath, filename);

    const backupDir = path.dirname(backupFilePath);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.copyFileSync(filePath, backupFilePath);
    console.log(`Fichier sauvegardé: ${backupFilePath}`);

    return backupFilePath;
}

// Fonction pour extraire les fonctionnalités uniques du workflow consolidé
function extractUniqueFeatures(consolidatedContent) {
    // Extraire les activités supplémentaires
    const activitiesMatch = consolidatedContent.match(/export interface AiPipelineActivities {[\s\S]*?}/);
    const activitiesContent = activitiesMatch ? activitiesMatch[0] : '';

    // Extraire les fonctions d'exportation pour la compatibilité
    const exportsMatch = consolidatedContent.match(/\/\/ Exporter les workflows individuels[\s\S]*?export default/);
    const exportsContent = exportsMatch ? exportsMatch[0] : '// Exporter le workflow principal\nexport default';

    return {
        activitiesContent,
        exportsContent
    };
}

// Fonction pour intégrer les fonctionnalités uniques dans le workflow principal
function integrateFeatures(pipelineContent, uniqueFeatures) {
    // Remplacer le commentaire de début pour indiquer que c'est le workflow standard
    let updatedContent = pipelineContent.replace(
        /\/\*\*\n \* Pipeline de Migration IA - Workflow Temporal[\s\S]*?\*\//,
        `/**
 * Workflow Standard de Migration IA - Temporal
 * 
 * Ce workflow standard combine les fonctionnalités des workflows précédents:
 * - ai-migration-consolidated.workflow.ts
 * - ai-migration-pipeline.workflow.ts
 * 
 * Il orchestre le pipeline complet d'analyse de code, génération de code,
 * et documentation en utilisant des modèles IA.
 */`
    );

    // Ajouter les activités supplémentaires s'il y en a
    if (uniqueFeatures.activitiesContent) {
        updatedContent = updatedContent.replace(
            /(\/\/ Types et schémas pour la configuration)/,
            `// Activités supplémentaires du workflow consolidé
${uniqueFeatures.activitiesContent}

$1`
        );
    }

    // Ajouter les exportations pour la compatibilité
    if (uniqueFeatures.exportsContent) {
        // Trouver la fin du fichier (avant la dernière accolade fermante)
        updatedContent = updatedContent.replace(
            /}[\s]*$/,
            `}

// Exportations pour la compatibilité avec l'ancien workflow
export const aiMigrationConsolidatedWorkflow = aiMigrationPipelineWorkflow;
`
        );
    }

    // Ajouter un commentaire d'information sur la consolidation
    updatedContent += `
/**
 * Note de consolidation:
 * Ce workflow est le résultat de la consolidation des workflows suivants:
 * - ai-migration-consolidated.workflow.ts (simplifié)
 * - ai-migration-pipeline.workflow.ts (complet)
 * 
 * Il est recommandé d'utiliser ce workflow pour toutes les nouvelles intégrations.
 * Les exportations pour la compatibilité garantissent que les intégrations existantes
 * continueront de fonctionner.
 */
`;

    return updatedContent;
}

// Fonction principale
async function main() {
    console.log('Consolidation des workflows de migration IA...');

    // 1. Lire le contenu des deux fichiers
    console.log('Lecture des fichiers sources...');
    const consolidatedContent = readFileContent(CONSOLIDATED_WORKFLOW_PATH);
    const pipelineContent = readFileContent(PIPELINE_WORKFLOW_PATH);

    // 2. Sauvegarder les fichiers originaux
    console.log('Sauvegarde des fichiers originaux...');
    backupFile(CONSOLIDATED_WORKFLOW_PATH, BACKUP_PATH);
    backupFile(PIPELINE_WORKFLOW_PATH, BACKUP_PATH);

    // 3. Extraire les fonctionnalités uniques du workflow consolidé
    console.log('Extraction des fonctionnalités uniques...');
    const uniqueFeatures = extractUniqueFeatures(consolidatedContent);

    // 4. Intégrer les fonctionnalités uniques dans le workflow principal
    console.log('Intégration des fonctionnalités dans le workflow standard...');
    const standardWorkflowContent = integrateFeatures(pipelineContent, uniqueFeatures);

    // 5. Écrire le workflow standard
    console.log('Écriture du workflow standard...');
    fs.writeFileSync(OUTPUT_PATH, standardWorkflowContent, 'utf-8');
    console.log(`Workflow standard créé: ${OUTPUT_PATH}`);

    console.log('\nConsolidation terminée avec succès!');
    console.log('\nÉtapes suivantes recommandées:');
    console.log('1. Vérifier le contenu du nouveau workflow standard');
    console.log('2. Mettre à jour les imports dans les fichiers qui utilisent les anciens workflows');
    console.log('3. Supprimer les anciens workflows une fois la migration vérifiée');
}

main().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
});