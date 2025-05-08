/**
 * Exemple d'utilisation de l'orchestrateur standardisé avec BullMQ
 * 
 * Cet exemple montre comment implémenter un système de notifications
 * et de traitements d'images en utilisant l'orchestrateur standardisé avec BullMQ.
 */

import { standardizedOrchestrator } from '..';
import { bullmq } from '../queue';
import { z } from 'zod';

// 1. Définir des schémas de validation pour les entrées avec Zod

// Schéma pour les notifications
const notificationSchema = z.object({
    userId: z.string(),
    channelType: z.enum(['email', 'push', 'sms']),
    title: z.string(),
    message: z.string(),
    data: z.record(z.string(), z.unknown()).optional(),
    priority: z.enum(['high', 'normal', 'low']).optional().default('normal'),
    scheduledFor: z.date().optional()
});

type NotificationInput = z.infer<typeof notificationSchema>;

// Schéma pour le traitement d'images
const imageProcessingSchema = z.object({
    imageUrl: z.string().url(),
    operations: z.array(z.object({
        type: z.enum(['resize', 'crop', 'optimize', 'filter', 'convert']),
        params: z.record(z.string(), z.unknown())
    })),
    outputFormat: z.enum(['jpg', 'png', 'webp', 'avif']).optional(),
    quality: z.number().min(1).max(100).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    callbackUrl: z.string().url().optional()
});

type ImageProcessingInput = z.infer<typeof imageProcessingSchema>;

// Enum pour les priorités BullMQ
enum TaskPriority {
    CRITICAL = 1,
    HIGH = 5,
    NORMAL = 10,
    LOW = 15,
    BACKGROUND = 20
}

// 2. Fonctions principales utilisant l'orchestrateur standardisé

/**
 * Envoie une notification via l'orchestrateur standardisé
 */
export async function sendNotification(input: NotificationInput): Promise<string> {
    // Valider les données d'entrée
    const validatedInput = notificationSchema.parse(input);

    console.log(`Envoi d'une notification ${validatedInput.channelType} à l'utilisateur ${validatedInput.userId}`);

    // Mapper la priorité de la notification vers une priorité BullMQ
    const priorityMap = {
        high: TaskPriority.HIGH,
        normal: TaskPriority.NORMAL,
        low: TaskPriority.LOW
    };

    // Utilisation de l'orchestrateur standardisé qui choisira automatiquement BullMQ
    // car il s'agit d'une tâche simple (isComplex: false)
    const taskId = await standardizedOrchestrator.schedule({
        type: 'send-notification',
        data: validatedInput,
        isComplex: false,
        priority: priorityMap[validatedInput.priority],
        delay: validatedInput.scheduledFor ?
            validatedInput.scheduledFor.getTime() - Date.now() :
            undefined,
        queue: `notification-${validatedInput.channelType}`,
        tags: ['notification', validatedInput.channelType, validatedInput.priority]
    });

    console.log(`Notification planifiée avec succès, TaskID: ${taskId}`);
    return taskId;
}

/**
 * Traite une image via l'orchestrateur standardisé
 */
export async function processImage(input: ImageProcessingInput): Promise<string> {
    // Valider les données d'entrée
    const validatedInput = imageProcessingSchema.parse(input);

    console.log(`Traitement de l'image ${validatedInput.imageUrl} avec ${validatedInput.operations.length} opérations`);

    // Utilisation de l'orchestrateur standardisé pour une tâche de traitement d'image
    const taskId = await standardizedOrchestrator.schedule({
        type: 'process-image',
        data: validatedInput,
        isComplex: false, // BullMQ est suffisant pour ce type de traitement
        priority: TaskPriority.NORMAL,
        queue: 'media-processing',
        retry: {
            maxAttempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000 // 5 secondes de délai initial
            }
        },
        tags: ['image', 'media', validatedInput.outputFormat || 'original']
    });

    console.log(`Traitement d'image planifié avec succès, TaskID: ${taskId}`);
    return taskId;
}

// 3. Fonction utilisant directement BullMQ pour plus de contrôle
export async function scheduleImageProcessingBatch(
    images: Array<{ url: string, operations: Array<{ type: string, params: Record<string, unknown> }> }>,
    options: {
        batchId?: string;
        priority?: number;
        outputFormat?: 'jpg' | 'png' | 'webp' | 'avif';
        callbackUrl?: string;
    } = {}
): Promise<string[]> {
    // Traitement par lot avec BullMQ directement
    const taskIds: string[] = [];

    for (const image of images) {
        // Validation minimale pour chaque image
        if (!image.url || !image.operations || image.operations.length === 0) {
            console.warn('Image ignorée car données incomplètes', image);
            continue;
        }

        // Utilisation directe de BullMQ pour un contrôle plus fin
        const taskId = await bullmq.scheduleTask(
            'process-image-batch',
            {
                imageUrl: image.url,
                operations: image.operations,
                outputFormat: options.outputFormat,
                batchId: options.batchId || `batch-${Date.now()}`,
                callbackUrl: options.callbackUrl
            },
            {
                priority: options.priority || TaskPriority.NORMAL,
                queue: 'media-batch-processing',
                retry: {
                    maxAttempts: 2,
                    backoff: {
                        type: 'fixed',
                        delay: 10000 // 10 secondes de délai fixe
                    }
                }
            }
        );

        taskIds.push(taskId);
    }

    console.log(`Traitement par lot planifié avec ${taskIds.length} images`);
    return taskIds;
}

// 4. Exemple d'utilisation: suivre le statut d'un traitement
export async function getTaskStatus(taskId: string, queueName?: string): Promise<any> {
    // Récupérer le statut avec l'orchestrateur standardisé
    return standardizedOrchestrator.getTaskStatus(taskId, 'bullmq', queueName);
}

// 5. Exemple d'utilisation: annuler un traitement en cours
export async function cancelTask(taskId: string, queueName?: string): Promise<boolean> {
    // Annuler une tâche avec l'orchestrateur standardisé
    return standardizedOrchestrator.cancelTask(taskId, 'bullmq', queueName);
}

// 6. Exemple concret d'utilisation
async function runExample() {
    try {
        // Exemple d'envoi de notification
        const notificationExample: NotificationInput = {
            userId: 'user123',
            channelType: 'email',
            title: 'Bienvenue sur notre plateforme',
            message: 'Merci de vous être inscrit sur notre plateforme.',
            data: {
                ctaUrl: 'https://exemple.com/bienvenue',
                ctaLabel: 'Commencer maintenant'
            },
            priority: 'high'
        };

        const notificationId = await sendNotification(notificationExample);
        console.log(`Notification planifiée avec ID: ${notificationId}`);

        // Exemple de traitement d'image
        const imageExample: ImageProcessingInput = {
            imageUrl: 'https://exemple.com/images/original.jpg',
            operations: [
                {
                    type: 'resize',
                    params: { width: 800, height: 600, fit: 'contain' }
                },
                {
                    type: 'optimize',
                    params: { level: 'medium' }
                },
                {
                    type: 'filter',
                    params: { name: 'sharpen', strength: 0.5 }
                }
            ],
            outputFormat: 'webp',
            quality: 85,
            callbackUrl: 'https://exemple.com/api/webhook/image-processed'
        };

        const imageTaskId = await processImage(imageExample);
        console.log(`Traitement d'image planifié avec ID: ${imageTaskId}`);

        // Simuler une attente
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Vérifier le statut
        const status = await getTaskStatus(imageTaskId, 'media-processing');
        console.log(`Statut du traitement: ${status.status}`);

        // Exemple de traitement par lot
        const batchResult = await scheduleImageProcessingBatch([
            {
                url: 'https://exemple.com/images/photo1.jpg',
                operations: [{ type: 'resize', params: { width: 400 } }]
            },
            {
                url: 'https://exemple.com/images/photo2.jpg',
                operations: [{ type: 'crop', params: { width: 400, height: 400, x: 100, y: 100 } }]
            }
        ], {
            outputFormat: 'webp',
            priority: TaskPriority.HIGH,
            callbackUrl: 'https://exemple.com/api/batch-complete'
        });

        console.log(`Batch planifié avec ${batchResult.length} tâches`);

    } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'exemple:', error);
    }
}

// Lancer l'exemple si ce fichier est exécuté directement
if (require.main === module) {
    runExample().catch(console.error);
}