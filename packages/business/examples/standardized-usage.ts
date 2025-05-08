/**
 * Exemple d'utilisation complète de l'orchestrateur standardisé
 * 
 * Cet exemple montre comment l'orchestrateur standardisé sélectionne automatiquement
 * l'implémentation la plus appropriée (Temporal ou BullMQ) selon le type de tâche.
 */

import { standardizedOrchestrator, orchestratorBridge } from '..';
import { z } from 'zod';

// 1. Schémas de validation pour différents types de tâches

// Pour les tâches complexes (utiliseront Temporal)
const analysisTaskSchema = z.object({
    projectId: z.string(),
    repositoryUrl: z.string().url(),
    depth: z.enum(['minimal', 'standard', 'deep', 'complete']),
    includeDependencies: z.boolean().optional(),
    filters: z.array(z.string()).optional(),
    timeout: z.number().optional(), // en minutes
    callbackUrl: z.string().url().optional()
});

// Pour les tâches simples (utiliseront BullMQ)
const notificationTaskSchema = z.object({
    recipients: z.array(z.string()),
    subject: z.string(),
    body: z.string(),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.unknown()).optional(),
    attachments: z.array(z.object({
        filename: z.string(),
        content: z.string()
    })).optional()
});

// 2. Fonction principale qui orchestre un processus combinant tâches simples et complexes

/**
 * Lance une analyse complète d'un projet avec notification des résultats
 * et utilise intelligemment les orchestrateurs appropriés pour chaque étape
 */
export async function analyzeProjectWithNotification(
    projectId: string,
    repositoryUrl: string,
    options: {
        depth?: 'minimal' | 'standard' | 'deep' | 'complete';
        recipients?: string[];
        includeDependencies?: boolean;
        filters?: string[];
        notification?: {
            subject?: string;
            template?: string;
        }
    } = {}
) {
    console.log(`Démarrage de l'analyse du projet ${projectId}`);

    // Préparer les données pour l'analyse (tâche complexe -> Temporal)
    const analysisData = analysisTaskSchema.parse({
        projectId,
        repositoryUrl,
        depth: options.depth || 'standard',
        includeDependencies: options.includeDependencies || false,
        filters: options.filters || [],
        callbackUrl: `https://api.notre-service.com/webhooks/analysis/${projectId}`
    });

    // Lancer l'analyse - complexe avec état persistant -> Sélectionnera automatiquement Temporal
    console.log('Planification de la tâche d\'analyse (complexe via Temporal)...');
    const analysisTaskId = await standardizedOrchestrator.schedule({
        type: 'analyze-project',
        data: analysisData,
        isComplex: true, // indique explicitement que c'est une tâche complexe
        tags: ['analysis', `depth-${analysisData.depth}`, projectId]
    });

    console.log(`Tâche d'analyse planifiée avec ID: ${analysisTaskId}`);

    // Simuler l'attente de la fin de l'analyse
    // (Dans un cas réel, on utiliserait plutôt un webhook ou une vérification périodique)
    console.log('Attente de la fin de l\'analyse...');

    // Préparation d'une notification (tâche simple -> BullMQ)
    const notificationData = notificationTaskSchema.parse({
        recipients: options.recipients || [`project-owner-${projectId}@exemple.com`],
        subject: options.notification?.subject || `Analyse du projet ${projectId} démarrée`,
        body: `L'analyse de votre projet ${projectId} a été lancée avec succès. Vous recevrez les résultats dès qu'ils seront disponibles.`,
        templateId: options.notification?.template || 'analysis-started',
        variables: {
            projectId,
            analysisType: options.depth || 'standard',
            estimatedTimeMinutes: options.depth === 'complete' ? 60 : 15
        }
    });

    // Envoyer une notification - simple sans état -> Sélectionnera automatiquement BullMQ
    console.log('Planification de la notification (simple via BullMQ)...');
    const notificationTaskId = await standardizedOrchestrator.schedule({
        type: 'send-email-notification',
        data: notificationData,
        // Pas de spécification isComplex -> par défaut c'est false -> BullMQ
        priority: 10, // priorité normale
        queue: 'notifications-email',
        tags: ['notification', 'email', projectId]
    });

    console.log(`Notification planifiée avec ID: ${notificationTaskId}`);

    return {
        projectId,
        analysisTaskId,
        notificationTaskId,
        startedAt: new Date().toISOString()
    };
}

// 3. Utilisation du pont d'orchestrateur pour les composants qui ne peuvent pas être mis à jour immédiatement

/**
 * Version simplifiée pour les systèmes existants qui utilisent l'ancien format 
 * mais veulent profiter de l'orchestrateur intelligent
 */
export async function legacyAnalyzeProject(projectData: {
    id: string;
    url: string;
    options: Record<string, any>;
    notify: boolean;
    emails?: string[];
}) {
    console.log('Adaptation d\'une requête legacy via le pont d\'orchestrateur');

    // Le pont d'orchestrateur offre une interface simplifiée
    // qui sera résolue vers les bons orchestrateurs sous-jacents

    // 1. Lancement de l'analyse via le pont (sera redirigé vers Temporal)
    const analysisId = await orchestratorBridge.scheduleTask(
        'legacy-project-analysis',
        {
            projectId: projectData.id,
            repositoryUrl: projectData.url,
            settings: projectData.options
        },
        { isComplex: true } // Indique que c'est une tâche complexe
    );

    // 2. Notification si demandée
    let notificationId = null;
    if (projectData.notify && projectData.emails && projectData.emails.length > 0) {
        notificationId = await orchestratorBridge.scheduleTask(
            'legacy-notification',
            {
                to: projectData.emails,
                subject: `Analyse du projet ${projectData.id}`,
                message: `L'analyse de votre projet ${projectData.id} a été lancée.`
            }
            // Pas d'option isComplex -> par défaut à false -> BullMQ
        );
    }

    return {
        analysisId,
        notificationId,
        status: 'scheduled'
    };
}

// 4. Fonctions utilitaires pour interagir avec les tâches

/**
 * Récupérer le statut d'une tâche, qu'elle soit gérée par Temporal ou BullMQ
 */
export async function getTaskStatus(taskId: string): Promise<any> {
    try {
        // Essayer d'abord avec Temporal
        return await standardizedOrchestrator.getTaskStatus(taskId, 'temporal');
    } catch (err) {
        try {
            // Si ça échoue, essayer avec BullMQ
            return await standardizedOrchestrator.getTaskStatus(taskId, 'bullmq');
        } catch (err2) {
            // Si les deux échouent, il y a un problème avec l'ID
            throw new Error(`Tâche introuvable avec l'ID: ${taskId}`);
        }
    }
}

/**
 * Annule une tâche, qu'elle soit gérée par Temporal ou BullMQ
 */
export async function cancelTask(taskId: string): Promise<boolean> {
    try {
        // Essayer d'abord avec Temporal
        return await standardizedOrchestrator.cancelTask(taskId, 'temporal');
    } catch (err) {
        try {
            // Si ça échoue, essayer avec BullMQ
            return await standardizedOrchestrator.cancelTask(taskId, 'bullmq');
        } catch (err2) {
            // Si les deux échouent, on considère que ça n'a pas fonctionné
            console.error(`Erreur lors de l'annulation de la tâche ${taskId}:`, err2);
            return false;
        }
    }
}

// 5. Exemple d'utilisation

async function runExample() {
    try {
        // Exemple d'utilisation standardisée pour un nouveau développement
        console.log('=== Exemple d\'utilisation standardisée ===');
        const result = await analyzeProjectWithNotification(
            'projet-123',
            'https://github.com/organization/project-123',
            {
                depth: 'deep',
                recipients: ['chef@example.com', 'dev@example.com'],
                includeDependencies: true,
                filters: ['vulnerability', 'performance', 'architecture'],
                notification: {
                    subject: 'Analyse approfondie lancée pour le projet 123',
                    template: 'detailed-analysis'
                }
            }
        );

        console.log('Résultat:', result);

        // Simuler une attente
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Vérifier le statut des tâches
        const analysisStatus = await getTaskStatus(result.analysisTaskId);
        console.log('Statut de l\'analyse:', analysisStatus);

        const notificationStatus = await getTaskStatus(result.notificationTaskId);
        console.log('Statut de la notification:', notificationStatus);

        // Exemple d'utilisation du pont pour le code legacy
        console.log('\n=== Exemple d\'utilisation via le pont de compatibilité ===');
        const legacyResult = await legacyAnalyzeProject({
            id: 'legacy-projet-456',
            url: 'https://github.com/organization/legacy-project-456',
            options: {
                depth: 'standard',
                includeExternal: true
            },
            notify: true,
            emails: ['legacy-team@example.com']
        });

        console.log('Résultat legacy:', legacyResult);

        // Simuler une attente
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Vérifier le statut des tâches legacy
        if (legacyResult.analysisId) {
            const legacyAnalysisStatus = await getTaskStatus(legacyResult.analysisId);
            console.log('Statut de l\'analyse legacy:', legacyAnalysisStatus);
        }

        if (legacyResult.notificationId) {
            const legacyNotificationStatus = await getTaskStatus(legacyResult.notificationId);
            console.log('Statut de la notification legacy:', legacyNotificationStatus);
        }

    } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'exemple:', error);
    }
}

// Lancer l'exemple si ce fichier est exécuté directement
if (require.main === module) {
    runExample().catch(console.error);
}