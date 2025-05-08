# Guide de consolidation des workflows Temporal

## Problématique

Notre projet souffre actuellement de deux problèmes majeurs liés aux workflows Temporal :

1. **Structure de dossiers incohérente** : Les workflows sont répartis dans deux structures différentes :
   - `/packages/business/temporal/workflows/` (structure principale)
   - `/packages/business/workflows/temporal/` (structure secondaire)

2. **Duplication fonctionnelle** : Certains workflows ont des fonctionnalités similaires ou identiques implémentées de façons différentes.

## Objectifs

- Standardiser la structure des dossiers pour tous les workflows Temporal
- Éliminer la duplication dans les implémentations de workflows
- Établir un modèle cohérent pour les nouveaux workflows

## Stratégie de consolidation

### 1. Structure standard

Nous avons choisi `/packages/business/temporal/workflows/` comme structure standard pour les raisons suivantes :
- Elle est déjà utilisée par la majorité des workflows
- Elle permet une organisation claire par domaine fonctionnel
- Elle est alignée avec la structure globale du projet

### 2. Nomenclature des fichiers

Format standard : `<fonctionnalité>[-<sous-fonctionnalité>].workflow.ts`

Exemples :
- `php-analysis/consolidated-php-analyzer.workflow.ts`
- `migration-plans/generate-migration-plans.workflow.ts`

### 3. Style d'implémentation

Nous standardisons l'implémentation des workflows selon le modèle suivant :

```typescript
import { proxyActivities, setHandler, workflow } from '@temporalio/workflow';

// Définir les activités
const { activity1, activity2 } = proxyActivities({
  activities: {
    activity1: workflow.import('...'),
    activity2: workflow.import('...')
  },
  startToCloseTimeout: '30 minutes'
});

// Définir le workflow
export async function myWorkflow(input: MyInput): Promise<MyOutput> {
  // Implémentation
}

// Exporter comme default
export default myWorkflow;
```

### 4. Consolidation des workflows dupliqués

Pour les workflows avec fonctionnalités similaires :

1. **Identifier le workflow principal** (généralement le plus complet)
2. **Extraire les fonctionnalités communes** dans des modules partagés
3. **Refactoriser les workflows secondaires** pour utiliser les modules partagés

## Cas spécifiques à traiter

### Analyse PHP

Workflows concernés :
- `/packages/business/temporal/workflows/php-analysis/consolidated-php-analyzer.workflow.ts`
- `/packages/business/workflows/temporal/php-migration.workflow.ts` (comporte une phase d'analyse)

Solution proposée :
- Utiliser `consolidated-php-analyzer.workflow.ts` comme workflow d'analyse PHP standard
- Modifier `php-migration.workflow.ts` pour appeler ce workflow au lieu d'implémenter sa propre analyse

### Migration AI

Workflows concernés :
- `/packages/business/temporal/workflows/ai-migration-consolidated.workflow.ts`
- `/packages/business/temporal/workflows/ai-migration-pipeline.workflow.ts`

Solution proposée :
- Comparer les fonctionnalités des deux workflows
- Consolider en un seul workflow avec toutes les fonctionnalités nécessaires

## Plan d'exécution

1. **Analyse** : Exécuter le script `cleanup-scripts/standardize-workflow-structure.js` pour générer un rapport
2. **Planification** : Revue du rapport et définition des actions pour chaque workflow
3. **Consolidation** : Traitement workflow par workflow selon le plan
4. **Tests** : Vérifier que chaque workflow consolidé fonctionne correctement
5. **Nettoyage** : Supprimer les workflows obsolètes

## Procédure de migration d'un workflow

1. Exécuter `node cleanup-scripts/standardize-workflow-structure.js --migrate`
2. Pour chaque conflit détecté :
   - Comparer les fichiers concernés
   - Déterminer quelle version préserver
   - Mettre à jour les références
3. Valider les changements par des tests appropriés avant de supprimer définitivement les fichiers obsolètes