#!/usr/bin/env node

const chalk = require('chalk');
const axios = require('axios');

console.log(chalk.blue("🔍 Vérification de l'état des agents..."));

const checkAgents = async () => {
  try {
    const response = await axios.get('http://localhost:3001/health');
    const { status, agents } = response.data;

    if (status === 'ok') {
      console.log(chalk.green('✅ Service des agents opérationnel!'));

      // Afficher l'état de chaque agent
      if (agents && Array.isArray(agents)) {
        agents.forEach((agent) => {
          console.log(chalk.green(`✅ ${agent}: Opérationnel`));
        });
      }
    } else {
      console.log(chalk.yellow('⚠️ Service des agents en état dégradé'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Impossible de contacter le service des agents'));
    console.error(chalk.red(`Erreur: ${error.message}`));
    console.log(
      chalk.yellow('ℹ️ Vérifiez que les conteneurs sont démarrés avec docker compose up -d')
    );
  }
};

checkAgents();
