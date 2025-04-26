#!/usr/bin/env node

/**
 * Script pour lancer les tableaux de bord de façon séquentielle
 * en utilisant des ports différents pour chaque tableau de bord
 */

const { spawn, exec } = require('child_process');
const { loadConfig } = require('../config/config');
const chalk = require('chalk');
const net = require('net');

// Charger la configuration
const config = loadConfig();
const { DASHBOARD } = config;

// Définir les ports pour chaque dashboard
const MIGRATION_PORT = DASHBOARD.PORT || 3000;
const AUDIT_PORT = DASHBOARD.AUDIT_PORT || 3002;
const AGENTS_PORT = DASHBOARD.AGENTS_PORT || 3003;
const UNIFIED_PORT = DASHBOARD.UNIFIED_PORT || 3001;

// Définir les variables d'environnement
const env = Object.assign({}, process.env, {
  DASHBOARD_PORT: MIGRATION_PORT,
  AUDIT_DASHBOARD_PORT: AUDIT_PORT,
  AGENTS_DASHBOARD_PORT: AGENTS_PORT,
  UNIFIED_DASHBOARD_PORT: UNIFIED_PORT
});

/**
 * Vérifie si un port est disponible
 * @param {number} port - Le port à vérifier
 * @returns {Promise<boolean>} - true si le port est disponible, false sinon
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false); // Port est occupé
    });

    server.once('listening', () => {
      server.close();
      resolve(true); // Port est disponible
    });

    server.listen(port);
  });
}

/**
 * Tue les processus qui utilisent un port spécifique
 * @param {number} port - Le port dont il faut tuer les processus
 * @returns {Promise<boolean>} - true si le port a été libéré, false sinon
 */
function killProcessOnPort(port) {
  return new Promise(async (resolve) => {
    try {
      console.log(chalk.yellow(`🔄 Nettoyage du port ${port}...`));

      // Essayons plusieurs méthodes pour tuer les processus, avec et sans sudo
      const commands = [
        // 1. Sans sudo d'abord (basique)
        `fuser -k ${port}/tcp 2>/dev/null`,

        // 2. Sans sudo (plus agressif)
        process.platform === 'win32'
          ? `netstat -ano | findstr :${port} && FOR /F "tokens=5" %p in ('netstat -ano | findstr :${port}') do taskkill /F /PID %p`
          : `lsof -i :${port} | awk '{print $2}' | sort | uniq | xargs -r kill -9`,

        // 3. Avec sudo (demande une autorisation)
        `sudo fuser -k ${port}/tcp 2>/dev/null`,

        // 4. Avec sudo (commande alternative)
        `sudo kill $(sudo lsof -t -i:${port}) 2>/dev/null`,

        // 5. Avec sudo (méthode radicale)
        `sudo ss -lptn 'sport = :${port}' | grep -oP '(?<=pid=)\\d+' | xargs -r sudo kill -9`
      ];

      // Essayer chaque commande séquentiellement jusqu'à ce qu'une fonctionne
      for (const cmd of commands) {
        try {
          console.log(chalk.yellow(`Tentative de libération du port ${port} avec: ${cmd.split(' ')[0]}...`));

          // Exécuter la commande de façon synchrone pour plus de fiabilité
          exec(cmd, { timeout: 5000 }, async () => {
            // Vérifions si le port est maintenant disponible
            await new Promise(r => setTimeout(r, 1000));
            const available = await isPortAvailable(port);

            if (available) {
              console.log(chalk.green(`✅ Port ${port} libéré avec succès!`));
              return resolve(true);
            }
          });

          // Attendons un peu entre chaque tentative
          await new Promise(r => setTimeout(r, 2000));
          const available = await isPortAvailable(port);
          if (available) {
            console.log(chalk.green(`✅ Port ${port} libéré avec succès!`));
            return resolve(true);
          }

        } catch (cmdError) {
          // Continuer avec la prochaine commande si celle-ci échoue
          console.log(chalk.yellow(`La commande n'a pas fonctionné, essai suivant...`));
        }
      }

      // Dernière vérification
      const finalCheck = await isPortAvailable(port);
      if (finalCheck) {
        console.log(chalk.green(`✅ Port ${port} finalement libéré avec succès!`));
        return resolve(true);
      }

      // Si nous sommes ici, aucune commande n'a fonctionné
      console.log(chalk.red(`❌ Impossible de libérer le port ${port} après plusieurs tentatives.`));
      resolve(false);

    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors du nettoyage du port ${port}: ${error.message}`));
      resolve(false);
    }
  });
}

/**
 * Lance un processus et attend qu'il soit prêt
 * @param {string} command - Commande à exécuter
 * @param {string[]} args - Arguments de la commande
 * @param {string} name - Nom du tableau de bord
 * @param {number} port - Port sur lequel le tableau de bord sera lancé
 * @returns {Promise<ChildProcess>} - Le processus lancé
 */
async function startProcess(command, args, name, port) {
  try {
    // Vérifier si le port est disponible
    const isAvailable = await isPortAvailable(port);

    if (!isAvailable) {
      console.log(chalk.yellow(`⚠️ Le port ${port} est déjà utilisé. Tentative de libération...`));
      const portFreed = await killProcessOnPort(port);

      // Vérifier à nouveau si le port est disponible après le nettoyage
      if (!portFreed) {
        console.log(chalk.red(`❌ Impossible de libérer le port ${port}. Le tableau de bord ${name} ne sera pas lancé.`));
        return null;
      } else {
        console.log(chalk.green(`✅ Port ${port} libéré avec succès.`));
      }
    }

    return new Promise((resolve, reject) => {
      console.log(chalk.blue(`⚡️ Lancement du tableau de bord ${name} sur le port ${port}...`));

      const childProcess = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        env: {
          ...env,
          PORT: port.toString()
        }
      });

      // Attendre quelques secondes pour s'assurer que le serveur a démarré
      setTimeout(() => {
        console.log(chalk.green(`✅ Tableau de bord ${name} démarré sur http://localhost:${port}`));
        resolve(childProcess);
      }, 3000);

      childProcess.on('error', (error) => {
        console.error(chalk.red(`❌ Erreur lors du lancement du tableau de bord ${name}: ${error.message}`));
        reject(error);
      });

      childProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(chalk.red(`❌ Le tableau de bord ${name} s'est arrêté avec le code ${code}`));
          reject(new Error(`Processus terminé avec le code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du démarrage du tableau de bord ${name}: ${error.message}`));
    return null;
  }
}

/**
 * Fonction principale qui lance tous les tableaux de bord
 */
async function startAllDashboards() {
  try {
    console.log(chalk.yellow('🚀 Démarrage de tous les tableaux de bord...'));

    // Tableau pour stocker les résultats et les ports actifs
    const dashboards = [];
    const activePortsToSkip = new Set(); // Garder trace des ports actifs pour ne pas les nettoyer

    // Nettoyer tous les ports avant de commencer
    console.log(chalk.blue('🧹 Nettoyage initial de tous les ports...'));
    const cleanupPromises = [
      killProcessOnPort(MIGRATION_PORT),
      killProcessOnPort(AUDIT_PORT),
      killProcessOnPort(AGENTS_PORT),
      killProcessOnPort(UNIFIED_PORT)
    ];

    const cleanupResults = await Promise.all(cleanupPromises);
    const allPortsClean = cleanupResults.every(result => result === true);

    if (!allPortsClean) {
      console.log(chalk.yellow('⚠️ Certains ports n\'ont pas pu être nettoyés. Tentative de lancement quand même...'));
    } else {
      console.log(chalk.green('✅ Tous les ports ont été nettoyés avec succès.'));
    }

    // Fonction pour attendre avant de passer au prochain dashboard
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Fonction personnalisée pour démarrer un processus sans toucher aux ports actifs
    const safeStartProcess = async (command, args, name, port) => {
      // Si le port est déjà utilisé par un de nos processus, ne pas le lancer
      if (activePortsToSkip.has(port)) {
        console.log(chalk.yellow(`⚠️ Le port ${port} est déjà utilisé par un autre tableau de bord. Le tableau de bord ${name} ne sera pas lancé.`));
        return null;
      }

      // Vérifier si le port est disponible
      const isAvailable = await isPortAvailable(port);

      if (!isAvailable) {
        console.log(chalk.yellow(`⚠️ Le port ${port} est déjà utilisé. Tentative de libération...`));
        const portFreed = await killProcessOnPort(port);

        // Vérifier à nouveau si le port est disponible après le nettoyage
        if (!portFreed) {
          console.log(chalk.red(`❌ Impossible de libérer le port ${port}. Le tableau de bord ${name} ne sera pas lancé.`));
          return null;
        } else {
          console.log(chalk.green(`✅ Port ${port} libéré avec succès.`));
        }
      }

      return new Promise((resolve, reject) => {
        console.log(chalk.blue(`⚡️ Lancement du tableau de bord ${name} sur le port ${port}...`));

        const childProcess = spawn(command, args, {
          stdio: 'inherit',
          shell: true,
          env: {
            ...env,
            PORT: port.toString()
          }
        });

        // Ajouter le port à la liste des ports actifs
        activePortsToSkip.add(port);

        // Attendre quelques secondes pour s'assurer que le serveur a démarré
        setTimeout(() => {
          console.log(chalk.green(`✅ Tableau de bord ${name} démarré sur http://localhost:${port}`));
          resolve(childProcess);
        }, 3000);

        childProcess.on('error', (error) => {
          console.error(chalk.red(`❌ Erreur lors du lancement du tableau de bord ${name}: ${error.message}`));
          activePortsToSkip.delete(port); // Retirer de la liste des ports actifs
          reject(error);
        });

        childProcess.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            console.error(chalk.red(`❌ Le tableau de bord ${name} s'est arrêté avec le code ${code}`));
            activePortsToSkip.delete(port); // Retirer de la liste des ports actifs
            reject(new Error(`Processus terminé avec le code ${code}`));
          }
        });
      });
    };

    // Lancer le tableau de bord de migration
    console.log(chalk.yellow('🔄 Lancement du tableau de bord de migration...'));
    const migrationDashboard = await safeStartProcess(
      'node',
      ['--loader', 'ts-node/esm', 'scripts/dashboard.js'],
      'migration',
      MIGRATION_PORT
    );

    // Attendre un peu pour s'assurer que le serveur est bien démarré
    await wait(5000);

    if (migrationDashboard) {
      dashboards.push({ name: 'Migration', port: MIGRATION_PORT });
      console.log(chalk.green('✅ Tableau de bord migration démarré avec succès.'));
    } else {
      console.log(chalk.red('❌ Échec du démarrage du tableau de bord migration.'));
    }

    // Lancer le tableau de bord d'audit
    console.log(chalk.yellow('🔄 Lancement du tableau de bord d\'audit...'));
    const auditDashboard = await safeStartProcess(
      'node',
      ['-r', 'ts-node/register', 'agents/agent-audit.ts', '--dashboard'],
      'audit',
      AUDIT_PORT
    );

    // Attendre un peu pour s'assurer que le serveur est bien démarré
    await wait(5000);

    if (auditDashboard) {
      dashboards.push({ name: 'Audit', port: AUDIT_PORT });
      console.log(chalk.green('✅ Tableau de bord audit démarré avec succès.'));
    } else {
      console.log(chalk.red('❌ Échec du démarrage du tableau de bord audit.'));
    }

    // Lancer le tableau de bord des agents
    console.log(chalk.yellow('🔄 Lancement du tableau de bord des agents...'));
    const agentsDashboard = await safeStartProcess(
      'node',
      ['scripts/dashboard.js', '--view=agents'],
      'agents',
      AGENTS_PORT
    );

    // Attendre un peu pour s'assurer que le serveur est bien démarré
    await wait(5000);

    if (agentsDashboard) {
      dashboards.push({ name: 'Agents', port: AGENTS_PORT });
      console.log(chalk.green('✅ Tableau de bord agents démarré avec succès.'));
    } else {
      console.log(chalk.red('❌ Échec du démarrage du tableau de bord agents.'));
    }

    // Lancer le tableau de bord unifié
    console.log(chalk.yellow('🔄 Lancement du tableau de bord unifié...'));
    const unifiedDashboard = await safeStartProcess(
      'node',
      ['scripts/unified-dashboard.js'],
      'unifié',
      UNIFIED_PORT
    );

    // Attendre un peu pour s'assurer que le serveur est bien démarré
    await wait(5000);

    if (unifiedDashboard) {
      dashboards.push({ name: 'Unifié', port: UNIFIED_PORT });
      console.log(chalk.green('✅ Tableau de bord unifié démarré avec succès.'));
    } else {
      console.log(chalk.red('❌ Échec du démarrage du tableau de bord unifié.'));
    }

    // Résumé final
    if (dashboards.length > 0) {
      console.log(chalk.green('\n✅ Tableaux de bord lancés :'));
      dashboards.forEach(dashboard => {
        console.log(chalk.blue(`📊 ${dashboard.name}: http://localhost:${dashboard.port}`));
      });
    } else {
      console.log(chalk.red('❌ Aucun tableau de bord n\'a pu être lancé.'));
      process.exit(1);
    }

    console.table(dashboards);

    // Gérer l'arrêt propre des processus
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Arrêt des tableaux de bord...'));
      if (migrationDashboard) migrationDashboard.kill();
      if (auditDashboard) auditDashboard.kill();
      if (agentsDashboard) agentsDashboard.kill();
      if (unifiedDashboard) unifiedDashboard.kill();
      process.exit(0);
    });

    // Éviter que le script ne se termine
    process.stdin.resume();

  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du lancement des tableaux de bord: ${error.message}`));
    process.exit(1);
  }
}

// Lancer tous les tableaux de bord
startAllDashboards();