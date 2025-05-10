#!/usr/bin/env node

/**
 * Script pour vérifier et mettre à jour les références à l'architecture à trois couches
 * 
 * Ce script parcourt tous les documents Markdown et vérifie que la terminologie 
 * relative à l'architecture à trois couches est utilisée correctement.
 * 
 * Usage:
 *   node check-architecture-terminology.js [--fix]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const docsDir = path.join(projectRoot, 'docs');

// Analyse des arguments
const args = process.argv.slice(2);
const autoFix = args.includes('--fix');

// Terminologie correcte pour l'architecture à trois couches
const CORRECT_TERMINOLOGY = {
    // Noms des couches
    'couche d\'orchestration': 'couche d\'orchestration',
    'couche orchestration': 'couche d\'orchestration',
    'orchestration layer': 'couche d\'orchestration',
    'couche de coordination': 'couche de coordination',
    'couche coordination': 'couche de coordination',
    'coordination layer': 'couche de coordination',
    'couche métier': 'couche métier',
    'business layer': 'couche métier',

    // Types d'agents
    'orchestrationagent': 'OrchestrationAgent',
    'orchestratoragent': 'OrchestratorAgent',
    'monitoragent': 'MonitorAgent',
    'scheduleragent': 'SchedulerAgent',
    'coordinationagent': 'CoordinationAgent',
    'adapteragent': 'AdapterAgent',
    'bridgeagent': 'BridgeAgent',
    'registryagent': 'RegistryAgent',
    'businessagent': 'BusinessAgent',
    'analyzeragent': 'AnalyzerAgent',
    'processoragent': 'ProcessorAgent',
    'validatoragent': 'ValidatorAgent',
    'converteragent': 'ConverterAgent'
};

// Construction des regex pour détecter la terminologie
const buildTerminologyRegex = () => {
    const terms = Object.keys(CORRECT_TERMINOLOGY);
    return new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
};

const terminologyRegex = buildTerminologyRegex();

/**
 * Vérifie et corrige la terminologie de l'architecture dans un document
 */
function checkAndFixArchitectureTerminology(content) {
    const issues = [];
    let updatedContent = content;
    let match;

    // Réinitialiser la position de recherche dans la regex
    terminologyRegex.lastIndex = 0;

    // Recherche de la terminologie incorrecte
    while ((match = terminologyRegex.exec(content)) !== null) {
        const foundTerm = match[0];
        const correctTerm = CORRECT_TERMINOLOGY[foundTerm.toLowerCase()];

        // Si le terme trouvé n'est pas dans la casse correcte
        if (foundTerm !== correctTerm) {
            issues.push({
                position: match.index,
                incorrect: foundTerm,
                correct: correctTerm
            });

            if (autoFix) {
                // Remplacer uniquement l'occurrence exacte à cette position
                const before = updatedContent.substring(0, match.index);
                const after = updatedContent.substring(match.index + foundTerm.length);
                updatedContent = before + correctTerm + after;

                // Ajuster la position pour continuer la recherche après le terme remplacé
                terminologyRegex.lastIndex = before.length + correctTerm.length;
            }
        }
    }

    return {
        issues,
        updatedContent
    };
}

/**
 * Parcourt récursivement un dossier pour traiter tous les fichiers Markdown
 */
function processDirectory(dir) {
    const results = {
        issuesFound: 0,
        filesFixed: 0
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Ne pas traiter les archives
            if (path.basename(filePath) !== '_archives') {
                const subResults = processDirectory(filePath);
                results.issuesFound += subResults.issuesFound;
                results.filesFixed += subResults.filesFixed;
            }
        } else if (file.endsWith('.md')) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const { issues, updatedContent } = checkAndFixArchitectureTerminology(content);

                if (issues.length > 0) {
                    results.issuesFound += issues.length;

                    console.log(`\nFichier: ${path.relative(projectRoot, filePath)}`);
                    issues.forEach(issue => {
                        console.log(`  - "${issue.incorrect}" doit être remplacé par "${issue.correct}"`);
                    });

                    if (autoFix && content !== updatedContent) {
                        fs.writeFileSync(filePath, updatedContent, 'utf8');
                        results.filesFixed++;
                        console.log(`  ✅ Corrections appliquées.`);
                    }
                }
            } catch (error) {
                console.error(`❌ Erreur lors du traitement de ${filePath}: ${error.message}`);
            }
        }
    }

    return results;
}

/**
 * Fonction principale
 */
function main() {
    console.log('=== VÉRIFICATION DE LA TERMINOLOGIE DE L\'ARCHITECTURE À TROIS COUCHES ===\n');

    if (autoFix) {
        console.log('Mode correction automatique activé.\n');
    } else {
        console.log('Mode vérification uniquement. Utilisez --fix pour appliquer les corrections.\n');
    }

    const results = processDirectory(docsDir);

    console.log(`\n== Résumé ==`);
    console.log(`Problèmes détectés: ${results.issuesFound}`);

    if (autoFix) {
        console.log(`Fichiers corrigés: ${results.filesFixed}`);
    }

    if (results.issuesFound === 0) {
        console.log(`\n✅ Aucun problème de terminologie d'architecture détecté.`);
    } else if (autoFix) {
        console.log(`\n✅ Corrections appliquées. Veuillez vérifier les changements.`);
    } else {
        console.log(`\n⚠️ Des problèmes de terminologie ont été détectés. Utilisez --fix pour les corriger.`);
    }
}

// Exécuter le script
main();
