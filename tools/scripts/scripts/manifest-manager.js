#!/usr/bin/env node

/**
 * Script de gestion des manifests pour NX
 * Remplace les commandes Taskfile generate:manifest et register:agents
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const MCP_MANIFEST = path.join(ROOT_DIR, 'MCPManifest.json');

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

// Commandes pour la gestion des manifests
const commands = {
  generate: () => {
    console.log('Génération du manifest MCP...');
    return executeCommand('ts-node generate-agent-manifest.ts');
  },

  validate: () => {
    console.log('Validation du manifest MCP...');

    if (!fs.existsSync(MCP_MANIFEST)) {
      console.error(`Le fichier de manifest ${MCP_MANIFEST} n'existe pas.`);
      console.log('Veuillez d\'abord générer le manifest avec la commande "generate".');
      return { success: false };
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(MCP_MANIFEST, 'utf-8'));

      // Vérification basique du manifest
      if (!manifest.agents || !Array.isArray(manifest.agents)) {
        console.error("Le manifest ne contient pas de liste d'agents valide.");
        return { success: false };
      }

      console.log(`✅ Manifest validé: ${manifest.agents.length} agent(s) trouvé(s).`);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la validation du manifest:', error.message);
      return { success: false };
    }
  },

  register: () => {
    console.log('Enregistrement des agents...');
    return executeCommand('node scripts/agent-runner.js register');
  },

  list: () => {
    console.log('Liste des agents enregistrés dans le manifest:');

    if (!fs.existsSync(MCP_MANIFEST)) {
      console.error(`Le fichier de manifest ${MCP_MANIFEST} n'existe pas.`);
      console.log('Veuillez d\'abord générer le manifest avec la commande "generate".');
      return { success: false };
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(MCP_MANIFEST, 'utf-8'));

      if (!manifest.agents || !Array.isArray(manifest.agents)) {
        console.error("Le manifest ne contient pas de liste d'agents valide.");
        return { success: false };
      }

      manifest.agents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent.name} - ${agent.description || 'Aucune description'}`);
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la lecture du manifest:', error.message);
      return { success: false };
    }
  },
};

// Analyse des arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  const params = args.slice(1);

  return { command, params };
}

// Exécution
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
