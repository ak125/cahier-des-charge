# Rapport de Classification Structurelle
  
## Métadonnées

- **Date de génération :** 4/22/2025, 12:41:33 AM
- **Version de structure-map :** 1.2.0
- **Dernière mise à jour de structure-map :** 2025-04-21
- **Fichiers analysés :** 5770
- **Temps d'exécution :** 141.19 secondes
- **Fichiers améliorés par analyse contextuelle :** 2576

## Statistiques

### Par couche architecturale
- **business** : 3362 fichiers
- **coordination** : 996 fichiers
- **shared** : 981 fichiers
- **orchestration** : 407 fichiers
- **unknown** : 24 fichiers

### Par domaine fonctionnel
- **migration** : 2291 fichiers
- **unknown** : 2083 fichiers
- **documentation** : 681 fichiers
- **tools** : 369 fichiers
- **core** : 123 fichiers
- **dashboard** : 122 fichiers
- **seo** : 39 fichiers
- **integration** : 38 fichiers
- **analysis** : 20 fichiers
- **quality** : 2 fichiers
- **security** : 2 fichiers

### Par statut
- **active** : 4700 fichiers
- **stable** : 822 fichiers
- **testing** : 111 fichiers
- **deprecated** : 100 fichiers
- **unknown** : 37 fichiers

## Fichiers Business Actifs (Top 20)

Les fichiers du domaine métier qui sont activement utilisés :

- `adapt-agents.ts`
- `analyse_sql_recommandations.sql`
- `dashboard-architecture.tsx`
- `dashboard-prisma-migration.tsx`
- `dashboard-quality-scores.tsx`
- `dashboard-seo-migration.tsx`
- `dashboard.html`
- `fix-agent-typescript-errors.ts`
- `generate-agent-manifest.ts`
- `index.ts`
- `mcp-routes.ts`
- `migration_checklist.sql`
- `pnpm-workspace.yaml`
- `run-fixed-agent-tests.ts`
- `schema_diff_to_code_patch.ts`
- `validate-interface-implementations.ts`
- `agents/canonical-validator.ts`
- `agents/ci-tester.ts`
- `agents/dev-checker.ts`
- `agents/dev-integrator.ts`

## Fichiers d'Orchestration (Top 20)

Les fichiers impliqués dans l'orchestration du système :

- `Dockerfile.nestjs`
- `Dockerfile.remix`
- `Dockerfile.supabase`
- `Dockerfile.temporal-worker`
- `Taskfile.yaml`
- `analyze-htaccess.sh`
- `check-methods-implementation.sh`
- `ci-validate.sh`
- `clean-agents-duplicates.sh`
- `cleanup-legacy-agents.sh`
- `configure-missed-urls-alerts.sh`
- `consolidate-migration.sh`
- `docker-compose.bullmq.yml`
- `docker-compose.dev.yml`
- `docker-compose.mcp.yml`
- `docker-compose.n8n.yml`
- `docker-compose.yml`
- `docs-routes-mappings.sh`
- `emergency-typescript-fix.sh`
- `finalize-migration-cleanup.sh`

## Fichiers en Développement (Top 20)

Les fichiers actuellement en cours de développement :



## Fichiers Dépréciés (Top 20)

Les fichiers marqués comme dépréciés ou obsolètes :

- `app/api/quality-api.js`
- `assets/visualisations/cahier-des-charges-lecture-optimisee.html`
- `assets/visualisations/vue-complete-auto.html`
- `assets/visualisations/vue-complete.html`
- `cahier-des-charge/docs/cahier-des-charges.html`
- `cahier-des-charge/docs/vue-complete.html`
- `cahier-des-charge/examples/example.htaccess`
- `cahier-des-charge/scripts/generate-agent-configs.js`
- `cahier-des-charge/scripts/migration-watcher.js`
- `reports/legacy-cleanup/files-to-delete-20250420-022736.txt`
- `structure/backup-obsolete-files-20250422-002328/agent-import-mapping.json.bak`
- `structure/backup-obsolete-files-20250422-002328/clean_file_lissqt.txt`
- `structure/backup-obsolete-files-20250422-002328/clean_file_list.txt`
- `structure/backup-obsolete-files-20250422-002328/clean_file_liste.txt`
- `structure/backup-obsolete-files-20250422-002328/tsconfig.json.bak`
- `structure/backup-obsolete-files-20250422-002328/cahier-des-charge/cahier-des-charges-lecture-optimisee.html`
- `structure/backup-obsolete-files-20250422-002328/cahier-des-charge/vue-complete-auto.html`
- `structure/backup-obsolete-files-20250422-002328/cahier-des-charge/vue-complete.html`
- `structure/backup-obsolete-files-20250422-002328/examples/nginx.conf`
- `structure/backup-obsolete-files-20250422-002328/logs/tests-20250420-031131.log`

## À Surveiller : Fichiers à Faible Confiance (Top 20)

Fichiers dont la classification est incertaine (niveau de confiance < 0.5) :




## Améliorations par Analyse Contextuelle

Fichiers dont la classification a été améliorée par analyse de voisinage :

- `ARCHITECTURE.md`: layer: unknown -> shared
- `adapt-agents.ts`: domain: unknown -> core
- `agent-migration-report-20250418-175114.md`: layer: unknown -> shared
- `agent-migration-report-20250418-175257.md`: layer: unknown -> shared
- `agent-statistics-report.md`: layer: unknown -> shared
- `backlog.json`: domain: unknown -> integration
- `backlog.mcp.json`: domain: unknown -> integration
- `biome.json`: domain: unknown -> integration
- `clickable_file_list.txt`: layer: unknown -> shared
- `clickable_list.txt`: layer: unknown -> shared
- `complete-migration-verification-20250420-015853.md`: layer: unknown -> shared
- `discovery_map.json`: domain: unknown -> integration
- `fix-agent-typescript-errors.ts`: domain: unknown -> core
- `generate-agent-manifest.ts`: domain: unknown -> core
- `index.ts`: domain: unknown -> core
- `migration-config.json`: layer: unknown -> shared
- `migration-report.json`: layer: unknown -> shared
- `migration-results-2025-04-10T22-42-27-339Z.json`: layer: unknown -> shared
- `migration-results-2025-04-10T23-01-27-662Z.json`: layer: unknown -> shared
- `migration-results-2025-04-10T23-02-53-998Z.json`: layer: unknown -> shared

