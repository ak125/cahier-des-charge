/**
 * Exemple de migration d'un workflow n8n complexe vers Temporal.io
 * 
 * Ce fichier montre comment migrer un workflow d'analyse de code n8n 
 * (avec état et plusieurs étapes) vers l'implémentation Temporal.io standardisée.
 * 
 * Workflow n8n d'origine : code-analysis-pipeline.n8n.json
 */

import { WorkflowClient } from '@temporalio/client';
import { proxyActivities } from '@temporalio/workflow';

// Définition des types d'entrée et de sortie
interface CodeAnalysisInput {
    projectId: string;
    repositoryUrl: string;
    branch?: string;
    codeLanguage: string;
    analysisDepth: 'shallow' | 'deep';
    options?: {
        timeout?: number;
        includeTests?: boolean;
        generateReport?: boolean;
        sendNotification?: boolean;
        notificationRecipients?: string[];
    };
}

interface CodeAnalysisResult {
    analysisId: string;
    status: 'success' | 'failure' | 'partial';
    metrics: {
        codeQuality: number;
        coverage: number;
        complexity: number;
        duplication: number;
    };
    issues: Array<{
        severity: 'critical' | 'high' | 'medium' | 'low';
        type: string;
        description: string;
        location: { file: string; line?: number; };
    }>;
    reportUrl?: string;
    completedAt: string;
}

// Définition des activités (équivalent aux nœuds de n8n)
// Dans un cas réel, ces activités seraient définies dans un fichier séparé
interface Activities {
    cloneRepository(params: {
        repositoryUrl: string;
        branch: string;
        depth?: number
    }): Promise<string>;

    analyzeCode(params: {
        path: string;
        language: string;
        includeTests: boolean;
        timeout: number;
    }): Promise<{
        success: boolean;
        issues: Array<{
            severity: 'critical' | 'high' | 'medium' | 'low';
            type: string;
            description: string;
            location: { file: string; line?: number; };
        }>;
    }>;

    generateMetrics(params: {
        analysisResult: any;
        projectId: string;
    }): Promise<{
        codeQuality: number;
        coverage: number;
        complexity: number;
        duplication: number;
    }>;

    createReport(params: {
        projectId: string;
        metrics: any;
        analysisResult: any;
    }): Promise<string>;

    notifyUsers(params: {
        recipients: string[];
        subject: string;
        message: string;
        reportUrl?: string;
    }): Promise<void>;
}

// Utilisation de proxyActivities pour simuler les activités
const activities = proxyActivities<Activities>({
    startToCloseTimeout: '30 minutes',
    retry: {
        maximumAttempts: 3,
        initialInterval: '30 seconds'
    },
});

/**
 * Workflow Temporal qui remplace le workflow n8n d'analyse de code
 */
export async function codeAnalysisWorkflow(input: CodeAnalysisInput): Promise<CodeAnalysisResult> {
    // Validation de l'entrée (équivalent au nœud Function de n8n)
    if (!input.projectId || !input.repositoryUrl || !input.codeLanguage) {
        throw new Error('Champs obligatoires manquants: projectId, repositoryUrl, codeLanguage');
    }

    // Étape 1: Clonage du dépôt (équivalent au nœud Execute Command de n8n)
    const repoPath = await activities.cloneRepository({
        repositoryUrl: input.repositoryUrl,
        branch: input.branch || 'main',
        depth: input.analysisDepth === 'deep' ? undefined : 1
    });

    // Étape 2: Analyse du code (équivalent à plusieurs nœuds d'outils d'analyse dans n8n)
    const analysisResult = await activities.analyzeCode({
        path: repoPath,
        language: input.codeLanguage,
        includeTests: input.options?.includeTests || false,
        timeout: input.options?.timeout || 1800 // 30 minutes par défaut
    });

    // Étape 3: Génération des métriques (équivalent au nœud de traitement des résultats dans n8n)
    const metrics = await activities.generateMetrics({
        analysisResult,
        projectId: input.projectId
    });

    // Variables pour le résultat final
    let reportUrl: string | undefined;

    // Étape 4: Génération du rapport (conditionnel, équivalent au nœud IF dans n8n)
    if (input.options?.generateReport) {
        reportUrl = await activities.createReport({
            projectId: input.projectId,
            metrics,
            analysisResult
        });
    }

    // Étape 5: Notification (conditionnel, équivalent au nœud IF dans n8n)
    if (input.options?.sendNotification && input.options?.notificationRecipients?.length) {
        await activities.notifyUsers({
            recipients: input.options.notificationRecipients,
            subject: `Analyse de code terminée : ${input.projectId}`,
            message: `L'analyse de code du projet ${input.projectId} est terminée avec un score de qualité de ${metrics.codeQuality}/100.`,
            reportUrl
        });
    }

    // Retourner le résultat final (équivalent au nœud Respond to Webhook dans n8n)
    return {
        analysisId: `analysis-${input.projectId}-${Date.now()}`,
        status: analysisResult.success ? 'success' : 'failure',
        metrics,
        issues: analysisResult.issues,
        reportUrl,
        completedAt: new Date().toISOString()
    };
}

/**
 * Client pour démarrer le workflow (remplace l'API webhook de n8n)
 */
export async function startCodeAnalysis(input: CodeAnalysisInput): Promise<{ workflowId: string }> {
    // Création du client Temporal
    // Dans un cas réel, on utiliserait une connexion configurée correctement
    const client = new WorkflowClient();

    // Démarrer le workflow
    const handle = await client.start(codeAnalysisWorkflow, {
        args: [input],
        taskQueue: 'code-analysis',
        workflowId: `code-analysis-${input.projectId}-${Date.now()}`,
        searchAttributes: {
            projectId: [input.projectId],
            codeLanguage: [input.codeLanguage]
        }
    });

    return { workflowId: handle.workflowId };
}

/**
 * COMPARAISON AVEC LE WORKFLOW N8N ORIGINAL
 * 
 * Workflow n8n original:
 * 1. Webhook Trigger - Reçoit les paramètres d'analyse
 * 2. Function Node - Valide les paramètres
 * 3. Execute Command Node - Clone le dépôt
 * 4. Multiple Tool Nodes - Exécute différents outils d'analyse
 * 5. Function Node - Agrège et traite les résultats
 * 6. IF Node - Conditionnel pour la génération de rapport
 * 7. IF Node - Conditionnel pour les notifications
 * 8. Respond to Webhook - Renvoie les résultats
 * 
 * Notre implémentation Temporal:
 * 1. Fonction codeAnalysisWorkflow - Le flux principal
 * 2. Activités - Fonctions modulaires pour chaque étape
 * 3. Gestion d'état automatique - Temporal maintient l'état entre les étapes
 * 
 * Avantages de la migration:
 * - Résistance aux pannes (reprise automatique où le workflow s'est arrêté)
 * - Séparation claire entre définition du workflow et implémentation des activités
 * - Visibilité et observabilité de chaque étape dans l'interface Temporal
 * - Évolutivité et réutilisation simplifiées
 * - Intégration native avec TypeScript et l'infrastructure
 */

/**
 * UTILISATION
 * 
 * // Au lieu du déclenchement n8n via API webhook:
 * // POST https://n8n.example.com/webhook/code-analysis-workflow
 * 
 * // Utiliser la fonction standardisée:
 * const { workflowId } = await startCodeAnalysis({
 *   projectId: 'mon-projet',
 *   repositoryUrl: 'https://github.com/organisation/repo',
 *   codeLanguage: 'typescript',
 *   analysisDepth: 'deep',
 *   options: {
 *     includeTests: true,
 *     generateReport: true,
 *     sendNotification: true,
 *     notificationRecipients: ['equipe@example.com']
 *   }
 * });
 * 
 * // Pour suivre l'exécution:
 * const client = new WorkflowClient();
 * const handle = client.getHandle(workflowId);
 * const result = await handle.result(); // Attend la fin de l'exécution
 */