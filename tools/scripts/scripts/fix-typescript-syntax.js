#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les erreurs de syntaxe TypeScript courantes
 * Détectées lors de l'exécution de `earthly +typecheck`
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour le terminal
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Fonction pour logger avec des couleurs
function log(type, message) {
    const color = colors[type] || colors.reset;
    console.log(`${color}${message}${colors.reset}`);
}

// Fonction pour parcourir récursivement un répertoire et trouver tous les fichiers .ts
function findTsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !filePath.includes('node_modules')) {
            findTsFiles(filePath, fileList);
        } else if (
            stat.isFile() &&
            (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) &&
            !filePath.includes('.d.ts')
        ) {
            fileList.push(filePath);
        }
    }

    return fileList;
}

// Fonction pour cibler des fichiers spécifiques mentionnés dans les erreurs
function getSpecificErrorFiles() {
    return [
        'agents/orchestration/mcp-manifest-manager.ts',
        'agents/orchestration/seo-mcp-controller.ts',
        'apps/backend/src/webhooks/webhooks.controller.ts',
        'apps/frontend/app/lib/redis.server.ts',
        'apps/frontend/app/lib/supabase.server.ts',
        'apps/frontend/app/routes/admin/jobs/retry.tsx',
        'apps/mcp-server-php/src/index.ts',
        'apps/mcp-server-postgres/src/examples/usage-examples.ts',
        'apps/mcp-server-postgres/src/index.ts',
        'apps/mcp-server-postgres/src/mcp-server.ts',
        'packages/mcp-agents-ci-tester/src/bin/cli.ts',
        'packages/mcp-agents/analyzers/sql-analyzer+prisma-builder-agent/index.ts',
        'packages/mcp-agents/orchestrators/McpVerifier.workerAgent/McpVerifier.workerAgent.ts',
        'packages/mcp-agents/orchestrators/McpVerifierDotworkerAgent/McpVerifier.workerAgent.ts',
        'packages/mcp-agents/types/index.ts',
        'packages/mcp-orchestrator/agent-runner.ts'
    ];
}

// Fonction pour réparer les chaînes non terminées
function fixUnterminatedStrings(content) {
    // Cas 1: Chaînes avec apostrophes simples non terminées
    let fixed = content.replace(/('(?:[^'\\\n]|\\.)*?)(\n|$)/g, (match, p1, p2) => {
        if (!p1.endsWith("'") && !p1.endsWith("\\")) {
            return `${p1}'${p2}`;
        }
        return match;
    });

    // Cas 2: Chaînes avec guillemets doubles non terminées
    fixed = fixed.replace(/("(?:[^"\\\n]|\\.)*?)(\n|$)/g, (match, p1, p2) => {
        if (!p1.endsWith('"') && !p1.endsWith("\\")) {
            return `${p1}"${p2}`;
        }
        return match;
    });

    // Cas 3: Chaînes de modèle non terminées
    fixed = fixed.replace(/(`(?:[^`\\\n]|\\.)*?)(\n|$)/g, (match, p1, p2) => {
        if (!p1.endsWith('`') && !p1.endsWith("\\")) {
            return `${p1}\`${p2}`;
        }
        return match;
    });

    return fixed;
}

// Fonction pour réparer les virgules manquantes dans les objets et tableaux
function fixMissingCommas(content) {
    // Recherche d'objets sans virgules entre les propriétés
    let fixed = content.replace(/(['"])(\w+)\1\s*:\s*([^,{}\[\]\n]+)(\s*)(?=\w+\s*:)/g, '$1$2$1: $3,$4');

    // Recherche de tableaux sans virgules entre les éléments
    fixed = fixed.replace(/(\[[^\]]*?)([^,\[\]\s]+)(\s+)(?=[^,\[\]\s]+)/g, '$1$2,$3');

    // Correction spécifique pour les appels de fonctions avec plusieurs arguments
    fixed = fixed.replace(/\(([^()]*?)([^,\s()]+)(\s+)(?=[^,\s()]+)/g, '($1$2,$3');

    return fixed;
}

// Fonction pour réparer les points-virgules manquants
function fixMissingSemicolons(content) {
    // Recherche de fins de lignes sans point-virgule après certaines instructions
    // Cette regex est simplifiée et pourrait nécessiter des ajustements
    return content.replace(/(\b(?:return|break|continue|throw|const|let|var)\s+[^;{}\n]+)(\n|$)/g, '$1;$2');
}

// Fonction pour réparer les problèmes d'accolades manquantes
function fixMissingBraces(content) {
    // Cette fonction est complexe et nécessiterait une analyse syntaxique complète
    // Nous implémentons une version simple qui peut corriger certains cas

    // Cas 1: if sans accolades
    let fixed = content.replace(/(\bif\s*\([^)]+\))\s*([^{\n][^\n;]*(?:;|\n))/g, '$1 {\n  $2\n}');

    // Cas 2: else sans accolades
    fixed = fixed.replace(/(\belse\b)\s*([^{\n][^\n;]*(?:;|\n))/g, '$1 {\n  $2\n}');

    return fixed;
}

// Fonction pour corriger les erreurs d'expressions régulières
function fixRegexErrors(content) {
    // Recherche d'expressions régulières non fermées
    return content.replace(/(\/.+?)(\n|$)/g, (match, p1, p2) => {
        if (!p1.endsWith("/") && !p1.endsWith("\\")) {
            return `${p1}/${p2}`;
        }
        return match;
    });
}

// Fonction spécifique pour corriger les problèmes dans le fichier migration-watcher.js
function fixMigrationWatcherFile(content) {
    // Correction de la chaîne problématique identifiée dans les erreurs
    return content.replace(/'\/\/ Generated from 'legacy code'/g, "'// Generated from \"legacy code\"'");
}

// Fonction pour réparer un fichier TypeScript
function fixTypeScriptFile(filePath) {
    log('cyan', `Traitement de ${filePath}`);

    try {
        // Lire le contenu du fichier
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // Corrections spécifiques pour certains fichiers
        if (filePath.includes('migration-watcher.js')) {
            content = fixMigrationWatcherFile(content);
        }

        // Appliquer les corrections générales
        content = fixUnterminatedStrings(content);
        content = fixMissingCommas(content);
        content = fixMissingSemicolons(content);
        content = fixMissingBraces(content);
        content = fixRegexErrors(content);

        // Si des modifications ont été apportées, enregistrer le fichier
        if (content !== originalContent) {
            // Créer une sauvegarde
            fs.writeFileSync(`${filePath}.bak`, originalContent, 'utf8');

            // Écrire le contenu corrigé
            fs.writeFileSync(filePath, content, 'utf8');

            log('green', `✓ Corrections appliquées à ${filePath}`);
            return true;
        } else {
            log('yellow', `⚠ Aucune correction automatique pour ${filePath}`);
            return false;
        }
    } catch (error) {
        log('red', `✗ Erreur lors du traitement de ${filePath}: ${error.message}`);
        return false;
    }
}

// Fonction pour utiliser Biome pour formater le code (au lieu de Prettier)
function formatWithBiome(filePath) {
    try {
        log('cyan', `Formatage de ${filePath} avec Biome`);
        execSync(`npx biome format --write "${filePath}"`, { stdio: 'ignore' });
        log('green', `✓ ${filePath} formaté avec succès`);
        return true;
    } catch (error) {
        log('yellow', `⚠ Impossible de formater ${filePath} avec Biome: ${error.message}`);
        return false;
    }
}

// Mode de correction ciblé pour les fichiers avec des erreurs connues
function targetedFix() {
    const specificFiles = getSpecificErrorFiles();
    const rootDir = process.cwd();

    log('cyan', '=== Correction ciblée des fichiers avec erreurs connues ===');
    log('yellow', `${specificFiles.length} fichiers ciblés pour correction`);

    let fixedFiles = 0;
    let failedFiles = 0;
    let skippedFiles = 0;

    // Traiter chaque fichier ciblé
    for (const relativeFilePath of specificFiles) {
        const filePath = path.join(rootDir, relativeFilePath);

        if (fs.existsSync(filePath)) {
            const fixed = fixTypeScriptFile(filePath);

            if (fixed) {
                // Si des corrections ont été appliquées, essayer de formater avec Biome
                formatWithBiome(filePath);
                fixedFiles++;
            } else {
                skippedFiles++;
            }
        } else {
            log('red', `✗ Fichier non trouvé: ${filePath}`);
            failedFiles++;
        }
    }

    // Afficher les statistiques
    log('cyan', '\n=== Résumé de la correction ciblée ===');
    log('green', `✓ ${fixedFiles} fichiers corrigés`);
    log('yellow', `⚠ ${skippedFiles} fichiers sans correction automatique`);
    log('red', `✗ ${failedFiles} fichiers non trouvés ou en échec`);

    if (fixedFiles > 0) {
        log('cyan', '\nNote: Des fichiers de sauvegarde (.bak) ont été créés pour les fichiers modifiés.');
    }
}

// Fonction principale
function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'all';

    if (mode === 'targeted') {
        targetedFix();
        return;
    }

    log('cyan', '=== Correction des erreurs de syntaxe TypeScript ===');

    // Récupérer tous les fichiers .ts du projet
    const rootDir = process.cwd();
    log('cyan', `Recherche des fichiers TypeScript dans ${rootDir}`);

    const tsFiles = findTsFiles(rootDir);
    log('green', `${tsFiles.length} fichiers TypeScript trouvés`);

    // Variables pour suivre les statistiques
    let fixedFiles = 0;
    let failedFiles = 0;
    let skippedFiles = 0;

    // Traiter chaque fichier
    for (const filePath of tsFiles) {
        const fixed = fixTypeScriptFile(filePath);

        if (fixed) {
            // Si des corrections ont été appliquées, essayer de formater avec Biome
            formatWithBiome(filePath);
            fixedFiles++;
        } else {
            skippedFiles++;
        }
    }

    // Afficher les statistiques
    log('cyan', '\n=== Résumé ===');
    log('green', `✓ ${fixedFiles} fichiers corrigés`);
    log('yellow', `⚠ ${skippedFiles} fichiers sans correction automatique`);
    log('red', `✗ ${failedFiles} fichiers en échec`);

    if (fixedFiles > 0) {
        log('cyan', '\nNote: Des fichiers de sauvegarde (.bak) ont été créés pour les fichiers modifiés.');
    }
}

// Exécuter le script
main();