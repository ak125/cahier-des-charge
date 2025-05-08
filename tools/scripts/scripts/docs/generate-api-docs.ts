/**
 * generate-api-docs.ts
 *
 * Script qui génère la documentation API automatiquement avec TypeDoc
 * pour les interfaces, DTOs et services importants
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';
import * as ts from 'typescript';
import glob from 'fast-glob';

const logger = new Logger('ApiDocGenerator');

/**
 * Génère la documentation API avec TypeDoc
 * @param outputDir Dossier de sortie pour les fichiers markdown
 */
export async function generateApiDocumentation(outputDir: string): Promise<void> {
    try {
        const apiOutputDir = path.join(outputDir, 'api');
        await fs.ensureDir(apiOutputDir);

        // Créer le fichier d'index de l'API
        await generateApiIndex(apiOutputDir);

        // Créer la catégorisation pour Docusaurus
        await createApiCategoryConfig(apiOutputDir);

        // Installer TypeDoc si nécessaire
        await ensureTypedoc();

        // Générer la documentation TypeDoc
        await generateTypeDoc(apiOutputDir);

        // Organiser la documentation générée par TypeDoc en catégories
        await organizeApiDocsByCategory(apiOutputDir);

        logger.log(`Documentation API générée dans ${apiOutputDir}`);

    } catch (error: any) {
        logger.error(`Erreur lors de la génération de la documentation API: ${error.message}`);
        throw error;
    }
}

/**
 * Génère la page d'index de l'API
 */
async function generateApiIndex(outputDir: string): Promise<void> {
    const indexContent = `---
id: index
title: Documentation API
sidebar_label: Vue d'ensemble
slug: /api
---

# Documentation API

Cette section contient la documentation technique détaillée des API, générée automatiquement à partir des types TypeScript.

## Structure

La documentation API est organisée selon les catégories suivantes :

- [Interfaces](/docs/api/interfaces) - Les contrats d'interface utilisés dans le système
- [DTOs](/docs/api/dtos) - Les objets de transfert de données
- [Services](/docs/api/services) - Les services principaux du système
- [Types](/docs/api/types) - Les définitions de types personnalisés
- [Enums](/docs/api/enums) - Les énumérations utilisées dans l'application

## Utilisation

Cette documentation est générée automatiquement à partir des commentaires JSDoc présents dans le code source.
Pour améliorer cette documentation, assurez-vous d'ajouter des commentaires descriptifs à vos interfaces, classes et méthodes.

Exemple de documentation d'interface bien formée :

\`\`\`typescript
/**
 * Interface représentant un agent du système
 * @interface Agent
 */
export interface Agent {
  /**
   * Identifiant unique de l'agent
   */
  id: string;
  
  /**
   * Nom de l'agent
   */
  name: string;
  
  /**
   * Description de l'agent
   */
  description: string;
  
  /**
   * Initialise l'agent avec la configuration spécifiée
   * @param config Configuration de l'agent
   * @returns Une promesse résolue quand l'initialisation est terminée
   */
  initialize(config: any): Promise<void>;
}
\`\`\`
`;

    await fs.writeFile(path.join(outputDir, 'index.md'), indexContent);
}

/**
 * Crée le fichier de configuration de catégorie pour Docusaurus
 */
async function createApiCategoryConfig(outputDir: string): Promise<void> {
    const categoryConfig = {
        "label": "API Reference",
        "position": 3,
        "collapsed": false
    };

    await fs.writeJSON(path.join(outputDir, '_category_.json'), categoryConfig, { spaces: 2 });
}

/**
 * S'assure que TypeDoc est installé
 */
async function ensureTypedoc(): Promise<void> {
    try {
        execSync('npm list -g typedoc', { stdio: 'ignore' });
        logger.log('TypeDoc est déjà installé');
    } catch (error) {
        logger.log('Installation de TypeDoc...');
        execSync('npm install -g typedoc', { stdio: 'inherit' });
        logger.log('TypeDoc installé avec succès');
    }
}

/**
 * Génère la documentation avec TypeDoc
 */
async function generateTypeDoc(outputDir: string): Promise<void> {
    const typedocOutputDir = path.join(outputDir, 'generated');
    await fs.ensureDir(typedocOutputDir);

    // Identifier les fichiers TypeScript à documenter
    const tsFiles = await findImportantTsFiles();

    // Créer un fichier temporaire avec la liste des fichiers
    const tempFilePath = path.join(process.cwd(), 'temp-typedoc-files.txt');
    await fs.writeFile(tempFilePath, tsFiles.join('\n'));

    logger.log(`Génération de la documentation TypeDoc pour ${tsFiles.length} fichiers...`);

    // Exécuter TypeDoc avec les options adaptées à Docusaurus
    const typedocCommand = `typedoc --plugin typedoc-plugin-markdown --out ${typedocOutputDir} --entryPointStrategy expand --includeVersion --readme none --plugin none --hideBreadcrumbs --hideGenerator --disableSources --logLevel Verbose --entryDocument index.md --hideMembersSymbol --excludeExternals --excludePrivate --excludeProtected @${tempFilePath}`;

    try {
        execSync(typedocCommand, { stdio: 'inherit' });
        logger.log('Documentation TypeDoc générée avec succès');

        // Nettoyer le fichier temporaire
        await fs.remove(tempFilePath);
    } catch (error) {
        logger.error('Erreur lors de la génération de la documentation TypeDoc');
        // Nettoyer le fichier temporaire en cas d'erreur
        await fs.remove(tempFilePath);
        throw error;
    }
}

/**
 * Trouve les fichiers TypeScript importants à documenter
 */
async function findImportantTsFiles(): Promise<string[]> {
    const rootDir = process.cwd();

    // Patterns pour les fichiers importants
    const patterns = [
        // Interfaces
        'agents/**/interfaces/**/*.ts',
        'apps/**/interfaces/**/*.ts',
        'packages/**/interfaces/**/*.ts',

        // DTOs
        'agents/**/dto/**/*.ts',
        'apps/**/dto/**/*.ts',
        'packages/**/dto/**/*.ts',

        // Services principaux
        'agents/**/services/**/*.service.ts',
        'apps/**/services/**/*.service.ts',
        'packages/**/services/**/*.service.ts',

        // Types et enums
        'agents/**/types/**/*.ts',
        'apps/**/types/**/*.ts',
        'packages/**/types/**/*.ts',
        'agents/**/enums/**/*.ts',
        'apps/**/enums/**/*.ts',
        'packages/**/enums/**/*.ts',
    ];

    // Exclure les fichiers de test
    const excludePatterns = [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
    ];

    // Trouver tous les fichiers correspondant aux patterns
    const files = await glob(patterns, {
        cwd: rootDir,
        ignore: excludePatterns,
        absolute: true,
    });

    logger.log(`Trouvé ${files.length} fichiers importants à documenter`);
    return files;
}

/**
 * Organise la documentation API générée en catégories
 */
async function organizeApiDocsByCategory(apiOutputDir: string): Promise<void> {
    const generatedDir = path.join(apiOutputDir, 'generated');
    if (!await fs.pathExists(generatedDir)) {
        logger.warn('Répertoire de documentation TypeDoc généré non trouvé');
        return;
    }

    // Catégories à créer
    const categories = ['interfaces', 'dtos', 'services', 'types', 'enums'];

    // Créer les dossiers de catégorie s'ils n'existent pas
    for (const category of categories) {
        const categoryDir = path.join(apiOutputDir, category);
        await fs.ensureDir(categoryDir);

        // Créer un fichier de catégorie pour Docusaurus
        const categoryConfig = {
            "label": category.charAt(0).toUpperCase() + category.slice(1),
            "position": getCategoryPosition(category),
            "collapsed": false
        };

        await fs.writeJSON(path.join(categoryDir, '_category_.json'), categoryConfig, { spaces: 2 });

        // Créer un fichier d'index pour la catégorie
        const indexContent = `---
id: index
title: ${category.charAt(0).toUpperCase() + category.slice(1)}
sidebar_label: Vue d'ensemble
slug: /api/${category}
---

# ${category.charAt(0).toUpperCase() + category.slice(1)}

Cette section contient la documentation des ${category} générée automatiquement à partir du code source.

`;

        await fs.writeFile(path.join(categoryDir, 'index.md'), indexContent);
    }

    // Déplacer les fichiers générés dans les bonnes catégories
    const moveFilesToCategory = async (pattern: string, category: string) => {
        const files = await glob(pattern, { cwd: generatedDir, absolute: false });

        for (const file of files) {
            const sourcePath = path.join(generatedDir, file);
            const destPath = path.join(apiOutputDir, category, path.basename(file));

            if (await fs.pathExists(sourcePath)) {
                await fs.copy(sourcePath, destPath);
                logger.verbose(`Déplacé ${file} vers la catégorie ${category}`);
            }
        }
    };

    // Déplacer les fichiers dans les bonnes catégories
    await moveFilesToCategory('interfaces/**/*', 'interfaces');
    await moveFilesToCategory('classes/*service*', 'services');
    await moveFilesToCategory('classes/*dto*', 'dtos');
    await moveFilesToCategory('enums/**/*', 'enums');
    await moveFilesToCategory('types/**/*', 'types');

    // Mettre à jour les liens dans les fichiers Markdown
    await updateMarkdownLinks(apiOutputDir);

    logger.log('Documentation API organisée avec succès par catégorie');
}

/**
 * Obtient la position de la catégorie dans la barre latérale
 */
function getCategoryPosition(category: string): number {
    const positions: Record<string, number> = {
        'interfaces': 1,
        'dtos': 2,
        'services': 3,
        'types': 4,
        'enums': 5
    };
    return positions[category] || 99;
}

/**
 * Met à jour les liens dans les fichiers Markdown pour refléter la nouvelle structure
 */
async function updateMarkdownLinks(apiOutputDir: string): Promise<void> {
    const markdownFiles = await glob('**/*.md', { cwd: apiOutputDir, absolute: true });

    for (const filePath of markdownFiles) {
        let content = await fs.readFile(filePath, 'utf8');

        // Mettre à jour les liens relatifs
        content = content.replace(/\]\(\.\.\/interfaces\//g, '](/docs/api/interfaces/');
        content = content.replace(/\]\(\.\.\/classes\//g, '](/docs/api/services/');
        content = content.replace(/\]\(\.\.\/enums\//g, '](/docs/api/enums/');
        content = content.replace(/\]\(\.\.\/types\//g, '](/docs/api/types/');

        await fs.writeFile(filePath, content);
    }

    logger.log('Liens dans les fichiers Markdown mis à jour');
}