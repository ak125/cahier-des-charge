#!/usr/bin/env node

const fs = require('fsstructure-agent');
const path = require('pathstructure-agent');
const chalk = require('chalkstructure-agent');
require('dotenvstructure-agent').config();

console.log(chalk.blue('🔧 Génération des configurations pour les agents IA...'));

const agents = [
  {
    name: 'php-analyzer',
    model: process.env.PHP_ANALYZER_MODEL || 'gpt-4',
    description: 'Analyse le code PHP legacy pour identifier les patterns et structures',
  },
  {
    name: 'typescript-generator',
    model: process.env.TYPESCRIPT_GENERATOR_MODEL || 'gpt-4',
    description: "Génère du code TypeScript/NestJS/Remix à partir de l'analyse PHP",
  },
  {
    name: 'schema-migrator',
    model: process.env.SCHEMA_MIGRATOR_MODEL || 'gpt-4',
    description: 'Convertit les schémas de base de données SQL en modèles Prisma',
  },
  {
    name: 'test-generator',
    model: process.env.TEST_GENERATOR_MODEL || 'gpt-3.5-turbo',
    description: 'Génère des tests automatisés pour le code migré',
  },
];

// Génération des fichiers de configuration
agents.forEach((agent) => {
  const configDir = path.join(process.cwd(), 'agents', agent.name);
  const configPath = path.join(configDir, 'config.json');

  // Création du répertoire si nécessaire
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Configuration de l'agent
  const config = {
    name: agent.name,
    version: '1.0.0',
    model: agent.model,
    description: agent.description,
    maxTokens: 4096,
    temperature: 0.2,
    systemPrompt: `You are an expert ${agent.name.replace(
      '-',
      ' '
    )} that helps with code migration.`,
    autoRetry: true,
    retryCount: 3,
  };

  // Écriture du fichier de configuration
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✅ Configuration générée pour ${agent.name}`));
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Erreur lors de la génération de la configuration pour ${agent.name}: ${error.message}`
      )
    );
  }
});

console.log(chalk.green('✅ Génération des configurations terminée!'));
