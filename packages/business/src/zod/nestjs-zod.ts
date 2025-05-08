import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, z } from 'zod';

/**
 * Pipe de validation NestJS utilisant Zod
 * À utiliser avec les décorateurs @Body(), @Query(), @Param(), etc.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) { }

    transform(value: unknown, metadata: ArgumentMetadata) {
        try {
            return this.schema.parse(value);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new BadRequestException({
                    message: 'Validation failed',
                    errors: error.errors,
                });
            }
            throw error;
        }
    }
}

/**
 * Décorateurs pour faciliter l'utilisation de Zod dans les contrôleurs NestJS
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsePipes } from '@nestjs/common';

/**
 * Crée un décorateur personnalisé pour valider avec un schéma Zod spécifique
 * @param schema - Le schéma Zod à utiliser pour la validation
 */
export const ZodValidate = (schema: ZodSchema) => UsePipes(new ZodValidationPipe(schema));

/**
 * Crée une classe DTO à partir d'un schéma Zod
 * Utile pour la documentation Swagger
 */
type Constructor<T = any> = new (...args: any[]) => T;

export function createZodDto<T extends ZodSchema>(schema: T): Constructor<z.infer<T>> {
    class ZodDto {
        constructor(data: z.infer<T>) {
            Object.assign(this, schema.parse(data));
        }
    }

    return ZodDto as Constructor<z.infer<T>>;
}

/**
 * Exemple d'utilisation:
 *
 * ```typescript
 * // Dans un contrôleur NestJS
 * @Post()
 * @ZodValidate(CreateUserDto)
 * create(@Body() createUserDto: CreateUserType) {
 *   return this.usersService.create(createUserDto);
 * }
 * ```
 *
 * Pour Swagger:
 * 
 * ```typescript
 * class UserDto extends createZodDto(UserSchema) {}
 * 
 * @ApiResponse({ type: UserDto })
 * ```
 */