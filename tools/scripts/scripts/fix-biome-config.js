#!/usr/bin/env node

/**
 * Script pour résoudre les problèmes de formatage Biome
 * Ce script crée une configuration Biome plus permissive qui facilite le formatage des fichiers avec erreurs
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

// Configuration Biome plus permissive
const biomeTolerantConfig = {
    "$schema": "https://biomejs.dev/schemas/1.5.3/schema.json",
    "organizeImports": {
        "enabled": false
    },
    "linter": {
        "enabled": true,
        "rules": {
            "recommended": true,
            "correctness": {
                "noUndeclaredVariables": "off",
                "noUnusedVariables": "off"
            },
            "suspicious": {
                "noExplicitAny": "off",
                "noDoubleEquals": "off",
                "noRedeclare": "off"
            },
            "style": {
                "noNonNullAssertion": "off",
                "useTemplate": "off"
            },
            "performance": {
                "noDelete": "off"
            },
            "nursery": {
                "noBannedTypes": "off",
                "noUselessTernary": "off"
            }
        }
    },
    "formatter": {
        "enabled": true,
        "indentStyle": "space",
        "indentWidth": 2,
        "lineWidth": 100,
        "ignore": []
    },
    "javascript": {
        "formatter": {
            "quoteStyle": "single",
            "trailingComma": "es5",
            "semicolons": "always"
        }
    },
    "overrides": [
        {
            "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
            "linter": {
                "rules": {
                    "suspicious": {
                        "noImplicitAnyLet": "off",
                        "noConsoleLog": "off",
                        "noEmptyInterface": "off",
                        "noPrototypeBuiltins": "off"
                    }
                }
            }
        }
    ]
};

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

// Fonction pour sauvegarder la configuration Biome actuelle
function backupBiomeConfig() {
    const rootDir = process.cwd();
    const biomeConfigPath = path.join(rootDir, 'biome.json');

    if (fs.existsSync(biomeConfigPath)) {
        const backupPath = path.join(rootDir, 'biome.json.bak');
        fs.copyFileSync(biomeConfigPath, backupPath);
        log('green', `✓ Configuration Biome sauvegardée dans biome.json.bak`);
        return true;
    } else {
        log('yellow', `⚠ Aucun fichier biome.json trouvé dans ${rootDir}`);
        return false;
    }
}

// Fonction pour créer une configuration Biome plus permissive
function createTolerantBiomeConfig() {
    const rootDir = process.cwd();
    const biomeConfigPath = path.join(rootDir, 'biome.json');

    try {
        fs.writeFileSync(biomeConfigPath, JSON.stringify(biomeTolerantConfig, null, 2), 'utf8');
        log('green', `✓ Configuration Biome plus permissive créée avec succès`);
        return true;
    } catch (error) {
        log('red', `✗ Erreur lors de la création de la configuration Biome: ${error.message}`);
        return false;
    }
}

// Fonction pour restaurer la configuration Biome d'origine
function restoreBiomeConfig() {
    const rootDir = process.cwd();
    const backupPath = path.join(rootDir, 'biome.json.bak');
    const biomeConfigPath = path.join(rootDir, 'biome.json');

    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, biomeConfigPath);
        log('green', `✓ Configuration Biome restaurée depuis biome.json.bak`);
        return true;
    } else {
        log('yellow', `⚠ Aucun fichier de sauvegarde biome.json.bak trouvé dans ${rootDir}`);
        return false;
    }
}

// Fonction pour formater un fichier avec Biome
function formatWithBiome(filePath) {
    try {
        log('cyan', `Formatage de ${filePath} avec Biome`);
        execSync(`npx biome format --write "${filePath}"`, { stdio: 'pipe' });
        log('green', `✓ ${filePath} formaté avec succès`);
        return true;
    } catch (error) {
        log('yellow', `⚠ Échec du formatage de ${filePath}: ${error.message}`);
        return false;
    }
}

// Fonction pour vérifier l'installation de Biome
function checkBiomeInstallation() {
    try {
        execSync('npx biome --version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        log('yellow', `⚠ Biome n'est pas installé ou n'est pas accessible`);
        log('cyan', `Installation de Biome...`);

        try {
            execSync('npm install --save-dev @biomejs/biome', { stdio: 'pipe' });
            log('green', `✓ Biome installé avec succès`);
            return true;
        } catch (installError) {
            log('red', `✗ Impossible d'installer Biome: ${installError.message}`);
            return false;
        }
    }
}

// Fonction pour formater les fichiers problématiques
function formatProblematicFiles() {
    const rootDir = process.cwd();
    let successCount = 0;
    let failCount = 0;

    // Vérifier si Biome est installé
    if (!checkBiomeInstallation()) {
        return { success: 0, fail: problematicFiles.length };
    }

    for (const relativeFilePath of problematicFiles) {
        const filePath = path.join(rootDir, relativeFilePath);

        if (fs.existsSync(filePath)) {
            const success = formatWithBiome(filePath);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
        } else {
            log('red', `✗ Fichier non trouvé: ${filePath}`);
            failCount++;
        }
    }

    return { success: successCount, fail: failCount };
}

// Fonction principale
function main() {
    log('cyan', '=== Résolution des problèmes de formatage Biome ===');

    // Sauvegarder la configuration actuelle
    backupBiomeConfig();

    // Créer une configuration plus permissive
    if (!createTolerantBiomeConfig()) {
        log('red', `✗ Impossible de continuer sans une configuration Biome fonctionnelle`);
        return;
    }

    // Formater les fichiers problématiques
    const { success, fail } = formatProblematicFiles();

    // Afficher les statistiques
    log('cyan', '\n=== Résumé ===');
    log('green', `✓ ${success} fichiers formatés avec succès`);

    if (fail > 0) {
        log('red', `✗ ${fail} fichiers n'ont pas pu être formatés`);
        log('yellow', `⚠ Certains fichiers peuvent nécessiter une correction manuelle avant le formatage`);
    }

    // Demander à l'utilisateur s'il souhaite restaurer la configuration d'origine
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('Voulez-vous restaurer la configuration Biome d\'origine? (o/n) ', (answer) => {
        if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui') {
            restoreBiomeConfig();
        } else {
            log('yellow', `⚠ La configuration Biome permissive a été conservée`);
        }

        readline.close();
    });
}

// Exécuter le script
main();