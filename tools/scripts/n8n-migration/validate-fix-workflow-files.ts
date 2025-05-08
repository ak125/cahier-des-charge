#!/usr/bin/env ts-node
/**
 * Script de validation et réparation des fichiers JSON de workflow n8n
 * 
 * Ce script analyse les fichiers de workflow n8n et tente de réparer ceux qui sont malformés
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

/**
 * Tente de valider et réparer un fichier JSON
 * @param filePath Chemin du fichier JSON à valider
 */
async function validateAndFixJsonFile(filePath: string): Promise<boolean> {
    try {
        console.log(`📝 Validation du fichier ${filePath}...`);
        const content = await fs.readFile(filePath, 'utf-8');

        try {
            // Essayer de parser le JSON
            JSON.parse(content);
            console.log(`✅ Le fichier ${filePath} est un JSON valide.`);
            return true;
        } catch (parseError) {
            console.log(`⚠️ Erreur de parsing JSON dans ${filePath}: ${parseError.message}`);

            // Tenter de réparer les erreurs courantes
            let fixedContent = content;

            // Cas 1: JSON incomplet - essayer d'ajouter les accolades manquantes
            if (parseError.message.includes('Unexpected end of JSON input')) {
                let openBraces = (content.match(/{/g) || []).length;
                let closeBraces = (content.match(/}/g) || []).length;

                if (openBraces > closeBraces) {
                    // Ajouter les accolades fermantes manquantes
                    fixedContent = fixedContent + '}'.repeat(openBraces - closeBraces);
                    console.log(`🔧 Tentative de réparation: Ajout de ${openBraces - closeBraces} accolade(s) fermante(s).`);
                }
            }

            // Cas 2: Virgule en trop à la fin d'un objet
            fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1');

            // Tester si la réparation a fonctionné
            try {
                JSON.parse(fixedContent);
                console.log(`✅ Réparation réussie pour ${filePath}`);

                // Créer une sauvegarde avant de remplacer
                await fs.writeFile(`${filePath}.backup`, content);
                console.log(`📄 Sauvegarde créée: ${filePath}.backup`);

                // Écrire le contenu réparé
                await fs.writeFile(filePath, fixedContent);
                console.log(`💾 Fichier mis à jour: ${filePath}`);

                return true;
            } catch (fixError) {
                console.log(`❌ La réparation automatique a échoué pour ${filePath}: ${fixError.message}`);

                // Créer un squelette vide mais valide pour permettre au processus de continuer
                const emptyWorkflow = createEmptyWorkflowTemplate(path.basename(filePath, '.json'));
                await fs.writeFile(`${filePath}.empty`, JSON.stringify(emptyWorkflow, null, 2));
                console.log(`⚠️ Squelette vide créé: ${filePath}.empty (à renommer manuellement si nécessaire)`);

                return false;
            }
        }
    } catch (error) {
        console.error(`❌ Erreur lors du traitement du fichier ${filePath}:`, error);
        return false;
    }
}

/**
 * Crée un squelette vide mais valide de workflow n8n
 */
function createEmptyWorkflowTemplate(name: string) {
    return {
        "id": `auto-${Date.now()}`,
        "name": name,
        "nodes": [],
        "connections": {},
        "active": false,
        "settings": {},
        "version": 1,
        "staticData": null
    };
}

/**
 * Fonction principale
 */
async function main() {
    console.log('🔍 Recherche des fichiers workflow n8n...');

    // Rechercher tous les fichiers JSON potentiels de workflow n8n
    const searchPaths = [
        'packages/business/workflows/**/*.json',
        'packages/business/config/**/*.json',
        'packages/business/templates/**/*.json',
    ];

    let allFiles: string[] = [];

    for (const searchPath of searchPaths) {
        const files = await glob(searchPath, { absolute: true });
        allFiles = [...allFiles, ...files];
    }

    console.log(`🔎 ${allFiles.length} fichiers JSON trouvés.`);

    // Traiter chaque fichier
    let fixed = 0;
    let failed = 0;

    for (const file of allFiles) {
        const result = await validateAndFixJsonFile(file);
        if (result) {
            fixed++;
        } else {
            failed++;
        }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`  • Fichiers traités: ${allFiles.length}`);
    console.log(`  • Fichiers valides/réparés: ${fixed}`);
    console.log(`  • Fichiers avec erreurs persistantes: ${failed}`);

    if (failed > 0) {
        console.log(`\n⚠️  Attention: ${failed} fichiers n'ont pas pu être réparés automatiquement.`);
        console.log(`   Vous devrez les examiner et les réparer manuellement, ou utiliser les versions .empty générées.`);
    }
}

// Exécution
main().catch(error => {
    console.error('Erreur inattendue:', error);
    process.exit(1);
});