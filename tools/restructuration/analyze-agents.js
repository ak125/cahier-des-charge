#!/usr/bin/env node

/**
 * Script d'analyse des agents existants pour classification
 * dans l'architecture à trois couches.
 * 
 * Ce script parcourt les dossiers contenant des agents,
 * analyse leur structure et leur code, et propose une 
 * classification selon les trois couches:
 * - Orchestration
 * - Coordination
 * - Métier (Business)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Dossiers à analyser
const AGENT_DIRECTORIES = [
    'agents',
    'packages/agents',
    'packages/mcp-agents',
    'packages/migrated-agents',
    'packages/business',
    'packages/orchestration'
];

// Mots-clés pour la classification
const KEYWORDS = {
    orchestration: ['orchestrate', 'workflow', 'pipeline', 'schedule', 'monitor', 'orchestration', 'orchestrator'],
    coordination: ['coordinate', 'adapter', 'bridge', 'registry', 'transform', 'convert', 'format'],
    business: ['analyze', 'generate', 'validate', 'parse', 'process', 'business']
};

// Structure pour stocker les résultats
const results = {
    orchestration: [],
    coordination: [],
    business: [],
    unclassified: []
};

async function findAgents() {
    for (const dir of AGENT_DIRECTORIES) {
        const fullPath = path.join(projectRoot, dir);

        try {
            if (fs.existsSync(fullPath)) {
                console.log(`Analyse du dossier: ${dir}`);
                await scanDirectory(fullPath);
            } else {
                console.log(`Le dossier ${dir} n'existe pas, ignoré.`);
            }
        } catch (err) {
            console.error(`Erreur lors de l'analyse de ${dir}:`, err);
        }
    }
}

async function scanDirectory(directory) {
    try {
        const { stdout } = await execPromise(`find ${directory} -type f -name "*.ts" -o -name "*.js" | grep -v "test" | grep -v "spec" || true`);

        const files = stdout.trim().split('\n').filter(Boolean);

        for (const file of files) {
            await classifyAgent(file);
        }
    } catch (err) {
        console.error(`Erreur lors du scan du répertoire ${directory}:`, err);
    }
}

async function classifyAgent(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Déterminer la catégorie en fonction des mots-clés dans le contenu
        let maxScore = 0;
        let category = 'unclassified';

        for (const [cat, keywords] of Object.entries(KEYWORDS)) {
            const score = keywords.reduce((acc, keyword) => {
                const regex = new RegExp(keyword, 'gi');
                const matches = (content.match(regex) || []).length;
                return acc + matches;
            }, 0);

            if (score > maxScore) {
                maxScore = score;
                category = cat;
            }
        }

        // Vérifier si le fichier semble être un agent
        const isAgent = content.includes('class') &&
            (content.includes('Agent') || filePath.includes('agent'));

        if (isAgent) {
            // Extraire le nom de la classe à partir du contenu
            const classMatch = content.match(/class\s+(\w+)/);
            const className = classMatch ? classMatch[1] : path.basename(filePath, path.extname(filePath));

            results[category].push({
                path: filePath,
                name: className,
                score: maxScore
            });
        }
    } catch (err) {
        console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, err);
    }
}

async function generateReport() {
    console.log('\n--- RAPPORT DE CLASSIFICATION DES AGENTS ---\n');

    for (const [category, agents] of Object.entries(results)) {
        console.log(`\n## ${category.toUpperCase()} (${agents.length} agents)\n`);

        if (agents.length > 0) {
            agents.sort((a, b) => b.score - a.score);

            for (const agent of agents) {
                console.log(`- ${agent.name} (${agent.path}) [Score: ${agent.score}]`);
            }
        } else {
            console.log('Aucun agent trouvé dans cette catégorie.');
        }
    }

    // Générer un rapport en markdown
    const reportPath = path.join(projectRoot, 'tools/restructuration/analysis/agent-classification.md');
    let report = '# Classification des agents pour l\'architecture à trois couches\n\n';
    report += `*Généré le ${new Date().toISOString()}*\n\n`;

    for (const [category, agents] of Object.entries(results)) {
        report += `## ${category.charAt(0).toUpperCase() + category.slice(1)} (${agents.length} agents)\n\n`;

        if (agents.length > 0) {
            report += '| Nom de l\'agent | Chemin du fichier | Score |\n';
            report += '|---------------|-----------------|-------|\n';

            for (const agent of agents) {
                report += `| ${agent.name} | ${agent.path} | ${agent.score} |\n`;
            }

            report += '\n';
        } else {
            report += 'Aucun agent trouvé dans cette catégorie.\n\n';
        }
    }

    fs.writeFileSync(reportPath, report);
    console.log(`\nRapport de classification généré: ${reportPath}`);
}

// Exécution principale
(async () => {
    try {
        await findAgents();
        await generateReport();
    } catch (err) {
        console.error('Erreur lors de l\'exécution du script:', err);
    }
})();