#!/usr/bin/env node

/**
 * Script de gestion des agents pour NX
 * Remplace les commandes Taskfile dans Agents.yaml
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const AGENTS_DIR = path.join(__dirname, '..', 'agents');

// Exécution des commandes
function executeCommand(command, showOutput = true) {
  try {
    const output = execSync(command, { stdio: showOutput ? 'inherit' : 'pipe' });
    return { success: true, output: output ? output.toString() : '' };
  } catch (error) {
    console.error(`Erreur lors de l'exécution de: ${command}`);
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

// Commandes pour la gestion des agents
const commands = {
  run: (agentName, ...args) => {
    const agentArgs = args.length > 0 ? args.join(' ') : '';
    console.log(`Exécution de l'agent ${agentName}${agentArgs ? ' avec arguments: ' + agentArgs : ''}`);
    
    // Vérifier si l'agent existe
    const agentFile = findAgentFile(agentName);
    if (!agentFile) {
      console.error(`Agent "${agentName}" introuvable.`);
      return { success: false };
    }
    
    // Exécuter l'agent
    return executeCommand(`ts-node ${agentFile} ${agentArgs}`);
  },
  
  status: () => {
    console.log('Vérification du statut des agents...');
    return executeCommand('node scripts/agent-status.js');
  },
  
  list: () => {
    console.log('Liste des agents disponibles:');
    const agents = findAllAgents();
    agents.forEach(agent => {
      console.log(`- ${agent.name} (${agent.path})`);
    });
    return { success: true, agents };
  },
  
  register: () => {
    console.log('Enregistrement des agents...');
    return executeCommand('node scripts/agent-runner.js register');
  },
  
  verify: (path) => {
    console.log(`Vérification de l'agent pour: ${path}`);
    return executeCommand(`node agents/diff-verifier.ts --file=${path}`);
  },
  
  'bullmq-orchestrator': () => {
    console.log('Démarrage du BullMQ orchestrator...');
    return executeCommand('ts-node agents/bullmq-orchestrator.ts', false);
  }
};

// Rechercher un agent par son nom
function findAgentFile(agentName) {
  // Recherche directe
  const directPath = path.join(AGENTS_DIR, `${agentName}.ts`);
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  
  // Recherche récursive
  function searchInDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        const found = searchInDirectory(filePath);
        if (found) return found;
      } else if (file.name === `${agentName}.ts` || file.name === `${agentName}.js`) {
        return filePath;
      }
    }
    
    return null;
  }
  
  return searchInDirectory(AGENTS_DIR);
}

// Trouver tous les agents disponibles
function findAllAgents() {
  const agents = [];
  
  function searchInDirectory(dir, baseDir = AGENTS_DIR) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        searchInDirectory(filePath, baseDir);
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
        // Exclure les fichiers de test et les définitions de types
        if (!file.name.includes('.spec.') && !file.name.includes('.test.') && !file.name.endsWith('.d.ts')) {
          const relativePath = path.relative(baseDir, filePath);
          const name = file.name.replace(/\.(ts|js)$/, '');
          agents.push({
            name,
            path: relativePath,
            fullPath: filePath
          });
        }
      }
    }
  }
  
  searchInDirectory(AGENTS_DIR);
  return agents;
}

// Analyse des arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  const params = args.slice(1);
  
  return { command, params };
}

// Exécution principale
function main() {
  const { command, params } = parseArgs();
  
  if (!commands[command]) {
    console.error(`Commande inconnue: ${command}`);
    console.log('Commandes disponibles: ', Object.keys(commands).join(', '));
    process.exit(1);
  }
  
  const result = commands[command](...params);
  
  if (!result.success) {
    process.exit(1);
  }
}

main();