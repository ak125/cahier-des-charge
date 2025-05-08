#!/usr/bin/env node

/**
 * Script qui configure la surveillance post-déploiement pour s'assurer que l'application
 * fonctionne correctement après le déploiement.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Analyse des arguments de ligne de commande
const argv = yargs(hideBin(process.argv))
    .option('env', {
        alias: 'e',
        description: 'Environnement surveillé',
        type: 'string',
        default: 'dev'
    })
    .option('duration', {
        alias: 'd',
        description: 'Durée de surveillance en minutes',
        type: 'number',
        default: 60
    })
    .option('interval', {
        alias: 'i',
        description: 'Intervalle entre les vérifications en secondes',
        type: 'number',
        default: 30
    })
    .help()
    .alias('help', '?')
    .argv;

/**
 * Fonction principale
 */
async function main() {
    try {
        console.log(`🔍 Configuration de la surveillance post-déploiement pour l'environnement: ${argv.env}`);

        // Identifier les derniers déploiements
        const deployments = findRecentDeployments(argv.env);
        if (deployments.length === 0) {
            console.warn('⚠️ Aucun déploiement récent trouvé pour la surveillance.');
            return;
        }

        const latestDeployment = deployments[0];
        console.log(`📊 Déploiement surveillé: ${latestDeployment.version} (${latestDeployment.timestamp})`);

        // Créer une configuration de surveillance
        const monitoringConfig = {
            deploymentId: latestDeployment.version,
            environment: argv.env,
            startTime: new Date().toISOString(),
            duration: argv.duration * 60, // en secondes
            interval: argv.interval,
            endpoints: [
                {
                    url: `https://app-${argv.env}.exemple.com/health`,
                    responseTimeThreshold: 500,
                    successStatusCodes: [200]
                },
                {
                    url: `https://app-${argv.env}.exemple.com/api/status`,
                    responseTimeThreshold: 800,
                    successStatusCodes: [200]
                },
                {
                    url: `https://app-${argv.env}.exemple.com/`,
                    responseTimeThreshold: 1200,
                    successStatusCodes: [200]
                }
            ],
            metricsToMonitor: [
                {
                    name: "cpu_usage",
                    query: "process_cpu_usage{service='app-" + argv.env + "'}",
                    thresholdValue: 80,
                    thresholdType: "max"
                },
                {
                    name: "memory_usage",
                    query: "process_resident_memory_bytes{service='app-" + argv.env + "'} / 1024 / 1024",
                    thresholdValue: 512,
                    thresholdType: "max"
                },
                {
                    name: "http_error_rate",
                    query: "sum(rate(http_requests_total{status=~'5..', service='app-" + argv.env + "'}[5m])) / sum(rate(http_requests_total{service='app-" + argv.env + "'}[5m])) * 100",
                    thresholdValue: 1,
                    thresholdType: "max"
                },
                {
                    name: "response_time_p95",
                    query: "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service='app-" + argv.env + "'}[5m])) by (le))",
                    thresholdValue: 2,
                    thresholdType: "max"
                }
            ],
            notificationChannels: [
                {
                    type: "slack",
                    channel: "#deployments-" + argv.env
                },
                {
                    type: "email",
                    recipients: ["ops@exemple.com", "dev-lead@exemple.com"]
                }
            ],
            alertRules: [
                {
                    name: "HighErrorRate",
                    query: "sum(rate(http_requests_total{status=~'5..', service='app-" + argv.env + "'}[5m])) / sum(rate(http_requests_total{service='app-" + argv.env + "'}[5m])) * 100 > 5",
                    for: "2m",
                    severity: "critical",
                    description: "Taux d'erreur HTTP élevé détecté"
                },
                {
                    name: "SlowResponses",
                    query: "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service='app-" + argv.env + "'}[5m])) by (le)) > 3",
                    for: "3m",
                    severity: "warning",
                    description: "Temps de réponse anormalement lents détectés"
                }
            ],
            autoRollbackThresholds: {
                errorRate: 10, // Pourcentage
                responseTime: 5000, // Millisecondes
                availabilityLoss: 95 // Pourcentage minimum requis
            }
        };

        // Créer le répertoire de configuration si nécessaire
        const monitoringDir = path.join(process.cwd(), 'monitoring', 'post-deploy');
        if (!fs.existsSync(monitoringDir)) {
            fs.mkdirSync(monitoringDir, { recursive: true });
        }

        // Écrire la configuration
        const configPath = path.join(monitoringDir, `post-deploy-${argv.env}-${latestDeployment.version}.json`);
        fs.writeFileSync(configPath, JSON.stringify(monitoringConfig, null, 2));

        console.log(`📝 Configuration de surveillance écrite dans: ${configPath}`);

        // Configurer les alertes dans Prometheus/AlertManager
        console.log('⚙️ Configuration des alertes dans le système de monitoring...');
        setupAlertRules(argv.env, monitoringConfig);

        // Créer une tâche cron pour la vérification continue
        console.log('🕒 Configuration de la tâche de surveillance continue...');
        setupMonitoringTask(argv.env, configPath, argv.duration, argv.interval);

        console.log(`✅ Surveillance post-déploiement configurée pour ${argv.duration} minutes avec vérification toutes les ${argv.interval} secondes.`);

    } catch (error) {
        console.error('❌ Erreur lors de la configuration de la surveillance post-déploiement:', error);
        process.exit(1);
    }
}

/**
 * Trouve les déploiements récents pour un environnement donné
 */
function findRecentDeployments(env) {
    try {
        // Dans un environnement réel, cette fonction interrogerait votre système de déploiement
        // Pour cet exemple, nous simulons une liste de déploiements

        const configDir = path.join(process.cwd(), 'config', 'deployments');
        if (!fs.existsSync(configDir)) {
            return [];
        }

        // Chercher les fichiers de configuration de déploiement pour cet environnement
        const deploymentFiles = fs.readdirSync(configDir)
            .filter(file => file.startsWith(`canary-${env}`) || file.startsWith(`deploy-${env}`))
            .filter(file => file.endsWith('.json'));

        if (deploymentFiles.length === 0) {
            return [];
        }

        // Transformer les fichiers en objets de déploiement
        return deploymentFiles.map(file => {
            try {
                const filePath = path.join(configDir, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return {
                    file,
                    version: content.version,
                    timestamp: content.timestamp,
                    commitSha: content.commitSha
                };
            } catch (e) {
                console.warn(`Impossible de lire le fichier de déploiement ${file}:`, e.message);
                return null;
            }
        })
            .filter(Boolean)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    } catch (error) {
        console.error('Erreur lors de la recherche des déploiements:', error);
        return [];
    }
}

/**
 * Configure les règles d'alerte dans le système de monitoring
 */
function setupAlertRules(env, config) {
    // Cette fonction simule la configuration des alertes dans Prometheus/AlertManager
    // Dans un environnement réel, vous utiliseriez l'API ou des fichiers de configuration

    const alertRulesDir = path.join(process.cwd(), 'monitoring', 'prometheus', 'rules');
    if (!fs.existsSync(alertRulesDir)) {
        fs.mkdirSync(alertRulesDir, { recursive: true });
    }

    // Générer le fichier de règles pour ce déploiement
    const alertRules = {
        groups: [
            {
                name: `post-deploy-alerts-${env}-${config.deploymentId}`,
                rules: config.alertRules.map(rule => ({
                    alert: rule.name,
                    expr: rule.query,
                    for: rule.for,
                    labels: {
                        severity: rule.severity,
                        environment: env,
                        deployment: config.deploymentId
                    },
                    annotations: {
                        description: rule.description,
                        summary: `[${env.toUpperCase()}] ${rule.name} - ${rule.description}`
                    }
                }))
            }
        ]
    };

    const alertRulesPath = path.join(alertRulesDir, `post-deploy-${env}-${config.deploymentId}.yml`);

    // Dans un environnement réel, vous utiliseriez une bibliothèque pour générer du YAML
    fs.writeFileSync(alertRulesPath, JSON.stringify(alertRules, null, 2));

    console.log(`📋 Règles d'alerte générées: ${alertRulesPath}`);
}

/**
 * Configure une tâche de surveillance continue
 */
function setupMonitoringTask(env, configPath, duration, interval) {
    // Cette fonction simule la création d'une tâche de surveillance continue
    // Dans un environnement réel, vous utiliseriez un système de tâches comme cron, Kubernetes Jobs, etc.

    const monitoringScriptDir = path.join(process.cwd(), 'scripts', 'monitoring');
    if (!fs.existsSync(monitoringScriptDir)) {
        fs.mkdirSync(monitoringScriptDir, { recursive: true });
    }

    // Créer un script d'exécution pour la tâche de surveillance
    const scriptContent = `#!/bin/bash
# Script de surveillance post-déploiement généré automatiquement
# Environnement: ${env}
# Durée: ${duration} minutes
# Intervalle: ${interval} secondes

CONFIG_PATH="${configPath}"
DURATION_SECONDS=$((${duration} * 60))
INTERVAL_SECONDS=${interval}
START_TIME=$(date +%s)
END_TIME=$((START_TIME + DURATION_SECONDS))

echo "[$(date)] Démarrage de la surveillance post-déploiement pour l'environnement ${env}"
echo "[$(date)] Configuration: $CONFIG_PATH"
echo "[$(date)] Durée: ${duration} minutes (jusqu'à $(date -d @$END_TIME))"

while [ $(date +%s) -lt $END_TIME ]; do
  echo "[$(date)] Exécution de la vérification de santé..."
  
  # Exécuter la vérification
  pnpm tsx agents/monitoring/monitoring-check.ts --config=$CONFIG_PATH --check
  
  # Enregistrer le résultat
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    echo "[$(date)] ⚠️ Vérification échouée avec le code de sortie: $RESULT"
    
    # Incrémenter le compteur d'échecs
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    
    # Si trop d'échecs consécutifs, déclencher une alerte
    if [ $FAILURE_COUNT -ge 3 ]; then
      echo "[$(date)] 🚨 Trop d'échecs consécutifs, déclenchement d'une alerte!"
      pnpm tsx agents/notifier.ts --event=deploy-health-check-failed --env=${env} --config=$CONFIG_PATH
    fi
  else
    echo "[$(date)] ✅ Vérification réussie"
    FAILURE_COUNT=0
  fi
  
  # Attendre l'intervalle avant la prochaine vérification
  echo "[$(date)] Attente de $INTERVAL_SECONDS secondes avant la prochaine vérification..."
  sleep $INTERVAL_SECONDS
done

echo "[$(date)] ✅ Surveillance post-déploiement terminée pour l'environnement ${env}"

# Générer un rapport final
echo "[$(date)] Génération du rapport final..."
pnpm tsx agents/monitoring/generate-monitoring-report.ts --config=$CONFIG_PATH --output=reports/post-deploy-${env}-$(date +%Y%m%d-%H%M%S).json

echo "[$(date)] 📊 Surveillance terminée. Consultez le rapport pour plus de détails."
`;

    const scriptPath = path.join(monitoringScriptDir, `monitor-post-deploy-${env}.sh`);
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755'); // Rendre le script exécutable

    console.log(`📜 Script de surveillance créé: ${scriptPath}`);

    // Dans un environnement réel, vous configureriez cette tâche à exécuter dans votre système
    console.log(`ℹ️ Pour démarrer manuellement la surveillance: ${scriptPath}`);
}

// Exécution du script
main().catch(error => {
    console.error(error);
    process.exit(1);
});