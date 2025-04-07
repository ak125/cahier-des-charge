# Registre des décisions techniques (ADR)

## 🧩 Introduction

Ce document enregistre toutes les décisions d'architecture significatives prises sur le projet. Chaque décision est documentée dans un format standardisé pour garantir la traçabilité, l'auditabilité et la compréhension des choix techniques effectués.

---

## ADR-001: Adoption de l'architecture monorepo NestJS/Remix

**Date:** 2023-10-15  
**Statut:** Approuvé  
**Décideurs:** Équipe architecture, CTO  

### Contexte et problématique

L'application existante basée sur PHP monolithique présente des limitations en termes de maintenabilité, performance et expérience développeur. Une migration vers une architecture moderne est nécessaire.

### Options considérées

1. **Migration progressive vers NestJS (backend) et Remix (frontend) en monorepo**
   - Avantages: Partage de types, cohérence technique, tests intégrés, DX améliorée
   - Inconvénients: Complexité initiale, apprentissage pour l'équipe

2. **Migration vers des microservices indépendants**
   - Avantages: Isolation, scaling indépendant, équipes autonomes
   - Inconvénients: Complexité opérationnelle, overhead de communication

3. **Amélioration progressive de l'existant (refactoring PHP)**
   - Avantages: Risque minimal, connaissance existante
   - Inconvénients: Dette technique persistante, limitations techniques

### Décision

Nous avons choisi l'option 1: Migration vers une architecture monorepo NestJS/Remix.

### Justification

- TypeScript offre une sécurité de type et une maintenabilité supérieures
- L'architecture monorepo permet le partage des types entre backend et frontend
- NestJS fournit une structure modulaire bien adaptée à notre domaine métier
- Remix offre un modèle mental proche du PHP (rendering côté serveur) facilitant la transition
- La migration progressive permet de réduire les risques en procédant module par module

### Conséquences

- Investissement en formation TypeScript/NestJS/Remix pour l'équipe
- Mise en place d'un pipeline CI/CD adapté à un monorepo
- Période de migration où les deux systèmes coexistent
- Nécessité d'une synchronisation des données pendant la phase transitoire

---

## ADR-002: Migration de MySQL vers PostgreSQL via Prisma

**Date:** 2023-11-10  
**Statut:** Approuvé  
**Décideurs:** Lead Backend, DBA, CTO  

### Contexte et problématique

La base de données MySQL actuelle présente des limitations en termes de concurrence, types de données avancés, et performances sur certaines requêtes complexes. Le choix d'un ORM moderne est également nécessaire.

### Options considérées

1. **Migration vers PostgreSQL avec Prisma comme ORM**
   - Avantages: Fonctionnalités avancées (JSON, arrays), meilleure concurrence, intégration TypeScript
   - Inconvénients: Migration complexe, changements de syntaxe SQL

2. **Continuer avec MySQL et adopter Prisma**
   - Avantages: Migration plus simple, connaissances existantes
   - Inconvénients: Limitations persistantes de MySQL

3. **Continuer avec MySQL et utiliser TypeORM**
   - Avantages: Plus flexible, architecture traditionnelle
   - Inconvénients: Moins intégré avec TypeScript, plus verbeux

### Décision

Nous avons choisi l'option 1: Migration vers PostgreSQL avec Prisma comme ORM.

### Justification

- PostgreSQL offre des fonctionnalités avancées qui correspondent mieux à nos besoins futurs
- Prisma fournit une excellente intégration TypeScript avec génération de types
- La combinaison permet des migrations vérifiées à la compilation
- Le schéma déclaratif de Prisma simplifie la modélisation et la documentation

### Conséquences

- Nécessité d'un plan de migration des données soigneusement élaboré
- Formation sur PostgreSQL et Prisma pour l'équipe backend
- Phase de synchronisation bidirectionnelle pendant la transition
- Adaptation de certaines requêtes spécifiques à MySQL

---

## ADR-003: Utilisation d'agents IA pour assister la migration

**Date:** 2023-12-05  
**Statut:** Approuvé  
**Décideurs:** CTO, Lead Architecture, Lead DevOps  

### Contexte et problématique

La migration d'une large base de code PHP vers NestJS/Remix représente un effort considérable. L'utilisation d'outils d'automatisation pourrait accélérer et fiabiliser ce processus.

### Options considérées

1. **Déploiement d'agents IA spécialisés pour assister la migration**
   - Avantages: Accélération, cohérence, réduction des tâches répétitives
   - Inconvénients: Investissement initial, supervision nécessaire

2. **Migration manuelle avec outils de refactoring standards**
   - Avantages: Contrôle total, approche traditionnelle
   - Inconvénients: Plus lent, risque d'incohérences

3. **Sous-traitance de la migration à une équipe externe**
   - Avantages: Capacités additionnelles, expertise externe
   - Inconvénients: Coût, transfert de connaissance difficile

### Décision

Nous avons choisi l'option 1: Déploiement d'agents IA spécialisés pour assister la migration.

### Justification

- Les tâches répétitives de conversion représentent une part importante du travail
- Les agents IA peuvent maintenir une cohérence dans les conventions de code
- L'orchestration via n8n permet un contrôle fin du processus
- L'approche permet l'amélioration continue des processus de migration

### Conséquences

- Investissement dans l'infrastructure IA (serveurs, modèles)
- Développement initial des agents spécialisés
- Processus de revue et validation humaine nécessaire
- Apprentissage continu et amélioration des prompts et workflows

---

## Template pour les nouvelles décisions

```
## ADR-XXX: [Titre de la décision]

**Date:** YYYY-MM-DD  
**Statut:** [Proposé|Approuvé|Rejeté|Remplacé]  
**Décideurs:** [Liste des personnes impliquées]  

### Contexte et problématique

[Description du contexte et de la problématique]

### Options considérées

1. **[Option 1]**
   - Avantages: [Liste]
   - Inconvénients: [Liste]

2. **[Option 2]**
   - Avantages: [Liste]
   - Inconvénients: [Liste]

### Décision

Nous avons choisi l'option X.

### Justification

[Explication détaillée des raisons du choix]

### Conséquences

[Impact du choix sur les aspects techniques, organisationnels, etc.]
```

Pour ajouter une nouvelle décision technique, copiez ce template et complétez les sections appropriées.
