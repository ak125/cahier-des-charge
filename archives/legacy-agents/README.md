# Agents Legacy - Avis Important

## Refactorisation des outils de conversion de types

**Note importante (5 mai 2025):**

Les scripts `analysis/type-mapper.ts` et `migration/mysql-to-pg.ts` précédemment présents dans ce dossier ont été refactorisés et déplacés vers une bibliothèque partagée centralisée.

Vous pouvez désormais utiliser la bibliothèque `@projet/db-utils-type-mapper` qui se trouve dans :
`/packages/db-utils/type-mapper/`

Cette bibliothèque fournit toutes les fonctionnalités précédentes avec une API améliorée et une architecture modulaire plus facile à maintenir.

### Migration vers la nouvelle bibliothèque

Si vous utilisiez ces outils dans vos workflows ou scripts, veuillez mettre à jour vos dépendances pour utiliser la nouvelle bibliothèque partagée. L'API est plus cohérente et mieux documentée.

Pour plus d'informations, consultez la documentation de la bibliothèque.