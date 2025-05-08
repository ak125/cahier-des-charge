import path from 'path';
import { readFile } from 'fs/promises';

/**
 * Types pour les données d'audit du pipeline
 */

export interface AuditIssue {
  id: string;
  status: string;
  type?: string;
  missing?: string[];
  generatedFiles?: string[];
  lastUpdated?: string;
  age?: string;
  recommendation?: string;
}

export interface AuditReport {
  timestamp: string;
  totalManifests: number;
  issues: AuditIssue[];
  statistics: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    missingAgents: Record<string, number>;
    ageDistribution: Record<string, number>;
    completionRate: number;
  };
}

export interface TraceSummary {
  timestamp: string;
  totalManifests: number;
  tracesGenerated: number;
  tracesWithMissing: number;
  completionPercentage: number;
}

export interface TrendReport {
  data: {
    dates: string[];
    completionRates: number[];
    issuesCounts: number[];
    tracesWithMissing: number[];
  };
  analysis: {
    improvingCompletionRate: boolean;
    decreasingIssues: boolean;
    latestCompletionRate: number;
    latestIssuesCount: number;
  };
}

export interface PipelineAuditData {
  auditReport: AuditReport;
  traceSummary: TraceSummary;
  trendReport?: TrendReport;
  missingAgentsData: { agent: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  lastUpdated: Date;
}

/**
 * Chemins vers les fichiers d'audit
 */
const DATA_PATHS = {
  statusAudit: path.resolve('public/data/pipeline-audit/status-audit-report.json'),
  traceVerification: path.resolve('public/data/pipeline-audit/trace-verification-report.json'),
  trendReport: path.resolve('public/data/pipeline-audit/pipeline-trend-report.json'),
  lastUpdate: path.resolve('public/data/pipeline-audit/last-update.json'),
  // Chemins alternatifs en cas d'échec de lecture des fichiers principaux
  fallbackPaths: {
    statusAudit: path.resolve('../../status-audit-report.json'),
    traceVerification: path.resolve('../../trace-verification-report.json'),
    trendReport: path.resolve('../../pipeline-trend-report.json'),
  },
};

/**
 * Charge un fichier JSON avec fallback en cas d'échec
 */
async function loadJsonFile<T>(filePath: string, fallbackPath?: string): Promise<T | null> {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (primaryError) {
    if (fallbackPath) {
      try {
        const fallbackContent = await readFile(fallbackPath, 'utf-8');
        return JSON.parse(fallbackContent) as T;
      } catch (_fallbackError) {
        console.error(
          `Erreur lors de la lecture du fichier ${filePath} ou de son fallback:`,
          primaryError
        );
        return null;
      }
    }
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, primaryError);
    return null;
  }
}

/**
 * Génère des données simulées en cas d'absence de fichiers d'audit réels
 */
function generateMockAuditData(): PipelineAuditData {
  const auditReport: AuditReport = {
    timestamp: new Date().toISOString(),
    totalManifests: 86,
    issues: [
      {
        id: 'MIG-093',
        status: 'in_progress',
        type: 'standard',
        missing: ['qa-analyzer', 'seo-checker'],
        generatedFiles: ['fiche.tsx', 'fiche.meta.ts'],
        lastUpdated: '2025-04-19T14:30:00.000Z',
        age: '4 jours',
      },
      {
        id: 'MIG-087',
        status: 'planned',
        type: 'api',
        lastUpdated: '2025-04-13T09:15:00.000Z',
        age: '11 jours',
        recommendation: 'Replanifier ou invalider',
      },
      // Exemple simplifié pour garder le code concis
    ],
    statistics: {
      byStatus: {
        planned: 12,
        detected: 8,
        analyzed: 15,
        structured: 10,
        generated: 14,
        validated: 9,
        integrated: 6,
        completed: 12,
      },
      byType: {
        standard: 45,
        api: 22,
        cms: 19,
      },
      missingAgents: {
        'php-analyzer': 2,
        'structure-classifier-agent': 5,
        'remix-generator': 7,
        'qa-analyzer': 9,
        'seo-checker': 8,
        'pr-creator': 4,
      },
      ageDistribution: {
        'Moins de 3 jours': 32,
        '3-7 jours': 28,
        '7-14 jours': 18,
        '14+ jours': 8,
      },
      completionRate: 14,
    },
  };

  const traceSummary: TraceSummary = {
    timestamp: new Date().toISOString(),
    totalManifests: 86,
    tracesGenerated: 82,
    tracesWithMissing: 24,
    completionPercentage: 71,
  };

  const missingAgentsData = Object.entries(auditReport.statistics.missingAgents).map(
    ([agent, count]) => ({
      agent: agent.replace('-agent', ''),
      count,
    })
  );

  const statusDistribution = Object.entries(auditReport.statistics.byStatus).map(
    ([status, count]) => ({
      status,
      count,
    })
  );

  return {
    auditReport,
    traceSummary,
    missingAgentsData,
    statusDistribution,
    lastUpdated: new Date(),
  };
}

/**
 * Charge toutes les données d'audit du pipeline
 */
export async function loadPipelineAuditData(): Promise<PipelineAuditData> {
  try {
    // Tenter de charger les données d'audit
    const auditReport = await loadJsonFile<AuditReport>(
      DATA_PATHS.statusAudit,
      DATA_PATHS.fallbackPaths.statusAudit
    );

    const traceSummary = await loadJsonFile<TraceSummary>(
      DATA_PATHS.traceVerification,
      DATA_PATHS.fallbackPaths.traceVerification
    );

    const trendReport = await loadJsonFile<TrendReport>(
      DATA_PATHS.trendReport,
      DATA_PATHS.fallbackPaths.trendReport
    );

    const lastUpdateInfo = await loadJsonFile<{ lastUpdated: string }>(DATA_PATHS.lastUpdate);

    // Créer un rapport minimal si les données sont manquantes, au lieu d'utiliser des données simulées
    const baseAuditReport: AuditReport = auditReport || {
      timestamp: new Date().toISOString(),
      totalManifests: 0,
      issues: [],
      statistics: {
        byStatus: {},
        byType: {},
        missingAgents: {},
        ageDistribution: {},
        completionRate: 0,
      },
    };

    const baseTraceSummary: TraceSummary = traceSummary || {
      timestamp: new Date().toISOString(),
      totalManifests: 0,
      tracesGenerated: 0,
      tracesWithMissing: 0,
      completionPercentage: 0,
    };

    // S'assurer que toutes les propriétés nécessaires existent
    if (!baseAuditReport.statistics) {
      baseAuditReport.statistics = {
        byStatus: {},
        byType: {},
        missingAgents: {},
        ageDistribution: {},
        completionRate: 0,
      };
    }

    // Gérer le cas où certaines propriétés sont undefined
    baseAuditReport.statistics.missingAgents = baseAuditReport.statistics.missingAgents || {};
    baseAuditReport.statistics.byStatus = baseAuditReport.statistics.byStatus || {};
    baseAuditReport.statistics.byType = baseAuditReport.statistics.byType || {};
    baseAuditReport.statistics.ageDistribution = baseAuditReport.statistics.ageDistribution || {};

    // Initialiser les tableaux vides par défaut pour les données dérivées
    let missingAgentsData: { agent: string; count: number }[] = [];
    let statusDistribution: { status: string; count: number }[] = [];

    // Générer les données dérivées pour les graphiques seulement si les objets sources ne sont pas vides
    if (Object.keys(baseAuditReport.statistics.missingAgents).length > 0) {
      missingAgentsData = Object.entries(baseAuditReport.statistics.missingAgents).map(
        ([agent, count]) => ({
          agent: agent.replace('-agent', ''),
          count,
        })
      );
    }

    if (Object.keys(baseAuditReport.statistics.byStatus).length > 0) {
      statusDistribution = Object.entries(baseAuditReport.statistics.byStatus).map(
        ([status, count]) => ({
          status,
          count,
        })
      );
    }

    // Assembler l'objet final avec les données réelles
    return {
      auditReport: baseAuditReport,
      traceSummary: baseTraceSummary,
      trendReport: trendReport,
      missingAgentsData,
      statusDistribution,
      lastUpdated: lastUpdateInfo
        ? new Date(lastUpdateInfo.lastUpdated)
        : new Date(
            Math.max(
              new Date(baseAuditReport.timestamp).getTime(),
              new Date(baseTraceSummary.timestamp).getTime()
            )
          ),
    };
  } catch (error) {
    console.error("Erreur lors du chargement des données d'audit:", error);

    // Au lieu d'utiliser des données simulées, créer un objet minimal avec des tableaux/objets vides
    const emptyAuditReport: AuditReport = {
      timestamp: new Date().toISOString(),
      totalManifests: 0,
      issues: [],
      statistics: {
        byStatus: {},
        byType: {},
        missingAgents: {},
        ageDistribution: {},
        completionRate: 0,
      },
    };

    const emptyTraceSummary: TraceSummary = {
      timestamp: new Date().toISOString(),
      totalManifests: 0,
      tracesGenerated: 0,
      tracesWithMissing: 0,
      completionPercentage: 0,
    };

    return {
      auditReport: emptyAuditReport,
      traceSummary: emptyTraceSummary,
      missingAgentsData: [],
      statusDistribution: [],
      lastUpdated: new Date(),
    };
  }
}

/**
 * Exécute l'audit du pipeline MCP à la demande
 */
export async function triggerPipelineAudit(): Promise<boolean> {
  try {
    // Cette fonction devrait idéalement déclencher un webhook ou une action GitHub
    // pour lancer le workflow d'audit

    // Exemple simple: on pourrait appeler une API qui déclenche le workflow
    // const response = await fetch('/api/trigger-pipeline-audit', { method: 'POST' });
    // return response.ok;

    // Pour cet exemple, on simule simplement un succès
    console.log("Déclenchement de l'audit du pipeline MCP");
    return true;
  } catch (error) {
    console.error("Erreur lors du déclenchement de l'audit:", error);
    return false;
  }
}
