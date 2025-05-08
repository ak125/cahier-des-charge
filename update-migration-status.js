/**
 * Script de mise à jour du statut de migration des workflows
 * 
 * Ce script permet de mettre à jour le statut de migration des workflows dans le fichier
 * de classification et dans le tableau de bord de migration.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Chemin vers le fichier de classification
const CLASSIFICATION_PATH = path.resolve(__dirname, './migrations/n8n-classification.json');
// Chemin vers le fichier de tableau de bord
const DASHBOARD_DATA_PATH = path.resolve(__dirname, './migrations/n8n-migration-dashboard-data.json');

/**
 * Met à jour le statut de migration d'un workflow
 * @param {string} workflowId - L'ID du workflow
 * @param {object} migrationInfo - Informations de migration
 * @param {string} migrationInfo.status - Statut de migration ('pending', 'in-progress', 'completed', 'skipped')
 * @param {string} migrationInfo.targetSystem - Système cible ('bullmq', 'temporal', 'api', null)
 * @param {string} migrationInfo.migrationDate - Date de migration (YYYY-MM-DD)
 * @param {string} migrationInfo.migratedBy - Personne responsable de la migration
 * @param {string} migrationInfo.notes - Notes supplémentaires
 */
async function updateMigrationStatus(workflowId, migrationInfo) {
  try {
    if (!fs.existsSync(CLASSIFICATION_PATH)) {
      console.error(chalk.red(`Erreur: Le fichier de classification n'existe pas: ${CLASSIFICATION_PATH}`));
      return;
    }

    // Charger la classification existante
    const classification = await fs.readJson(CLASSIFICATION_PATH);

    // Trouver le workflow à mettre à jour
    const workflowIndex = classification.findIndex(w => w.id === workflowId);
    if (workflowIndex === -1) {
      console.error(chalk.red(`Erreur: Workflow non trouvé avec l'ID: ${workflowId}`));
      return;
    }

    // Mettre à jour le statut de migration
    classification[workflowIndex] = {
      ...classification[workflowIndex],
      migrationStatus: migrationInfo.status,
      migratedTo: migrationInfo.targetSystem,
      migrationDate: migrationInfo.migrationDate,
      migratedBy: migrationInfo.migratedBy,
      migrationNotes: migrationInfo.notes
    };

    // Sauvegarder la classification mise à jour
    await fs.writeJson(CLASSIFICATION_PATH, classification, { spaces: 2 });
    console.log(chalk.green(`✅ Statut de migration mis à jour pour le workflow: ${classification[workflowIndex].name}`));

    // Mettre à jour également le tableau de bord s'il existe
    if (fs.existsSync(DASHBOARD_DATA_PATH)) {
      const dashboardData = await fs.readJson(DASHBOARD_DATA_PATH);
      const dashboardWorkflowIndex = dashboardData.workflows.findIndex(w => w.id === workflowId);

      if (dashboardWorkflowIndex !== -1) {
        dashboardData.workflows[dashboardWorkflowIndex].migrationStatus = migrationInfo.status;
        dashboardData.workflows[dashboardWorkflowIndex].migratedTo = migrationInfo.targetSystem;
        dashboardData.workflows[dashboardWorkflowIndex].migrationDate = migrationInfo.migrationDate;
        dashboardData.workflows[dashboardWorkflowIndex].migratedBy = migrationInfo.migratedBy;

        // Mise à jour des métriques du tableau de bord
        dashboardData.metrics = {
          total: dashboardData.workflows.length,
          pending: dashboardData.workflows.filter(w => w.migrationStatus === 'pending').length,
          inProgress: dashboardData.workflows.filter(w => w.migrationStatus === 'in-progress').length,
          completed: dashboardData.workflows.filter(w => w.migrationStatus === 'completed').length,
          skipped: dashboardData.workflows.filter(w => w.migrationStatus === 'skipped').length,
        };

        await fs.writeJson(DASHBOARD_DATA_PATH, dashboardData, { spaces: 2 });
        console.log(chalk.green(`✅ Tableau de bord de migration mis à jour`));
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la mise à jour du statut de migration: ${error.message}`));
  }
}

// Vérifier si le script est appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: node update-migration-status.js <workflowId> <status> [options]

Arguments:
  workflowId          ID du workflow à mettre à jour
  status              Statut de migration: 'pending', 'in-progress', 'completed', 'skipped'

Options:
  --target <system>   Système cible: 'bullmq', 'temporal', 'api'
  --date <date>       Date de migration (format YYYY-MM-DD, défaut: aujourd'hui)
  --by <name>         Personne responsable de la migration
  --notes <text>      Notes supplémentaires

Exemple:
  node update-migration-status.js 12345 completed --target temporal --by "Jean Dupont"
    `);
    process.exit(1);
  }

  const workflowId = args[0];
  const status = args[1];

  // Parser les options
  const options = { status };
  for (let i = 2; i < args.length; i += 2) {
    if (args[i] === '--target') options.targetSystem = args[i + 1];
    if (args[i] === '--date') options.migrationDate = args[i + 1];
    if (args[i] === '--by') options.migratedBy = args[i + 1];
    if (args[i] === '--notes') options.notes = args[i + 1];
  }

  // Utiliser la date d'aujourd'hui par défaut
  if (!options.migrationDate) {
    options.migrationDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  }

  // Appeler la fonction de mise à jour
  updateMigrationStatus(workflowId, options);
}

module.exports = { updateMigrationStatus };
