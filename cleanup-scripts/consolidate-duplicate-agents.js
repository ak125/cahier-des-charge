#!/usr/bin/env node

/**
 * Script pour consolider les doublons fonctionnels entre agents
 * 
 * Ce script supprime les agents dupliqués fonctionnellement et met à jour les références
 * en se basant sur les recommandations du rapport d'analyse des doublons.
 * 
 * Usage: 
 *   node consolidate-duplicate-agents.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run  Afficher les actions sans les exécuter
 *   --verbose  Afficher des informations détaillées pendant l'exécution
 */

const fs = require('fs');
const path = require('path');

// Configuration
const AGENTS_DIR_PATH = path.resolve(__dirname, '../packages/business/business/agents/agent');
const REPORT_PATH = path.resolve(__dirname, '../cleanup-report/duplicate-agents-report.md');

// Options
const options = {
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose')
};

// Doublons fonctionnels identifiés
const FUNCTIONAL_DUPLICATES = [
    // Doublons avec 100% de similarité
    { keep: 'agent-audit-agent-06443f3d.ts', remove: 'agent-audit-2f000c73-1a8bd1d0.ts', reason: 'Doublons hiérarchiques' },
    { keep: 'seo-checker-agent-0b4aadee-e425cd04-a6a7866d.ts', remove: 'seo-checker-agent-0b4aadee-71cbca81.ts', reason: 'Doublons complets' },
    { keep: 'seo-checker-agent-e31c7de0-fdd82467-84696944.ts', remove: ['seo-checker-agent-e0663c18-37bff85d-412a7b16.ts', 'seo-checker-agent-f8e5679d-b3549843-1d235bfe.ts'], reason: 'Doublons SEO' },
    { keep: 'seo-checker-seo-checker-agent-2022462f-78e88eb5.ts', remove: 'seo-checker-canonical-agent-180f6add.ts', reason: 'Doublons SEO fonctionnels' },
    { keep: 'agent-business-agent-9d8ecbba-6eeeeb28.ts', remove: 'agent-business-89bfb7a6-0a7ba691.ts', reason: 'Doublons hiérarchiques' },
    { keep: 'php-analyzer-v3-agent-0869c227-713d8d73.ts', remove: ['php-analyzer-agent-6b7b5aa6.ts', 'php-analyzer-v4-agent-333b2094-03f52232.ts'], reason: 'Versions différentes du même agent' },
    { keep: 'agent-structure-agent-1ae26cce.ts', remove: ['agent-structure-2679b5b6.ts', 'structure-agent-2904bc0d.ts'], reason: 'Doublons de structure' },

    // Doublons avec similarité élevée
    { keep: 'dev-checker-agent-16f12a13.ts', remove: 'audit-selector-agent-1c27208a.ts', reason: 'Fonctionnalité similaire' },
    { keep: 'php-analyzerworker-agent-1688e1a4.ts', remove: 'php-analyzer-v4-agent-333b2094-03f52232.ts', reason: 'Fonctionnalité similaire avec versions' },
    { keep: 'sql-analyzerprisma-builder-agent-40e202ca.ts', remove: ['sql-analysis-runner-agent-a67be270.ts', 'sql-debt-audit-agent-18f1172d.ts'], reason: 'Doublons SQL' },
    { keep: 'prisma-smart-generator-agent-36033951.ts', remove: 'prisma-migration-generator-agent-2496e295.ts', reason: 'Fonctionnalité similaire' },
    { keep: 'mysql-to-pg-agent-013e84ce.ts', remove: ['mysql-analyzeroptimizer-agent-1d943255-264152b4.ts', 'mysql-to-postgresql-agent-56ed8db4.ts'], reason: 'Doublons de migration MySQL' },
    { keep: 'sql-prisma-migration-planner-agent-881f54d1.ts', remove: 'sql-debt-audit-agent-18f1172d.ts', reason: 'Fonctionnalité similaire' },

    // Autres doublons hiérarchiques
    { keep: 'agent-donnees-agent-52d4ec5c.ts', remove: 'agent-donnees-68ba2a52.ts', reason: 'Doublons hiérarchiques' },
    { keep: 'agent-orchestrator-agent-63c2b23c-4896cc05.ts', remove: 'agent-orchestrator-07b55705.ts', reason: 'Doublons hiérarchiques' },
    { keep: 'agent-quality-agent-7f8ece54-027fd9a2.ts', remove: 'agent-quality-09dda1b4-3619afd0.ts', reason: 'Doublons hiérarchiques' },
    { keep: 'agent-version-auditor-agent-45a4a89d.ts', remove: 'agent-version-auditor-9faa30d1.ts', reason: 'Doublons hiérarchiques' },
    { keep: 'agent8-optimizer-agent-29cab73f.ts', remove: 'agent8-optimizer-6e0591c2-1f3aaaf2.ts', reason: 'Doublons hiérarchiques' },
];

// Fonction pour lire le contenu d'un fichier
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
        return '';
    }
}

// Fonction pour mettre à jour le fichier index.ts
function updateIndexFile(agentsToRemove) {
    const indexPath = path.join(AGENTS_DIR_PATH, 'index.ts');
    let indexContent = readFileContent(indexPath);

    let modified = false;
    agentsToRemove.forEach(agent => {
        const agentBaseName = agent.replace(/\.ts$/, '');
        const exportRegex = new RegExp(`(export|import).*?['"]\./${agentBaseName}['"].*?;\n?`, 'g');
        const newContent = indexContent.replace(exportRegex, '');

        if (newContent !== indexContent) {
            indexContent = newContent;
            modified = true;
            if (options.verbose) {
                console.log(`  - Référence à ${agent} supprimée du fichier index.ts`);
            }
        }
    });

    if (modified && !options.dryRun) {
        fs.writeFileSync(indexPath, indexContent, 'utf-8');
    }

    return modified;
}

// Fonction pour trouver tous les fichiers qui référencent un agent
function findReferencesToAgent(agentFile) {
    const agentName = agentFile.replace(/\.ts$/, '');
    const regex = new RegExp(`['"]\\.\\/.*${agentName}['"]`, 'g');

    const references = [];
    const files = fs.readdirSync(AGENTS_DIR_PATH);

    for (const file of files) {
        if (file === agentFile || file === 'index.ts') continue;

        const filePath = path.join(AGENTS_DIR_PATH, file);
        const content = readFileContent(filePath);

        if (regex.test(content)) {
            references.push(file);
        }
    }

    return references;
}

// Fonction pour mettre à jour les références vers un agent supprimé
function updateReferences(agentToRemove, agentToKeep) {
    const references = findReferencesToAgent(agentToRemove);

    if (references.length === 0) return;

    const removeBaseName = agentToRemove.replace(/\.ts$/, '');
    const keepBaseName = agentToKeep.replace(/\.ts$/, '');

    for (const refFile of references) {
        const filePath = path.join(AGENTS_DIR_PATH, refFile);
        let content = readFileContent(filePath);

        // Remplacer les références à l'agent supprimé par des références à l'agent conservé
        const oldImport = new RegExp(`import\\s+(.*)\\s+from\\s+['"]\\.\\/.*${removeBaseName}['"]`, 'g');
        const newImport = `import $1 from './${keepBaseName}'`;

        const newContent = content.replace(oldImport, newImport);

        if (newContent !== content && !options.dryRun) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
            if (options.verbose) {
                console.log(`  - Référence mise à jour dans ${refFile}`);
            }
        }
    }
}

// Fonction pour supprimer un fichier
function deleteFile(filePath) {
    if (!options.dryRun) {
        try {
            fs.unlinkSync(filePath);
            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression du fichier ${filePath}:`, error);
            return false;
        }
    }
    return true; // En mode dry-run, on simule une suppression réussie
}

// Fonction pour générer le rapport
function generateReport(results) {
    const reportContent = `# Rapport de Consolidation des Agents Dupliqués
Date: ${new Date().toLocaleDateString('fr-FR')}

## Résumé
- Agents supprimés: ${results.totalRemoved}
- Références mises à jour: ${results.referencesUpdated}
- Index mis à jour: ${results.indexUpdated ? 'Oui' : 'Non'}

## Détails des Consolidations

${results.details.map(detail => `
### ${detail.reason}
- Agent conservé: \`${detail.kept}\`
- Agent(s) supprimé(s): ${Array.isArray(detail.removed) ?
            detail.removed.map(file => `\`${file}\``).join(', ') :
            `\`${detail.removed}\``}
`).join('')}

## Prochaines étapes

1. Vérifier que toutes les fonctionnalités des agents supprimés sont bien présentes dans les agents conservés
2. Mettre à jour les tests pour utiliser les agents conservés
3. Mettre à jour la documentation pour refléter la nouvelle organisation des agents
`;

    fs.writeFileSync(REPORT_PATH, reportContent, 'utf-8');
    console.log(`📄 Rapport généré: ${REPORT_PATH}`);
}

// Fonction principale
async function main() {
    console.log(`🔍 Consolidation des doublons fonctionnels entre agents ${options.dryRun ? '(simulation)' : ''}...`);

    const results = {
        totalRemoved: 0,
        referencesUpdated: 0,
        indexUpdated: false,
        details: []
    };

    // Traiter chaque doublon
    for (const dup of FUNCTIONAL_DUPLICATES) {
        const keepFilePath = path.join(AGENTS_DIR_PATH, dup.keep);

        if (!fs.existsSync(keepFilePath)) {
            console.warn(`⚠️ Fichier à conserver non trouvé: ${dup.keep}`);
            continue;
        }

        const filesToRemove = Array.isArray(dup.remove) ? dup.remove : [dup.remove];
        const removedFiles = [];

        console.log(`\n🔄 Traitement du groupe: ${dup.keep}`);

        for (const removeFile of filesToRemove) {
            const removeFilePath = path.join(AGENTS_DIR_PATH, removeFile);

            if (!fs.existsSync(removeFilePath)) {
                console.warn(`  ⚠️ Fichier à supprimer non trouvé: ${removeFile}`);
                continue;
            }

            // Mettre à jour les références
            if (options.verbose) {
                console.log(`  🔍 Mise à jour des références à ${removeFile}...`);
            }
            updateReferences(removeFile, dup.keep);
            results.referencesUpdated++;

            // Supprimer le fichier
            if (options.verbose) {
                console.log(`  🗑️ Suppression du fichier ${removeFile}...`);
            }
            if (deleteFile(removeFilePath)) {
                removedFiles.push(removeFile);
                results.totalRemoved++;
            }
        }

        // Ajouter les détails au résultat
        if (removedFiles.length > 0) {
            results.details.push({
                kept: dup.keep,
                removed: filesToRemove.length === 1 ? filesToRemove[0] : removedFiles,
                reason: dup.reason
            });
        }
    }

    // Mettre à jour le fichier index.ts
    console.log('\n📝 Mise à jour du fichier index.ts...');
    const allRemovedFiles = FUNCTIONAL_DUPLICATES.flatMap(dup =>
        Array.isArray(dup.remove) ? dup.remove : [dup.remove]
    );
    results.indexUpdated = updateIndexFile(allRemovedFiles);

    // Générer le rapport
    generateReport(results);

    console.log(`\n✅ Consolidation terminée avec succès.`);
    console.log(`- ${results.totalRemoved} agents supprimés`);
    console.log(`- ${results.referencesUpdated} références mises à jour`);

    if (options.dryRun) {
        console.log('\n⚠️ Mode simulation: aucune modification n\'a été effectuée.');
    }

    return true;
}

// Exécution du script
main().catch(error => {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    process.exit(1);
});