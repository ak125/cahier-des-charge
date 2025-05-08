/**
 * Similar Files Analyzer
 * 
 * Ce script analyse les fichiers similaires mais non identiques dans le projet
 * et génère un rapport avec des recommandations pour leur consolidation.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const { exec } = require('child_process');
const execPromise = util.promisify(exec);

// Paramètres de configuration
const WORKSPACE_ROOT = '/workspaces/cahier-des-charge';
const REPORT_DIR = path.join(WORKSPACE_ROOT, 'cleanup-report');
const DEEP_REPORT_PATH = path.join(REPORT_DIR, 'deep-deduplication-report.md');
const SIMILARITY_THRESHOLD = 0.7; // 70% de similarité minimum pour être considéré comme similaire
const OUTPUT_PLAN_DIR = path.join(WORKSPACE_ROOT, 'cleanup-scripts/deduplication-plan');
const OUTPUT_PLAN_PATH = path.join(OUTPUT_PLAN_DIR, 'similar-files-plan.json');
const SIMILARITY_REPORT_PATH = path.join(REPORT_DIR, 'similar-files-report.md');

// Fonction pour extraire les groupes de fichiers similaires du rapport
async function extractSimilarFilesFromReport() {
    try {
        const reportContent = await readFile(DEEP_REPORT_PATH, 'utf8');

        // Rechercher la section des fichiers similaires dans le rapport
        const similarFilesSection = reportContent.split('## Fichiers similaires')[1]?.split('##')[0];

        if (!similarFilesSection) {
            console.error('Section des fichiers similaires non trouvée dans le rapport. Recherche d\'une section alternative...');

            // Essayer une orthographe alternative
            const altSimilarFilesSection = reportContent.split('## Fichiers Similaires')[1]?.split('##')[0];

            if (!altSimilarFilesSection) {
                console.error('Aucune section de fichiers similaires trouvée dans le rapport');
                return [];
            }

            console.log('Section de fichiers similaires trouvée avec orthographe alternative.');
            return parseGroupsFromSection(altSimilarFilesSection);
        }

        return parseGroupsFromSection(similarFilesSection);
    } catch (error) {
        console.error('Erreur lors de l\'extraction des fichiers similaires:', error);
        return [];
    }
}

// Fonction pour analyser la section des fichiers similaires et extraire les groupes
function parseGroupsFromSection(section) {
    const similarityGroups = [];
    let currentGroup = null;
    let parsingFiles = false;

    // Analyser le contenu ligne par ligne
    const lines = section.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Ignorer les lignes vides
        if (!line) continue;

        // Détecter un nouveau groupe (format: ### Groupe 'nom' (N fichiers))
        const groupMatch = line.match(/^### Groupe ['"](.*?)['"] \((\d+) fichiers\)/);
        if (groupMatch) {
            // Si on avait un groupe précédent, l'ajouter à la liste
            if (currentGroup) {
                similarityGroups.push(currentGroup);
            }

            // Créer un nouveau groupe
            currentGroup = {
                name: groupMatch[1],
                description: '',
                files: [],
                similarity: 0
            };

            parsingFiles = false;
            continue;
        }

        // Si nous n'avons pas encore de groupe actuel, passer à la ligne suivante
        if (!currentGroup) continue;

        // Détecter le début de la liste des fichiers
        if (line.startsWith('- `') || line.startsWith('- /')) {
            parsingFiles = true;

            // Extraire le chemin du fichier (entre backticks ou directement)
            const filePath = line.match(/[`']([^`']+)[`']/) || line.match(/- (\/[^\s]+)/);
            if (filePath && filePath[1]) {
                // Remplacer le préfixe du workspace si nécessaire
                let cleanPath = filePath[1];
                if (cleanPath.startsWith(WORKSPACE_ROOT)) {
                    cleanPath = cleanPath.substring(WORKSPACE_ROOT.length);
                }
                if (cleanPath.startsWith('/')) {
                    cleanPath = cleanPath.substring(1);
                }

                currentGroup.files.push({
                    path: cleanPath,
                    lines: 0,
                    size: ''
                });
            }
            continue;
        }

        // Si on commence à voir les similarités
        if (line.startsWith('Similarités :')) {
            parsingFiles = false;
            continue;
        }

        // Analyser les pourcentages de similarité
        if (!parsingFiles && line.includes('%')) {
            const similarityMatch = line.match(/(\d+)%/);
            if (similarityMatch) {
                // Si on trouve un pourcentage de similarité plus élevé, le mettre à jour
                const similarityValue = parseInt(similarityMatch[1], 10) / 100;
                if (similarityValue > currentGroup.similarity) {
                    currentGroup.similarity = similarityValue;
                }
            }
            continue;
        }

        // Si on n'est pas en train de parser les fichiers et ce n'est pas une ligne spéciale,
        // on l'ajoute à la description du groupe
        if (!parsingFiles && !line.startsWith('-') && !line.includes('Similarités :')) {
            currentGroup.description += line + ' ';
        }
    }

    // Ajouter le dernier groupe s'il existe
    if (currentGroup) {
        similarityGroups.push(currentGroup);
    }

    // Filtrer les groupes selon le seuil de similarité et contenant au moins 2 fichiers
    return similarityGroups.filter(group =>
        group.similarity >= SIMILARITY_THRESHOLD &&
        group.files.length > 1
    );
}

// Fonction pour analyser le contenu des fichiers et déterminer la meilleure stratégie de consolidation
async function analyzeSimilarFiles(similarityGroups) {
    const consolidationPlans = [];

    for (const group of similarityGroups) {
        const consolidationPlan = {
            groupName: group.name,
            description: group.description,
            similarity: group.similarity,
            strategy: 'merge', // Par défaut: merge, alternatives: keep-one, refactor
            keepFile: null,
            files: group.files,
            notes: '',
            recommendations: []
        };

        try {
            // Vérifier si les fichiers existent toujours (ils n'ont pas été supprimés dans la phase 1)
            const existingFiles = [];
            for (const file of group.files) {
                const filePath = path.join(WORKSPACE_ROOT, file.path);
                if (fs.existsSync(filePath)) {
                    try {
                        const content = await readFile(filePath, 'utf8');
                        const lines = content.split('\n').length;
                        existingFiles.push({
                            ...file,
                            lines,
                            content
                        });
                    } catch (err) {
                        console.warn(`Avertissement: Impossible de lire le fichier ${filePath}: ${err.message}`);
                    }
                }
            }

            if (existingFiles.length < 2) {
                consolidationPlan.strategy = 'skip';
                consolidationPlan.notes = 'Moins de 2 fichiers existent encore dans ce groupe après la phase 1';
                consolidationPlans.push(consolidationPlan);
                continue;
            }

            // Analyse du contenu des fichiers pour déterminer la stratégie
            const contentAnalysis = analyzeFilesContent(existingFiles);

            // Déterminer la meilleure stratégie en fonction de l'analyse
            if (contentAnalysis.identicalFunctionality) {
                // Si les fichiers ont des fonctionnalités identiques
                consolidationPlan.strategy = 'keep-one';

                // Choisir le fichier à conserver (le plus complet/récent)
                const mostCompleteFile = existingFiles.reduce((best, current) =>
                    current.content.length > best.content.length ? current : best
                    , existingFiles[0]);

                consolidationPlan.keepFile = mostCompleteFile.path;
                consolidationPlan.notes = 'Les fichiers ont des fonctionnalités identiques. Conservation du fichier le plus complet.';
            }
            else if (contentAnalysis.canBeMerged) {
                // Si les fichiers peuvent être fusionnés
                consolidationPlan.strategy = 'merge';

                // Choisir le fichier cible pour la fusion (généralement celui qui a le plus de contenu)
                consolidationPlan.keepFile = existingFiles.reduce((best, current) =>
                    current.content.length > best.content.length ? current : best
                    , existingFiles[0]).path;

                consolidationPlan.notes = 'Les fichiers ont des parties communes et peuvent être fusionnés.';
            }
            else {
                // Si les fichiers sont trop différents pour une fusion automatique
                consolidationPlan.strategy = 'refactor';
                consolidationPlan.notes = 'Les fichiers sont trop différents pour une fusion automatique. Refactorisation manuelle recommandée.';
            }

            // Ajouter des recommandations spécifiques en fonction de l'analyse
            consolidationPlan.recommendations = contentAnalysis.recommendations;

            consolidationPlans.push(consolidationPlan);

        } catch (error) {
            console.error(`Erreur lors de l'analyse du groupe ${group.name}:`, error);
            consolidationPlan.strategy = 'error';
            consolidationPlan.notes = `Erreur lors de l'analyse: ${error.message}`;
            consolidationPlans.push(consolidationPlan);
        }
    }

    return consolidationPlans;
}

// Fonction pour analyser le contenu des fichiers
function analyzeFilesContent(files) {
    const analysis = {
        identicalFunctionality: false,
        canBeMerged: false,
        recommendations: []
    };

    // Si nous avons moins de 2 fichiers, il n'y a rien à comparer
    if (files.length < 2) {
        return analysis;
    }

    // Compter les fonctions dans chaque fichier pour voir si elles sont similaires
    const functionCounts = files.map(file => {
        const functions = extractFunctions(file.content);
        return {
            path: file.path,
            functions: functions
        };
    });

    // Vérifier les fonctions communes entre les fichiers
    const commonFunctions = findCommonFunctions(functionCounts);

    // Si tous les fichiers ont les mêmes fonctions principales
    if (commonFunctions.length > 0 &&
        functionCounts.every(file =>
            commonFunctions.length / file.functions.length > 0.7)) {
        analysis.identicalFunctionality = true;
        analysis.canBeMerged = true;
        analysis.recommendations.push(`Les fichiers partagent ${commonFunctions.length} fonctions communes.`);
    }
    // Si certaines fonctions sont communes mais pas toutes
    else if (commonFunctions.length > 0) {
        analysis.canBeMerged = true;
        analysis.recommendations.push(`Les fichiers partagent ${commonFunctions.length} fonctions communes mais ont aussi des différences significatives.`);

        // Identification des fonctions uniques dans chaque fichier
        functionCounts.forEach(file => {
            const uniqueFunctions = file.functions.filter(
                fn => !commonFunctions.some(common => common.name === fn.name)
            );

            if (uniqueFunctions.length > 0) {
                analysis.recommendations.push(`${file.path} contient ${uniqueFunctions.length} fonctions uniques: ${uniqueFunctions.map(f => f.name).join(', ')}`);
            }
        });
    }
    // Si les fichiers sont trop différents
    else {
        analysis.canBeMerged = false;
        analysis.recommendations.push('Les fichiers semblent avoir des fonctionnalités différentes.');
    }

    return analysis;
}

// Fonction pour extraire les fonctions et méthodes d'un fichier
function extractFunctions(content) {
    const functions = [];

    // Recherche simple des déclarations de fonctions (à améliorer pour des cas plus complexes)

    // Fonctions traditionnelles: function name() {}
    const traditionalFunctions = content.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g) || [];
    traditionalFunctions.forEach(fn => {
        const name = fn.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)[1];
        functions.push({ type: 'function', name });
    });

    // Méthodes de classe: methodName() {}
    const classMethods = content.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*[^)]*\)\s*{/g) || [];
    classMethods.forEach(method => {
        const nameMatch = method.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
        if (nameMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(nameMatch[1])) {
            functions.push({ type: 'method', name: nameMatch[1] });
        }
    });

    // Arrow functions: const name = () => {}
    const arrowFunctions = content.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g) || [];
    arrowFunctions.forEach(fn => {
        const nameMatch = fn.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (nameMatch) {
            functions.push({ type: 'arrow', name: nameMatch[1] });
        }
    });

    return functions;
}

// Fonction pour trouver les fonctions communes entre les fichiers
function findCommonFunctions(functionCounts) {
    if (functionCounts.length < 2) return [];

    // Commencer avec toutes les fonctions du premier fichier
    let commonFunctions = [...functionCounts[0].functions];

    // Comparer avec les fonctions de chaque autre fichier
    for (let i = 1; i < functionCounts.length; i++) {
        commonFunctions = commonFunctions.filter(fn =>
            functionCounts[i].functions.some(otherFn => otherFn.name === fn.name)
        );
    }

    return commonFunctions;
}

// Fonction pour générer un rapport de consolidation et un plan d'action
async function generateConsolidationReport(consolidationPlans) {
    // Formater le rapport Markdown
    let report = `# Rapport de fichiers similaires et plan de consolidation\n\n`;
    report += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    report += `## Résumé\n\n`;

    // Statistiques de résumé
    const totalGroups = consolidationPlans.length;
    const mergableGroups = consolidationPlans.filter(p => p.strategy === 'merge').length;
    const keepOneGroups = consolidationPlans.filter(p => p.strategy === 'keep-one').length;
    const refactorGroups = consolidationPlans.filter(p => p.strategy === 'refactor').length;

    report += `- **Total des groupes de fichiers similaires:** ${totalGroups}\n`;
    report += `- **Groupes pouvant être fusionnés:** ${mergableGroups}\n`;
    report += `- **Groupes où un seul fichier peut être conservé:** ${keepOneGroups}\n`;
    report += `- **Groupes nécessitant une refactorisation manuelle:** ${refactorGroups}\n\n`;

    report += `## Plans de consolidation par groupe\n\n`;

    // Détails pour chaque groupe
    for (const plan of consolidationPlans) {
        report += `### ${plan.groupName}\n\n`;
        report += `${plan.description}\n\n`;
        report += `- **Similarité:** ${Math.round(plan.similarity * 100)}%\n`;
        report += `- **Stratégie recommandée:** ${plan.strategy}\n`;

        if (plan.keepFile) {
            report += `- **Fichier à conserver:** \`${plan.keepFile}\`\n`;
        }

        report += `- **Notes:** ${plan.notes}\n\n`;

        // Liste des fichiers dans ce groupe
        report += `#### Fichiers dans ce groupe:\n\n`;
        report += `| Fichier | Lignes |\n`;
        report += `|---------|--------|\n`;

        for (const file of plan.files) {
            report += `| ${file.path} | ${file.lines} |\n`;
        }

        // Recommandations spécifiques
        if (plan.recommendations.length > 0) {
            report += `\n#### Recommandations:\n\n`;
            for (const recommendation of plan.recommendations) {
                report += `- ${recommendation}\n`;
            }
        }

        report += `\n---\n\n`;
    }

    // Écrire le rapport dans un fichier
    await writeFile(SIMILARITY_REPORT_PATH, report, 'utf8');
    console.log(`Rapport de consolidation généré: ${SIMILARITY_REPORT_PATH}`);

    // Générer également un plan d'action au format JSON
    const actionPlan = consolidationPlans.map(plan => ({
        groupName: plan.groupName,
        strategy: plan.strategy,
        keepFile: plan.keepFile,
        filesToProcess: plan.files.map(f => f.path).filter(path => path !== plan.keepFile),
        similarity: plan.similarity,
        recommendations: plan.recommendations
    }));

    // S'assurer que le répertoire existe
    if (!fs.existsSync(OUTPUT_PLAN_DIR)) {
        fs.mkdirSync(OUTPUT_PLAN_DIR, { recursive: true });
    }

    await writeFile(OUTPUT_PLAN_PATH, JSON.stringify(actionPlan, null, 2), 'utf8');
    console.log(`Plan d'action généré: ${OUTPUT_PLAN_PATH}`);

    return { report, actionPlan };
}

// Fonction principale
async function main() {
    try {
        console.log('Démarrage de l\'analyse des fichiers similaires...');

        // Vérifier si le répertoire de rapport existe
        if (!fs.existsSync(REPORT_DIR)) {
            fs.mkdirSync(REPORT_DIR, { recursive: true });
        }

        // Extraire les groupes de fichiers similaires du rapport
        console.log('Extraction des groupes de fichiers similaires du rapport...');
        const similarityGroups = await extractSimilarFilesFromReport();
        console.log(`${similarityGroups.length} groupes de fichiers similaires trouvés.`);

        if (similarityGroups.length === 0) {
            console.log('Aucun groupe de fichiers similaires trouvé. Vérifiez le format du rapport ou le contenu du fichier.');
            return;
        }

        // Analyser les fichiers similaires
        console.log('Analyse du contenu des fichiers similaires...');
        const consolidationPlans = await analyzeSimilarFiles(similarityGroups);

        // Générer le rapport et le plan d'action
        console.log('Génération du rapport et du plan d\'action...');
        await generateConsolidationReport(consolidationPlans);

        console.log('Analyse des fichiers similaires terminée avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'analyse des fichiers similaires:', error);
        process.exit(1);
    }
}

// Exécuter la fonction principale
main();