/**
 * Exemple de migration d'un workflow n8n simple vers BullMQ
 * 
 * Ce fichier montre comment migrer un workflow n8n de notifications
 * vers l'implémentation BullMQ standardisée.
 * 
 * Workflow n8n d'origine : notification_workflow.n8n.json
 */

import { Queue } from 'bullmq';

// Simulation de la connexion Redis pour l'exemple
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
};

// Configuration de la file d'attente
const notificationsQueue = new Queue('notifications', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: 100,   // Garder les 100 derniers jobs complétés
        removeOnFail: 500        // Garder les 500 derniers jobs échoués
    }
});

/**
 * Fonction qui encapsule la logique de notification
 * Remplace le workflow n8n précédent
 */
export async function sendNotification(payload: {
    recipient: string;
    subject: string;
    message: string;
    type: 'email' | 'sms' | 'push' | 'slack';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: Record<string, any>;
}) {
    // Validation des données
    if (!payload.recipient || !payload.message) {
        throw new Error('Recipient and message are required');
    }

    // Transformation des données - équivalent des transformations qui étaient faites dans n8n
    const jobData = {
        ...payload,
        priority: payload.priority || 'normal',
        timestamp: new Date().toISOString(),
        metadata: {
            ...payload.metadata,
            source: 'migrated-from-n8n'
        }
    };

    // Déterminer la priorité BullMQ en fonction du niveau de priorité fourni
    let bullMQPriority: number;
    switch (payload.priority) {
        case 'urgent': bullMQPriority = 1; break;
        case 'high': bullMQPriority = 2; break;
        case 'normal': bullMQPriority = 3; break;
        case 'low': bullMQPriority = 4; break;
        default: bullMQPriority = 3;
    }

    // Ajouter le job à la file d'attente avec les options appropriées
    const job = await notificationsQueue.add('send-notification', jobData, {
        priority: bullMQPriority,
        attempts: jobData.priority === 'urgent' ? 5 : 3,
        jobId: `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        removeOnComplete: true
    });

    return {
        jobId: job.id,
        status: 'scheduled',
        queueName: 'notifications',
        addedAt: new Date().toISOString()
    };
}

/**
 * COMPARAISON AVEC LE WORKFLOW N8N ORIGINAL
 * 
 * Workflow n8n original:
 * 1. Webhook Trigger - Reçoit la requête avec les données de notification
 * 2. Function Node - Valide les données et transforme le format
 * 3. Switch Node - Dirige vers différents canaux selon le type
 * 4. Email Node / Slack Node / SMS Node - Envoie la notification
 * 5. Set Node - Prépare la réponse
 * 6. Respond to Webhook - Renvoie le statut
 * 
 * Notre implémentation BullMQ:
 * 1. Function sendNotification() - Équivalent au Webhook + validation
 * 2. BullMQ Job - Stocke et planifie le travail
 * 3. Worker (à implémenter séparément) - Consommerait les jobs et enverrait les notifications
 * 
 * Avantages de la migration:
 * - Meilleure résilience (retry automatique, stockage des jobs)
 * - Monitoring et observabilité intégrés
 * - Séparation claire entre l'API (enqueue) et le traitement (worker)
 * - Intégration native avec l'infrastructure et le code TypeScript
 */

/**
 * UTILISATION
 * 
 * // Au lieu du déclenchement n8n via API webhook:
 * // POST https://n8n.example.com/webhook/notification-workflow
 * 
 * // Utiliser la fonction standardisée:
 * await sendNotification({
 *   recipient: 'user@example.com',
 *   subject: 'Notification importante',
 *   message: 'Votre rapport a été généré avec succès',
 *   type: 'email',
 *   priority: 'normal'
 * });
 */