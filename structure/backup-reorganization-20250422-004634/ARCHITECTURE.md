# Architecture MCP: Pipeline vs Application

## Clarification de l'architecture à trois couches

Ce document explique la séparation fondamentale entre le **pipeline MCP** (système d'orchestration, d'analyse et de génération) et l'**application cible** (site ou API finale déployée).

## 🔄 Diagramme de Flux Pipeline-Application

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                    PIPELINE MCP (USINE)                       │
│                                                               │
├───────────┬─────────────────────────────┬───────────────┬─────┤
│           │                             │               │     │
│           ▼                             ▼               ▼     │
│   ┌─────────────┐               ┌─────────────┐  ┌────────────┐
│   │  Analyse    │               │ Génération  │  │  Validation│
│   │ php-analyzer│──────────────▶│remix-generator│─▶│qa-analyzer│
│   │mysql-analyzer│               │nestjs-generator│  │seo-checker│
│   └─────────────┘               └─────────────┘  └────────────┘
│           │                             │               │     │
│           │                             │               │     │
└───────────┼─────────────────────────────┼───────────────┼─────┘
            │                             │               │      
            │                             │               │      
┌───────────┼─────────────────────────────┼───────────────┼─────┐
│           │                             │               │     │
│           ▼                             ▼               ▼     │
│   ┌─────────────┐               ┌─────────────┐   ┌───────────┐
│   │             │               │             │   │           │
│   │  apps/      │               │  apps/      │   │ Déploiement│
│   │  backend/   │               │  frontend/  │   │           │
│   │             │               │             │   │           │
│   └─────────────┘               └─────────────┘   └───────────┘
│                                                               │
│                  APPLICATION CIBLE (PRODUIT)                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘

      ┌───────────┐                            ┌───────────┐
      │ Orchestration │                            │ Monitoring │
      │   Temporal  │◄──────────────────────────▶│  Langfuse  │
      │    n8n     │                            │  Dashboard │
      └───────────┘                            └───────────┘
```

## ⚙️ 1. Le Pipeline MCP: L'Usine Intelligente

> 🧠 **Le cerveau et le système d'usine automatisée** du projet.

### 📌 Rôle du Pipeline

- **Analyser** des fichiers source legacy (PHP) pour en extraire la logique métier
- **Transformer** le code existant vers des technologies modernes
- **Générer** automatiquement des fichiers valides (.ts, .tsx, .prisma, .meta.ts, etc.)
- **Vérifier** la conformité du code aux règles établies (style, typage, routes, SEO, etc.)
- **Superviser** l'état global via status.json, MCPManifest.json, dashboards
- **Orchestrer** les agents IA travaillant en parallèle

### 🛠️ Composants du Pipeline

| Composant | Fonction |
|-----------|----------|
| `agents/` | Analyseurs, générateurs, validateurs et orchestrateurs |
| `n8n/`, `Temporal/` | Déclenchement automatisé des jobs |
| `scripts/`, `start_pipeline` | Déclenchement manuel ou automatique des étapes |
| `status.json`, `audit/` | Traçage, états, logs, audits automatiques |
| `ci.yml`, lint, biome | Validation de la qualité à chaque PR |
| `dashboards/`, Langfuse | Interface de suivi (SEO, migration, erreurs) |
| `integration/orchestrator-bridge.ts` | Pont entre Temporal, BullMQ et n8n |

### 📊 Architecture à Trois Couches du Pipeline

1. **Couche de Coordination**
   - Orchestrateurs (via Temporal, n8n)
   - Gestion des retry et erreurs
   - Validation globale du pipeline

2. **Couche Business**
   - Agents d'analyse (php-analyzer, mysql-analyzer)
   - Agents de génération (code-generator, remix-generator)
   - Agents de validation (qa-analyzer, seo-checker)

3. **Couche Adapters**
   - Intégration avec n8n, GitHub, Supabase
   - Connexions BullMQ, Redis
   - Webhook adapters

## 🚀 2. L'Application Cible: Le Produit Final

> 🧩 **Le produit que les utilisateurs verront** ou que les APIs exposeront.

### 📌 Rôle de l'Application

- **Servir** le site web moderne (Remix), l'API REST (NestJS), ou le dashboard d'administration
- **Gérer** l'authentification, les sessions, le SEO, les composants UI
- **Implémenter** les interactions entre frontend et backend

### 🛠️ Structure de l'Application

| Dossier / Module | Contenu |
|------------------|---------|
| `apps/frontend/` | Application Remix, routes, composants UI, loaders, méta-données |
| `apps/backend/` | Modules NestJS, services, contrôleurs, auth |
| `prisma/` | Modèles de données typés pour PostgreSQL/Supabase |
| `docker-compose.yml` | Services de base (Redis, Postgres, Supabase) |
| `public/`, `tailwind.config` | Styles et ressources statiques |
| `apps/admin-dashboard/` | Interface pour suivre la migration et les jobs MCP |

## 🔁 Relation entre Pipeline et Application

> **Important**: Le pipeline MCP ≠ Application cible

| Pipeline MCP (👷‍♂️ usine IA) | Application cible (🏁 résultat final) |
|----------------------------|-------------------------------------|
| Génère des modules et composants | Consomme ces modules dans une interface réelle |
| Vérifie la conformité des fichiers | Utilise uniquement les fichiers validés |
| Supervise le progrès de migration | N'est JAMAIS modifiée directement à la main |
| Transforme des fichiers via agents | Sert aux utilisateurs finaux |
| S'exécute via GitHub Actions, n8n | Est déployée dans Docker, Coolify, Cloud Run |

## 🧠 Analogie Conceptuelle

```
Pipeline MCP = Usine automobile
Application = Voiture finie prête à être conduite
```

Comme on ne modifie pas une voiture dans une concession (on la fabrique en usine), 
on ne modifie pas `apps/frontend/` à la main: on déclenche le pipeline pour le (re)générer proprement.

## ✅ Bonnes Pratiques vs Mauvaises Pratiques

| ❌ Mauvaise pratique | ✅ Bonne pratique avec séparation claire |
|--------------------|----------------------------------------|
| Modifier `apps/frontend/fiche.tsx` manuellement | Déclencher `remix-generator` via le pipeline |
| Corriger des erreurs dans `apps/backend/` manuellement | Utiliser `nestjs-generator` ou `qa-analyzer` |
| Ajouter des routes Remix à la main | Passer par `routes-map.json` + `remix-route-generator.ts` |
| Réécrire des fichiers PHP en TypeScript manuellement | Laisser `php-analyzer` faire le mapping |

## 📈 Flux de Migration Typique

1. Fichier PHP détecté pour migration (dans `/apps/backend/src/pages/`)
2. Pipeline MCP analyse le fichier via `php-analyzer`
3. Génération du code TypeScript et composants React via `remix-generator`
4. Vérification de la qualité, des règles SEO via `qa-analyzer` et `seo-checker`
5. Approbation et création automatique d'une PR GitHub
6. Après validation, intégration dans l'application cible (`apps/frontend/`)
7. Mise à jour du `MCPManifest.json` avec le statut de la migration

## 🚦 Statuts de Migration dans MCPManifest.json

- **planned**: Migration programmée
- **in_progress**: Analyse et génération en cours
- **completed**: Migration terminée et validée
- **failed**: Échec nécessitant une intervention

## 🔐 Points Clés à Retenir

- ✅ Le pipeline MCP transforme intelligemment l'existant
- ✅ L'application cible ne doit JAMAIS être modifiée directement
- ✅ La migration se fait uniquement via les agents et workflows
- ✅ Le projet est une chaîne de transformation industrialisée avec versioning, validation et contrôle qualité

## 🔄 Comment Déclencher une Transformation

```bash
# Pour démarrer une migration complète
./start_pipeline.sh --full

# Pour analyser un fichier PHP spécifique
./start_pipeline.sh --analyze-file=apps/backend/src/pages/contact.php

# Pour régénérer une route Remix spécifique
./start_pipeline.sh --generate-route=/contact

# Pour vérifier la qualité d'un fichier migré
./start_pipeline.sh --validate=apps/frontend/app/routes/contact.tsx
```

## 📚 Exemples Concrets du Pipeline en Action

### Exemple 1: Migration d'une page PHP vers Remix

#### Source (PHP Legacy)
```php
<?php
// Source: /apps/backend/src/pages/fiche.php
require_once('../includes/config.php');
require_once('../includes/db.php');

// Récupération de l'ID depuis l'URL
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    header('Location: /liste.php');
    exit;
}

// Récupération des données depuis MySQL
$query = "SELECT * FROM fiches WHERE id = $id AND statut = 1";
$result = mysqli_query($conn, $query);
$fiche = mysqli_fetch_assoc($result);

if (!$fiche) {
    header('HTTP/1.0 404 Not Found');
    include('../includes/404.php');
    exit;
}

// Traitement des données pour l'affichage
$titre = htmlspecialchars($fiche['titre']);
$description = nl2br(htmlspecialchars($fiche['description']));
$date = date('d/m/Y', strtotime($fiche['date_creation']));

// Inclusion du header
include('../includes/header.php');
?>

<div class="fiche-container">
    <h1><?php echo $titre; ?></h1>
    <div class="fiche-meta">Publié le <?php echo $date; ?></div>
    <div class="fiche-content">
        <?php echo $description; ?>
    </div>
    <a href="/liste.php" class="btn-retour">Retour à la liste</a>
</div>

<?php
// Inclusion du footer
include('../includes/footer.php');
?>
```

#### Transformation via Pipeline MCP

1. **Analyse par php-analyzer**
```bash
./start_pipeline.sh --analyze-file=apps/backend/src/pages/fiche.php
```

L'agent `php-analyzer` produit un fichier de mapping au format JSON:

```json
{
  "sourceFile": "/apps/backend/src/pages/fiche.php",
  "routePattern": "/fiche",
  "params": [
    {
      "name": "id",
      "type": "number",
      "required": true
    }
  ],
  "dataModel": {
    "tableName": "fiches",
    "fields": [
      {"name": "id", "type": "number", "primary": true},
      {"name": "titre", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "date_creation", "type": "datetime"},
      {"name": "statut", "type": "number"}
    ]
  },
  "redirects": [
    {"condition": "id <= 0", "destination": "/liste"}
  ],
  "errorHandling": {
    "404": "!fiche"
  },
  "dependencies": [
    "config.php", "db.php", "header.php", "footer.php"
  ]
}
```

2. **Génération par remix-generator**
```bash
./start_pipeline.sh --generate-route=/fiche
```

3. **Vérification par qa-analyzer et seo-checker**
```bash
./start_pipeline.sh --validate=apps/frontend/app/routes/fiche.tsx
```

#### Résultat (Remix Moderne)

Le pipeline produit plusieurs fichiers:

**apps/frontend/app/routes/fiche.tsx**:
```tsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Link } from '@remix-run/react';
import { formatDate } from '~/utils/date';
import type { Fiche } from '~/types';
import { ErrorBoundary } from '~/components/ErrorBoundary';
import { loader } from './fiche.loader';
import { meta } from './fiche.meta';

export { loader, meta };

export default function FichePage() {
  const { fiche } = useLoaderData<typeof loader>();
  
  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800">{fiche.titre}</h1>
        <div className="text-sm text-gray-500 mt-2">
          Publié le {formatDate(fiche.date_creation)}
        </div>
        <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: fiche.description }} />
        <div className="mt-8">
          <Link to="/liste" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Retour à la liste
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <ErrorBoundary
      statusHandlers={{
        404: () => (
          <div className="error-container">
            <h1>Fiche introuvable</h1>
            <p>La fiche que vous recherchez n'existe pas ou a été supprimée.</p>
            <Link to="/liste">Retour à la liste</Link>
          </div>
        ),
      }}
    />
  );
}
```

**apps/frontend/app/routes/fiche.loader.ts**:
```ts
import { json, redirect } from '@remix-run/node';
import { prisma } from '~/db.server';
import type { LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = Number(params.id);
  
  if (isNaN(id) || id <= 0) {
    return redirect('/liste');
  }
  
  const fiche = await prisma.fiche.findFirst({
    where: {
      id,
      statut: 1
    }
  });
  
  if (!fiche) {
    throw new Response('Fiche non trouvée', {
      status: 404,
    });
  }
  
  return json({ fiche });
}
```

**apps/frontend/app/routes/fiche.meta.ts**:
```ts
import type { MetaFunction } from '@remix-run/node';
import type { loader } from './fiche.loader';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.fiche) {
    return [
      { title: 'Fiche introuvable' },
      { name: 'description', content: 'La fiche demandée n\'existe pas' }
    ];
  }
  
  const { fiche } = data;
  
  return [
    { title: `${fiche.titre} - Mon Site` },
    { name: 'description', content: fiche.description.substring(0, 160) },
    { property: 'og:title', content: fiche.titre },
    { property: 'og:description', content: fiche.description.substring(0, 160) },
    { property: 'og:type', content: 'article' },
    { property: 'article:published_time', content: fiche.date_creation }
  ];
};
```

### Exemple 2: Structure du Monorepo et Répartition Pipeline/Application

```
monorepo/
├── apps/                      # APPLICATION CIBLE
│   ├── frontend/              # Remix app
│   │   ├── app/
│   │   │   ├── routes/        # Routes générées par le pipeline
│   │   │   ├── components/    # Composants générés par le pipeline
│   │   │   └── ...
│   │   └── ...
│   ├── backend/               # NestJS app
│   │   ├── src/
│   │   │   ├── modules/       # Modules générés par le pipeline
│   │   │   ├── controllers/   # Controllers générés par le pipeline
│   │   │   └── ...
│   │   └── ...
│   └── admin-dashboard/       # Administration
├── pipeline/                  # PIPELINE MCP
│   ├── agents/                # Tous les agents IA
│   │   ├── php-analyzer/
│   │   ├── remix-generator/
│   │   └── ...
│   ├── n8n/                   # Workflows n8n
│   │   ├── php-analyzer.json
│   │   └── ...
│   ├── temporal/              # Workflows Temporal
│   └── scripts/               # Scripts de pilotage
└── package.json               # Configuration Nx monorepo
```

### Exemple 3: Cycle de Vie d'une Migration Typique

Voici un exemple réel basé sur le fichier `MCPManifest.json` de votre projet:

1. **Planification**: Migration ajoutée au `MCPManifest.json` avec statut "planned"
   ```json
   {
     "id": "MIG-003",
     "sourceFile": "/apps/backend/src/pages/contact.php",
     "targetFiles": {
       "component": "/apps/frontend/app/routes/contact.tsx",
       "loader": "/apps/frontend/app/routes/contact.loader.ts",
       "action": "/apps/frontend/app/routes/contact.action.ts",
       "meta": "/apps/frontend/app/routes/contact.meta.ts",
       "schema": "/apps/frontend/app/schemas/contact.schema.ts"
     },
     "status": "planned",
     "route": "/contact",
     "tags": ["form", "interactive"],
     "createdAt": "2025-04-13T11:45:00.000Z",
     "scheduledFor": "2025-04-16T10:00:00.000Z",
     "priority": "medium"
   }
   ```

2. **Orchestration**: Le workflow n8n `php-analyzer-trigger` détecte la migration planifiée et déclenche l'analyse

3. **Analyse**: L'agent `php-analyzer` produit une analyse structurée du fichier `contact.php`

4. **Génération**: Les agents de génération créent tous les fichiers nécessaires dans l'application cible

5. **Validation**: Les agents de qualité (`qa-analyzer`, `seo-checker`) vérifient les fichiers générés

6. **PR Automatique**: Une PR est créée via GitHub avec les changements

7. **Mise à jour du statut**: Le statut de la migration passe à "completed" après la fusion de la PR
   ```json
   {
     "id": "MIG-003",
     "status": "completed",
     "completedAt": "2025-04-16T14:22:18.000Z",
     "prUrl": "https://github.com/your-organization/monorepo/pull/145",
     "verificationSteps": [
       {
         "name": "qa-analyzer",
         "status": "passed",
         "score": 96
       },
       {
         "name": "seo-analyzer",
         "status": "passed",
         "score": 97
       },
       {
         "name": "typescript-check",
         "status": "passed"
       }
     ]
   }
   ```

## 🔄 Intégration Continue et Déploiement

Dans notre architecture MCP, l'intégration et le déploiement suivent ce flux:

1. Les changements sont générés par le pipeline MCP et proposés via PR
2. Les GitHub Actions vérifient le code généré (tests, lint, build)
3. Après approbation, les changements sont fusionnés dans la branche principale
4. Une nouvelle GitHub Action déclenche le déploiement de l'application cible

```yml
# Extrait de .github/workflows/deploy-application.yml
name: Deploy Application

on:
  push:
    branches:
      - main
    paths:
      - 'apps/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      # ... étapes de build ...
      
      - name: Deploy
        uses: some-cloud-deploy-action@v1
        with:
          app_path: './apps'
          token: ${{ secrets.DEPLOY_TOKEN }}
```

Ce workflow ne s'exécute que lorsque les fichiers de l'application cible (`apps/**`) sont modifiés, et non pas lorsque seuls les fichiers du pipeline sont changés.

## 📊 Agents MCP Validés
## 📊 Agents MCP Validés

Dernière validation: 2025-04-21

Les agents suivants ont été automatiquement vérifiés et corrigés pour assurer la conformité TypeScript:

| Type d'agent | Nom | Interface | Couche | Statut |
|-------------|-----|-----------|--------|--------|
| Analyzer | MysqlAnalyzer | AnalyzerAgent | Business | ✅ Corrigé |
| Analyzer | PhpAnalyzer | AnalyzerAgent | Business | ✅ Corrigé |
| Analyzer | SqlAnalyzer | AnalyzerAgent | Business | ✅ Corrigé |
| Analyzer | DataAnalyzer | AnalyzerAgent | Business | ✅ Corrigé |
| Analyzer | DependencyAnalyzer | AnalyzerAgent | Business | ✅ Corrigé |
| Analyzer | QaAnalyzer | AnalyzerAgent | Business | ✅ Corrigé |
| Analyzer | StructureAnalyzer | AnalyzerAgent | Business | ✅ Corrigé |
| Generator | SeoMeta | GeneratorAgent | Business | ✅ Corrigé |
| Orchestrator | McpVerifier | OrchestratorAgent | Coordination | ✅ Corrigé |
| Parser | HtaccessParser | ConfigParser | Business | ✅ Corrigé |
| Orchestrator | OrchestratorBridge | Bridge | Coordination | ✅ Corrigé |
| Server | McpServer | ServerAdapter | Adapters | ✅ Corrigé |



## 🔄 Intégrité du Pipeline MCP

Dernière validation: 2025-04-21

La validation TypeScript garantit que tous les composants du pipeline MCP respectent les interfaces définies dans l'architecture à trois couches. Cette validation est essentielle pour assurer la cohérence entre :

1. Le **code généré** par les agents
2. Les **interfaces** définies dans l'architecture
3. La **documentation** du projet

Le système de CI/CD vérifie cette cohérence à chaque modification pour maintenir l'intégrité du pipeline.

## 🔍 Validation du code TypeScript

Pour maintenir la qualité du code et éviter les erreurs TypeScript, un système de validation automatique a été mis en place.

### Outils de validation

- **TypeScript** : Vérification statique des types
- **ESLint** : Analyse statique pour détecter les problèmes de code
- **Hooks Git** : Validation automatique avant commit

### Règles appliquées

- Nommage standardisé des agents (CamelCase)
- Implémentation correcte des interfaces
- Pas de caractères spéciaux dans les noms de fichiers
- Conventions d'import rigoureuses

### Commandes disponibles

- `npm run type-check` : Vérification des types uniquement
- `npm run lint` : Vérification des règles ESLint
- `npm run lint:fix` : Correction automatique des problèmes ESLint
- `npm run validate` : Exécution de toutes les vérifications

### Intégration CI/CD

Le script `ci-validate.sh` est exécuté automatiquement dans le pipeline CI pour s'assurer que tout le code respecte les normes définies.

