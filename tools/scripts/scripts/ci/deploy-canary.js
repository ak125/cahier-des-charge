#!/usr/bin/env node

/**
 * Script de déploiement canary avec métriques de santé et rollback automatique
 * 
 * Ce script coordonne un déploiement canary progressif avec surveillance
 * des métriques de santé et capacité de rollback automatique.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const axios = require('axios'); // Utilisez pnpm add axios si non installé
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Analyse des arguments de ligne de commande
const argv = yargs(hideBin(process.argv))
    .option('env', {
        alias: 'e',
        description: 'Environnement de déploiement',
        type: 'string',
        choices: ['dev', 'staging', 'production'],
        default: 'dev'
    })
    .option('app', {
        alias: 'a',
        description: 'Application à déployer',
        type: 'string',
        demandOption: true
    })
    .option('initial-traffic', {
        description: 'Pourcentage initial de trafic pour le canary',
        type: 'number',
        default: 5
    })
    .option('step', {
        description: 'Pas d\'augmentation du trafic en pourcentage',
        type: 'number',
        default: 10
    })
    .option('interval', {
        description: 'Intervalle entre les augmentations de trafic (minutes)',
        type: 'number',
        default: 5
    })
    .option('rollback-threshold', {
        description: 'Seuil d\'erreurs (%) déclenchant un rollback',
        type: 'number',
        default: 2
    })
    .option('metrics-endpoint', {
        description: 'Point de terminaison pour les métriques',
        type: 'string',
        default: process.env.METRICS_ENDPOINT || 'http://prometheus:9090/api/v1/query'
    })
    .option('config', {
        alias: 'c',
        description: 'Fichier de configuration canary (optionnel)',
        type: 'string'
    })
    .option('dry-run', {
        description: 'Exécution à blanc (sans déploiement réel)',
        type: 'boolean',
        default: false
    })
    .option('force', {
        alias: 'f',
        description: 'Forcer le déploiement même si les contrôles échouent',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', '?')
    .argv;

// Configuration par défaut
const defaultConfig = {
    deploymentId: `canary-${argv.app}-${new Date().toISOString().replace(/[-:.]/g, '')}`.substring(0, 40),
    environment: argv.env,
    initialTrafficPercentage: argv.initialTraffic,
    trafficStepPercentage: argv.step,
    stepIntervalMinutes: argv.interval,
    maxRolloutTimeMinutes: 60,
    rollbackThresholdErrorRate: argv.rollbackThreshold,
    metrics: {
        endpoint: argv.metricsEndpoint,
        queries: {
            errorRate: `sum(rate(http_server_requests_seconds_count{status=~"5..",service="${argv.app}"}[2m])) / sum(rate(http_server_requests_seconds_count{service="${argv.app}"}[2m])) * 100`,
            latencyP95: `histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{service="${argv.app}"}[2m])) by (le))`,
            cpuUsage: `avg(process_cpu_usage{service="${argv.app}"}) * 100`,
            memoryUsage: `avg(jvm_memory_used_bytes{service="${argv.app}",area="heap"}) / 1024 / 1024`
        },
        thresholds: {
            errorRate: argv.rollbackThreshold,
            latencyP95: 2, // secondes
            cpuUsage: 85, // pourcentage
            memoryUsage: 1024 // Mo
        },
        checkInterval: 30 // secondes
    },
    healthChecks: [
        {
            endpoint: `https://${argv.env}-${argv.app}.example.com/health`,
            expectedStatus: 200,
            timeout: 5000 // ms
        },
        {
            endpoint: `https://${argv.env}-${argv.app}.example.com/actuator/health`,
            expectedStatus: 200,
            timeout: 5000 // ms
        }
    ],
    notifications: {
        slack: {
            channel: 'deployments',
            username: 'Canary Deployment',
            icon_emoji: ':rocket:'
        },
        email: {
            recipients: ['devops@example.com', 'team@example.com']
        }
    }
};

// Variables globales
let config = {};
let currentTrafficPercentage = 0;
let deploymentStartTime = null;
let metricsCheckInterval = null;
let rollbackInitiated = false;
let logStream = null;

/**
 * Fonction principale
 */
async function main() {
    try {
        console.log(`
🚀 Déploiement Canary
📋 Application: ${argv.app}
🌍 Environnement: ${argv.env}
📊 Trafic initial: ${argv.initialTraffic}%
📈 Intervalle d'augmentation: ${argv.interval} minutes
`);

        // Charger la configuration
        await loadConfig();

        // Initialiser le journal de déploiement
        initializeDeploymentLog();

        // Vérifier les prérequis
        await checkPrerequisites();

        // Déployer la version canary
        await deployCanaryVersion();

        // Commencer le routage progressif du trafic
        await startProgressiveRollout();

        // Attendre que le déploiement soit terminé
        await waitForDeploymentCompletion();

        // Finaliser le déploiement (promotion ou rollback)
        await finalizeDeployment();

        console.log('✅ Déploiement canary terminé avec succès!');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Erreur lors du déploiement canary: ${error.message}`);
        await sendNotification('failure', `Échec du déploiement canary: ${error.message}`);

        // Si ce n'est pas déjà fait, tenter un rollback
        if (!rollbackInitiated) {
            console.log('⚠️ Tentative de rollback suite à une erreur...');
            await rollback(error.message);
        }

        process.exit(1);
    }
}

/**
 * Charger la configuration
 */
async function loadConfig() {
    // Commencer avec la configuration par défaut
    config = { ...defaultConfig };

    // Si un fichier de configuration est spécifié, le charger
    if (argv.config) {
        try {
            const configFile = path.resolve(process.cwd(), argv.config);
            console.log(`Chargement de la configuration depuis ${configFile}`);

            if (fs.existsSync(configFile)) {
                const fileConfig = await fs.readJSON(configFile);
                config = { ...config, ...fileConfig };
                console.log('Configuration chargée avec succès.');
            } else {
                console.warn(`⚠️ Fichier de configuration ${configFile} non trouvé. Utilisation de la configuration par défaut.`);
            }
        } catch (error) {
            console.error(`Erreur lors du chargement de la configuration: ${error.message}`);
            throw new Error(`Impossible de charger la configuration: ${error.message}`);
        }
    }

    // Définir le pourcentage de trafic initial
    currentTrafficPercentage = config.initialTrafficPercentage;

    // Enregistrer la configuration finale
    await fs.ensureDir(path.join(process.cwd(), 'logs', 'deployments'));
    await fs.writeJSON(
        path.join(process.cwd(), 'logs', 'deployments', `${config.deploymentId}.config.json`),
        config,
        { spaces: 2 }
    );

    console.log(`Configuration enregistrée pour le déploiement ${config.deploymentId}`);
}

/**
 * Initialiser le journal de déploiement
 */
function initializeDeploymentLog() {
    const logDir = path.join(process.cwd(), 'logs', 'deployments');
    fs.ensureDirSync(logDir);

    const logFile = path.join(logDir, `${config.deploymentId}.log`);
    logStream = fs.createWriteStream(logFile, { flags: 'a' });

    // Ajouter un timestamp à chaque log
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = function () {
        const timestamp = new Date().toISOString();
        const message = Array.from(arguments).join(' ');
        originalConsoleLog.apply(console, [`[${timestamp}] ${message}`]);

        // Écrire dans le fichier de log
        if (logStream) {
            logStream.write(`[${timestamp}] ${message}\n`);
        }
    };

    console.error = function () {
        const timestamp = new Date().toISOString();
        const message = Array.from(arguments).join(' ');
        originalConsoleError.apply(console, [`[${timestamp}] ❌ ${message}`]);

        // Écrire dans le fichier de log
        if (logStream) {
            logStream.write(`[${timestamp}] ❌ ${message}\n`);
        }
    };

    console.log(`Journal de déploiement initialisé: ${logFile}`);
}

/**
 * Vérifier les prérequis avant déploiement
 */
async function checkPrerequisites() {
    console.log('🔍 Vérification des prérequis pour le déploiement canary...');

    // Vérifier les accès aux API nécessaires
    try {
        if (!argv.dryRun) {
            // Vérifier l'accès à l'API de métriques
            console.log(`Vérification de l'accès à l'API de métriques: ${config.metrics.endpoint}`);
            await axios.get(config.metrics.endpoint, { timeout: 5000 });

            // Vérifier l'accès aux API de déploiement
            console.log('Vérification de l\'accès aux API de déploiement...');
            // Simulation de vérification pour cet exemple

            // Vérifier que l'appli est déployable
            console.log(`Vérification que l'application ${argv.app} est déployable dans l'environnement ${argv.env}...`);
            // Dans un scénario réel, on vérifierait l'existence des artefacts, configurations, etc.
        }

        console.log('✅ Prérequis validés.');
    } catch (error) {
        if (argv.force) {
            console.warn(`⚠️ Certains prérequis n'ont pas été validés, mais le déploiement est forcé: ${error.message}`);
        } else {
            throw new Error(`Échec de la validation des prérequis: ${error.message}`);
        }
    }
}

/**
 * Déployer la version canary
 */
async function deployCanaryVersion() {
    console.log(`🚀 Déploiement de la version canary de ${argv.app} dans ${argv.env}...`);
    deploymentStartTime = new Date();

    if (argv.dryRun) {
        console.log('Mode dry-run: simulation du déploiement canary');
        return;
    }

    try {
        // Dans un environnement réel, vous utiliseriez ici votre système de déploiement
        // Par exemple, avec Kubernetes, ArgoCD, SSH vers des serveurs, etc.

        // Simulation de déploiement pour cet exemple
        console.log('Préparation de l\'environnement canary...');
        await simulateCommand('5s', 'Prépare l\'environnement canary');

        console.log('Déploiement des artefacts...');
        await simulateCommand('3s', 'Déploie les artefacts de l\'application');

        console.log('Configuration du routage initial...');
        await simulateCommand('2s', 'Configure le routage initial à ' + currentTrafficPercentage + '%');

        await sendNotification('info', `Déploiement canary de ${argv.app} initié avec ${currentTrafficPercentage}% de trafic`);

        console.log('✅ Version canary déployée avec succès.');
    } catch (error) {
        throw new Error(`Échec du déploiement de la version canary: ${error.message}`);
    }
}

/**
 * Commencer le routage progressif du trafic
 */
async function startProgressiveRollout() {
    console.log('🔄 Début du routage progressif du trafic...');

    // Démarrer la surveillance des métriques
    startMetricsMonitoring();

    // Vérification initiale de santé
    const initialHealthCheck = await performHealthChecks();
    if (!initialHealthCheck.healthy && !argv.force) {
        throw new Error(`Le contrôle de santé initial a échoué: ${initialHealthCheck.reason}`);
    }

    console.log(`✅ Contrôle de santé initial réussi. Routage de ${currentTrafficPercentage}% du trafic vers la version canary.`);
}

/**
 * Démarrer la surveillance des métriques
 */
function startMetricsMonitoring() {
    console.log('📊 Démarrage de la surveillance des métriques...');

    if (argv.dryRun) {
        console.log('Mode dry-run: simulation de la surveillance des métriques');
        return;
    }

    // Intervalle de vérification des métriques
    metricsCheckInterval = setInterval(async () => {
        try {
            const metrics = await collectMetrics();
            console.log(`Métriques actuelles - Erreurs: ${metrics.errorRate.toFixed(2)}%, Latence P95: ${metrics.latencyP95.toFixed(2)}s, CPU: ${metrics.cpuUsage.toFixed(2)}%, Mémoire: ${metrics.memoryUsage.toFixed(0)}MB`);

            // Vérifier si les métriques dépassent les seuils
            if (metrics.errorRate > config.metrics.thresholds.errorRate) {
                console.error(`⚠️ Taux d'erreurs (${metrics.errorRate.toFixed(2)}%) supérieur au seuil (${config.metrics.thresholds.errorRate}%)`);
                await rollback('Taux d\'erreurs trop élevé');
                return;
            }

            if (metrics.latencyP95 > config.metrics.thresholds.latencyP95) {
                console.error(`⚠️ Latence P95 (${metrics.latencyP95.toFixed(2)}s) supérieure au seuil (${config.metrics.thresholds.latencyP95}s)`);
                await rollback('Latence trop élevée');
                return;
            }

            if (metrics.cpuUsage > config.metrics.thresholds.cpuUsage) {
                console.error(`⚠️ Utilisation CPU (${metrics.cpuUsage.toFixed(2)}%) supérieure au seuil (${config.metrics.thresholds.cpuUsage}%)`);
                await rollback('Utilisation CPU trop élevée');
                return;
            }

            if (metrics.memoryUsage > config.metrics.thresholds.memoryUsage) {
                console.error(`⚠️ Utilisation mémoire (${metrics.memoryUsage.toFixed(0)}MB) supérieure au seuil (${config.metrics.thresholds.memoryUsage}MB)`);
                await rollback('Utilisation mémoire trop élevée');
                return;
            }

        } catch (error) {
            console.error(`Erreur lors de la collecte des métriques: ${error.message}`);
            // Ne pas faire de rollback automatique si la collecte de métriques échoue une seule fois
        }
    }, config.metrics.checkInterval * 1000);
}

/**
 * Collecter les métriques de l'application
 */
async function collectMetrics() {
    if (argv.dryRun) {
        // En mode dry-run, générer des métriques aléatoires mais réalistes
        return {
            errorRate: Math.random() * 1.5, // 0-1.5%
            latencyP95: 0.8 + Math.random(), // 0.8-1.8s
            cpuUsage: 50 + Math.random() * 20, // 50-70%
            memoryUsage: 500 + Math.random() * 300 // 500-800MB
        };
    }

    // Dans un environnement réel, récupérer les métriques depuis l'API de métriques
    try {
        const results = {};

        // Pour chaque métrique configurée, exécuter la requête
        for (const [key, query] of Object.entries(config.metrics.queries)) {
            try {
                const response = await axios.get(config.metrics.endpoint, {
                    params: { query },
                    timeout: 10000
                });

                if (response.data && response.data.data && response.data.data.result && response.data.data.result.length > 0) {
                    results[key] = parseFloat(response.data.data.result[0].value[1]);
                } else {
                    console.warn(`⚠️ Pas de résultat pour la métrique ${key}`);
                    results[key] = 0; // Valeur par défaut
                }
            } catch (error) {
                console.warn(`⚠️ Erreur lors de la récupération de la métrique ${key}: ${error.message}`);
                results[key] = 0; // Valeur par défaut
            }
        }

        return {
            errorRate: results.errorRate || 0,
            latencyP95: results.latencyP95 || 0,
            cpuUsage: results.cpuUsage || 0,
            memoryUsage: results.memoryUsage || 0
        };
    } catch (error) {
        throw new Error(`Erreur lors de la collecte des métriques: ${error.message}`);
    }
}

/**
 * Effectuer les contrôles de santé
 */
async function performHealthChecks() {
    console.log('🩺 Exécution des contrôles de santé...');

    if (argv.dryRun) {
        console.log('Mode dry-run: simulation des contrôles de santé');
        return { healthy: true };
    }

    try {
        const results = [];

        // Exécuter chaque contrôle de santé
        for (const check of config.healthChecks) {
            try {
                console.log(`Vérification de ${check.endpoint}...`);
                const response = await axios.get(check.endpoint, {
                    timeout: check.timeout,
                    validateStatus: null // Ne pas rejeter les statuts non-200
                });

                const isHealthy = response.status === check.expectedStatus;
                results.push({
                    endpoint: check.endpoint,
                    healthy: isHealthy,
                    status: response.status,
                    expected: check.expectedStatus
                });

                if (!isHealthy) {
                    console.warn(`⚠️ Échec du contrôle de santé pour ${check.endpoint}: statut ${response.status}, attendu ${check.expectedStatus}`);
                } else {
                    console.log(`✅ Contrôle de santé réussi pour ${check.endpoint}`);
                }
            } catch (error) {
                console.warn(`⚠️ Erreur lors du contrôle de santé pour ${check.endpoint}: ${error.message}`);
                results.push({
                    endpoint: check.endpoint,
                    healthy: false,
                    error: error.message
                });
            }
        }

        // Vérifier si tous les contrôles sont sains
        const allHealthy = results.every(r => r.healthy);
        return {
            healthy: allHealthy,
            results,
            reason: allHealthy ? null : 'Un ou plusieurs contrôles de santé ont échoué'
        };
    } catch (error) {
        return {
            healthy: false,
            results: [],
            reason: `Erreur lors des contrôles de santé: ${error.message}`
        };
    }
}

/**
 * Attendre que le déploiement soit terminé
 */
async function waitForDeploymentCompletion() {
    console.log(`⏳ Progression du déploiement canary avec augmentation de trafic tous les ${config.stepIntervalMinutes} minutes...`);

    // Calculer le nombre d'étapes nécessaires pour atteindre 100%
    const steps = Math.ceil((100 - currentTrafficPercentage) / config.trafficStepPercentage);
    console.log(`Nombre d'étapes restantes: ${steps}`);

    for (let step = 0; step < steps; step++) {
        // Attendre l'intervalle configuré
        console.log(`Attente de ${config.stepIntervalMinutes} minutes avant la prochaine augmentation de trafic...`);
        await new Promise(resolve => setTimeout(resolve, argv.dryRun ? 3000 : config.stepIntervalMinutes * 60 * 1000));

        // Vérifier si le déploiement doit être annulé
        if (rollbackInitiated) {
            console.log('Déploiement annulé, sortie de la boucle d\'attente');
            return;
        }

        // Effectuer les contrôles de santé
        const healthCheck = await performHealthChecks();
        if (!healthCheck.healthy) {
            console.error(`⚠️ Échec des contrôles de santé: ${healthCheck.reason}`);
            await rollback(healthCheck.reason);
            return;
        }

        // Augmenter le pourcentage de trafic
        const previousPercentage = currentTrafficPercentage;
        currentTrafficPercentage = Math.min(100, currentTrafficPercentage + config.trafficStepPercentage);

        console.log(`📈 Augmentation du trafic de ${previousPercentage}% à ${currentTrafficPercentage}%`);

        if (!argv.dryRun) {
            try {
                // Dans un scénario réel, mettre à jour le routage du trafic
                await simulateCommand('2s', `Met à jour le routage à ${currentTrafficPercentage}%`);
            } catch (error) {
                console.error(`❌ Erreur lors de la mise à jour du routage: ${error.message}`);
                await rollback('Erreur de mise à jour du routage');
                return;
            }
        }

        await sendNotification('info', `Déploiement canary de ${argv.app}: trafic augmenté à ${currentTrafficPercentage}%`);
    }

    console.log('✅ Progression du déploiement canary terminée avec succès.');
}

/**
 * Finaliser le déploiement (promotion ou rollback)
 */
async function finalizeDeployment() {
    if (rollbackInitiated) {
        console.log('🔄 Finalisation du rollback...');
        return;
    }

    console.log('🏁 Finalisation du déploiement canary...');

    try {
        // Effectuer un dernier contrôle de santé
        const finalHealthCheck = await performHealthChecks();
        if (!finalHealthCheck.healthy && !argv.force) {
            console.error(`⚠️ Le contrôle de santé final a échoué: ${finalHealthCheck.reason}`);
            await rollback(finalHealthCheck.reason);
            return;
        }

        // Promouvoir le déploiement canary
        if (!argv.dryRun) {
            console.log('Promotion du déploiement canary en déploiement principal...');
            await simulateCommand('5s', 'Finalise le déploiement');

            console.log('Mise à jour des références et étiquettes...');
            await simulateCommand('2s', 'Met à jour les références');

            // Calculer la durée totale du déploiement
            const deploymentEndTime = new Date();
            const deploymentDurationMinutes = (deploymentEndTime - deploymentStartTime) / (60 * 1000);

            await sendNotification('success', `Déploiement de ${argv.app} en ${argv.env} terminé avec succès en ${deploymentDurationMinutes.toFixed(1)} minutes`);
        }

        // Nettoyage des ressources
        console.log('Nettoyage des ressources temporaires...');
        clearInterval(metricsCheckInterval);

        // Enregistrer les métriques de déploiement
        await recordDeploymentMetrics({ success: true, promotedToProduction: true });

        console.log('✅ Déploiement canary finalisé avec succès!');
    } catch (error) {
        console.error(`❌ Erreur lors de la finalisation du déploiement: ${error.message}`);
        await rollback(error.message);
    }
}

/**
 * Effectuer un rollback du déploiement
 */
async function rollback(reason) {
    // Éviter les rollbacks en cascade
    if (rollbackInitiated) {
        console.log('Un rollback est déjà en cours, ignoré.');
        return;
    }

    rollbackInitiated = true;
    console.log(`🔄 Démarrage du rollback pour la raison suivante: ${reason}`);

    try {
        clearInterval(metricsCheckInterval);

        await sendNotification('warning', `⚠️ Rollback du déploiement canary de ${argv.app} déclenché: ${reason}`);

        if (argv.dryRun) {
            console.log('Mode dry-run: simulation du rollback');
        } else {
            console.log('Restauration du routage vers la version stable...');
            await simulateCommand('3s', 'Restaure le routage vers la version stable');

            console.log('Nettoyage des ressources canary...');
            await simulateCommand('4s', 'Nettoie les ressources canary');
        }

        // Enregistrer les métriques de déploiement
        await recordDeploymentMetrics({ success: false, rollbackReason: reason });

        console.log('✅ Rollback terminé avec succès.');
    } catch (error) {
        console.error(`❌ Erreur critique lors du rollback: ${error.message}`);
        // Même en cas d'erreur, considérer que le rollback est terminé
    }
}

/**
 * Enregistrer les métriques de déploiement
 */
async function recordDeploymentMetrics(result) {
    console.log('📊 Enregistrement des métriques de déploiement...');

    if (argv.dryRun) {
        return;
    }

    try {
        const deploymentEndTime = new Date();
        const deploymentData = {
            id: config.deploymentId,
            application: argv.app,
            environment: argv.env,
            startTime: deploymentStartTime.toISOString(),
            endTime: deploymentEndTime.toISOString(),
            durationMinutes: (deploymentEndTime - deploymentStartTime) / (60 * 1000),
            success: result.success,
            rollbackInitiated: rollbackInitiated,
            rollbackReason: result.rollbackReason || null,
            promotedToProduction: result.promotedToProduction || false,
            maxTrafficPercentage: currentTrafficPercentage,
            config
        };

        // Enregistrer les données du déploiement
        await fs.writeJSON(
            path.join(process.cwd(), 'logs', 'deployments', `${config.deploymentId}.result.json`),
            deploymentData,
            { spaces: 2 }
        );

        console.log('✅ Métriques de déploiement enregistrées.');
    } catch (error) {
        console.error(`⚠️ Erreur lors de l'enregistrement des métriques: ${error.message}`);
    }
}

/**
 * Envoyer une notification
 */
async function sendNotification(level, message) {
    console.log(`📣 Notification (${level}): ${message}`);

    if (argv.dryRun) {
        return;
    }

    // Dans un environnement réel, envoyer une notification à Slack, par email, etc.
    // Exemple simplifié
    try {
        // Simulation d'envoi de notification
        const emoji = level === 'success' ? '✅' : level === 'warning' ? '⚠️' : level === 'failure' ? '❌' : 'ℹ️';
        const notification = {
            level,
            emoji,
            message: `${emoji} ${message}`,
            timestamp: new Date().toISOString(),
            deploymentId: config.deploymentId,
            application: argv.app,
            environment: argv.env
        };

        // Enregistrer la notification
        const notificationsDir = path.join(process.cwd(), 'logs', 'notifications');
        await fs.ensureDir(notificationsDir);

        await fs.writeJSON(
            path.join(notificationsDir, `${config.deploymentId}-${Date.now()}.json`),
            notification,
            { spaces: 2 }
        );
    } catch (error) {
        console.error(`⚠️ Erreur lors de l'envoi de la notification: ${error.message}`);
    }
}

/**
 * Fonction utilitaire pour simuler une commande avec un délai
 */
async function simulateCommand(duration, description) {
    return new Promise((resolve) => {
        const [time, unit] = duration.match(/^(\d+)(\w)$/).slice(1);
        const ms = unit === 's' ? parseInt(time) * 1000 : parseInt(time);

        if (description) {
            console.log(`Exécution: ${description}...`);
        }

        setTimeout(() => {
            if (description) {
                console.log(`✅ Terminé: ${description}`);
            }
            resolve();
        }, ms);
    });
}

// Démarrer le script
main().catch(error => {
    console.error(`Erreur fatale: ${error.message}`);
    process.exit(1);
});