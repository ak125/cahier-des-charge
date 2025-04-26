# Configuration des vérifications de fiabilité

Ce document définit les paramètres de vérification de fiabilité pour le cahier des charges.

## Critères de vérification des sections

```json
{
  "min_section_words": 300,
  "min_subsections": 3,
  "required_sections": [
    "introduction",
    "exigences-fonctionnelles",
    "specifications-techniques",
    "architecture-ia",
    "plan-migration",
    "seo-compatibilite",
    "suivi-evolution",
    "historique-tracabilite"
  ]
}
```

## Modules critiques nécessitant une documentation approfondie

```json
{
  "critical_modules": [
    "authentification",
    "autorisation",
    "paiement",
    "gestion-utilisateurs",
    "migration-base-donnees",
    "seo",
    "routes-api"
  ]
}
```

## Termes techniques à usage standardisé

Ces termes doivent être utilisés de manière cohérente dans tout le cahier des charges:

| Terme standard | Variantes à éviter |
|----------------|-------------------|
| NestJS | Nest.js, Nest |
| Remix | RemixJS, Remix.js |
| PostgreSQL | Postgres, PG |
| Prisma | PrismaORM |
| TypeScript | TS, Typescript |
| monorepo | mono-repo, mono repo |
| Pull Request | PR, pull-request |
| API REST | API Rest, RestAPI |

## Format standard pour documenter les décisions techniques

```markdown
> [!DECISION]  
> ## Décision technique: [Titre de la décision]
> 
> **Date:** YYYY-MM-DD  
> **Statut:** Proposé | Accepté | Rejeté | Remplacé  
> **Contexte:** Description du contexte qui a mené à cette décision
> 
> **Options considérées:**
> 1. Option A - avantages/inconvénients
> 2. Option B - avantages/inconvénients
> 3. Option C - avantages/inconvénients
> 
> **Décision:** Option choisie avec justification détaillée
> 
> **Conséquences:** Impact de cette décision sur le projet
> 
> **Métriques de validation:** Comment mesurer le succès de cette décision
```

## Conventions d'interdépendances

Pour assurer la traçabilité des interdépendances:

1. Toute référence à un autre module doit utiliser un lien Markdown explicite
2. Les dépendances techniques doivent être listées au début de chaque section
3. Les impacts sur d'autres modules doivent être documentés dans une sous-section dédiée
4. Chaque décision impactant plusieurs modules doit être référencée dans tous les modules concernés
