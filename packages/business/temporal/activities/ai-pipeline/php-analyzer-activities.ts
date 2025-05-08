/**
 * Activités Temporal pour le Pipeline de Migration IA - PHP Analyzer
 * 
 * Ces activités remplacent le workflow n8n "Pipeline de Migration IA"
 * qui était utilisé pour analyser les fichiers PHP et générer du code.
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { promisify } from 'util';
import glob from 'glob';

// Utilitaires
const globPromise = promisify(glob);
const mkdirPromise = promisify(fs.mkdir);
const writeFilePromise = promisify(fs.writeFile);
const readFilePromise = promisify(fs.readFile);

// Types pour les activités
export interface PhpFile {
    path: string;
    filename: string;
    basename: string;
    extension: string;
    directory: string;
}

export interface PhpAnalysisResult {
    file: PhpFile;
    analysis: {
        classes: string[];
        functions: string[];
        dependencies: string[];
        complexity: number;
        loc: number;
        issues: {
            type: string;
            message: string;
            line: number;
            severity: 'error' | 'warning' | 'info';
        }[];
        migrationEstimate: {
            difficulty: 'simple' | 'medium' | 'complex';
            timeEstimate: number; // en heures
            potentialIssues: string[];
        };
    };
    metadata: {
        analyzedAt: string;
        analysisVersion: string;
        duration: number; // en ms
    };
}

export interface ListFilesOptions {
    path: string;
    fileExtensions: string[];
    recursive?: boolean;
    exclude?: string[];
    limit?: number;
}

export interface AnalyzePhpOptions {
    filePath: string;
    analyzerEndpoint?: string;
    settings?: {
        complexity?: boolean;
        dependencies?: boolean;
        suggestions?: boolean;
    };
}

export interface SaveAnalysisOptions {
    analysis: PhpAnalysisResult;
    outputPath?: string;
    createPath?: boolean;
    encoding?: string;
}

/**
 * Liste les fichiers PHP dans un répertoire
 */
export async function listPhpFiles(options: ListFilesOptions): Promise<PhpFile[]> {
    const {
        path: dirPath,
        fileExtensions,
        recursive = true,
        exclude = [],
        limit
    } = options;

    console.log(`Listing PHP files in ${dirPath}`);

    // Construire le pattern de recherche
    const globPattern = recursive
        ? `${dirPath}/**/*.+(${fileExtensions.join('|')})`
        : `${dirPath}/*.+(${fileExtensions.join('|')})`;

    // Trouver tous les fichiers
    let files = await globPromise(globPattern, { nodir: true });

    // Filtrer les fichiers exclus
    if (exclude && exclude.length > 0) {
        const excludePatterns = exclude.map(pattern => new RegExp(pattern));
        files = files.filter(file => !excludePatterns.some(pattern => pattern.test(file)));
    }

    // Limiter le nombre de fichiers si nécessaire
    if (limit && files.length > limit) {
        files = files.slice(0, limit);
    }

    // Transformer en objets PhpFile
    const phpFiles: PhpFile[] = files.map(filePath => {
        const parsedPath = path.parse(filePath);
        return {
            path: filePath,
            filename: parsedPath.base,
            basename: parsedPath.name,
            extension: parsedPath.ext.slice(1),
            directory: parsedPath.dir
        };
    });

    console.log(`Found ${phpFiles.length} PHP files`);
    return phpFiles;
}

/**
 * Analyse un fichier PHP
 */
export async function analyzePhpFile(options: AnalyzePhpOptions): Promise<PhpAnalysisResult> {
    const {
        filePath,
        analyzerEndpoint = 'http://localhost:3000/api/analyze-php',
        settings = { complexity: true, dependencies: true, suggestions: true }
    } = options;

    console.log(`Analyzing PHP file: ${filePath}`);
    const startTime = Date.now();

    try {
        // Lire le contenu du fichier
        const fileContent = await readFilePromise(filePath, 'utf8');

        // Créer l'objet PhpFile
        const parsedPath = path.parse(filePath);
        const phpFile: PhpFile = {
            path: filePath,
            filename: parsedPath.base,
            basename: parsedPath.name,
            extension: parsedPath.ext.slice(1),
            directory: parsedPath.dir
        };

        try {
            // Appeler le service d'analyse PHP
            const response = await axios.post(analyzerEndpoint, {
                file: phpFile,
                content: fileContent,
                settings
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Construire le résultat
            const result: PhpAnalysisResult = {
                file: phpFile,
                analysis: response.data.analysis || {
                    classes: [],
                    functions: [],
                    dependencies: [],
                    complexity: 0,
                    loc: 0,
                    issues: [],
                    migrationEstimate: {
                        difficulty: 'simple',
                        timeEstimate: 0,
                        potentialIssues: []
                    }
                },
                metadata: {
                    analyzedAt: new Date().toISOString(),
                    analysisVersion: response.data.version || '1.0.0',
                    duration
                }
            };

            return result;
        } catch (apiError) {
            console.error(`Error calling PHP analyzer API: ${apiError}`);

            // Créer un résultat minimal en cas d'erreur
            return {
                file: phpFile,
                analysis: {
                    classes: [],
                    functions: [],
                    dependencies: [],
                    complexity: 0,
                    loc: fileContent.split('\n').length,
                    issues: [{
                        type: 'error',
                        message: `Failed to analyze file: ${apiError.message}`,
                        line: 1,
                        severity: 'error'
                    }],
                    migrationEstimate: {
                        difficulty: 'medium',
                        timeEstimate: 1,
                        potentialIssues: [`Analysis failed: ${apiError.message}`]
                    }
                },
                metadata: {
                    analyzedAt: new Date().toISOString(),
                    analysisVersion: '1.0.0',
                    duration: Date.now() - startTime
                }
            };
        }
    } catch (fileError) {
        console.error(`Error reading PHP file: ${fileError}`);
        throw new Error(`Could not read PHP file: ${fileError.message}`);
    }
}

/**
 * Sauvegarde les résultats d'analyse
 */
export async function saveAnalysisResult(options: SaveAnalysisOptions): Promise<string> {
    const {
        analysis,
        outputPath,
        createPath = true,
        encoding = 'utf8'
    } = options;

    // Déterminer le chemin de sortie
    const defaultOutputDir = '/workspaces/cahier-des-charge/reports/analysis';
    const outputFilePath = outputPath ||
        path.join(defaultOutputDir, `${analysis.file.basename}.json`);

    console.log(`Saving analysis result to ${outputFilePath}`);

    try {
        // Créer le répertoire si nécessaire
        if (createPath) {
            await mkdirPromise(path.dirname(outputFilePath), { recursive: true });
        }

        // Écrire le fichier
        await writeFilePromise(
            outputFilePath,
            JSON.stringify(analysis, null, 2),
            encoding as BufferEncoding
        );

        console.log(`Analysis saved successfully to ${outputFilePath}`);
        return outputFilePath;
    } catch (error) {
        console.error(`Error saving analysis result: ${error}`);
        throw new Error(`Failed to save analysis result: ${error.message}`);
    }
}

/**
 * Analyse un lot de fichiers PHP
 */
export async function batchAnalyzePhpFiles(
    files: PhpFile[],
    options: {
        analyzerEndpoint?: string,
        outputDir?: string,
        concurrency?: number
    } = {}
): Promise<{ successful: number, failed: number, results: PhpAnalysisResult[] }> {
    const {
        analyzerEndpoint = 'http://localhost:3000/api/analyze-php',
        outputDir = '/workspaces/cahier-des-charge/reports/analysis',
        concurrency = 5
    } = options;

    console.log(`Batch analyzing ${files.length} PHP files with concurrency ${concurrency}`);

    // Créer le répertoire de sortie
    await mkdirPromise(outputDir, { recursive: true });

    const results: PhpAnalysisResult[] = [];
    let successful = 0;
    let failed = 0;

    // Traiter les fichiers par lots pour éviter de surcharger le système
    for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency);

        const batchPromises = batch.map(file =>
            analyzePhpFile({
                filePath: file.path,
                analyzerEndpoint
            })
                .then(result => {
                    successful++;
                    return result;
                })
                .catch(error => {
                    failed++;
                    console.error(`Failed to analyze ${file.path}: ${error}`);

                    // Renvoyer un résultat d'erreur
                    return {
                        file,
                        analysis: {
                            classes: [],
                            functions: [],
                            dependencies: [],
                            complexity: 0,
                            loc: 0,
                            issues: [{
                                type: 'error',
                                message: `Analysis failed: ${error.message}`,
                                line: 1,
                                severity: 'error'
                            }],
                            migrationEstimate: {
                                difficulty: 'medium',
                                timeEstimate: 1,
                                potentialIssues: [`Analysis failed: ${error.message}`]
                            }
                        },
                        metadata: {
                            analyzedAt: new Date().toISOString(),
                            analysisVersion: '1.0.0',
                            duration: 0
                        }
                    } as PhpAnalysisResult;
                })
        );

        // Attendre que tous les fichiers du lot soient analysés
        const batchResults = await Promise.all(batchPromises);

        // Sauvegarder les résultats et les ajouter à notre tableau
        for (const result of batchResults) {
            await saveAnalysisResult({
                analysis: result,
                outputPath: path.join(outputDir, `${result.file.basename}.json`)
            }).catch(error => {
                console.error(`Failed to save analysis for ${result.file.path}: ${error}`);
            });

            results.push(result);
        }

        console.log(`Processed batch ${i / concurrency + 1}/${Math.ceil(files.length / concurrency)}`);
    }

    console.log(`Batch analysis completed. Successful: ${successful}, Failed: ${failed}`);

    return {
        successful,
        failed,
        results
    };
}

/**
 * Génère un rapport de synthèse des analyses PHP
 */
export async function generateAnalysisSummary(
    analysisResults: PhpAnalysisResult[],
    outputPath?: string
): Promise<{
    summaryPath: string;
    summary: {
        totalFiles: number;
        totalIssues: number;
        complexityStats: {
            average: number;
            max: number;
            min: number;
            filesAboveThreshold: number;
        };
        difficultyDistribution: {
            simple: number;
            medium: number;
            complex: number;
        };
        commonIssues: {
            type: string;
            count: number;
            examples: string[];
        }[];
        estimatedMigrationTime: number;
        dependencies: {
            name: string;
            count: number;
        }[];
    }
}> {
    console.log(`Generating summary for ${analysisResults.length} PHP files`);

    // Calculer les statistiques
    const totalFiles = analysisResults.length;
    const complexities = analysisResults.map(r => r.analysis.complexity);
    const avgComplexity = complexities.reduce((sum, val) => sum + val, 0) / totalFiles || 0;
    const maxComplexity = Math.max(...complexities);
    const minComplexity = Math.min(...complexities);

    // Distribution des difficultés
    const difficultyCount = {
        simple: 0,
        medium: 0,
        complex: 0
    };

    // Collecter les problèmes
    const allIssues: { type: string; message: string; filePath: string }[] = [];

    // Collecter les dépendances
    const dependenciesMap = new Map<string, number>();

    // Calculer le temps estimé total
    let totalEstimatedTime = 0;

    // Parcourir les résultats
    for (const result of analysisResults) {
        // Comptabiliser les difficultés
        difficultyCount[result.analysis.migrationEstimate.difficulty]++;

        // Additionner le temps estimé
        totalEstimatedTime += result.analysis.migrationEstimate.timeEstimate;

        // Collecter les problèmes
        result.analysis.issues.forEach(issue => {
            allIssues.push({
                type: issue.type,
                message: issue.message,
                filePath: result.file.path
            });
        });

        // Comptabiliser les dépendances
        result.analysis.dependencies.forEach(dep => {
            const count = dependenciesMap.get(dep) || 0;
            dependenciesMap.set(dep, count + 1);
        });
    }

    // Trouver les problèmes les plus courants
    const issueTypes = new Map<string, { count: number; messages: string[] }>();
    for (const issue of allIssues) {
        const existing = issueTypes.get(issue.type) || { count: 0, messages: [] };
        existing.count++;
        if (existing.messages.length < 3) {
            existing.messages.push(`${issue.message} (${issue.filePath})`);
        }
        issueTypes.set(issue.type, existing);
    }

    // Trier les problèmes par fréquence
    const commonIssues = Array.from(issueTypes.entries())
        .map(([type, data]) => ({
            type,
            count: data.count,
            examples: data.messages
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Trier les dépendances par fréquence
    const dependencies = Array.from(dependenciesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

    // Créer le résumé
    const summary = {
        totalFiles,
        totalIssues: allIssues.length,
        complexityStats: {
            average: avgComplexity,
            max: maxComplexity,
            min: minComplexity,
            filesAboveThreshold: complexities.filter(c => c > 15).length
        },
        difficultyDistribution: difficultyCount,
        commonIssues,
        estimatedMigrationTime: totalEstimatedTime,
        dependencies
    };

    // Déterminer le chemin de sortie
    const defaultOutputPath = '/workspaces/cahier-des-charge/reports/analysis-summary.json';
    const summaryPath = outputPath || defaultOutputPath;

    // Sauvegarder le résumé
    await mkdirPromise(path.dirname(summaryPath), { recursive: true });
    await writeFilePromise(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`Analysis summary saved to ${summaryPath}`);

    return {
        summaryPath,
        summary
    };
}