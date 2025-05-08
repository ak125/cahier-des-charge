#!/usr/bin/env node

/**
 * Script de vérification d'état pour le système MCP
 * Vérifie l'état des composants du système (Prometheus, Grafana, Agents)
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const PROMETHEUS_URL = 'http://localhost:9090';
const GRAFANA_URL = 'http://localhost:3000';
const METRICS_URL = 'http://localhost:3002/metrics';
const METRICS_HEALTH_URL = 'http://localhost:3002/health';

/**
 * Effectue une requête HTTP GET
 */
async function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`));
      }

      const data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        try {
          resolve(Buffer.concat(data).toString());
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Vérifie si un service est en cours d'exécution
 */
function checkDockerContainer(name) {
  try {
    const result = execSync(`docker ps --filter "name=${name}" --format "{{.Names}}"`, {
      encoding: 'utf-8',
    });
    return result.trim().length > 0;
  } catch (_error) {
    return false;
  }
}

/**
 * Vérifie l'état de tous les services
 */
async function checkAllServices() {
  console.log(chalk.blue('========================================='));
  console.log(chalk.blue('📊 Vérification du système de surveillance'));
  console.log(chalk.blue('========================================='));

  let allOk = true;

  // Vérifier Prometheus
  const prometheusRunning = checkDockerContainer('prometheus');
  console.log(chalk.blue('\n📡 Prometheus:'));
  if (prometheusRunning) {
    console.log(chalk.green(" ✅ Le container Docker est en cours d'exécution"));

    try {
      await httpGet(`${PROMETHEUS_URL}/-/healthy`);
      console.log(chalk.green(" ✅ L'API Prometheus est accessible"));
    } catch (error) {
      console.log(chalk.red(` ❌ L'API Prometheus n'est pas accessible: ${error.message}`));
      allOk = false;
    }
  } else {
    console.log(chalk.red(" ❌ Le container Docker n'est pas en cours d'exécution"));
    console.log(chalk.yellow(' ℹ️  Démarrez Prometheus avec: npm run start:prometheus'));
    allOk = false;
  }

  // Vérifier Grafana
  const grafanaRunning = checkDockerContainer('grafana');
  console.log(chalk.blue('\n📊 Grafana:'));
  if (grafanaRunning) {
    console.log(chalk.green(" ✅ Le container Docker est en cours d'exécution"));

    try {
      await httpGet(`${GRAFANA_URL}/api/health`);
      console.log(chalk.green(" ✅ L'API Grafana est accessible"));
    } catch (error) {
      console.log(chalk.red(` ❌ L'API Grafana n'est pas accessible: ${error.message}`));
      allOk = false;
    }
  } else {
    console.log(chalk.red(" ❌ Le container Docker n'est pas en cours d'exécution"));
    console.log(chalk.yellow(' ℹ️  Démarrez Grafana avec: npm run start:prometheus'));
    allOk = false;
  }

  // Vérifier le serveur de métriques
  console.log(chalk.blue('\n🔄 Serveur de métriques:'));
  try {
    await httpGet(METRICS_HEALTH_URL);
    console.log(chalk.green(' ✅ Le serveur de métriques est accessible'));

    const metrics = await httpGet(METRICS_URL);
    const metricLines = metrics
      .split('\n')
      .filter((line) => !line.startsWith('#') && line.trim().length > 0);
    console.log(chalk.green(` ✅ ${metricLines.length} métriques collectées`));

    // Afficher quelques métriques intéressantes
    const agentMetrics = metricLines.filter((line) => line.startsWith('mcp_'));
    if (agentMetrics.length > 0) {
      console.log(chalk.green(' ✅ Métriques des agents MCP trouvées'));
    } else {
      console.log(chalk.yellow(" ⚠️ Aucune métrique d'agent MCP trouvée"));
    }
  } catch (error) {
    console.log(chalk.red(` ❌ Le serveur de métriques n'est pas accessible: ${error.message}`));
    console.log(
      chalk.yellow(
        ' ℹ️  Démarrez le serveur de métriques avec: npx ts-node monitoring/start-metrics-server.ts'
      )
    );
    allOk = false;
  }

  // Node Exporter
  const nodeExporterRunning = checkDockerContainer('node-exporter');
  console.log(chalk.blue('\n📈 Node Exporter:'));
  if (nodeExporterRunning) {
    console.log(chalk.green(" ✅ Le container Docker est en cours d'exécution"));
  } else {
    console.log(chalk.red(" ❌ Le container Docker n'est pas en cours d'exécution"));
    console.log(chalk.yellow(' ℹ️  Démarrez Node Exporter avec: npm run start:prometheus'));
    allOk = false;
  }

  // Résumé
  console.log(chalk.blue('\n========================================='));
  if (allOk) {
    console.log(chalk.green('✅ Tous les services de surveillance sont opérationnels'));
    console.log(chalk.blue(`🔗 Grafana Dashboard: ${GRAFANA_URL}`));
    console.log(chalk.blue(`🔗 Prometheus: ${PROMETHEUS_URL}`));
  } else {
    console.log(chalk.red('❌ Certains services de surveillance ne sont pas opérationnels'));
    console.log(chalk.yellow('ℹ️  Suivez les instructions ci-dessus pour résoudre les problèmes'));
  }
  console.log(chalk.blue('========================================='));
}

// Exécuter la vérification
checkAllServices().catch((error) => {
  console.error(chalk.red(`Erreur lors de la vérification: ${error.message}`));
  process.exit(1);
});
