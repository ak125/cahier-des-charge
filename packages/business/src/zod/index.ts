/**
 * Point d'entrée central pour tous les schémas Zod et DTOs
 * À utiliser dans NestJS et Remix pour une validation cohérente
 */

// Exporter tous les schémas de modèle
export * from './models';

// Exporter tous les DTOs
export * from './dtos';

// Exporter les utilitaires pour NestJS
export * from './nestjs-zod';

// Réexporter zod lui-même pour faciliter son utilisation
export { z } from 'zod';

/**
 * Guide d'utilisation:
 * 
 * Dans un contrôleur NestJS:
 * ```typescript
 * import { ZodValidate, CreateUserDto, CreateUserType } from '../zod';
 * 
 * @Post()
 * @ZodValidate(CreateUserDto)
 * create(@Body() createUserDto: CreateUserType) {
 *   return this.usersService.create(createUserDto);
 * }
 * ```
 * 
 * Dans un formulaire Remix avec conform-to:
 * ```typescript
 * import { conform } from '@conform-to/react';
 * import { parse } from '@conform-to/zod';
 * import { CreateUserDto } from '~/zod';
 * 
 * export async function action({ request }: ActionFunctionArgs) {
 *   const formData = await request.formData();
 *   const submission = parse(formData, { schema: CreateUserDto });
 *   
 *   if (!submission.value || submission.intent !== 'submit') {
 *     return json({ status: 'error', submission });
 *   }
 *   
 *   // Utilisez submission.value qui est maintenant correctement typé
 *   await createUser(submission.value);
 *   
 *   return json({ status: 'success', submission });
 * }
 * ```
 */