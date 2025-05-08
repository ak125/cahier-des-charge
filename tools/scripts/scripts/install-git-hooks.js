#!/usr/bin/env node

/**
 * Script d'installation des hooks Git
 * 
 * Ce script installe automatiquement les hooks Git présents dans le dossier scripts/hooks/
 * dans le dossier .git/hooks/ du projet.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemins des répertoires
const REPO_ROOT = path.join(__dirname, '..');
const HOOKS_SOURCE_DIR = path.join(REPO_ROOT, 'scripts', 'hooks');
const GIT_DIR = path.join(REPO_ROOT, '.git');
const HOOKS_TARGET_DIR = path.join(GIT_DIR, 'hooks');

/**
 * Vérifie si le répertoire existe
 * @param {string} dir - Chemin du répertoire à vérifier
 * @returns {boolean} - true si le répertoire existe
 */
function directoryExists(dir) {
    try {
        return fs.statSync(dir).isDirectory();
    } catch (err) {
        return false;
    }
}

/**
 * Vérifie si le fichier existe
 * @param {string} file - Chemin du fichier à vérifier
 * @returns {boolean} - true si le fichier existe
 */
function fileExists(file) {
    try {
        return fs.statSync(file).isFile();
    } catch (err) {
        return false;
    }
}

/**
 * Crée un répertoire s'il n'existe pas
 * @param {string} dir - Chemin du répertoire à créer
 */
function ensureDirectoryExists(dir) {
    if (!directoryExists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Répertoire créé: ${dir}`);
    }
}

/**
 * Copie le hook avec les permissions d'exécution
 * @param {string} source - Chemin du fichier source
 * @param {string} target - Chemin du fichier cible
 */
function copyHookWithPermissions(source, target) {
    // Copier le contenu
    fs.copyFileSync(source, target);

    try {
        // Rendre le hook exécutable (chmod +x)
        execSync(`chmod +x "${target}"`);
        console.log(`✅ Hook installé: ${path.basename(target)}`);
    } catch (err) {
        console.error(`❌ Erreur lors de l'attribution des permissions d'exécution à ${target}: ${err.message}`);
    }
}

/**
 * Installe tous les hooks Git
 */
function installHooks() {
    console.log('Installation des hooks Git...');

    // Vérifier que le répertoire .git existe
    if (!directoryExists(GIT_DIR)) {
        console.error(`❌ Erreur: Le répertoire .git n'existe pas dans ${REPO_ROOT}`);
        console.log('Ce script doit être exécuté depuis la racine d'un dépôt Git.');
    return;
    }

    // Vérifier que le répertoire des hooks source existe
    if (!directoryExists(HOOKS_SOURCE_DIR)) {
        console.error(`❌ Erreur: Le répertoire des hooks source n'existe pas: ${HOOKS_SOURCE_DIR}`);
        return;
    }

    // Créer le répertoire des hooks cible s'il n'existe pas
    ensureDirectoryExists(HOOKS_TARGET_DIR);

    // Lister et installer les hooks
    const hookFiles = fs.readdirSync(HOOKS_SOURCE_DIR);
    let installedCount = 0;

    for (const hookFile of hookFiles) {
        const sourceHookPath = path.join(HOOKS_SOURCE_DIR, hookFile);
        const targetHookPath = path.join(HOOKS_TARGET_DIR, hookFile);

        // Vérifier si c'est un fichier
        if (fileExists(sourceHookPath)) {
            try {
                copyHookWithPermissions(sourceHookPath, targetHookPath);
                installedCount++;
            } catch (err) {
                console.error(`❌ Erreur lors de l'installation du hook ${hookFile}: ${err.message}`);
            }
        }
    }

    if (installedCount > 0) {
        console.log(`\n🎉 ${installedCount} hooks Git installés avec succès dans ${HOOKS_TARGET_DIR}`);
    } else {
        console.log('Aucun hook n'a été installé.');
  }
}

// Exécuter l'installation
installHooks();