import { Injectable, ArgumentMetadata, PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * Un pipe de validation NestJS qui utilise Zod pour valider les données entrantes
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  /**
   * Transforme et valide la valeur d'entrée en utilisant le schéma Zod approprié
   * @param value La valeur à transformer/valider
   * @param metadata Les métadonnées du paramètre
   * @returns La valeur validée et transformée
   * @throws BadRequestException si la validation échoue
   */
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    // Si nous avons un DTO typé, essayer de trouver le schéma Zod correspondant
    const { metatype } = metadata;
    if (!metatype || !this.hasZodSchema(metatype)) {
      return value;
    }

    try {
      // Récupérer le schéma Zod à partir du DTO
      const schema = this.getZodSchema(metatype);

      // Valider et transformer la valeur
      return await schema.parseAsync(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatter l'erreur de validation pour une meilleure lisibilité
        const formattedErrors = this.formatZodError(error);
        throw new BadRequestException({
          message: 'Erreur de validation',
          errors: formattedErrors,
        });
      }
      throw error;
    }
  }

  /**
   * Vérifie si un type possède un schéma Zod associé
   * @param metatype Le type à vérifier
   * @returns true si le type a un schéma Zod, false sinon
   */
  private hasZodSchema(metatype: any): boolean {
    return metatype.prototype && typeof metatype.prototype.zodSchema === 'function';
  }

  /**
   * Récupère le schéma Zod associé à un type
   * @param metatype Le type dont on veut extraire le schéma Zod
   * @returns Le schéma Zod associé au type
   */
  private getZodSchema(metatype: any): ZodSchema {
    return metatype.prototype.zodSchema();
  }

  /**
   * Formate une erreur de validation Zod pour une meilleure lisibilité
   * @param error L'erreur Zod à formater
   * @returns Un tableau d'objets représentant les erreurs
   */
  private formatZodError(error: ZodError): { field: string; errors: string[] }[] {
    const formattedErrors = new Map<string, string[]>();

    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!formattedErrors.has(path)) {
        formattedErrors.set(path, []);
      }
      formattedErrors.get(path)!.push(err.message);
    });

    return Array.from(formattedErrors.entries()).map(([field, messages]) => ({
      field,
      errors: messages,
    }));
  }
}

/**
 * Décorateur pour valider les données avec un schéma Zod
 *
 * @example
 * ```typescript
 * @Post()
 * @UseZodValidation(ProductCreateSchema)
 * createProduct(@Body() product: ProductCreate) {
 *  return this.productsService.create(product);
 * }
 * ```
 */
export function UseZodValidation(schema: ZodSchema) {
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    // Sauvegarde de la méthode originale
    const originalMethod = descriptor.value;

    // Remplacement par une méthode qui valide les données
    descriptor.value = async function (...args: any[]) {
      // Récupération des métadonnées de la route
      const req = args[0].req || args[0];
      const body = req.body;

      try {
        // Validation avec Zod
        const validatedData = schema.parse(body);

        // Remplacement du body avec les données validées
        req.body = validatedData;

        // Appel de la méthode originale
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new BadRequestException({
            message: 'Validation échouée',
            errors: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Interface DTO générique à partir d'un schéma Zod
 * Utile pour garder la compatibilité avec les librairies qui attendent des classes DTO
 */
export interface ZodDto<T extends ZodSchema> {
  data: T;
}

/**
 * Fonction pour créer une classe DTO à partir d'un schéma Zod
 * Utile pour maintenir la compatibilité avec les librairies qui exigent des classes DTO
 * comme Swagger/OpenAPI
 *
 * @example
 * ```typescript
 * // Création d'une classe DTO pour Swagger
 * export class ProductCreateDto extends createZodDto(ProductCreateSchema) {}
 *
 * @ApiBody({ type: ProductCreateDto })
 * @Post()
 * createProduct(@Body(new ZodValidationPipe(ProductCreateSchema)) product: ProductCreate) {
 *   return this.productsService.create(product);
 * }
 * ```
 */
export function createZodDto<T extends ZodSchema>(schema: T): new () => ZodDto<T> {
  class ZodDtoImpl implements ZodDto<T> {
    data: T;
    constructor() {
      this.data = schema;
    }
  }

  return ZodDtoImpl;
}
