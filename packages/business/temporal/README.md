# Orchestrateur Temporal.io Standardisé

Ce répertoire contient l'implémentation standardisée de l'orchestration utilisant Temporal.io, conformément au document de standardisation des technologies.

## Objectif

Temporal.io est utilisé pour tous les workflows complexes avec état, notamment :
- Workflows de longue durée (> 5 minutes)
- Workflows requérant un état persistant
- Workflows avec gestion avancée des erreurs et compensation
- Workflows critiques qui ne doivent jamais échouer

## Structure du répertoire

- **[/client](/client/)** : Configuration et abstraction du client Temporal
- **[/workers](/workers/)** : Définition et configuration des workers Temporal
- **[/workflows](/workflows/)** : Workflows organisés par domaine fonctionnel
- **[/activities](/activities/)** : Activités réutilisables
- **[/testing](/testing/)** : Utilitaires pour tester les workflows
- **[/types](/types/)** : Définitions TypeScript partagées

## Utilisation

Pour utiliser l'orchestrateur Temporal standardisé :

```typescript
import { temporal } from '@packages/business/temporal';

// Démarrer un workflow simple
const workflowId = await temporal.startWorkflow({
  workflowType: 'analyzeCodebase', // Nom du workflow défini dans /workflows/
  taskQueue: 'code-analysis',       // File d'attente du worker
  workflowId: `analyze-${projectId}-${Date.now()}`, // ID unique
  args: [{ projectId, repositoryUrl }]  // Arguments du workflow
});

// Récupérer le statut d'un workflow
const status = await temporal.getWorkflowStatus(workflowId);

// Attendre la fin d'un workflow
const result = await temporal.waitForWorkflow(workflowId);
```

## Migration depuis n8n et les orchestrateurs personnalisés

Pour migrer vers cette implémentation standardisée, référez-vous au guide de migration :
[Guide de migration n8n](/docs/n8n-migration-plan.md)

## Bonnes pratiques

1. **Organisation par domaine** : Groupez les workflows et activités par domaine métier
2. **Réutilisation des activités** : Créez des activités génériques et réutilisables
3. **Gestion d'erreurs** : Utilisez les mécanismes de retry et de compensation de Temporal
4. **Tests** : Écrivez des tests unitaires et d'intégration pour vos workflows
5. **Monitoring** : Configurez la télémétrie pour vos workflows critiques

## Ressources

- [Documentation Temporal.io](https://docs.temporal.io/)
- [Guide de l'orchestrateur standardisé](/docs/orchestrateur-standardise-guide.md)
- [Document de standardisation des technologies](/docs/technologies-standards.md)