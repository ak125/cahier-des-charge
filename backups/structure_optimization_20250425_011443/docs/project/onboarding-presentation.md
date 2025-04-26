# Présentation d'Onboarding : Architecture MCP

## Introduction pour les nouveaux développeurs

---

## Bienvenue dans le projet de migration PHP → Remix/NestJS !

Ce document vous aidera à comprendre rapidement l'architecture unique de notre projet et les bonnes pratiques à suivre.

---

## Les deux mondes de notre architecture

```
┌─────────────────────────┐      ┌─────────────────────────┐
│                         │      │                         │
│                         │      │                         │
│     PIPELINE MCP        │─────▶│    APPLICATION CIBLE    │
│                         │      │                         │
│     (L'USINE)           │      │     (LE PRODUIT)        │
│                         │      │                         │
└─────────────────────────┘      └─────────────────────────┘
```

---

## 1. Le Pipeline MCP : "L'Usine"

- Analyse le code PHP legacy
- Génère automatiquement du code moderne
- Valide la qualité et le SEO
- Crée des PRs GitHub automatiques

### 🔑 Composants principaux :
- Agents IA (php-analyzer, remix-generator, etc.)
- Workflows (n8n, Temporal)
- Validateurs (qualité, SEO, performances)

---

## 2. L'Application : "Le Produit Final"

- Site Remix + API NestJS
- Déployée et accessible aux utilisateurs
- Code généré par le Pipeline MCP
- Structure organisée (routes, components, services)

### 🔑 Structure typique :
- `apps/frontend` : Application Remix
- `apps/backend` : API NestJS
- `prisma` : Modèles de données

---

## 🚨 Règle d'or #1

```
NE MODIFIEZ JAMAIS L'APPLICATION DIRECTEMENT
```

Tout changement doit passer par le Pipeline MCP !

---

## 🚨 Règle d'or #2

```
COMPRENEZ LES DEUX RESPONSABILITÉS
```

- Le Pipeline = "Comment on fabrique"
- L'Application = "Ce qu'on fabrique"

---

## Workflow typique pour un développeur

1. Identifier un besoin de modification/migration
2. Déclencher le pipeline approprié
3. Vérifier les résultats générés
4. Valider la PR créée automatiquement
5. Surveiller le déploiement

```bash
# Commande typique pour lancer le pipeline
./start_pipeline.sh --analyze-file=apps/backend/src/pages/ma-page.php
```

---

## Visualisation du flux de travail

```
1. [LEGACY PHP] ──▶ 2. [PIPELINE MCP] ──▶ 3. [CODE REMIX/NESTJS] ──▶ 4. [PR GITHUB] ──▶ 5. [DÉPLOIEMENT]
   fiche.php         php-analyzer           fiche.tsx             validation        application
                      remix-generator       fiche.loader.ts       merge             en production
                      qa-analyzer          fiche.meta.ts
```

---

## Quand intervenir manuellement ?

✅ Améliorer les générateurs du pipeline
✅ Créer de nouveaux agents d'analyse
✅ Ajouter des règles de validation
✅ Configurer de nouveaux workflows n8n

❌ Modifier directement le code dans `apps/frontend`
❌ Corriger manuellement les bugs dans `apps/backend`
❌ Ajouter des routes ou composants à la main

---

## Architecture à 3 couches du Pipeline

```
┌───────────────────────────────────────────────────────────┐
│                  COUCHE COORDINATION                      │
│ (orchestration, workflows, communication entre agents)    │
├───────────────────────────────────────────────────────────┤
│                   COUCHE BUSINESS                         │
│ (analyse PHP, génération Remix, validation qualité)       │
├───────────────────────────────────────────────────────────┤
│                   COUCHE ADAPTERS                         │
│ (GitHub, n8n, Supabase, Redis, etc.)                      │
└───────────────────────────────────────────────────────────┘
```

---

## Cycle de vie d'une migration

1. **Planification** : Ajout dans MCPManifest.json
2. **Analyse** : Extraction de la logique depuis PHP
3. **Génération** : Création du code Remix/NestJS
4. **Validation** : Vérifications qualité et SEO
5. **Intégration** : Création de PR GitHub
6. **Suivi** : Mise à jour du statut dans MCPManifest.json

---

## Outils et tableaux de bord

- **Dashboard** : Suivi des migrations et statuts
- **MCPManifest.json** : Source de vérité des migrations
- **Langfuse** : Monitoring des agents IA
- **GitHub** : Pull Requests et validation de code

---

## Conseils pour bien démarrer

1. Parcourez le document [ARCHITECTURE.md](./ARCHITECTURE.md) complet
2. Étudiez quelques exemples de migrations réussies
3. Familiarisez-vous avec les commandes du pipeline
4. Consultez les tableaux de bord pour comprendre l'état actuel
5. Observez d'abord, agissez ensuite !

---

## Des questions ?

- Architecture MCP : `architecture.md`
- Documentation technique : `/docs`
- Tableaux de bord : `http://localhost:3000/dashboard`
- Canal Slack : `#migration-php-remix`

### Contact équipe technique :
- Jean Dupont (Architecte principal)
- Marie Martin (Leader technique)