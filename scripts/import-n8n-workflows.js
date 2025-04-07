#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');

const N8N_API_URL = 'http://localhost:5678/rest/workflows';
const EXPORTS_DIR = path.join(process.cwd(), 'workflows', 'exports');

async function importWorkflows() {
  console.log(chalk.blue('📥 Importation des workflows n8n...'));
  
  // Vérification que le répertoire d'exports existe
  if (!fs.existsSync(EXPORTS_DIR)) {
    console.error(chalk.red(`❌ Répertoire d'exports introuvable: ${EXPORTS_DIR}`));
    return;
  }
  
  // Lecture des fichiers workflow
  const workflowFiles = fs.readdirSync(EXPORTS_DIR).filter(file => file.endsWith('.json'));
  
  if (workflowFiles.length === 0) {
    console.log(chalk.yellow('⚠️ Aucun fichier de workflow trouvé dans le répertoire d\'exports'));
    return;
  }
  
  console.log(chalk.blue(`🔍 ${workflowFiles.length} workflows trouvés`));
  
  // Importation de chaque workflow
  for (const file of workflowFiles) {
    const filePath = path.join(EXPORTS_DIR, file);
    console.log(chalk.blue(`📄 Importation du workflow: ${file}`));
    
    try {
      // Lecture du fichier workflow
      const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Vérification si le workflow existe déjà par son nom
      let existingWorkflow;
      try {
        const response = await axios.get(`${N8N_API_URL}?filters=${encodeURIComponent(JSON.stringify({ name: workflowData.name }))}`);
        existingWorkflow = response.data.data.find(wf => wf.name === workflowData.name);
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Impossible de vérifier l'existence du workflow: ${error.message}`));
      }
      
      if (existingWorkflow) {
        // Mise à jour du workflow existant
        try {
          await axios.put(`${N8N_API_URL}/${existingWorkflow.id}`, workflowData);
          console.log(chalk.green(`✅ Workflow mis à jour: ${workflowData.name}`));
        } catch (error) {
          console.error(chalk.red(`❌ Erreur lors de la mise à jour du workflow ${workflowData.name}: ${error.message}`));
        }
      } else {
        // Création d'un nouveau workflow
        try {
          await axios.post(N8N_API_URL, workflowData);
          console.log(chalk.green(`✅ Workflow importé: ${workflowData.name}`));
        } catch (error) {
          console.error(chalk.red(`❌ Erreur lors de l'importation du workflow ${workflowData.name}: ${error.message}`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors du traitement du fichier ${file}: ${error.message}`));
    }
  }
  
  console.log(chalk.green('✅ Importation des workflows terminée'));
}

// Exécuter l'importation
importWorkflows().catch(error => {
  console.error(chalk.red(`❌ Erreur inattendue: ${error.message}`));
  process.exit(1);
});
