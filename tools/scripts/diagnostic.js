/**
 * Script de diagnostic pour le pipeline de migration
 * Ce script sert de point d'entrée pour exécuter différentes vérifications diagnostiques
 */

console.log("Démarrage du diagnostic du pipeline de migration...");

// Importe les modules nécessaires
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Chemin de base pour les scripts
const scriptsPath = path.join(__dirname, 'scripts');

// Liste des scripts de vérification à exécuter
const checksToRun = [
    'check-typescript-errors.js',
    'check-unused-dependencies.js',
    'check-mismatches.js',
    'analyze-dependencies.sh'
];

// Fonction pour exécuter un script
async function runScript(scriptName) {
    console.log(`\n📋 Exécution de ${scriptName}...`);

    const scriptPath = path.join(scriptsPath, scriptName);

    // Vérifie si le script existe
    if (!fs.existsSync(scriptPath)) {
        console.log(`⚠️ Script ${scriptName} non trouvé à ${scriptPath}`);
        return;
    }

    // Détermine la commande à exécuter selon l'extension du fichier
    const isShellScript = scriptName.endsWith('.sh');
    const command = isShellScript ? 'bash' : 'node';
    const args = isShellScript ? [scriptPath] : [scriptPath];

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit' });

        child.on('close', (code) => {
            if (code !== 0) {
                console.log(`⚠️ ${scriptName} s'est terminé avec le code ${code}`);
            } else {
                console.log(`✅ ${scriptName} s'est terminé avec succès`);
            }
            resolve();
        });

        child.on('error', (err) => {
            console.error(`❌ Erreur lors de l'exécution de ${scriptName}:`, err);
            reject(err);
        });
    });
}

// Fonction principale
async function main() {
    try {
        console.log("🔍 Diagnostic du pipeline en cours...");

        // Exécute séquentiellement chaque script de vérification
        for (const check of checksToRun) {
            await runScript(check);
        }

        console.log("\n✨ Diagnostic du pipeline terminé");

        // Affiche un message final
        console.log("\n📊 Résumé du diagnostic :");
        console.log("Pour plus de détails sur les problèmes détectés, consultez les logs ci-dessus");
        console.log("Pour résoudre les problèmes courants, consultez la documentation dans /docs/");

    } catch (error) {
        console.error("❌ Erreur lors du diagnostic :", error);
        process.exit(1);
    }
}

// Exécute la fonction principale
main();