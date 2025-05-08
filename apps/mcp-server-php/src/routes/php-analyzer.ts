import fs from 'fs';
import path from 'path';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { saveAuditLocally, saveAuditResult } from '../utils/audit-saver';
import { createLogger } from '../utils/logger';
import { parsePhpCode } from '../utils/php-parser';

const logger = createLogger('PhpAnalyzer-route');

// Types pour les requêtes
interface AnalyzeContentRequest {
  Body: {
    content: string;
    filePath?: string;
    saveToSupabase?: boolean;
    outputDir?: string;
  };
}

interface AnalyzeFileRequest {
  Body: {
    filePath: string;
    saveToSupabase?: boolean;
    outputDir?: string;
  };
}

interface ListPhpFilesRequest {
  Querystring: {
    directory: string;
    recursive?: string;
  };
}

interface AnalyzeDirectoryRequest {
  Body: {
    directory: string;
    recursive?: boolean;
    saveToSupabase?: boolean;
    outputDir?: string;
    maxFiles?: number;
  };
}

// Création du plugin Fastify
const phpAnalyzerPlugin: FastifyPluginAsync = async (fastify, opts) => {
  /**
   * Endpoint POST pour analyser un fichier PHP à partir de son contenu
   *
   * Body:
   * - content: Le contenu du fichier PHP
   * - filePath: Le chemin du fichier (optionnel)
   * - saveToSupabase: Booléen indiquant si le résultat doit être sauvegardé dans Supabase (optionnel)
   * - outputDir: Répertoire de sortie pour la sauvegarde locale (optionnel)
   */
  fastify.post<AnalyzeContentRequest>('/content', async (request, reply) => {
    const { content, filePath = 'anonymous.php', saveToSupabase = false, outputDir } = request.body;

    if (!content) {
      return reply.code(400).send({ success: false, error: 'Le contenu du fichier PHP est requis' });
    }

    try {
      // Analyse du code PHP
      const result = parsePhpCode(content, filePath);

      // Sauvegarde dans Supabase si demandé
      let supabaseResult;
      if (saveToSupabase) {
        supabaseResult = await saveAuditResult(filePath, result);
      }

      // Sauvegarde locale si un répertoire de sortie est spécifié
      let localResult;
      if (outputDir) {
        localResult = saveAuditLocally(filePath, result, outputDir);
      }

      // Réponse
      return reply.send({
        success: true,
        filePath,
        result,
        supabase: supabaseResult,
        local: localResult,
      });
    } catch (error) {
      logger.error(`Erreur lors de l'analyse du contenu PHP:`, error);
      return reply.code(500).send({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * Endpoint POST pour analyser un fichier PHP à partir de son chemin sur le système de fichiers
   *
   * Body:
   * - filePath: Le chemin du fichier à analyser
   * - saveToSupabase: Booléen indiquant si le résultat doit être sauvegardé dans Supabase (optionnel)
   * - outputDir: Répertoire de sortie pour la sauvegarde locale (optionnel)
   */
  fastify.post<AnalyzeFileRequest>('/file', async (request, reply) => {
    const { filePath, saveToSupabase = false, outputDir } = request.body;

    if (!filePath) {
      return reply.code(400).send({ success: false, error: 'Le chemin du fichier PHP est requis' });
    }

    try {
      // Vérifier si le fichier existe
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ success: false, error: `Le fichier ${filePath} n'existe pas` });
      }

      // Lire le contenu du fichier
      const content = fs.readFileSync(filePath, 'utf8');

      // Analyse du code PHP
      const result = parsePhpCode(content, filePath);

      // Sauvegarde dans Supabase si demandé
      let supabaseResult;
      if (saveToSupabase) {
        supabaseResult = await saveAuditResult(filePath, result);
      }

      // Sauvegarde locale si un répertoire de sortie est spécifié
      let localResult;
      if (outputDir) {
        localResult = saveAuditLocally(filePath, result, outputDir);
      }

      // Réponse
      return reply.send({
        success: true,
        filePath,
        result,
        supabase: supabaseResult,
        local: localResult,
      });
    } catch (error) {
      logger.error(`Erreur lors de l'analyse du fichier PHP ${filePath}:`, error);
      return reply.code(500).send({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * Endpoint GET pour récupérer la liste des fichiers PHP dans un répertoire
   *
   * Query params:
   * - directory: Le répertoire à explorer
   * - recursive: Booléen indiquant si la recherche doit être récursive (optionnel)
   */
  fastify.get<ListPhpFilesRequest>('/list-php-files', async (request, reply) => {
    const { directory, recursive = 'true' } = request.query;
    const isRecursive = recursive === 'true';

    if (!directory) {
      return reply.code(400).send({ success: false, error: 'Le répertoire est requis' });
    }

    try {
      // Vérifier si le répertoire existe
      if (!fs.existsSync(directory)) {
        return reply.code(404).send({ success: false, error: `Le répertoire ${directory} n'existe pas` });
      }

      // Fonction récursive pour lister les fichiers PHP
      const phpFiles: string[] = [];

      function findPhpFiles(dir: string) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && isRecursive) {
            findPhpFiles(filePath);
          } else if (file.endsWith('.php')) {
            phpFiles.push(filePath);
          }
        }
      }

      findPhpFiles(directory);

      // Réponse
      return reply.send({
        success: true,
        directory,
        count: phpFiles.length,
        files: phpFiles,
      });
    } catch (error) {
      logger.error('Erreur lors de la recherche de fichiers PHP:', error);
      return reply.code(500).send({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * Endpoint POST pour analyser tous les fichiers PHP d'un répertoire
   *
   * Body:
   * - directory: Le répertoire à explorer
   * - recursive: Booléen indiquant si la recherche doit être récursive (optionnel)
   * - saveToSupabase: Booléen indiquant si les résultats doivent être sauvegardés dans Supabase (optionnel)
   * - outputDir: Répertoire de sortie pour la sauvegarde locale (optionnel)
   * - maxFiles: Nombre maximum de fichiers à analyser (optionnel)
   */
  fastify.post<AnalyzeDirectoryRequest>('/directory', async (request, reply) => {
    const { directory, recursive = true, saveToSupabase = false, outputDir, maxFiles } = request.body;

    if (!directory) {
      return reply.code(400).send({ success: false, error: 'Le répertoire est requis' });
    }

    try {
      // Vérifier si le répertoire existe
      if (!fs.existsSync(directory)) {
        return reply.code(404).send({ success: false, error: `Le répertoire ${directory} n'existe pas` });
      }

      // Fonction récursive pour lister les fichiers PHP
      const phpFiles: string[] = [];

      function findPhpFiles(dir: string) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          if (maxFiles && phpFiles.length >= maxFiles) break;

          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && recursive) {
            findPhpFiles(filePath);
          } else if (file.endsWith('.php')) {
            phpFiles.push(filePath);
          }
        }
      }

      findPhpFiles(directory);

      // Limiter le nombre de fichiers si nécessaire
      const filesToProcess = maxFiles ? phpFiles.slice(0, maxFiles) : phpFiles;

      // Analyser chaque fichier
      const results = [];
      const errors = [];

      for (const filePath of filesToProcess) {
        try {
          // Lire le contenu du fichier
          const content = fs.readFileSync(filePath, 'utf8');

          // Analyse du code PHP
          const result = parsePhpCode(content, filePath);

          // Sauvegarde dans Supabase si demandé
          let supabaseResult;
          if (saveToSupabase) {
            supabaseResult = await saveAuditResult(filePath, result);
          }

          // Sauvegarde locale si un répertoire de sortie est spécifié
          let localResult;
          if (outputDir) {
            localResult = saveAuditLocally(filePath, result, outputDir);
          }

          results.push({
            filePath,
            success: true,
            supabase: supabaseResult,
            local: localResult,
          });
        } catch (error) {
          logger.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
          errors.push({
            filePath,
            error: (error as Error).message,
          });
        }
      }

      // Réponse
      return reply.send({
        success: true,
        directory,
        totalFiles: phpFiles.length,
        processedFiles: filesToProcess.length,
        results,
        errors,
        stats: {
          success: results.length,
          errors: errors.length,
        },
      });
    } catch (error) {
      logger.error(`Erreur lors de l'analyse du répertoire:`, error);
      return reply.code(500).send({
        success: false,
        error: (error as Error).message,
      });
    }
  });
};

export default phpAnalyzerPlugin;
