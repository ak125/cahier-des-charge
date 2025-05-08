import { proxyActivities } from '@temporalio/workflow';
import { z } from 'zod';

/**
 * Schéma de configuration pour le pipeline de migration IA
 */
export const AiMigrationConfigSchema = z.object({
    // Options générales
    projectName: z.string().min(1),
    sourcePath: z.string().min(1),
    outputPath: z.string().min(1),

    // Options d'analyse
    analysisOptions: z.object({
        // Technologies legacy à analyser
        phpAnalysis: z.boolean().default(false),
        javascriptAnalysis: z.boolean().default(false),
        sqlAnalysis: z.boolean().default(true),

        // Options détaillées
        includeComments: z.boolean().default(true),
        extractDocumentation: z.boolean().default(true),
        generateStats: z.boolean().default(true),
    }).default({}),

    // Options de génération
    generationOptions: z.object({
        // Plateformes cibles
        targetFrameworks: z.array(z.enum(['nestjs', 'remix', 'nextjs', 'prisma'])).default(['nestjs', 'remix', 'prisma']),

        // Options détaillées
        preserveSeo: z.boolean().default(true),
        generateTests: z.boolean().default(true),
        handleRedirects: z.boolean().default(true),
    }).default({}),

    // Options de notification
    notificationOptions: z.object({
        email: z.string().email().optional(),
        slack: z.string().optional(),
        reportFormat: z.enum(['json', 'html', 'markdown']).default('markdown'),
    }).optional(),

    // Options avancées
    advancedOptions: z.object({
        aiProvider: z.enum(['openai', 'anthropic', 'gemini']).default('openai'),
        aiModel: z.string().default('gpt-4'),
        includeExamples: z.boolean().default(true),
        cloudStorageEnabled: z.boolean().default(false),
        databaseConnectionString: z.string().optional(),
    }).optional(),
}).strict();

// Type pour la configuration de pipeline inféré du schéma Zod
export type AiMigrationConfig = z.infer<typeof AiMigrationConfigSchema>;

// Interface pour le résultat du workflow
export interface WorkflowResult {
    success: boolean;
    projectName: string;
    generatedFiles: {
        nestjs?: string[];
        remix?: string[];
        prisma?: string[];
    };
    analysisResults: {
        php?: any;
        javascript?: any;
        sql?: any;
    };
    jsonSummary: Record<string, any>;
    markdownReport: string;
    completionTime: string;
    error?: string;
}

// Interface pour les activités
export interface AiPipelineActivities {
    analyzePhpCode(sourcePath: string, options: any): Promise<any>;
    analyzeJavascriptCode(sourcePath: string, options: any): Promise<any>;
    analyzeSqlStructure(connectionString: string, options: any): Promise<any>;
    generateNestjsCode(analysisResults: any, options: any): Promise<string[]>;
    generateRemixCode(analysisResults: any, options: any): Promise<string[]>;
    generatePrismaSchema(sqlAnalysis: any, options: any): Promise<string[]>;
    generateDocumentation(analysisResults: any, generatedFiles: any, options: any): Promise<string>;
    sendNotification(config: AiMigrationConfig, result: WorkflowResult): Promise<boolean>;
    updateMigrationStatus(projectName: string, status: string, progress: number): Promise<void>;
}

// Définir les activités à utiliser dans le workflow
const {
    analyzePhpCode,
    analyzeJavascriptCode,
    analyzeSqlStructure,
    generateNestjsCode,
    generateRemixCode,
    generatePrismaSchema,
    generateDocumentation,
    sendNotification,
    updateMigrationStatus
} = proxyActivities<AiPipelineActivities>({
    startToCloseTimeout: '1 hour',
    retry: {
        maximumAttempts: 3
    }
});

/**
 * Workflow principal pour le pipeline de migration IA consolidé
 * 
 * Ce workflow orchestre l'analyse du code source, la génération de code moderne,
 * et la production de documentation et rapports.
 * 
 * @param config Configuration du pipeline de migration
 * @returns Résultat du workflow contenant les fichiers générés et rapports
 */
export async function aiMigrationConsolidatedWorkflow(
    config: AiMigrationConfig
): Promise<WorkflowResult> {
    const startTime = new Date();
    const result: WorkflowResult = {
        success: false,
        projectName: config.projectName,
        generatedFiles: {},
        analysisResults: {},
        jsonSummary: {},
        markdownReport: '',
        completionTime: '',
    };

    try {
        // Initialiser le statut de la migration
        await updateMigrationStatus(config.projectName, 'started', 0);

        // 1. Phase d'analyse
        await updateMigrationStatus(config.projectName, 'analyzing', 10);

        // Analyse PHP si activée
        if (config.analysisOptions.phpAnalysis) {
            result.analysisResults.php = await analyzePhpCode(
                config.sourcePath,
                {
                    includeComments: config.analysisOptions.includeComments,
                    extractDocumentation: config.analysisOptions.extractDocumentation
                }
            );
        }

        // Analyse JavaScript si activée
        if (config.analysisOptions.javascriptAnalysis) {
            result.analysisResults.javascript = await analyzeJavascriptCode(
                config.sourcePath,
                {
                    includeComments: config.analysisOptions.includeComments,
                    extractDocumentation: config.analysisOptions.extractDocumentation
                }
            );
        }

        // Analyse SQL si activée et connection string fournie
        if (config.analysisOptions.sqlAnalysis && config.advancedOptions?.databaseConnectionString) {
            result.analysisResults.sql = await analyzeSqlStructure(
                config.advancedOptions.databaseConnectionString,
                { generateStats: config.analysisOptions.generateStats }
            );
        }

        await updateMigrationStatus(config.projectName, 'generating', 40);

        // 2. Phase de génération de code
        const targetFrameworks = config.generationOptions.targetFrameworks;

        // Générer code NestJS si sélectionné
        if (targetFrameworks.includes('nestjs')) {
            result.generatedFiles.nestjs = await generateNestjsCode(
                result.analysisResults,
                {
                    preserveSeo: config.generationOptions.preserveSeo,
                    generateTests: config.generationOptions.generateTests,
                    handleRedirects: config.generationOptions.handleRedirects
                }
            );
        }

        // Générer code Remix si sélectionné
        if (targetFrameworks.includes('remix')) {
            result.generatedFiles.remix = await generateRemixCode(
                result.analysisResults,
                {
                    preserveSeo: config.generationOptions.preserveSeo,
                    generateTests: config.generationOptions.generateTests,
                    handleRedirects: config.generationOptions.handleRedirects
                }
            );
        }

        // Générer schéma Prisma si sélectionné
        if (targetFrameworks.includes('prisma') && result.analysisResults.sql) {
            result.generatedFiles.prisma = await generatePrismaSchema(
                result.analysisResults.sql,
                { includeExamples: config.advancedOptions?.includeExamples }
            );
        }

        await updateMigrationStatus(config.projectName, 'documenting', 80);

        // 3. Phase de documentation
        result.markdownReport = await generateDocumentation(
            result.analysisResults,
            result.generatedFiles,
            {
                format: config.notificationOptions?.reportFormat || 'markdown',
                projectName: config.projectName
            }
        );

        // 4. Préparation du résumé JSON pour les intégrations API
        result.jsonSummary = {
            projectName: config.projectName,
            analysisStats: {
                phpFilesAnalyzed: result.analysisResults.php ? Object.keys(result.analysisResults.php).length : 0,
                jsFilesAnalyzed: result.analysisResults.javascript ? Object.keys(result.analysisResults.javascript).length : 0,
                sqlTablesAnalyzed: result.analysisResults.sql ? result.analysisResults.sql.tables?.length : 0
            },
            generationStats: {
                nestjsFilesGenerated: result.generatedFiles.nestjs?.length || 0,
                remixFilesGenerated: result.generatedFiles.remix?.length || 0,
                prismaFilesGenerated: result.generatedFiles.prisma?.length || 0
            },
            completionTime: new Date().toISOString()
        };

        // 5. Marquer comme réussi et calculer le temps d'exécution
        result.success = true;
        result.completionTime = new Date().toISOString();

        // 6. Envoyer des notifications si configurées
        if (config.notificationOptions?.email || config.notificationOptions?.slack) {
            await sendNotification(config, result);
        }

        await updateMigrationStatus(config.projectName, 'completed', 100);
    } catch (error) {
        result.success = false;
        result.error = error instanceof Error ? error.message : String(error);
        await updateMigrationStatus(config.projectName, 'failed', -1);
    }

    return result;
}

// Exporter les workflows individuels pour compatibilité ascendante
export const phpAnalyzerWorkflow = aiMigrationConsolidatedWorkflow;
export const codeGeneratorWorkflow = aiMigrationConsolidatedWorkflow;
export const docsGeneratorWorkflow = aiMigrationConsolidatedWorkflow;

// Exporter le workflow principal
export default aiMigrationConsolidatedWorkflow;