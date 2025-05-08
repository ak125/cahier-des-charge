#!/usr/bin/env node

/**
 * Script pour créer un nouveau fichier agent avec une structure standardisée
 * Ce script complète le script generate-standard-exports.js en créant 
 * des fichiers agents qui suivent déjà les conventions du projet.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT_DIR, 'scripts', 'templates');

// S'assurer que le répertoire de templates existe
if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
}

// Interface de ligne de commande
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Convertit un nom en kebab-case
 * @param {string} name - Le nom à convertir
 * @returns {string} - Le nom en kebab-case
 */
function toKebabCase(name) {
    return name
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        .toLowerCase();
}

/**
 * Convertit un nom en PascalCase
 * @param {string} name - Le nom à convertir
 * @returns {string} - Le nom en PascalCase
 */
function toPascalCase(name) {
    return toKebabCase(name)
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

/**
 * Génère un fichier d'implémentation d'agent
 * @param {string} className - Nom de la classe au format PascalCase
 * @returns {string} - Contenu du fichier d'implémentation
 */
function generateAgentImplementation(className) {
    return `/**
 * ${className} Agent
 * 
 * Description: Remplacez cette description par une explication du rôle et des fonctions de cet agent
 */

import { BaseAgent } from '../shared/base-agent';
import { AgentConfig } from '../shared/types';

export class ${className} extends BaseAgent {
  constructor(config: AgentConfig = {}) {
    super({
      name: '${className}',
      ...config
    });
    
    this.init();
  }
  
  /**
   * Initialisation de l'agent
   */
  protected init(): void {
    // Code d'initialisation spécifique à cet agent
  }
  
  /**
   * Méthode principale de traitement
   * @param data Les données à traiter
   * @returns Résultat du traitement
   */
  async process(data: any): Promise<any> {
    this.logger.info('Traitement des données par ${className}');
    
    // Implémentez votre logique métier ici
    
    return {
      success: true,
      message: 'Traitement terminé',
      data: data
    };
  }
}
`;
}

/**
 * Génère un fichier d'export standard
 * @param {string} className - Nom de la classe au format PascalCase
 * @param {string} fileName - Nom de fichier au format kebab-case
 * @returns {string} - Contenu du fichier d'export
 */
function generateStandardExport(className, fileName) {
    return `/**
 * ${className}
 * Agent export file
 */

import { ${className} } from './${fileName}';

export { ${className} };
export default ${className};
`;
}

/**
 * Crée un nouvel agent à partir des templates
 * @param {string} agentName - Nom de l'agent
 * @param {string} agentDir - Répertoire où créer l'agent
 */
function createAgent(agentName, agentDir) {
    const kebabName = toKebabCase(agentName);
    const pascalName = toPascalCase(agentName);

    const implFilePath = path.join(agentDir, `${kebabName}.ts`);
    const exportFilePath = path.join(agentDir, `index.ts`);

    // Vérifier si les fichiers existent déjà
    if (fs.existsSync(implFilePath)) {
        console.error(`Erreur: Le fichier ${implFilePath} existe déjà.`);
        return false;
    }

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
    }

    // Générer et écrire le fichier d'implémentation
    fs.writeFileSync(implFilePath, generateAgentImplementation(pascalName), 'utf8');

    // Générer et écrire le fichier d'export
    fs.writeFileSync(exportFilePath, generateStandardExport(pascalName, kebabName), 'utf8');

    return true;
}

/**
 * Fonction principale interactive
 */
async function interactiveMode() {
    console.log('=== Création d\'un nouvel agent ===\n');

    rl.question('Nom de l\'agent (ex: DataProcessor, content-analyzer): ', (agentName) => {
        if (!agentName.trim()) {
            console.error('Erreur: Le nom de l\'agent ne peut pas être vide.');
            rl.close();
            return;
        }

        rl.question('Dossier de destination (relatif à la racine du projet, ex: agents/analyzers): ', (agentPath) => {
            const targetDir = path.join(ROOT_DIR, agentPath || 'agents');

            if (createAgent(agentName, targetDir)) {
                const kebabName = toKebabCase(agentName);
                const pascalName = toPascalCase(agentName);

                console.log('\n✅ Agent créé avec succès!');
                console.log(`\nFichiers créés:`);
                console.log(`- ${path.join(agentPath, `${kebabName}.ts`)} (Implémentation)`);
                console.log(`- ${path.join(agentPath, 'index.ts')} (Export standard)`);

                console.log('\nPour utiliser cet agent:');
                console.log(`import { ${pascalName} } from '${agentPath}';`);
                console.log(`const agent = new ${pascalName}();`);
                console.log(`const result = await agent.process(data);`);
            }

            rl.close();
        });
    });
}

/**
 * Mode ligne de commande (non interactif)
 * @param {string} agentName - Nom de l'agent
 * @param {string} agentDir - Répertoire de destination
 */
function commandLineMode(agentName, agentDir) {
    const targetDir = path.join(ROOT_DIR, agentDir || 'agents');

    if (createAgent(agentName, targetDir)) {
        const kebabName = toKebabCase(agentName);
        const pascalName = toPascalCase(agentName);

        console.log('\n✅ Agent créé avec succès!');
        console.log(`\nFichiers créés:`);
        console.log(`- ${path.join(agentDir, `${kebabName}.ts`)} (Implémentation)`);
        console.log(`- ${path.join(agentDir, 'index.ts')} (Export standard)`);
    }
}

/**
 * Point d'entrée du script
 */
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length >= 1) {
        const agentName = args[0];
        const agentDir = args[1] || 'agents';

        commandLineMode(agentName, agentDir);
    } else {
        interactiveMode();
    }
}

module.exports = {
    toKebabCase,
    toPascalCase,
    createAgent,
    generateAgentImplementation,
    generateStandardExport
};