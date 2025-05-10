#!/usr/bin/env node

/**
 * Script qui vérifie les importations interdites entre les couches
 * de l'architecture 3 couches (business, coordination, orchestration).
 * 
 * Règles:
 * - La couche business peut uniquement importer des modules internes à business
 * - La couche coordination peut importer business et des modules internes à coordination
 * - La couche orchestration peut importer business, coordination et des modules internes à orchestration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { glob } from 'glob';
import * as ts from 'typescript';

// Règles d'importation pour chaque couche
const IMPORT_RULES = {
    business: {
        allowed: ['business'],
        forbidden: ['coordination', 'orchestration'],
        name: 'Business Layer'
    },
    coordination: {
        allowed: ['business', 'coordination'],
        forbidden: ['orchestration'],
        name: 'Coordination Layer'
    },
    orchestration: {
        allowed: ['business', 'coordination', 'orchestration'],
        forbidden: [],
        name: 'Orchestration Layer'
    }
};

// Détection de l'architecture
async function detectArchitecture() {
    for (const layer of ['business', 'coordination', 'orchestration']) {
        if (!fs.existsSync(`packages/${layer}`)) {
            console.error(`❌ Structure de couche manquante: packages/${layer}`);
            process.exit(1);
        }
    }
    console.log('✅ Structure 3 couches détectée');
}

// Analyse les importations dans un fichier TypeScript
function analyzeImports(filePath, sourceLayer) {
    const rules = IMPORT_RULES[sourceLayer];
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.ES2018,
        true
    );

    const issues = [];

    // Fonction pour visiter tous les nœuds dans l'AST
    function visit(node) {
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                const importPath = node.moduleSpecifier.text;

                // Vérifier si c'est un import relatif
                if (importPath.startsWith('.') || importPath.startsWith('@/')) {
                    // Normaliser le chemin
                    let normalizedPath = importPath;
                    if (importPath.startsWith('@/')) {
                        normalizedPath = importPath.substring(2);
                    }

                    // Vérifier les imports interdits
                    for (const forbiddenLayer of rules.forbidden) {
                        if (normalizedPath.includes(`packages/${forbiddenLayer}/`) ||
                            normalizedPath.includes(`@${forbiddenLayer}/`)) {
                            issues.push({
                                importPath,
                                message: `La couche ${rules.name} ne doit pas importer depuis la couche ${forbiddenLayer}`,
                                severity: 'error'
                            });
                            break;
                        }
                    }
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return issues;
}

// Analyse les importations dans tous les fichiers d'une couche
async function analyzeLayers() {
    let totalIssues = 0;

    for (const layer of Object.keys(IMPORT_RULES)) {
        console.log(`\n🔍 Analyse de la couche ${IMPORT_RULES[layer].name}...`);

        const files = await glob(`packages/${layer}/src/**/*.{ts,tsx}`);
        let layerIssues = 0;

        for (const file of files) {
            const issues = analyzeImports(file, layer);

            if (issues.length > 0) {
                console.log(`\n❌ Problèmes trouvés dans ${file}:`);

                for (const issue of issues) {
                    console.log(`   - ${issue.message}`);
                    console.log(`     Import: ${issue.importPath}`);
                    layerIssues++;
                }
            }
        }

        if (layerIssues === 0) {
            console.log(`✅ Aucune importation interdite détectée dans la couche ${IMPORT_RULES[layer].name}`);
        } else {
            console.log(`⚠️ ${layerIssues} problèmes d'importation détectés dans la couche ${IMPORT_RULES[layer].name}`);
            totalIssues += layerIssues;
        }
    }

    return totalIssues;
}

// Fonction principale
async function main() {
    console.log('🧪 Vérification des importations entre couches...');

    // Vérifier si l'architecture 3 couches est présente
    await detectArchitecture();

    // Analyser les importations dans chaque couche
    const issuesFound = await analyzeLayers();

    if (issuesFound > 0) {
        console.error(`\n❌ ${issuesFound} violations des règles d'importation détectées!`);
        process.exit(1);
    } else {
        console.log('\n✅ Toutes les importations respectent les règles architecturales');
        process.exit(0);
    }
}

// Exécution
main().catch(err => {
    console.error('Erreur lors de la vérification des importations:', err);
    process.exit(1);
});
