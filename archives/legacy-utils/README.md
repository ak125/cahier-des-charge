# Utilitaires Legacy - Avis Important

## Refactorisation des outils de conversion de types

**Note importante (5 mai 2025):**

Le script `type-mapper.ts` précédemment présent dans ce dossier a été refactorisé et déplacé vers une bibliothèque partagée centralisée.

Vous pouvez désormais utiliser la bibliothèque `@projet/db-utils-type-mapper` qui se trouve dans :
`/packages/db-utils/type-mapper/`

Cette bibliothèque fournit toutes les fonctionnalités précédentes avec une API améliorée et une architecture modulaire plus facile à maintenir.

### Utilisation de la nouvelle bibliothèque

Pour remplacer les fonctionnalités de l'ancien utilitaire, utilisez la bibliothèque partagée :

```typescript
import { TypeMapper } from '@projet/db-utils-type-mapper';

// Créer une instance avec configuration
const mapper = new TypeMapper({
  // Options de configuration...
});

// Utilisez l'API moderne
const result = await mapper.analyze();
```