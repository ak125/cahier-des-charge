#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🚀 Configuration initiale du pipeline IA de migration...'));

// Vérification de l'existence du fichier .env
if (!fs.existsSync(path.join(process.cwd(), '.env'))) {
  console.log(chalk.yellow('📄 Création du fichier .env à partir de .env.example...'));
  try {
    fs.copyFileSync(path.join(process.cwd(), '.env.example'), path.join(process.cwd(), '.env'));
    console.log(chalk.green('✅ Fichier .env créé avec succès!'));
    console.log(chalk.yellow("⚠️ N'oubliez pas de configurer vos clés API dans le fichier .env"));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la création du fichier .env: ${error.message}`));
    process.exit(1);
  }
}

// Création des répertoires nécessaires
const directories = [
  'agents/php-analyzer',
  'agents/typescript-generator',
  'agents/schema-migrator',
  'agents/test-generator',
  'workflows/exports',
  'dashboard',
  'docs/dist',
  'config-templates',
  'logs',
];

console.log(chalk.blue('📁 Création des répertoires nécessaires...'));
directories.forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(chalk.green(`✅ Répertoire créé: ${dir}`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Erreur lors de la création du répertoire ${dir}: ${error.message}`)
      );
    }
  }
});

// Création de package.json pour les agents si nécessaire
const agentsPackagePath = path.join(process.cwd(), 'agents', 'package.json');
if (!fs.existsSync(agentsPackagePath)) {
  console.log(chalk.blue('📄 Création du package.json pour les agents...'));
  const agentsPackage = {
    name: 'migration-ai-agents',
    version: '1.0.0',
    description: 'Agents IA pour la migration de code',
    main: 'index.js',
    scripts: {
      start: 'node index.js',
      test: 'jest',
    },
    dependencies: {
      express: '^4.18.2',
      openai: '^4.0.0',
      mongoose: '^7.5.0',
      dotenv: '^16.3.1',
    },
  };

  try {
    fs.writeFileSync(agentsPackagePath, JSON.stringify(agentsPackage, null, 2));
    console.log(chalk.green('✅ Fichier package.json pour les agents créé avec succès!'));
  } catch (error) {
    console.error(
      chalk.red(`❌ Erreur lors de la création du package.json pour les agents: ${error.message}`)
    );
  }
}

// Création d'un fichier index.js de base pour les agents
const agentsIndexPath = path.join(process.cwd(), 'agents', 'index.js');
if (!fs.existsSync(agentsIndexPath)) {
  console.log(chalk.blue('📄 Création du fichier index.js pour les agents...'));
  const agentsIndex = `
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', agents: ['php-analyzer', 'typescript-generator', 'schema-migrator', 'test-generator'] });
});

app.listen(port, () => {
  console.log(\`Agents API running on port \${port}\`);
});
  `;

  try {
    fs.writeFileSync(agentsIndexPath, agentsIndex);
    console.log(chalk.green('✅ Fichier index.js pour les agents créé avec succès!'));
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Erreur lors de la création du fichier index.js pour les agents: ${error.message}`
      )
    );
  }
}

console.log(chalk.green('✅ Configuration initiale terminée!'));
console.log(chalk.blue('📋 Prochaines étapes:'));
console.log(chalk.blue('1. Configurez vos clés API dans le fichier .env'));
console.log(chalk.blue('2. Exécutez docker compose build pour construire les conteneurs'));
console.log(chalk.blue('3. Lancez les services avec docker compose up -d'));
