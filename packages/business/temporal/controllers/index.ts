/**
 * Index pour l'exportation des routeurs Fastify des contrôleurs Temporal
 * 
 * Ce fichier centralise tous les routeurs Fastify utilisés pour interagir avec
 * les workflows Temporal via des API REST.
 */

import { migrationRouter } from './migration-controller';
import { sqlAnalyzerRouter } from './sql-analyzer-controller';

// Pour la compatibilité avec le code existant
import { aiMigrationRouter } from './ai-migration-controller';
import { phpMigrationRouter } from './php-migration-controller';

export {
    // Routeurs consolidés
    migrationRouter,
    sqlAnalyzerRouter,

    // Routeurs originaux (pour compatibilité ascendante)
    aiMigrationRouter,
    phpMigrationRouter
};

/**
 * Fonction d'aide pour enregistrer tous les routeurs dans une application NestJS avec Fastify
 * 
 * @example
 * ```typescript
 * // Avec NestJS + Fastify
 * const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
 * registerAllControllers(app);
 * ```
 */
export function registerAllControllers(app) {
    // Récupérer l'instance Fastify sous-jacente
    const fastifyInstance = app.getHttpAdapter().getInstance();
    const prefix = '/api/temporal';

    // Enregistrer les routeurs Fastify avec le préfixe approprié
    fastifyInstance.register((instance, opts, done) => {
        // Enregistrer les routeurs consolidés
        instance.register(migrationRouter);
        instance.register(sqlAnalyzerRouter);

        // Enregistrer les routeurs legacy pour la compatibilité
        instance.register(aiMigrationRouter);
        instance.register(phpMigrationRouter);

        done();
    }, { prefix });

    console.log('✅ Tous les contrôleurs Temporal ont été enregistrés avec Fastify');
}

export default { registerAllControllers };