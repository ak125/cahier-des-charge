# TODO Global MCP

Date de génération : 13 avril 2025

Ce document liste les tâches et corrections à effectuer pour finaliser le pipeline de migration PHP → NestJS/Remix.

## Agents à corriger/compléter

- [ ] **seo-checker.ts** : Cet agent est mentionné dans les exigences mais n'a pas été trouvé dans le codebase. Il faudrait l'implémenter pour vérifier et améliorer les métadonnées SEO des pages migrées.
  
- [ ] **htaccess-router.ts** : Un analyseur htaccess-parser.ts existe, mais l'agent de routage complet (`htaccess-router.ts`) mentionné dans les exigences n'a pas été trouvé. Il faudrait l'implémenter pour transformer complètement les règles .htaccess en routes Remix/NestJS.
  
- [ ] **sync-mapper.ts** : Cet agent mentionné dans les exigences n'a pas été trouvé. Il devrait être implémenté pour faciliter la synchronisation des données/schémas.

## Mappings SQL manquants

- [ ] **tools/mysql.sql.gz** : Le dump SQL initial mentionné dans les exigences n'a pas été trouvé. Il faudrait l'ajouter comme base pour la migration de la base de données.
  
- [ ] **schema_migration_diff.json** : Ce fichier de différence de schéma mentionné dans les exigences n'a pas été trouvé. Il serait utile pour documenter les changements de schéma entre MySQL et PostgreSQL.
  
- [ ] **prisma_model.suggestion.prisma** : Ce fichier de suggestion de modèle Prisma mentionné dans les exigences n'a pas été trouvé. Il fournirait des recommandations pour la migration du schéma.

## Routes non migrées

- [ ] **Validation des redirections** : Mettre en place un système pour vérifier si toutes les routes de l'ancien système ont bien été migrées. Un script `test-redirections.sh` existe mais son fonctionnement devrait être vérifié.
  
- [ ] **Gestion des routes 410/412** : S'assurer que les codes de retour spécifiques (410 Gone, 412 Precondition Failed) sont correctement gérés dans la migration.

## Modèles Remix incomplets

- [ ] **Routes générées** : Vérifier que toutes les routes générées incluent bien les métadonnées SEO et les redirections canoniques.
  
- [ ] **Tests unitaires** : S'assurer que les tests générés pour les composants Remix sont complets et fonctionnels.

## Erreurs dans audit/

- [ ] **Structure du dossier audit/** : Le dossier audit/ mentionné dans les exigences semble manquer ou être vide. Il devrait contenir les fichiers d'audit (*.audit.md) pour chaque fichier migré.
  
- [ ] **MCPManifest.json** : Le fichier MCPManifest.json mentionné dans les exigences n'a pas été trouvé. Il centraliserait les informations sur la migration.

## Scripts MCP à relancer

- [ ] **Audit complet** : Effectuer un audit complet de tous les fichiers PHP pour vérifier qu'aucun n'a été oublié.
  
- [ ] **Validation SEO** : Lancer un script de validation SEO sur toutes les pages migrées pour s'assurer que les métadonnées, les canonicals et les redirections sont correctes.
  
- [ ] **Tests de non-régression** : Mettre en place des tests de non-régression pour s'assurer que toutes les fonctionnalités ont été correctement migrées.

## Infrastructure à finaliser

- [ ] **Configuration Supabase de production** : Finaliser la configuration Supabase pour la production, actuellement des clés de développement sont utilisées.
  
- [ ] **Pipeline CI/CD** : Le fichier workflows/ci.yml mentionné dans les exigences n'a pas été trouvé. Il faudrait le créer ou vérifier que son équivalent (.github/workflows/mcp-pipeline.yml) couvre tous les besoins.
  
- [ ] **Documentation de migration** : Créer une documentation complète du processus de migration pour aider les développeurs à comprendre comment le système fonctionne et comment l'utiliser.