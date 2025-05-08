# Migration Legacy - Avis Important

## Refactorisation des outils de conversion de types

**Note importante (5 mai 2025):**

Les scripts `analysis/type-mapper.ts` et `migration/mysql-to-pg.ts` précédemment présents dans ce dossier ont été refactorisés et déplacés vers une bibliothèque partagée centralisée.

Vous pouvez désormais utiliser la bibliothèque `@projet/db-utils-type-mapper` qui se trouve dans :
`/packages/db-utils/type-mapper/`

Cette bibliothèque fournit toutes les fonctionnalités précédentes avec une API améliorée et une architecture modulaire plus facile à maintenir.

### Historique de la migration

Ces scripts étaient utilisés dans le cadre de la migration des bases de données MySQL vers PostgreSQL avec Prisma. La nouvelle bibliothèque conserve ces fonctionnalités mais avec une architecture plus modulaire et maintenable.