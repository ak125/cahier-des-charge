#!/usr/bin/env node

/**
 * Script qui prépare le déploiement canary en configurant les paramètres nécessaires
 * pour un déploiement progressif et réversible.
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
        description: 'Environnement cible pour le déploiement canary',
        type: 'string',
        default: 'dev'
    })
    .option('traffic', {
        alias: 't',
        description: 'Pourcentage de trafic pour le déploiement canary',
        type: 'number',
        default: 10
    })
    .option('timeout', {
        description: 'Délai avant basculement complet (en minutes)',
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
        console.log(`🚀 Préparation du déploiement canary pour l'environnement: ${argv.env}`);

        // Générer une version unique pour ce déploiement canary
        const canaryVersion = generateCanaryVersion();

        console.log(`📌 Version canary générée: ${canaryVersion}`);

        // Créer la configuration de déploiement canary
        const canaryConfig = {
            version: canaryVersion,
            environment: argv.env,
            trafficPercentage: argv.traffic,
            rollbackTimeout: argv.timeout * 60, // Conversion en secondes
            timestamp: new Date().toISOString(),
            commitSha: getGitCommitSha(),
            commitMessage: getGitCommitMessage(),
            canaryHealthChecks: [
                `https://canary-${argv.env}.exemple.com/health`,
                `https://canary-${argv.env}.exemple.com/api/status`
            ],
            metrics: [
                {
                    name: "responseTime",
                    thresholdValue: 500,
                    thresholdType: "max"
                },
                {
                    name: "errorRate",
                    thresholdValue: 1,
                    thresholdType: "max"
                },
                {
                    name: "cpu",
                    thresholdValue: 80,
                    thresholdType: "max"
                }
            ]
        };

        // Créer les répertoires nécessaires
        const configDir = path.join(process.cwd(), 'config', 'deployments');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // Écrire la configuration canary
        const configPath = path.join(configDir, `canary-${argv.env}-${canaryVersion}.json`);
        fs.writeFileSync(configPath, JSON.stringify(canaryConfig, null, 2));

        console.log(`✅ Configuration canary écrite dans: ${configPath}`);

        // Mettre à jour la configuration d'ingress (si nécessaire)
        console.log(`📝 Mise à jour de la configuration d'ingress pour le canary ${argv.env}...`);
        updateIngressConfiguration(argv.env, canaryVersion, argv.traffic);

        console.log('✅ Préparation du déploiement canary terminée avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors de la préparation du déploiement canary:', error);
        process.exit(1);
    }
}

/**
 * Génère un numéro de version unique pour le déploiement canary
 */
function generateCanaryVersion() {
    const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '')
        .replace(/T/, '-')
        .replace(/\..+/, '');

    const gitShortSha = execSync('git rev-parse --short HEAD').toString().trim();

    return `${timestamp}-${gitShortSha}`;
}

/**
 * Récupère le SHA du commit actuel
 */
function getGitCommitSha() {
    return execSync('git rev-parse HEAD').toString().trim();
}

/**
 * Récupère le message de commit actuel
 */
function getGitCommitMessage() {
    return execSync('git log -1 --pretty=%B').toString().trim();
}

/**
 * Met à jour la configuration d'ingress pour acheminer le trafic vers le déploiement canary
 */
function updateIngressConfiguration(env, version, percentage) {
    // Cette fonction simule la mise à jour de la configuration d'ingress
    // Dans un environnement réel, vous utiliseriez Kubernetes, Nginx, etc.

    const ingressConfigTemplate = {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
            name: `app-${env}`,
            annotations: {
                "nginx.ingress.kubernetes.io/canary": "true",
                "nginx.ingress.kubernetes.io/canary-weight": percentage.toString()
            }
        },
        spec: {
            rules: [
                {
                    host: `app-${env}.exemple.com`,
                    http: {
                        paths: [
                            {
                                path: "/",
                                pathType: "Prefix",
                                backend: {
                                    service: {
                                        name: `app-canary-${version}`,
                                        port: {
                                            number: 80
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };

    // Simulation de la création du fichier de configuration
    const ingressDir = path.join(process.cwd(), 'config', 'ingress');
    if (!fs.existsSync(ingressDir)) {
        fs.mkdirSync(ingressDir, { recursive: true });
    }

    const ingressPath = path.join(ingressDir, `canary-ingress-${env}-${version}.yaml`);
    fs.writeFileSync(ingressPath, JSON.stringify(ingressConfigTemplate, null, 2));

    console.log(`📋 Configuration d'ingress canary générée: ${ingressPath}`);
}

// Exécution du script
main().catch(error => {
    console.error(error);
    process.exit(1);
});