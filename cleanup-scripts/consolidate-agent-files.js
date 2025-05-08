#!/usr/bin/env node

/**
 * Script pour consolider les fichiers d'agents dupliqués
 * 
 * Ce script identifie et consolide les agents qui existent avec plusieurs suffixes hexadécimaux
 * et garde une seule version de chaque agent.
 * 
 * Usage: 
 *   node consolidate-agent-files.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run  Exécuter sans effectuer de modifications
 *   --verbose  Afficher des informations détaillées pendant l'exécution
 */

const fs = require('fs');
const path = require('path');

// Configuration
const AGENTS_DIR_PATH = path.resolve(__dirname, '../packages/business/business/agents/agent');
const REPORT_PATH = path.resolve(__dirname, '../cleanup-report/agent-files-consolidation-report.md');

// Options
const options = {
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose')
};

// Fonction pour extraire le nom de base de l'agent (sans les suffixes hexadécimaux)
function getBaseAgentName(filename) {
    // Correspond aux motifs comme "agent-name-xxxxx-yyyyy.ts" ou "agent-name-xxxxx.ts"
    const match = filename.match(/^([\w-]+?)(?:-[0-9a-f]{8}(?:-[0-9a-f]{8})?)?\.ts$/);
    return match ? match[1] : filename.replace(/\.ts$/, '');
}

// Fonction pour déterminer si un fichier est un fichier d'agent "canonique" (sans suffixes)
function isCanonicalAgentFile(filename) {
    return !filename.match(/-[0-9a-f]{8}(?:-[0-9a-f]{8})?\.ts$/);
}

// Fonction pour compter les lignes de code dans un fichier
function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n').length;
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
        return 0;
    }
}

// Fonction pour identifier le fichier principal à garder parmi les variantes
function selectMainFile(files) {
    // Vérifier s'il y a un fichier avec le nom canonique (sans suffixe hexadécimal)
    const canonicalFile = files.find(file => isCanonicalAgentFile(file));
    if (canonicalFile) {
        return canonicalFile;
    }

    // Sinon, choisir le fichier le plus volumineux (plus de lignes = probablement plus complet)
    let mainFile = files[0];
    let maxLines = countLines(path.join(AGENTS_DIR_PATH, mainFile));

    for (let i = 1; i < files.length; i++) {
        const filePath = path.join(AGENTS_DIR_PATH, files[i]);
        const lines = countLines(filePath);
        if (lines > maxLines) {
            maxLines = lines;
            mainFile = files[i];
        }
    }

    return mainFile;
}

// Fonction pour créer un fichier de rapport
function generateReport(results) {
    const reportContent = `# Rapport de Consolidation des Fichiers d'Agents
Date: ${new Date().toLocaleDateString('fr-FR')}
Mode: ${options.dryRun ? 'Simulation (dry-run)' : 'Exécution réelle'}

## Résumé
- Total des groupes d'agents consolidés: ${Object.keys(results).length}
- Nombre total de fichiers doublons supprimés: ${Object.values(results).reduce((acc, group) => acc + group.deleted.length, 0)}
- Nombre total de fichiers conservés: ${Object.values(results).length}

## Détails de la consolidation

${Object.entries(results).map(([baseAgentName, { kept, deleted }]) => {
        return `### ${baseAgentName}
- Fichier conservé: \`${kept}\`
- Fichiers supprimés (${deleted.length}): ${deleted.map(file => `\`${file}\``).join(', ')}`;
    }).join('\n\n')}

## Recommandations

1. Mettre à jour les imports qui pourraient référencer les fichiers supprimés
2. Mettre en place des conventions de nommage pour éviter de futures duplications
3. Envisager l'utilisation d'un registre centralisé d'agents au lieu de fichiers multiples

## Statut

${options.dryRun ? 'Ce rapport est généré en mode simulation. Aucune modification n\'a été effectuée.' : 'La consolidation a été effectuée avec succès. Les fichiers doublons ont été supprimés.'}
`;

    if (!options.dryRun) {
        const reportDir = path.dirname(REPORT_PATH);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        fs.writeFileSync(REPORT_PATH, reportContent, 'utf-8');
        console.log(`📄 Rapport généré: ${REPORT_PATH}`);
    }

    return reportContent;
}

// Fonction pour créer un fichier d'index qui exporte tous les agents principaux
function createIndexFile(agentGroups) {
    const indexContent = `/**
 * Index des agents consolidés
 * Ce fichier est généré automatiquement par le script de consolidation des agents
 * Date: ${new Date().toISOString()}
 */

${Object.entries(agentGroups).map(([baseName, { kept }]) => {
        const importName = baseName.replace(/-/g, '');
        return `import * as ${importName} from './${kept.replace(/\.ts$/, '')}';`;
    }).join('\n')}

export {
${Object.entries(agentGroups).map(([baseName]) => {
        const importName = baseName.replace(/-/g, '');
        return `  ${importName},`;
    }).join('\n')}
};

// Exportation par défaut de tous les agents
export default {
${Object.entries(agentGroups).map(([baseName]) => {
        const importName = baseName.replace(/-/g, '');
        return `  ${importName},`;
    }).join('\n')}
};
`;

    const indexPath = path.join(AGENTS_DIR_PATH, 'index.ts');

    if (!options.dryRun) {
        fs.writeFileSync(indexPath, indexContent, 'utf-8');
        console.log(`✅ Fichier d'index créé: ${indexPath}`);
    }

    return indexPath;
}

// Fonction principale
async function main() {
    console.log('🔍 Identification des fichiers d\'agents dupliqués...');

    try {
        // Lister tous les fichiers dans le répertoire des agents
        const agentFiles = fs.readdirSync(AGENTS_DIR_PATH)
            .filter(file => file.endsWith('.ts'));

        // Regrouper les fichiers par nom de base d'agent
        const agentGroups = {};
        agentFiles.forEach(file => {
            const baseAgentName = getBaseAgentName(file);
            if (!agentGroups[baseAgentName]) {
                agentGroups[baseAgentName] = [];
            }
            agentGroups[baseAgentName].push(file);
        });

        // Filtrer pour ne garder que les groupes avec plus d'un fichier (doublons)
        const duplicateGroups = Object.entries(agentGroups)
            .filter(([_, files]) => files.length > 1)
            .reduce((acc, [name, files]) => {
                acc[name] = files;
                return acc;
            }, {});

        console.log(`📋 ${Object.keys(duplicateGroups).length} groupes d'agents avec doublons identifiés.`);

        if (options.verbose) {
            Object.entries(duplicateGroups).forEach(([name, files]) => {
                console.log(`  - ${name} (${files.length} fichiers): ${files.join(', ')}`);
            });
        }

        // Consolider chaque groupe d'agents
        const results = {};

        console.log(`\n${options.dryRun ? '🛠️ Simulation de la consolidation...' : '🛠️ Démarrage de la consolidation...'}`);

        for (const [baseAgentName, files] of Object.entries(duplicateGroups)) {
            const mainFile = selectMainFile(files);
            const filesToDelete = files.filter(file => file !== mainFile);

            console.log(`Consolidation de ${baseAgentName}`);
            console.log(`  - Fichier conservé: ${mainFile}`);
            console.log(`  - Fichiers à supprimer: ${filesToDelete.length}`);

            if (options.verbose) {
                filesToDelete.forEach(file => {
                    console.log(`    - ${file}`);
                });
            }

            // Supprimer les fichiers doublons
            if (!options.dryRun) {
                filesToDelete.forEach(file => {
                    const filePath = path.join(AGENTS_DIR_PATH, file);
                    fs.unlinkSync(filePath);
                });
            }

            results[baseAgentName] = {
                kept: mainFile,
                deleted: filesToDelete
            };
        }

        // Créer un fichier d'index qui exporte tous les agents principaux
        createIndexFile(results);

        // Générer le rapport
        generateReport(results);

        console.log(`\n✅ Processus terminé avec succès. ${options.dryRun ? 'Aucune modification effectuée (mode dry-run).' : ''}`);

        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la consolidation des fichiers d\'agents:', error);
        return false;
    }
}

// Exécution du script
main().catch(error => {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    process.exit(1);
});