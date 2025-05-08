/**
 * Activités Temporal pour le Pipeline de Migration IA - Code Generator
 * 
 * Ces activités implémentent la génération automatique de code
 * à partir de l'analyse de fichiers PHP
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { promisify } from 'util';
import { PhpAnalysisResult, PhpFile } from './php-analyzer-activities';

// Utilitaires
const mkdirPromise = promisify(fs.mkdir);
const writeFilePromise = promisify(fs.writeFile);
const readFilePromise = promisify(fs.readFile);

// Types pour les activités
export interface GeneratedFile {
    name: string;
    content: string;
    type: 'component' | 'controller' | 'service' | 'model' | 'test' | 'migration' | 'other';
    framework: 'react' | 'nestjs' | 'remix' | 'nextjs' | 'prisma' | 'other';
}

export interface CodeGenerationResult {
    originalFile: PhpFile;
    generatedFile: GeneratedFile;
    generatedPath: string;
    migrationNotes: string[];
    successfulGeneration: boolean;
    metadata: {
        generatedAt: string;
        version: string;
        duration: number;
    };
}

export interface CodeGenerationOptions {
    outputDir: string;
    framework: 'nestjs' | 'remix' | 'nextjs' | 'prisma';
    includeTests: boolean;
    aiEndpoint?: string;
    templateDir?: string;
    modelMapping?: Record<string, string>;
    routeMapping?: Record<string, string>;
}

export interface BatchCodeGenerationResult {
    successful: number;
    failed: number;
    results: CodeGenerationResult[];
    summary: {
        totalFiles: number;
        byType: Record<string, number>;
        byFramework: Record<string, number>;
    };
}

/**
 * Détermine le type de fichier PHP 
 */
export function determinePhpFileType(phpAnalysis: PhpAnalysisResult): {
    type: 'component' | 'controller' | 'service' | 'model' | 'test' | 'migration' | 'other';
    framework: 'react' | 'nestjs' | 'remix' | 'nextjs' | 'prisma' | 'other';
} {
    const { classes, functions, dependencies } = phpAnalysis.analysis;
    const filePath = phpAnalysis.file.path.toLowerCase();
    const fileName = phpAnalysis.file.filename.toLowerCase();

    // Déterminer le type
    let type: 'component' | 'controller' | 'service' | 'model' | 'test' | 'migration' | 'other' = 'other';

    if (fileName.includes('test') || fileName.includes('spec')) {
        type = 'test';
    } else if (classes.some(cls => cls.toLowerCase().includes('controller'))) {
        type = 'controller';
    } else if (classes.some(cls => cls.toLowerCase().includes('component'))) {
        type = 'component';
    } else if (classes.some(cls =>
        cls.toLowerCase().includes('model') ||
        cls.toLowerCase().includes('entity') ||
        cls.toLowerCase().includes('table')
    )) {
        type = 'model';
    } else if (filePath.includes('migration') || fileName.includes('migration')) {
        type = 'migration';
    } else if (classes.some(cls => cls.toLowerCase().includes('service'))) {
        type = 'service';
    }

    // Déterminer le framework
    let framework: 'react' | 'nestjs' | 'remix' | 'nextjs' | 'prisma' | 'other' = 'other';

    if (dependencies.some(dep => dep.toLowerCase().includes('react'))) {
        framework = 'react';
    } else if (dependencies.some(dep => dep.toLowerCase().includes('@nestjs'))) {
        framework = 'nestjs';
    } else if (dependencies.some(dep => dep.toLowerCase().includes('@remix-run'))) {
        framework = 'remix';
    } else if (dependencies.some(dep => dep.toLowerCase().includes('next'))) {
        framework = 'nextjs';
    } else if (
        dependencies.some(dep => dep.toLowerCase().includes('prisma')) ||
        type === 'model'
    ) {
        framework = 'prisma';
    }

    return { type, framework };
}

/**
 * Génère un fichier de code à partir d'une analyse PHP
 */
export async function generateCodeFromAnalysis(
    phpAnalysis: PhpAnalysisResult,
    options: CodeGenerationOptions
): Promise<CodeGenerationResult> {
    const startTime = Date.now();
    console.log(`Generating code from PHP analysis for ${phpAnalysis.file.path}`);

    try {
        // Déterminer le chemin de sortie
        const relativePath = path.relative('/workspaces/cahier-des-charge/app/legacy', phpAnalysis.file.directory);
        const outputDirectory = path.join(options.outputDir, relativePath);

        // Créer le répertoire si nécessaire
        await mkdirPromise(outputDirectory, { recursive: true });

        // Lire le code source original
        const sourceCode = await readFilePromise(phpAnalysis.file.path, 'utf8');

        // Déterminer le type de fichier
        const { type, framework } = determinePhpFileType(phpAnalysis);

        // Déterminer le framework cible
        const targetFramework = options.framework;

        // Construire le nom de fichier généré
        let generatedFileName = phpAnalysis.file.basename;

        // Ajuster l'extension selon le framework
        let extension = '.ts';
        if (targetFramework === 'remix' || targetFramework === 'nextjs') {
            if (type === 'component') {
                extension = '.tsx';
            } else if (type === 'controller') {
                generatedFileName = 'route';
                extension = targetFramework === 'remix' ? '.tsx' : '.ts';
            }
        } else if (targetFramework === 'nestjs') {
            // NestJS naming conventions
            switch (type) {
                case 'controller':
                    generatedFileName += '.controller';
                    break;
                case 'service':
                    generatedFileName += '.service';
                    break;
                case 'model':
                    generatedFileName += '.entity';
                    break;
            }
        } else if (targetFramework === 'prisma' && type === 'model') {
            extension = '.prisma';
        }

        const outputPath = path.join(outputDirectory, generatedFileName + extension);

        try {
            // Appeler le service d'IA pour la génération de code
            const response = await axios.post(
                options.aiEndpoint || 'http://localhost:3000/api/generate-code',
                {
                    sourceCode,
                    analysis: phpAnalysis,
                    options: {
                        targetFramework,
                        type,
                        includeTests: options.includeTests,
                        templateDir: options.templateDir,
                        modelMapping: options.modelMapping,
                        routeMapping: options.routeMapping
                    }
                }
            );

            const generatedContent = response.data.code || '';
            const migrationNotes = response.data.notes || [];

            // Écrire le code généré
            await writeFilePromise(outputPath, generatedContent);

            // Générer les tests si demandé
            if (options.includeTests && response.data.testCode) {
                const testFileName = generatedFileName + '.test' + extension;
                const testOutputPath = path.join(outputDirectory, '__tests__', testFileName);

                // Créer le répertoire de tests
                await mkdirPromise(path.dirname(testOutputPath), { recursive: true });

                // Écrire le test
                await writeFilePromise(testOutputPath, response.data.testCode);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Construire le résultat
            const generatedFile: GeneratedFile = {
                name: generatedFileName + extension,
                content: generatedContent,
                type,
                framework: targetFramework
            };

            const result: CodeGenerationResult = {
                originalFile: phpAnalysis.file,
                generatedFile,
                generatedPath: outputPath,
                migrationNotes,
                successfulGeneration: true,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    version: response.data.version || '1.0.0',
                    duration
                }
            };

            return result;
        } catch (apiError) {
            console.error(`Error calling code generation API: ${apiError}`);

            // Créer un résultat minimal en cas d'erreur
            return {
                originalFile: phpAnalysis.file,
                generatedFile: {
                    name: generatedFileName + extension,
                    content: `// Code generation failed: ${apiError.message}\n// Original file: ${phpAnalysis.file.path}`,
                    type,
                    framework: targetFramework
                },
                generatedPath: outputPath,
                migrationNotes: [`Échec de la génération: ${apiError.message}`],
                successfulGeneration: false,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    version: '1.0.0',
                    duration: Date.now() - startTime
                }
            };
        }
    } catch (fileError) {
        console.error(`Error reading source file or writing generated code: ${fileError}`);
        throw new Error(`Code generation failed: ${fileError.message}`);
    }
}

/**
 * Génère du code pour un ensemble de fichiers PHP
 */
export async function batchGenerateCode(
    analysisResults: PhpAnalysisResult[],
    options: CodeGenerationOptions & { concurrency?: number }
): Promise<BatchCodeGenerationResult> {
    const { concurrency = 3 } = options;
    console.log(`Batch generating code for ${analysisResults.length} PHP files with concurrency ${concurrency}`);

    // Créer le répertoire de sortie
    await mkdirPromise(options.outputDir, { recursive: true });

    const results: CodeGenerationResult[] = [];
    let successful = 0;
    let failed = 0;

    // Traiter les analyses par lots
    for (let i = 0; i < analysisResults.length; i += concurrency) {
        const batch = analysisResults.slice(i, i + concurrency);

        const batchPromises = batch.map(analysis =>
            generateCodeFromAnalysis(analysis, options)
                .then(result => {
                    if (result.successfulGeneration) {
                        successful++;
                    } else {
                        failed++;
                    }
                    return result;
                })
                .catch(error => {
                    failed++;
                    console.error(`Failed to generate code for ${analysis.file.path}: ${error}`);

                    // Renvoyer un résultat d'erreur
                    return {
                        originalFile: analysis.file,
                        generatedFile: {
                            name: analysis.file.basename + '.ts',
                            content: `// Code generation failed: ${error.message}\n// Original file: ${analysis.file.path}`,
                            type: 'other',
                            framework: options.framework
                        },
                        generatedPath: path.join(options.outputDir, analysis.file.basename + '.ts'),
                        migrationNotes: [`Échec de la génération: ${error.message}`],
                        successfulGeneration: false,
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            version: '1.0.0',
                            duration: 0
                        }
                    } as CodeGenerationResult;
                })
        );

        // Attendre que tous les fichiers du lot soient générés
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        console.log(`Processed batch ${i / concurrency + 1}/${Math.ceil(analysisResults.length / concurrency)}`);
    }

    // Calculer des statistiques
    const byType: Record<string, number> = {};
    const byFramework: Record<string, number> = {};

    results.forEach(result => {
        byType[result.generatedFile.type] = (byType[result.generatedFile.type] || 0) + 1;
        byFramework[result.generatedFile.framework] = (byFramework[result.generatedFile.framework] || 0) + 1;
    });

    console.log(`Code generation completed. Successful: ${successful}, Failed: ${failed}`);

    return {
        successful,
        failed,
        results,
        summary: {
            totalFiles: results.length,
            byType,
            byFramework
        }
    };
}

/**
 * Crée un rapport de génération de code
 */
export async function createCodeGenerationReport(
    result: BatchCodeGenerationResult,
    outputPath?: string
): Promise<{ reportPath: string }> {
    const defaultOutputPath = '/workspaces/cahier-des-charge/reports/code-generation-report.md';
    const reportPath = outputPath || defaultOutputPath;

    console.log(`Creating code generation report at ${reportPath}`);

    // Créer le répertoire si nécessaire
    await mkdirPromise(path.dirname(reportPath), { recursive: true });

    // Générer le rapport en Markdown
    const report = `# Rapport de Génération de Code
  
## Résumé

- **Date de génération**: ${new Date().toISOString()}
- **Nombre total de fichiers**: ${result.summary.totalFiles}
- **Fichiers générés avec succès**: ${result.successful}
- **Échecs**: ${result.failed}

## Distribution par type

${Object.entries(result.summary.byType)
            .map(([type, count]) => `- **${type}**: ${count} fichiers`)
            .join('\n')}

## Distribution par framework

${Object.entries(result.summary.byFramework)
            .map(([framework, count]) => `- **${framework}**: ${count} fichiers`)
            .join('\n')}

## Fichiers générés

${result.results.filter(r => r.successfulGeneration).slice(0, 20).map(file => `
### ${file.originalFile.basename} → ${file.generatedFile.name}

- **Type**: ${file.generatedFile.type}
- **Framework**: ${file.generatedFile.framework}
- **Chemin original**: ${file.originalFile.path}
- **Chemin généré**: ${file.generatedPath}
- **Notes de migration**:
  ${file.migrationNotes.length > 0
                    ? file.migrationNotes.map(note => `  - ${note}`).join('\n')
                    : '  - Aucune note de migration'}
`).join('\n')}

${result.results.filter(r => r.successfulGeneration).length > 20
            ? `\n...et ${result.results.filter(r => r.successfulGeneration).length - 20} autres fichiers générés avec succès non affichés...\n`
            : ''}

## Fichiers avec échec de génération

${result.results.filter(r => !r.successfulGeneration).map(file => `
- **${file.originalFile.basename}**: ${file.migrationNotes.join(' ')}
`).join('\n')}
`;

    // Écrire le rapport
    await writeFilePromise(reportPath, report);

    return { reportPath };
}