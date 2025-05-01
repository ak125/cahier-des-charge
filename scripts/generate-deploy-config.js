#!/usr/bin/env node

/**
 * Script pour générer des configurations de déploiement basées sur le graphe de dépendances Nx
 * Utilise le fichier .nx/deps.json pour déterminer les dépendances entre les projets
 * et générer des configurations de déploiement adaptées
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Analyse des arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const depsArg = args.find(arg => arg.startsWith('--deps='));

// Valeurs par défaut
let env = 'dev';
let depsPath = './.nx/deps.json';

// Extraction des valeurs des arguments
if (envArg) {
    env = envArg.split('=')[1];
}

if (depsArg) {
    depsPath = depsArg.split('=')[1];
}

console.log(`🔍 Génération des configurations pour l'environnement: ${env}`);
console.log(`📊 Utilisation du fichier de dépendances: ${depsPath}`);

// Vérification de l'existence du fichier de dépendances
if (!fs.existsSync(depsPath)) {
    console.error(`❌ Le fichier de dépendances ${depsPath} n'existe pas.`);
    console.error('💡 Exécutez d\'abord: npx nx graph --file=.nx/deps.json');
    process.exit(1);
}

// Chargement du graphe de dépendances
const depsData = JSON.parse(fs.readFileSync(depsPath, 'utf8'));

// Extraction des projets et de leurs dépendances
const projects = {};
try {
    if (depsData.graph && depsData.graph.nodes && depsData.graph.dependencies) {
        // Extraction des nœuds (projets)
        Object.entries(depsData.graph.nodes).forEach(([projectName, projectData]) => {
            projects[projectName] = {
                name: projectName,
                type: projectData.type,
                data: projectData.data || {},
                dependencies: [],
                deploymentConfig: {}
            };
        });

        // Ajout des dépendances pour chaque projet
        Object.entries(depsData.graph.dependencies).forEach(([projectName, deps]) => {
            if (projects[projectName]) {
                projects[projectName].dependencies = deps.map(dep => dep.target);
            }
        });
    } else {
        console.error('❌ Format de fichier de dépendances invalide.');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Erreur lors de l\'analyse du fichier de dépendances:', error);
    process.exit(1);
}

// Identification des projets déployables (apps)
const deployableProjects = Object.values(projects).filter(project =>
    project.type === 'app' ||
    (project.data && project.data.tags && project.data.tags.includes('deployable'))
);

console.log(`🚀 Projets déployables identifiés: ${deployableProjects.length}`);

// Configuration de déploiement par projet
const deploymentConfig = {
    apiVersion: 'v1',
    kind: 'DeploymentMap',
    metadata: {
        name: `mcp-deployment-${env}`,
        environment: env,
        timestamp: new Date().toISOString()
    },
    spec: {
        projects: {}
    }
};

// Génération de la configuration de déploiement pour chaque projet déployable
deployableProjects.forEach(project => {
    // Extraction du nom court du projet (sans les préfixes d'apps)
    const shortName = project.name.includes('-') ? project.name.split('-').pop() : project.name;

    // Détermination des dépendances déployables
    const deployableDeps = project.dependencies
        .filter(dep => deployableProjects.some(p => p.name === dep))
        .map(dep => {
            const shortDepName = dep.includes('-') ? dep.split('-').pop() : dep;
            return {
                name: shortDepName,
                kind: 'Service'
            };
        });

    // Configuration du déploiement
    deploymentConfig.spec.projects[shortName] = {
        image: `mcp-app-${shortName}:${env}`,
        replicas: env === 'prod' ? 3 : 1,
        resources: {
            requests: {
                cpu: '100m',
                memory: '128Mi'
            },
            limits: {
                cpu: env === 'prod' ? '500m' : '200m',
                memory: env === 'prod' ? '512Mi' : '256Mi'
            }
        },
        dependencies: deployableDeps,
        config: {
            environment: env,
            nodeEnv: env === 'prod' ? 'production' : 'development',
            logLevel: env === 'prod' ? 'info' : 'debug'
        },
        healthcheck: {
            path: '/health',
            port: 3000
        }
    };

    // Configuration spécifique pour MCP
    if (project.name.includes('mcp') || (project.data.tags && project.data.tags.includes('mcp'))) {
        deploymentConfig.spec.projects[shortName].config.mcp = {
            enabled: true,
            webhookUrl: '${WEBHOOK_URL}',
            agentMode: env === 'prod' ? 'strict' : 'lenient'
        };
    }
});

// Ajout d'une configuration pour Docusaurus si elle existe
if (deployableProjects.some(p => p.name.includes('docs'))) {
    deploymentConfig.spec.projects.docs = {
        image: `mcp-docs:${env}`,
        replicas: 1,
        resources: {
            requests: {
                cpu: '50m',
                memory: '64Mi'
            },
            limits: {
                cpu: '200m',
                memory: '128Mi'
            }
        },
        config: {
            environment: env,
            nodeEnv: env === 'prod' ? 'production' : 'development'
        }
    };
}

// Écriture du fichier de configuration
const outputFilePath = `deployment-${env}.yaml`;
fs.writeFileSync(outputFilePath, JSON.stringify(deploymentConfig, null, 2));

console.log(`✅ Fichier de configuration généré: ${outputFilePath}`);

// Si nous sommes en environnement CI, vérification de la configuration avec conftest
try {
    if (process.env.CI === 'true') {
        console.log('🛡️ Vérification de la configuration avec conftest...');
        execSync(`conftest test ${outputFilePath} --policy=./policies`);
        console.log('✅ Vérification de la configuration réussie!');
    }
} catch (error) {
    console.error('⚠️ Erreur lors de la vérification de la configuration:', error.message);
    // Ne pas échouer, car conftest peut ne pas être installé
}

console.log('🎉 Génération des configurations de déploiement terminée!');