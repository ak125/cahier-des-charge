# Analyse de qualité et sécurité

Ce document présente le module d'analyse de qualité et de sécurité utilisé dans le cadre de la migration PHP vers NestJS/Remix.

## Objectifs de l'analyse

L'analyse de qualité et sécurité vise à:
- Identifier les comportements dynamiques complexes du code PHP
- Évaluer la complexité technique du code source
- Détecter les vulnérabilités de sécurité potentielles
- Générer des recommandations adaptées pour la migration
- Prioriser les fichiers selon leur niveau de risque

## Composants du module

### 1. Agent d'analyse des risques de sécurité

L'agent principal d'analyse (`analyze-security-risks.ts`) réalise une évaluation complète d'un fichier PHP:

- **Détection des comportements dynamiques**: Conditions, switches et logique basée sur les entrées utilisateur
- **Analyse de complexité**: Profondeur des conditions, fonctions imbriquées, etc.
- **Détection des vulnérabilités**: Injections SQL, XSS, inclusions de fichiers, etc.
- **Scoring**: Calcul de scores de qualité et sécurité sur une échelle de 0 à 10

### 2. Intégration GitHub Actions

Un workflow GitHub Actions (`security-checks.yml`) permet d'intégrer l'analyse de sécurité dans le CI/CD:

- Analyse automatique des fichiers PHP modifiés lors des pull requests
- Blocage des PRs si le score moyen de sécurité est inférieur à 5/10
- Commentaires automatiques sur les lignes problématiques

### 3. Dashboard de sécurité

Un tableau de bord accessible via `/audit/security` dans l'application Remix fournit:

- Vue d'ensemble des scores de sécurité pour tous les fichiers
- Graphiques d'évolution des scores au fil du temps
- Filtrage par type de vulnérabilité ou niveau de risque

## Types de vulnérabilités détectées

L'agent détecte plusieurs catégories de vulnérabilités:

| Type | Description | Gravité |
|------|-------------|---------|
| SQL Injection | Requêtes SQL non préparées avec des données utilisateur | 🔴 Critique |
| XSS | Sortie de données utilisateur sans échappement | 🔴 Critique |
| File Inclusion | Inclusion de fichiers basée sur des entrées utilisateur | 🔴 Critique |
| Header Injection | En-têtes HTTP construits avec des données utilisateur | ⚠️ Moyen |
| CSRF | Formulaires sans protection contre les attaques CSRF | ⚠️ Moyen |
| Code Injection | Utilisation de `eval()` avec des données dynamiques | 🔴 Critique |

## Métriques de complexité

L'agent évalue la complexité technique selon ces métriques:

| Métrique | Description | Seuil critique |
|----------|-------------|----------------|
| Profondeur max if | Niveau maximal de conditions imbriquées | > 3 |
| Fonctions imbriquées | Nombre de définitions de fonctions imbriquées | > 2 |
| Instructions dans la racine | Code exécuté directement (hors fonctions) | > 30 |
| Duplication détectée | Blocs de code dupliqués | > 1 |

## Sorties générées

Pour chaque fichier analysé, l'agent génère:

1. **Section d'audit**: Intégrée au fichier `.audit.md`
2. **Score de risque**: Fichier `.risk_score.json` contenant les scores détaillés
3. **Plan de correction**: Fichier `.security_patch_plan.md` avec des recommandations précises

### Exemple de fichier risk_score.json
```json
{
  "file": "fiche_produit.php",
  "timestamp": "2025-04-09T22:25:14.123Z",
  "scores": {
    "security": 3.2,
    "quality": 4.5,
    "overall": 3.7
  },
  "metrics": {
    "securityVulnerabilities": 3,
    "dynamicBehaviors": 5,
    "complexityIssues": 2
  },
  "migrationPriority": "high"
}
```

## Utilisation de l'agent

L'agent peut être utilisé de plusieurs façons:

1. **Manuellement** pour analyser un fichier spécifique:
   ```bash
   node agents/analyze-security-risks.ts /path/to/file.php
   ```

2. **Intégré dans l'agent d'audit** principal pour générer des audits complets

3. **Via le CI/CD** pour des vérifications automatiques lors des pull requests

4. **Dans le pipeline n8n** pour automatiser l'analyse de l'ensemble de la codebase

## Priorisation de la migration

Les fichiers sont priorisés pour la migration selon leur score de risque:

- **Score < 5**: Priorité haute - Migration urgente
- **Score 5-7**: Priorité moyenne - Migration planifiée
- **Score > 7**: Priorité basse - Migration standard

Cette priorisation permet d'allouer les ressources de développement aux composants les plus critiques en premier.
```

## Plan d'implémentation pour le tableau de bord Remix

```markdown
// filepath: /workspaces/cahier-des-charge/cahier-des-charges/docs/dashboard-securite.md
# Tableau de bord de sécurité - Plan d'implémentation

Ce document détaille l'implémentation du tableau de bord de sécurité dans l'application Remix pour visualiser et gérer les risques identifiés durant la migration.

## Architecture

Le tableau de bord de sécurité sera implémenté comme une route Remix dans le nouveau projet:

```
/app/routes/audit/security.tsx (Vue principale)
/app/routes/audit/security.$fileId.tsx (Détails par fichier)
/app/routes/audit/security.metrics.tsx (Métriques globales)
/app/routes/audit/security.trends.tsx (Tendances et évolution)
