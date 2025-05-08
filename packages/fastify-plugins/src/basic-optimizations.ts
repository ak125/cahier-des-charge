import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

interface BasicOptimizationsOptions {
    compress?: boolean;
    security?: boolean;
    rateLimit?: {
        max: number;
        timeWindow: string | number;
    };
    bodyLimit?: number;
    timeouts?: {
        keepAlive?: number;
        headers?: number;
    };
}

/**
 * Plugin Fastify regroupant des optimisations de base pour les performances et la sécurité
 * 
 * Ce plugin configure plusieurs optimisations recommandées pour Fastify :
 * - Compression des réponses
 * - En-têtes de sécurité via Helmet
 * - Limitation de débit (rate limiting)
 * - Limitation de taille du corps des requêtes
 * - Optimisation des timeouts
 */
export default fp(async function (
    fastify: FastifyInstance,
    options: FastifyPluginOptions & BasicOptimizationsOptions,
    done
) {
    const {
        compress: enableCompress = true,
        security = true,
        rateLimit: rateLimitOptions = { max: 200, timeWindow: '1 minute' },
        bodyLimit = 1048576, // 1MB par défaut
        timeouts = {
            keepAlive: 65000, // 65 secondes pour éviter les problèmes avec certains load balancers
            headers: 66000
        }
    } = options;

    // Configuration de la compression
    if (enableCompress) {
        await fastify.register(compress, {
            global: true,
            encodings: ['gzip', 'deflate']
        });
        fastify.log.info('Compression activée');
    }

    // Configuration des en-têtes de sécurité avec Helmet
    if (security) {
        await fastify.register(helmet, {
            // Personnaliser les options de sécurité selon les besoins
            contentSecurityPolicy: process.env.NODE_ENV === 'production'
        });
        fastify.log.info('En-têtes de sécurité configurés');
    }

    // Configuration du rate limiting
    await fastify.register(rateLimit, {
        max: rateLimitOptions.max,
        timeWindow: rateLimitOptions.timeWindow,
        // Personnalisation de la clé de rate limit (IP par défaut)
        keyGenerator: (req) => req.headers['x-forwarded-for'] as string || req.ip
    });
    fastify.log.info(`Rate limiting configuré: ${rateLimitOptions.max} requêtes par ${rateLimitOptions.timeWindow}`);

    // Limitation de la taille du corps des requêtes
    fastify.addHook('onReady', () => {
        fastify.server.maxRequestBodySize = bodyLimit;
        fastify.log.info(`Taille maximale du corps des requêtes limitée à ${bodyLimit} octets`);

        // Configuration des timeouts
        if (timeouts) {
            fastify.server.keepAliveTimeout = timeouts.keepAlive;
            fastify.server.headersTimeout = timeouts.headers;
            fastify.log.info(`Timeouts configurés: keepAlive=${timeouts.keepAlive}ms, headers=${timeouts.headers}ms`);
        }
    });

    // Décorateur de réponse standardisée
    fastify.decorateReply('ok', function (data: any) {
        this.send({
            status: 'success',
            data,
            timestamp: new Date().toISOString()
        });
    });

    fastify.decorateReply('error', function (statusCode: number, error: string | Error, code?: string) {
        const message = error instanceof Error ? error.message : error;

        this.code(statusCode).send({
            status: 'error',
            error: {
                message,
                code: code || 'INTERNAL_ERROR'
            },
            timestamp: new Date().toISOString()
        });
    });

    done();
}, {
    name: 'fastify-basic-optimizations',
    fastify: '4.x',
    dependencies: ['fastify-pino-logger'] // Dépend du logger pour les logs
});