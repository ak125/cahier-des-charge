#!/usr/bin/env node

/**
 * Script de migration automatisée des agents vers l'architecture en trois couches
 * Version améliorée basée sur le plan de consolidation et les résultats du lot de test
 * 
 * Ce script permet de migrer les agents par lots fonctionnels vers l'architecture en trois couches:
 * - Orchestration: gestion des workflows (orchestrators, monitors, schedulers)
 * - Coordination: communication entre systèmes (adapters, bridges, registries)
 * - Business: logique métier (analyzers, generators, validators, parsers)
 * 
 * Usage:
 * node migrate-agents.js [--batch=<batch-name>] [--dry-run]
 * 
 * Options:
 *   --batch=<batch-name>: Migre uniquement le lot spécifié (orchestration, coordination, business, etc.)
 *   --dry-run: Simule la migration sans effectuer de modifications réelles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Analyser les arguments de la ligne de commande
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
let selectedBatch = null;

for (const arg of args) {
    if (arg.startsWith('--batch=')) {
        selectedBatch = arg.split('=')[1].toLowerCase();
    }
}

// Configuration des couches et des sous-dossiers
const layerConfig = {
    'orchestration': {
        'basePath': '/workspaces/cahier-des-charge/packages/orchestration',
        'subfolders': {
            'orchestrator': 'orchestrators',
            'monitor': 'monitors',
            'scheduler': 'schedulers',
            'default': 'core'
        }
    },
    'coordination': {
        'basePath': '/workspaces/cahier-des-charge/packages/coordination',
        'subfolders': {
            'adapter': 'adapters',
            'bridge': 'bridges',
            'registry': 'registries',
            'default': 'core'
        }
    },
    'business': {
        'basePath': '/workspaces/cahier-des-charge/packages/business',
        'subfolders': {
            'analyzer': 'analyzers',
            'generator': 'generators',
            'validator': 'validators',
            'parser': 'parsers',
            'default': 'core'
        }
    }
};

// Liste des actions de consolidation issues du plan
// Nous utilisons les actions définies dans le plan de consolidation
const consolidationActions = [
    {
        "group": "monitor-agent",
        "layer": "orchestration",
        "keepAgent": {
            "className": "monitor-agent",
            "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/orchestration/monitor-agent.ts",
            "sourceFolder": "packages/core",
            "modifiedDate": "2025-05-08"
        },
        "targetPath": "/workspaces/cahier-des-charge/packages/orchestration/monitors/monitor-agent.ts",
        "agents": [
            {
                "className": "monitor-agent",
                "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/orchestration/monitor/monitor-agent.ts",
                "action": "migrate"
            },
            {
                "className": "monitor-agent",
                "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/monitor-agent.ts",
                "action": "migrate"
            }
        ]
    },
    {
        "group": "scheduler-agent",
        "layer": "orchestration",
        "keepAgent": {
            "className": "scheduler-agent",
            "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/orchestration/scheduler-agent.ts",
            "sourceFolder": "packages/core",
            "modifiedDate": "2025-05-08"
        },
        "targetPath": "/workspaces/cahier-des-charge/packages/orchestration/schedulers/scheduler-agent.ts",
        "agents": [
            {
                "className": "scheduler-agent",
                "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/orchestration/scheduler/scheduler-agent.ts",
                "action": "migrate"
            },
            {
                "className": "scheduler-agent",
                "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/scheduler-agent.ts",
                "action": "migrate"
            }
        ]
    },
    {
        "group": "bridge-agent",
        "layer": "coordination",
        "keepAgent": {
            "className": "bridge-agent",
            "filePath": "/workspaces/cahier-des-charge/packages/business/src/core/interfaces/coordination/bridge/bridge-agent.ts",
            "sourceFolder": "packages/business",
            "modifiedDate": "2025-05-08"
        },
        "targetPath": "/workspaces/cahier-des-charge/packages/coordination/bridges/bridge-agent.ts",
        "agents": [
            {
                "className": "bridge-agent",
                "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/coordination/bridge-agent.ts",
                "action": "migrate"
            },
            {
                "className": "bridge-agent",
                "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/coordination/bridge-agent.ts",
                "action": "migrate"
            }
        ]
    },
    {
        "group": "analyzer-agent",
        "layer": "business",
        "keepAgent": {
            "className": "analyzer-agent",
            "filePath": "/workspaces/cahier-des-charge/packages/core/interfaces/business/analyzer-agent.ts",
            "sourceFolder": "packages/core",
            "modifiedDate": "2025-05-08"
        },
        "targetPath": "/workspaces/cahier-des-charge/packages/business/analyzers/analyzer-agent.ts",
        "agents": [
            {
                "className": "analyzer-agent",
                "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/analyzer-agent.ts",
                "action": "migrate"
            }
        ]
    },
    {
        "group": "abstract-analyzer-agentd-240d1f1c",
        "layer": "business",
        "keepAgent": {
            "className": "abstract-analyzer-agentd-240d1f1c",
            "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/abstract-analyzer-agentd-240d1f1c.ts",
            "sourceFolder": "packages/migrated-agents",
            "modifiedDate": "2025-05-08"
        },
        "targetPath": "/workspaces/cahier-des-charge/packages/business/analyzers/abstract-analyzer-agentd-240d1f1c.ts",
        "agents": [
            {
                "className": "abstract-analyzer-agentd-240d1f1c",
                "filePath": "/workspaces/cahier-des-charge/packages/business/business/analyzers/abstract-analyzer/abstract-analyzer-agentd-240d1f1c.ts",
                "action": "migrate"
            }
        ]
    },
    {
        "group": "generate-agent-manifest",
        "layer": "business",
        "keepAgent": {
            "className": "generate-agent-manifest",
            "filePath": "/workspaces/cahier-des-charge/packages/migrated-agents/business/generate-agent-manifest.ts",
            "sourceFolder": "packages/migrated-agents",
            "modifiedDate": "2025-05-08"
        },
        "targetPath": "/workspaces/cahier-des-charge/packages/business/generators/generate-agent-manifest.ts",
        "agents": [
            {
                "className": "generate-agent-manifest",
                "filePath": "/workspaces/cahier-des-charge/packages/business/business/agents/generate-agent-manifest.ts",
                "action": "migrate"
            }
        ]
    }
    // D'autres actions peuvent être ajoutées au fur et à mesure des besoins
];

// Organisation des actions en lots (batches)
const batches = {};

// Regrouper les actions par couche (pour les lots de base)
consolidationActions.forEach(action => {
    const layer = action.layer;

    // Créer le lot s'il n'existe pas encore
    if (!batches[layer]) {
        batches[layer] = [];
    }

    // Ajouter l'action au lot
    batches[layer].push(action);
});

/**
 * Vérifie si un fichier existe
 */
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
}

/**
 * Vérifie si un dossier existe, sinon le crée
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`Création du dossier: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Mettre à jour les imports dans le contenu d'un fichier
 * pour pointer vers les interfaces canoniques
 */
function updateImports(content, agent) {
    // Remplacer les imports des interfaces dupliquées par les imports canoniques
    let updatedContent = content;

    // Remplacer les imports relatifs par des imports canoniques
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    const matches = [...content.matchAll(importRegex)];

    for (const match of matches) {
        const importedItems = match[1].split(',').map(item => item.trim());
        const importPath = match[2];

        // Si c'est un import d'interface de l'architecture en couches, le mettre à jour
        if (importPath.includes('layer-contracts') ||
            importPath.includes('mcp-types') ||
            importPath.includes('interfaces') &&
            (importedItems.some(item => item.includes('Agent') || item.includes('Context')))) {

            const interfaceImports = {};

            // Regrouper les imports par couche
            for (const item of importedItems) {
                let layer = 'base';
                if (item.includes('Orchestration') || item.includes('Orchestrator') ||
                    item.includes('Monitor') || item.includes('Scheduler')) {
                    layer = 'orchestration';
                } else if (item.includes('Coordination') || item.includes('Adapter') ||
                    item.includes('Bridge') || item.includes('Registry')) {
                    layer = 'coordination';
                } else if (item.includes('Business') || item.includes('Analyzer') ||
                    item.includes('Generator') || item.includes('Validator') ||
                    item.includes('Parser')) {
                    layer = 'business';
                }

                if (!interfaceImports[layer]) {
                    interfaceImports[layer] = [];
                }
                interfaceImports[layer].push(item);
            }

            // Construire les nouveaux imports
            let newImports = [];
            for (const [layer, items] of Object.entries(interfaceImports)) {
                if (layer === 'base') {
                    newImports.push(`import { ${items.join(', ')} } from '@core/interfaces/base/base-agent';`);
                } else if (layer === 'orchestration') {
                    for (const item of items) {
                        if (item.includes('Orchestrator')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/orchestration/orchestrator-agent';`);
                        } else if (item.includes('Monitor')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/orchestration/monitor-agent';`);
                        } else if (item.includes('Scheduler')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/orchestration/scheduler-agent';`);
                        } else {
                            newImports.push(`import { ${item} } from '@core/interfaces/orchestration/orchestration-agent';`);
                        }
                    }
                } else if (layer === 'coordination') {
                    for (const item of items) {
                        if (item.includes('Adapter')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/coordination/adapter-agent';`);
                        } else if (item.includes('Bridge')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/coordination/bridge-agent';`);
                        } else if (item.includes('Registry')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/coordination/registry-agent';`);
                        } else {
                            newImports.push(`import { ${item} } from '@core/interfaces/coordination/coordination-agent';`);
                        }
                    }
                } else if (layer === 'business') {
                    for (const item of items) {
                        if (item.includes('Analyzer')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/business/analyzer-agent';`);
                        } else if (item.includes('Generator')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/business/generator-agent';`);
                        } else if (item.includes('Validator')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/business/validator-agent';`);
                        } else if (item.includes('Parser')) {
                            newImports.push(`import { ${item} } from '@core/interfaces/business/parser-agent';`);
                        } else {
                            newImports.push(`import { ${item} } from '@core/interfaces/business/business-agent';`);
                        }
                    }
                }
            }

            // Remplacer l'import original par les nouveaux imports
            updatedContent = updatedContent.replace(match[0], newImports.join('\n'));
        }
    }

    return updatedContent;
}

/**
 * Ajouter l'en-tête de documentation standardisée à un agent
 */
function addStandardHeader(content, agent) {
    const header = `/**
 * ${agent.group}
 * 
 * Architecture en trois couches : Couche ${agent.layer}
 * 
 * Cet agent implémente l'interface canonique définie dans:
 * ${agent.keepAgent.filePath}
 * 
 * Migré le ${new Date().toISOString().split('T')[0]}
 */

`;

    return header + content;
}

/**
 * Déterminer le chemin cible pour un agent en fonction de sa couche et de son type
 */
function determineTargetPath(action) {
    // Si le chemin cible est déjà défini, l'utiliser
    if (action.targetPath && action.targetPath.startsWith('/')) {
        return action.targetPath;
    }

    const layer = action.layer;
    const config = layerConfig[layer];

    if (!config) {
        throw new Error(`Configuration de couche non trouvée pour: ${layer}`);
    }

    // Déterminer le sous-dossier en fonction du nom de l'agent
    let subfolder = config.subfolders.default;

    const name = action.group.toLowerCase();

    for (const [type, folder] of Object.entries(config.subfolders)) {
        if (name.includes(type.toLowerCase())) {
            subfolder = folder;
            break;
        }
    }

    return path.join(config.basePath, subfolder, `${action.group}.ts`);
}

/**
 * Migrer un agent spécifique
 */
async function migrateAgent(action, agent) {
    const agentName = agent.className || action.group;
    console.log(`\n[Migration] Traitement de l'agent ${agentName} (${action.layer})`);

    // Vérifier l'existence du fichier source
    if (!fileExists(agent.filePath)) {
        console.error(`  [ERREUR] Le fichier source n'existe pas: ${agent.filePath}`);
        return false;
    }

    // Vérifier l'existence du fichier d'interface
    if (!fileExists(action.keepAgent.filePath)) {
        console.warn(`  [AVERTISSEMENT] L'interface canonique n'existe pas: ${action.keepAgent.filePath}`);
        // Continuons malgré tout
    }

    // Déterminer le chemin cible
    const targetPath = action.targetPath || determineTargetPath(action);

    // Créer le dossier cible si nécessaire
    const targetDir = path.dirname(targetPath);
    ensureDirectoryExists(targetDir);

    if (dryRun) {
        console.log(`  [SIMULATION] Migration de ${agent.filePath} vers ${targetPath}`);
        return true;
    }

    try {
        // Lire le contenu du fichier source
        let content = fs.readFileSync(agent.filePath, 'utf-8');

        // Mettre à jour les imports pour pointer vers les interfaces canoniques
        content = updateImports(content, {
            name: agentName,
            interfacePath: action.keepAgent.filePath
        });

        // Ajouter l'en-tête standardisée
        content = addStandardHeader(content, action);

        // Écrire le contenu dans le fichier cible
        fs.writeFileSync(targetPath, content);

        console.log(`  [SUCCÈS] Agent migré vers: ${targetPath}`);

        // Mise à jour du journal de migration
        updateMigrationLog({
            name: agentName,
            layer: action.layer,
            sourcePath: agent.filePath,
            targetPath: targetPath
        });

        return true;
    } catch (err) {
        console.error(`  [ERREUR] Échec de la migration: ${err.message}`);
        return false;
    }
}

/**
 * Migrer un groupe d'agents
 */
async function migrateAgentGroup(action) {
    console.log(`\n[Groupe] Migration du groupe ${action.group} (${action.layer})`);

    let successCount = 0;

    for (const agent of action.agents) {
        if (agent.action === 'migrate') {
            const success = await migrateAgent(action, agent);
            if (success) successCount++;
        }
    }

    return successCount;
}

/**
 * Migrer un lot d'agents
 */
async function migrateBatch(batchName) {
    const batchActions = batches[batchName];

    if (!batchActions || batchActions.length === 0) {
        console.error(`Lot non trouvé ou vide: ${batchName}`);
        return 0;
    }

    console.log(`\n=== Migration du lot: ${batchName} (${batchActions.length} groupes d'agents) ===`);

    let successCount = 0;

    for (const action of batchActions) {
        const groupSuccessCount = await migrateAgentGroup(action);
        successCount += groupSuccessCount;
    }

    console.log(`\n=== Fin de la migration du lot: ${batchName} ===`);
    console.log(`Total des agents migrés avec succès: ${successCount}`);

    return successCount;
}

/**
 * Mettre à jour le journal de migration
 */
function updateMigrationLog(agent) {
    const logPath = path.join(projectRoot, 'reports', 'migration-journal.md');
    const date = new Date().toISOString().split('T')[0];

    let logContent = '';
    if (fs.existsSync(logPath)) {
        logContent = fs.readFileSync(logPath, 'utf-8');
    } else {
        logContent = '# Journal de migration vers l\'architecture en trois couches\n\n';
        logContent += '| Date | Agent | Couche | Source | Destination | Statut |\n';
        logContent += '|------|-------|--------|--------|-------------|--------|\n';
    }

    // Ajouter l'entrée de journal
    const logEntry = `| ${date} | ${agent.name} | ${agent.layer} | ${agent.sourcePath} | ${agent.targetPath} | Migré |\n`;

    // Vérifier si cette entrée existe déjà
    if (!logContent.includes(logEntry)) {
        logContent += logEntry;

        // Créer le dossier reports si nécessaire
        ensureDirectoryExists(path.join(projectRoot, 'reports'));

        // Écrire le journal mis à jour
        fs.writeFileSync(logPath, logContent);
        console.log(`  [INFO] Journal de migration mis à jour: ${logPath}`);
    }
}

/**
 * Mettre à jour les statistiques de migration
 */
function updateMigrationStats(batchName, successCount, totalCount) {
    const statsPath = path.join(projectRoot, 'reports', 'migration-stats.json');

    let stats = {
        totalAgents: 0,
        migratedAgents: 0,
        lastUpdate: new Date().toISOString(),
        batches: {}
    };

    if (fs.existsSync(statsPath)) {
        try {
            stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
        } catch (err) {
            console.warn(`[AVERTISSEMENT] Impossible de lire les statistiques existantes: ${err.message}`);
        }
    }

    // Mettre à jour les statistiques du lot
    if (!stats.batches[batchName]) {
        stats.batches[batchName] = {
            total: totalCount,
            migrated: successCount,
            lastUpdate: new Date().toISOString()
        };
    } else {
        stats.batches[batchName].migrated += successCount;
        stats.batches[batchName].lastUpdate = new Date().toISOString();
    }

    // Recalculer les totaux
    let totalMigrated = 0;
    let totalAgents = 0;

    for (const batch of Object.values(stats.batches)) {
        totalMigrated += batch.migrated;
        totalAgents += batch.total;
    }

    stats.migratedAgents = totalMigrated;
    stats.totalAgents = totalAgents;
    stats.lastUpdate = new Date().toISOString();

    // Créer le dossier reports si nécessaire
    ensureDirectoryExists(path.join(projectRoot, 'reports'));

    // Écrire les statistiques mises à jour
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`[INFO] Statistiques de migration mises à jour: ${statsPath}`);

    // Générer un rapport HTML de progression
    generateMigrationReport(stats);
}

/**
 * Générer un rapport HTML de progression de la migration
 */
function generateMigrationReport(stats) {
    const reportPath = path.join(projectRoot, 'reports', 'migration-progress.html');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de progression de la migration</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; color: #333; }
    h1 { color: #0066cc; }
    h2 { color: #0099cc; margin-top: 30px; }
    .progress-container { margin: 20px 0; }
    .progress-bar { 
      background-color: #f0f0f0;
      border-radius: 4px;
      height: 25px;
      padding: 0;
      width: 100%;
    }
    .progress-bar > div {
      background-color: #4caf50;
      color: white;
      height: 100%;
      text-align: center;
      line-height: 25px;
      border-radius: 4px;
    }
    .batch-progress .progress-bar { width: 200px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Rapport de progression de la migration</h1>
  
  <div class="progress-container">
    <h2>Progression globale</h2>
    <p>Agents migrés: ${stats.migratedAgents} / ${stats.totalAgents}</p>
    <div class="progress-bar">
      <div style="width:${Math.round((stats.migratedAgents / stats.totalAgents) * 100)}%">
        ${Math.round((stats.migratedAgents / stats.totalAgents) * 100)}%
      </div>
    </div>
    <p><small>Dernière mise à jour: ${new Date(stats.lastUpdate).toLocaleString()}</small></p>
  </div>
  
  <h2>Progression par lot</h2>
  <table>
    <tr>
      <th>Lot</th>
      <th>Migrés</th>
      <th>Total</th>
      <th>Progression</th>
      <th>Dernière mise à jour</th>
    </tr>
    ${Object.entries(stats.batches).map(([name, batch]) => `
      <tr>
        <td>${name}</td>
        <td>${batch.migrated}</td>
        <td>${batch.total}</td>
        <td class="batch-progress">
          <div class="progress-bar">
            <div style="width:${Math.round((batch.migrated / batch.total) * 100)}%">${Math.round((batch.migrated / batch.total) * 100)}%</div>
          </div>
        </td>
        <td>${new Date(batch.lastUpdate).toLocaleString()}</td>
      </tr>
    `).join('')}
  </table>
  
  <h2>Comment poursuivre la migration ?</h2>
  <p>Pour migrer un lot spécifique, exécutez la commande suivante :</p>
  <pre>node migrate-agents.js --batch=&lt;nom-du-lot&gt;</pre>
  <p>Lots disponibles : ${Object.keys(stats.batches).join(', ')}</p>
  
  <p>Pour simuler une migration sans effectuer de modifications réelles :</p>
  <pre>node migrate-agents.js --batch=&lt;nom-du-lot&gt; --dry-run</pre>
  
  <p><strong>Note :</strong> Vérifiez que le code compile correctement après chaque lot migré.</p>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    console.log(`[INFO] Rapport de migration généré: ${reportPath}`);
}

/**
 * Fonction principale
 */
async function main() {
    console.log(`\n=== Migration des agents vers l'architecture en trois couches ===`);
    console.log(`Mode: ${dryRun ? 'Simulation (dry-run)' : 'Exécution réelle'}`);

    // S'assurer que tous les dossiers nécessaires existent
    for (const config of Object.values(layerConfig)) {
        for (const subfolder of Object.values(config.subfolders)) {
            ensureDirectoryExists(path.join(config.basePath, subfolder));
        }
    }

    // Calculer le nombre total d'agents
    const totalAgents = consolidationActions.reduce((total, action) =>
        total + action.agents.filter(agent => agent.action === 'migrate').length, 0);

    console.log(`Total des agents à migrer: ${totalAgents}`);

    // Si un lot spécifique est demandé, ne migrer que ce lot
    if (selectedBatch) {
        if (!batches[selectedBatch]) {
            console.error(`Lot non trouvé: ${selectedBatch}`);
            console.log('Lots disponibles:', Object.keys(batches).join(', '));
            process.exit(1);
        }

        const successCount = await migrateBatch(selectedBatch);

        // Mise à jour des statistiques
        if (!dryRun) {
            updateMigrationStats(selectedBatch, successCount, batches[selectedBatch].length);
        }
    }
    // Sinon, afficher la liste des lots disponibles
    else {
        console.log('\nLots disponibles:');
        for (const [name, actions] of Object.entries(batches)) {
            console.log(`  - ${name}: ${actions.length} groupes d'agents`);
        }
        console.log('\nUtilisez --batch=<nom-du-lot> pour migrer un lot spécifique');
        console.log('Exemple: node migrate-agents.js --batch=orchestration');
    }

    console.log(`\n=== Fin de la migration ===`);

    if (!dryRun && !selectedBatch) {
        console.log(`\nRecommandation: Commencez par migrer un lot et vérifiez que tout fonctionne correctement.`);
        console.log(`Exemple: node migrate-agents.js --batch=orchestration`);
    }
}

// Lancer la migration
main().catch(err => {
    console.error('Erreur lors de la migration:', err);
    process.exit(1);
});
