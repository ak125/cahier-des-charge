# Processors BullMQ

Ce répertoire contient les fonctions de traitement (processors) pour les jobs BullMQ.

## Objectif

Les processors sont des fonctions qui traitent les jobs extraits des files d'attente BullMQ. Ils contiennent la logique métier à exécuter pour chaque job.

## Conventions de nommage

- Les fichiers de processors doivent suivre le format : `{domaine}-processor.ts`
- Exemple : `email-processor.ts`, `analytics-processor.ts`

## Utilisation

```typescript
import { Job } from 'bullmq';
import { sendEmail } from '../../services/email-service';

export async function processEmailNotification(job: Job): Promise<any> {
  const { recipient, subject, body, attachments } = job.data;
  
  // Validation des données
  if (!recipient || !subject || !body) {
    throw new Error('Données d'email incomplètes');
  }
  
  // Traitement du job
  try {
    const result = await sendEmail(recipient, subject, body, attachments);
    
    // Vous pouvez retourner des données qui seront stockées avec le job terminé
    return {
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
      status: 'success'
    };
  } catch (error) {
    // Gestion des erreurs spécifiques pour décider si le job doit être réessayé
    if (error.code === 'TEMPORARILY_UNAVAILABLE') {
      // L'erreur sera détectée par BullMQ et le job sera réessayé
      throw error;
    }
    
    // Pour les erreurs permanentes, vous pouvez retourner un statut d'erreur
    return {
      error: error.message,
      sentAt: new Date().toISOString(),
      status: 'failed'
    };
  }
}
```

## Bonnes pratiques

- Conserver les processors stateless quand possible
- Valider les données d'entrée
- Gérer appropriément les erreurs et distinguer les erreurs temporaires des erreurs permanentes
- Retourner des résultats structurés pour faciliter le suivi
- Respecter le principe de responsabilité unique