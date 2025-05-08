import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import pino from 'pino';

interface LoggerPluginOptions {
    serviceName?: string;
    level?: string;
    redact?: string[];
    prettyPrint?: boolean;
}

/**
 * Plugin Fastify pour configurer un logger structuré avec Pino
 * 
 * Ce plugin configure un logger Pino avec des options optimisées pour
 * les environnements de développement et de production.
 */
export default fp(async function (
    fastify: FastifyInstance,
    options: FastifyPluginOptions & LoggerPluginOptions,
    done
) {
    const {
        serviceName = process.env.SERVICE_NAME || 'mcp-server',
        level = process.env.LOG_LEVEL || 'info',
        redact = ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'],
        prettyPrint = process.env.NODE_ENV !== 'production'
    } = options;

    const pinoConfig = {
        name: serviceName,
        level,
        redact,
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            app: serviceName,
            env: process.env.NODE_ENV
        },
        formatters: {
            level: (label: string) => {
                return { level: label };
            }
        },
        transport: prettyPrint
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname'
                }
            }
            : undefined
    };

    // Remplacer le logger existant par notre instance Pino configurée
    fastify.log = pino(pinoConfig);

    // Ajouter un hook pour logger les requêtes entrantes
    fastify.addHook('onRequest', (request, reply, done) => {
        request.log.info({
            req: {
                method: request.method,
                url: request.url,
                hostname: request.hostname,
                remoteAddress: request.ip,
                remotePort: request.socket.remotePort
            }
        }, 'requête entrante');
        done();
    });

    // Ajouter un hook pour logger les réponses
    fastify.addHook('onResponse', (request, reply, done) => {
        request.log.info({
            res: {
                statusCode: reply.statusCode,
                responseTime: reply.getResponseTime()
            }
        }, 'réponse envoyée');
        done();
    });

    // Hook pour logger les erreurs
    fastify.addHook('onError', (request, reply, error, done) => {
        request.log.error({
            err: {
                message: error.message,
                stack: error.stack,
                type: error.name
            },
            req: {
                method: request.method,
                url: request.url
            },
            res: {
                statusCode: reply.statusCode
            }
        }, 'erreur survenue');
        done();
    });

    done();
}, {
    name: 'fastify-pino-logger',
    fastify: '4.x'
});