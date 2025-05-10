#!/usr/bin/env node

/**
 * Script pour résoudre les problèmes de duplication dans les projets NX
 * Ce script recherche les fichiers project.json dupliqués et les renomme
 * pour éviter les conflits et permettre à NX de fonctionner correctement.
 * 
 * Date: 9 mai 2025
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = process.cwd();
const backupDir = path.join(rootDir, 'backup', `nx-fix-${Date.now()}`);

// Créer le répertoire de sauvegarde
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 Répertoire de sauvegarde créé: ${backupDir}`);
}

// Journal des actions
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// Fonction pour trouver tous les fichiers project.json
function findProjectFiles() {
    try {
        log('🔍 Recherche des fichiers project.json...');

        const command = 'find . -name "project.json" -not -path "./node_modules/*" -not -path "./.nx/*"';
        const output = execSync(command, { encoding: 'utf8' });

        const projectFiles = output.trim().split('\n').filter(Boolean);
        log(`✅ ${projectFiles.length} fichiers project.json trouvés.`);

        return projectFiles;
    } catch (error) {
        log(`❌ Erreur lors de la recherche des fichiers project.json: ${error.message}`);
        return [];
    }
}

// Fonction pour analyser les projets et détecter les noms dupliqués
function detectDuplicateProjects(projectFiles) {
    log('🔍 Analyse des projets pour détecter les doublons...');

    const projects = {};
    const duplicates = {};

    for (const file of projectFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const projectJson = JSON.parse(content);

            // Obtenir le nom du projet s'il existe, sinon utiliser le chemin du répertoire
            const projectName = projectJson.name || path.basename(path.dirname(file));

            if (!projects[projectName]) {
                projects[projectName] = file;
            } else {
                // C'est un doublon
                if (!duplicates[projectName]) {
                    duplicates[projectName] = [projects[projectName]];
                }
                duplicates[projectName].push(file);
            }
        } catch (error) {
            log(`⚠️ Impossible de lire/analyser ${file}: ${error.message}`);
        }
    }

    // Afficher les doublons trouvés
    const duplicateNames = Object.keys(duplicates);
    if (duplicateNames.length > 0) {
        log(`⚠️ ${duplicateNames.length} projets dupliqués trouvés:`);
        for (const name of duplicateNames) {
            log(`   - ${name}: ${duplicates[name].length} occurrences`);
        }
    } else {
        log('✅ Aucun doublon trouvé.');
    }

    return duplicates;
}

// Fonction pour sauvegarder un fichier
function backupFile(filePath) {
    const relativePath = path.relative(rootDir, filePath);
    const backupPath = path.join(backupDir, relativePath);

    try {
        // Créer le répertoire parent
        const parentDir = path.dirname(backupPath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        // Copier le fichier
        fs.copyFileSync(filePath, backupPath);
        log(`📄 Fichier sauvegardé: ${relativePath}`);
        return true;
    } catch (error) {
        log(`❌ Erreur lors de la sauvegarde de ${filePath}: ${error.message}`);
        return false;
    }
}

// Fonction pour résoudre les doublons
function fixDuplicates(duplicates) {
    log('🛠️ Résolution des doublons...');

    for (const [projectName, files] of Object.entries(duplicates)) {
        // Garder le premier fichier inchangé
        const primaryFile = files[0];
        log(`   [${projectName}] Fichier primaire: ${primaryFile}`);

        // Renommer tous les autres
        for (let i = 1; i < files.length; i++) {
            const duplicateFile = files[i];

            try {
                // Sauvegarder le fichier avant modification
                backupFile(duplicateFile);

                // Lire le contenu actuel
                const content = fs.readFileSync(duplicateFile, 'utf8');
                const projectJson = JSON.parse(content);

                // Générer un nouveau nom
                const newName = `${projectName}_duplicate_${i}`;
                projectJson.name = newName;

                // Écrire les modifications
                fs.writeFileSync(duplicateFile, JSON.stringify(projectJson, null, 2));
                log(`   ✓ Renommé en ${newName}: ${duplicateFile}`);
            } catch (error) {
                log(`   ❌ Échec du renommage de ${duplicateFile}: ${error.message}`);
            }
        }
    }
}

// Fonction pour nettoyer le cache NX
function cleanNxCache() {
    log('🧹 Nettoyage du cache NX...');

    try {
        execSync('npx nx reset', { stdio: 'inherit' });
        log('✅ Cache NX réinitialisé avec succès');
        return true;
    } catch (error) {
        log(`❌ Erreur lors de la réinitialisation du cache NX: ${error.message}`);
        return false;
    }
}

// Fonction principale
function main() {
    console.log('🚀 Démarrage de la résolution des problèmes NX...');

    // Trouver tous les fichiers project.json
    const projectFiles = findProjectFiles();

    if (projectFiles.length === 0) {
        log('❌ Aucun fichier project.json trouvé. Impossible de continuer.');
        return;
    }

    // Détecter les doublons
    const duplicates = detectDuplicateProjects(projectFiles);

    if (Object.keys(duplicates).length > 0) {
        // Résoudre les doublons
        fixDuplicates(duplicates);

        // Nettoyer le cache NX
        cleanNxCache();

        // Vérifier si cela a fonctionné
        try {
            log('🔍 Vérification de la configuration NX...');
            execSync('npx nx show projects', { stdio: 'inherit' });
            log('✅ NX fonctionne correctement maintenant!');
        } catch (error) {
            log('⚠️ Des problèmes persistent avec NX. Veuillez consulter les erreurs ci-dessus.');
        }
    } else {
        log('✓ Aucune action nécessaire');
    }

    console.log('✅ Processus terminé!');
}

// Exécuter le script
main();
