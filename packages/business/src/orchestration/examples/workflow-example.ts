/**
 * Exemple d'utilisation de l'orchestrateur unifié
 *
 * Ce fichier montre comment utiliser l'orchestrateur unifié pour créer
 * et exécuter des workflows plus simplement qu'avec l'approche multi-orchestrateur.
 */

import { Job } from 'bullmq';
import { unifiedOrchestrator } from '../unified-orchestrator';

// 1. Connexion à l'orchestrateur (une seule fois dans l'application)
async function initializeOrchestration() {
  await unifiedOrchestrator.connect();
  console.log('Orchestrateur connecté');

  // 2. Définir les workers pour traiter les tâches
  setupWorkers();
}

// Configuration des workers pour traiter différents types de tâches
function setupWorkers() {
  // Worker pour le traitement d'images
  const _imageProcessingWorker = unifiedOrchestrator.createWorker(
    'imageProcessing',
    async (job: Job) => {
      console.log(`Traitement de l'image ${job.id} en cours...`);
      const { imagePath, filters } = job.data;

      // Simuler le traitement d'image
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return {
        processedImagePath: imagePath.replace('.jpg', '-processed.jpg'),
        appliedFilters: filters,
        processingTime: 1500,
      };
    }
  );

  // Worker pour les notifications
  const _notificationWorker = unifiedOrchestrator.createWorker('notification', async (job: Job) => {
    const { channel, recipient, message } = job.data;
    console.log(`Envoi de notification à ${recipient} via ${channel}`);

    // Simuler l'envoi de notification
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      sent: true,
      timestamp: new Date(),
      messageId: `msg-${Date.now()}`,
    };
  });

  // Worker pour la génération de rapports
  const _reportGenerationWorker = unifiedOrchestrator.createWorker(
    'reportGeneration',
    async (job: Job) => {
      const { reportType, parameters, format } = job.data;
      console.log(`Génération du rapport ${reportType} au format ${format}`);

      // Simuler la génération de rapport
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return {
        reportUrl: `https://reports.example.com/${reportType}-${Date.now()}.${format}`,
        pageCount: Math.floor(Math.random() * 20) + 1,
        generationTime: 3000,
      };
    }
  );

  console.log('Workers configurés');
}

// 3. Exemple de workflow complet
async function runImageProcessingWorkflow(imagePath: string, filters: string[], userId: string) {
  console.log(`Démarrage du workflow de traitement d'image pour ${imagePath}`);

  try {
    // Étape 1: Planifier le traitement d'image
    const imageTaskId = await unifiedOrchestrator.scheduleTask({
      name: 'imageProcessing',
      payload: {
        imagePath,
        filters,
      },
      options: {
        priority: 10,
        attempts: 3,
      },
    });

    console.log(`Tâche de traitement d'image créée: ${imageTaskId}`);

    // Attendre la fin du traitement (dans un cas réel, on utiliserait plutôt des événements)
    let imageResult;
    let imageStatus;

    do {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const taskStatus = await unifiedOrchestrator.getTaskStatus(imageTaskId);
      imageStatus = taskStatus.status;

      if (taskStatus.status === 'completed') {
        imageResult = taskStatus.result;
        break;
      }
      if (taskStatus.status === 'failed') {
        throw new Error(`Le traitement d'image a échoué: ${taskStatus.error}`);
      }
    } while (imageStatus !== 'completed' && imageStatus !== 'failed');

    // Étape 2: Envoyer une notification
    const notificationTaskId = await unifiedOrchestrator.scheduleTask({
      name: 'notification',
      payload: {
        channel: 'email',
        recipient: userId,
        message: `Votre image ${imagePath} a été traitée avec succès.`,
        attachmentUrl: imageResult.processedImagePath,
      },
    });

    console.log(`Tâche de notification créée: ${notificationTaskId}`);

    // Étape 3: Générer un rapport mensuel d'utilisation si nécessaire
    const today = new Date();
    if (today.getDate() === 1) {
      // Premier jour du mois
      const reportTaskId = await unifiedOrchestrator.scheduleTask({
        name: 'reportGeneration',
        payload: {
          reportType: 'monthly-usage',
          parameters: {
            userId,
            month: today.getMonth(),
            year: today.getFullYear(),
          },
          format: 'pdf',
        },
        options: {
          priority: 5,
        },
      });

      console.log(`Tâche de génération de rapport créée: ${reportTaskId}`);
    }

    return {
      success: true,
      processedImagePath: imageResult.processedImagePath,
      workflowCompleted: true,
    };
  } catch (error) {
    console.error('Erreur dans le workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      workflowCompleted: false,
    };
  }
}

// 4. Utilisation de l'exemple
async function main() {
  await initializeOrchestration();

  const result = await runImageProcessingWorkflow(
    '/uploads/vacation.jpg',
    ['brightness', 'contrast', 'sharpen'],
    'user123@example.com'
  );

  console.log('Résultat du workflow:', result);

  // Lister toutes les tâches pour vérifier
  const allTasks = await unifiedOrchestrator.listTasks();
  console.log(`Nombre total de tâches: ${allTasks.length}`);

  // Nettoyage
  await unifiedOrchestrator.disconnect();
}

// Exécuter l'exemple si ce fichier est exécuté directement
if (require.main === module) {
  main().catch(console.error);
}

export { initializeOrchestration, runImageProcessingWorkflow };
