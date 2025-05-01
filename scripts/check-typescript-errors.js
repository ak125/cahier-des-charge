#!/usr/bin/env node

/**
 * Script pour vérifier les erreurs TypeScript dans les fichiers ciblés
 * sans essayer de les formater avec Biome
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

// Liste des fichiers problématiques
const problematicFiles = [
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

// Fonction pour vérifier un fichier TypeScript
function checkTypeScriptFile(filePath) {
    try {
        log('cyan', `Vérification de ${filePath}`);

        // Lire le contenu du fichier
        const content = fs.readFileSync(filePath, 'utf8');

        // Vérifier les erreurs de syntaxe communes
        const issues = [];

        // 1. Chaînes non terminées
        if (content.match(/('(?:[^'\\\n]|\\.)*?)(?:\n|$)/)) {
            issues.push('Chaînes non terminées possibles');
        }

        // 2. Accolades déséquilibrées
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push(`Accolades déséquilibrées: ${openBraces} ouvrantes, ${closeBraces} fermantes`);
        }

        // 3. Parenthèses déséquilibrées
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            issues.push(`Parenthèses déséquilibrées: ${openParens} ouvrantes, ${closeParens} fermantes`);
        }

        // 4. Crochets déséquilibrés
        const openBrackets = (content.match(/\[/g) || []).length;
        const closeBrackets = (content.match(/\]/g) || []).length;
        if (openBrackets !== closeBrackets) {
            issues.push(`Crochets déséquilibrés: ${openBrackets} ouvrants, ${closeBrackets} fermants`);
        }

        // Afficher les résultats
        if (issues.length > 0) {
            log('yellow', `⚠ Problèmes potentiels dans ${filePath}:`);
            issues.forEach(issue => log('yellow', `  - ${issue}`));
            return { path: filePath, issues };
        } else {
            log('green', `✓ Aucun problème évident détecté dans ${filePath}`);
            return { path: filePath, issues: [] };
        }
    } catch (error) {
        log('red', `✗ Erreur lors de la vérification de ${filePath}: ${error.message}`);
        return { path: filePath, issues: [`Erreur: ${error.message}`] };
    }
}

// Fonction principale
function main() {
    log('cyan', '=== Vérification des erreurs TypeScript dans les fichiers ciblés ===');

    const rootDir = process.cwd();
    const results = [];

    // Vérifier chaque fichier problématique
    for (const relativeFilePath of problematicFiles) {
        const filePath = path.join(rootDir, relativeFilePath);

        if (fs.existsSync(filePath)) {
            const result = checkTypeScriptFile(filePath);
            results.push(result);
        } else {
            log('red', `✗ Fichier non trouvé: ${filePath}`);
        }
    }

    // Afficher un résumé
    log('cyan', '\n=== Résumé ===');

    const filesWithIssues = results.filter(r => r.issues.length > 0);

    log('green', `✓ ${results.length - filesWithIssues.length} fichiers sans problèmes évidents`);

    if (filesWithIssues.length > 0) {
        log('yellow', `⚠ ${filesWithIssues.length} fichiers avec des problèmes potentiels:`);
        filesWithIssues.forEach(file => {
            log('yellow', `  - ${file.path}`);
        });

        log('cyan', "\nPour corriger ces problèmes, vous pourriez avoir besoin d'une édition manuelle.");
        log('cyan', "Commencez par vérifier les accolades, parenthèses, et crochets déséquilibrés.");
    }
}

// Exécuter le script
main();