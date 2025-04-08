# Feuille de route du projet de migration IA

## 🚀 Vue d'ensemble

Cette feuille de route décrit la progression planifiée du projet de migration, depuis la préparation initiale jusqu'à la documentation continue. Chaque phase comporte des objectifs clairs et des livrables mesurables pour suivre l'avancement.

## 📋 Phases du projet

### Phase 0 – Préparation
- [x] Création du monorepo NestJS + Remix (TurboRepo)
- [x] Intégration de Docker, Prisma, PostgreSQL, Redis
- [x] Mise en place des outils de dev distant (Code Server, GitHub Codespaces)
- [x] Configuration du pipeline IA (n8n + MCP)
- [ ] Configuration du Google Docs synchronisé (cahier des charges)

### Phase 1 – Analyse initiale
- [ ] Lancer `monorepo-analyzer.ts` pour générer :
  - `monorepo_dependencies.json`
  - `code_style_profile.json`
  - `nestjs_module_patterns.json`
  - `remix_component_patterns.json`
- [ ] Lancer `sql-analyzer` (via dump MySQL)
  - `schema_map.json`, `entity_graph.json`, `suggested_schema.prisma`
- [ ] Lancer `htaccess-analyzer`
  - Extraire routes critiques, règles de réécriture, routes à rediriger/remapper

### Phase 2 – Planification & structuration
- [ ] Générer le `plan_migration.json` (fichiers PHP → modules Remix/NestJS)
- [ ] Générer `seo_meta.json` (routes critiques, pages à prioriser)
- [ ] Créer backlog technique (`migration_backlog.json`)
- [ ] Définir l'ordre de génération automatique des modules (Cart, Produits, Auth...)

### Phase 3 – Génération progressive
- [ ] Pour chaque fichier PHP :
  - Analyse via `php-analyzer`
  - Génération via `dev-generator.ts` (Remix + NestJS)
  - Synchronisation des routes, données et meta SEO
- [ ] Insertion dans le monorepo et mise à jour du Google Doc
- [ ] Suppression du fichier PHP une fois migré

### Phase 4 – Validation
- [ ] Tests automatiques et manuels (unitaires, intégration, navigation)
- [ ] Revue de cohérence : cahier des charges vs code vs base vs SEO
- [ ] Mise à jour automatique du `changelog.md`

### Phase 5 – Déploiement
- [ ] Configuration finale du pipeline CI/CD (GitHub Actions + Coolify)
- [ ] Mise en ligne progressive des modules stables
- [ ] Monitoring et feedback post-prod

### Phase 6 – Documentation continue
- [ ] Enrichir le Google Doc à chaque ajout
- [ ] Générer la documentation automatique des modules
- [ ] Intégrer le tout dans Obsidian ou Remix Dashboard

## ⏱️ Planning prévisionnel

| Phase | Durée estimée | Critères de fin de phase |
|-------|---------------|--------------------------|
| Phase 0 | 2 semaines | Environnement de développement opérationnel |
| Phase 1 | 3 semaines | Rapports d'analyse complétés et validés |
| Phase 2 | 2 semaines | Backlog de migration priorisé et validé |
| Phase 3 | 8-12 semaines | Modules critiques migrés (Auth, Produits, Panier) |
| Phase 4 | 2-4 semaines (parallèle à Phase 3) | Tests validés pour chaque module |
| Phase 5 | 2-3 semaines | Mise en production par module |
| Phase 6 | Continue | Documentation à jour et synchronisée |

## 🔄 Jalons clés et métriques de progression

| Jalon | Échéance | Métrique | Cible |
|-------|----------|----------|-------|
| Environnement prêt | S2 | Composants intégrés | 100% |
| Schéma initial | S5 | Tables migrées vers Prisma | 80% |
| Auth migré | S8 | Routes Auth fonctionnelles | 100% |
| Catalogue produits | S12 | Pages produits migrées | 90% |
| Panier fonctionnel | S16 | Tests e2e panier/commande | Passage à 100% |
| SEO validé | S18 | Redirections fonctionnelles | 100% |
| Production | S20 | Trafic dirigé vers nouvelle app | 20% → 100% |

## 🚧 Stratégie de déploiement progressif

1. **Mode parallèle** (S1-S18)
   - Les deux systèmes coexistent
   - Le trafic reste sur l'ancien système
   - Tests A/B ponctuels sur la nouvelle plateforme

2. **Mode dirigé** (S18-S22)
   - Redirection progressive du trafic
   - Démarrage avec modules non-critiques
   - Augmentation du % selon métriques de stabilité

3. **Basculement complet** (S22+)
   - 100% du trafic sur le nouveau système
   - Ancien système en mode lecture seule
   - Phase d'observation et optimisation
