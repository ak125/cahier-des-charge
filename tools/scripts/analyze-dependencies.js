#!/usr/bin/env node

/**
 * Script d'analyse des dépendances entre packages
 * 
 * Ce script analyse les dépendances entre les packages du monorepo
 * et détecte les dépendances circulaires potentielles.
 * 
 * Usage: node analyze-dependencies.js [--strict] [--fix] [--report=file.json]
 * 
 * Options:
 *   --strict    Mode strict qui génère une erreur en cas de dépendances circulaires
 *   --fix       Tente de résoudre automatiquement certains problèmes de dépendances
 *   --report    Génère un rapport de dépendances au format JSON
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ts = require('typescript');

// Configuration
const ROOT_DIR = process.cwd();
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const DEPENDENCY_CONFIG = path.join(ROOT_DIR, 'dependency-rules.json');

// Options par ligne de commande
const args = process.argv.slice(2);
const STRICT_MODE = args.includes('--strict');
const FIX_MODE = args.includes('--fix');
const REPORT_FILE = args.find(arg => arg.startsWith('--report='))?.split('=')[1];

// Couleurs pour les messages de console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

/**
 * Affiche un message avec une couleur
 */
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Analyse les imports dans un fichier TypeScript
 */
function analyzeImports(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true
    );

    const imports = [];

    function visit(node) {
        if (ts.isImportDeclaration(node)) {
            const importPath = node.moduleSpecifier.text;
            if (importPath.startsWith('@packages/')) {
                imports.push(importPath);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return imports;
}

/**
 * Trouve les dépendances de tous les packages
 */
function findAllPackageDependencies() {
    log('Analyse des dépendances entre packages...', 'blue');

    const packages = fs.readdirSync(PACKAGES_DIR)
        .filter(dir => fs.statSync(path.join(PACKAGES_DIR, dir)).isDirectory());

    const dependencies = {};

    // Initialiser la structure pour chaque package
    packages.forEach(pkg => {
        dependencies[pkg] = {
            dependencies: new Set(),
            dependents: new Set(),
            circularDependencies: []
        };
    });

    // Analyser les dépendances de chaque package
    packages.forEach(pkg => {
        const packageDir = path.join(PACKAGES_DIR, pkg);
        const files = glob.sync('**/*.{ts,tsx}', { cwd: packageDir });

        files.forEach(file => {
            const filePath = path.join(packageDir, file);
            const imports = analyzeImports(filePath);

            imports.forEach(importPath => {
                const match = importPath.match(/@packages\/([^/]+)/);
                if (match && match[1]) {
                    const dependency = match[1];
                    if (packages.includes(dependency) && dependency !== pkg) {
                        dependencies[pkg].dependencies.add(dependency);
                        dependencies[dependency].dependents.add(pkg);
                    }
                }
            });
        });
    });

    // Convertir les ensembles en tableaux pour faciliter la manipulation
    for (const pkg in dependencies) {
        dependencies[pkg].dependencies = Array.from(dependencies[pkg].dependencies);
        dependencies[pkg].dependents = Array.from(dependencies[pkg].dependents);
    }

    return dependencies;
}

/**
 * Détecte les dépendances circulaires
 */
function detectCircularDependencies(dependencies) {
    log('Détection des dépendances circulaires...', 'blue');

    function checkCircularDependency(pkg, visited = new Set(), path = []) {
        if (visited.has(pkg)) {
            const circularPath = [...path.slice(path.indexOf(pkg)), pkg];
            return circularPath;
        }

        visited.add(pkg);
        path.push(pkg);

        const deps = dependencies[pkg]?.dependencies || [];
        for (const dep of deps) {
            const result = checkCircularDependency(dep, new Set(visited), [...path]);
            if (result) {
                return result;
            }
        }

        return null;
    }

    // Chercher des cycles pour chaque package
    for (const pkg in dependencies) {
        const circularPath = checkCircularDependency(pkg);
        if (circularPath) {
            dependencies[pkg].circularDependencies.push(circularPath);
        }
    }

    return dependencies;
}

/**
 * Vérifie les règles de dépendances
 */
function checkDependencyRules(dependencies) {
    if (!fs.existsSync(DEPENDENCY_CONFIG)) {
        log('Aucun fichier de règles de dépendances trouvé.', 'yellow');
        return dependencies;
    }

    log('Vérification des règles de dépendances...', 'blue');
    const rules = JSON.parse(fs.readFileSync(DEPENDENCY_CONFIG, 'utf8'));

    for (const pkg in dependencies) {
        dependencies[pkg].violations = [];

        // Vérifier les dépendances interdites
        if (rules.forbidden && rules.forbidden[pkg]) {
            const forbiddenDeps = rules.forbidden[pkg];
            dependencies[pkg].dependencies.forEach(dep => {
                if (forbiddenDeps.includes(dep)) {
                    dependencies[pkg].violations.push({
                        type: 'forbidden',
                        dependency: dep,
                        message: `Le package "${pkg}" ne devrait pas dépendre de "${dep}"`
                    });
                }
            });
        }

        // Vérifier les dépendances obligatoires
        if (rules.required && rules.required[pkg]) {
            const requiredDeps = rules.required[pkg];
            requiredDeps.forEach(requiredDep => {
                if (!dependencies[pkg].dependencies.includes(requiredDep)) {
                    dependencies[pkg].violations.push({
                        type: 'required',
                        dependency: requiredDep,
                        message: `Le package "${pkg}" devrait dépendre de "${requiredDep}"`
                    });
                }
            });
        }
    }

    return dependencies;
}

/**
 * Génère un rapport de dépendances
 */
function generateDependencyReport(dependencies, fileName) {
    log(`Génération du rapport de dépendances dans ${fileName}...`, 'blue');

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            packages: Object.keys(dependencies).length,
            circularDependencies: 0,
            violations: 0
        },
        packages: dependencies,
        visualizationData: {
            nodes: [],
            links: []
        }
    };

    // Calculer les statistiques
    for (const pkg in dependencies) {
        report.summary.circularDependencies += dependencies[pkg].circularDependencies.length;
        report.summary.violations += dependencies[pkg].violations?.length || 0;

        // Ajouter des nœuds et liens pour la visualisation
        report.visualizationData.nodes.push({
            id: pkg,
            group: dependencies[pkg].circularDependencies.length > 0 ? 2 : 1
        });

        dependencies[pkg].dependencies.forEach(dep => {
            report.visualizationData.links.push({
                source: pkg,
                target: dep,
                value: 1
            });
        });
    }

    // Écrire le rapport dans un fichier
    fs.writeFileSync(fileName, JSON.stringify(report, null, 2));
}

/**
 * Fonction principale
 */
async function main() {
    try {
        log('=== Analyse des dépendances entre packages ===', 'cyan');

        // Étape 1 : Trouver toutes les dépendances
        let dependencies = findAllPackageDependencies();

        // Étape 2 : Détecter les dépendances circulaires
        dependencies = detectCircularDependencies(dependencies);

        // Étape 3 : Vérifier les règles de dépendances
        dependencies = checkDependencyRules(dependencies);

        // Afficher les résultats
        let hasCircularDependencies = false;
        let hasViolations = false;

        for (const pkg in dependencies) {
            const cycles = dependencies[pkg].circularDependencies;
            const violations = dependencies[pkg].violations || [];

            if (cycles.length > 0) {
                hasCircularDependencies = true;
                log(`\n[${pkg}] a ${cycles.length} dépendances circulaires:`, 'red');
                cycles.forEach((cycle, index) => {
                    log(`  ${index + 1}. ${cycle.join(' -> ')}`, 'red');
                });
            }

            if (violations.length > 0) {
                hasViolations = true;
                log(`\n[${pkg}] a ${violations.length} violations de règles:`, 'yellow');
                violations.forEach((violation, index) => {
                    log(`  ${index + 1}. ${violation.message}`, 'yellow');
                });
            }
        }

        // Générer un rapport si demandé
        if (REPORT_FILE) {
            generateDependencyReport(dependencies, REPORT_FILE);
            log(`\nRapport généré : ${REPORT_FILE}`, 'green');
        }

        // Résumé
        log('\n=== Résumé ===', 'cyan');
        log(`Packages analysés: ${Object.keys(dependencies).length}`, 'blue');

        if (hasCircularDependencies) {
            log('⚠️  Dépendances circulaires détectées!', 'red');
        } else {
            log('✅ Aucune dépendance circulaire trouvée', 'green');
        }

        if (hasViolations) {
            log('⚠️  Violations des règles de dépendances détectées!', 'yellow');
        } else {
            log('✅ Toutes les règles de dépendances sont respectées', 'green');
        }

        // Terminer avec une erreur si nécessaire en mode strict
        if (STRICT_MODE && (hasCircularDependencies || hasViolations)) {
            process.exit(1);
        }
    } catch (error) {
        log(`\n❌ Erreur: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Exécuter le script
main();