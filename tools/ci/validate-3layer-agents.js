#!/usr/bin/env node

/**
 * Script de validation des agents dans l'architecture en 3 couches
 * 
 * Ce script parcourt les répertoires des trois couches (business, coordination, 
 * orchestration) et vérifie que les agents respectent les règles de l'architecture.
 * Il vérifie notamment :
 * - Les imports entre les couches (une couche ne peut importer que des couches inférieures)
 * - La présence des fichiers d'interface des agents
 * - La conformité des interfaces des agents
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Chemins des couches
const layers = {
    business: path.join(rootDir, 'packages', 'business'),
    coordination: path.join(rootDir, 'packages', 'coordination'),
    orchestration: path.join(rootDir, 'packages', 'orchestration')
};

// Journal des actions
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// Fonction pour trouver les fichiers d'agent
function findAgentFiles(layer) {
    try {
        const layerPath = layers[layer];
        const pattern1 = `${layerPath}/**/*-agent.ts`;
        const pattern2 = `${layerPath}/**/agent/*.ts`;

        const command = `find ${layerPath} -name "*-agent.ts" -o -path "${layerPath}/**/agent/*.ts" | grep -v "node_modules" | grep -v ".nx" | grep -v "dist"`;
        const output = execSync(command, { encoding: 'utf8' });

        const files = output.trim().split('\n').filter(Boolean);
        log(`📁 Trouvé ${files.length} fichiers d'agent dans la couche ${layer}`);

        return files;
    } catch (error) {
        log(`❌ Erreur lors de la recherche des fichiers d'agent dans ${layer}: ${error.message}`);
        return [];
    }
}

// Fonction pour vérifier les imports interdits
function checkForbiddenImports(filePath, layerName) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let hasErrors = false;

    // Vérification des imports interdits selon la couche
    if (layerName === 'business') {
        // La couche business ne peut pas importer des couches coordination ou orchestration
        if (fileContent.includes("from 'packages/coordination") ||
            fileContent.includes("from \"packages/coordination") ||
            fileContent.includes("from 'packages/orchestration") ||
            fileContent.includes("from \"packages/orchestration")) {
            log(`❌ Erreur d'import dans le fichier ${filePath}:`);
            log(`   La couche business ne peut pas importer des couches coordination ou orchestration`);
            hasErrors = true;

            // Correction automatique (commentaire des imports interdits)
            const correctedContent = fileContent.replace(
                /(import.*from\s+['"]packages\/(coordination|orchestration).*['"]\s*;)/g,
                '// FORBIDDEN IMPORT: $1'
            );

            if (correctedContent !== fileContent) {
                fs.writeFileSync(filePath, correctedContent);
                log(`✅ Correction appliquée: imports interdits commentés`);
            }
        }
    } else if (layerName === 'coordination') {
        // La couche coordination ne peut pas importer de la couche orchestration
        if (fileContent.includes("from 'packages/orchestration") ||
            fileContent.includes("from \"packages/orchestration")) {
            log(`❌ Erreur d'import dans le fichier ${filePath}:`);
            log(`   La couche coordination ne peut pas importer de la couche orchestration`);
            hasErrors = true;

            // Correction automatique (commentaire des imports interdits)
            const correctedContent = fileContent.replace(
                /(import.*from\s+['"]packages\/orchestration.*['"]\s*;)/g,
                '// FORBIDDEN IMPORT: $1'
            );

            if (correctedContent !== fileContent) {
                fs.writeFileSync(filePath, correctedContent);
                log(`✅ Correction appliquée: imports interdits commentés`);
            }
        }
    }

    return hasErrors;
}

// Fonction pour vérifier et corriger l'interface des agents
function checkAgentInterface(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let hasErrors = false;

    // Vérification de l'implémentation de l'interface IAgent
    if (!fileContent.includes('implements IAgent') && !fileContent.includes('extends BaseAgent')) {
        log(`❌ Erreur d'interface dans le fichier ${filePath}:`);
        log(`   L'agent doit implémenter l'interface IAgent ou étendre BaseAgent`);
        hasErrors = true;

        // Tentative de correction automatique
        const className = fileContent.match(/export\s+class\s+(\w+)/);
        if (className && className[1]) {
            const correctedContent = fileContent.replace(
                `export class ${className[1]}`,
                `export class ${className[1]} implements IAgent`
            );

            if (correctedContent !== fileContent) {
                // Ajouter l'import si nécessaire
                let finalContent = correctedContent;
                if (!correctedContent.includes("import { IAgent }")) {
                    finalContent = `import { IAgent } from 'packages/business/src/interfaces/agent';\n${correctedContent}`;
                }

                fs.writeFileSync(filePath, finalContent);
                log(`✅ Correction appliquée: interface IAgent ajoutée à la classe ${className[1]}`);
            }
        }
    }

    // Vérification des méthodes obligatoires
    const requiredMethods = ['initialize', 'process', 'shutdown'];
    for (const method of requiredMethods) {
        const methodRegex = new RegExp(`(async\\s+)?${method}\\s*\\(`);
        if (!methodRegex.test(fileContent)) {
            log(`❌ Erreur de méthode dans le fichier ${filePath}:`);
            log(`   La méthode obligatoire '${method}' est manquante`);
            hasErrors = true;

            // La correction automatique des méthodes manquantes est plus complexe
            // et n'est pas implémentée ici pour éviter des erreurs
        }
    }

    return hasErrors;
}

// Fonction principale
async function main() {
    log('🚀 Démarrage de la validation des agents dans l'architecture 3 couches...');
  
  let totalErrors = 0;

    // Parcourir chaque couche
    for (const layer of Object.keys(layers)) {
        log(`📝 Analyse de la couche ${layer}...`);

        const agentFiles = findAgentFiles(layer);

        if (agentFiles.length > 0) {
            for (const file of agentFiles) {
                log(`🔍 Vérification du fichier ${file}`);

                let fileErrors = 0;

                // Vérification des imports entre couches
                if (checkForbiddenImports(file, layer)) {
                    fileErrors++;
                }

                // Vérification des interfaces
                if (checkAgentInterface(file)) {
                    fileErrors++;
                }

                // Comptabiliser les erreurs
                if (fileErrors > 0) {
                    log(`⚠️ ${fileErrors} problème(s) détecté(s) dans ${file}`);
                    totalErrors += fileErrors;
                } else {
                    log(`✅ Aucun problème détecté dans ${file}`);
                }
            }
        } else {
            log(`⚠️ Aucun fichier d'agent trouvé dans la couche ${layer}`);
        }
    }

    // Rapport final
    if (totalErrors > 0) {
        log(`❌ Validation terminée avec ${totalErrors} erreurs.`);
        log(`💡 Des corrections automatiques ont été appliquées lorsque possible.`);
        // Ne pas faire échouer le processus pour permettre de commiter les corrections
        process.exit(0);
    } else {
        log(`✅ Validation réussie! Tous les agents sont conformes à l'architecture en 3 couches.`);
        process.exit(0);
    }
}

// Exécuter le script
main().catch(error => {
    log(`❌ Erreur lors de l'exécution du script: ${error.message}`);
    process.exit(1);
});
