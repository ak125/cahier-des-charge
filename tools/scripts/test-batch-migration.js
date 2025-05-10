#!/usr/bin/env node

/**
 * Script de migration test pour un lot d'agents
 * Ce script migre un agent de chaque couche (orchestration, coordination, business)
 * pour valider l'approche de migration avant de procéder à une migration complète.
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

// Chemins des agents à migrer (un par couche)
const agentsToMigrate = [
  {
    layer: 'orchestration',
    name: 'monitor-agent',
    sourcePath: '/workspaces/cahier-des-charge/packages/migrated-agents/orchestration/monitor-agent.ts',
    targetPath: '/workspaces/cahier-des-charge/packages/orchestration/monitors/monitor-agent.ts',
    interfacePath: '/workspaces/cahier-des-charge/packages/core/interfaces/orchestration/monitor-agent.ts'
  },
  {
    layer: 'coordination',
    name: 'bridge-agent',
    sourcePath: '/workspaces/cahier-des-charge/packages/migrated-agents/coordination/bridge-agent.ts',
    targetPath: '/workspaces/cahier-des-charge/packages/coordination/bridges/bridge-agent.ts',
    interfacePath: '/workspaces/cahier-des-charge/packages/core/interfaces/coordination/bridge-agent.ts'
  },
  {
    layer: 'business',
    name: 'analyzer-agent',
    sourcePath: '/workspaces/cahier-des-charge/packages/migrated-agents/business/analyzer-agent.ts',
    targetPath: '/workspaces/cahier-des-charge/packages/business/analyzers/analyzer-agent.ts',
    interfacePath: '/workspaces/cahier-des-charge/packages/core/interfaces/business/analyzer-agent.ts'
  }
];

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
 * ${agent.name}
 * 
 * Architecture en trois couches : Couche ${agent.layer}
 * 
 * Cet agent implémente l'interface canonique définie dans:
 * ${agent.interfacePath}
 * 
 * Migré le ${new Date().toISOString().split('T')[0]}
 */

`;

  return header + content;
}

/**
 * Migrer un agent spécifique
 */
async function migrateAgent(agent) {
  console.log(`\n[Migration] Traitement de l'agent ${agent.name} (${agent.layer})`);

  // Vérifier l'existence du fichier source
  if (!fileExists(agent.sourcePath)) {
    console.error(`  [ERREUR] Le fichier source n'existe pas: ${agent.sourcePath}`);
    return false;
  }

  // Vérifier l'existence du fichier d'interface
  if (!fileExists(agent.interfacePath)) {
    console.warn(`  [AVERTISSEMENT] L'interface canonique n'existe pas: ${agent.interfacePath}`);
    // Continuons malgré tout
  }

  // Créer le dossier cible si nécessaire
  const targetDir = path.dirname(agent.targetPath);
  ensureDirectoryExists(targetDir);

  try {
    // Lire le contenu du fichier source
    let content = fs.readFileSync(agent.sourcePath, 'utf-8');

    // Mettre à jour les imports pour pointer vers les interfaces canoniques
    content = updateImports(content, agent);

    // Ajouter l'en-tête standardisée
    content = addStandardHeader(content, agent);

    // Écrire le contenu dans le fichier cible
    fs.writeFileSync(agent.targetPath, content);

    console.log(`  [SUCCÈS] Agent migré vers: ${agent.targetPath}`);

    // Mise à jour du journal de migration
    updateMigrationLog(agent);

    return true;
  } catch (err) {
    console.error(`  [ERREUR] Échec de la migration: ${err.message}`);
    return false;
  }
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
 * Migrer tous les agents du lot de test
 */
async function migrateTestBatch() {
  console.log('Début de la migration du lot de test...');

  // Vérifier si le dossier de coordination existe, sinon le créer
  ensureDirectoryExists('/workspaces/cahier-des-charge/packages/coordination');
  ensureDirectoryExists('/workspaces/cahier-des-charge/packages/coordination/bridges');

  let successCount = 0;

  for (const agent of agentsToMigrate) {
    const success = await migrateAgent(agent);
    if (success) successCount++;
  }

  console.log(`\nMigration terminée: ${successCount}/${agentsToMigrate.length} agents migrés avec succès.`);
  console.log('\nÉtape suivante recommandée: Vérifier que les agents migrés compilent correctement');
  console.log('Exécutez: cd /workspaces/cahier-des-charge && pnpm run build');
}

// Exécuter la migration du lot de test
migrateTestBatch().catch(err => {
  console.error('Erreur lors de l\'exécution du script de migration:', err);
  process.exit(1);
});