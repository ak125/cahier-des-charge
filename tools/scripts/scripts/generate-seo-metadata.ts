#!/usr/bin/env ts-node
/**
 * Script de génération des métadonnées SEO
 * 
 * Ce script permet de générer automatiquement les métadonnées SEO pour différents scénarios :
 * 1. Migration depuis des fichiers PHP legacy
 * 2. Génération pour les routes Remix existantes
 * 3. Génération pour des structures de données spécifiques (produits, articles, etc.)
 * 
 * Usage :
 *   ts-node generate-seo-metadata.ts --mode=migrate --source=./php-legacy --output=./generated/seo
 *   ts-node generate-seo-metadata.ts --mode=routes --routes=./app/routes --output=./generated/seo
 */

import { SeoMigrationAgent } from '../agents/seo-migration-agent';
import { SeoContentEnhancer } from '../agents/seo-content-enhancer';
import { SEOMCPController } from '../agents/seo-mcp-controller';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Vérifie si un chemin existe
 * @param path Chemin à vérifier
 * @returns true si le chemin existe, false sinon
 */
async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Interface pour la configuration du script
 */
interface ScriptConfig {
    baseUrl: string;
    siteName: string;
    sourceDir: string;
    outputDir: string;
    routesDir: string;
    mode: string;
    verbose: boolean;
    dataFile?: string;
    [key: string]: any; // Index signature pour permettre l'accès dynamique aux propriétés
}

// Configuration par défaut
const defaultConfig: ScriptConfig = {
    baseUrl: 'https://www.example.com',
    siteName: 'Mon Site',
    sourceDir: './legacy/php',
    outputDir: './generated/seo',
    routesDir: './app/routes',
    mode: 'migrate', // migrate, routes, data
    verbose: false,
};

// Analyser les arguments de la ligne de commande
function parseArgs(): ScriptConfig {
    const args = process.argv.slice(2);
    const config = { ...defaultConfig };

    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            if (key && value) {
                config[key] = value;
            } else if (key === 'verbose') {
                config.verbose = true;
            }
        }
    });

    return config;
}

// Fonctions principales

/**
 * Mode de migration depuis PHP
 */
async function runPhpMigration(config: ScriptConfig): Promise<void> {
    console.log('🚀 Lancement de la migration SEO depuis PHP...');
    console.log(`📂 Répertoire source: ${config.sourceDir}`);
    console.log(`📂 Répertoire cible: ${config.outputDir}`);

    const agent = new SeoMigrationAgent({
        sourceDir: config.sourceDir,
        outputDir: config.outputDir,
        baseUrl: config.baseUrl,
        siteName: config.siteName,
        verbose: config.verbose,
    });

    // Migrer le répertoire
    const results = await agent.migrateDirectory();

    // Générer les composants Remix pour chaque route migrée avec succès
    console.log('📝 Génération des composants Remix avec métadonnées...');

    const remixDir = path.join(config.outputDir, 'remix-components');
    await fs.mkdir(remixDir, { recursive: true });

    let generatedCount = 0;

    for (const result of results) {
        if (result.success && result.generatedMetadata) {
            const componentCode = agent.generateRemixComponent(
                result.targetRoute,
                result.generatedMetadata
            );

            if (componentCode) {
                const fileName = result.targetRoute.replace(/^\//g, '').replace(/\//g, '_') + '.tsx';
                await fs.writeFile(
                    path.join(remixDir, fileName),
                    componentCode
                );
                generatedCount++;
            }
        }
    }

    console.log(`✅ Migration terminée:`);
    console.log(`   - ${results.length} fichiers PHP traités`);
    console.log(`   - ${results.filter(r => r.success).length} métadonnées extraites`);
    console.log(`   - ${generatedCount} composants Remix générés`);
}

/**
 * Mode de génération pour les routes existantes
 */
async function runRoutesGeneration(config: ScriptConfig): Promise<void> {
    console.log('🚀 Génération des métadonnées pour les routes existantes...');

    const controller = new SEOMCPController({
        baseUrl: config.baseUrl,
        siteName: config.siteName,
        rootDir: process.cwd(),
        routesDir: config.routesDir,
        outputDir: config.outputDir,
        verbose: config.verbose,
    });

    await controller.initialize();
    await controller.generateMetadataForAllRoutes();

    // Générer un rapport
    const report = await controller.generateSeoComplianceReport();

    console.log(`✅ Génération terminée:`);
    console.log(`   - ${report.totalRoutes} routes traitées`);
    console.log(`   - ${report.compliantRoutes} routes conformes aux standards SEO`);
    console.log(`   - ${report.issues.length} routes avec des problèmes SEO`);
}

/**
 * Mode de génération depuis des données spécifiques
 */
async function runDataGeneration(config: ScriptConfig): Promise<void> {
    console.log('🚀 Génération des métadonnées depuis les données...');

    const dataFile = config.dataFile || './data/seo-data.json';
    if (!await pathExists(dataFile)) {
        console.error(`❌ Fichier de données non trouvé: ${dataFile}`);
        process.exit(1);
    }

    const data = JSON.parse(await fs.readFile(dataFile, 'utf-8'));

    const enhancer = new SeoContentEnhancer({
        baseUrl: config.baseUrl,
        siteName: config.siteName,
        outputDir: config.outputDir,
        verbose: config.verbose,
    });

    let generatedCount = 0;

    for (const item of data) {
        const route = item.route || item.path || item.url || '';
        if (!route) {
            console.warn('⚠️ Élément sans route ignoré:', item);
            continue;
        }

        await enhancer.generateMetaForRoute(route, item);
        generatedCount++;
    }

    console.log(`✅ Génération terminée:`);
    console.log(`   - ${generatedCount}/${data.length} métadonnées générées`);
}

// Fonction principale
async function main(): Promise<void> {
    // Analyser les arguments
    const config = parseArgs();

    // Exécuter le mode approprié
    switch (config.mode) {
        case 'migrate':
            await runPhpMigration(config);
            break;

        case 'routes':
            await runRoutesGeneration(config);
            break;

        case 'data':
            await runDataGeneration(config);
            break;

        default:
            console.error(`❌ Mode inconnu: ${config.mode}`);
            console.log('Modes disponibles: migrate, routes, data');
            process.exit(1);
    }
}

// Exécuter le script
main().catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
});