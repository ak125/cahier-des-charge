# Agents d'analyse automatisée du cahier des charges

Ce document décrit les différents agents d'analyse utilisés pour générer et maintenir le cahier des charges de migration PHP vers NestJS/Remix.

## Agents disponibles

### 1. Agent Structure

L'agent structure (`agent-structure.ts`) analyse la structure logique des fichiers PHP:
- Détection des fonctions et leur complexité
- Analyse des inclusions et dépendances
- Évaluation de la qualité du code
- Calcul d'un score de structure global

### 2. Agent Données

L'agent données (`agent-donnees.ts`) analyse les flux de données dans les fichiers PHP:

#### Fonctionnalités

- **Sources d'entrée**: Détecte automatiquement les entrées (`$_GET`, `$_POST`, `$_SESSION`, etc.)
- **Flux de sortie**: Identifie les types de sortie (HTML, JSON, redirections, etc.)
- **Requêtes SQL**: Analyse les requêtes SQL, leur type et leur complexité
- **Score SQL**: Évalue la qualité des requêtes SQL sur une échelle de 0 à 3
- **Détection de sortie mixte**: Alerte sur les sorties mixtes (HTML + JSON)

#### Formats de sortie

L'agent génère:
1. Une section formatée pour les fichiers `.audit.md`
2. Des mises à jour pour les fichiers `.backlog.json` avec de nouvelles tâches
3. Des graphes d'impact SQL (`.sql_access_map.json`)

#### Tâches déclenchées automatiquement

En fonction de l'analyse, l'agent ajoute les tâches suivantes au backlog:
- `refactorEntrypoints`: Refactoriser les entrées de données
- `sanitizeSessionAccess`: Sécuriser l'accès aux données de session
- `migrateSQLtoPrisma`: Migrer les requêtes SQL vers Prisma
- `separateOutputs`: Séparer les sorties HTML et API

### 3. Agent Routes

L'agent routes (`agent-routes.ts`) analyse les structures d'URL et de routage:
- Extraction des routes définies
- Proposition de routes Remix équivalentes
- Identification des contrôleurs NestJS nécessaires

## Intégration dans le pipeline

Les agents sont exécutés séquentiellement lors de l'analyse d'un fichier PHP:

1. Analyse du rôle métier et de la fonction principale
2. Analyse de la structure technique
3. Analyse des flux de données
4. Proposition de modèles de données et DTOs
5. Génération des tâches de migration

## Utilisation

Pour analyser un fichier PHP avec l'agent données:

```bash
node agents/agent-donnees.ts /chemin/vers/fichier.php
```

Cette commande génère:
- Une section "Données" à intégrer dans le fichier .audit.md
- Met à jour le fichier .backlog.json associé avec les nouvelles tâches
- Crée un fichier .sql_access_map.json si des requêtes SQL sont détectées

## Exemple de sortie

L'agent données génère une section Markdown structurée:

```markdown
## 3. Données

### 3.1. Sources d'entrée
- $_GET['id']
- $_POST['email']
- $_SESSION['user']
- $_COOKIE['auth']
> Fichier lit des données d'authentification via SESSION et gère des paramètres URL/POST.

### 3.2. Sorties produites
- HTML (template inline)
- JSON (via `echo json_encode(...)`)
- Redirection (header)
- Headers personnalisés (`Set-Cookie`, `Content-Type`)

> ⚠️ Sortie mixte HTML + JSON → séparation à prévoir dans la migration

### 3.3. Requêtes SQL
| Requête | Type | Tables | Complexité |
|--------|------|--------|------------|
| `SELECT * FROM pieces WHERE id = ?` | Read | pieces | Simple |
| `INSERT INTO commandes (...)` | Create | commandes | Moyenne |
| `UPDATE stock SET qte = ...` | Update | stock | Moyenne |
| `SELECT ... JOIN clients ...` | Read | clients, commandes | ⚠️ Complexe (jointure) |

> 🔍 Analyse SQL brute : **2.1 / 3** — optimisations possibles via Prisma
```
