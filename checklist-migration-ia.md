# ✅ Checklist d'avant lancement – Migration IA sécurisée

🎯 Objectif : Avant d'appuyer sur "GO", garantir la **précision**, **traçabilité**, **auditabilité** et un **retour arrière possible à tout moment**.

---

## 🔒 1. Geler une copie du code legacy PHP et SQL (immuable)

| Action                          | Objectif |
|---------------------------------|----------|
| Créer un tag Git `legacy-php-vFinal`       | Avoir un point de retour sûr |
| Sauvegarder `mysql.sql` horodaté (`YYYYMMDD`) | Référence absolue pour `schema_migration_diff.json` |
| Archiver le fichier `.htaccess` original   | Reproduire les routes + règles SEO à l'identique |
| Archiver tous les scripts `core/*.php`     | Permet la comparaison avec les blocs migrés |
| Générer le hash SHA256 du dossier legacy   | Vérification d'intégrité (via `audit.md`) |

---

## 📦 2. Geler la structure cible (NestJS + Remix + Prisma)

| Action | Objectif |
|--------|----------|
| Snapshot de la branche `main` NestJS/Remix | Base de comparaison pour `schema_migration_diff.json` |
| Export du `schema.prisma` initial | Base pour l'évolution vers PostgreSQL |
| Génération d'un `structure_index.json` | Permet le mapping entre legacy et modules modernes |

---

## 🧠 3. Préparer le socle IA d'analyse et de migration

| Action | Objectif |
|--------|----------|
| Lancer `start_analysis.sh` (PhpMetrics, MCP, etc.) | Audit du code legacy |
| Générer les fichiers `.audit.md`, `.impact_graph.json` | Identifier les modules critiques |
| Valider les dépendances IA locales (DeepSeek, n8n) | Vérifier que tous les agents sont opérationnels |
| Lancer une PR de préparation de migration | Crée un point d'entrée dans le GitOps |
| Archiver toutes les entrées critiques dans `backlog.md` | Structurer la feuille de route IA |

---

## 📁 4. Checklist bonus sécurité

- [ ] ✅ Tous les fichiers legacy sont archivés dans `/archives/legacy/`
- [ ] ✅ Une PR a été créée pour le verrouillage initial
- [ ] ✅ Les clés d'accès (BDD, Supabase, IA) sont hors du dépôt Git
- [ ] ✅ Un fichier `changelog.md` a été initialisé
- [ ] ✅ Le dashboard Remix `/admin/dashboard` peut afficher le statut

---

💡 Cette checklist peut être intégrée dans le pipeline `n8n` via un agent `pre-migration-verifier.ts`  
Elle peut également déclencher une **vérification automatique** à chaque modification du legacy.
