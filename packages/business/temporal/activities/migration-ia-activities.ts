import { createActivityLogger } from ..@cahier-des-charge/coordination/src/utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import { glob } from 'glob';

/**
 * Interface pour représenter un fichier
 */
export interface FileInfo {
    name: string;
    path: string;
    extension: string;
}

/**
 * Interface pour les options de listage de fichiers
 */
export interface ListFilesOptions {
    directory: string;
    extensions: string[];
    recursive: boolean;
}

/**
 * Interface pour les options d'analyse de fichier PHP
 */
export interface PhpAnalysisOptions {
    filePath: string;
    outputPath: string;
}

/**
 * Interface pour les options de sauvegarde du résumé d'analyse
 */
export interface SaveAnalysisSummaryOptions {
    results: any[];
    outputPath: string;
}

/**
 * Liste les fichiers dans un répertoire selon les extensions spécifiées
 * Remplace le nœud "List PHP Files" de n8n
 */
export async function listFiles(options: ListFilesOptions): Promise<FileInfo[]> {
    const logger = createActivityLogger('listFiles');
    logger.info(`Recherche de fichiers dans ${options.directory}`, { options });

    try {
        const pattern = options.recursive
            ? `${options.directory}/**/*.{${options.extensions.join(',')}}`
            : `${options.directory}/*.{${options.extensions.join(',')}}`;

        const files = await glob(pattern, { nodir: true });

        return files.map(file => {
            const parsedPath = path.parse(file);
            return {
                name: parsedPath.name,
                path: file,
                extension: parsedPath.ext.replace('.', '')
            };
        });
    } catch (error) {
        logger.error('Erreur lors du listage des fichiers', { error });
        throw error;
    }
}

/**
 * Analyse un fichier PHP
 * Remplace le nœud "PHP Analysis" de n8n
 */
export async function analyzePhpFile(options: PhpAnalysisOptions): Promise<{ outputPath: string }> {
    const logger = createActivityLogger('analyzePhpFile');
    logger.info(`Analyse du fichier PHP: ${options.filePath}`);

    try {
        // Lecture du contenu du fichier
        const fileContent = await fs.readFile(options.filePath, 'utf-8');

        // Analyse du fichier PHP (simulé ici, à remplacer par le vrai service d'analyse)
        // Dans n8n, cela était fait via une requête HTTP
        let analysis;

        try {
            // Essayer d'utiliser le service d'analyse via HTTP si disponible
            const response = await axios.post('http://localhost:3000/api/php-analysis', {
                filePath: options.filePath,
                content: fileContent
            });
            analysis = response.data;
        } catch (error) {
            // Fallback: analyse locale simple si le service n'est pas disponible
            logger.warn('Service d\'analyse non disponible, utilisation de l\'analyse locale', { error });

            analysis = {
                file: options.filePath,
                timestamp: new Date().toISOString(),
                metrics: {
                    lines: fileContent.split('\n').length,
                    size: Buffer.byteLength(fileContent, 'utf8'),
                    functions: (fileContent.match(/function\s+\w+\s*\(/g) || []).length,
                    classes: (fileContent.match(/class\s+\w+/g) || []).length,
                },
                recommendations: [
                    'Analyse générée localement, pas de recommandations détaillées disponibles'
                ]
            };
        }

        // Création du répertoire de sortie si nécessaire
        const outputDir = path.dirname(options.outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Sauvegarde de l'analyse
        await fs.writeFile(options.outputPath, JSON.stringify(analysis, null, 2), 'utf-8');

        logger.info(`Analyse sauvegardée dans ${options.outputPath}`);

        return { outputPath: options.outputPath };
    } catch (error) {
        logger.error(`Erreur lors de l'analyse du fichier PHP ${options.filePath}`, { error });
        throw error;
    }
}

/**
 * Sauvegarde le résumé des analyses
 * Complète la fonctionnalité des nœuds n8n
 */
export async function saveAnalysisSummary(options: SaveAnalysisSummaryOptions): Promise<{ outputPath: string }> {
    const logger = createActivityLogger('saveAnalysisSummary');
    logger.info(`Sauvegarde du résumé d'analyse dans ${options.outputPath}`);

    try {
        // Création du répertoire de sortie si nécessaire
        const outputDir = path.dirname(options.outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Création du résumé
        const summary = {
            timestamp: new Date().toISOString(),
            totalAnalyzed: options.results.length,
            successful: options.results.filter(r => r.status === 'success').length,
            failed: options.results.filter(r => r.status === 'error').length,
            results: options.results
        };

        // Sauvegarde du résumé
        await fs.writeFile(options.outputPath, JSON.stringify(summary, null, 2), 'utf-8');

        logger.info(`Résumé sauvegardé dans ${options.outputPath}`);

        return { outputPath: options.outputPath };
    } catch (error) {
        logger.error('Erreur lors de la sauvegarde du résumé d\'analyse', { error });
        throw error;
    }
}
