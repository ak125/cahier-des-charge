# Configuration standardisée pour TypeBox

Ce document décrit la configuration standardisée pour l'utilisation de TypeBox dans notre monorepo NX.

## Introduction

[TypeBox](https://github.com/sinclairzx81/typebox) est une bibliothèque de validation de schéma JSON qui génère des types TypeScript. Notre configuration standardisée fournit une intégration complète avec notre architecture NX et facilite la validation des données tout au long de l'application.

## Installation

Le package TypeBox est déjà installé comme dépendance dans le projet. Notre implémentation standardisée est disponible dans le package `schema-validation`.

## Fonctionnalités principales

Notre configuration standardisée pour TypeBox offre les fonctionnalités suivantes :

1. **Validation de schémas** : Configuration optimisée pour la validation de données
2. **Types standardisés** : Ensemble de types primitifs et composites prêts à l'emploi
3. **Intégration REST API** : Génération automatique de schémas CRUD pour les API REST
4. **Compatibilité Zod** : Adaptateurs pour une transition en douceur de Zod vers TypeBox
5. **Optimisations de performance** : Compilation des schémas pour des validations performantes

## Utilisation

### Import des dépendances

```typescript
import { 
  Type, 
  Static, 
  TypeBoxConfig, 
  StandardSchemas, 
  RestApiSchemas, 
  validateSchema 
} from '@packages/schema-validation';
```

### Création d'un schéma

```typescript
const ProductSchema = Type.Object({
  name: StandardSchemas.Primitives.SafeString,
  price: StandardSchemas.Primitives.PositiveNumber,
  description: StandardSchemas.Primitives.LongText,
  category: Type.String(),
  tags: Type.Array(Type.String()),
  isAvailable: Type.Boolean({ default: true }),
}, {
  $id: 'Product'
});

// Type TypeScript généré automatiquement
type Product = Static<typeof ProductSchema>;
```

### Validation des données

```typescript
// Validation simple
const result = validateSchema<Product>(ProductSchema, productData);
if (!result.valid) {
  console.error('Erreurs de validation:', result.errors);
} else {
  // Utiliser result.value (typed comme Product)
}

// Validation optimisée pour les performances
const validator = TypeBoxConfig.compile(ProductSchema);
const isValid = validator.Check(productData);
```

### Création de schémas pour API REST

```typescript
const productApiSchemas = RestApiSchemas.createCrudSchemas(ProductSchema, 'Product');

// Utilisation avec un framework API (exemple)
app.post('/products', validateRequest(productApiSchemas.createRequest), (req, res) => {
  // Données déjà validées selon le schéma
});

app.get('/products', validateRequest(productApiSchemas.searchRequest), (req, res) => {
  // Requête de recherche validée
});

app.put('/products/:id', validateRequest(productApiSchemas.updateRequest), (req, res) => {
  // Mise à jour partielle validée
});
```

### Intégration avec Zod (pour code existant)

```typescript
import { ZodTypeBoxAdapter } from '@packages/schema-validation';
import { z } from 'zod';

// Conversion d'un schéma TypeBox en schéma Zod
const zodSchema = ZodTypeBoxAdapter.typeBoxToZod(ProductSchema);

// Validation TypeBox avec erreurs au format Zod
const result = ZodTypeBoxAdapter.validateAsZod(ProductSchema, data);
```

## Bonnes pratiques

1. **Utiliser les schémas standardisés** : Privilégier les types du `StandardSchemas` pour maintenir la cohérence.
2. **Compiler les schémas** : Pour les validations fréquentes, utiliser `TypeBoxConfig.compile()` pour optimiser les performances.
3. **Organiser les schémas** : Chaque module devrait définir ses schémas dans un fichier `schemas.ts` dédié.
4. **Types dérivés** : Toujours utiliser `Static<typeof MonSchema>` pour dériver les types TypeScript.
5. **Tests de validation** : Tester les schémas avec des données valides et invalides.

## Intégration avec NX

Cette configuration de TypeBox est entièrement intégrée avec notre pipeline NX. Tous les targets NX (`build`, `lint`, `test`, `typecheck`) sont configurés pour fonctionner avec les schémas TypeBox.

## Migration depuis Zod

Pour les projets utilisant actuellement Zod, nous recommandons une approche progressive :

1. Utilisez d'abord `ZodTypeBoxAdapter` pour rendre les schémas TypeBox compatibles avec le code existant
2. Créez les nouveaux schémas directement avec TypeBox
3. Migrez progressivement les anciens schémas Zod vers TypeBox

## Ressources

- [Documentation officielle TypeBox](https://github.com/sinclairzx81/typebox)
- [Exemples d'utilisation](/packages/schema-validation/src/types/examples.ts)
- [Standards API REST](/packages/schema-validation/src/lib/rest-api-schemas.ts)