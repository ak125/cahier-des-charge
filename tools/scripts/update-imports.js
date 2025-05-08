#!/usr/bin/env node

/**
 * Script pour mettre à jour automatiquement les chemins d'importation
 * dans les fichiers TypeScript et JavaScript pour refléter la nouvelle structure de dossiers.
 * 
 * Utilisation: node update-imports.js [--dry-run] [--verbose] [--path=path/to/directory]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Options par défaut
let options = {
    dryRun: false,
    verbose: false,
    path: process.cwd(),
    extensions: ['.ts', '.tsx', '.js', '.jsx']
};

// Traiter les arguments de ligne de commande
process.argv.slice(2).forEach(arg => {
    if (arg === '--dry-run') {
        options.dryRun = true;
    } else if (arg === '--verbose') {
        options.verbose = true;
    } else if (arg.startsWith('--path=')) {
        options.path = arg.split('=')[1];
    }
});

// Motifs d'importation à mettre à jour
const importPatterns = [
    {
        // Mettre à jour les importations d'orchestrateurs
        pattern: /from ['"](\.\.\/)+agents\/integration\/orchestrator-bridge['"]/g,
        replacement: "from '@packages/orchestration'"
    },
    {
        // Mettre à jour les importations d'agents
        pattern: /from ['"](\.\.\/)+agents\/([^'"]+)['"]/g,
        replacement: "from '@packages/agents/$2'"
    },
    {
        // Mettre à jour les importations d'utilitaires
        pattern: /from ['"](\.\.\/)+utils\/([^'"]+)['"]/g,
        replacement: "from '@packages/utils/$2'"
    },
    {
        // Mettre à jour les importations de modèles métier
        pattern: /from ['"](\.\.\/)+business\/([^'"]+)['"]/g,
        replacement: "from '@packages/business/$2'"
    },
    {
        // Mettre à jour les importations de composants UI partagés
        pattern: /from ['"](\.\.\/)+components\/([^'"]+)['"]/g,
        replacement: "from '@packages/ui/components/$2'"
    },
    {
        // Mettre à jour les importations BullMQ spécifiques
        pattern: /from ['"](\.\.\/)+orchestrators\/bullmq['"]/g,
        replacement: "from '@packages/orchestration/adapters/bullmq-adapter'"
    },
    {
        // Mettre à jour les importations Temporal spécifiques
        pattern: /from ['"](\.\.\/)+orchestrators\/temporal['"]/g,
        replacement: "from '@packages/orchestration/adapters/temporal-adapter'"
    },
    {
        // Mettre à jour les importations n8n spécifiques
        pattern: /from ['"](\.\.\/)+orchestrators\/n8n['"]/g,
        replacement: "from '@packages/orchestration/adapters/n8n-adapter'"
    }
];

// Rechercher récursivement les fichiers correspondant aux extensions
function findFiles(dir, extensions) {
    let results = [];
    let files;

    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        console.error(`⚠️ Erreur lors de la lecture du répertoire ${dir}:`, err.message);
        return results;
    }

    for (const file of files) {
        const filePath = path.join(dir, file);

        try {
            const stat = fs.statSync(filePath);

            if (stat.isDirectory() && !filePath.includes('node_modules')) {
                results = results.concat(findFiles(filePath, extensions));
            } else if (extensions.includes(path.extname(filePath))) {
                results.push(filePath);
            }
        } catch (err) {
            console.error(`⚠️ Erreur lors de l'accès à ${filePath}:`, err.message);
            continue;
        }
    }

    return results;
}

// Traiter un fichier pour mettre à jour les importations
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let changed = false;

        for (const { pattern, replacement } of importPatterns) {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                changed = true;
            }
        }

        if (changed) {
            if (options.dryRun) {
                console.log(`[DRY RUN] Le fichier ${filePath} serait modifié`);
                if (options.verbose) {
                    console.log('Différences:');
                    // Afficher les différences (similaire à git diff)
                    const tempFile = path.join(path.dirname(filePath), `._temp_${path.basename(filePath)}`);
                    fs.writeFileSync(tempFile, content, 'utf8');
                    try {
                        const diffOutput = execSync(`diff -u "${filePath}" "${tempFile}"`, { encoding: 'utf8' });
                        console.log(diffOutput);
                    } catch (err) {
                        // Le processus diff renvoie un code d'erreur lorsque les fichiers diffèrent, ce n'est pas une vraie erreur
                        console.log(err.stdout);
                    } finally {
                        fs.unlinkSync(tempFile);
                    }
                }
            } else {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Le fichier ${filePath} a été mis à jour`);
            }
        } else if (options.verbose) {
            console.log(`⏭️ Le fichier ${filePath} n'a pas besoin de modifications`);
        }
    } catch (err) {
        console.error(`❌ Erreur lors du traitement du fichier ${filePath}:`, err);
    }
}

// Exécution principale
console.log(`🔍 Recherche de fichiers dans ${options.path} avec les extensions: ${options.extensions.join(', ')}`);
console.log(`Mode: ${options.dryRun ? 'DRY RUN (simulation)' : 'Modification réelle des fichiers'}`);

const files = findFiles(options.path, options.extensions);
console.log(`📂 ${files.length} fichiers trouvés`);

let count = 0;
for (const file of files) {
    processFile(file);
    count++;

    if (count % 100 === 0) {
        console.log(`⚙️ ${count}/${files.length} fichiers traités...`);
    }
}

console.log(`✅ ${count} fichiers traités au total`);

if (options.dryRun) {
    console.log('Exécutez à nouveau sans l\'option --dry-run pour appliquer les modifications');
}