#!/usr/bin/env node

/**
 * Script CLI pour vérifier les alertes de désynchronisation
 */

const axios = require(axiosstructure-agent');
const chalk = require(chalkstructure-agent');
const yargs = require(yargs/yargsstructure-agent');
const { hideBin } = require(yargs/helpersstructure-agent');

// Configuration avec arguments en ligne de commande
const argv = yargs(hideBin(process.argv))
  .option('url', {
    alias: 'u',
    description: 'URL de l\'API d\'alertes',
    type: 'string',
    default: 'http://localhost:3000/api/alerts'
  })
  .option('token', {
    alias: 't',
    description: 'Token JWT pour l\'authentification',
    type: 'string'
  })
  .option('component', {
    alias: 'c',
    description: 'Filtrer par composant',
    type: 'string'
  })
  .option('priority', {
    alias: 'p',
    description: 'Filtrer par priorité minimale (0-3)',
    type: 'number'
  })
  .option('all', {
    alias: 'a',
    description: 'Inclure les alertes résolues',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(chalk.blue('🔍 Vérification des alertes de désynchronisation...'));
    
    // Construire les paramètres de requête
    const params = {};
    
    if (argv.component) {
      params.component = argv.component;
    }
    
    if (argv.priority !== undefined) {
      params.priority = argv.priority;
    }
    
    if (argv.all) {
      params.status = 'all';
    }
    
    // Configurer les en-têtes d'authentification si un token est fourni
    const headers = {};
    if (argv.token) {
      headers['Authorization'] = `Bearer ${argv.token}`;
    }
    
    // Appeler l'API
    const response = await axios.get(argv.url, { params, headers });
    const alerts = response.data;
    
    if (!alerts || !Array.isArray(alerts)) {
      console.error(chalk.red('❌ Format de réponse invalide'));
      process.exit(1);
    }
    
    // Afficher les résultats
    console.log(chalk.blue(`📊 ${alerts.length} alertes trouvées`));
    
    if (alerts.length === 0) {
      console.log(chalk.green('✅ Aucune alerte active'));
      process.exit(0);
    }
    
    // Regrouper par priorité
    const byPriority = {
      'CRITICAL': [],
      'HIGH': [],
      'MEDIUM': [],
      'LOW': []
    };
    
    for (const alert of alerts) {
      const priority = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][alert.priority] || 'UNKNOWN';
      byPriority[priority] = byPriority[priority] || [];
      byPriority[priority].push(alert);
    }
    
    // Afficher le résumé par priorité
    console.log(chalk.yellow('\n=== Résumé des alertes par priorité ==='));
    for (const [priority, priorityAlerts] of Object.entries(byPriority)) {
      if (priorityAlerts.length > 0) {
        const color = priority === 'CRITICAL' ? chalk.red : 
                     priority === 'HIGH' ? chalk.yellow :
                     priority === 'MEDIUM' ? chalk.blue :
                     chalk.gray;
        
        console.log(color(`${priority}: ${priorityAlerts.length} alertes`));
      }
    }
    
    // Afficher les alertes critiques et hautes en détail
    const criticalAlerts = [...(byPriority.CRITICAL || []), ...(byPriority.HIGH || [])];
    if (criticalAlerts.length > 0) {
      console.log(chalk.red('\n=== Alertes critiques et hautes ==='));
      
      for (const alert of criticalAlerts) {
        const priorityColor = alert.priority === 3 ? chalk.red : chalk.yellow;
        console.log(priorityColor(`[${['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][alert.priority]}] ${alert.title}`));
        console.log(`  Composant: ${alert.component}`);
        console.log(`  Type: ${alert.type}`);
        console.log(`  Description: ${alert.description}`);
        console.log(`  Assigné à: ${alert.assignee || 'Non assigné'}`);
        console.log(`  Status: ${alert.status}`);
        console.log(`  Créé le: ${new Date(alert.createdAt).toLocaleString()}`);
        if (alert.details && alert.details.documentPath) {
          console.log(`  Document: ${alert.details.documentPath}`);
        }
        if (alert.details && alert.details.codePath) {
          console.log(`  Code: ${alert.details.codePath}`);
        }
        console.log();
      }
      
      // Code de sortie non-zéro pour intégration CI/CD
      process.exit(1);
    }
    
    // Si on arrive ici, pas d'alertes critiques ou hautes
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red(`Message: ${JSON.stringify(error.response.data)}`));
    }
    process.exit(1);
  }
}

// Exécution
main();
