---
title: Prisma Zod Integration
description: Intégration et standards technologiques
slug: prisma-zod-integration
module: 5-integration
status: stable
lastReviewed: 2025-05-09
---

# Intégration Prisma et Zod - Source unique de vérité pour les types


## Problématique résolue


Ce document explique l'approche adoptée pour résoudre la multiplicité des couches (Zod, DTO, Prisma) qui créait de la redondance dans notre codebase.

## Solution: Prisma comme source unique de vérité


Nous avons mis en place un système où Prisma est utilisé comme source unique de vérité pour les types de données. À partir de ces modèles, nous générons automatiquement:

1. Des schémas Zod pour la validation
2. Des classes DTO pour l'API REST
3. Des types TypeScript cohérents

## Comment ça fonctionne


### Génération automatique


Le processus de génération est automatisé via le script `generate-zod-from-prisma.ts`. Ce script:

1. Parse le schéma Prisma (`schema.prisma`)
2. Analyse les modèles et leurs champs
3. Génère des schémas Zod correspondants
4. Crée des classes DTO basées sur ces schémas
5. Exporte tout via des fichiers index

### Étapes d'intégration


1. **Définir les modèles dans Prisma**: La seule source de vérité est le fichier `schema.prisma`
2. **Générer le code**: Exécuter `npm run prisma:generate` qui:
   - Génère le client Prisma
   - Génère les schémas Zod
   - Génère les DTOs

### Flux de travail pour les développeurs


1. Modifier uniquement le schéma Prisma (`prisma/schema.prisma`)
2. Exécuter `npm run prisma:generate`
3. Utiliser les DTOs générés dans les contrôleurs et services
4. Profiter de la validation automatique via le pipe Zod

## Exemple d'utilisation dans NestJS


### Configuration dans `app.module.ts`:


```typescript
import { Module } from '@nestjs/common';
import { PrismaZodModule } from './modules/prisma-zod.module';

@Module({
  imports: [
    PrismaZodModule.forRoot({
      enableGlobalValidation: true,
    }),
    // autres modules...
  ],
})
export class AppModule {}
```

### Dans un contrôleur:


```typescript
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from '../dtos';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // Validation automatique via Zod
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Body() filters: UserFilterDto) {
    return this.userService.findAll(filters);
  }
}
```

### Dans un service:


```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from '../dtos';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll(filters: UserFilterDto) {
    return this.prisma.user.findMany({
      where: filters,
    });
  }
}
```

## Avantages de cette approche


1. **Réduction de la redondance**: Un seul endroit où définir les types et la structure des données
2. **Cohérence**: Les types TypeScript, les validateurs et les DTOs sont toujours en synchronisation
3. **Génération automatique**: Moins de code à écrire manuellement, moins d'erreurs
4. **Validation puissante**: Zod offre des capacités avancées de validation et de transformation
5. **Performance**: Moins de conversions et de validations multiples

## Bonnes pratiques


- Ne modifiez jamais manuellement les fichiers générés dans `src/schemas` et `src/dtos`
- Pour des validations spécifiques, étendez les schémas Zod dans des fichiers séparés
- Exécutez `npm run prisma:generate` après chaque modification du schéma Prisma

## Intégration CI/CD


La génération des schémas Zod est automatiquement exécutée:
- Lors de l'installation du projet (`npm install`)
- Lors de la génération du client Prisma (`npm run prisma:generate`)
- Dans le pipeline CI/CD avant les tests et le déploiement

