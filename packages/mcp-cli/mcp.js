#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { table } = require('table');

// Chemin absolu vers le fichier backlog
const backlogPath = path.resolve('/workspaces/cahier-des-charge', 'backlog.mcp.json');
console.log(`Chemin du backlog: ${backlogPath}`);
console.log(`Le fichier existe: ${fs.existsSync(backlogPath)}`);

// Fonction pour afficher l'aide
function showHelp() {
  console.log(chalk.blue('🚀 CLI MCP - Outil de gestion des migrations PHP vers Remix'));
  console.log('\nCommandes disponibles:');
  console.log('  audit [status]     - Affiche les fichiers filtrés par statut');
  console.log('                      - status: done, pending, invalid, in-progress');
  console.log('  generate           - Génère le backlog.mcp.json à partir du discovery_map.json');
  console.log("  migrate <file>     - Démarre la migration d'un fichier PHP");
  console.log("  dry-run <file>     - Simule la migration d'un fichier PHP");
  console.log('\nExemples:');
  console.log('  node mcp.js audit pending    - Affiche les fichiers en attente');
  console.log('  node mcp.js migrate index.php - Migre le fichier index.php');
}

// Fonction pour auditer les fichiers
function audit(statusFilter) {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(backlogPath)) {
      console.error(
        chalk.red("❌ Fichier backlog.mcp.json introuvable. Exécutez d'abord la commande generate.")
      );
      return;
    }

    // Lecture du fichier backlog
    const backlogData = fs.readFileSync(backlogPath, 'utf8');
    const backlog = JSON.parse(backlogData);

    // Filtrage selon le statut si spécifié
    const filteredFiles = Object.entries(backlog).filter(([_, item]) => {
      if (!statusFilter) return true;
      return item.status === statusFilter;
    });

    if (filteredFiles.length === 0) {
      console.log(
        chalk.yellow(
          `ℹ️ Aucun fichier trouvé ${statusFilter ? `avec le statut '${statusFilter}'` : ''}.`
        )
      );
      return;
    }

    // Tri par priorité (décroissante)
    filteredFiles.sort(([_, a], [__, b]) => b.priority - a.priority);

    // Préparation du tableau pour l'affichage
    const tableData = [
      ['Fichier', 'Priorité', 'Statut', 'Type', 'Critique', 'Dépendances'].map((header) =>
        chalk.bold(header)
      ),
    ];

    filteredFiles.forEach(([fileName, item]) => {
      const statusColor =
        {
          pending: chalk.yellow,
          done: chalk.green,
          invalid: chalk.red,
          'in-progress': chalk.blue,
        }[item.status] || chalk.white;

      tableData.push([
        fileName,
        item.priority.toString(),
        statusColor(item.status),
        item.metadata.routeType,
        item.metadata.isCritical ? '✓' : '✗',
        item.dependencies.join(', ') || 'aucune',
      ]);
    });

    // Affichage du tableau
    console.log(
      chalk.blue(
        `📋 Liste des fichiers ${
          statusFilter ? `avec le statut '${statusFilter}'` : ''
        } (triés par priorité):`
      )
    );
    console.log(table(tableData));

    // Affichage des statistiques
    const stats = {
      total: Object.keys(backlog).length,
      done: Object.values(backlog).filter((item) => item.status === 'done').length,
      pending: Object.values(backlog).filter((item) => item.status === 'pending').length,
      invalid: Object.values(backlog).filter((item) => item.status === 'invalid').length,
      inProgress: Object.values(backlog).filter((item) => item.status === 'in-progress').length,
    };

    console.log(chalk.blue('📊 Statistiques de migration:'));
    console.log(`📁 Total: ${stats.total} fichiers`);
    console.log(`✅ Terminés: ${stats.done} (${Math.round((stats.done / stats.total) * 100)}%)`);
    console.log(
      `⏳ En attente: ${stats.pending} (${Math.round((stats.pending / stats.total) * 100)}%)`
    );
    console.log(
      `🔄 En cours: ${stats.inProgress} (${Math.round((stats.inProgress / stats.total) * 100)}%)`
    );
    console.log(
      `❌ Invalides: ${stats.invalid} (${Math.round((stats.invalid / stats.total) * 100)}%)`
    );
  } catch (error) {
    console.error(chalk.red('❌ Erreur:', error));
  }
}

// Fonction pour simuler la migration d'un fichier (dry-run)
function dryRun(fileName) {
  try {
    // Vérifier si le fichier existe dans le backlog
    if (!fs.existsSync(backlogPath)) {
      console.error(chalk.red('❌ Fichier backlog.mcp.json introuvable.'));
      return;
    }

    const backlogData = fs.readFileSync(backlogPath, 'utf8');
    const backlog = JSON.parse(backlogData);

    if (!backlog[fileName]) {
      console.error(chalk.red(`❌ Le fichier ${fileName} n'existe pas dans le backlog.`));
      return;
    }

    console.log(chalk.blue(`🔍 Analyse du fichier ${fileName}...`));

    // Afficher les informations sur le fichier
    const fileInfo = backlog[fileName];
    console.log(chalk.blue('\nℹ️ Informations sur le fichier:'));
    console.log(`📄 Fichier: ${fileName}`);
    console.log(`📂 Chemin: ${fileInfo.path}`);
    console.log(`🔢 Priorité: ${fileInfo.priority}`);
    console.log(`🏷️ Statut actuel: ${fileInfo.status}`);
    console.log(`🔤 Type de route: ${fileInfo.metadata.routeType}`);
    console.log(`⚠️ Critique: ${fileInfo.metadata.isCritical ? 'Oui' : 'Non'}`);
    console.log(`🗄️ Utilise une base de données: ${fileInfo.metadata.hasDatabase ? 'Oui' : 'Non'}`);
    console.log(
      `🔒 Utilise l'authentification: ${fileInfo.metadata.hasAuthentication ? 'Oui' : 'Non'}`
    );

    if (fileInfo.dependencies.length > 0) {
      console.log(chalk.blue('\n🔗 Dépendances:'));
      for (const dep of fileInfo.dependencies) {
        const depStatus = backlog[dep] ? backlog[dep].status : 'non trouvé';
        const statusColor = {
          pending: chalk.yellow,
          done: chalk.green,
          invalid: chalk.red,
          'in-progress': chalk.blue,
          'non trouvé': chalk.red,
        }[depStatus];
        console.log(`- ${dep}: ${statusColor(depStatus)}`);
      }
    }

    // Simulation d'exécution (dry-run) de la migration
    console.log(chalk.blue(`\n🤖 Simulation de migration pour ${fileName}...`));
    console.log(chalk.yellow(`\n⚠️ Simulation uniquement - aucune modification n'a été apportée`));
    console.log(chalk.green(`✅ Simulation terminée pour ${fileName}`));

    // Ces chemins seraient calculés dynamiquement selon les règles de migration
    const remixRoute =
      fileInfo.metadata.routeType === 'model'
        ? `app/models/${path.basename(fileName, '.php')}.server.ts`
        : `app/routes/${path.basename(fileName, '.php')}.tsx`;

    console.log(chalk.blue('\n📋 Structure attendue après migration:'));
    console.log(`📁 Route Remix: ${remixRoute}`);

    if (fileInfo.metadata.hasDatabase) {
      console.log('🗃️ Modèle de données Prisma requis');
    }

    if (fileInfo.metadata.hasAuthentication) {
      console.log(`🔐 Middleware d'authentification requis`);
    }
  } catch (error) {
    console.error(chalk.red('❌ Erreur:', error));
  }
}

// Fonction pour migrer un fichier
function migrate(fileName) {
  try {
    // Vérifier si le fichier existe dans le backlog
    if (!fs.existsSync(backlogPath)) {
      console.error(chalk.red('❌ Fichier backlog.mcp.json introuvable.'));
      return;
    }

    const backlogData = fs.readFileSync(backlogPath, 'utf8');
    const backlog = JSON.parse(backlogData);

    if (!backlog[fileName]) {
      console.error(chalk.red(`❌ Le fichier ${fileName} n'existe pas dans le backlog.`));
      return;
    }

    // Vérification des dépendances
    const dependencies = backlog[fileName].dependencies;
    const dependenciesNotDone = dependencies.filter(
      (dep) => backlog[dep] && backlog[dep].status !== 'done'
    );

    if (dependenciesNotDone.length > 0) {
      console.warn(
        chalk.yellow('⚠️ Attention: Les dépendances suivantes ne sont pas encore migrées:')
      );
      dependenciesNotDone.forEach((dep) => {
        console.warn(
          chalk.yellow(`   - ${dep} (${backlog[dep] ? backlog[dep].status : 'non trouvé'})`)
        );
      });

      console.log(chalk.yellow('Voulez-vous continuer la migration malgré tout ? (Y/n)'));
      console.log(chalk.blue('Simulation: Oui'));
    }

    // Mise à jour du statut à "in-progress"
    backlog[fileName].status = 'in-progress';
    fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2), 'utf8');
    console.log(chalk.blue(`🔄 Début de la migration de ${fileName}...`));

    // Simulation d'une migration réussie (dans un vrai outil, on appellerait un agent IA ou un script)
    console.log(chalk.blue(`🤖 Exécution de l'agent de migration pour ${fileName}...`));

    // Mise à jour du statut après succès
    backlog[fileName].status = 'done';
    fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2), 'utf8');
    console.log(chalk.green(`✅ Migration de ${fileName} terminée avec succès!`));
  } catch (error) {
    console.error(chalk.red('❌ Erreur:', error));
  }
}

// Gestion des commandes selon les arguments
const args = process.argv.slice(2);
const command = args[0];

console.log(`Commande reçue: ${command}`);
console.log(`Arguments: ${JSON.stringify(args)}`);

if (!command || command === 'help' || command === '--help') {
  showHelp();
} else if (command === 'audit') {
  audit(args[1]);
} else if (command === 'dry-run' || command === 'dryrun') {
  if (!args[1]) {
    console.error(chalk.red('❌ Veuillez spécifier un fichier pour la simulation.'));
  } else {
    console.log(`Exécution de dry-run sur ${args[1]}...`);
    dryRun(args[1]);
  }
} else if (command === 'migrate') {
  if (!args[1]) {
    console.error(chalk.red('❌ Veuillez spécifier un fichier à migrer.'));
  } else {
    migrate(args[1]);
  }
} else if (command === 'generate') {
  try {
    const generateScript = path.resolve(__dirname, 'generate-backlog.js');
    console.log(chalk.blue('🔄 Génération du fichier backlog.mcp.json...'));
    require('child_process').execSync(`node ${generateScript}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la génération du backlog:'), error);
  }
} else {
  console.error(chalk.red(`❌ Commande inconnue: ${command}`));
  showHelp();
}
