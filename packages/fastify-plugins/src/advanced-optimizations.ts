import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import secureSession from '@fastify/secure-session';
import multipart from '@fastify/multipart';

interface AdvancedOptimizationsOptions {
    cache?: boolean;
    session?: {
        secret: string | Buffer;
        salt?: string;
        cookieName?: string;
        cookieOptions?: any;
    };
    multipart?: {
        limits?: {
            fileSize?: number;
            files?: number;
        };
    };
}

/**
 * Plugin Fastify avec des optimisations avancées pour les performances
 * 
 * Ce plugin configure plusieurs optimisations avancées pour Fastify :
 * - Gestion des sessions sécurisées
 * - Optimisation du traitement multipart
 * - Optimisations de cache
 */
export default fp(async function (
    fastify: FastifyInstance,
    options: FastifyPluginOptions & AdvancedOptimizationsOptions,
    done
) {
    const {
        session,
        multipart: multipartOptions = {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB par défaut
                files: 10 // Maximum 10 fichiers par défaut
            }
        },
        cache = true
    } = options;

    // Configuration des sessions sécurisées si activées
    if (session) {
        await fastify.register(secureSession, {
            secret: session.secret,
            salt: session.salt || 'mcp-secure-salt',
            cookieName: session.cookieName || 'mcp-session',
            cookie: {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 86400, // 7 jours par défaut
                ...session.cookieOptions
            }
        });
        fastify.log.info('Sessions sécurisées configurées');
    }

    // Configuration de la gestion des fichiers multipart
    await fastify.register(multipart, {
        limits: {
            fieldNameSize: 100, // Taille maximale du nom de champ
            fieldSize: 1000000, // Taille maximale du contenu d'un champ (1MB)
            fields: 20, // Nombre maximum de champs
            ...multipartOptions.limits
        },
        attachFieldsToBody: true, // Attache les champs au corps de la requête
    });
    fastify.log.info('Traitement multipart configuré');

    // Optimisations de cache
    if (cache) {
        // Ajout d'un hook pour configurer les en-têtes de cache par défaut
        fastify.addHook('onSend', (request, reply, payload, done) => {
            // N'ajoute pas d'en-têtes de cache pour les réponses d'erreur
            if (reply.statusCode >= 400) {
                return done(null, payload);
            }

            // Si pas d'en-tête Cache-Control déjà défini
            if (!reply.hasHeader('Cache-Control')) {
                // Pour les requêtes GET et HEAD, configure un cache de 5 minutes par défaut
                if (request.method === 'GET' || request.method === 'HEAD') {
                    reply.header('Cache-Control', 'public, max-age=300');
                } else {
                    // Pour les autres méthodes, désactive le cache
                    reply.header('Cache-Control', 'no-store, no-cache, must-revalidate');
                }
            }

            // Ajoute un ETag simple (basé sur un hash du payload)
            if (typeof payload === 'string' && !reply.hasHeader('ETag') && payload.length > 0) {
                const crypto = require('crypto');
                const hash = crypto.createHash('sha1').update(payload).digest('base64');
                reply.header('ETag', `"${hash}"`);
            }

            done(null, payload);
        });

        fastify.log.info('Optimisations de cache configurées');
    }

    done();
}, {
    name: 'fastify-advanced-optimizations',
    fastify: '4.x',
    dependencies: ['fastify-basic-optimizations'] // Dépend des optimisations de base
});