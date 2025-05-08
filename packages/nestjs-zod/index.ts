import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { z } from 'zod';

/**
 * Options pour la validation Zod
 */
export interface ZodValidationOptions {
  errorMap?: z.ZodErrorMap;
  transformOptions?: ClassTransformOptions;
}

/**
 * Pipe de validation NestJS utilisant Zod
 * Permet de valider les données entrantes dans les contrôleurs NestJS
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodType<any>, private options: ZodValidationOptions = {}) {}

  transform(value: any) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Construire un message d'erreur plus lisible
        const formattedErrors = error.errors
          .map((err) => {
            const path = err.path.join('.');
            return `${path}: ${err.message}`;
          })
          .join(', ');

        throw new BadRequestException(`Erreur de validation: ${formattedErrors}`);
      }
      throw error;
    }
  }
}

/**
 * Fonction pour créer une classe DTO à partir d'un schéma Zod
 * Cette fonction est utilisée pour générer des DTOs compatibles avec NestJS
 * à partir de schémas Zod
 */
export function createZodDto<T extends z.ZodType>(schema: T) {
  class ZodDto {
    constructor(data: z.infer<T>) {
      Object.assign(this, schema.parse(data));
    }

    /**
     * Méthode statique qui permet de valider des données contre le schéma
     */
    static validate(data: any): z.infer<T> {
      return schema.parse(data);
    }

    /**
     * Méthode statique qui permet de valider des données de manière asynchrone
     */
    static async validateAsync(data: any): Promise<z.infer<T>> {
      return schema.parseAsync(data);
    }

    /**
     * Méthode statique qui permet de valider partiellement des données
     */
    static safeParse(data: any): z.SafeParseReturnType<any, z.infer<T>> {
      return schema.safeParse(data);
    }

    /**
     * Méthode statique qui permet d'accéder au schéma Zod sous-jacent
     */
    static get schema(): T {
      return schema;
    }

    /**
     * Méthode statique qui permet de créer une instance du DTO
     */
    static create(data: Partial<z.infer<T>>): ZodDto {
      return new ZodDto(data as any);
    }
  }

  return ZodDto;
}

/**
 * Factory pour la création de pipes de validation Zod
 */
export function createZodValidationPipe(schema: z.ZodType, options?: ZodValidationOptions) {
  return new ZodValidationPipe(schema, options);
}

/**
 * Module NestJS pour l'intégration de Zod
 * À importer dans votre module NestJS principal
 */
export const ZodModule = {
  providers: [],
  exports: [],
  // Cette structure peut être étendue selon les besoins
};
