import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatage élégant des erreurs de validation Zod
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new BadRequestException({
          message: 'Erreur de validation',
          errors: formattedErrors,
        });
      }
      throw error;
    }
  }
}

// ZodPipe avec validation partielle, utile pour les mises à jour
@Injectable()
export class ZodPartialValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      // Création d'une version partielle du schéma (tous les champs optionnels)
      const partialSchema = this.schema.partial();
      return partialSchema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new BadRequestException({
          message: 'Erreur de validation',
          errors: formattedErrors,
        });
      }
      throw error;
    }
  }
}
