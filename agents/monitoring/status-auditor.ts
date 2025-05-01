import * as path from 'path';
import * as fs from 'fs/promises';
import glob from 'glob';

interface MCPManifest {
  id: string;
  status: string;
  route?: string;
  file?: string;
  type?: string; // Type de migration (standard, api, cms, etc.)
  generatedFiles?: string[];
  agentsExecuted?: string[];
  lastUpdated?: string;
}

interface AuditIssue {
  id: string;
  status: string;
  type?: string;
  missing?: string[];
  generatedFiles?: string[];
  lastUpdated?: string;
  age?: string;
  recommendation?: string;
}

interface AuditReport {
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

interface PipelineConfig {
  version: string;
  migrationTypes: Record<
    string,
    {
      requiredSteps: string[];
      statusSequence: string[];
    }
  >;
  timeouts: Record<string, number>;
  metrics: {
    requiredForDashboard: string[];
  };
}

/**
 * Charge la configuration d'audit du pipeline
 */
async function loadPipelineConfig(): Promise<PipelineConfig> {
  try {
    const configContent = await fs.readFile('pipeline.audit.config.json', 'utf-8');
    return JSON.parse(configContent) as PipelineConfig;
  } catch (error) {
    console.error('Erreur lors du chargement de la configuration du pipeline:', error);
    // Configuration par défaut
    return {
      version: '1.0.0',
      migrationTypes: {
        standard: {
          requiredSteps: [
            'php-analyzer',
            'structure-classifier-agent',
            'remix-generator',
            'qa-analyzer',
            'seo-checker',
            'pr-creator',
          ],
          statusSequence: [
            'planned',
            'detected',
            'analyzed',
            'structured',
            'generated',
            'validated',
            'integrated',
            'completed',
          ],
        },
      },
      timeouts: {
        planned: 14,
        detected: 7,
        analyzed: 5,
        structured: 3,
        generated: 3,
        validated: 5,
        integrated: 2,
      },
      metrics: {
        requiredForDashboard: [
          'completion_rate',
          'missing_agents_count',
          'blocked_migrations_count',
          'age_distribution',
        ],
      },
    };
  }
}

/**
 * Détecte les problèmes dans les fichiers MCPManifest.json
 */
export async function auditMCPStatus(): Promise<AuditReport> {
  console.log('🔍 Audit des statuts de migration en cours...');

  // Charger la configuration
  const config = await loadPipelineConfig();
  console.log(
    `📝 Configuration chargée: ${
      config.migrationTypes ? Object.keys(config.migrationTypes).length : 0
    } types de migration définis`
  );

  // Rechercher tous les fichiers MCPManifest.json
  const manifestFiles = await glob('**/MCPManifest.json', { ignore: 'node_modules/**' });
  console.log(`📄 ${manifestFiles.length} fichiers MCPManifest.json trouvés`);

  const issues: AuditIssue[] = [];
  const statistics = {
    byStatus: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    missingAgents: {} as Record<string, number>,
    ageDistribution: {
      'Moins de 3 jours': 0,
      '3-7 jours': 0,
      '7-14 jours': 0,
      '14+ jours': 0,
    } as Record<string, number>,
    completionRate: 0,
  };

  let completedMigrations = 0;

  // Analyser chaque manifest
  for (const file of manifestFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const manifest = JSON.parse(content) as MCPManifest;

      // Déterminer le type de migration (par défaut: standard)
      const migrationType = manifest.type || 'standard';

      // Comptabiliser les types
      statistics.byType[migrationType] = (statistics.byType[migrationType] || 0) + 1;

      // Incrémenter les statistiques par statut
      statistics.byStatus[manifest.status] = (statistics.byStatus[manifest.status] || 0) + 1;

      // Compter les migrations complétées
      if (manifest.status === 'completed') {
        completedMigrations++;
      }

      // Vérifier l'âge de la dernière mise à jour
      let age: number | undefined;
      if (manifest.lastUpdated) {
        const lastUpdated = new Date(manifest.lastUpdated);
        const now = new Date();
        age = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

        // Statistiques d'âge
        if (age < 3) statistics.ageDistribution['Moins de 3 jours']++;
        else if (age < 7) statistics.ageDistribution['3-7 jours']++;
        else if (age < 14) statistics.ageDistribution['7-14 jours']++;
        else statistics.ageDistribution['14+ jours']++;
      }

      // Vérifier si le type de migration existe dans la configuration
      const typeConfig = config.migrationTypes[migrationType];
      if (!typeConfig) {
        console.warn(`⚠️ Type de migration non défini dans la configuration: ${migrationType}`);
        continue;
      }

      // Déterminer les agents qui devraient être exécutés selon le statut et le type
      const requiredAgents = getRequiredAgentsByStatus(manifest.status, typeConfig);

      // Vérifier les agents manquants
      const missingAgents = requiredAgents.filter(
        (agent) => !manifest.agentsExecuted || !manifest.agentsExecuted.includes(agent)
      );

      // Comptabiliser les agents manquants pour les statistiques
      missingAgents.forEach((agent) => {
        statistics.missingAgents[agent] = (statistics.missingAgents[agent] || 0) + 1;
      });

      // Vérifier si le statut est bloqué au-delà du délai configuré
      const timeout = config.timeouts[manifest.status];
      const isBlocked = age && timeout && age > timeout;

      // Créer un problème si nécessaire
      if (missingAgents.length > 0 || isBlocked) {
        const issue: AuditIssue = {
          id: manifest.id,
          status: manifest.status,
          type: migrationType,
          generatedFiles: manifest.generatedFiles,
          lastUpdated: manifest.lastUpdated,
        };

        if (missingAgents.length > 0) {
          issue.missing = missingAgents;
        }

        if (age) {
          issue.age = `${age} jours`;

          // Recommandations basées sur l'âge, le statut et les timeouts configurés
          if (isBlocked) {
            if (manifest.status === 'planned') {
              issue.recommendation = 'Replanifier ou invalider';
            } else if (['analyzed', 'structured'].includes(manifest.status)) {
              issue.recommendation = 'Vérifier si bloqué';
            } else {
              issue.recommendation = 'Vérifier la progression';
            }
          }
        }

        issues.push(issue);
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse de ${file}:`, error);
    }
  }

  // Calculer le taux de complétion
  statistics.completionRate =
    manifestFiles.length > 0 ? Math.round((completedMigrations / manifestFiles.length) * 100) : 0;

  // Trier les problèmes par ancienneté
  issues.sort((a, b) => {
    if (!a.lastUpdated) return 1;
    if (!b.lastUpdated) return -1;
    return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
  });

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalManifests: manifestFiles.length,
    issues,
    statistics,
  };

  await fs.writeFile('status-audit-report.json', JSON.stringify(report, null, 2));
  console.log(`✅ Rapport d'audit généré : ${issues.length} problèmes trouvés`);

  return report;
}

/**
 * Détermine les agents qui doivent être exécutés selon le statut et le type de migration
 */
function getRequiredAgentsByStatus(
  status: string,
  typeConfig: { requiredSteps: string[]; statusSequence: string[] }
): string[] {
  const statusIndex = typeConfig.statusSequence.indexOf(status);
  if (statusIndex === -1) return [];

  // Si le statut est complété, tous les agents sont requis
  if (status === 'completed') {
    return typeConfig.requiredSteps;
  }

  // Calculer les agents requis en fonction de la position dans la séquence
  const agentsForStatus: Record<string, string[]> = {
    planned: [],
    detected: [],
    analyzed: ['php-analyzer'],
    structured: ['php-analyzer', 'structure-classifier-agent'],
    generated: [
      'php-analyzer',
      'structure-classifier-agent',
      'remix-generator',
      'nestjs-generator',
    ],
    validated: [
      'php-analyzer',
      'structure-classifier-agent',
      'remix-generator',
      'nestjs-generator',
      'qa-analyzer',
      'seo-checker',
    ],
    integrated: typeConfig.requiredSteps.filter((agent) => agent !== 'pr-creator'),
    completed: typeConfig.requiredSteps,
  };

  // Utiliser la configuration spécifique au type de migration ou la configuration par défaut
  return agentsForStatus[status] || [];
}

// Exécuter si appelé directement
if (require.main === module) {
  auditMCPStatus()
    .then((report) => console.log(`🎯 Audit terminé: ${report.issues.length} problèmes identifiés`))
    .catch((error) => console.error("❌ Erreur pendant l'audit:", error));
}
