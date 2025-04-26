#!/usr/bin/env node
/**
 * Structure Refactor Planner
 * 
 * Analyse le fichier structure_classification_report.json et génère:
 * - Un plan de migration de fichiers (structure_suggestion.md)
 * - Un rapport de résumé (structure_classification_summary.json)
 * - Des commandes de déplacement (structure_migration_commands.sh)
 * 
 * @author MCP OS Agent
 * @version 1.0.0
 */

import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';
import * as os from osstructure-agent';

// Types
interface FileClassification {
    file: string;
    layer: string;
    domain: string;
    status: string;
    source: string;
    confidence: number;
}

interface ClassificationReport {
    metadata: {
        generatedAt: string;
        projectRoot: string;
        filesAnalyzed: number;
        structureMapVersion: string;
        structureMapUpdated: string;
        executionTimeMs: number;
    };
    classifications: Record<string, FileClassification>;
    statistics: {
        byLayer: Record<string, number>;
        byDomain: Record<string, number>;
        byStatus: Record<string, number>;
        bySource: Record<string, number>;
    };
    groups: {
        activeBusinessFiles: string[];
        orchestrationFiles: string[];
        depreciatedFiles: string[];
        developingFiles: string[];
        highConfidenceFiles: string[];
        lowConfidenceFiles: string[];
    };
    contextualAnalysis?: {
        filesImproved: number;
        neighborhoodImprovements: Record<string, string[]>;
    };
}

interface SummaryStatistics {
    [key: string]: number;
}

interface MigrationPlan {
    moves: Array<{
        source: string;
        destination: string;
        classification: {
            layer: string;
            domain: string;
            status: string;
            confidence: number;
        };
    }>;
    statistics: {
        totalFiles: number;
        totalMoves: number;
        byTargetFolder: Record<string, number>;
    };
}

// Configuration
const DEFAULT_CONFIG = {
    reportPath: path.resolve(process.cwd(), 'structure', 'structure_classification_report.json'),
    outputSuggestionPath: path.resolve(process.cwd(), 'structure', 'structure_suggestion.md'),
    outputSummaryPath: path.resolve(process.cwd(), 'structure', 'structure_classification_summary.json'),
    outputCommandsPath: path.resolve(process.cwd(), 'structure', 'structure_migration_commands.sh'),
    confidenceThreshold: 0.7,
    dryRun: true,
    preserveUnderConfident: true,
    rootDirectories: ['business', 'coordination', 'shared', 'orchestration'],
    domainBasedSubfolders: true,
    statusBasedFiltering: true,
    ignorePatterns: [
        'node_modules',
        'dist',
        '.git',
        '.github',
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'README.md',
        'LICENSE',
        '.gitignore',
        '.env'
    ],
    preservePaths: [
        'packages',
        'apps',
        'scripts',
        'tools',
        'agents',
        'src'
    ]
};

// Lecture de la configuration depuis les arguments CLI
function parseCliArgs() {
    const args = process.argv.slice(2);
    const config = { ...DEFAULT_CONFIG };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--report' || arg === '-r') {
            const nextArg = args[++i];
            if (nextArg) {
                config.reportPath = path.resolve(process.cwd(), nextArg);
            }
        } else if (arg === '--output' || arg === '-o') {
            const nextArg = args[++i];
            if (nextArg) {
                config.outputSuggestionPath = path.resolve(process.cwd(), nextArg);
            }
        } else if (arg === '--summary' || arg === '-s') {
            const nextArg = args[++i];
            if (nextArg) {
                config.outputSummaryPath = path.resolve(process.cwd(), nextArg);
            }
        } else if (arg === '--commands' || arg === '-c') {
            const nextArg = args[++i];
            if (nextArg) {
                config.outputCommandsPath = path.resolve(process.cwd(), nextArg);
            }
        } else if (arg === '--threshold' || arg === '-t') {
            const nextArg = args[++i];
            if (nextArg) {
                config.confidenceThreshold = parseFloat(nextArg);
            }
        } else if (arg === '--execute') {
            config.dryRun = false;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Structure Refactor Planner - Génère un plan de migration de fichiers basé sur le rapport de classification

Usage: npx ts-node tools/structure/structure-refactor-planner.ts [options]

Options:
  --report, -r <path>      Chemin vers le fichier structure_classification_report.json (défaut: ./structure/structure_classification_report.json)
  --output, -o <path>      Chemin vers le fichier structure_suggestion.md (défaut: ./structure/structure_suggestion.md)
  --summary, -s <path>     Chemin vers le fichier structure_classification_summary.json (défaut: ./structure/structure_classification_summary.json)
  --commands, -c <path>    Chemin vers le fichier structure_migration_commands.sh (défaut: ./structure/structure_migration_commands.sh)
  --threshold, -t <value>  Seuil de confiance pour inclure un fichier dans le plan de migration (défaut: 0.7)
  --execute                Exécuter les commandes de déplacement (défaut: dry-run)
  --help, -h               Afficher cette aide
      `);
            process.exit(0);
        }
    }

    return config;
}

/**
 * Génère un chemin cible basé sur la classification
 */
function generateTargetPath(file: string, classification: FileClassification, config: any): string {
    // Extraire le nom de fichier et l'extension
    const fileName = path.basename(file);
    const fileExt = path.extname(file).toLowerCase();

    // Déterminer si le fichier devrait être préservé dans son chemin actuel
    for (const preservePath of config.preservePaths) {
        if (file.startsWith(preservePath + '/')) {
            // Si le fichier est dans un des chemins à préserver, on ne change que le sous-chemin
            const relativePath = file.substring(preservePath.length + 1);
            const folderStructure = generateFolderStructure(classification, config);
            return `${preservePath}/${folderStructure}/${fileName}`;
        }
    }

    // Pour les fichiers à la racine ou dans des dossiers non préservés
    const folderStructure = generateFolderStructure(classification, config);
    return `${folderStructure}/${fileName}`;
}

/**
 * Génère la structure de dossiers basée sur la classification
 */
function generateFolderStructure(classification: FileClassification, config: any): string {
    const { layer, domain, status } = classification;

    // Vérifier si la couche est valide et n'est pas "unknown"
    if (!layer || layer === 'unknown') {
        return 'unknown';
    }

    // Structure de base: layer
    let structure = layer;

    // Ajouter le domaine si configuré et disponible
    if (config.domainBasedSubfolders && domain && domain !== 'unknown') {
        structure += `/${domain}`;
    }

    return structure;
}

/**
 * Vérifie si un fichier doit être ignoré dans le plan de migration
 */
function shouldIgnoreFile(file: string, classification: FileClassification, config: any): boolean {
    // Vérifier les patterns à ignorer
    for (const pattern of config.ignorePatterns) {
        if (file.includes(pattern)) {
            return true;
        }
    }

    // Vérifier la confiance de la classification
    if (classification.confidence < config.confidenceThreshold && config.preserveUnderConfident) {
        return true;
    }

    // Vérifier si la couche est inconnue
    if (classification.layer === 'unknown') {
        return true;
    }

    return false;
}

/**
 * Génère un plan de migration basé sur le rapport de classification
 */
function generateMigrationPlan(report: ClassificationReport, config: any): MigrationPlan {
    const moves: MigrationPlan['moves'] = [];
    const byTargetFolder: Record<string, number> = {};
    const { classifications } = report;

    // Parcourir toutes les classifications
    for (const [file, classification] of Object.entries(classifications)) {
        // Ignorer les fichiers selon la configuration
        if (shouldIgnoreFile(file, classification, config)) {
            continue;
        }

        // Générer le chemin cible
        const targetPath = generateTargetPath(file, classification, config);

        // Si le chemin cible est différent du chemin source
        if (targetPath !== file) {
            // Ajouter au plan de migration
            moves.push({
                source: file,
                destination: targetPath,
                classification: {
                    layer: classification.layer,
                    domain: classification.domain,
                    status: classification.status,
                    confidence: classification.confidence
                }
            });

            // Mettre à jour les statistiques
            const targetFolder = targetPath.split('/')[0];
            byTargetFolder[targetFolder] = (byTargetFolder[targetFolder] || 0) + 1;
        }
    }

    return {
        moves,
        statistics: {
            totalFiles: Object.keys(classifications).length,
            totalMoves: moves.length,
            byTargetFolder
        }
    };
}

/**
 * Génère un rapport de résumé des classifications
 */
function generateSummaryReport(report: ClassificationReport): SummaryStatistics {
    const summary: SummaryStatistics = {};
    const { classifications } = report;

    // Parcourir toutes les classifications
    for (const classification of Object.values(classifications)) {
        const { layer, domain, status } = classification;

        // Créer une clé unique pour cette combinaison
        const key = `${layer}|${domain}|${status}`;

        // Incrémenter le compteur pour cette combinaison
        summary[key] = (summary[key] || 0) + 1;
    }

    return summary;
}

/**
 * Génère le contenu du fichier structure_suggestion.md
 */
function generateSuggestionMarkdown(plan: MigrationPlan): string {
    const { moves, statistics } = plan;

    // Regrouper les fichiers par dossier cible
    const byTargetFolder: Record<string, Array<{ source: string; destination: string; confidence: number }>> = {};

    for (const move of moves) {
        const targetFolder = move.destination.split('/')[0];

        if (!byTargetFolder[targetFolder]) {
            byTargetFolder[targetFolder] = [];
        }

        byTargetFolder[targetFolder].push({
            source: move.source,
            destination: move.destination,
            confidence: move.classification.confidence
        });
    }

    // Générer le markdown
    let markdown = `# Plan de Migration Structurelle

## Résumé

- **Fichiers totaux analysés:** ${statistics.totalFiles}
- **Fichiers à déplacer:** ${statistics.totalMoves} (${(statistics.totalMoves / statistics.totalFiles * 100).toFixed(2)}%)

### Répartition par dossier cible

${Object.entries(statistics.byTargetFolder)
            .sort(([, a], [, b]) => b - a)
            .map(([folder, count]) => `- **${folder}**: ${count} fichiers`)
            .join('\n')}

## Plan détaillé par dossier cible

`;

    // Ajouter les détails pour chaque dossier cible
    for (const [folder, files] of Object.entries(byTargetFolder).sort()) {
        markdown += `### Dossier: \`${folder}\`

| Source | Destination | Confiance |
|--------|-------------|-----------|
`;

        for (const file of files.sort((a, b) => a.source.localeCompare(b.source))) {
            markdown += `| \`${file.source}\` | \`${file.destination}\` | ${(file.confidence * 100).toFixed(0)}% |\n`;
        }

        markdown += '\n';
    }

    markdown += `## Comment exécuter

1. Consultez ce rapport et assurez-vous que les déplacements suggérés sont cohérents
2. Exécutez les commandes de déplacement générées dans \`structure_migration_commands.sh\`:

\`\`\`bash
# Pour voir ce qui serait fait (dry-run)
bash structure_migration_commands.sh --dry-run

# Pour exécuter réellement les déplacements
bash structure_migration_commands.sh
\`\`\`

3. Mettez à jour vos imports/références si nécessaire

> Note: Cette restructuration préserve la structure des dossiers spécifiques comme \`packages/\`, \`apps/\`, \`scripts/\`, etc.
`;

    return markdown;
}

/**
 * Génère les commandes shell pour migrer les fichiers
 */
function generateMigrationCommands(plan: MigrationPlan): string {
    const { moves } = plan;

    let commands = `#!/bin/bash

# Script de migration structurelle généré automatiquement
# Date de génération: ${new Date().toISOString()}

# Variables
DRY_RUN=false

# Traiter les arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Option inconnue: $1"
      exit 1
      ;;
  esac
done

if [ "$DRY_RUN" = true ]; then
  echo "🔍 Mode dry-run: aucune modification ne sera effectuée"
else
  echo "⚠️ Mode d'exécution: les fichiers vont être déplacés"
fi

# Création des dossiers nécessaires
echo "📁 Création des dossiers..."
`;

    // Créer un ensemble pour éviter les doublons de dossiers
    const directories = new Set<string>();

    for (const move of moves) {
        const dir = path.dirname(move.destination);
        if (dir !== '.') {
            directories.add(dir);
        }
    }

    // Commandes pour créer les dossiers
    for (const dir of Array.from(directories).sort()) {
        commands += `if [ "$DRY_RUN" = false ]; then\n`;
        commands += `  mkdir -p "${dir}"\n`;
        commands += `else\n`;
        commands += `  echo "mkdir -p ${dir}"\n`;
        commands += `fi\n`;
    }

    commands += `
# Déplacement des fichiers
echo "🚚 Déplacement des fichiers..."
`;

    // Commandes pour déplacer les fichiers
    for (const move of moves) {
        commands += `if [ "$DRY_RUN" = false ]; then\n`;
        commands += `  if [ -f "${move.source}" ]; then\n`;
        commands += `    git mv "${move.source}" "${move.destination}" 2>/dev/null || mv "${move.source}" "${move.destination}"\n`;
        commands += `    echo "✅ Déplacé: ${move.source} → ${move.destination}"\n`;
        commands += `  else\n`;
        commands += `    echo "❌ Fichier source introuvable: ${move.source}"\n`;
        commands += `  fi\n`;
        commands += `else\n`;
        commands += `  echo "mv ${move.source} → ${move.destination}"\n`;
        commands += `fi\n`;
    }

    commands += `
echo "✨ Migration terminée!"
if [ "$DRY_RUN" = false ]; then
  echo "N'oubliez pas de mettre à jour vos imports et références si nécessaire."
fi
`;

    return commands;
}

/**
 * Crée les répertoires nécessaires pour les fichiers de sortie
 */
function ensureOutputDirectoriesExist(config: any) {
    const directories = [
        path.dirname(config.outputSuggestionPath),
        path.dirname(config.outputSummaryPath),
        path.dirname(config.outputCommandsPath)
    ];

    for (const directory of new Set(directories)) {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
    }
}

/**
 * Fonction principale
 */
async function main() {
    const config = parseCliArgs();

    try {
        console.log(`🔍 Structure Refactor Planner v1.0.0`);

        // Vérifier que le rapport de classification existe
        if (!fs.existsSync(config.reportPath)) {
            throw new Error(`Le fichier de rapport est introuvable au chemin : ${config.reportPath}`);
        }

        // Lire le fichier de rapport
        console.log(`📚 Lecture du rapport de classification: ${config.reportPath}`);
        const reportContent = fs.readFileSync(config.reportPath, 'utf-8');
        const report: ClassificationReport = JSON.parse(reportContent);

        // Générer le plan de migration
        console.log(`🚀 Génération du plan de migration...`);
        const migrationPlan = generateMigrationPlan(report, config);

        console.log(`📊 Plan généré: ${migrationPlan.statistics.totalMoves} fichiers à déplacer sur ${migrationPlan.statistics.totalFiles} fichiers analysés`);

        // Générer le rapport de résumé
        console.log(`📈 Génération du rapport de résumé...`);
        const summaryReport = generateSummaryReport(report);

        // Générer le contenu markdown pour la suggestion
        const suggestionMarkdown = generateSuggestionMarkdown(migrationPlan);

        // Générer les commandes shell
        const migrationCommands = generateMigrationCommands(migrationPlan);

        // Créer les répertoires de sortie si nécessaire
        ensureOutputDirectoriesExist(config);

        // Écrire les fichiers de sortie
        fs.writeFileSync(config.outputSuggestionPath, suggestionMarkdown);
        fs.writeFileSync(config.outputSummaryPath, JSON.stringify(summaryReport, null, 2));
        fs.writeFileSync(config.outputCommandsPath, migrationCommands);
        fs.chmodSync(config.outputCommandsPath, 0o755); // Rendre exécutable

        console.log(`✅ Suggestion de migration écrite dans: ${config.outputSuggestionPath}`);
        console.log(`✅ Rapport de résumé écrit dans: ${config.outputSummaryPath}`);
        console.log(`✅ Commandes de migration écrites dans: ${config.outputCommandsPath}`);

        if (!config.dryRun) {
            // TODO: Implémenter l'exécution des commandes
            console.log(`⚠️ L'exécution directe n'est pas encore implémentée. Utilisez le script shell généré.`);
        }

        console.log(`✨ Terminé!`);

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

// Exécution du script
main();