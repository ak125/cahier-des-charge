# Gestion unifiée des types et validation avec Prisma et Zod

Ce projet implémente une approche qui utilise **Prisma comme source unique de vérité** pour les types de données et génère automatiquement les schémas de validation Zod correspondants. Cette approche élimine la redondance entre les différentes couches (Zod, DTO, Prisma).

## Fonctionnalités

- ✅ **Source unique de vérité** : Les modèles Prisma définissent toute la structure des données
- ✅ **Génération automatique** : Les schémas Zod sont générés à partir des modèles Prisma
- ✅ **Type safety** : Validation complète à l'exécution avec inférence de types TypeScript
- ✅ **DRY (Don't Repeat Yourself)** : Plus besoin de définir les types à plusieurs endroits
- ✅ **Middleware de validation** : Validation des requêtes HTTP facile à intégrer
- ✅ **Services standardisés** : Implémentation CRUD avec validation intégrée

## Structure

```
/scripts
  ├── generate-zod-from-prisma.ts   # Générateur de schémas Zod à partir de Prisma
/src
  ├── schemas/                      # Schémas Zod générés automatiquement
  │   ├── user.schema.ts
  │   ├── product.schema.ts
  │   └── ...
  ├── utils/
  │   ├── prisma-service.ts         # Classe de base pour services avec validation
  │   └── validation-middleware.ts   # Middleware Express pour la validation
  ├── services/
  │   ├── user.service.ts           # Service avec validation automatique
  │   └── ...
  └── controllers/
      ├── user.controller.ts        # Contrôleur avec middleware de validation
      └── ...
```

## Utilisation

### 1. Générer les schémas Zod

Après avoir défini ou modifié vos modèles Prisma, générez les schémas Zod :

```bash
npx ts-node scripts/generate-zod-from-prisma.ts
```

### 2. Créer un service

Implémentez un service qui utilise la validation automatique :

```typescript
import { PrismaService } from '../utils/prisma-service';
import { CreateUserSchema, UpdateUserSchema } from '../schemas/user.schema';

export class UserService extends PrismaService<User, CreateUserType, UpdateUserType> {
  constructor() {
    super(prisma, 'user', {
      create: CreateUserSchema,
      update: UpdateUserSchema
    });
  }
  
  // Méthodes personnalisées...
}
```

### 3. Utiliser la validation dans les contrôleurs

```typescript
// Routes avec middleware de validation
export const userRoutes = {
  create: [validateBody(CreateUserSchema), UserController.create],
  update: [validateBody(UpdateUserSchema), UserController.update],
};
```

## Avantages

1. **Moins de code** : Élimination des définitions redondantes
2. **Moins d'erreurs** : Une seule définition de type à maintenir
3. **Meilleure cohérence** : Garantie que les types sont identiques partout
4. **Productivité accrue** : Génération automatique des schémas de validation
5. **Validation robuste** : Zod offre une validation puissante et personnalisable

## Workflow de développement

1. Définir/modifier les modèles dans `prisma/schema.prisma`
2. Exécuter `npx prisma generate` pour générer le client Prisma
3. Exécuter `npx ts-node scripts/generate-zod-from-prisma.ts` pour générer les schémas Zod
4. Utiliser les services et middlewares de validation avec ces schémas

Cette approche simplifie considérablement le développement en éliminant la duplication et en garantissant que tous les types sont cohérents à travers l'application.