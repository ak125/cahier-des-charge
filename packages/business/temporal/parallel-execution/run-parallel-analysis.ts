/**
 * Script d'exécution parallèle pour comparer n8n et Temporal
 * 
 * Ce script exécute simultanément le workflow n8n "SQL Analyzer & Prisma Builder"
 * et sa version Temporal pour comparer les résultats et valider la migration.
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { promisify } from 'util';
import { exec } from 'child_process';
import { getSQLAnalyzer } from '../client/sql-analyzer-client';
import { Connection } from '@temporalio/client';

const execPromise = promisify(exec);
const writeFilePromise = promisify(fs.writeFile);
const mkdirPromise = promisify(fs.mkdir);

// Configuration
interface ParallelExecutionConfig {
    connectionString: string;
    databaseName: string;
    dialect: 'mysql' | 'postgres' | 'mssql';
    outputBaseDir: string;
    n8nUrl: string;
    n8nApiKey?: string;
    includeTables?: string[];
    excludeTables?: string[];
    generatePrisma?: boolean;
    analyzePerformance?: boolean;
    validateSchema?: boolean;
}

// Résultats de comparaison
interface ComparisonResult {
    success: boolean;
    n8nExecutionTime: number;
    temporalExecutionTime: number;
    n8nOutputDir: string;
    temporalOutputDir: string;
    fileComparison: {
        onlyInN8n: string[];
        onlyInTemporal: string[];
        inBoth: string[];
        contentDifferences: {
            file: string;
            differences: string;
        }[];
    };
    summary: string;
    executedAt: string;
}

/**
 * Exécute le workflow n8n via son API
 */
async function executeN8nWorkflow(config: ParallelExecutionConfig): Promise<{
    success: boolean;
    outputDir: string;
    executionTime: number;
    executionId: string;
}> {
    console.log('Exécution du workflow n8n...');
    const startTime = Date.now();

    try {
        // Préparer le payload pour l'API n8n
        const payload = {
            databaseName: config.databaseName,
            connectionString: config.connectionString,
            includeTables: config.includeTables || [],
            excludeTables: config.excludeTables || ['migrations', 'schema_migrations', 'ar_internal_metadata'],
            schemaOnly: true,
            generatePrismaSchema: config.generatePrisma !== false,
            analyzePerformance: config.analyzePerformance !== false,
            outputDir: path.join(config.outputBaseDir, 'n8n-output'),
        };

        // Appeler le webhook n8n
        const response = await axios.post(
            `${config.n8nUrl}/webhook/analyze-sql-prisma`,
            payload,
            {
                headers: config.n8nApiKey ? {
                    'X-N8N-API-KEY': config.n8nApiKey
                } : {}
            }
        );

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        if (response.data.status === 'success') {
            return {
                success: true,
                outputDir: response.data.summary.outputDirectory,
                executionTime,
                executionId: response.data.summary.executionId || `n8n-${Date.now()}`
            };
        } else {
            console.error('Erreur lors de l\'exécution du workflow n8n:', response.data.message);
            return {
                success: false,
                outputDir: '',
                executionTime,
                executionId: `n8n-error-${Date.now()}`
            };
        }
    } catch (error) {
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        console.error('Erreur lors de l\'appel au webhook n8n:', error.message);

        return {
            success: false,
            outputDir: '',
            executionTime,
            executionId: `n8n-error-${Date.now()}`
        };
    }
}

/**
 * Exécute le workflow Temporal
 */
async function executeTemporalWorkflow(config: ParallelExecutionConfig): Promise<{
    success: boolean;
    outputDir: string;
    executionTime: number;
    workflowId: string;
}> {
    console.log('Exécution du workflow Temporal...');
    const startTime = Date.now();

    try {
        // Créer le répertoire de sortie
        const outputDir = path.join(config.outputBaseDir, 'temporal-output');
        await mkdirPromise(outputDir, { recursive: true });

        // Obtenir l'instance du client SQL Analyzer
        const sqlAnalyzer = await getSQLAnalyzer();

        // Exécuter le workflow
        const workflowId = await sqlAnalyzer.analyze({
            connectionString: config.connectionString,
            dialect: config.dialect,
            databaseName: config.databaseName,
            tables: config.includeTables,
            excludeTables: config.excludeTables,
            outputDir: outputDir,
            schemaOnly: true,
            generatePrisma: config.generatePrisma !== false,
            analyzePerformance: config.analyzePerformance !== false,
            validateSchema: config.validateSchema || false,
            applyMigration: false,
            commitToGit: false,
            createArchive: true
        });

        // Attendre que le workflow soit terminé
        let result;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes avec un délai de 5 secondes

        while (attempts < maxAttempts) {
            result = await sqlAnalyzer.getStatus(workflowId);
            if (result.status === 'completed' || result.status === 'error') {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5 secondes
            attempts++;
        }

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        if (result.status === 'completed') {
            return {
                success: true,
                outputDir: result.outputDir || outputDir,
                executionTime,
                workflowId
            };
        } else {
            console.error('Erreur lors de l\'exécution du workflow Temporal:', result.message);
            return {
                success: false,
                outputDir: result.outputDir || outputDir,
                executionTime,
                workflowId
            };
        }
    } catch (error) {
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        console.error('Erreur lors de l\'exécution du workflow Temporal:', error);

        return {
            success: false,
            outputDir: '',
            executionTime,
            workflowId: `temporal-error-${Date.now()}`
        };
    }
}

/**
 * Compare les fichiers générés par n8n et Temporal
 */
async function compareResults(n8nOutputDir: string, temporalOutputDir: string): Promise<ComparisonResult['fileComparison']> {
    console.log('Comparaison des fichiers générés...');

    if (!fs.existsSync(n8nOutputDir) || !fs.existsSync(temporalOutputDir)) {
        throw new Error('Les répertoires de sortie n\'existent pas');
    }

    // Lister les fichiers dans chaque répertoire
    const n8nFiles = fs.readdirSync(n8nOutputDir).filter(file => !file.startsWith('.'));
    const temporalFiles = fs.readdirSync(temporalOutputDir).filter(file => !file.startsWith('.'));

    // Identifier les fichiers uniques et communs
    const onlyInN8n = n8nFiles.filter(file => !temporalFiles.includes(file));
    const onlyInTemporal = temporalFiles.filter(file => !n8nFiles.includes(file));
    const inBoth = n8nFiles.filter(file => temporalFiles.includes(file));

    // Comparer le contenu des fichiers communs
    const contentDifferences: { file: string; differences: string }[] = [];

    for (const file of inBoth) {
        const n8nFilePath = path.join(n8nOutputDir, file);
        const temporalFilePath = path.join(temporalOutputDir, file);

        // Ignorer les répertoires
        if (fs.statSync(n8nFilePath).isDirectory() || fs.statSync(temporalFilePath).isDirectory()) {
            continue;
        }

        // Comparer avec diff
        try {
            const { stdout } = await execPromise(`diff -u "${n8nFilePath}" "${temporalFilePath}"`);

            // S'il y a des différences, stdout ne sera pas vide
            if (stdout) {
                contentDifferences.push({
                    file,
                    differences: stdout
                });
            }
        } catch (error) {
            // diff renvoie un code d'erreur s'il y a des différences
            if (error.stdout) {
                contentDifferences.push({
                    file,
                    differences: error.stdout
                });
            }
        }
    }

    return {
        onlyInN8n,
        onlyInTemporal,
        inBoth,
        contentDifferences
    };
}

/**
 * Exécute les deux workflows en parallèle et compare les résultats
 */
export async function runParallelAnalysis(config: ParallelExecutionConfig): Promise<ComparisonResult> {
    console.log(`Début de l'exécution parallèle pour la base de données: ${config.databaseName}`);

    // Créer le répertoire de base
    await mkdirPromise(config.outputBaseDir, { recursive: true });

    // Exécuter les deux workflows en parallèle
    const [n8nResult, temporalResult] = await Promise.all([
        executeN8nWorkflow(config),
        executeTemporalWorkflow(config)
    ]);

    // Comparer les résultats si les deux exécutions ont réussi
    let fileComparison = {
        onlyInN8n: [],
        onlyInTemporal: [],
        inBoth: [],
        contentDifferences: []
    };

    if (n8nResult.success && temporalResult.success) {
        try {
            fileComparison = await compareResults(n8nResult.outputDir, temporalResult.outputDir);
        } catch (error) {
            console.error('Erreur lors de la comparaison des résultats:', error);
        }
    }

    // Générer le résumé
    const success = n8nResult.success && temporalResult.success &&
        fileComparison.contentDifferences.length === 0;

    const summary = success
        ? 'Les deux workflows ont produit des résultats identiques'
        : 'Des différences ont été détectées entre les résultats des workflows';

    // Créer le résultat de comparaison
    const comparisonResult: ComparisonResult = {
        success,
        n8nExecutionTime: n8nResult.executionTime,
        temporalExecutionTime: temporalResult.executionTime,
        n8nOutputDir: n8nResult.outputDir,
        temporalOutputDir: temporalResult.outputDir,
        fileComparison,
        summary,
        executedAt: new Date().toISOString()
    };

    // Sauvegarder le rapport de comparaison
    const reportPath = path.join(config.outputBaseDir, 'comparison-report.json');
    await writeFilePromise(reportPath, JSON.stringify(comparisonResult, null, 2));

    // Génération du rapport Markdown
    const reportMarkdownPath = path.join(config.outputBaseDir, 'comparison-report.md');
    const markdownReport = generateComparisonMarkdown(comparisonResult);
    await writeFilePromise(reportMarkdownPath, markdownReport);

    console.log(`Comparaison terminée. Rapport sauvegardé dans: ${reportPath}`);
    console.log(`Rapport Markdown sauvegardé dans: ${reportMarkdownPath}`);

    return comparisonResult;
}

/**
 * Génère un rapport de comparaison au format Markdown
 */
function generateComparisonMarkdown(comparison: ComparisonResult): string {
    let markdown = `# Rapport de comparaison des workflows n8n et Temporal\n\n`;
    markdown += `*Exécuté le ${new Date(comparison.executedAt).toLocaleDateString('fr-FR')} à ${new Date(comparison.executedAt).toLocaleTimeString('fr-FR')}*\n\n`;

    // Résumé
    markdown += `## Résumé\n\n`;
    markdown += `- **Statut** : ${comparison.success ? '✅ Succès' : '❌ Échec'}\n`;
    markdown += `- **Résultat** : ${comparison.summary}\n`;
    markdown += `- **Temps d'exécution n8n** : ${(comparison.n8nExecutionTime / 1000).toFixed(2)} secondes\n`;
    markdown += `- **Temps d'exécution Temporal** : ${(comparison.temporalExecutionTime / 1000).toFixed(2)} secondes\n`;
    markdown += `- **Différence de performance** : ${((comparison.n8nExecutionTime - comparison.temporalExecutionTime) / comparison.n8nExecutionTime * 100).toFixed(2)}%\n\n`;

    // Répertoires de sortie
    markdown += `## Répertoires de sortie\n\n`;
    markdown += `- **n8n** : \`${comparison.n8nOutputDir}\`\n`;
    markdown += `- **Temporal** : \`${comparison.temporalOutputDir}\`\n\n`;

    // Comparaison des fichiers
    markdown += `## Comparaison des fichiers\n\n`;
    markdown += `### Statistiques\n\n`;
    markdown += `- Fichiers uniquement dans n8n : ${comparison.fileComparison.onlyInN8n.length}\n`;
    markdown += `- Fichiers uniquement dans Temporal : ${comparison.fileComparison.onlyInTemporal.length}\n`;
    markdown += `- Fichiers présents dans les deux : ${comparison.fileComparison.inBoth.length}\n`;
    markdown += `- Fichiers avec des différences de contenu : ${comparison.fileComparison.contentDifferences.length}\n\n`;

    // Lister les fichiers uniques à n8n
    if (comparison.fileComparison.onlyInN8n.length > 0) {
        markdown += `### Fichiers uniquement dans n8n\n\n`;
        comparison.fileComparison.onlyInN8n.forEach(file => {
            markdown += `- \`${file}\`\n`;
        });
        markdown += `\n`;
    }

    // Lister les fichiers uniques à Temporal
    if (comparison.fileComparison.onlyInTemporal.length > 0) {
        markdown += `### Fichiers uniquement dans Temporal\n\n`;
        comparison.fileComparison.onlyInTemporal.forEach(file => {
            markdown += `- \`${file}\`\n`;
        });
        markdown += `\n`;
    }

    // Lister les différences de contenu
    if (comparison.fileComparison.contentDifferences.length > 0) {
        markdown += `### Différences de contenu\n\n`;
        comparison.fileComparison.contentDifferences.forEach(diff => {
            markdown += `#### \`${diff.file}\`\n\n`;
            markdown += "```diff\n";
            markdown += diff.differences;
            markdown += "\n```\n\n";
        });
    }

    return markdown;
}

// Si le script est exécuté directement
if (require.main === module) {
    // Lire la configuration depuis les arguments ou un fichier
    const configPath = process.argv[2] || '/workspaces/cahier-des-charge/packages/business/temporal/parallel-execution/config.json';

    if (!fs.existsSync(configPath)) {
        console.error(`Le fichier de configuration n'existe pas: ${configPath}`);
        process.exit(1);
    }

    const config: ParallelExecutionConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Exécuter l'analyse parallèle
    runParallelAnalysis(config)
        .then(result => {
            console.log(`Exécution parallèle terminée avec succès: ${result.success}`);
            console.log(`Différence de performance: ${((result.n8nExecutionTime - result.temporalExecutionTime) / result.n8nExecutionTime * 100).toFixed(2)}%`);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Erreur lors de l\'exécution parallèle:', error);
            process.exit(1);
        });
}