/**
 * Activités pour le workflow consolidé d'analyse PHP
 * 
 * Ce fichier contient les implémentations des activités utilisées par le workflow
 * d'analyse PHP consolidé.
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import axios from 'axios';
import { ConsolidatedPhpAnalyzerInput, ConsolidatedPhpAnalyzerResult } from '../types/workflow-types';

/**
 * Valide les entrées fournies au workflow et applique les valeurs par défaut
 */
export async function validateInput(
    input: ConsolidatedPhpAnalyzerInput
): Promise<ConsolidatedPhpAnalyzerInput> {
    // Vérification des champs obligatoires
    if (!input.sourcePath) {
        throw new Error('Le chemin source (sourcePath) est obligatoire');
    }

    try {
        const stats = await fs.stat(input.sourcePath);
        if (!stats.isDirectory()) {
            throw new Error(`Le chemin source '${input.sourcePath}' n'est pas un répertoire valide`);
        }
    } catch (error) {
        throw new Error(`Impossible d'accéder au répertoire source: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Appliquer les valeurs par défaut
    return {
        ...input,
        fileExtensions: input.fileExtensions || ['php'],
        recursive: input.recursive !== false,
        outputDir: input.outputDir || path.join(process.cwd(), 'reports', `php-analysis-${Date.now()}`),
        staticAnalysis: {
            enabled: input.staticAnalysis?.enabled !== false,
            analyzerEndpoint: input.staticAnalysis?.analyzerEndpoint || 'http://localhost:8080/analyze',
            concurrency: input.staticAnalysis?.concurrency || 5,
            options: input.staticAnalysis?.options || {},
        },
        complexityAnalysis: {
            enabled: input.complexityAnalysis?.enabled !== false,
            thresholds: input.complexityAnalysis?.thresholds || {
                simple: 5,
                medium: 10,
                complex: 20
            },
            detectDuplication: input.complexityAnalysis?.detectDuplication !== false,
            options: input.complexityAnalysis?.options || {},
        },
        securityAnalysis: {
            enabled: input.securityAnalysis?.enabled !== false,
            includeVulnerabilities: input.securityAnalysis?.includeVulnerabilities !== false,
            severity: input.securityAnalysis?.severity || 'medium',
            options: input.securityAnalysis?.options || {},
        },
        reporting: {
            generateSummary: input.reporting?.generateSummary !== false,
            includeVisualizations: input.reporting?.includeVisualizations || false,
            format: input.reporting?.format || 'both',
            options: input.reporting?.options || {},
        }
    };
}

/**
 * Structure de l'environnement d'analyse
 */
interface AnalysisEnvironment {
    workDir: string;
    tempDir: string;
    tools: {
        static?: {
            path: string;
            version: string;
        };
        complexity?: {
            path: string;
            version: string;
        };
        security?: {
            path: string;
            version: string;
        };
    };
}

/**
 * Prépare l'environnement d'analyse
 */
export async function prepareEnvironment(
    input: ConsolidatedPhpAnalyzerInput
): Promise<AnalysisEnvironment> {
    const timestamp = Date.now();
    const workDir = path.join(process.cwd(), 'tmp', `php-analysis-${timestamp}`);
    const tempDir = path.join(workDir, 'temp');

    // Créer les répertoires nécessaires
    await fs.mkdir(workDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(input.outputDir!, { recursive: true });

    // Structure pour stocker les chemins et versions des outils
    const tools: AnalysisEnvironment['tools'] = {};

    // Préparation des outils d'analyse en fonction de la configuration
    if (input.staticAnalysis?.enabled) {
        tools.static = {
            path: '/usr/local/bin/phpstan', // Chemin par défaut, à adapter selon l'installation
            version: await getToolVersion('/usr/local/bin/phpstan', 'version')
        };
    }

    if (input.complexityAnalysis?.enabled) {
        tools.complexity = {
            path: '/usr/local/bin/phploc', // Chemin par défaut, à adapter selon l'installation
            version: await getToolVersion('/usr/local/bin/phploc', '--version')
        };
    }

    if (input.securityAnalysis?.enabled) {
        tools.security = {
            path: '/usr/local/bin/phpcs', // Chemin par défaut, à adapter selon l'installation
            version: await getToolVersion('/usr/local/bin/phpcs', '--version')
        };
    }

    return { workDir, tempDir, tools };
}

/**
 * Récupère la version d'un outil
 */
async function getToolVersion(toolPath: string, versionFlag: string): Promise<string> {
    try {
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec(`${toolPath} ${versionFlag}`, (error: any, stdout: string) => {
                if (error) {
                    // Si l'outil n'est pas disponible, on renvoie 'unavailable' sans bloquer le workflow
                    resolve('unavailable');
                } else {
                    // Extraire la version depuis la sortie standard
                    const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
                    resolve(versionMatch ? versionMatch[1] : 'unknown');
                }
            });
        });
    } catch (error) {
        return 'unavailable';
    }
}

/**
 * Structure du contexte d'analyse
 */
interface AnalysisContext {
    environment: AnalysisEnvironment;
    fileList: string[];
    totalFiles: number;
    totalSize: number;
}

/**
 * Initialise l'analyse en préparant la liste des fichiers et les statistiques
 */
export async function initializeAnalysis(
    input: ConsolidatedPhpAnalyzerInput,
    environment: AnalysisEnvironment
): Promise<AnalysisContext> {
    // Récupérer la liste des fichiers à analyser
    const fileList = await getFileList(input.sourcePath, input.fileExtensions!, input.recursive!, input.exclude);

    // Calculer les statistiques de base
    let totalSize = 0;
    for (const file of fileList) {
        try {
            const stats = await fs.stat(file);
            totalSize += stats.size;
        } catch (error) {
            // Ignorer les fichiers qui ne peuvent pas être lus
        }
    }

    return {
        environment,
        fileList,
        totalFiles: fileList.length,
        totalSize
    };
}

/**
 * Récupère la liste des fichiers à analyser
 */
async function getFileList(
    sourcePath: string,
    extensions: string[],
    recursive: boolean,
    exclude?: string[]
): Promise<string[]> {
    const result: string[] = [];
    const extensionSet = new Set(extensions.map(ext => ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`));
    const excludePatterns = exclude?.map(pattern => new RegExp(pattern)) || [];

    async function processDirectory(dirPath: string) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Vérifier si le chemin correspond à un pattern d'exclusion
            if (excludePatterns.some(pattern => pattern.test(fullPath))) {
                continue;
            }

            if (entry.isDirectory()) {
                if (recursive) {
                    await processDirectory(fullPath);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (extensionSet.has(ext)) {
                    result.push(fullPath);
                }
            }
        }
    }

    await processDirectory(sourcePath);
    return result;
}

/**
 * Effectue l'analyse statique du code PHP
 */
export async function analyzeStaticStructure(
    input: ConsolidatedPhpAnalyzerInput,
    context: AnalysisContext
): Promise<ConsolidatedPhpAnalyzerResult['staticAnalysis']> {
    // Création d'un répertoire temporaire pour les résultats
    const outputPath = path.join(context.environment.tempDir, 'static-analysis-result.json');

    // Exécuter l'analyseur statique sur chaque fichier
    const issues: Array<{ file: string; line: number; type: string; message: string; severity: string }> = [];
    let totalClasses = 0;
    let totalFunctions = 0;

    // Simuler une analyse statique simple pour chaque fichier
    for (const filePath of context.fileList) {
        try {
            // Lire le contenu du fichier
            const content = await fs.readFile(filePath, 'utf-8');

            // Compter le nombre de classes (approximatif)
            const classMatches = content.match(/class\s+\w+/g);
            const classeCount = classMatches ? classMatches.length : 0;
            totalClasses += classeCount;

            // Compter le nombre de fonctions (approximatif)
            const functionMatches = content.match(/function\s+\w+/g);
            const functionCount = functionMatches ? functionMatches.length : 0;
            totalFunctions += functionCount;

            // Trouver des problèmes potentiels (exemple simple)
            if (content.includes('eval(')) {
                issues.push({
                    file: filePath,
                    line: findLineNumber(content, 'eval('),
                    type: 'security',
                    message: "L'utilisation de eval() est dangereuse",
                    severity: 'critical'
                });
            }

            // Vérifier les variables non initialisées
            if (content.match(/\$[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*\s*=/)) {
                const matches = Array.from(content.matchAll(/\$[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*\s*=/g));
                for (const match of matches) {
                    if (match.index !== undefined && match[0]) {
                        const varName = match[0].trim().replace('=', '');
                        // Vérifier si la variable est utilisée avant d'être initialisée
                        // Ceci est une simplification - une véritable analyse statique serait plus complexe
                    }
                }
            }

        } catch (error) {
            issues.push({
                file: filePath,
                line: 0,
                type: 'error',
                message: `Erreur lors de l'analyse: ${error instanceof Error ? error.message : String(error)}`,
                severity: 'high'
            });
        }
    }

    // Calculer un score basé sur le nombre d'issues
    const score = Math.max(0, Math.min(100, 100 - (issues.length * 5)));

    // Préparer le résultat
    return {
        passed: issues.filter(i => i.severity === 'critical').length === 0,
        score,
        filesAnalyzed: context.fileList.length,
        linesOfCode: await countTotalLinesOfCode(context.fileList),
        classes: totalClasses,
        functions: totalFunctions,
        fileResults: [],  // Détails par fichier seraient ajoutés ici dans une implémentation réelle
        issues,
        summary: {
            totalIssues: issues.length,
            criticalIssues: issues.filter(i => i.severity === 'critical').length,
            highIssues: issues.filter(i => i.severity === 'high').length,
            mediumIssues: issues.filter(i => i.severity === 'medium').length,
            lowIssues: issues.filter(i => i.severity === 'low').length,
        }
    };
}

/**
 * Trouve le numéro de ligne d'une occurrence dans un texte
 */
function findLineNumber(content: string, search: string): number {
    const index = content.indexOf(search);
    if (index === -1) return 0;

    return content.substring(0, index).split('\n').length;
}

/**
 * Compte le nombre total de lignes de code
 */
async function countTotalLinesOfCode(fileList: string[]): Promise<number> {
    let totalLines = 0;

    for (const file of fileList) {
        try {
            const content = await fs.readFile(file, 'utf-8');
            totalLines += content.split('\n').length;
        } catch (error) {
            // Ignorer les fichiers qui ne peuvent pas être lus
        }
    }

    return totalLines;
}

/**
 * Analyse la complexité du code PHP
 */
export async function analyzeCodeComplexity(
    input: ConsolidatedPhpAnalyzerInput,
    context: AnalysisContext
): Promise<{
    passed: boolean;
    score: number;
    hotspots: Array<{ file: string; complexity: number; loc: number; category: 'simple' | 'medium' | 'complex' }>;
    stats: { average: number; max: number; distribution: { simple: number; medium: number; complex: number } };
}> {
    // Simuler le calcul de la complexité cyclomatique pour chaque fichier
    const hotspots: Array<{ file: string; complexity: number; loc: number; category: 'simple' | 'medium' | 'complex' }> = [];
    let totalComplexity = 0;
    let maxComplexity = 0;

    // Distribution par catégorie
    const distribution = {
        simple: 0,
        medium: 0,
        complex: 0
    };

    // Pour chaque fichier, calculer une complexité simulée
    for (const filePath of context.fileList) {
        try {
            // Lire le contenu du fichier
            const content = await fs.readFile(filePath, 'utf-8');
            const loc = content.split('\n').length;

            // Simuler un calcul de complexité basé sur des heuristiques simples
            // Dans une implémentation réelle, utiliser un outil tiers
            const ifCount = (content.match(/if\s*\(/g) || []).length;
            const forCount = (content.match(/for\s*\(/g) || []).length;
            const foreachCount = (content.match(/foreach\s*\(/g) || []).length;
            const whileCount = (content.match(/while\s*\(/g) || []).length;
            const switchCount = (content.match(/switch\s*\(/g) || []).length * 2;  // Switch compte plus

            // Calcul simplifié de la complexité
            const complexity = 1 + ifCount + forCount + foreachCount + whileCount + switchCount;

            // Déterminer la catégorie
            let category: 'simple' | 'medium' | 'complex';
            if (complexity <= input.complexityAnalysis!.thresholds!.simple) {
                category = 'simple';
                distribution.simple++;
            } else if (complexity <= input.complexityAnalysis!.thresholds!.medium) {
                category = 'medium';
                distribution.medium++;
            } else {
                category = 'complex';
                distribution.complex++;
            }

            // Ajouter aux points chauds
            hotspots.push({
                file: filePath,
                complexity,
                loc,
                category
            });

            // Mettre à jour les statistiques
            totalComplexity += complexity;
            maxComplexity = Math.max(maxComplexity, complexity);

        } catch (error) {
            // Ignorer les fichiers qui ne peuvent pas être lus
        }
    }

    // Calculer la complexité moyenne
    const averageComplexity = context.fileList.length > 0 ? totalComplexity / context.fileList.length : 0;

    // Calculer un score basé sur la distribution de la complexité
    const totalFiles = distribution.simple + distribution.medium + distribution.complex;
    const score = totalFiles > 0 ?
        Math.round(100 * (distribution.simple + distribution.medium * 0.5) / totalFiles) :
        100;

    return {
        passed: distribution.complex <= Math.ceil(totalFiles * 0.1),  // Au plus 10% de fichiers complexes
        score,
        hotspots: hotspots.sort((a, b) => b.complexity - a.complexity).slice(0, 10),  // Top 10 des points chauds
        stats: {
            average: Math.round(averageComplexity * 100) / 100,
            max: maxComplexity,
            distribution
        }
    };
}

/**
 * Détecte la duplication de code dans le projet PHP
 */
export async function detectCodeDuplication(
    input: ConsolidatedPhpAnalyzerInput,
    context: AnalysisContext
): Promise<{
    duplicationPercentage: number;
    duplicatedBlocks: number;
    duplicatedLines: number;
    details: Array<{ files: string[]; lines: number; startLine: number }>;
}> {
    // Simuler la détection de duplication
    const duplications: Array<{ files: string[]; lines: number; startLine: number }> = [];
    let totalDuplicatedLines = 0;

    // Dans une implémentation réelle, utiliser un outil comme phpmd ou phpcpd
    // Ici, nous simulons avec une approche simplifiée pour la démonstration

    // Créer un index de signatures de lignes de code
    const lineSignatures: Record<string, Array<{ file: string; line: number }>> = {};
    const minBlockSize = 6;  // Taille minimale d'un bloc de duplication

    for (const filePath of context.fileList) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            // Pour chaque bloc potentiel de duplication
            for (let i = 0; i <= lines.length - minBlockSize; i++) {
                // Créer une signature pour ce bloc (simplifiée pour la démonstration)
                const blockContent = lines.slice(i, i + minBlockSize).join('\n');
                const blockSignature = hashString(blockContent);

                // Enregistrer ce bloc dans l'index
                if (!lineSignatures[blockSignature]) {
                    lineSignatures[blockSignature] = [];
                }

                lineSignatures[blockSignature].push({
                    file: filePath,
                    line: i + 1  // Lignes à partir de 1
                });
            }
        } catch (error) {
            // Ignorer les fichiers qui ne peuvent pas être lus
        }
    }

    // Rechercher des duplications
    for (const signature in lineSignatures) {
        const occurrences = lineSignatures[signature];
        if (occurrences.length > 1) {
            // Trouver des duplications en regroupant par fichier
            const fileGroups: Record<string, number[]> = {};

            for (const occurrence of occurrences) {
                if (!fileGroups[occurrence.file]) {
                    fileGroups[occurrence.file] = [];
                }
                fileGroups[occurrence.file].push(occurrence.line);
            }

            // Ajouter chaque duplication trouvée
            const files = Object.keys(fileGroups);
            if (files.length > 1) {
                duplications.push({
                    files,
                    lines: minBlockSize,
                    startLine: occurrences[0].line
                });

                totalDuplicatedLines += minBlockSize;
            }
        }
    }

    // Calculer le pourcentage de duplication
    const totalLines = await countTotalLinesOfCode(context.fileList);
    const duplicationPercentage = totalLines > 0 ?
        Math.round((totalDuplicatedLines / totalLines) * 10000) / 100 :
        0;

    return {
        duplicationPercentage,
        duplicatedBlocks: duplications.length,
        duplicatedLines: totalDuplicatedLines,
        details: duplications.slice(0, 20)  // Limiter aux 20 premiers résultats
    };
}

/**
 * Fonction de hachage simple pour les chaînes
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;  // Convertir en entier 32 bits
    }
    return hash.toString(16);
}

/**
 * Analyse les vulnérabilités de sécurité dans le code PHP
 */
export async function analyzeSecurityVulnerabilities(
    input: ConsolidatedPhpAnalyzerInput,
    context: AnalysisContext
): Promise<ConsolidatedPhpAnalyzerResult['securityAnalysis']> {
    // Liste des modèles de vulnérabilités courantes en PHP
    const vulnerabilityPatterns = [
        {
            pattern: /eval\s*\(/g,
            type: 'code-injection',
            description: "Utilisation dangereuse de eval() qui peut mener à une exécution de code arbitraire",
            severity: 'critical',
            cwe: 'CWE-95',
            remediation: 'Éviter d\'utiliser eval(). Utiliser des méthodes alternatives plus sûres.'
        },
        {
            pattern: /\$_GET|\$_POST|\$_REQUEST/g,
            type: 'input-validation',
            description: "Entrées utilisateur potentiellement non validées",
            severity: 'medium',
            cwe: 'CWE-20',
            remediation: 'Valider et désinfecter toutes les entrées utilisateur avant utilisation.'
        },
        {
            pattern: /mysql_query|mysqli_query/g,
            type: 'sql-injection',
            description: "Requête SQL potentiellement vulnérable à l'injection",
            severity: 'high',
            cwe: 'CWE-89',
            remediation: 'Utiliser des requêtes préparées avec PDO ou mysqli_prepare().'
        },
        {
            pattern: /include\s*\(/g,
            type: 'path-traversal',
            description: "Inclusion de fichier potentiellement vulnérable à une attaque par traversée de chemin",
            severity: 'high',
            cwe: 'CWE-22',
            remediation: 'Valider les chemins de fichier et utiliser des chemins absolus sécurisés.'
        },
        {
            pattern: /echo\s+\$_/g,
            type: 'xss',
            description: "Sortie non échappée pouvant mener à une attaque XSS",
            severity: 'medium',
            cwe: 'CWE-79',
            remediation: 'Utiliser htmlspecialchars() ou htmlentities() pour échapper les sorties.'
        },
        {
            pattern: /file_get_contents\s*\(\s*\$_/g,
            type: 'file-inclusion',
            description: "Lecture de fichier basée sur des entrées utilisateur non validées",
            severity: 'high',
            cwe: 'CWE-73',
            remediation: 'Valider les entrées utilisateur et utiliser des listes blanches pour les fichiers autorisés.'
        }
    ];

    const vulnerabilities: ConsolidatedPhpAnalyzerResult['securityAnalysis']['vulnerabilities'] = [];

    // Analyser chaque fichier pour des vulnérabilités
    for (const filePath of context.fileList) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            // Vérifier chaque modèle de vulnérabilité
            for (const pattern of vulnerabilityPatterns) {
                const matches = Array.from(content.matchAll(pattern.pattern));

                for (const match of matches) {
                    if (match.index === undefined) continue;

                    // Déterminer le numéro de ligne
                    const line = content.substring(0, match.index).split('\n').length;

                    // Ajouter la vulnérabilité si elle correspond à la sévérité minimale demandée
                    const severityLevel = {
                        'critical': 4,
                        'high': 3,
                        'medium': 2,
                        'low': 1,
                        'all': 0
                    };

                    const minSeverity = severityLevel[input.securityAnalysis?.severity || 'medium'];
                    const vulnerabilitySeverity = severityLevel[pattern.severity as keyof typeof severityLevel];

                    if (vulnerabilitySeverity >= minSeverity) {
                        vulnerabilities.push({
                            file: filePath,
                            line,
                            type: pattern.type,
                            description: pattern.description,
                            severity: pattern.severity as any,
                            cwe: pattern.cwe,
                            remediation: pattern.remediation
                        });
                    }
                }
            }
        } catch (error) {
            // Ignorer les fichiers qui ne peuvent pas être lus
        }
    }

    // Compter les vulnérabilités par sévérité
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

    // Calculer un score de sécurité basé sur les vulnérabilités trouvées
    const totalVulnerabilities = criticalCount + highCount + mediumCount + lowCount;
    const weightedCount = criticalCount * 10 + highCount * 5 + mediumCount * 2 + lowCount;

    // Score inversement proportionnel au nombre pondéré de vulnérabilités
    const baseScore = 100;
    const penaltyPerWeightedVulnerability = 1;
    const score = Math.max(0, Math.min(100, baseScore - (weightedCount * penaltyPerWeightedVulnerability)));

    return {
        passed: criticalCount === 0 && highCount === 0,
        score,
        vulnerabilitiesCount: totalVulnerabilities,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        vulnerabilities
    };
}

/**
 * Génère les rapports d'analyse
 */
export async function generateReports(
    input: ConsolidatedPhpAnalyzerInput,
    result: ConsolidatedPhpAnalyzerResult
): Promise<{
    summary: string;
    details?: string;
    visualizations?: string;
}> {
    // Créer le répertoire de sortie s'il n'existe pas
    await fs.mkdir(input.outputDir!, { recursive: true });

    // Générer le rapport JSON
    const reportData = { ...result };
    const jsonReportPath = path.join(input.outputDir!, 'analysis-report.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2), 'utf-8');

    // Générer un rapport HTML simplifié
    let htmlReportPath: string | undefined;
    let visualizationsPath: string | undefined;

    if (input.reporting?.format === 'html' || input.reporting?.format === 'both') {
        htmlReportPath = path.join(input.outputDir!, 'analysis-report.html');

        // Créer un rapport HTML simple
        const htmlContent = generateHtmlReport(result);
        await fs.writeFile(htmlReportPath, htmlContent, 'utf-8');

        // Créer des visualisations si demandé
        if (input.reporting?.includeVisualizations) {
            visualizationsPath = path.join(input.outputDir!, 'visualizations');
            await fs.mkdir(visualizationsPath, { recursive: true });

            // Générer des visualisations...
            // (Dans une implémentation réelle, on utiliserait des bibliothèques comme D3.js pour générer des graphiques)
        }
    }

    return {
        summary: jsonReportPath,
        details: htmlReportPath,
        visualizations: visualizationsPath
    };
}

/**
 * Génère un rapport HTML simple
 */
function generateHtmlReport(result: ConsolidatedPhpAnalyzerResult): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport d'analyse PHP - ${result.metadata.analyzedAt}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1, h2, h3 { color: #2c3e50; }
    .summary { background-color: #f8f9fa; border-radius: 4px; padding: 15px; margin-bottom: 20px; }
    .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 20px; }
    .score { font-size: 24px; font-weight: bold; }
    .good { color: #28a745; }
    .warning { color: #ffc107; }
    .danger { color: #dc3545; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f8f9fa; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Rapport d'analyse PHP</h1>
    
    <div class="summary">
      <h2>Résumé</h2>
      <p>Date d'analyse: ${result.metadata.analyzedAt}</p>
      <p>Fichiers analysés: ${result.metadata.filesAnalyzed}</p>
      <p>Lignes de code: ${result.metadata.totalLinesOfCode}</p>
      <p>Durée de l'analyse: ${result.duration / 1000} secondes</p>
    </div>
    
    ${result.staticAnalysis ? `
    <div class="card">
      <h2>Analyse statique</h2>
      <div class="score ${result.staticAnalysis.score > 80 ? 'good' : result.staticAnalysis.score > 60 ? 'warning' : 'danger'}">
        Score: ${result.staticAnalysis.score}/100
      </div>
      <p>Issues: ${result.staticAnalysis.issues.length}</p>
      <p>Classes: ${result.staticAnalysis.classes}</p>
      <p>Fonctions: ${result.staticAnalysis.functions}</p>
      
      ${result.staticAnalysis.issues.length > 0 ? `
      <h3>Problèmes détectés</h3>
      <table>
        <thead>
          <tr>
            <th>Fichier</th>
            <th>Ligne</th>
            <th>Type</th>
            <th>Sévérité</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          ${result.staticAnalysis.issues.map(issue => `
          <tr>
            <td>${issue.file.split('/').pop()}</td>
            <td>${issue.line}</td>
            <td>${issue.type}</td>
            <td>${issue.severity}</td>
            <td>${issue.message}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p>Aucun problème détecté.</p>'}
    </div>
    ` : ''}
    
    ${result.complexityAnalysis ? `
    <div class="card">
      <h2>Analyse de complexité</h2>
      <div class="score ${result.complexityAnalysis.score > 80 ? 'good' : result.complexityAnalysis.score > 60 ? 'warning' : 'danger'}">
        Score: ${result.complexityAnalysis.score}/100
      </div>
      <p>Complexité moyenne: ${result.complexityAnalysis.stats.average}</p>
      <p>Complexité maximale: ${result.complexityAnalysis.stats.max}</p>
      <p>Distribution: ${result.complexityAnalysis.stats.distribution.simple} simples, 
                     ${result.complexityAnalysis.stats.distribution.medium} moyens, 
                     ${result.complexityAnalysis.stats.distribution.complex} complexes</p>
      
      <h3>Points chauds de complexité</h3>
      ${result.complexityAnalysis.hotspots.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Fichier</th>
            <th>Complexité</th>
            <th>Lignes</th>
            <th>Catégorie</th>
          </tr>
        </thead>
        <tbody>
          ${result.complexityAnalysis.hotspots.map(spot => `
          <tr>
            <td>${spot.file.split('/').pop()}</td>
            <td>${spot.complexity}</td>
            <td>${spot.loc}</td>
            <td>${spot.category}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p>Aucun point chaud identifié.</p>'}
      
      ${result.complexityAnalysis.duplication ? `
      <h3>Duplication de code</h3>
      <p>Pourcentage de duplication: ${result.complexityAnalysis.duplication.duplicationPercentage}%</p>
      <p>Blocs dupliqués: ${result.complexityAnalysis.duplication.duplicatedBlocks}</p>
      <p>Lignes dupliquées: ${result.complexityAnalysis.duplication.duplicatedLines}</p>
      ` : ''}
    </div>
    ` : ''}
    
    ${result.securityAnalysis ? `
    <div class="card">
      <h2>Analyse de sécurité</h2>
      <div class="score ${result.securityAnalysis.score > 90 ? 'good' : result.securityAnalysis.score > 70 ? 'warning' : 'danger'}">
        Score: ${result.securityAnalysis.score}/100
      </div>
      <p>Vulnérabilités détectées: ${result.securityAnalysis.vulnerabilitiesCount}</p>
      <p>Critiques: ${result.securityAnalysis.criticalCount}</p>
      <p>Élevées: ${result.securityAnalysis.highCount}</p>
      <p>Moyennes: ${result.securityAnalysis.mediumCount}</p>
      <p>Faibles: ${result.securityAnalysis.lowCount}</p>
      
      ${result.securityAnalysis.vulnerabilities.length > 0 ? `
      <h3>Vulnérabilités</h3>
      <table>
        <thead>
          <tr>
            <th>Fichier</th>
            <th>Ligne</th>
            <th>Type</th>
            <th>Sévérité</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${result.securityAnalysis.vulnerabilities.map(vuln => `
          <tr>
            <td>${vuln.file.split('/').pop()}</td>
            <td>${vuln.line}</td>
            <td>${vuln.type}</td>
            <td>${vuln.severity}</td>
            <td>${vuln.description}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p>Aucune vulnérabilité détectée.</p>'}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

/**
 * Notifie de la fin de l'analyse
 */
export async function notifyCompletion(
    input: ConsolidatedPhpAnalyzerInput,
    result: ConsolidatedPhpAnalyzerResult
): Promise<void> {
    // Notifier via webhook si configuré
    if (input.reporting?.notifyWebhook) {
        try {
            const notificationData = {
                status: 'completed',
                analysisType: 'php',
                timestamp: new Date().toISOString(),
                summary: {
                    filesAnalyzed: result.metadata.filesAnalyzed,
                    duration: result.duration,
                    staticAnalysisScore: result.staticAnalysis?.score,
                    complexityScore: result.complexityAnalysis?.score,
                    securityScore: result.securityAnalysis?.score,
                },
                reportUrls: result.reportPaths
            };

            await axios.post(input.reporting.notifyWebhook, notificationData);
        } catch (error) {
            console.error("Échec de notification webhook:", error);
            // Ne pas faire échouer le workflow en cas d'erreur de notification
        }
    }

    // Journalisation dans les logs
    console.log(`Analyse PHP terminée. ${result.metadata.filesAnalyzed} fichiers analysés en ${result.duration / 1000}s.`);
}