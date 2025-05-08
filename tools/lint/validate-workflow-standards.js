/**
 * Script de validation des standards des workflows Temporal
 * 
 * Ce script vérifie que les fichiers de workflows Temporal suivent les standards définis.
 * Il peut être utilisé en tant que hook pre-commit ou dans une pipeline CI/CD.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Chemins et constantes
const PROJECT_ROOT = process.cwd();
const STANDARD_WORKFLOWS_PATH = path.join(PROJECT_ROOT, 'packages/business/temporal/workflows');
const OBSOLETE_WORKFLOWS_PATH = path.join(PROJECT_ROOT, 'packages/business/workflows/temporal');

// Configuration des standards
const STANDARDS = {
    filePattern: /^[a-z0-9-]+(-[a-z0-9-]+)*\.workflow\.ts$/,
    imports: [
        '@temporalio/workflow'
    ],
    requiredJsDoc: true,
    exportDefault: true,
    structureCheck: true
};

// Couleurs pour le terminal
const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

/**
 * Vérifie si un fichier respecte le pattern de nommage standard
 */
function checkFileNaming(filePath) {
    const fileName = path.basename(filePath);
    if (!STANDARDS.filePattern.test(fileName)) {
        return {
            valid: false,
            message: `Le nom du fichier "${fileName}" ne respecte pas le pattern standard: <fonctionnalité>[-<sous-fonctionnalité>].workflow.ts`
        };
    }
    return { valid: true };
}

/**
 * Vérifie si le fichier contient les imports standard
 */
function checkImports(content) {
    const missingImports = [];

    for (const importName of STANDARDS.imports) {
        if (!content.includes(`from '${importName}'`) && !content.includes(`from "${importName}"`)) {
            missingImports.push(importName);
        }
    }

    if (missingImports.length > 0) {
        return {
            valid: false,
            message: `Imports standards manquants: ${missingImports.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Vérifie si le fichier contient une documentation JSDoc
 */
function checkJsDoc(content) {
    // Vérifier la présence de commentaires JSDoc pour les fonctions exportées
    const exportedFunctions = content.match(/export (async )?function \w+/g) || [];

    for (const funcExport of exportedFunctions) {
        const funcName = funcExport.replace(/export (async )?function /, '');
        const pattern = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/\\s*${funcExport}`);

        if (!pattern.test(content)) {
            return {
                valid: false,
                message: `La fonction exportée "${funcName}" n'a pas de documentation JSDoc`
            };
        }
    }

    return { valid: true };
}

/**
 * Vérifie si le fichier contient un export par défaut
 */
function checkDefaultExport(content) {
    if (!content.includes('export default')) {
        return {
            valid: false,
            message: `Le fichier ne contient pas d'export par défaut`
        };
    }

    return { valid: true };
}

/**
 * Vérifie si le fichier est dans la structure de dossiers standard
 */
function checkFileStructure(filePath) {
    if (filePath.includes(OBSOLETE_WORKFLOWS_PATH)) {
        return {
            valid: false,
            message: `Le fichier est dans la structure de dossiers obsolète: ${OBSOLETE_WORKFLOWS_PATH}`
        };
    }

    if (!filePath.includes(STANDARD_WORKFLOWS_PATH)) {
        return {
            valid: false,
            message: `Le fichier n'est pas dans la structure de dossiers standard: ${STANDARD_WORKFLOWS_PATH}`
        };
    }

    return { valid: true };
}

/**
 * Vérifie un fichier de workflow
 */
function validateWorkflowFile(filePath) {
    console.log(`${COLORS.blue}Validation du fichier: ${filePath}${COLORS.reset}`);

    const results = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    // Vérifier la structure de dossiers
    if (STANDARDS.structureCheck) {
        const structureResult = checkFileStructure(filePath);
        results.push({
            check: 'Structure de dossiers',
            ...structureResult
        });
    }

    // Vérifier le nommage du fichier
    const namingResult = checkFileNaming(filePath);
    results.push({
        check: 'Nommage du fichier',
        ...namingResult
    });

    // Vérifier les imports
    const importsResult = checkImports(content);
    results.push({
        check: 'Imports standard',
        ...importsResult
    });

    // Vérifier la documentation JSDoc
    if (STANDARDS.requiredJsDoc) {
        const jsDocResult = checkJsDoc(content);
        results.push({
            check: 'Documentation JSDoc',
            ...jsDocResult
        });
    }

    // Vérifier l'export par défaut
    if (STANDARDS.exportDefault) {
        const exportResult = checkDefaultExport(content);
        results.push({
            check: 'Export par défaut',
            ...exportResult
        });
    }

    // Afficher les résultats
    let hasErrors = false;

    for (const result of results) {
        if (result.valid) {
            console.log(`  ${COLORS.green}✓ ${result.check}${COLORS.reset}`);
        } else {
            console.log(`  ${COLORS.red}✗ ${result.check}: ${result.message}${COLORS.reset}`);
            hasErrors = true;
        }
    }

    return {
        file: relativePath,
        valid: !hasErrors,
        results
    };
}

/**
 * Fonction principale
 */
async function main() {
    console.log(`${COLORS.blue}=== Validation des standards des workflows Temporal ===${COLORS.reset}`);

    // Trouver tous les fichiers de workflow
    const workflowFiles = glob.sync('**/*.workflow.ts', {
        cwd: PROJECT_ROOT,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/backup/**']
    });

    console.log(`\nTrouvé ${workflowFiles.length} fichier(s) de workflow à valider.\n`);

    // Valider chaque fichier
    const results = [];

    for (const file of workflowFiles) {
        const result = validateWorkflowFile(file);
        results.push(result);
        console.log(''); // Ligne vide pour la lisibilité
    }

    // Résumé
    const validFiles = results.filter(r => r.valid).length;
    const invalidFiles = results.filter(r => !r.valid).length;

    console.log(`${COLORS.blue}=== Résumé ===${COLORS.reset}`);
    console.log(`Total des fichiers: ${workflowFiles.length}`);
    console.log(`${COLORS.green}Fichiers valides: ${validFiles}${COLORS.reset}`);

    if (invalidFiles > 0) {
        console.log(`${COLORS.red}Fichiers non conformes: ${invalidFiles}${COLORS.reset}`);
        console.log(`\n${COLORS.yellow}Des fichiers ne respectent pas les standards des workflows Temporal.${COLORS.reset}`);
        console.log(`Veuillez consulter la documentation: ${path.join(PROJECT_ROOT, 'docs/standards/temporal-workflow-standards.md')}`);
        process.exit(1);
    } else {
        console.log(`\n${COLORS.green}Tous les fichiers de workflows sont conformes aux standards!${COLORS.reset}`);
    }
}

// Exécuter le script si appelé directement
if (require.main === module) {
    main().catch(err => {
        console.error(`${COLORS.red}Erreur: ${err.message}${COLORS.reset}`);
        process.exit(1);
    });
}

module.exports = {
    validateWorkflowFile,
    checkFileNaming,
    checkImports,
    checkJsDoc,
    checkDefaultExport,
    checkFileStructure
};