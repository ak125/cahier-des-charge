# Présentation : Standards des Workflows Temporal

## Introduction

Dans le cadre de notre effort continu pour améliorer la qualité du code et réduire la dette technique, nous avons établi de nouveaux standards pour les workflows Temporal dans notre projet. Cette présentation vise à vous présenter ces standards et à vous guider dans leur application.

---

## Motivation

### Problèmes identifiés

- **Structure de dossiers incohérente** : Workflows répartis dans deux structures différentes
- **Duplication fonctionnelle** : Workflows avec des fonctionnalités similaires ou identiques
- **Styles d'implémentation différents** : Utilisation inconsistante des APIs Temporal

### Bénéfices de la standardisation

- **Meilleure maintenabilité** du code
- **Réduction des duplications** et des bugs potentiels
- **Onboarding facilité** pour les nouveaux développeurs
- **Évolution cohérente** des fonctionnalités

---

## Standards de structure

### Structure de dossiers standard

```
/packages/business/temporal/workflows/
```

Organisation par domaine fonctionnel :
- `/packages/business/temporal/workflows/php-analysis/`
- `/packages/business/temporal/workflows/migration-plans/`
- etc.

### Structure obsolète (à ne plus utiliser)

```
/packages/business/workflows/temporal/
```

---

## Standards de nommage

### Format standard pour les fichiers

```
<fonctionnalité>[-<sous-fonctionnalité>].workflow.ts
```

### Exemples

✅ **Correct** :
- `php-analysis/consolidated-php-analyzer.workflow.ts`
- `migration-plans/generate-migration-plans.workflow.ts`

❌ **Incorrect** :
- `phpAnalyzer.ts` (manque du suffixe .workflow)
- `PhpMigration.workflow.ts` (PascalCase non recommandé)

---

## Structure du code

### Imports standard

```typescript
import { 
  proxyActivities, 
  setHandler, 
  workflow 
} from '@temporalio/workflow';

import type * as activities from '../../activities/my-activities';
```

### Déclaration des activités

```typescript
const { activity1, activity2 } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3 }
});
```

---

## Définition des workflows

### Format standard

```typescript
/**
 * Description détaillée du workflow
 * 
 * @param input Paramètres d'entrée
 * @returns Résultat du workflow
 */
export async function myWorkflow(input: MyInput): Promise<MyOutput> {
  // Implémentation
}

// Exportation par défaut (recommandé)
export default myWorkflow;
```

---

## Bonnes pratiques

### Documentation
- **Commentaires JSDoc** pour chaque workflow et fonction principale
- **Commentaires de section** pour les grandes parties de code

### Gestion des erreurs
- Encapsuler le code principal dans un bloc try-catch
- Journaliser les erreurs avant de les propager

### Durabilité
- Éviter les références à des objets externes non sérialisables
- Stocker les états intermédiaires pour permettre la reprise

---

## Workflows consolidés

### Consolidation de workflows dupliqués
- **Analyse PHP** : Utiliser `consolidated-php-analyzer.workflow.ts`
- **Migration AI** : Utiliser `ai-migration-standard.workflow.ts`

### Règle générale
1. Identifier les workflows avec fonctionnalités similaires
2. Choisir le workflow le plus complet comme base
3. Intégrer les fonctionnalités uniques des autres workflows
4. Maintenir des exports pour la compatibilité

---

## Outils de support

### Scripts de nettoyage
- `standardize-workflow-structure.js` : Standardisation de la structure
- `refactor-php-migration-workflow.js` : Refactorisation du workflow PHP
- `consolidate-ai-workflows.js` : Consolidation des workflows AI
- `clean-obsolete-workflow-files.js` : Nettoyage final

### Documentation
- [Guide de consolidation des workflows](/docs/workflow-consolidation-guide.md)
- [Standards des workflows Temporal](/docs/standards/temporal-workflow-standards.md)

---

## Validation automatique

### Linting et validations
- Règles ESLint pour vérifier la conformité aux standards
- Hooks de pre-commit pour valider la structure et les noms de fichiers

### À venir
- Intégration dans la CI/CD
- Génération de rapports de conformité

---

## Questions et support

Pour toute question concernant les standards ou l'application des règles, n'hésitez pas à contacter :
- L'équipe d'architecture
- Les mainteneurs du projet

Documentation complète : `/docs/standards/temporal-workflow-standards.md`

---

## Exemples concrets

### Avant standardisation
- Workflows dupliqués pour l'analyse PHP et la migration
- Structure de dossiers incohérente
- Styles d'implémentation différents

### Après standardisation
- Workflows unifiés et bien organisés
- Structure de dossiers cohérente
- Implémentations harmonisées

---

## Prochaines étapes

1. **Migration** des anciens workflows vers les standards
2. **Formation** continue de l'équipe
3. **Amélioration** des outils de validation
4. **Extension** des standards à d'autres parties du code