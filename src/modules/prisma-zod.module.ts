import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from '../packages/nestjs-zod/zod-validation.pipe';
import { PrismaService } from '../services/prisma.service';
import { TypeConsistencyService } from '../services/type-consistency.service';

/**
 * Options de configuration pour le module PrismaZod
 */
export interface PrismaZodModuleOptions {
  /**
   * Activer la validation globale avec Zod
   * @default true
   */
  enableGlobalValidation?: boolean;

  /**
   * Activer la vérification stricte des types
   * @default true
   */
  strictTypeChecking?: boolean;

  /**
   * Activer la génération automatique des DTOs
   * @default true
   */
  enableAutomaticDTOGeneration?: boolean;

  /**
   * Chemin vers le répertoire des schémas générés
   * @default 'src/schemas'
   */
  schemasPath?: string;

  /**
   * Chemin vers le répertoire des DTOs générés
   * @default 'src/dtos'
   */
  dtosPath?: string;
}

/**
 * Module d'intégration pour Prisma et Zod
 *
 * Ce module permet de:
 * - Configurer la validation globale avec Zod
 * - Activer l'utilisation automatique des DTOs générés à partir des schémas Prisma
 */
@Global()
@Module({})
export class PrismaZodModule {
  /**
   * Configuration statique du module
   */
  static forRoot(options: PrismaZodModuleOptions = {}): DynamicModule {
    const {
      enableGlobalValidation = true,
      strictTypeChecking = true,
      enableAutomaticDTOGeneration = true,
      schemasPath = 'src/schemas',
      dtosPath = 'src/dtos',
    } = options;

    // Fournisseurs à configurer
    const providers: Provider[] = [
      PrismaService,
      TypeConsistencyService,
      {
        provide: 'PRISMA_ZOD_OPTIONS',
        useValue: {
          enableGlobalValidation,
          strictTypeChecking,
          enableAutomaticDTOGeneration,
          schemasPath,
          dtosPath,
        },
      },
    ];

    // Activer la validation globale si demandé
    if (enableGlobalValidation) {
      providers.push({
        provide: APP_PIPE,
        useClass: ZodValidationPipe,
      });
    }

    return {
      global: true,
      module: PrismaZodModule,
      providers,
      exports: [PrismaService, TypeConsistencyService, 'PRISMA_ZOD_OPTIONS'],
    };
  }
}
