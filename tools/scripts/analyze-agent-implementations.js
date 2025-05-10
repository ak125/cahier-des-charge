#!/usr/bin/env node

/**
 * Script pour analyser les implémentations d'agents dans le projet
 * et identifier les duplications potentielles entre différents dossiers.
 * Ce script aide à cartographier les agents selon l'architecture en trois couches
 * et à identifier les candidats pour la consolidation.
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

// Dossiers à analyser pour les implémentations d'agents
const sourceFolders = [
    'packages/business',
    'packages/orchestration',
    'packages/core',
    'packages/mcp-agents',
    'packages/mcp-business',
    'packages/mcp-orchestrator',
    'packages/migrated-agents',
    'agents'
];

// Structure pour stocker les résultats de l'analyse
const results = {
    totalAgents: 0,
    agentsByType: {
        orchestration: [],
        coordination: [],
        business: [],
        unknown: []
    },
    potentialDuplicates: [],
    implementedInterfaces: {},
    folderStats: {}
};

/**
 * Recherche tous les fichiers d'agents dans les dossiers spécifiés
 */
async function findAgentImplementations() {
    console.log('Recherche des implémentations d\'agents...');

    for (const folder of sourceFolders) {
        const fullPath = path.join(projectRoot, folder);

        if (!fs.existsSync(fullPath)) {
            console.log(`Dossier non trouvé (ignoré): ${folder}`);
            continue;
        }

        try {
            // Rechercher les fichiers qui contiennent "Agent" dans leur nom ou dans leur contenu
            results.folderStats[folder] = { total: 0, byLayer: { orchestration: 0, coordination: 0, business: 0, unknown: 0 } };

            const { stdout: fileList } = await execPromise(
                `find ${fullPath} -type f -name "*agent*.ts" -o -name "*Agent*.ts" | grep -v ".spec.ts" || echo ""`
            );

            const files = fileList.trim().split('\n').filter(Boolean);

            for (const filePath of files) {
                await analyzeAgentFile(filePath, folder);
            }

            console.log(`${folder}: ${results.folderStats[folder].total} agents trouvés`);
        } catch (err) {
            console.error(`Erreur lors de l'analyse du dossier ${folder}:`, err);
        }
    }

    console.log(`\nAnalyse terminée. ${results.totalAgents} agents trouvés au total.`);
    await findPotentialDuplicates();
    generateReport();
}

/**
 * Analyse un fichier d'agent pour déterminer son type et ses caractéristiques
 */
async function analyzeAgentFile(filePath, sourceFolder) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extraire le nom de la classe
        const classNameMatch = content.match(/class\\s+(\\w+)/);
        const className = classNameMatch ? classNameMatch[1] : path.basename(filePath, path.extname(filePath));

        // Déterminer la couche (orchestration, coordination, business)
        let layer = 'unknown';

        if (content.includes('implements OrchestrationAgent') ||
            content.includes('implements OrchestratorAgent') ||
            content.includes('implements MonitorAgent') ||
            content.includes('implements SchedulerAgent') ||
            content.includes('extends AbstractOrchestrationAgent') ||
            filePath.includes('orchestration') ||
            className.includes('Orchestrat')) {
            layer = 'orchestration';
        }
        else if (content.includes('implements CoordinationAgent') ||
            content.includes('implements AdapterAgent') ||
            content.includes('implements BridgeAgent') ||
            content.includes('implements RegistryAgent') ||
            content.includes('extends AbstractCoordinationAgent') ||
            filePath.includes('coordination') ||
            className.includes('Coordination') ||
            className.includes('Bridge') ||
            className.includes('Adapter')) {
            layer = 'coordination';
        }
        else if (content.includes('implements BusinessAgent') ||
            content.includes('implements AnalyzerAgent') ||
            content.includes('implements GeneratorAgent') ||
            content.includes('implements ValidatorAgent') ||
            content.includes('implements ParserAgent') ||
            content.includes('extends AbstractBusinessAgent') ||
            filePath.includes('business') ||
            className.includes('Analyzer') ||
            className.includes('Generator') ||
            className.includes('Validator') ||
            className.includes('Parser')) {
            layer = 'business';
        }

        // Extraire l'interface implémentée si disponible
        const implementsMatch = content.match(/implements\\s+(\\w+)/);
        const implementedInterface = implementsMatch ? implementsMatch[1] : null;

        if (implementedInterface) {
            if (!results.implementedInterfaces[implementedInterface]) {
                results.implementedInterfaces[implementedInterface] = [];
            }
            results.implementedInterfaces[implementedInterface].push({ filePath, className });
        }

        // Extraire les fonctionnalités principales (méthodes)
        const methodMatches = content.match(/\\s+(\\w+)\\s*\\([^)]*\\)\\s*{/g) || [];
        const methods = methodMatches.map(m => m.trim().split('(')[0].trim());

        // Extraire les imports
        const importMatches = content.match(/import.*?from\\s+['"]([^'"]+)['"]/g) || [];
        const imports = importMatches.map(imp => {
            const fromMatch = imp.match(/from\\s+['"]([^'"]+)['"]/);
            return fromMatch ? fromMatch[1] : imp;
        });

        // Extraire une signature de fonctionnalité (pour la détection de duplications)
        let functionalSignature = methods.slice(0, 5).join(',');

        // Ajouter l'agent aux résultats
        const agentInfo = {
            className,
            filePath,
            sourceFolder,
            layer,
            implementedInterface,
            methods,
            imports,
            functionalSignature,
            fileSize: content.length,
            lastModified: fs.statSync(filePath).mtime
        };

        results.agentsByType[layer].push(agentInfo);
        results.totalAgents++;

        // Mettre à jour les statistiques par dossier
        results.folderStats[sourceFolder].total++;
        results.folderStats[sourceFolder].byLayer[layer]++;
    } catch (err) {
        console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, err);
    }
}

/**
 * Recherche les duplications potentielles entre agents
 */
async function findPotentialDuplicates() {
    console.log('\nRecherche des duplications potentielles...');

    // Rechercher des duplications par nom de classe similaire
    const classNames = {};

    for (const layer of ['orchestration', 'coordination', 'business', 'unknown']) {
        for (const agent of results.agentsByType[layer]) {
            const normalizedName = agent.className
                .replace(/Agent$/, '')
                .replace(/Impl$/, '')
                .replace(/V[0-9]+$/, '')
                .toLowerCase();

            if (!classNames[normalizedName]) {
                classNames[normalizedName] = [];
            }
            classNames[normalizedName].push(agent);
        }
    }

    // Identifier les noms normalisés avec plusieurs implémentations
    for (const [normalizedName, agents] of Object.entries(classNames)) {
        if (agents.length > 1) {
            results.potentialDuplicates.push({
                type: 'name-based',
                normalizedName,
                count: agents.length,
                agents
            });
        }
    }

    // Rechercher des duplications par signature fonctionnelle similaire
    const signatures = {};

    for (const layer of ['orchestration', 'coordination', 'business', 'unknown']) {
        for (const agent of results.agentsByType[layer]) {
            if (agent.functionalSignature && agent.methods.length > 1) {
                if (!signatures[agent.functionalSignature]) {
                    signatures[agent.functionalSignature] = [];
                }
                signatures[agent.functionalSignature].push(agent);
            }
        }
    }

    // Identifier les signatures fonctionnelles avec plusieurs implémentations
    for (const [signature, agents] of Object.entries(signatures)) {
        if (agents.length > 1 && signature.includes(',')) {  // Au moins deux méthodes en commun
            results.potentialDuplicates.push({
                type: 'function-based',
                signature,
                count: agents.length,
                agents
            });
        }
    }

    console.log(`${results.potentialDuplicates.length} groupes de duplications potentielles identifiés.`);
}

/**
 * Génère un rapport d'analyse
 */
function generateReport() {
    console.log('\n--- RAPPORT D\'ANALYSE DES AGENTS ---\n');

    console.log(`Nombre total d'agents: ${results.totalAgents}`);
    console.log(`- Agents d'orchestration: ${results.agentsByType.orchestration.length}`);
    console.log(`- Agents de coordination: ${results.agentsByType.coordination.length}`);
    console.log(`- Agents métier (business): ${results.agentsByType.business.length}`);
    console.log(`- Agents non classifiés: ${results.agentsByType.unknown.length}`);

    console.log('\nStatistiques par dossier:');
    for (const [folder, stats] of Object.entries(results.folderStats)) {
        console.log(`\n${folder}: ${stats.total} agents`);
        console.log(`  - Orchestration: ${stats.byLayer.orchestration}`);
        console.log(`  - Coordination: ${stats.byLayer.coordination}`);
        console.log(`  - Business: ${stats.byLayer.business}`);
        console.log(`  - Non classifiés: ${stats.byLayer.unknown}`);
    }

    console.log('\nInterfaces implémentées:');
    for (const [interfaceName, implementations] of Object.entries(results.implementedInterfaces)) {
        console.log(`\n${interfaceName}: ${implementations.length} implémentations`);
        for (const impl of implementations) {
            console.log(`  - ${impl.className} (${impl.filePath})`);
        }
    }

    // Générer un fichier de rapport
    const reportPath = path.join(projectRoot, 'reports/agent-implementation-analysis.md');
    let report = '# Analyse des implémentations d\'agents\n\n';
    report += `*Généré le ${new Date().toISOString()}*\n\n`;

    report += '## Résumé\n\n';
    report += `- **Nombre total d'agents**: ${results.totalAgents}\n`;
    report += `- **Agents d'orchestration**: ${results.agentsByType.orchestration.length}\n`;
    report += `- **Agents de coordination**: ${results.agentsByType.coordination.length}\n`;
    report += `- **Agents métier (business)**: ${results.agentsByType.business.length}\n`;
    report += `- **Agents non classifiés**: ${results.agentsByType.unknown.length}\n\n`;

    report += '## Statistiques par dossier\n\n';
    for (const [folder, stats] of Object.entries(results.folderStats)) {
        report += `### ${folder}\n\n`;
        report += `- **Total**: ${stats.total} agents\n`;
        report += `- **Orchestration**: ${stats.byLayer.orchestration}\n`;
        report += `- **Coordination**: ${stats.byLayer.coordination}\n`;
        report += `- **Business**: ${stats.byLayer.business}\n`;
        report += `- **Non classifiés**: ${stats.byLayer.unknown}\n\n`;
    }

    report += '## Interfaces implémentées\n\n';
    for (const [interfaceName, implementations] of Object.entries(results.implementedInterfaces)) {
        report += `### ${interfaceName} (${implementations.length} implémentations)\n\n`;
        for (const impl of implementations) {
            report += `- **${impl.className}**: \`${impl.filePath}\`\n`;
        }
        report += '\n';
    }

    report += '## Duplications potentielles\n\n';

    // Regrouper les duplications par couche pour une meilleure organisation
    const duplicatesByLayer = {
        orchestration: [],
        coordination: [],
        business: [],
        mixed: []
    };

    for (const dup of results.potentialDuplicates) {
        // Déterminer la couche (si tous les agents sont dans la même couche)
        const layers = new Set(dup.agents.map(a => a.layer));
        const layer = layers.size === 1 ? [...layers][0] : 'mixed';

        if (layer !== 'unknown') {
            duplicatesByLayer[layer].push(dup);
        }
    }

    for (const [layer, duplications] of Object.entries(duplicatesByLayer)) {
        if (duplications.length > 0) {
            report += `### Couche ${layer}\n\n`;

            for (const dup of duplications) {
                const type = dup.type === 'name-based'
                    ? `Duplication par nom (${dup.normalizedName})`
                    : `Duplication par fonctionnalité (${dup.signature})`;

                report += `#### ${type}\n\n`;
                report += '| Classe | Fichier | Dossier source | Date de modification |\n';
                report += '|--------|---------|---------------|----------------------|\n';

                for (const agent of dup.agents) {
                    const modifiedDate = new Date(agent.lastModified).toISOString().split('T')[0];
                    report += `| ${agent.className} | \`${agent.filePath}\` | ${agent.sourceFolder} | ${modifiedDate} |\n`;
                }

                report += '\n**Plan de consolidation recommandé:**\n';

                // Déterminer l'agent à conserver (le plus récent ou celui dans le dossier canonique)
                const canonicalFolders = {
                    'orchestration': 'packages/orchestration',
                    'coordination': 'packages/core',
                    'business': 'packages/business'
                };

                let keepAgent = dup.agents[0];

                // Préférer celui qui est dans le dossier canonique s'il existe
                const canonicalAgent = dup.agents.find(a => a.sourceFolder === canonicalFolders[layer]);
                if (canonicalAgent) {
                    keepAgent = canonicalAgent;
                } else {
                    // Sinon prendre le plus récent
                    keepAgent = dup.agents.reduce((latest, agent) => {
                        return agent.lastModified > latest.lastModified ? agent : latest;
                    }, dup.agents[0]);
                }

                report += `1. Conserver l'implémentation dans \`${keepAgent.filePath}\`\n`;
                report += `2. Migrer les fonctionnalités uniques des autres implémentations vers la version conservée\n`;
                report += `3. Mettre à jour les imports pour pointer vers la version conservée\n`;
                report += `4. Supprimer les implémentations redondantes\n\n`;
            }
        }
    }

    report += '## Plan de consolidation global\n\n';
    report += '### Étapes recommandées\n\n';
    report += '1. **Consolidation des agents orchestrateurs** - Priorité Haute\n';
    report += '   - Regrouper tous les agents d\'orchestration dans `packages/orchestration`\n';
    report += '   - S\'assurer qu\'ils implémentent les interfaces canoniques de `packages/core/interfaces/orchestration`\n\n';

    report += '2. **Consolidation des agents de coordination** - Priorité Moyenne\n';
    report += '   - Regrouper tous les agents de coordination dans un emplacement centralisé\n';
    report += '   - S\'assurer qu\'ils implémentent les interfaces canoniques de `packages/core/interfaces/coordination`\n\n';

    report += '3. **Consolidation des agents métier** - Priorité Haute\n';
    report += '   - Regrouper tous les agents métier dans `packages/business`\n';
    report += '   - Organiser par sous-type (analyzer, generator, validator, parser)\n';
    report += '   - S\'assurer qu\'ils implémentent les interfaces canoniques de `packages/core/interfaces/business`\n\n';

    report += '4. **Nettoyage des fichiers dupliqués** - Priorité Haute\n';
    report += '   - Supprimer tous les fichiers identifiés comme redondants après consolidation\n';
    report += '   - Mettre à jour tous les imports pour pointer vers les nouvelles locations\n\n';

    report += '### Journal de consolidation\n\n';
    report += '| Date | Agent | Action | De | Vers | Status |\n';
    report += '|------|-------|--------|----|----|-------|\n';
    report += `| ${new Date().toISOString().split('T')[0]} | _exemple_ | Migration | packages/mcp-agents/example-agent.ts | packages/business/example-agent.ts | À faire |\n`;

    const reportsDir = path.join(projectRoot, 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report);
    console.log(`\nRapport d'analyse détaillé généré: ${reportPath}`);
}

// Exécuter l'analyse
findAgentImplementations().catch(err => {
    console.error('Erreur lors de l\'exécution de l\'analyse:', err);
    process.exit(1);
});