/**
 * generate-docs.ts
 * 
 * Script principal pour la génération de la documentation unifiée
 * Ce script coordonne l'ensemble du processus de génération de documentation :
 * - Documentation des agents
 * - Documentation API avec TypeDoc
 * - Guides interactifs
 * - Intégration des exemples de code
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

// Import des générateurs spécifiques
import { generateAgentsDocumentation } from './generate-agents-docs';
import { generateApiDocumentation } from './generate-api-docs';
import { generateGuides } from './generate-guides';
import { copyExamples } from './copy-examples';
import { validateLinks } from './validate-links';

const logger = new Logger('DocGenerator');

async function generateDocumentation() {
    try {
        logger.log('Démarrage de la génération de documentation unifiée...');

        const rootDir = process.cwd();
        const docsOutputDir = path.join(rootDir, 'documentation', 'docs');

        // S'assurer que le dossier de documentation existe
        await fs.ensureDir(docsOutputDir);

        // 1. Générer la documentation des agents
        logger.log('Génération de la documentation des agents...');
        await generateAgentsDocumentation(docsOutputDir);

        // 2. Générer la documentation API avec TypeDoc
        logger.log('Génération de la documentation API...');
        await generateApiDocumentation(docsOutputDir);

        // 3. Générer les guides interactifs
        logger.log('Génération des guides interactifs...');
        await generateGuides(docsOutputDir);

        // 4. Copier les exemples de code
        logger.log('Copie des exemples de code...');
        await copyExamples(docsOutputDir);

        // 5. Valider les liens et références
        logger.log('Validation des liens...');
        await validateLinks(docsOutputDir);

        // 6. Construire le site Docusaurus
        logger.log('Construction du site Docusaurus...');
        execSync('cd documentation && npm run build', { stdio: 'inherit' });

        logger.log('Documentation générée avec succès !');
        return true;
    } catch (error: any) {
        logger.error(`Erreur lors de la génération de documentation: ${error.message}`);
        logger.error(error.stack);
        return false;
    }
}

// Exécution si lancé directement
if (require.main === module) {
    generateDocumentation()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(err => {
            console.error('Erreur fatale:', err);
            process.exit(1);
        });
}

export { generateDocumentation };