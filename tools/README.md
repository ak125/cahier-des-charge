# Outils de développement

## Refactorisation des outils de conversion de types

**Note importante (5 mai 2025):**

Le script `type-mapper.ts` précédemment présent dans ce dossier a été refactorisé et déplacé vers une bibliothèque partagée centralisée.

Vous pouvez désormais utiliser la bibliothèque `@projet/db-utils-type-mapper` qui se trouve dans :
`/packages/db-utils/type-mapper/`

Cette bibliothèque fournit toutes les fonctionnalités précédentes avec une API améliorée et une architecture modulaire plus facile à maintenir.

### Utilisation de la nouvelle bibliothèque

```typescript
import { TypeMapper } from '@projet/db-utils-type-mapper';

// Créer une instance avec configuration
const mapper = new TypeMapper({
  mysqlSchemaPath: './schema.sql',
  outputPrismaPath: './schema.prisma',
  outputMarkdownPath: './documentation.md'
});

// Analyser le schéma et générer les résultats
const result = await mapper.analyze();

// Sauvegarder les résultats
await mapper.saveResults(result);
```

Consultez la documentation de la bibliothèque pour plus d'informations sur son utilisation.