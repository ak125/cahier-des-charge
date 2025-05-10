#!/usr/bin/env node

/**
 * Script de nettoyage et d'optimisation de la structure à 3 couches
 * Ce script analyse la structure du projet et résout les problèmes de duplication
 * spécifiques à l'architecture en 3 couches (business, coordination, orchestration)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

// Configuration
const BACKUP_DIR = path.join(ROOT_DIR, 'backup', `3layer-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const LOG_FILE = path.join(ROOT_DIR, 'reports', `3layer-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Couches de l'architecture
const LAYERS = ['business', 'coordination', 'orchestration'];

// Couleurs pour les sorties console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Utilitaires de journalisation
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    let coloredPrefix = '';

    switch (type) {
        case 'error':
            coloredPrefix = `${colors.red}[ERREUR]${colors.reset}`;
            break;
        case 'warning':
            coloredPrefix = `${colors.yellow}[ATTENTION]${colors.reset}`;
            break;
        case 'success':
            coloredPrefix = `${colors.green}[SUCCÈS]${colors.reset}`;
            break;
        default:
            coloredPrefix = `${colors.blue}[INFO]${colors.reset}`;
    }

    const logMessage = `${timestamp} - ${coloredPrefix} ${message}`;
    console.log(logMessage);

    // Écrire dans le fichier de log
    fs.appendFileSync(LOG_FILE, logMessage.replace(/\x1b\[\d+m/g, '') + '\n');
}

// Préparer les répertoires
function prepareDirectories() {
    // Créer le répertoire de backup
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        log(`Répertoire de backup créé: ${BACKUP_DIR}`, 'success');
    }

    // Créer le répertoire de logs s'il n'existe pas
    const logsDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Initialiser le fichier de log
    fs.writeFileSync(LOG_FILE, `# Journal de nettoyage de la structure à 3 couches\n` +
        `Date: ${new Date().toISOString()}\n\n`);
}

// Sauvegarder un fichier
function backupFile(filePath) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const backupPath = path.join(BACKUP_DIR, relativePath);

    try {
        // Créer les répertoires parents si nécessaire
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });

        // Copier le fichier
        fs.copyFileSync(filePath, backupPath);
        log(`Fichier sauvegardé: ${relativePath}`, 'info');
        return true;
    } catch (err) {
        log(`Erreur lors de la sauvegarde de ${filePath}: ${err.message}`, 'error');
        return false;
    }
}

// Fonction principale pour détecter et résoudre les problèmes NX
async function detectAndFixNxDuplicates() {
    log('Analyse des problèmes de configuration NX...', 'info');

    try {
        // Vérifier si nx.json existe
        if (!fs.existsSync(path.join(ROOT_DIR, 'nx.json'))) {
            log('nx.json introuvable', 'error');
            return;
        }

        // Lire la configuration NX
        const nxConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'nx.json'), 'utf8'));

        // Ajouter ou mettre à jour la section "namedInputs" pour ignorer les dossiers backup
        if (!nxConfig.namedInputs) {
            nxConfig.namedInputs = {};
        }

        // Ajouter la configuration pour ignorer les dossiers de backup
        nxConfig.namedInputs.default = [
            ...(nxConfig.namedInputs.default || ['{projectRoot}/**/*']),
            '!{projectRoot}/**/backup/**',
            '!{projectRoot}/**/archives_old/**',
            '!backup/**',
            '!archives_old/**',
            '!**/*.backup',
            '!**/*.bak'
        ];

        // Ajouter une section excludeFiles si elle n'existe pas
        if (!nxConfig.generators) {
            nxConfig.generators = {};
        }
        if (!nxConfig.generators.excludeFiles) {
            nxConfig.generators.excludeFiles = [];
        }

        // Ajouter des patterns d'exclusion
        nxConfig.generators.excludeFiles = [
            ...(nxConfig.generators.excludeFiles || []),
            'backup/**/*',
            'archives_old/**/*',
            '**/backup/**/*',
            '**/*.backup',
            '**/*.bak'
        ];

        // Sauvegarder la configuration mise à jour
        fs.writeFileSync(path.join(ROOT_DIR, 'nx.json'), JSON.stringify(nxConfig, null, 2));
        log('Configuration NX mise à jour pour ignorer les dossiers de backup', 'success');

        // Réparer le cache NX
        log('Nettoyage du cache NX...', 'info');
        try {
            execSync('npx nx reset', { stdio: 'inherit', cwd: ROOT_DIR });
            log('Cache NX réinitialisé avec succès', 'success');
        } catch (e) {
            log(`Erreur lors de la réinitialisation du cache NX: ${e.message}`, 'error');
        }

        // Identifier les projets dupliqués
        log('Identification des projets dupliqués...', 'info');
        try {
            const result = execSync('npx nx show projects --json', { encoding: 'utf8', cwd: ROOT_DIR }).toString();
            const projects = JSON.parse(result);
            log(`Projets identifiés: ${projects.length}`, 'success');
        } catch (e) {
            log('Analyse des erreurs pour trouver les projets dupliqués', 'warning');

            // L'exécution de NX échoue mais nous pouvons analyser l'erreur pour trouver les doublons
            const errorOutput = e.stdout?.toString() || '';

            // Extraire les projets dupliqués
            const duplicateMatches = errorOutput.matchAll(/- (\w+):/g);
            const duplicates = [];
            for (const match of duplicateMatches) {
                duplicates.push(match[1]);
            }

            if (duplicates.length > 0) {
                log(`Projets dupliqués identifiés: ${duplicates.join(', ')}`, 'warning');
                await fixDuplicateProjects(duplicates, errorOutput);
            } else {
                log('Impossible de détecter les projets dupliqués', 'error');
            }
        }
    } catch (err) {
        log(`Erreur lors de la détection des doublons NX: ${err.message}`, 'error');
    }
}

// Fonction pour résoudre les projets dupliqués
async function fixDuplicateProjects(duplicates, errorOutput) {
    log('Résolution des projets dupliqués...', 'info');

    // Analyser les chemins dupliqués
    const duplicatePaths = {};

    // Regex pour extraire les chemins dupliqués
    const pathRegex = /- (\w+):\s+([^\n]+)/g;
    let match;

    while ((match = pathRegex.exec(errorOutput)) !== null) {
        const projectName = match[1];
        const paths = match[2].trim().split('\n  - ').map(p => p.trim());

        duplicatePaths[projectName] = paths;
    }

    // Pour chaque projet dupliqué
    for (const project of duplicates) {
        if (!duplicatePaths[project]) {
            log(`Pas d'informations sur les chemins pour ${project}`, 'warning');
            continue;
        }

        const paths = duplicatePaths[project];
        log(`Projet ${project} dupliqué dans les chemins: ${paths.join(', ')}`, 'info');

        // Nous gardons le premier chemin et renommons les autres
        const primaryPath = paths[0];

        for (let i = 1; i < paths.length; i++) {
            const duplicatePath = paths[i];
            if (duplicatePath.includes('backup/') || duplicatePath.includes('archives_old/')) {
                // Ignorer les chemins dans les dossiers de backup
                log(`Ignorer le dossier de backup: ${duplicatePath}`, 'info');
                continue;
            }

            // Renommer le projet en ajoutant un suffixe
            const projectJsonPath = path.join(ROOT_DIR, duplicatePath, 'project.json');
            if (fs.existsSync(projectJsonPath)) {
                try {
                    backupFile(projectJsonPath);

                    const projectConfig = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
                    const oldName = projectConfig.name || project;
                    projectConfig.name = `${oldName}_duplicate_${i}`;

                    fs.writeFileSync(projectJsonPath, JSON.stringify(projectConfig, null, 2));
                    log(`Projet renommé: ${oldName} -> ${projectConfig.name}`, 'success');
                } catch (err) {
                    log(`Erreur lors de la modification de ${projectJsonPath}: ${err.message}`, 'error');
                }
            } else {
                // Créer un fichier project.json avec un nom unique
                try {
                    const projectConfig = {
                        name: `${project}_duplicate_${i}`,
                        $schema: "../../node_modules/nx/schemas/project-schema.json",
                        projectType: "library"
                    };

                    fs.mkdirSync(path.dirname(projectJsonPath), { recursive: true });
                    fs.writeFileSync(projectJsonPath, JSON.stringify(projectConfig, null, 2));
                    log(`Créé project.json pour ${project}_duplicate_${i}`, 'success');
                } catch (err) {
                    log(`Erreur lors de la création de ${projectJsonPath}: ${err.message}`, 'error');
                }
            }
        }
    }
}

// Fonction principale
async function main() {
    console.log(`${colors.magenta}====== Nettoyage et optimisation de la structure à 3 couches ======${colors.reset}`);
    prepareDirectories();

    log('Démarrage du processus de nettoyage', 'info');

    try {
        // Vérification de l'existence des dossiers principaux
        log('Vérification de la structure à 3 couches...', 'info');

        for (const layer of LAYERS) {
            const layerPath = path.join(ROOT_DIR, 'packages', layer);
            if (!fs.existsSync(layerPath)) {
                log(`Couche ${layer} introuvable à ${layerPath}`, 'error');
                return;
            }
        }

        log('Structure à 3 couches détectée', 'success');

        // Résoudre les problèmes de duplication dans NX
        await detectAndFixNxDuplicates();

        // Nettoyer les caches à la fin
        log('Nettoyage des caches pour assurer un fonctionnement optimal...', 'info');
        try {
            execSync('pnpm store prune', { stdio: 'inherit', cwd: ROOT_DIR });
            execSync('rm -rf .nx-cache || true', { stdio: 'inherit', cwd: ROOT_DIR });
            execSync('rm -rf node_modules/.cache || true', { stdio: 'inherit', cwd: ROOT_DIR });
            log('Caches nettoyés avec succès', 'success');
        } catch (e) {
            log(`Erreur lors du nettoyage des caches: ${e.message}`, 'warning');
        }

        log('Processus de nettoyage terminé avec succès', 'success');
        console.log(`${colors.magenta}====== Nettoyage terminé ======${colors.reset}`);
        console.log(`${colors.green}Consultez le journal pour plus de détails: ${LOG_FILE}${colors.reset}`);
    } catch (err) {
        log(`Une erreur s'est produite: ${err.message}`, 'error');
        console.log(`${colors.red}Le processus a échoué. Consultez le journal: ${LOG_FILE}${colors.reset}`);
    }
}

// Exécuter le script
main().catch(err => {
    console.error(`${colors.red}Erreur fatale:${colors.reset}`, err);
    process.exit(1);
});
