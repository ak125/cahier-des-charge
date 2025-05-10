#!/usr/bin/env node

/**
 * Script pour générer un plan de consolidation des agents
 * basé sur le rapport d'analyse des implémentations d'agents.
 * 
 * Ce script lit le rapport généré et crée un plan concret avec des
 * actions spécifiques pour migrer les agents vers l'architecture en trois couches.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Structure cible pour l'architecture en trois couches
const targetStructure = {
    'orchestration': {
        basePath: 'packages/orchestration',
        subfolders: {
            'OrchestratorAgent': 'orchestrators',
            'MonitorAgent': 'monitors',
            'SchedulerAgent': 'schedulers',
            'OrchestrationAgent': 'core'
        },
        defaultSubfolder: 'core'
    },
    'coordination': {
        basePath: 'packages/coordination',
        subfolders: {
            'AdapterAgent': 'adapters',
            'BridgeAgent': 'bridges',
            'RegistryAgent': 'registries',
            'CoordinationAgent': 'core'
        },
        defaultSubfolder: 'core'
    },
    'business': {
        basePath: 'packages/business',
        subfolders: {
            'AnalyzerAgent': 'analyzers',
            'GeneratorAgent': 'generators',
            'ValidatorAgent': 'validators',
            'ParserAgent': 'parsers',
            'BusinessAgent': 'core'
        },
        defaultSubfolder: 'core'
    }
};

// Chemins des fichiers d'analyse
const analysisReportPath = path.join(projectRoot, 'reports', 'agent-implementation-analysis.md');
const consolidationPlanPath = path.join(projectRoot, 'reports', 'agent-consolidation-plan.md');
const migrationScriptPath = path.join(projectRoot, 'tools', 'scripts', 'migrate-agents.js');

// Structure pour stocker le plan de consolidation
const consolidationPlan = {
    totalAgents: 0,
    agentsByLayer: {
        orchestration: [],
        coordination: [],
        business: [],
        unknown: []
    },
    duplicateGroups: [],
    migrationActions: []
};

/**
 * Extrait des informations du rapport d'analyse
 */
function parseAnalysisReport() {
    try {
        if (!fs.existsSync(analysisReportPath)) {
            console.error(`Le rapport d'analyse n'existe pas: ${analysisReportPath}`);
            console.error('Veuillez d\'abord exécuter le script analyze-agent-implementations.js');
            process.exit(1);
        }

        console.log(`Analyse du rapport: ${analysisReportPath}`);
        const reportContent = fs.readFileSync(analysisReportPath, 'utf-8');

        // Extraire le nombre total d'agents par couche
        const totalMatch = reportContent.match(/Nombre total d'agents: (\d+)/);
        if (totalMatch) {
            consolidationPlan.totalAgents = parseInt(totalMatch[1]);
        }

        const layerMatches = reportContent.matchAll(/- \*\*Agents (d'orchestration|de coordination|métier \(business\)|non classifiés)\*\*: (\d+)/g);
        for (const match of layerMatches) {
            const layerName = match[1].includes('orchestration') ? 'orchestration' :
                match[1].includes('coordination') ? 'coordination' :
                    match[1].includes('business') ? 'business' : 'unknown';
            const count = parseInt(match[2]);

            console.log(`Couche ${layerName}: ${count} agents identifiés`);
        }

        // Extraire les groupes de duplications
        const duplicateSections = reportContent.split('### Couche ');
        if (duplicateSections.length > 1) {
            for (let i = 1; i < duplicateSections.length; i++) {
                const section = duplicateSections[i];
                const layerName = section.split('\n')[0].trim();

                const duplicateGroups = section.split('#### Duplication par ');

                for (let j = 1; j < duplicateGroups.length; j++) {
                    const group = duplicateGroups[j];
                    const type = group.startsWith('nom') ? 'name' : 'function';
                    const nameMatch = type === 'name' ?
                        group.match(/nom \(([^)]+)\)/) :
                        group.match(/fonctionnalité \(([^)]+)\)/);

                    const name = nameMatch ? nameMatch[1] : 'inconnu';

                    // Extraire les agents du groupe
                    const agents = [];
                    const tableLines = group.split('\n').filter(line => line.includes('|') && !line.includes('Classe') && !line.includes('------'));

                    for (const line of tableLines) {
                        const columns = line.split('|').map(col => col.trim());
                        if (columns.length >= 5) {
                            const className = columns[1];
                            const filePath = columns[2].replace(/`/g, '');
                            const sourceFolder = columns[3];
                            const modifiedDate = columns[4];

                            agents.push({ className, filePath, sourceFolder, modifiedDate });
                        }
                    }

                    if (agents.length > 0) {
                        consolidationPlan.duplicateGroups.push({
                            layer: layerName,
                            type,
                            name,
                            agents
                        });
                    }
                }
            }
        }

        console.log(`${consolidationPlan.duplicateGroups.length} groupes de duplication identifiés`);

        // Planifier les actions de migration
        planMigrationActions();
    } catch (err) {
        console.error('Erreur lors de l\'analyse du rapport:', err);
    }
}

/**
 * Détermine l'agent canonique à conserver pour chaque groupe de duplication
 */
function planMigrationActions() {
    console.log('\nPlanification des actions de migration...');

    // Pour chaque groupe de duplication
    for (const group of consolidationPlan.duplicateGroups) {
        const { layer, name, agents } = group;

        if (agents.length <= 1) continue;

        // Déterminer l'emplacement canonique
        let targetPath = '';
        let keepAgent = null;

        if (layer !== 'mixed' && targetStructure[layer]) {
            const layerConfig = targetStructure[layer];

            // Essayer de trouver un agent déjà dans l'emplacement canonique
            keepAgent = agents.find(agent => agent.filePath.startsWith(layerConfig.basePath));

            // Si aucun n'est trouvé, choisir l'agent le plus récent
            if (!keepAgent) {
                // Trier par date de modification (du plus récent au plus ancien)
                const sortedAgents = [...agents].sort((a, b) => {
                    return new Date(b.modifiedDate) - new Date(a.modifiedDate);
                });

                keepAgent = sortedAgents[0];
            }

            // Déterminer le sous-dossier approprié pour la migration
            let subfolder = layerConfig.defaultSubfolder;

            // Essayer de déterminer le sous-dossier à partir du type d'agent
            for (const [interfaceName, folderName] of Object.entries(layerConfig.subfolders)) {
                if (keepAgent.className.includes(interfaceName.replace('Agent', ''))) {
                    subfolder = folderName;
                    break;
                }
            }

            // Construire le chemin cible
            targetPath = path.join(layerConfig.basePath, subfolder, `${keepAgent.className}.ts`);
        } else {
            // Pour les agents de couche mixte ou inconnue, conservons simplement le plus récent
            const sortedAgents = [...agents].sort((a, b) => {
                return new Date(b.modifiedDate) - new Date(a.modifiedDate);
            });

            keepAgent = sortedAgents[0];
            targetPath = keepAgent.filePath;
        }

        // Enregistrer l'action de consolidation
        if (keepAgent) {
            const action = {
                group: name,
                layer,
                keepAgent,
                targetPath,
                agents: agents.filter(a => a.filePath !== keepAgent.filePath).map(a => ({
                    className: a.className,
                    filePath: a.filePath,
                    action: a.filePath === targetPath ? 'keep' : 'migrate'
                }))
            };

            consolidationPlan.migrationActions.push(action);
        }
    }

    console.log(`${consolidationPlan.migrationActions.length} actions de consolidation planifiées`);
    generateConsolidationPlan();
}

/**
 * Génère le plan de consolidation au format Markdown
 */
function generateConsolidationPlan() {
    console.log('\nGénération du plan de consolidation...');

    let plan = '# Plan de consolidation des agents\n\n';
    plan += `*Généré le ${new Date().toISOString()}*\n\n`;

    plan += '## Résumé\n\n';
    plan += `- **Nombre total d'agents**: ${consolidationPlan.totalAgents}\n`;
    plan += `- **Groupes de duplication**: ${consolidationPlan.duplicateGroups.length}\n`;
    plan += `- **Actions de consolidation**: ${consolidationPlan.migrationActions.length}\n\n`;

    plan += '## Actions de consolidation par couche\n\n';

    // Regrouper les actions par couche
    const actionsByLayer = {
        'orchestration': [],
        'coordination': [],
        'business': [],
        'mixed': [],
        'unknown': []
    };

    for (const action of consolidationPlan.migrationActions) {
        const layer = action.layer || 'unknown';
        if (!actionsByLayer[layer]) {
            actionsByLayer[layer] = [];
        }
        actionsByLayer[layer].push(action);
    }

    // Générer les sections par couche
    for (const [layer, actions] of Object.entries(actionsByLayer)) {
        if (actions.length > 0) {
            plan += `### Couche ${layer} (${actions.length} actions)\n\n`;

            for (const action of actions) {
                plan += `#### Consolidation de "${action.group}"\n\n`;
                plan += `- **Agent à conserver**: \`${action.keepAgent.className}\`\n`;
                plan += `- **Chemin cible**: \`${action.targetPath}\`\n\n`;

                plan += '**Agents à migrer:**\n\n';
                plan += '| Classe | Chemin source | Action |\n';
                plan += '|--------|--------------|--------|\n';

                for (const agent of action.agents) {
                    plan += `| ${agent.className} | \`${agent.filePath}\` | ${agent.action} |\n`;
                }

                plan += '\n';
            }
        }
    }

    plan += '## Plan d\'exécution\n\n';
    plan += '1. **Création des dossiers cibles**\n';
    plan += '   - Créer la structure de dossiers pour l\'architecture en trois couches\n';
    plan += '   - S\'assurer que tous les dossiers cibles existent\n\n';

    plan += '2. **Migration étape par étape**\n';
    plan += '   - Pour chaque groupe d\'agents, migrer vers l\'agent canonique\n';
    plan += '   - Conserver les fonctionnalités uniques lors de la consolidation\n';
    plan += '   - Mettre à jour les imports dans tous les fichiers qui utilisent les agents\n\n';

    plan += '3. **Validation**\n';
    plan += '   - Valider que le code compile après chaque groupe d\'actions\n';
    plan += '   - Exécuter les tests pour s\'assurer que la fonctionnalité est préservée\n\n';

    plan += '4. **Nettoyage**\n';
    plan += '   - Une fois les migrations validées, supprimer les fichiers d\'agents obsolètes\n';
    plan += '   - Mettre à jour la documentation pour refléter la nouvelle structure\n\n';

    // Générer un template de script de migration automatisée
    let migrationScript = `#!/usr/bin/env node

/**
 * Script de migration automatisée des agents vers l'architecture en trois couches
 * Basé sur le plan de consolidation généré le ${new Date().toISOString()}
 */

import fs from 'fs';
import path from 'path';

// Liste des actions de consolidation issues du plan
const consolidationActions = ${JSON.stringify(consolidationPlan.migrationActions, null, 2)};

// Fonction principale
async function migrateAgents() {
  console.log('Début de la migration des agents...');
  
  // Créer les dossiers cibles
  await createTargetFolders();
  
  // Pour chaque action de consolidation
  for (const action of consolidationActions) {
    console.log(\`\\nConsolidation du groupe "\${action.group}"...\`);
    
    // Vérifier que l'agent à conserver existe
    const keepFilePath = action.keepAgent.filePath;
    if (!fs.existsSync(keepFilePath)) {
      console.error(\`L'agent à conserver n'existe pas: \${keepFilePath}\`);
      continue;
    }
    
    // Déplacer l'agent vers l'emplacement cible si nécessaire
    const targetPath = action.targetPath;
    if (keepFilePath !== targetPath) {
      console.log(\`Déplacement de \${keepFilePath} vers \${targetPath}\`);
      
      // Créer le dossier cible s'il n'existe pas
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copier le fichier vers l'emplacement cible
      fs.copyFileSync(keepFilePath, targetPath);
      
      // TODO: Mettre à jour les imports dans le fichier cible
    }
    
    // Pour chaque agent à migrer
    for (const agent of action.agents) {
      if (agent.action === 'migrate') {
        console.log(\`Migration de \${agent.filePath}...\`);
        
        // TODO: Extraire les fonctionnalités uniques et les ajouter à l'agent cible
        
        // TODO: Mettre à jour les imports qui référencent cet agent
      }
    }
  }
  
  console.log('\\nMigration terminée!');
}

// Création des dossiers cibles
async function createTargetFolders() {
  console.log('Création des dossiers cibles...');
  
  const folderStructure = {
    'packages/orchestration/core': true,
    'packages/orchestration/orchestrators': true,
    'packages/orchestration/monitors': true,
    'packages/orchestration/schedulers': true,
    'packages/coordination/core': true,
    'packages/coordination/adapters': true,
    'packages/coordination/bridges': true,
    'packages/coordination/registries': true,
    'packages/business/core': true,
    'packages/business/analyzers': true,
    'packages/business/generators': true,
    'packages/business/validators': true,
    'packages/business/parsers': true
  };
  
  for (const folder of Object.keys(folderStructure)) {
    const fullPath = path.resolve(process.cwd(), folder);
    if (!fs.existsSync(fullPath)) {
      console.log(\`Création du dossier: \${folder}\`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

// Vérification du dossier cible
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Lancer la migration
migrateAgents().catch(err => {
  console.error('Erreur lors de la migration:', err);
  process.exit(1);
});
`;

    // Écrire le plan dans un fichier
    fs.writeFileSync(consolidationPlanPath, plan);
    console.log(`Plan de consolidation généré: ${consolidationPlanPath}`);

    // Écrire le script de migration
    fs.writeFileSync(migrationScriptPath, migrationScript);
    console.log(`Script de migration généré: ${migrationScriptPath}`);
}

// Exécuter l'analyse
parseAnalysisReport();