#!/usr/bin/env node

/**
 * Script pour analyser les doublons fonctionnels entre agents
 * 
 * Ce script analyse le contenu des fichiers d'agents pour identifier les similitudes fonctionnelles
 * et suggérer des regroupements potentiels. Il génère un rapport détaillé des doublons fonctionnels.
 * 
 * Usage: 
 *   node analyze-agent-functions.js [--verbose]
 * 
 * Options:
 *   --verbose  Afficher des informations détaillées pendant l'exécution
 */

const fs = require('fs');
const path = require('path');

// Configuration
const AGENTS_DIR_PATH = path.resolve(__dirname, '../packages/business/business/agents/agent');
const REPORT_PATH = path.resolve(__dirname, '../cleanup-report/functional-duplicates-report.md');

// Options
const options = {
    verbose: process.argv.includes('--verbose')
};

// Catégories pour le regroupement d'agents
const AGENT_CATEGORIES = {
    'analyzer': ['analyzer', 'analyser', 'analysis'],
    'validator': ['validator', 'validation', 'verifier'],
    'generator': ['generator', 'creator', 'builder'],
    'orchestrator': ['orchestrator', 'coordinator', 'scheduler'],
    'migration': ['migration', 'migrate'],
    'audit': ['audit', 'checker', 'inspector'],
    'seo': ['seo', 'canonical', 'redirect'],
    'sql': ['sql', 'mysql', 'postgresql', 'postgres'],
    'structure': ['structure', 'schema'],
    'php': ['php'],
    'business': ['business'],
    'data': ['data', 'table']
};

// Fonction pour lire le contenu d'un fichier
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
        return '';
    }
}

// Fonction pour extraire les importations et exportations d'un fichier
function extractImportsExports(content) {
    const imports = [];
    const exports = [];

    // Extraire les importations
    const importRegex = /import\s+.*?from\s+['"](.+?)['"];?/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    // Extraire les exportations
    const exportRegex = /export\s+(const|let|var|function|class|type|interface|enum)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[2]);
    }

    // Extraire les exportations par défaut
    const defaultExportRegex = /export\s+default\s+(\w+)/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
        exports.push(`default: ${match[1]}`);
    }

    return { imports, exports };
}

// Fonction pour calculer la similarité entre deux agents basée sur leurs importations et exportations
function calculateSimilarity(agent1, agent2) {
    // Calculer la similarité des importations
    const sharedImports = agent1.imports.filter(imp => agent2.imports.includes(imp));
    const importSimilarity = sharedImports.length / Math.max(1, Math.min(agent1.imports.length, agent2.imports.length));

    // Calculer la similarité des exportations
    const sharedExports = agent1.exports.filter(exp => agent2.exports.includes(exp));
    const exportSimilarity = sharedExports.length / Math.max(1, Math.min(agent1.exports.length, agent2.exports.length));

    // Moyenne pondérée (les exportations sont plus importantes)
    return importSimilarity * 0.4 + exportSimilarity * 0.6;
}

// Fonction pour catégoriser un agent en fonction de son nom
function categorizeAgent(fileName) {
    const categories = [];
    const lowerCaseName = fileName.toLowerCase();

    Object.entries(AGENT_CATEGORIES).forEach(([category, keywords]) => {
        if (keywords.some(keyword => lowerCaseName.includes(keyword))) {
            categories.push(category);
        }
    });

    return categories;
}

// Fonction pour trouver le nom de base sans suffixe hexadécimal ni extension
function getBaseAgentName(fileName) {
    return fileName
        .replace(/\.ts$/, '')
        .replace(/-[0-9a-f]{8}(-[0-9a-f]{8})?$/, '');
}

// Fonction pour analyser les agents et trouver des doublons potentiels
function findPotentialDuplicates(agents) {
    const potentialDuplicates = [];
    const categorizedAgents = {};

    // Regrouper les agents par catégorie
    for (const [fileName, agent] of Object.entries(agents)) {
        const categories = categorizeAgent(fileName);
        const baseName = getBaseAgentName(fileName);

        categories.forEach(category => {
            if (!categorizedAgents[category]) {
                categorizedAgents[category] = [];
            }
            categorizedAgents[category].push({ fileName, baseName, ...agent });
        });
    }

    // Pour chaque catégorie, chercher des agents similaires
    for (const [category, categoryAgents] of Object.entries(categorizedAgents)) {
        if (categoryAgents.length < 2) continue;

        // Comparer chaque paire d'agents dans cette catégorie
        for (let i = 0; i < categoryAgents.length; i++) {
            for (let j = i + 1; j < categoryAgents.length; j++) {
                const agent1 = categoryAgents[i];
                const agent2 = categoryAgents[j];

                // Éviter les doublons déjà traités par le premier script (noms de base identiques)
                if (agent1.baseName === agent2.baseName) {
                    continue;
                }

                const similarity = calculateSimilarity(agent1, agent2);

                // Considérer comme potentiel doublon si similarité > 40%
                if (similarity > 0.4) {
                    potentialDuplicates.push({
                        category,
                        agent1: agent1.fileName,
                        agent2: agent2.fileName,
                        similarity: Math.round(similarity * 100),
                        agent1Imports: agent1.imports,
                        agent2Imports: agent2.imports,
                        agent1Exports: agent1.exports,
                        agent2Exports: agent2.exports
                    });
                }
            }
        }
    }

    // Trier par similarité décroissante
    return potentialDuplicates.sort((a, b) => b.similarity - a.similarity);
}

// Fonction pour générer des recommandations
function generateRecommendations(potentialDuplicates) {
    const recommendations = [];
    const processedAgents = new Set();

    for (const dup of potentialDuplicates) {
        if (!processedAgents.has(dup.agent1) && !processedAgents.has(dup.agent2)) {
            // Décider quel agent garder en fonction du nom (préférer les noms sans suffixe)
            const shouldKeepAgent1 = !dup.agent1.match(/-[0-9a-f]{8}/) && dup.agent2.match(/-[0-9a-f]{8}/);
            const keepAgent = shouldKeepAgent1 ? dup.agent1 : dup.agent2;
            const removeAgent = shouldKeepAgent1 ? dup.agent2 : dup.agent1;

            recommendations.push({
                category: dup.category,
                keep: keepAgent,
                remove: removeAgent,
                similarity: dup.similarity,
                reason: `Similarité fonctionnelle de ${dup.similarity}%`
            });

            processedAgents.add(dup.agent1);
            processedAgents.add(dup.agent2);
        }
    }

    return recommendations;
}

// Fonction pour identifier les doublons hiérarchiques (nom-agent vs nom)
function findHierarchicalDuplicates(agents) {
    const duplicates = [];
    const agentNames = Object.keys(agents);

    for (const fileName of agentNames) {
        const baseName = getBaseAgentName(fileName);

        // Chercher si ce nom existe avec un suffixe "-agent"
        const agentSuffixPattern = `${baseName}-agent`;
        const matchingAgents = agentNames.filter(name =>
            name !== fileName && getBaseAgentName(name).includes(agentSuffixPattern));

        if (matchingAgents.length > 0) {
            duplicates.push({
                base: fileName,
                withSuffix: matchingAgents,
                type: 'hiérarchique',
                recommendation: 'Fusionner en gardant la version principale'
            });
        }
    }

    return duplicates;
}

// Fonction pour créer le rapport
function generateReport(potentialDuplicates, hierarchicalDuplicates, recommendations) {
    const reportContent = `# Rapport d'Analyse des Doublons Fonctionnels entre Agents
Date: ${new Date().toLocaleDateString('fr-FR')}

## Résumé
- Doublons fonctionnels potentiels: ${potentialDuplicates.length}
- Doublons hiérarchiques: ${hierarchicalDuplicates.length}
- Recommandations de consolidation: ${recommendations.length}

## Doublons Fonctionnels Potentiels

${potentialDuplicates.map(dup => `
### ${dup.agent1} et ${dup.agent2} (${dup.category})
- **Similarité**: ${dup.similarity}%
- **Imports communs**: ${dup.agent1Imports.filter(imp => dup.agent2Imports.includes(imp)).join(', ')}
- **Exports**: 
  - ${dup.agent1}: ${dup.agent1Exports.join(', ')}
  - ${dup.agent2}: ${dup.agent2Exports.join(', ')}
`).join('')}

## Doublons Hiérarchiques

${hierarchicalDuplicates.map(dup => `
### ${dup.base} et ${dup.withSuffix.join(', ')}
- **Type**: ${dup.type}
- **Recommandation**: ${dup.recommendation}
`).join('')}

## Recommandations de Consolidation

${recommendations.map(rec => `
- Garder **${rec.keep}** et supprimer **${rec.remove}**
  - Catégorie: ${rec.category}
  - Raison: ${rec.reason}
`).join('')}

## Prochaines étapes

1. Examiner manuellement chaque doublon potentiel pour confirmer la similarité fonctionnelle
2. Fusionner les agents avec des fonctionnalités similaires en consolidant les comportements
3. Mettre à jour les références aux agents supprimés dans le reste du code
4. Créer des interfaces communes pour standardiser le comportement des agents similaires
`;

    fs.writeFileSync(REPORT_PATH, reportContent, 'utf-8');
    console.log(`📄 Rapport généré: ${REPORT_PATH}`);
}

// Fonction principale
async function main() {
    console.log('🔍 Analyse des doublons fonctionnels dans les agents...');

    try {
        // Lister tous les fichiers dans le répertoire des agents
        const agentFiles = fs.readdirSync(AGENTS_DIR_PATH)
            .filter(file => file.endsWith('.ts') && file !== 'index.ts');

        console.log(`📋 ${agentFiles.length} fichiers d'agents trouvés.`);

        // Analyser chaque fichier d'agent
        const agents = {};
        for (const fileName of agentFiles) {
            const filePath = path.join(AGENTS_DIR_PATH, fileName);
            const content = readFileContent(filePath);
            const { imports, exports } = extractImportsExports(content);
            agents[fileName] = { imports, exports, content };

            if (options.verbose) {
                console.log(`Analysé ${fileName}: ${imports.length} imports, ${exports.length} exports`);
            }
        }

        console.log('🔍 Recherche de doublons fonctionnels potentiels...');
        const potentialDuplicates = findPotentialDuplicates(agents);

        console.log('🔍 Recherche de doublons hiérarchiques...');
        const hierarchicalDuplicates = findHierarchicalDuplicates(agents);

        console.log('📝 Génération des recommandations...');
        const recommendations = generateRecommendations(potentialDuplicates);

        console.log(`✅ Analyse terminée`);
        console.log(`- Doublons fonctionnels potentiels: ${potentialDuplicates.length}`);
        console.log(`- Doublons hiérarchiques: ${hierarchicalDuplicates.length}`);
        console.log(`- Recommandations: ${recommendations.length}`);

        // Générer le rapport
        generateReport(potentialDuplicates, hierarchicalDuplicates, recommendations);

        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse des agents:', error);
        return false;
    }
}

// Exécution du script
main().catch(error => {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    process.exit(1);
});