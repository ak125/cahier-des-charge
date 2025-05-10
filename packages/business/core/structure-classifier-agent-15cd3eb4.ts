#!/usr/bin/env node
/**
 * Structure Classifier Agent
 *
 * Analyse la structure des fichiers du projet selon les règles de classification
 * définies dans structure-map.json et génère un rapport détaillé.
 *
 * @author MCP OS Agent
 * @version 1.4.2
 */

import * as fastGlob from 'fast-globstructure-agent';
import * as fs from 'fsstructure-agent';
import * as os from 'osstructure-agent';
import * as path from 'pathstructure-agent';
import { createHash } from './cryptostructure-agent';
import { minimatch } from './minimatchstructure-agent';
import { Worker, isMainThread, parentPort, workerData } from './worker_threadsstructure-agent';

// Types
interface TaxonomySchema {
  description: string;
  values: string[];
}

interface Classification {
  layer: string;
  domain: string;
  status: string;
  source: string;
  confidence: number;
}

interface StructureMap {
  version: string;
  updated: string;
  taxonomySchema: {
    layer: TaxonomySchema;
    domain: TaxonomySchema;
    status: TaxonomySchema;
  };
  defaultClassification: {
    layer: string;
    domain: string;
    status: string;
  };
  folderClassifications: {
    pattern: string;
    classification: Partial<Classification>;
  }[];
  fileClassifications: {
    pattern: string;
    classification: Partial<Classification>;
  }[];
}

interface FileClassification extends Classification {
  file: string;
}

interface ClassificationReport {
  metadata: {
    generatedAt: string;
    projectRoot: string;
    filesAnalyzed: number;
    structureMapVersion: string;
    structureMapUpdated: string;
    executionTimeMs: number;
  };
  classifications: Record<string, FileClassification>;
  statistics: {
    byLayer: Record<string, number>;
    byDomain: Record<string, number>;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  };
  groups: {
    activeBusinessFiles: string[];
    orchestrationFiles: string[];
    depreciatedFiles: string[];
    developingFiles: string[];
    highConfidenceFiles: string[];
    lowConfidenceFiles: string[];
  };
  contextualAnalysis?: {
    filesImproved: number;
    neighborhoodImprovements: Record<string, string[]>;
  };
}

interface WorkerResult {
  filePath: string;
  classification: Classification;
}

// Configuration
const DEFAULT_CONFIG = {
  structureMapPath: path.resolve(process.cwd(), 'structure-map.json'),
  outputJsonPath: path.resolve(process.cwd(), 'structure', 'structure_classification_report.json'),
  outputMarkdownPath: path.resolve(
    process.cwd(),
    'structure',
    'structure_classification_report.md'
  ),
  ignorePatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/.turbo/**',
    '**/coverage/**',
    '**/tmp/**',
    '**/audit/**',
    '**/backups/**',
    '**/*.min.*',
    '**/*.d.ts',
  ],
  includeHidden: false,
  numWorkers: Math.max(1, Math.min(os.cpus().length - 1, 4)), // Au maximum 4 workers, et au moins 1
};

// Lecture de la configuration depuis les arguments CLI
function parseCliArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--map' || arg === '-m') {
      const nextArg = args[++i];
      if (nextArg) {
        config.structureMapPath = path.resolve(process.cwd(), nextArg);
      }
    } else if (arg === '--output' || arg === '-o') {
      const nextArg = args[++i];
      if (nextArg) {
        config.outputJsonPath = path.resolve(process.cwd(), nextArg);
      }
    } else if (arg === '--markdown' || arg === '-md') {
      const nextArg = args[++i];
      if (nextArg) {
        config.outputMarkdownPath = path.resolve(process.cwd(), nextArg);
      }
    } else if (arg === '--include-hidden') {
      config.includeHidden = true;
    } else if (arg === '--workers') {
      const nextArg = args[++i];
      if (nextArg) {
        config.numWorkers = parseInt(nextArg, 10);
      }
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Structure Classifier Agent - Classifie les fichiers du projet

Usage: npx ts-node tools/structure/structure-classifier-agent.ts [options]

Options:
  --map, -m <path>        Chemin vers le fichier structure-map.json (défaut: ./structure-map.json)
  --output, -o <path>     Chemin vers le fichier de rapport JSON (défaut: ./structure/structure_classification_report.json)
  --markdown, -md <path>  Chemin vers le fichier de rapport Markdown (défaut: ./structure/structure_classification_report.md)
  --include-hidden        Inclure les fichiers cachés dans l'analyse
  --workers <number>      Nombre de workers à utiliser pour l'analyse parallèle (défaut: nombre de CPU-1, max 4)
  --help, -h              Afficher cette aide
      `);
      process.exit(0);
    }
  }

  return config;
}

/**
 * Classification basée sur les patterns de fichiers et dossiers
 */
function classifyByPattern(filePath: string, structureMap: StructureMap): Classification {
  // Normaliser le chemin pour les comparaisons de pattern
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Vérifier d'abord les patterns de fichiers
  for (const rule of structureMap.fileClassifications || []) {
    if (minimatch(normalizedPath, rule.pattern)) {
      return {
        layer: rule.classification.layer || structureMap.defaultClassification.layer,
        domain: rule.classification.domain || structureMap.defaultClassification.domain,
        status: rule.classification.status || structureMap.defaultClassification.status,
        source: 'filePattern',
        confidence: 0.9,
      };
    }
  }

  // Vérifier ensuite les patterns de dossiers
  for (const rule of structureMap.folderClassifications || []) {
    if (minimatch(normalizedPath, rule.pattern)) {
      return {
        layer: rule.classification.layer || structureMap.defaultClassification.layer,
        domain: rule.classification.domain || structureMap.defaultClassification.domain,
        status: rule.classification.status || structureMap.defaultClassification.status,
        source: 'folderPattern',
        confidence: 0.7,
      };
    }
  }

  // Aucun pattern trouvé, utiliser la classification par défaut
  return {
    ...structureMap.defaultClassification,
    source: 'default',
    confidence: 0.3,
  };
}

/**
 * Analyse approfondie du contenu du fichier
 */
function deepContentAnalysis(filePath: string): Partial<Classification> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();
    const result: Partial<Classification> = {
      confidence: 0.6,
    };

    // Analyse basée sur le contenu
    const isTest =
      filePath.includes('.test.') ||
      filePath.includes('.spec.') ||
      /describe\(|test\(|it\(/.test(content);

    const isDeprecated =
      /deprecated|legacy|@obsolete|TODO:.*remove|to be removed|will be deprecated|\.bak$/.test(
        content + filePath
      );

    const isAgent = /extends\s+BaseAgent|implements\s+AgentInterface|@Agent\(|class.*Agent/.test(
      content
    );

    const isGenerator = /generate[A-Z]|Generator|createNew[A-Z]/.test(content);

    const isOrchestrator = /Orchestrator|Pipeline|Workflow|orchestrate|@Orchestration/.test(
      content
    );

    const isN8N = filePath.includes('.n8n.') || /n8n\.io|n8n\/nodeTypes/.test(content);

    const isRemixRoute = filePath.includes('/routes/') && extension === '.tsx';

    const isNestController = /@Controller\(|@Get\(|@Post\(|@Injectable\(/.test(content);

    const isPrisma = /prisma\.|\@prisma\/client|PrismaClient|schema\.prisma/.test(content);

    const isUI = /React\.FC|import\s+React|<div|<button|className|tailwind|css/.test(content);

    const isDocumentation = extension === '.md' || extension === '.txt';

    const isSharedUtil =
      /export\s+(const|function|class|interface|type)/.test(content) &&
      (filePath.includes('/utils/') ||
        filePath.includes('/shared/') ||
        filePath.includes('/common/') ||
        filePath.includes('/helpers/'));

    // Patterns existants
    const isMigration =
      /migration|migrate|migrat(e|ion)|\.sql$/.test(content + filePath) ||
      /database.*changes?|schema.*change/.test(content);

    const isDocker = /docker-compose|dockerfile|containeriz(e|ation)|kubernetes|k8s/.test(
      content + filePath.toLowerCase()
    );

    const isTypeDefinition = /interface\s+\w+|type\s+\w+\s*=|declare\s+module|\.d\.ts$/.test(
      content + filePath
    );

    const isTool = /tool|utility|helper|cli|command|script|automation/.test(
      content.toLowerCase() + filePath.toLowerCase()
    );

    const isReport = /report|statistics|analytics|metrics|log\./.test(
      content.toLowerCase() + filePath.toLowerCase()
    );

    const isConfig = /config|configuration|settings|setup|\.json$|\.ya?ml$|\.conf$|\.ini$/.test(
      content + filePath
    );

    const isSEO =
      /seo|search\s*engine|meta\s*tag|sitemap|robots\.txt|canonical|index(ing|ed|er)/.test(
        content.toLowerCase()
      );

    const isQuality = /qualit(y|ative)|lint|eslint|prettier|codequality|sonar|metric|score/.test(
      content.toLowerCase()
    );

    const isAnalysis = /analy(sis|tic|ze)|evaluate|assessment|diagnostic|check|audit/.test(
      content.toLowerCase()
    );

    // Nouveaux patterns de détection plus précis
    const isDashboard =
      /dashboard|tableau\s*de\s*bord|statistics\s*view|graph\s*view|chart\s*(component|view)|analytics\s*display/.test(
        content.toLowerCase() + fileName
      );

    const isCore = /core|kernel|foundation|base|essential|main|primary|central|root/.test(
      content.toLowerCase() + filePath.toLowerCase()
    );

    const isIntegration =
      /integrat(e|ion)|connector|adapter|bridge|client\s*api|external\s*(service|api)|webhook/.test(
        content.toLowerCase() + filePath.toLowerCase()
      );

    const isBackup = /backup|save|archive|copy|dump|snapshot/.test(
      content.toLowerCase() + filePath.toLowerCase()
    );

    const isCI =
      /ci\/|continuous\s*integration|github\s*actions|gitlab\s*ci|jenkins|travis|circle\s*ci|workflow/.test(
        content.toLowerCase() + filePath.toLowerCase()
      );

    const isSecurity =
      /security|authentication|authorization|auth|permission|role|access\s*control|encrypt|decrypt|hash|jwt|token/.test(
        content.toLowerCase() + filePath.toLowerCase()
      );

    const isMonitoring =
      /monitor|telemetry|observability|logging|trace|metric|alert|health\s*check|status|heartbeat/.test(
        content.toLowerCase() + filePath.toLowerCase()
      );

    const isErrorHandling =
      /error\s*(handler|handling)|exception|try\s*catch|catch\s*block|fallback|recovery|resilience/.test(
        content.toLowerCase()
      );

    // Patterns de comportement temporel
    const isStable =
      /stable|production\s*ready|release|v\d+\.\d+\.\d+/.test(content.toLowerCase()) &&
      !isDeprecated &&
      !content.includes('TODO:') &&
      !content.includes('FIXME:');

    const isDeveloping =
      /wip|work\s*in\s*progress|draft|prototype|poc|proof\s*of\s*concept|experimental|beta/.test(
        content.toLowerCase()
      ) ||
      content.includes('TODO:') ||
      content.includes('FIXME:');

    // Déterminer la couche (layer)
    if (isOrchestrator || isN8N || isDocker || isCI) {
      result.layer = 'orchestration';
      result.confidence = 0.85;
    } else if (isAgent) {
      result.layer = 'coordination';
      result.confidence = 0.8;
    } else if (isNestController || isUI || isRemixRoute || isPrisma || isDashboard) {
      result.layer = 'business';
      result.confidence = 0.75;
    } else if (isSharedUtil || isTypeDefinition || isConfig || isErrorHandling) {
      result.layer = 'shared';
      result.confidence = 0.7;
    } else if (isTool || isReport || isMonitoring) {
      // Les outils et monitoring sont généralement dans la couche de coordination
      result.layer = 'coordination';
      result.confidence = 0.65;
    } else if (isSecurity) {
      // La sécurité peut traverser plusieurs couches, mais est souvent dans la couche shared
      result.layer = 'shared';
      result.confidence = 0.65;
    } else if (isCore) {
      result.layer = 'business';
      result.confidence = 0.7;
    }

    // Déterminer le domaine (domain)
    if (isMigration || isGenerator) {
      result.domain = 'migration';
      result.confidence = Math.max(result.confidence || 0, 0.8);
    } else if (isNestController && isPrisma) {
      result.domain = 'core';
      result.confidence = Math.max(result.confidence || 0, 0.75);
    } else if (isUI || isRemixRoute || isDashboard) {
      result.domain = 'dashboard';
      result.confidence = Math.max(result.confidence || 0, 0.75);
    } else if (isN8N || isIntegration) {
      result.domain = 'integration';
      result.confidence = Math.max(result.confidence || 0, 0.8);
    } else if (isDocumentation || isReport) {
      result.domain = 'documentation';
      result.confidence = Math.max(result.confidence || 0, 0.9);
    } else if (isTool || isCI) {
      result.domain = 'tools';
      result.confidence = Math.max(result.confidence || 0, 0.7);
    } else if (isSEO) {
      result.domain = 'seo';
      result.confidence = Math.max(result.confidence || 0, 0.85);
    } else if (isQuality || isErrorHandling) {
      result.domain = 'quality';
      result.confidence = Math.max(result.confidence || 0, 0.8);
    } else if (isAnalysis || isMonitoring) {
      result.domain = 'analysis';
      result.confidence = Math.max(result.confidence || 0, 0.75);
    } else if (isSecurity) {
      result.domain = 'security';
      result.confidence = Math.max(result.confidence || 0, 0.8);
    } else if (isCore) {
      result.domain = 'core';
      result.confidence = Math.max(result.confidence || 0, 0.7);
    } else if (isBackup) {
      result.domain = 'tools';
      result.confidence = Math.max(result.confidence || 0, 0.65);
    }

    // Règles supplémentaires basées sur les noms de fichiers spécifiques
    if (filePath.includes('agent-') || filePath.includes('agents/')) {
      result.domain = result.domain || 'migration'; // Beaucoup de agents-* semblent liés à la migration
      result.layer = result.layer || 'coordination';
      result.confidence = Math.max(result.confidence || 0, 0.7);
    }

    if (
      filePath.includes('docker') ||
      filePath.includes('Dockerfile') ||
      filePath.includes('docker-compose')
    ) {
      result.domain = result.domain || 'tools';
      result.layer = 'orchestration';
      result.confidence = Math.max(result.confidence || 0, 0.85);
    }

    if (
      filePath.includes('-report') ||
      filePath.includes('report-') ||
      filePath.includes('/reports/')
    ) {
      result.domain = 'documentation';
      result.confidence = Math.max(result.confidence || 0, 0.8);
    }

    if (filePath.includes('dashboard') || filePath.includes('/ui/')) {
      result.domain = 'dashboard';
      result.confidence = Math.max(result.confidence || 0, 0.75);
    }

    // Déterminer le statut (status)
    if (isDeprecated) {
      result.status = 'deprecated';
      result.confidence = 0.9;
    } else if (isTest) {
      result.status = 'testing';
      result.confidence = 0.85;
    } else if (isDeveloping) {
      result.status = 'developing';
      result.confidence = 0.7;
    } else if (isStable || (isSharedUtil && !isTest && !isDeprecated)) {
      result.status = 'stable';
      result.confidence = 0.7;
    } else if ((isMigration || isOrchestrator || isN8N) && !isDeprecated) {
      // Les fichiers de migration et d'orchestration actifs sont généralement actifs
      result.status = 'active';
      result.confidence = 0.75;
    } else if (isUI || isRemixRoute || isNestController) {
      // Les composants UI et les contrôleurs sont généralement actifs
      result.status = 'active';
      result.confidence = 0.7;
    }

    // Classification spéciale pour les logs et rapports
    if (/\.log$|report|rapport|migration-report|statistics/.test(filePath) && !isDeprecated) {
      result.status = 'active';
      result.domain = 'documentation';
      result.confidence = 0.8;
    }

    // Classification basée sur l'extension de fichier
    if (extension && !result.domain) {
      switch (extension) {
        case '.sql':
          result.domain = 'migration';
          result.layer = 'business';
          result.confidence = 0.7;
          break;
        case '.sh':
        case '.bash':
          result.domain = 'tools';
          result.layer = 'orchestration';
          result.confidence = 0.7;
          break;
        case '.md':
          result.domain = 'documentation';
          result.confidence = 0.9;
          break;
        case '.json':
        case '.yaml':
        case '.yml':
          result.layer = 'shared';
          result.confidence = 0.6;
          break;
        case '.tsx':
        case '.jsx':
          result.layer = 'business';
          result.confidence = 0.65;
          break;
        case '.html':
          result.layer = 'business';
          result.domain = 'dashboard';
          result.confidence = 0.65;
          break;
        case '.ts':
        case '.js':
          // Pour les fichiers .ts/.js, vérifier s'ils sont dans des dossiers spécifiques
          if (filePath.includes('/tools/')) {
            result.domain = 'tools';
            result.layer = 'coordination';
          } else if (filePath.includes('/agents/')) {
            result.domain = 'migration';
            result.layer = 'coordination';
          }
          result.confidence = 0.6;
          break;
      }
    }

    result.source = 'deep-analysis';
    return result;
  } catch (_error) {
    return {
      source: 'unreadable',
      confidence: 0.1,
    };
  }
}

/**
 * Combine la classification par pattern et l'analyse approfondie
 */
function combineClassifications(
  patternClassification: Classification,
  deepAnalysis: Partial<Classification>
): Classification {
  if (!deepAnalysis.source) {
    return patternClassification;
  }

  // Si la classification par pattern a une confiance élevée, on privilégie ces valeurs
  const patternConfidence = patternClassification.confidence || 0;
  const deepConfidence = deepAnalysis.confidence || 0;

  return {
    layer:
      deepAnalysis.layer && deepConfidence > patternConfidence
        ? deepAnalysis.layer
        : patternClassification.layer,

    domain:
      deepAnalysis.domain && deepConfidence > patternConfidence
        ? deepAnalysis.domain
        : patternClassification.domain,

    status:
      deepAnalysis.status && deepConfidence > 0.7
        ? // On privilégie le statut détecté profondément
          deepAnalysis.status
        : patternClassification.status,

    source: `${patternClassification.source}+${deepAnalysis.source}`,

    confidence: Math.max(patternConfidence, deepConfidence),
  };
}

/**
 * Effectue une analyse contextuelle par voisinage pour améliorer les classifications
 */
function performNeighborhoodAnalysis(classifications: Record<string, Classification>): {
  improvedClassifications: Record<string, FileClassification>;
  improvements: Record<string, string[]>;
} {
  // Transformer les Classifications en FileClassifications
  const fileClassifications: Record<string, FileClassification> = {};

  Object.entries(classifications).forEach(([filePath, classification]) => {
    fileClassifications[filePath] = {
      ...classification,
      file: filePath,
    };
  });

  const filePaths = Object.keys(fileClassifications);
  let enhancedCount = 0;
  const improvements: Record<string, string[]> = {};

  // Fonction pour obtenir le répertoire parent d'un chemin
  const getParentDir = (filePath: string): string => {
    const dir = path.dirname(filePath);
    return dir === '.' ? '' : dir;
  };

  // Premier passage : créer une carte des répertoires et de leurs contenus
  const dirContentsMap = new Map<string, string[]>();
  const dirClassificationMap = new Map<string, Map<string, number>>();

  // Pour chaque dimension (layer, domain, status), préparer une carte de comptage par répertoire
  const dimensions = ['layer', 'domain', 'status'] as const;

  // Initialiser les cartes de classification par répertoire
  dimensions.forEach((dimension) => {
    dirClassificationMap.set(dimension, new Map<string, number>());
  });

  // Remplir la carte des répertoires et compter les classifications
  filePaths.forEach((filePath) => {
    const dir = getParentDir(filePath);
    if (!dirContentsMap.has(dir)) {
      dirContentsMap.set(dir, []);
    }
    const dirContents = dirContentsMap.get(dir);
    if (dirContents) {
      dirContents.push(filePath);
    }

    const classification = fileClassifications[filePath];
    if (classification) {
      dimensions.forEach((dimension) => {
        if (
          classification[dimension] &&
          classification[dimension] !== 'unknown' &&
          classification.confidence >= 0.6
        ) {
          const dimensionMap = dirClassificationMap.get(dimension);
          if (dimensionMap) {
            const key = `${dir}:${classification[dimension]}`;
            dimensionMap.set(key, (dimensionMap.get(key) || 0) + 1);
          }
        }
      });
    }
  });

  // Deuxième passage : analyser les fichiers non classifiés ou avec faible confiance
  filePaths.forEach((filePath) => {
    const classification = fileClassifications[filePath];
    if (!classification) return;

    const dir = getParentDir(filePath);
    const dirContents = dirContentsMap.get(dir) || [];
    const fileName = path.basename(filePath).toLowerCase();
    const extension = path.extname(filePath).toLowerCase();
    const fileImprovements: string[] = [];

    // Traiter chaque dimension
    dimensions.forEach((dimension) => {
      // Ne pas modifier si déjà classifié avec une confiance suffisante
      if (classification[dimension] !== 'unknown' && classification.confidence >= 0.7) {
        return;
      }

      // Collecter les classifications existantes dans le même répertoire
      const dimensionMap = dirClassificationMap.get(dimension);
      if (!dimensionMap) return;

      const dirStats = new Map<string, number>();

      // Analyser les statistiques du répertoire
      Array.from(dimensionMap.entries())
        .filter(([key]) => key.startsWith(`${dir}:`))
        .forEach(([key, count]) => {
          const value = key.split(':')[1];
          if (value) {
            dirStats.set(value, (dirStats.get(value) || 0) + count);
          }
        });

      // Si le répertoire a des classifications dominantes, les appliquer
      if (dirStats.size > 0) {
        const totalFiles = dirContents.length;
        const entries = Array.from(dirStats.entries());
        entries.sort((a, b) => b[1] - a[1]);

        if (entries.length > 0) {
          // Vérifions si entries[0] existe bien
          const firstEntry = entries[0];
          if (firstEntry) {
            const dominantValue = firstEntry[0];
            const dominantCount = firstEntry[1];
            const dominantRatio = dominantCount / totalFiles;

            if (dominantRatio >= 0.5 && totalFiles >= 3) {
              // Si plus de 50% des fichiers dans le répertoire partagent la même classification
              // et qu'il y a au moins 3 fichiers, alors appliquer cette classification
              const oldValue = classification[dimension];
              classification[dimension] = dominantValue as any;
              classification.confidence = Math.min(0.7, dominantRatio);
              classification.source = 'neighborhood-directory';
              enhancedCount++;
              fileImprovements.push(`${dimension}: ${oldValue} -> ${dominantValue}`);
            }
          }
        }
      }
    });

    // Classification par extension de fichier (analyse approfondie par type)
    if (classification.layer === 'unknown' && extension) {
      switch (extension) {
        case '.json':
        case '.yml':
        case '.yaml':
        case '.toml': {
          const oldLayer1 = classification.layer;
          classification.layer = 'shared';
          classification.confidence = 0.6;
          classification.source = 'file-type';
          enhancedCount++;
          fileImprovements.push(`layer: ${oldLayer1} -> shared`);
          break;
        }
        case '.md':
        case '.txt':
        case '.pdf': {
          const oldLayer2 = classification.layer;
          const oldDomain = classification.domain;
          classification.layer = 'shared';
          classification.domain =
            classification.domain === 'unknown' ? 'documentation' : classification.domain;
          classification.confidence = 0.7;
          classification.source = 'file-type';
          enhancedCount++;
          fileImprovements.push(`layer: ${oldLayer2} -> shared`);
          if (oldDomain === 'unknown') {
            fileImprovements.push('domain: unknown -> documentation');
          }
          break;
        }
        case '.log': {
          const oldDomain2 = classification.domain;
          const oldStatus = classification.status;
          classification.domain = 'documentation';
          classification.status = 'active';
          classification.confidence = 0.6;
          classification.source = 'file-type';
          enhancedCount++;
          fileImprovements.push(`domain: ${oldDomain2} -> documentation`);
          fileImprovements.push(`status: ${oldStatus} -> active`);
          break;
        }
      }
    }

    // Classification par préfixe/suffixe de nom de fichier
    if (classification.status === 'unknown') {
      if (fileName.match(/\.bak$|\.old$|\.backup$|-deprecated/)) {
        const oldStatus = classification.status;
        classification.status = 'deprecated';
        classification.confidence = 0.8;
        classification.source = 'filename-pattern';
        enhancedCount++;
        fileImprovements.push(`status: ${oldStatus} -> deprecated`);
      } else if (fileName.match(/test|spec/)) {
        const oldStatus = classification.status;
        classification.status = 'testing';
        classification.confidence = 0.7;
        classification.source = 'filename-pattern';
        enhancedCount++;
        fileImprovements.push(`status: ${oldStatus} -> testing`);
      } else if (fileName.match(/draft|wip|experimental|beta/)) {
        const oldStatus = classification.status;
        classification.status = 'developing';
        classification.confidence = 0.7;
        classification.source = 'filename-pattern';
        enhancedCount++;
        fileImprovements.push(`status: ${oldStatus} -> developing`);
      }
    }

    // Analyse basée sur les fichiers adjacents du même type
    const similarFiles = dirContents.filter((p) => path.extname(p) === extension && p !== filePath);
    if (similarFiles.length > 0) {
      const similarClassifications = similarFiles
        .map((p) => fileClassifications[p])
        .filter((c) => c && c.confidence >= 0.7);

      if (similarClassifications.length > 0) {
        dimensions.forEach((dimension) => {
          if (classification[dimension] === 'unknown') {
            // Compter les valeurs pour cette dimension
            const valueCount = new Map<string, number>();
            similarClassifications.forEach((c) => {
              if (c) {
                const value = c[dimension];
                if (value !== 'unknown') {
                  valueCount.set(value, (valueCount.get(value) || 0) + 1);
                }
              }
            });

            // Trouver la valeur la plus fréquente
            if (valueCount.size > 0) {
              const entries = Array.from(valueCount.entries());
              entries.sort((a, b) => b[1] - a[1]);

              if (entries.length > 0) {
                const firstEntry = entries[0];
                if (firstEntry) {
                  const dominantValue = firstEntry[0];
                  const dominantCount = firstEntry[1];

                  if (dominantCount >= 2 || (dominantCount === 1 && similarFiles.length === 1)) {
                    // Appliquer la classification si elle est dominante
                    const oldValue = classification[dimension];
                    classification[dimension] = dominantValue as any;
                    classification.confidence = 0.6;
                    classification.source = 'neighborhood-similarity';
                    enhancedCount++;
                    fileImprovements.push(`${dimension}: ${oldValue} -> ${dominantValue}`);
                  }
                }
              }
            }
          }
        });
      }
    }

    // Analyse par relation de nommage entre fichiers
    if (classification.domain === 'unknown' || classification.layer === 'unknown') {
      const baseName = fileName.replace(extension, '');
      const relatedFiles = filePaths.filter((p) => {
        const otherName = path.basename(p).toLowerCase();
        return (
          p !== filePath &&
          (otherName.includes(baseName) ||
            baseName.includes(otherName.replace(path.extname(p), '')))
        );
      });

      if (relatedFiles.length > 0) {
        const relatedClassifications = relatedFiles
          .map((p) => fileClassifications[p])
          .filter((c) => c && c.confidence >= 0.7);

        dimensions.forEach((dimension) => {
          if (classification[dimension] === 'unknown') {
            // Voir si une valeur domine dans les fichiers liés par le nom
            const valueCount = new Map<string, number>();
            relatedClassifications.forEach((c) => {
              if (c) {
                const value = c[dimension];
                if (value !== 'unknown') {
                  valueCount.set(value, (valueCount.get(value) || 0) + 1);
                }
              }
            });

            if (valueCount.size > 0) {
              const entries = Array.from(valueCount.entries());
              entries.sort((a, b) => b[1] - a[1]);

              if (entries.length > 0) {
                const firstEntry = entries[0];
                if (firstEntry) {
                  const dominantValue = firstEntry[0];
                  const dominantCount = firstEntry[1];

                  if (dominantCount >= 2 || (dominantCount === 1 && relatedFiles.length === 1)) {
                    const oldValue = classification[dimension];
                    classification[dimension] = dominantValue as any;
                    classification.confidence = 0.6;
                    classification.source = 'neighborhood-naming';
                    enhancedCount++;
                    fileImprovements.push(`${dimension}: ${oldValue} -> ${dominantValue}`);
                  }
                }
              }
            }
          }
        });
      }
    }

    // Enregistrer les améliorations pour ce fichier
    if (fileImprovements.length > 0) {
      improvements[filePath] = fileImprovements;
    }
  });

  console.log(`Enhanced ${enhancedCount} classifications via neighborhood analysis`);

  return {
    improvedClassifications: fileClassifications,
    improvements,
  };
}

/**
 * Génère un rapport Markdown basé sur le rapport de classification
 */
function generateMarkdownReport(report: ClassificationReport): string {
  const { metadata, statistics, groups, contextualAnalysis } = report;

  const markdownContent = `# Rapport de Classification Structurelle
  
## Métadonnées

- **Date de génération :** ${new Date(metadata.generatedAt).toLocaleString()}
- **Version de structure-map :** ${metadata.structureMapVersion}
- **Dernière mise à jour de structure-map :** ${metadata.structureMapUpdated}
- **Fichiers analysés :** ${metadata.filesAnalyzed}
- **Temps d'exécution :** ${(metadata.executionTimeMs / 1000).toFixed(2)} secondes
${
  contextualAnalysis
    ? `- **Fichiers améliorés par analyse contextuelle :** ${contextualAnalysis.filesImproved}`
    : ''
}

## Statistiques

### Par couche architecturale
${Object.entries(statistics.byLayer)
  .sort(([, a], [, b]) => b - a)
  .map(([layer, count]) => `- **${layer}** : ${count} fichiers`)
  .join('\n')}

### Par domaine fonctionnel
${Object.entries(statistics.byDomain)
  .sort(([, a], [, b]) => b - a)
  .map(([domain, count]) => `- **${domain}** : ${count} fichiers`)
  .join('\n')}

### Par statut
${Object.entries(statistics.byStatus)
  .sort(([, a], [, b]) => b - a)
  .map(([status, count]) => `- **${status}** : ${count} fichiers`)
  .join('\n')}

## Fichiers Business Actifs (Top 20)

Les fichiers du domaine métier qui sont activement utilisés :

${groups.activeBusinessFiles
  .slice(0, 20)
  .map((file) => `- \`${file}\``)
  .join('\n')}

## Fichiers d'Orchestration (Top 20)

Les fichiers impliqués dans l'orchestration du système :

${groups.orchestrationFiles
  .slice(0, 20)
  .map((file) => `- \`${file}\``)
  .join('\n')}

## Fichiers en Développement (Top 20)

Les fichiers actuellement en cours de développement :

${groups.developingFiles
  .slice(0, 20)
  .map((file) => `- \`${file}\``)
  .join('\n')}

## Fichiers Dépréciés (Top 20)

Les fichiers marqués comme dépréciés ou obsolètes :

${groups.depreciatedFiles
  .slice(0, 20)
  .map((file) => `- \`${file}\``)
  .join('\n')}

## À Surveiller : Fichiers à Faible Confiance (Top 20)

Fichiers dont la classification est incertaine (niveau de confiance < 0.5) :

${groups.lowConfidenceFiles
  .slice(0, 20)
  .map((file) => `- \`${file}\``)
  .join('\n')}
${
  contextualAnalysis && contextualAnalysis.filesImproved > 0
    ? `

## Améliorations par Analyse Contextuelle

Fichiers dont la classification a été améliorée par analyse de voisinage :

${Object.entries(contextualAnalysis.neighborhoodImprovements)
  .slice(0, 20)
  .map(([file, improvements]) => `- \`${file}\`: ${improvements.join(', ')}`)
  .join('\n')}
`
    : ''
}
`;

  return markdownContent;
}

/**
 * Agrège les résultats et génère les statistiques
 */
function aggregateResults(
  classifications: Record<string, FileClassification>,
  structureMapVersion: string,
  structureMapUpdated: string,
  startTime: number,
  neighborhoodImprovements?: Record<string, string[]>
): ClassificationReport {
  const statistics = {
    byLayer: {} as Record<string, number>,
    byDomain: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
  };

  const groups = {
    activeBusinessFiles: [] as string[],
    orchestrationFiles: [] as string[],
    depreciatedFiles: [] as string[],
    developingFiles: [] as string[],
    highConfidenceFiles: [] as string[],
    lowConfidenceFiles: [] as string[],
  };

  // Calculer les statistiques
  Object.entries(classifications).forEach(([file, classification]) => {
    // Statistiques par catégorie
    statistics.byLayer[classification.layer] = (statistics.byLayer[classification.layer] || 0) + 1;
    statistics.byDomain[classification.domain] =
      (statistics.byDomain[classification.domain] || 0) + 1;
    statistics.byStatus[classification.status] =
      (statistics.byStatus[classification.status] || 0) + 1;
    statistics.bySource[classification.source] =
      (statistics.bySource[classification.source] || 0) + 1;

    // Groupes
    if (classification.layer === 'business' && classification.status === 'active') {
      groups.activeBusinessFiles.push(file);
    }

    if (classification.layer === 'orchestration') {
      groups.orchestrationFiles.push(file);
    }

    if (classification.status === 'deprecated' || classification.status === 'legacy') {
      groups.depreciatedFiles.push(file);
    }

    if (classification.status === 'developing') {
      groups.developingFiles.push(file);
    }

    if (classification.confidence >= 0.8) {
      groups.highConfidenceFiles.push(file);
    } else if (classification.confidence < 0.5) {
      groups.lowConfidenceFiles.push(file);
    }
  });

  const result: ClassificationReport = {
    metadata: {
      generatedAt: new Date().toISOString(),
      projectRoot: process.cwd(),
      filesAnalyzed: Object.keys(classifications).length,
      structureMapVersion,
      structureMapUpdated,
      executionTimeMs: Date.now() - startTime,
    },
    classifications,
    statistics,
    groups,
  };

  // Ajouter les informations d'analyse contextuelle si disponibles
  if (neighborhoodImprovements) {
    result.contextualAnalysis = {
      filesImproved: Object.keys(neighborhoodImprovements).length,
      neighborhoodImprovements,
    };
  }

  return result;
}

/**
 * Valide le fichier structure-map.json et vérifie que toutes les valeurs sont conformes au schéma
 */
function validateStructureMap(structureMap: unknown): asserts structureMap is StructureMap {
  // Validation de la structure de base
  if (!structureMap || typeof structureMap !== 'object') {
    throw new Error('Le fichier structure-map.json doit contenir un objet JSON valide');
  }

  const sm = structureMap as Partial<StructureMap>;

  if (!sm.version || typeof sm.version !== 'string') {
    throw new Error('Le champ "version" est manquant ou invalide dans structure-map.json');
  }

  if (!sm.updated || typeof sm.updated !== 'string') {
    throw new Error('Le champ "updated" est manquant ou invalide dans structure-map.json');
  }

  if (!sm.taxonomySchema || typeof sm.taxonomySchema !== 'object') {
    throw new Error('Le champ "taxonomySchema" est manquant ou invalide dans structure-map.json');
  }

  // Validation des schémas de taxonomie
  const taxo = sm.taxonomySchema as Partial<StructureMap['taxonomySchema']>;

  if (!taxo.layer || !Array.isArray(taxo.layer.values)) {
    throw new Error('Le schéma de taxonomie "layer" est manquant ou invalide');
  }

  if (!taxo.domain || !Array.isArray(taxo.domain.values)) {
    throw new Error('Le schéma de taxonomie "domain" est manquant ou invalide');
  }

  if (!taxo.status || !Array.isArray(taxo.status.values)) {
    throw new Error('Le schéma de taxonomie "status" est manquant ou invalide');
  }

  // Validation des valeurs par défaut
  if (!sm.defaultClassification || typeof sm.defaultClassification !== 'object') {
    throw new Error('Le champ "defaultClassification" est manquant ou invalide');
  }

  const defaultClassif = sm.defaultClassification as Partial<Classification>;

  if (!defaultClassif.layer || !taxo.layer.values.includes(defaultClassif.layer)) {
    throw new Error(
      `La valeur par défaut pour "layer" (${
        defaultClassif.layer
      }) n'est pas valide. Valeurs possibles : ${taxo.layer.values.join(', ')}`
    );
  }

  if (!defaultClassif.domain || !taxo.domain.values.includes(defaultClassif.domain)) {
    throw new Error(
      `La valeur par défaut pour "domain" (${
        defaultClassif.domain
      }) n'est pas valide. Valeurs possibles : ${taxo.domain.values.join(', ')}`
    );
  }

  if (!defaultClassif.status || !taxo.status.values.includes(defaultClassif.status)) {
    throw new Error(
      `La valeur par défaut pour "status" (${
        defaultClassif.status
      }) n'est pas valide. Valeurs possibles : ${taxo.status.values.join(', ')}`
    );
  }

  // Validation des classifications de dossiers
  if (!Array.isArray(sm.folderClassifications)) {
    throw new Error('Le champ "folderClassifications" doit être un tableau');
  }

  for (let i = 0; i < sm.folderClassifications.length; i++) {
    const rule = sm.folderClassifications[i];
    if (!rule || typeof rule !== 'object') {
      throw new Error(`La règle de classification de dossier à l'index ${i} est invalide`);
    }
    if (typeof rule.pattern !== 'string') {
      throw new Error(
        `La règle de classification de dossier à l'index ${i} doit avoir un champ "pattern" de type string`
      );
    }
    if (!rule.classification || typeof rule.classification !== 'object') {
      throw new Error(
        `La règle de classification de dossier à l'index ${i} doit avoir un champ "classification" valide`
      );
    }

    // Validation des valeurs de classification
    validateClassificationValues(rule.classification, taxo, i, 'folder');
  }

  // Validation des classifications de fichiers
  if (!Array.isArray(sm.fileClassifications)) {
    throw new Error('Le champ "fileClassifications" doit être un tableau');
  }

  for (let i = 0; i < sm.fileClassifications.length; i++) {
    const rule = sm.fileClassifications[i];
    if (!rule || typeof rule !== 'object') {
      throw new Error(`La règle de classification de fichier à l'index ${i} est invalide`);
    }
    if (typeof rule.pattern !== 'string') {
      throw new Error(
        `La règle de classification de fichier à l'index ${i} doit avoir un champ "pattern" de type string`
      );
    }
    if (!rule.classification || typeof rule.classification !== 'object') {
      throw new Error(
        `La règle de classification de fichier à l'index ${i} doit avoir un champ "classification" valide`
      );
    }

    // Validation des valeurs de classification
    validateClassificationValues(rule.classification, taxo, i, 'file');
  }
}

/**
 * Valide que les valeurs de classification correspondent aux valeurs autorisées dans le schéma
 */
function validateClassificationValues(
  classification: Partial<Classification>,
  taxonomySchema: Partial<StructureMap['taxonomySchema']>,
  index: number,
  type: 'file' | 'folder'
) {
  if (classification.layer && !taxonomySchema.layer?.values.includes(classification.layer)) {
    throw new Error(
      `La valeur "${classification.layer}" pour "layer" dans la règle de classification ${type} à l'index ${index} n'est pas valide. ` +
        `Valeurs possibles : ${taxonomySchema.layer?.values.join(', ')}`
    );
  }

  if (classification.domain && !taxonomySchema.domain?.values.includes(classification.domain)) {
    throw new Error(
      `La valeur "${classification.domain}" pour "domain" dans la règle de classification ${type} à l'index ${index} n'est pas valide. ` +
        `Valeurs possibles : ${taxonomySchema.domain?.values.join(', ')}`
    );
  }

  if (classification.status && !taxonomySchema.status?.values.includes(classification.status)) {
    throw new Error(
      `La valeur "${classification.status}" pour "status" dans la règle de classification ${type} à l'index ${index} n'est pas valide. ` +
        `Valeurs possibles : ${taxonomySchema.status?.values.join(', ')}`
    );
  }
}

// Thread principal pour paralléliser l'analyse
if (isMainThread) {
  async function main() {
    const startTime = Date.now();
    const config = parseCliArgs();

    try {
      console.log('🔍 Structure Classifier Agent v1.4.1');

      // Vérifier que structure-map.json existe
      if (!fs.existsSync(config.structureMapPath)) {
        throw new Error(
          `Le fichier structure-map.json est introuvable au chemin : ${config.structureMapPath}`
        );
      }

      // Lire le fichier structure-map.json
      let structureMapContent: string;
      try {
        structureMapContent = fs.readFileSync(config.structureMapPath, 'utf-8');
      } catch (error) {
        throw new Error(
          `Erreur lors de la lecture du fichier ${config.structureMapPath}: ${
            (error as Error).message
          }`
        );
      }

      // Parser le JSON
      let structureMapJson: unknown;
      try {
        structureMapJson = JSON.parse(structureMapContent);
      } catch (error) {
        throw new Error(
          `Le fichier ${config.structureMapPath} n'est pas un JSON valide: ${
            (error as Error).message
          }`
        );
      }

      // Valider la structure et les valeurs du fichier
      console.log('🔍 Validation du fichier structure-map.json...');
      try {
        validateStructureMap(structureMapJson);
        console.log('✅ Fichier structure-map.json validé avec succès');
      } catch (error) {
        throw new Error(
          `Validation du fichier structure-map.json échouée: ${(error as Error).message}`
        );
      }

      const structureMap: StructureMap = structureMapJson as StructureMap;
      console.log(
        `📚 Utilisation de structure-map.json v${structureMap.version} (mise à jour : ${structureMap.updated})`
      );

      // Trouver tous les fichiers à analyser
      console.log('🔎 Recherche de fichiers à analyser...');
      const files = await fastGlob.default(['**/*.*'], {
        ignore: config.ignorePatterns,
        dot: config.includeHidden,
      });

      console.log(`📄 ${files.length} fichiers trouvés`);

      // Diviser le travail entre les workers pour l'analyse parallèle
      const chunkSize = Math.ceil(files.length / config.numWorkers);
      const chunks = Array.from({ length: config.numWorkers }, (_, i) => {
        const start = i * chunkSize;
        return files.slice(start, start + chunkSize);
      });

      console.log(`👷 Démarrage de l'analyse avec ${config.numWorkers} workers...`);

      // Créer une promesse pour chaque worker
      const workerPromises = chunks.map((chunk, index) => {
        return new Promise<WorkerResult[]>((resolve, reject) => {
          const worker = new Worker(__filename, {
            workerData: {
              files: chunk,
              structureMap,
              workerId: index + 1,
            },
          });

          worker.on('message', resolve);
          worker.on('error', reject);
          worker.on('exit', (code) => {
            if (code !== 0) {
              reject(new Error(`Le worker ${index + 1} a quitté avec le code ${code}`));
            }
          });
        });
      });

      // Attendre que tous les workers aient terminé
      const results = await Promise.all(workerPromises);

      // Fusionner les résultats de tous les workers
      let classifications: Record<string, FileClassification> = {};

      results.forEach((workerResults) => {
        workerResults.forEach((result) => {
          classifications[result.filePath] = {
            ...result.classification,
            file: result.filePath,
          };
        });
      });

      console.log(
        `✅ Classification initiale terminée pour ${Object.keys(classifications).length} fichiers`
      );

      // Effectuer l'analyse contextuelle par voisinage
      console.log("🔍 Application de l'analyse contextuelle par voisinage...");
      const { improvedClassifications, improvements } =
        performNeighborhoodAnalysis(classifications);
      classifications = improvedClassifications;

      const improvementCount = Object.keys(improvements).length;
      console.log(`✨ Analyse contextuelle terminée : ${improvementCount} fichiers améliorés`);

      // Générer le rapport
      const report = aggregateResults(
        classifications,
        structureMap.version,
        structureMap.updated,
        startTime,
        improvements
      );

      // Créer le dossier de sortie s'il n'existe pas
      const outputDir = path.dirname(config.outputJsonPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Écrire le rapport JSON
      fs.writeFileSync(config.outputJsonPath, JSON.stringify(report, null, 2));
      console.log(`📊 Rapport de classification enregistré dans ${config.outputJsonPath}`);

      // Générer et écrire le rapport Markdown si demandé
      if (config.outputMarkdownPath) {
        const markdownReport = generateMarkdownReport(report);
        fs.writeFileSync(config.outputMarkdownPath, markdownReport);
        console.log(`📝 Rapport Markdown enregistré dans ${config.outputMarkdownPath}`);
      }

      console.log(
        `⏱️ Temps d'analyse total : ${((Date.now() - startTime) / 1000).toFixed(2)} secondes`
      );
    } catch (error) {
      console.error('❌ Erreur :', error);
      process.exit(1);
    }
  }

  main();
} else {
  // Code exécuté dans les workers
  const { files, structureMap, workerId } = workerData;

  const results: WorkerResult[] = [];
  let processed = 0;

  files.forEach((filePath: string) => {
    try {
      // Classification initiale basée sur les patterns
      const patternClassification = classifyByPattern(filePath, structureMap);

      // Analyse approfondie du contenu si nécessaire
      const shouldDoDeepAnalysis =
        patternClassification.source === 'default' || patternClassification.confidence < 0.7;

      let finalClassification: Classification;

      if (shouldDoDeepAnalysis) {
        const deepAnalysis = deepContentAnalysis(filePath);
        finalClassification = combineClassifications(patternClassification, deepAnalysis);
      } else {
        finalClassification = patternClassification;
      }

      results.push({ filePath, classification: finalClassification });

      processed++;
      if (processed % 100 === 0) {
        console.log(`👷 Worker ${workerId}: ${processed}/${files.length} fichiers traités...`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la classification de ${filePath}:`, error);

      // Ajouter quand même le fichier avec une classification par défaut
      results.push({
        filePath,
        classification: {
          ...structureMap.defaultClassification,
          source: 'error',
          confidence: 0.1,
        },
      });
    }
  });

  console.log(`✅ Worker ${workerId}: Terminé, ${results.length} fichiers classifiés`);
  parentPort?.postMessage(results);
}
