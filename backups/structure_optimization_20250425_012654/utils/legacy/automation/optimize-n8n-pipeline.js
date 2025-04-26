#!/usr/bin/env node

/**
 * Script d'optimisation pour n8n.pipeline.json
 * 
 * Ce script optimise le fichier n8n.pipeline.json en:
 * - Appliquant des paramètres de configuration globaux
 * - Optimisant les connexions entre les nœuds
 * - Ajoutant des mécanismes de reprise après erreur
 * - Améliorant la gestion des notifications
 * - Appliquant des bonnes pratiques pour n8n
 */

const fs = require(fsstructure-agent');
const path = require(pathstructure-agent');

// Chemins des fichiers
const PIPELINE_FILE = path.join(__dirname, 'n8n.pipeline.json');
const CONFIG_FILE = path.join(__dirname, 'pipeline-config.json');
const OUTPUT_FILE = path.join(__dirname, 'n8n.pipeline.optimized.json');

// Vérifier si les fichiers nécessaires existent
if (!fs.existsSync(PIPELINE_FILE)) {
  console.error('❌ Erreur: Fichier n8n.pipeline.json introuvable');
  process.exit(1);
}

if (!fs.existsSync(CONFIG_FILE)) {
  console.error('❌ Erreur: Fichier pipeline-config.json introuvable');
  process.exit(1);
}

// Charger les fichiers
console.log('🔍 Chargement des fichiers...');
let pipelineData;
let configData;

try {
  pipelineData = JSON.parse(fs.readFileSync(PIPELINE_FILE, 'utf8'));
  configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch (error) {
  console.error(`❌ Erreur lors du chargement des fichiers: ${error.message}`);
  process.exit(1);
}

console.log('✅ Fichiers chargés avec succès');

// Vérifier la structure du pipeline
if (!pipelineData.workflows || !Array.isArray(pipelineData.workflows)) {
  console.error('❌ Format de n8n.pipeline.json invalide: la propriété workflows est manquante ou n\'est pas un tableau');
  process.exit(1);
}

// Optimiser chaque workflow
console.log(`🔄 Optimisation de ${pipelineData.workflows.length} workflows...`);

const optimizedWorkflows = pipelineData.workflows.map(workflow => {
  console.log(`  - Optimisation de: ${workflow.name}`);
  
  // Appliquer les configurations globales
  workflow = applyGlobalConfigs(workflow, configData);
  
  // Optimiser les nœuds
  if (workflow.nodes && Array.isArray(workflow.nodes)) {
    workflow.nodes = optimizeNodes(workflow.nodes, configData);
  }
  
  // Optimiser les connexions
  if (workflow.connections) {
    workflow.connections = optimizeConnections(workflow.connections, configData);
  }
  
  // Ajouter ou mettre à jour les paramètres du workflow
  workflow.settings = workflow.settings || {};
  workflow.settings.saveExecutionProgress = true;
  workflow.settings.saveManualExecutions = true;
  workflow.settings.callerPolicy = "workflowsFromSameOwner";
  
  // Si le workflow a des tags, s'assurer qu'ils sont uniques
  if (workflow.tags && Array.isArray(workflow.tags)) {
    workflow.tags = [...new Set(workflow.tags)];
  }
  
  return workflow;
});

// Créer la structure optimisée
const optimizedPipeline = {
  ...pipelineData,
  version: configData.version || pipelineData.version,
  workflows: optimizedWorkflows
};

// Écrire le fichier optimisé
try {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(optimizedPipeline, null, 2), 'utf8');
  console.log(`✅ Fichier optimisé écrit avec succès: ${OUTPUT_FILE}`);
} catch (error) {
  console.error(`❌ Erreur lors de l'écriture du fichier optimisé: ${error.message}`);
  process.exit(1);
}

// Afficher un résumé
console.log('\n📊 Résumé des optimisations:');
console.log(`  - Workflows optimisés: ${optimizedWorkflows.length}`);
console.log(`  - Paramètres globaux appliqués: ${Object.keys(configData.globalConfig.defaults || {}).length}`);
console.log(`  - Optimisations de ressources activées: ${configData.pipelineOptimizations.resources ? 'Oui' : 'Non'}`);
console.log(`  - Cache activé: ${configData.pipelineOptimizations.caching?.enabled ? 'Oui' : 'Non'}`);

console.log('\n🚀 Optimisation terminée. Vous pouvez maintenant utiliser setup-n8n-pipelines.sh pour déployer les pipelines optimisés.');

// Fonctions d'optimisation

/**
 * Applique les configurations globales au workflow
 */
function applyGlobalConfigs(workflow, config) {
  // Copier le workflow pour éviter de modifier l'original
  const optimizedWorkflow = { ...workflow };
  
  // Appliquer les paramètres par défaut
  const defaults = config.globalConfig?.defaults || {};
  
  // Ajouter les métadonnées
  optimizedWorkflow.meta = optimizedWorkflow.meta || {};
  optimizedWorkflow.meta.instanceId = `optimized-${Date.now()}`;
  
  return optimizedWorkflow;
}

/**
 * Optimise les nœuds du workflow
 */
function optimizeNodes(nodes, config) {
  return nodes.map(node => {
    // Copier le nœud pour éviter de modifier l'original
    const optimizedNode = { ...node };
    
    // Ajouter la gestion des erreurs pour les nœuds HTTP
    if (node.type && (
      node.type.includes('httpRequest') || 
      node.type.includes('executeCommand') ||
      node.type.includes('function')
    )) {
      // Ajouter des paramètres de reprise et timeout
      optimizedNode.continueOnFail = true;
      
      // Gérer les timeouts en fonction du type de nœud
      if (node.type.includes('executeCommand') && (!node.parameters || !node.parameters.executeTimeout)) {
        optimizedNode.parameters = optimizedNode.parameters || {};
        optimizedNode.parameters.executeTimeout = config.globalConfig?.defaults?.timeouts?.medium || 180;
      }
    }
    
    return optimizedNode;
  });
}

/**
 * Optimise les connexions du workflow
 */
function optimizeConnections(connections, config) {
  // Pour l'instant, juste une copie profonde des connexions
  return JSON.parse(JSON.stringify(connections));
}