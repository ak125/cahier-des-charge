#!/usr/bin/env node

/**
 * Script d'intégration continue pour valider l'architecture en 3 couches
 * (business, coordination, orchestration)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Validation de l\'architecture en 3 couches...');

try {
    // 1. Vérification des workflows
    console.log('\n📋 Vérification des workflows GitHub Actions...');
    execSync('node ./tools/ci/deep-check-workflows.js', { stdio: 'inherit' });

    // 2. Validation de la structure des packages
    console.log('\n📦 Validation de la structure des packages...');
    execSync('node ./tools/ci/validate-3layer-structure.js', { stdio: 'inherit' });

    // 3. Vérification des imports croisés interdits
    console.log('\n🔍 Vérification des imports croisés interdits...');
    checkForbiddenImports();

    console.log('\n✅ Validation de l\'architecture en 3 couches réussie!');
} catch (error) {
    console.error('\n❌ Validation échouée:', error.message);
    process.exit(1);
}

/**
 * Vérifie les imports interdits entre les couches
 * Business ne devrait pas importer de Coordination ou Orchestration
 * Coordination ne devrait pas importer d'Orchestration
 */
function checkForbiddenImports() {
    const forbiddenImports = [
        {
            source: 'packages/business',
            forbidden: ['packages/coordination', 'packages/orchestration'],
            message: 'La couche Business ne doit pas dépendre de Coordination ou Orchestration'
        },
        {
            source: 'packages/coordination',
            forbidden: ['packages/orchestration'],
            message: 'La couche Coordination ne doit pas dépendre d\'Orchestration'
        }
    ];

    let hasErrors = false;

    for (const rule of forbiddenImports) {
        console.log(`\nVérification: ${rule.message}`);

        for (const forbidden of rule.forbidden) {
            try {
                const result = execSync(`grep -r "from '${forbidden}" ${rule.source} || grep -r "from \\"${forbidden}" ${rule.source} || true`, { encoding: 'utf8' });

                if (result.trim()) {
                    console.error(`❌ Imports interdits trouvés: ${rule.source} -> ${forbidden}`);
                    console.error(result);
                    hasErrors = true;
                } else {
                    console.log(`✅ Aucun import interdit trouvé: ${rule.source} -> ${forbidden}`);
                }
            } catch (error) {
                console.error(`Erreur lors de la vérification: ${error.message}`);
            }
        }
    }

    if (hasErrors) {
        throw new Error('Des imports interdits ont été détectés');
    }
}
