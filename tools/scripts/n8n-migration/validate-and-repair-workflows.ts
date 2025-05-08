/**
 * Script de validation et réparation des fichiers JSON des workflows n8n
 * 
 * Ce script analyse les fichiers de workflow n8n, identifie ceux qui sont mal formés,
 * et tente de les réparer automatiquement.
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Configuration des chemins
const WORKFLOW_PATHS = [
    '/workspaces/cahier-des-charge/packages/business/workflows/*.json',
    '/workspaces/cahier-des-charge/packages/business/config/*.json',
    '/workspaces/cahier-des-charge/packages/business/config/migration/*.json',
    '/workspaces/cahier-des-charge/packages/business/templates/*.json'
];

// Structure minimale d'un workflow n8n valide
const MINIMAL_WORKFLOW_STRUCTURE = {
    "name": "workflow_template",
    "nodes": [],
    "connections": {},
    "active": false,
    "settings": {},
    "version": 1
};

/**
 * Utilise la commande find pour rechercher les fichiers selon un pattern
 * @param pattern Le pattern pour trouver les fichiers
 * @returns Liste des chemins de fichiers trouvés
 */
async function findFilesByPattern(pattern: string): Promise<string[]> {
    try {
        // Extraire le chemin de base et le pattern de fichier
        const lastSlashIndex = pattern.lastIndexOf('/');
        const basePath = pattern.substring(0, lastSlashIndex);
        const filePattern = pattern.substring(lastSlashIndex + 1);

        // Vérifier si le répertoire de base existe
        try {
            await fs.access(basePath);
        } catch (err) {
            return []; // Le répertoire n'existe pas, retourner un tableau vide
        }

        // Utiliser find pour chercher les fichiers
        const { stdout } = await execPromise(`find ${basePath} -name "${filePattern}"`);
        return stdout.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
        console.error('Erreur lors de la recherche de fichiers:', error);
        return [];
    }
}

/**
 * Valide un fichier JSON
 * @param filePath Chemin du fichier à valider
 * @returns Objet avec le statut de validation et contenu JSON si valide
 */
async function validateJsonFile(filePath: string): Promise<{ isValid: boolean; content?: any; error?: Error }> {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const jsonContent = JSON.parse(data);
        return { isValid: true, content: jsonContent };
    } catch (error) {
        return { isValid: false, error: error as Error };
    }
}

/**
 * Tente de réparer un fichier JSON mal formé
 * @param filePath Chemin du fichier à réparer
 * @returns Résultat de la tentative de réparation
 */
async function repairJsonFile(filePath: string): Promise<{ success: boolean; message: string }> {
    try {
        // Lire le contenu du fichier original
        const rawContent = await fs.readFile(filePath, 'utf-8');

        // Sauvegarder une copie du fichier original
        const backupPath = `${filePath}.backup`;
        await fs.writeFile(backupPath, rawContent);

        // Extraire le nom du workflow à partir du nom de fichier
        const workflowName = path.basename(filePath, '.json');

        // Créer un workflow minimal avec le nom extrait
        const minimalWorkflow = {
            ...MINIMAL_WORKFLOW_STRUCTURE,
            name: workflowName
        };

        // Tenter de sauver ce qui peut être sauvé du contenu original
        try {
            // Si le fichier contient au moins une accolade ouvrante, tenter une réparation structurelle
            if (rawContent.includes('{')) {
                // Tentative de réparation basique - compléter les accolades manquantes
                let fixedContent = rawContent;

                // Compter les accolades ouvrantes et fermantes
                const openBraces = (rawContent.match(/{/g) || []).length;
                const closeBraces = (rawContent.match(/}/g) || []).length;

                // Ajouter les accolades manquantes à la fin
                if (openBraces > closeBraces) {
                    fixedContent = fixedContent + '}'.repeat(openBraces - closeBraces);
                }

                // Vérifier si la version corrigée est un JSON valide
                try {
                    JSON.parse(fixedContent);
                    // Si c'est valide, utiliser cette version
                    await fs.writeFile(filePath, fixedContent);
                    return { success: true, message: `Réparation réussie par complétion d'accolades manquantes.` };
                } catch (e) {
                    // Si toujours invalide, utiliser la structure minimale
                    await fs.writeFile(filePath, JSON.stringify(minimalWorkflow, null, 2));
                    return { success: true, message: `Impossible de réparer la structure, workflow remplacé par un template minimal.` };
                }
            } else {
                // Si pas d'accolades, utiliser directement la structure minimale
                await fs.writeFile(filePath, JSON.stringify(minimalWorkflow, null, 2));
                return { success: true, message: `Contenu non récupérable, workflow remplacé par un template minimal.` };
            }
        } catch (innerError) {
            // En cas d'échec des tentatives de réparation, utiliser la structure minimale
            await fs.writeFile(filePath, JSON.stringify(minimalWorkflow, null, 2));
            return { success: true, message: `Erreur pendant la réparation structurelle, workflow remplacé par un template minimal.` };
        }
    } catch (error) {
        return {
            success: false,
            message: `Échec de la réparation: ${(error as Error).message}`
        };
    }
}

/**
 * Fonction principale qui valide et répare tous les workflows
 */
async function validateAndRepairWorkflows(): Promise<void> {
    console.log('🔍 Validation des fichiers de workflow n8n...');

    // Statistiques
    const stats = {
        total: 0,
        valid: 0,
        repaired: 0,
        failed: 0
    };

    // Récupérer tous les fichiers de workflow
    let allWorkflows: string[] = [];
    for (const pattern of WORKFLOW_PATHS) {
        const files = await findFilesByPattern(pattern);
        allWorkflows = [...allWorkflows, ...files];
    }

    stats.total = allWorkflows.length;
    console.log(`📋 ${stats.total} fichiers de workflow trouvés.`);

    // Valider et réparer chaque fichier
    for (const filePath of allWorkflows) {
        const validation = await validateJsonFile(filePath);

        if (validation.isValid) {
            console.log(`✅ ${filePath}: Valide`);
            stats.valid++;
        } else {
            console.log(`⚠️ ${filePath}: Invalide - ${validation.error?.message}`);

            // Tenter de réparer le fichier
            const repairResult = await repairJsonFile(filePath);

            if (repairResult.success) {
                console.log(`🔧 ${filePath}: ${repairResult.message}`);
                stats.repaired++;
            } else {
                console.log(`❌ ${filePath}: ${repairResult.message}`);
                stats.failed++;
            }
        }
    }

    // Afficher le résumé
    console.log('\n📊 Résumé:');
    console.log(`  • Total des fichiers: ${stats.total}`);
    console.log(`  • Fichiers valides: ${stats.valid}`);
    console.log(`  • Fichiers réparés: ${stats.repaired}`);
    console.log(`  • Échecs de réparation: ${stats.failed}`);

    if (stats.repaired > 0) {
        console.log('\n✅ Réparation terminée. Vous pouvez maintenant réexécuter l\'initialisation du tableau de bord.');
    }
}

// Exécuter la fonction principale
validateAndRepairWorkflows()
    .then(() => console.log('Script terminé avec succès.'))
    .catch((error) => console.error('Erreur lors de l\'exécution du script:', error));