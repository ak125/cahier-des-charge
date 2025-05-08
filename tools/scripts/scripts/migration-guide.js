#!/usr/bin/env node

/**
 * Guide de migration des scripts bash vers Nx et Earthfile
 * 
 * Ce script d'aide montre comment utiliser les nouvelles cibles Nx et Earthfile
 * qui remplacent les anciens scripts bash.
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Tableau de correspondance entre les anciens scripts et les nouvelles commandes
const migrationMap = {
    'optimize-disk-space.sh': {
        newCommand: 'earthly +optimize-disk',
        description: 'Optimise l\'espace disque, supprime les fichiers temporaires et dupliqués',
        extraArgs: '--MIN_FREE_SPACE=10 --ENABLE_DOCKER_CLEAN=true'
    },
    'optimize-git-repo.sh': {
        newCommand: 'earthly +optimize-disk',
        description: 'Optimise le dépôt Git (également inclus dans optimize-disk)',
        extraArgs: ''
    },
    'optimize-project.sh': {
        newCommand: 'earthly +optimize-disk && earthly +cleanup-project',
        description: 'Optimisation complète du projet (espace disque + nettoyage du projet)',
        extraArgs: '--DEEP_CLEAN=false'
    },
    'migrate-agents.sh': {
        newCommand: 'earthly +ci-migrate',
        description: 'Migration des agents vers la nouvelle structure',
        extraArgs: '--MODE=execute --MIGRATE_TYPE=agents'
    },
    'migrate-to-bullmq.sh': {
        newCommand: 'earthly +ci-migrate',
        description: 'Migration vers BullMQ',
        extraArgs: '--MODE=execute --MIGRATE_TYPE=bullmq'
    },
    'migrate-to-temporal.js': {
        newCommand: 'earthly +ci-migrate',
        description: 'Migration vers Temporal',
        extraArgs: '--MODE=execute --MIGRATE_TYPE=temporal'
    },
    'start-migration.sh': {
        newCommand: 'earthly +ci-migrate',
        description: 'Démarrage des migrations (tous types)',
        extraArgs: '--MODE=execute --MIGRATE_TYPE=all'
    },
    'cleanup-project.sh': {
        newCommand: 'earthly +cleanup-project',
        description: 'Nettoyage du projet',
        extraArgs: '--CLEANUP_TYPE=all'
    },
    'ci-check-redirects.sh': {
        newCommand: 'earthly +check-seo-redirects',
        description: 'Vérification des redirections SEO',
        extraArgs: '--VALIDATION_MODE=strict'
    },
    'verify-cahier.sh': {
        newCommand: 'earthly +generate-cahier',
        description: 'Vérification du cahier des charges',
        extraArgs: '--UPDATE_MODE=check'
    },
    'update-cahier.sh': {
        newCommand: 'earthly +generate-cahier',
        description: 'Mise à jour du cahier des charges',
        extraArgs: '--UPDATE_MODE=update'
    },
    'nx-wrapper.sh': {
        newCommand: 'npx nx',
        description: 'Utiliser directement les commandes Nx',
        extraArgs: 'run-many --target=typecheck --all'
    }
};

// Commandes Nx courantes
const nxCommands = {
    'typecheck': 'npx nx run-many --target=typecheck --all',
    'lint': 'npx nx run-many --target=lint --all',
    'test': 'npx nx run-many --target=test --all',
    'build': 'npx nx run-many --target=build --all',
    'db-optimize': 'npx nx run-many --target=db-optimize --all',
    'ci-migrate': 'npx nx run-many --target=ci-migrate --all'
};

// Commandes Earthly courantes
const earthlyCommands = {
    'ci-full': 'earthly +ci-full',
    'deploy-full': 'earthly +deploy-full --ENV=staging',
    'optimize-disk': 'earthly +optimize-disk',
    'db-optimize': 'earthly +db-optimize',
    'ci-migrate': 'earthly +ci-migrate --MODE=dry-run',
    'cleanup-project': 'earthly +cleanup-project',
    'check-seo-redirects': 'earthly +check-seo-redirects',
    'generate-cahier': 'earthly +generate-cahier'
};

// Fonction pour afficher l'aide
function showHelp() {
    console.log('\n📋 Guide de migration des scripts vers Nx et Earthfile 📋');
    console.log('=======================================================\n');
    console.log('Ce guide vous aide à comprendre comment utiliser les nouvelles cibles Nx et Earthfile');
    console.log('qui remplacent les anciens scripts bash.\n');

    console.log('Commandes disponibles:');
    console.log('  1. Afficher tous les scripts migrés');
    console.log('  2. Rechercher un script spécifique');
    console.log('  3. Afficher les commandes Nx courantes');
    console.log('  4. Afficher les commandes Earthly courantes');
    console.log('  5. Afficher des exemples d\'utilisation');
    console.log('  6. Exécuter une commande (Nx ou Earthly)');
    console.log('  0. Quitter\n');
}

// Fonction pour afficher tous les scripts migrés
function showAllMigrated() {
    console.log('\n📜 Scripts migrés et leurs équivalents 📜');
    console.log('======================================\n');

    Object.entries(migrationMap).forEach(([oldScript, info]) => {
        console.log(`🔹 Ancien script: ${oldScript}`);
        console.log(`   ↳ Nouvelle commande: ${info.newCommand}`);
        console.log(`   ↳ Description: ${info.description}`);
        if (info.extraArgs) {
            console.log(`   ↳ Arguments additionnels: ${info.extraArgs}`);
        }
        console.log('');
    });
}

// Fonction pour rechercher un script spécifique
function searchScript(scriptName) {
    const found = Object.entries(migrationMap).find(([key]) =>
        key.toLowerCase().includes(scriptName.toLowerCase()));

    if (found) {
        const [oldScript, info] = found;
        console.log(`\n🔍 Résultat de recherche pour "${scriptName}" 🔍`);
        console.log('=========================================\n');
        console.log(`🔹 Ancien script: ${oldScript}`);
        console.log(`   ↳ Nouvelle commande: ${info.newCommand}`);
        console.log(`   ↳ Description: ${info.description}`);
        if (info.extraArgs) {
            console.log(`   ↳ Arguments additionnels: ${info.extraArgs}`);
        }
    } else {
        console.log(`\n❌ Aucun script trouvé pour "${scriptName}"`);
        console.log('Essayez une recherche avec un terme plus général.\n');
    }
}

// Fonction pour afficher les commandes Nx courantes
function showNxCommands() {
    console.log('\n🔧 Commandes Nx courantes 🔧');
    console.log('===========================\n');

    Object.entries(nxCommands).forEach(([name, command]) => {
        console.log(`🔹 ${name}:`);
        console.log(`   ↳ ${command}`);
        console.log('');
    });
}

// Fonction pour afficher les commandes Earthly courantes
function showEarthlyCommands() {
    console.log('\n🚀 Commandes Earthly courantes 🚀');
    console.log('===============================\n');

    Object.entries(earthlyCommands).forEach(([name, command]) => {
        console.log(`🔹 ${name}:`);
        console.log(`   ↳ ${command}`);
        console.log('');
    });
}

// Fonction pour afficher des exemples d'utilisation
function showExamples() {
    console.log('\n🎯 Exemples d\'utilisation 🎯');
    console.log('==========================\n');

    console.log('🔸 Exécuter un typecheck sur tous les projets:');
    console.log('   npx nx run-many --target=typecheck --all');
    console.log('');

    console.log('🔸 Exécuter un typecheck sur un projet spécifique:');
    console.log('   npx nx run admin-dashboard:typecheck');
    console.log('');

    console.log('🔸 Optimiser l\'espace disque avec un espace minimum de 10 GB:');
    console.log('   earthly +optimize-disk --MIN_FREE_SPACE=10');
    console.log('');

    console.log('🔸 Migration complète en mode dry-run:');
    console.log('   earthly +ci-migrate --MODE=dry-run');
    console.log('');

    console.log('🔸 Exécuter toute la CI:');
    console.log('   earthly +ci-full');
    console.log('');

    console.log('🔸 Déployer en environnement de staging:');
    console.log('   earthly +deploy-full --ENV=staging');
    console.log('');
}

// Fonction pour exécuter une commande
function executeCommand(command) {
    console.log(`\n🚀 Exécution de la commande: ${command}`);
    console.log('=============================\n');

    try {
        const output = execSync(command, { encoding: 'utf-8' });
        console.log(output);
        console.log('\n✅ Commande exécutée avec succès!');
    } catch (error) {
        console.error('\n❌ Erreur lors de l\'exécution de la commande:');
        console.error(error.message);
    }
}

// Fonction principale interactive
async function main() {
    showHelp();

    function promptUser() {
        rl.question('\nChoisissez une option (0-6): ', (answer) => {
            switch (answer) {
                case '0':
                    console.log('\n👋 Au revoir!');
                    rl.close();
                    break;
                case '1':
                    showAllMigrated();
                    promptUser();
                    break;
                case '2':
                    rl.question('\nEntrez le nom du script à rechercher: ', (scriptName) => {
                        searchScript(scriptName);
                        promptUser();
                    });
                    break;
                case '3':
                    showNxCommands();
                    promptUser();
                    break;
                case '4':
                    showEarthlyCommands();
                    promptUser();
                    break;
                case '5':
                    showExamples();
                    promptUser();
                    break;
                case '6':
                    rl.question('\nEntrez la commande à exécuter: ', (command) => {
                        executeCommand(command);
                        promptUser();
                    });
                    break;
                default:
                    console.log('\n❌ Option non valide. Veuillez réessayer.');
                    promptUser();
                    break;
            }
        });
    }

    promptUser();
}

// Exécuter le script principal
main().catch(console.error);