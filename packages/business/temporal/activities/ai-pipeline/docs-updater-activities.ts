/**
 * Activités Temporal pour le Pipeline de Migration IA - Documentation Updater
 * 
 * Ces activités implémentent la mise à jour automatique de la documentation
 * basée sur l'analyse des fichiers PHP et le code généré
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { promisify } from 'util';
import { PhpAnalysisResult } from './php-analyzer-activities';
import { CodeGenerationResult } from './code-generator-activities';

// Utilitaires
const mkdirPromise = promisify(fs.mkdir);
const writeFilePromise = promisify(fs.writeFile);
const readFilePromise = promisify(fs.readFile);
const existsPromise = promisify(fs.exists);

// Types pour les activités
export interface DocumentationOptions {
    outputDir: string;
    format: 'markdown' | 'html' | 'docusaurus';
    templates?: {
        component?: string;
        service?: string;
        model?: string;
        migration?: string;
    };
    metadata?: {
        projectName?: string;
        version?: string;
        author?: string;
        teamId?: string;
    };
    aiEndpoint?: string;
}

export interface DocumentationResult {
    sourcePath: string;
    documentationPath: string;
    sourceType: 'php' | 'typescript' | 'javascript';
    documentationType: 'api' | 'component' | 'service' | 'model' | 'migration';
    content: {
        title: string;
        description: string;
        usage: string;
        apiEndpoints?: string[];
        params?: { name: string; type: string; description: string }[];
        returns?: { type: string; description: string };
        examples?: string[];
        relatedFiles?: string[];
    };
    metadata: {
        generatedAt: string;
        format: string;
        version: string;
        duration: number;
    };
}

export interface BatchDocumentationResult {
    successful: number;
    failed: number;
    results: DocumentationResult[];
    summary: {
        totalFiles: number;
        byType: {
            api: number;
            component: number;
            service: number;
            model: number;
            migration: number;
        };
    };
    indexPath?: string;
}

/**
 * Génère de la documentation à partir d'une analyse PHP
 */
export async function generateDocumentationFromAnalysis(
    analysis: PhpAnalysisResult,
    options: DocumentationOptions
): Promise<DocumentationResult> {
    const startTime = Date.now();
    console.log(`Generating documentation for PHP file ${analysis.file.path}`);

    try {
        // Déterminer le chemin de sortie
        const relativePath = path.relative('/workspaces/cahier-des-charge/app/legacy', analysis.file.directory);
        const outputDirectory = path.join(options.outputDir, 'php', relativePath);

        // Créer le répertoire si nécessaire
        await mkdirPromise(outputDirectory, { recursive: true });

        // Déterminer le nom du fichier de documentation
        const docFilename = `${analysis.file.basename}.${options.format === 'html' ? 'html' : 'md'}`;
        const outputPath = path.join(outputDirectory, docFilename);

        // Lire le code source original
        const sourceCode = await readFilePromise(analysis.file.path, 'utf8');

        try {
            // Déterminer le type de documentation en fonction du contenu
            let documentationType: 'api' | 'component' | 'service' | 'model' | 'migration' = 'service';

            if (analysis.analysis.classes.some(cls => cls.toLowerCase().includes('controller'))) {
                documentationType = 'api';
            } else if (analysis.analysis.classes.some(cls => cls.toLowerCase().includes('component'))) {
                documentationType = 'component';
            } else if (analysis.analysis.classes.some(cls => cls.toLowerCase().includes('model'))) {
                documentationType = 'model';
            } else if (analysis.file.path.includes('migration')) {
                documentationType = 'migration';
            }

            // Appeler le service d'IA pour la génération de documentation
            const response = await axios.post(options.aiEndpoint || 'http://localhost:3000/api/generate-docs', {
                sourceCode,
                analysis,
                options: {
                    format: options.format,
                    templates: options.templates,
                    metadata: options.metadata,
                    documentationType
                }
            });

            const docContent = response.data.documentation || '';

            // Écrire la documentation générée
            await writeFilePromise(outputPath, docContent);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Construire le résultat
            const result: DocumentationResult = {
                sourcePath: analysis.file.path,
                documentationPath: outputPath,
                sourceType: 'php',
                documentationType,
                content: response.data.content || {
                    title: analysis.file.basename,
                    description: '',
                    usage: ''
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    format: options.format,
                    version: response.data.version || '1.0.0',
                    duration
                }
            };

            return result;
        } catch (apiError) {
            console.error(`Error calling documentation generation API: ${apiError}`);

            // Créer un résultat minimal en cas d'erreur
            return {
                sourcePath: analysis.file.path,
                documentationPath: outputPath,
                sourceType: 'php',
                documentationType: 'service',
                content: {
                    title: analysis.file.basename,
                    description: `Documentation non générée : ${apiError.message}`,
                    usage: 'Non disponible'
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    format: options.format,
                    version: '1.0.0',
                    duration: Date.now() - startTime
                }
            };
        }
    } catch (fileError) {
        console.error(`Error reading source file or writing documentation: ${fileError}`);
        throw new Error(`Documentation generation failed: ${fileError.message}`);
    }
}

/**
 * Génère de la documentation à partir d'un code généré
 */
export async function generateDocumentationFromGeneratedCode(
    codeGeneration: CodeGenerationResult,
    options: DocumentationOptions
): Promise<DocumentationResult> {
    const startTime = Date.now();
    console.log(`Generating documentation for generated file ${codeGeneration.generatedPath}`);

    try {
        // Déterminer le chemin de sortie
        const relativePath = path.relative('/workspaces/cahier-des-charge/app/migrated', path.dirname(codeGeneration.generatedPath));
        const outputDirectory = path.join(options.outputDir, 'generated', relativePath);

        // Créer le répertoire si nécessaire
        await mkdirPromise(outputDirectory, { recursive: true });

        // Déterminer le nom du fichier de documentation
        const baseName = path.basename(codeGeneration.generatedPath).replace(/\.[^/.]+$/, '');
        const docFilename = `${baseName}.${options.format === 'html' ? 'html' : 'md'}`;
        const outputPath = path.join(outputDirectory, docFilename);

        // Vérifier si le fichier généré existe
        if (!await existsPromise(codeGeneration.generatedPath)) {
            throw new Error(`Generated file does not exist: ${codeGeneration.generatedPath}`);
        }

        // Lire le code généré
        const generatedCode = await readFilePromise(codeGeneration.generatedPath, 'utf8');

        try {
            // Déterminer le type de documentation en fonction du nom de fichier
            let documentationType: 'api' | 'component' | 'service' | 'model' | 'migration' = 'service';

            if (codeGeneration.generatedFile.name.includes('controller')) {
                documentationType = 'api';
            } else if (codeGeneration.generatedFile.name.includes('component')) {
                documentationType = 'component';
            } else if (codeGeneration.generatedFile.name.includes('model') ||
                codeGeneration.generatedFile.name.includes('entity')) {
                documentationType = 'model';
            } else if (codeGeneration.generatedFile.name.includes('migration')) {
                documentationType = 'migration';
            }

            // Appeler le service d'IA pour la génération de documentation
            const response = await axios.post(options.aiEndpoint || 'http://localhost:3000/api/generate-docs', {
                sourceCode: generatedCode,
                codeGeneration,
                options: {
                    format: options.format,
                    templates: options.templates,
                    metadata: options.metadata,
                    documentationType
                }
            });

            const docContent = response.data.documentation || '';

            // Écrire la documentation générée
            await writeFilePromise(outputPath, docContent);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Déterminer le type de source
            const sourceType =
                codeGeneration.generatedFile.name.endsWith('.ts') ||
                    codeGeneration.generatedFile.name.endsWith('.tsx') ? 'typescript' : 'javascript';

            // Construire le résultat
            const result: DocumentationResult = {
                sourcePath: codeGeneration.generatedPath,
                documentationPath: outputPath,
                sourceType,
                documentationType,
                content: response.data.content || {
                    title: baseName,
                    description: '',
                    usage: ''
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    format: options.format,
                    version: response.data.version || '1.0.0',
                    duration
                }
            };

            return result;
        } catch (apiError) {
            console.error(`Error calling documentation generation API: ${apiError}`);

            // Créer un résultat minimal en cas d'erreur
            return {
                sourcePath: codeGeneration.generatedPath,
                documentationPath: outputPath,
                sourceType: 'typescript',
                documentationType: 'service',
                content: {
                    title: baseName,
                    description: `Documentation non générée : ${apiError.message}`,
                    usage: 'Non disponible'
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    format: options.format,
                    version: '1.0.0',
                    duration: Date.now() - startTime
                }
            };
        }
    } catch (fileError) {
        console.error(`Error reading generated file or writing documentation: ${fileError}`);
        throw new Error(`Documentation generation failed: ${fileError.message}`);
    }
}

/**
 * Génère de la documentation pour un ensemble de fichiers
 */
export async function batchGenerateDocumentation(
    items: Array<PhpAnalysisResult | CodeGenerationResult>,
    options: DocumentationOptions & { concurrency?: number }
): Promise<BatchDocumentationResult> {
    const { concurrency = 3 } = options;
    console.log(`Batch generating documentation for ${items.length} files with concurrency ${concurrency}`);

    // Créer le répertoire de sortie
    await mkdirPromise(options.outputDir, { recursive: true });

    const results: DocumentationResult[] = [];
    let successful = 0;
    let failed = 0;

    // Traiter les fichiers par lots
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);

        const batchPromises = batch.map(item => {
            // Déterminer le type d'item
            const isAnalysis = 'analysis' in item;

            return (isAnalysis
                ? generateDocumentationFromAnalysis(item as PhpAnalysisResult, options)
                : generateDocumentationFromGeneratedCode(item as CodeGenerationResult, options))
                .then(result => {
                    successful++;
                    return result;
                })
                .catch(error => {
                    failed++;
                    console.error(`Failed to generate documentation for ${isAnalysis ?
                        (item as PhpAnalysisResult).file.path :
                        (item as CodeGenerationResult).generatedPath}: ${error}`);

                    // Renvoyer un résultat d'erreur
                    return {
                        sourcePath: isAnalysis ?
                            (item as PhpAnalysisResult).file.path :
                            (item as CodeGenerationResult).generatedPath,
                        documentationPath: '',
                        sourceType: isAnalysis ? 'php' : 'typescript',
                        documentationType: 'service',
                        content: {
                            title: isAnalysis ?
                                (item as PhpAnalysisResult).file.basename :
                                path.basename((item as CodeGenerationResult).generatedFile.name),
                            description: `Documentation non générée : ${error.message}`,
                            usage: 'Non disponible'
                        },
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            format: options.format,
                            version: '1.0.0',
                            duration: 0
                        }
                    } as DocumentationResult;
                });
        });

        // Attendre que tous les fichiers du lot soient traités
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        console.log(`Processed batch ${i / concurrency + 1}/${Math.ceil(items.length / concurrency)}`);
    }

    // Générer un résumé
    const byType = {
        api: results.filter(r => r.documentationType === 'api').length,
        component: results.filter(r => r.documentationType === 'component').length,
        service: results.filter(r => r.documentationType === 'service').length,
        model: results.filter(r => r.documentationType === 'model').length,
        migration: results.filter(r => r.documentationType === 'migration').length
    };

    // Créer un index
    let indexPath: string | undefined;
    if (results.length > 0) {
        const indexFilename = options.format === 'html' ? 'index.html' : 'README.md';
        indexPath = path.join(options.outputDir, indexFilename);

        const indexContent = options.format === 'html' ?
            generateHtmlIndex(results, options) :
            generateMarkdownIndex(results, options);

        await writeFilePromise(indexPath, indexContent);
    }

    console.log(`Documentation generation completed. Successful: ${successful}, Failed: ${failed}`);

    return {
        successful,
        failed,
        results,
        summary: {
            totalFiles: results.length,
            byType
        },
        indexPath
    };
}

/**
 * Génère un index en format Markdown
 */
function generateMarkdownIndex(
    results: DocumentationResult[],
    options: DocumentationOptions
): string {
    const projectName = options.metadata?.projectName || 'Projet de Migration';
    const version = options.metadata?.version || '1.0.0';

    let index = `# Documentation de ${projectName} v${version}\n\n`;
    index += `Générée le ${new Date().toISOString()}\n\n`;

    // Ajouter une section pour chaque type de documentation
    if (results.filter(r => r.documentationType === 'api').length > 0) {
        index += `## API\n\n`;
        results
            .filter(r => r.documentationType === 'api')
            .forEach(result => {
                index += `- [${result.content.title}](${path.relative(options.outputDir, result.documentationPath)}) - ${result.content.description}\n`;
            });
        index += `\n`;
    }

    if (results.filter(r => r.documentationType === 'component').length > 0) {
        index += `## Composants\n\n`;
        results
            .filter(r => r.documentationType === 'component')
            .forEach(result => {
                index += `- [${result.content.title}](${path.relative(options.outputDir, result.documentationPath)}) - ${result.content.description}\n`;
            });
        index += `\n`;
    }

    if (results.filter(r => r.documentationType === 'service').length > 0) {
        index += `## Services\n\n`;
        results
            .filter(r => r.documentationType === 'service')
            .forEach(result => {
                index += `- [${result.content.title}](${path.relative(options.outputDir, result.documentationPath)}) - ${result.content.description}\n`;
            });
        index += `\n`;
    }

    if (results.filter(r => r.documentationType === 'model').length > 0) {
        index += `## Modèles\n\n`;
        results
            .filter(r => r.documentationType === 'model')
            .forEach(result => {
                index += `- [${result.content.title}](${path.relative(options.outputDir, result.documentationPath)}) - ${result.content.description}\n`;
            });
        index += `\n`;
    }

    if (results.filter(r => r.documentationType === 'migration').length > 0) {
        index += `## Migrations\n\n`;
        results
            .filter(r => r.documentationType === 'migration')
            .forEach(result => {
                index += `- [${result.content.title}](${path.relative(options.outputDir, result.documentationPath)}) - ${result.content.description}\n`;
            });
        index += `\n`;
    }

    return index;
}

/**
 * Génère un index en format HTML
 */
function generateHtmlIndex(
    results: DocumentationResult[],
    options: DocumentationOptions
): string {
    const projectName = options.metadata?.projectName || 'Projet de Migration';
    const version = options.metadata?.version || '1.0.0';

    let index = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation ${projectName} v${version}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #444; margin-top: 30px; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .section { margin-bottom: 40px; }
    .item { margin: 10px 0; }
    .type-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 10px;
    }
    .api { background-color: #61affe; color: #fff; }
    .component { background-color: #49cc90; color: #fff; }
    .service { background-color: #fca130; color: #fff; }
    .model { background-color: #f93e3e; color: #fff; }
    .migration { background-color: #9012fe; color: #fff; }
  </style>
</head>
<body>
  <h1>Documentation de ${projectName} v${version}</h1>
  <p>Générée le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}</p>
`;

    // Ajouter une section pour chaque type de documentation
    const types = [
        { type: 'api', label: 'API' },
        { type: 'component', label: 'Composants' },
        { type: 'service', label: 'Services' },
        { type: 'model', label: 'Modèles' },
        { type: 'migration', label: 'Migrations' }
    ];

    for (const { type, label } of types) {
        const typeResults = results.filter(r => r.documentationType === type);

        if (typeResults.length > 0) {
            index += `  <div class="section">
    <h2>${label}</h2>
`;

            for (const result of typeResults) {
                index += `    <div class="item">
      <span class="type-badge ${type}">${type}</span>
      <a href="${path.relative(options.outputDir, result.documentationPath)}">${result.content.title}</a> - ${result.content.description}
    </div>
`;
            }

            index += `  </div>
`;
        }
    }

    index += `</body>
</html>`;

    return index;
}

/**
 * Crée un rapport de génération de documentation
 */
export async function createDocumentationReport(
    result: BatchDocumentationResult,
    outputPath?: string
): Promise<{ reportPath: string }> {
    const defaultOutputPath = '/workspaces/cahier-des-charge/reports/documentation-report.md';
    const reportPath = outputPath || defaultOutputPath;

    console.log(`Creating documentation generation report at ${reportPath}`);

    // Créer le répertoire si nécessaire
    await mkdirPromise(path.dirname(reportPath), { recursive: true });

    // Générer le rapport en Markdown
    const report = `# Rapport de Génération de Documentation
  
## Résumé

- **Date de génération**: ${new Date().toISOString()}
- **Nombre total de fichiers**: ${result.summary.totalFiles}
- **Fichiers générés avec succès**: ${result.successful}
- **Échecs**: ${result.failed}

## Distribution par type

- **API**: ${result.summary.byType.api} fichiers
- **Composants**: ${result.summary.byType.component} fichiers
- **Services**: ${result.summary.byType.service} fichiers
- **Modèles**: ${result.summary.byType.model} fichiers
- **Migrations**: ${result.summary.byType.migration} fichiers

## Index de la documentation

${result.indexPath ? `La page d'index de la documentation est disponible à : [${result.indexPath}](${result.indexPath})` : "Pas d'index généré"}

## Fichiers documentés

${result.results.slice(0, 20).map(file => `
### ${file.content.title}

- **Source**: ${file.sourcePath}
- **Documentation**: ${file.documentationPath}
- **Type**: ${file.documentationType}
- **Description**: ${file.content.description}
`).join('\n')}

${result.results.length > 20 ? `\n...et ${result.results.length - 20} autres fichiers non affichés...\n` : ''}
`;

    // Écrire le rapport
    await writeFilePromise(reportPath, report);

    return { reportPath };
}