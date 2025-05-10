#!/usr/bin/env node

/**
 * Script pour vérifier la cohérence des technologies mentionnées
 * dans la documentation
 * 
 * Ce script analyse tous les documents Markdown et détecte les références
 * aux technologies, vérifiant qu'elles sont cohérentes avec les standards actuels.
 * 
 * Usage:
 *   node check-tech-consistency.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const docsDir = path.join(projectRoot, 'docs');

// Définition des technologies standard et dépréciées
const TECH_STATUS = {
    // Orchestration
    'temporal': { status: 'standard', alternatives: [] },
    'temporal.io': { status: 'standard', alternatives: [] },
    'bullmq': { status: 'standard', alternatives: [] },
    'bull-mq': { status: 'standard', alternatives: ['bullmq'] },
    'bull mq': { status: 'standard', alternatives: ['bullmq'] },
    'n8n': { status: 'deprecated', alternatives: ['temporal.io', 'bullmq'] },

    // Base de données / ORM
    'prisma': { status: 'standard', alternatives: [] },
    'typeorm': { status: 'maintained', alternatives: ['prisma'] },
    'sequelize': { status: 'deprecated', alternatives: ['prisma'] },
    'postgresql': { status: 'standard', alternatives: [] },
    'postgres': { status: 'standard', alternatives: ['postgresql'] },
    'mysql': { status: 'maintained', alternatives: ['postgresql'] },
    'sqlite': { status: 'limited', alternatives: [] },
    'mongodb': { status: 'deprecated', alternatives: ['postgresql'] },

    // Validation
    'zod': { status: 'standard', alternatives: [] },
    'typebox': { status: 'standard', alternatives: [] },
    'joi': { status: 'deprecated', alternatives: ['zod', 'typebox'] },
    'ajv': { status: 'maintained', alternatives: ['zod', 'typebox'] },
    'class-validator': { status: 'deprecated', alternatives: ['zod', 'typebox'] },

    // Frameworks
    'nestjs': { status: 'standard', alternatives: [] },
    'express': { status: 'maintained', alternatives: [] },
    'fastify': { status: 'recommended', alternatives: [] },
    'koa': { status: 'deprecated', alternatives: ['fastify'] }
};

// Regex pour trouver les mentions de technologies
function buildTechRegex() {
    const techNames = Object.keys(TECH_STATUS);
    // Création d'une regex qui recherche des mentions de technologies 
    // mais évite les faux positifs en cherchant les mots entiers
    return new RegExp(`\\b(${techNames.join('|')})\\b`, 'gi');
}

const techRegex = buildTechRegex();

/**
 * Analyse un document pour détecter les mentions de technologies
 */
function analyzeTechnologies(content, filePath) {
    const mentions = [];
    let match;

    // Recherche des mentions de technologies dans le contenu
    while ((match = techRegex.exec(content)) !== null) {
        const technology = match[0].toLowerCase();
        const techInfo = TECH_STATUS[technology];

        if (techInfo) {
            mentions.push({
                technology,
                position: match.index,
                status: techInfo.status,
                alternatives: techInfo.alternatives
            });
        }
    }

    return mentions;
}

/**
 * Vérifie si un document fait référence à des technologies dépréciées
 * sans mentionner les alternatives recommandées
 */
function checkDeprecatedTechnologies(content, mentions) {
    const warnings = [];

    // Regrouper les mentions par technologie
    const techMentions = {};
    mentions.forEach(mention => {
        if (!techMentions[mention.technology]) {
            techMentions[mention.technology] = [];
        }
        techMentions[mention.technology].push(mention);
    });

    // Vérifier les technologies dépréciées
    for (const [tech, mentions] of Object.entries(techMentions)) {
        if (mentions.length > 0 && mentions[0].status === 'deprecated') {
            const alternatives = mentions[0].alternatives;

            // Vérifier si des alternatives sont mentionnées
            const altMentioned = alternatives.some(alt =>
                techMentions[alt] && techMentions[alt].length > 0
            );

            if (!altMentioned && !content.toLowerCase().includes('depreci')) {
                warnings.push({
                    technology: tech,
                    status: 'deprecated',
                    message: `Technologie dépréciée '${tech}' mentionnée sans référence aux alternatives recommandées: ${alternatives.join(', ')}`
                });
            }
        }
    }

    return warnings;
}

/**
 * Parcourt récursivement un dossier pour traiter tous les fichiers Markdown
 */
function processDirectory(dir) {
    const results = {
        techMentions: {},
        warnings: []
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Ne pas traiter les archives
            if (path.basename(filePath) !== '_archives') {
                const subResults = processDirectory(filePath);

                // Fusionner les résultats
                Object.keys(subResults.techMentions).forEach(tech => {
                    if (!results.techMentions[tech]) {
                        results.techMentions[tech] = [];
                    }
                    results.techMentions[tech] = results.techMentions[tech].concat(
                        subResults.techMentions[tech]
                    );
                });

                results.warnings = results.warnings.concat(subResults.warnings);
            }
        } else if (file.endsWith('.md')) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const mentions = analyzeTechnologies(content, filePath);

                // Regrouper les mentions par technologie
                mentions.forEach(mention => {
                    const tech = mention.technology;
                    if (!results.techMentions[tech]) {
                        results.techMentions[tech] = [];
                    }

                    results.techMentions[tech].push({
                        file: path.relative(docsDir, filePath),
                        ...mention
                    });
                });

                // Vérifier les technologies dépréciées
                const warnings = checkDeprecatedTechnologies(content, mentions);
                if (warnings.length > 0) {
                    warnings.forEach(warning => {
                        results.warnings.push({
                            file: path.relative(docsDir, filePath),
                            ...warning
                        });
                    });
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
    console.log('=== VÉRIFICATION DE LA COHÉRENCE DES TECHNOLOGIES ===\n');

    // Analyser tous les documents
    const results = processDirectory(docsDir);

    // Afficher le rapport des technologies utilisées
    console.log('## TECHNOLOGIES MENTIONNÉES DANS LA DOCUMENTATION\n');

    const techSummary = {};

    // Regrouper par statut et compter
    Object.entries(results.techMentions).forEach(([tech, mentions]) => {
        const status = TECH_STATUS[tech].status;
        if (!techSummary[status]) {
            techSummary[status] = {};
        }

        techSummary[status][tech] = mentions.length;
    });

    // Afficher les résultats par statut
    ['standard', 'recommended', 'maintained', 'limited', 'deprecated'].forEach(status => {
        if (techSummary[status]) {
            console.log(`\n### Technologies avec statut "${status}":`);

            const techs = Object.entries(techSummary[status])
                .sort((a, b) => b[1] - a[1]); // Trier par nombre de mentions

            techs.forEach(([tech, count]) => {
                console.log(`- ${tech}: ${count} mentions`);
            });
        }
    });

    // Afficher les avertissements
    if (results.warnings.length > 0) {
        console.log('\n\n## AVERTISSEMENTS DE COHÉRENCE TECHNOLOGIQUE\n');

        results.warnings.forEach(warning => {
            console.log(`⚠️ ${warning.file}: ${warning.message}`);
        });

        console.log(`\nTotal: ${results.warnings.length} avertissements`);
    } else {
        console.log('\n\n✅ Aucun problème de cohérence technologique détecté.');
    }

    // Génération d'un rapport JSON pour analyse ultérieure
    const reportPath = path.join(projectRoot, 'tech-consistency-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');

    console.log(`\nRapport détaillé généré: ${reportPath}`);
}

// Exécuter le script
main();
