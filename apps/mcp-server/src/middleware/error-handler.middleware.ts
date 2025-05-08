import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware pour la gestion globale des erreurs
 * Capture les exceptions non gérées et fournit une réponse cohérente
 */
@Injectable()
export class ErrorHandlerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('ErrorHandler');

    use(req: any, res: any, next: () => void) {
        // Gestion des erreurs non capturées par les intercepteurs NestJS
        res.raw.on('error', (error: Error) => {
            this.logger.error(`Erreur non gérée: ${error.message}`, error.stack);

            // Si la réponse n'a pas encore été envoyée
            if (!res.raw.sent) {
                res.status(500).send({
                    statusCode: 500,
                    message: 'Une erreur interne est survenue',
                    timestamp: new Date().toISOString(),
                    path: req.raw.url
                });
            }
        });

        // Gestion du timeout des requêtes
        const timeoutMs = 30000; // 30 secondes
        const timeout = setTimeout(() => {
            this.logger.warn(`Requête timeout: ${req.raw.method} ${req.raw.url}`);
            if (!res.raw.sent) {
                res.status(503).send({
                    statusCode: 503,
                    message: 'La requête a pris trop de temps à s\'exécuter',
                    timestamp: new Date().toISOString(),
                    path: req.raw.url
                });
            }
        }, timeoutMs);

        // Nettoyage du timeout après la fin de la requête
        res.raw.on('finish', () => {
            clearTimeout(timeout);
        });

        next();
    }
}