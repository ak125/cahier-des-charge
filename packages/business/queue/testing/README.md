# Testing BullMQ

Ce répertoire contient les utilitaires et outils pour tester les queues et processors BullMQ.

## Objectif

Faciliter les tests unitaires et d'intégration des jobs BullMQ en fournissant des mocks, des utilitaires et des configurations standardisées.

## Contenu recommandé

- Mocks pour les queues BullMQ
- Workers de test
- Environnement de test local avec Redis en mémoire
- Helpers pour les assertions spécifiques aux jobs

## Exemple d'utilisation

```typescript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis-mock';
import { processEmailNotification } from '../processors/email-processor';

describe('Email processor', () => {
  let queue: Queue;
  let worker: Worker;
  let connection: IORedis;
  
  beforeAll(() => {
    // Utilisation de ioredis-mock pour les tests
    connection = new IORedis();
    
    // Création d'une queue de test
    queue = new Queue('email-test', { connection });
    
    // Création d'un worker de test
    worker = new Worker('email-test', processEmailNotification, { connection });
  });
  
  afterAll(async () => {
    await queue.close();
    await worker.close();
  });
  
  it('devrait traiter correctement un email', async () => {
    // Mock du service d'email
    const mockSendEmail = jest.fn().mockResolvedValue({
      messageId: 'test-123',
      success: true
    });
    
    // Ajout d'un job de test
    const job = await queue.add('send-email', {
      recipient: 'test@example.com',
      subject: 'Test subject',
      body: 'Test body'
    });
    
    // Vérification que le job est correctement traité
    const result = await processEmailNotification({ ...job, data: job.data });
    
    expect(result).toEqual({
      messageId: 'test-123',
      status: 'success',
      sentAt: expect.any(String)
    });
  });
});
```

## Bonnes pratiques

- Utiliser ioredis-mock pour les tests unitaires
- Créer des environnements de test isolés
- Mocker les dépendances externes
- Tester les cas d'erreur et de succès