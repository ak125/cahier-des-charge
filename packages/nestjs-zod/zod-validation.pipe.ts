import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Pipe de validation basé sur Zod pour NestJS
 * 
 * Ce pipe permet d'utiliser les schémas Zod directement dans vos contrôleurs NestJS
 * pour la validation des données entrantes (body, params, query).
 * 
 * @example
 * ```typescript
 * @Post()
 * createProduct(@Body(new ZodValidationPipe(ProductCreateSchema)) product: ProductCreate) {
 *   return this.productsService.create(product);
 * }
 * ```
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      // Parse la valeur avec le schéma Zod
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatage des erreurs Zod pour NestJS
        throw new BadRequestException({
          message: 'Validation échouée',
          errors: this.formatZodError(error),
        });
      }
      throw error;
    }
  }

  /**
   * Formate les erreurs Zod pour les rendre plus lisibles dans une API REST
   */
  private formatZodError(error: ZodError) {
    return error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
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
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
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