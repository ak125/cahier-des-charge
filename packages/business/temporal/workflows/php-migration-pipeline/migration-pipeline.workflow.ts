import { defineWorkflow } from '@temporalio/workflow';
import { z } from 'zod';
import type * as activities from '../../activities/consolidated-activities';

// Définition des types et schémas pour la configuration
export const MigrationConfigSchema = z.object({
    // Paramètres de configuration pour ignorer des étapes
    dryRun: z.boolean().default(false),
    skipDockerSetup: z.boolean().default(false),
    skipDumpImport: z.boolean().default(false),
    skipSchemaAnalysis: z.boolean().default(false),
    skipDataMigration: z.boolean().default(false),
    skipValidation: z.boolean().default(false),
    skipSupabasePush: z.boolean().default(false),
    skipCodeTransform: z.boolean().default(false),

    // Paramètres MySQL
    mysqlUser: z.string().default('app_user'),
    mysqlPassword: z.string().default('app_password'),
    mysqlDatabase: z.string().default('legacy_app'),
    mysqlHost: z.string().default('mysql-legacy'),
    mysqlPort: z.number().default(3306),

    // Paramètres Supabase
    supabaseProjectId: z.string().optional(),
    supabaseDbPassword: z.string().optional(),

    // Autres paramètres
    tables: z.string().optional(),
    reportPath: z.string().optional(),
    notificationWebhook: z.string().optional(),
    timestamp: z.string().default(() => new Date().toISOString()),
});

export type MigrationConfig = z.infer<typeof MigrationConfigSchema>;

export interface MigrationStage {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    warning?: boolean;
}

export interface MigrationState {
    executionId: string;
    config: MigrationConfig;
    status: 'initialized' | 'running' | 'completed' | 'failed';
    stages: MigrationStage[];
    startTime: string;
    endTime?: string;
    duration?: string;
    logs: string[];

    // Résultats des différentes étapes
    schemaMapInfo?: {
        tableCount: number;
        issuesCount: number;
    };
    migrationStats?: {
        tablesProcessed: number;
        rowsCopied: number;
        startTime: string;
        endTime: string;
        duration: string;
    };
    validationResults?: {
        tablesChecked: number;
        tablesMatched: number;
        tablesWithIssues: number;
        recordsChecked: number;
        mismatchedRecords: number;
        issues: Array<{
            table: string;
            column: string;
            mysqlValue: string;
            postgresValue: string;
            severity: string;
            message: string;
        }>;
    };
    supabasePush?: {
        projectId: string;
        timestamp: string;
        success: boolean;
    };
    codeTransformation?: {
        phpFilesAnalyzed: number;
        nestjsModelsGenerated: number;
        remixComponentsGenerated: number;
        timestamp: string;
    };

    // Rapports finaux
    markdownReport?: string;
    jsonSummary?: Record<string, any>;
}

/**
 * Workflow Temporal pour la migration d'applications PHP vers NestJS/Remix
 * Remplace le workflow n8n "Pipeline de Migration Automatisée PHP → NestJS/Remix"
 */
export const phpToNestjsRemixMigrationWorkflow = defineWorkflow('phpToNestjsRemixMigrationWorkflow', async (config?: Partial<MigrationConfig>) => {
    // Logger spécifique au workflow
    const logger = {
        info: (message: string) => console.log(`[INFO] ${message}`),
        error: (message: string) => console.error(`[ERROR] ${message}`),
        warning: (message: string) => console.warn(`[WARNING] ${message}`),
    };

    try {
        // Valider la configuration
        const validatedConfig = MigrationConfigSchema.parse(config || {});

        // Créer un état initial
        const executionId = `migration-${Date.now()}`;
        const state: MigrationState = {
            executionId,
            config: validatedConfig,
            status: 'initialized',
            stages: [
                { id: 'docker-setup', name: 'Configuration Docker', status: validatedConfig.skipDockerSetup ? 'skipped' : 'pending' },
                { id: 'dump-import', name: 'Import des dumps SQL', status: validatedConfig.skipDumpImport ? 'skipped' : 'pending' },
                { id: 'schema-analysis', name: 'Analyse du schéma', status: validatedConfig.skipSchemaAnalysis ? 'skipped' : 'pending' },
                { id: 'data-migration', name: 'Migration des données', status: validatedConfig.skipDataMigration ? 'skipped' : 'pending' },
                { id: 'data-validation', name: 'Validation des données', status: validatedConfig.skipValidation ? 'skipped' : 'pending' },
                { id: 'supabase-push', name: 'Push vers Supabase', status: validatedConfig.skipSupabasePush ? 'skipped' : 'pending' },
                { id: 'code-transform', name: 'Transformation du code', status: validatedConfig.skipCodeTransform ? 'skipped' : 'pending' }
            ],
            startTime: new Date().toISOString(),
            logs: [`[INFO] Démarrage du pipeline de migration (ID: ${executionId})`],
        };

        // Mise à jour du statut
        state.status = 'running';

        // Étape 1: Configuration Docker
        if (!validatedConfig.skipDockerSetup) {
            state.logs.push('[INFO] Démarrage de l\'étape: Configuration Docker');
            updateStageStatus(state, 'docker-setup', 'running');

            try {
                const dockerResult = await activities.setupDocker(state);
                state.logs.push(...dockerResult.logs);
                updateStageStatus(state, 'docker-setup', 'completed');
            } catch (error) {
                state.logs.push(`[ERROR] Erreur lors de la configuration Docker: ${error.message}`);
                updateStageStatus(state, 'docker-setup', 'failed');
                state.status = 'failed';
                return finalizeReport(state);
            }
        } else {
            state.logs.push('[INFO] Étape Configuration Docker ignorée (skipDockerSetup=true)');
        }

        // Étape 2: Import des dumps SQL
        if (!validatedConfig.skipDumpImport) {
            state.logs.push('[INFO] Démarrage de l\'étape: Import des dumps SQL');
            updateStageStatus(state, 'dump-import', 'running');

            try {
                const importResult = await activities.importSqlDumps(state);
                state.logs.push(...importResult.logs);
                updateStageStatus(state, 'dump-import', 'completed');
            } catch (error) {
                state.logs.push(`[ERROR] Erreur lors de l'import des dumps SQL: ${error.message}`);
                updateStageStatus(state, 'dump-import', 'failed');
                state.status = 'failed';
                return finalizeReport(state);
            }
        } else {
            state.logs.push('[INFO] Étape Import des dumps SQL ignorée (skipDumpImport=true)');
        }

        // Étape 3: Analyse du schéma
        if (!validatedConfig.skipSchemaAnalysis) {
            state.logs.push('[INFO] Démarrage de l\'étape: Analyse du schéma');
            updateStageStatus(state, 'schema-analysis', 'running');

            try {
                const analysisResult = await activities.analyzeSchema(state);
                state.logs.push(...analysisResult.logs);
                state.schemaMapInfo = analysisResult.schemaMapInfo;
                updateStageStatus(state, 'schema-analysis', 'completed');
            } catch (error) {
                state.logs.push(`[ERROR] Erreur lors de l'analyse du schéma: ${error.message}`);
                updateStageStatus(state, 'schema-analysis', 'failed');
                state.status = 'failed';
                return finalizeReport(state);
            }
        } else {
            state.logs.push('[INFO] Étape Analyse du schéma ignorée (skipSchemaAnalysis=true)');
        }

        // Étape 4: Migration des données
        if (!validatedConfig.skipDataMigration) {
            state.logs.push('[INFO] Démarrage de l\'étape: Migration des données');
            updateStageStatus(state, 'data-migration', 'running');

            try {
                const migrationResult = await activities.migrateData(state);
                state.logs.push(...migrationResult.logs);
                state.migrationStats = migrationResult.migrationStats;
                updateStageStatus(state, 'data-migration', 'completed');
            } catch (error) {
                state.logs.push(`[ERROR] Erreur lors de la migration des données: ${error.message}`);
                updateStageStatus(state, 'data-migration', 'failed');
                state.status = 'failed';
                return finalizeReport(state);
            }
        } else {
            state.logs.push('[INFO] Étape Migration des données ignorée (skipDataMigration=true)');
        }

        // Étape 5: Validation des données
        if (!validatedConfig.skipValidation) {
            state.logs.push('[INFO] Démarrage de l\'étape: Validation des données');
            updateStageStatus(state, 'data-validation', 'running');

            try {
                const validationResult = await activities.validateData(state);
                state.logs.push(...validationResult.logs);
                state.validationResults = validationResult.validationResults;

                // Si des problèmes ont été détectés, marquer avec un avertissement
                if (validationResult.validationResults.tablesWithIssues > 0) {
                    updateStageStatus(state, 'data-validation', 'completed', true);
                } else {
                    updateStageStatus(state, 'data-validation', 'completed');
                }
            } catch (error) {
                state.logs.push(`[ERROR] Erreur lors de la validation des données: ${error.message}`);
                updateStageStatus(state, 'data-validation', 'failed');
                state.status = 'failed';
                return finalizeReport(state);
            }
        } else {
            state.logs.push('[INFO] Étape Validation des données ignorée (skipValidation=true)');
        }

        // Étape 6: Push vers Supabase
        if (!validatedConfig.skipSupabasePush && !validatedConfig.dryRun) {
            state.logs.push('[INFO] Démarrage de l\'étape: Push vers Supabase');
            updateStageStatus(state, 'supabase-push', 'running');

            // Vérifier les variables requises pour Supabase
            if (!validatedConfig.supabaseProjectId || !validatedConfig.supabaseDbPassword) {
                state.logs.push('[WARNING] Variables Supabase manquantes (supabaseProjectId ou supabaseDbPassword)');
                updateStageStatus(state, 'supabase-push', 'skipped');
            } else {
                try {
                    const supabaseResult = await activities.pushToSupabase(state);
                    state.logs.push(...supabaseResult.logs);
                    state.supabasePush = supabaseResult.supabasePush;
                    updateStageStatus(state, 'supabase-push', 'completed');
                } catch (error) {
                    state.logs.push(`[ERROR] Erreur lors du push vers Supabase: ${error.message}`);
                    updateStageStatus(state, 'supabase-push', 'failed');
                    state.status = 'failed';
                    return finalizeReport(state);
                }
            }
        } else {
            if (validatedConfig.dryRun) {
                state.logs.push('[INFO] Étape Push vers Supabase ignorée (mode dry-run actif)');
            } else {
                state.logs.push('[INFO] Étape Push vers Supabase ignorée (skipSupabasePush=true)');
            }
        }

        // Étape 7: Transformation du code
        if (!validatedConfig.skipCodeTransform) {
            state.logs.push('[INFO] Démarrage de l\'étape: Transformation du code');
            updateStageStatus(state, 'code-transform', 'running');

            try {
                const transformResult = await activities.transformCode(state);
                state.logs.push(...transformResult.logs);
                state.codeTransformation = transformResult.codeTransformation;
                updateStageStatus(state, 'code-transform', 'completed');
            } catch (error) {
                state.logs.push(`[ERROR] Erreur lors de la transformation du code: ${error.message}`);
                updateStageStatus(state, 'code-transform', 'failed');
                state.status = 'failed';
                return finalizeReport(state);
            }
        } else {
            state.logs.push('[INFO] Étape Transformation du code ignorée (skipCodeTransform=true)');
        }

        // Finalisation du pipeline
        state.status = 'completed';
        return finalizeReport(state);
    } catch (error) {
        logger.error(`Erreur non gérée dans le workflow de migration: ${error.message}`);
        throw error;
    }
});

// Fonction pour mettre à jour le statut d'une étape
function updateStageStatus(state: MigrationState, stageId: string, status: MigrationStage['status'], warning = false): void {
    const stageIndex = state.stages.findIndex(s => s.id === stageId);
    if (stageIndex !== -1) {
        state.stages[stageIndex].status = status;
        if (warning) {
            state.stages[stageIndex].warning = true;
        }
    }
}

// Fonction pour finaliser le rapport
function finalizeReport(state: MigrationState): MigrationState {
    // Calculer le temps total d'exécution
    const startTime = new Date(state.startTime);
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    // Mettre à jour les informations de fin
    state.endTime = endTime.toISOString();
    state.duration = `${minutes}m ${seconds}s`;

    // Ajouter une entrée de journal pour la fin
    if (state.status === 'completed') {
        state.logs.push(`[SUCCESS] Pipeline de migration terminé en ${state.duration}`);
    } else {
        state.logs.push(`[ERROR] Pipeline de migration échoué après ${state.duration}`);
    }

    // Générer le rapport Markdown
    state.markdownReport = generateMarkdownReport(state);

    // Générer le résumé JSON
    state.jsonSummary = {
        executionId: state.executionId,
        status: state.status,
        dryRun: state.config.dryRun,
        startTime: state.startTime,
        endTime: state.endTime,
        duration: state.duration,
        stages: state.stages,
        stats: {
            tablesProcessed: state.schemaMapInfo?.tableCount || 0,
            rowsMigrated: state.migrationStats?.rowsCopied || 0,
            validationIssues: state.validationResults?.mismatchedRecords || 0,
            generatedModels: state.codeTransformation?.nestjsModelsGenerated || 0,
            generatedComponents: state.codeTransformation?.remixComponentsGenerated || 0
        }
    };

    return state;
}

// Fonction pour générer un rapport Markdown
function generateMarkdownReport(data: MigrationState): string {
    const report = `# Rapport de migration PHP → NestJS/Remix

## Résumé

- **ID d'exécution:** ${data.executionId}
- **Statut:** ${data.status}
- **Date de début:** ${formatDate(data.startTime)}
- **Date de fin:** ${formatDate(data.endTime || new Date().toISOString())}
- **Durée:** ${data.duration || 'N/A'}
- **Mode simulation:** ${data.config.dryRun ? 'Oui' : 'Non'}

## Détails des étapes

${data.stages.map(stage => {
        const statusEmoji = getStatusEmoji(stage.status);
        return `- ${statusEmoji} **${stage.name}:** ${formatStatus(stage.status)}${stage.warning ? ' (avec avertissements)' : ''}`;
    }).join('\n')}

## Statistiques

- **Tables traitées:** ${data.schemaMapInfo?.tableCount || 0}
- **Enregistrements migrés:** ${data.migrationStats?.rowsCopied || 0}
- **Modèles NestJS générés:** ${data.codeTransformation?.nestjsModelsGenerated || 0}
- **Composants Remix générés:** ${data.codeTransformation?.remixComponentsGenerated || 0}

${generateValidationSection(data)}

## Journal

\`\`\`
${data.logs.join('\n')}
\`\`\`
`;

    return report;
}

// Fonction pour générer la section de validation
function generateValidationSection(data: MigrationState): string {
    if (!data.validationResults) {
        return '';
    }

    let section = `## Validation des données

- **Tables vérifiées:** ${data.validationResults.tablesChecked}
- **Tables sans problème:** ${data.validationResults.tablesMatched}
- **Tables avec problèmes:** ${data.validationResults.tablesWithIssues}
- **Enregistrements vérifiés:** ${data.validationResults.recordsChecked}
- **Enregistrements avec différences:** ${data.validationResults.mismatchedRecords}
`;

    if (data.validationResults.issues && data.validationResults.issues.length > 0) {
        section += '\n### Problèmes détectés\n\n';

        for (const issue of data.validationResults.issues) {
            section += `- Table **${issue.table}**, colonne **${issue.column}**:\n  - MySQL: \`${issue.mysqlValue}\`\n  - PostgreSQL: \`${issue.postgresValue}\`\n  - Message: ${issue.message}\n\n`;
        }
    }

    return section;
}

// Fonction pour formater une date
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Fonction pour obtenir un emoji selon le statut
function getStatusEmoji(status: string): string {
    switch (status) {
        case 'completed': return '✅';
        case 'failed': return '❌';
        case 'skipped': return '⏭️';
        case 'running': return '⏳';
        case 'pending': return '⏳';
        default: return '❓';
    }
}

// Fonction pour formater le statut
function formatStatus(status: string): string {
    switch (status) {
        case 'completed': return 'Terminé';
        case 'failed': return 'Échoué';
        case 'skipped': return 'Ignoré';
        case 'running': return 'En cours';
        case 'pending': return 'En attente';
        default: return status;
    }
}