/**
 * memo-tracer.ts
 * 
 * Implémentation du système de traçabilité pour les opérations de mémoire
 * Permet de créer des traces signées pour l'audit et la vérification
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createHash, createHmac } from 'crypto';
import { MemoEntry, MemoTraceOptions, MemoTracer } from '../interfaces/memo-store';

/**
 * Options pour initialiser le traceur
 */
export interface MemoTracerInitOptions {
    /**
     * Dossier où stocker les traces
     */
    tracesDir?: string;

    /**
     * Clé secrète pour signer les traces
     */
    secretKey?: string;

    /**
     * Préfixe pour les IDs de trace
     */
    traceIdPrefix?: string;

    /**
     * Format par défaut pour les traces
     */
    defaultFormat?: 'json' | 'protobuf' | 'binary';

    /**
     * Conservation automatique des traces
     */
    autoSave?: boolean;

    /**
     * Niveau de détail pour les traces
     */
    detailLevel?: 'minimal' | 'standard' | 'verbose';
}

/**
 * Structure d'une trace complète
 */
interface TraceObject {
    traceId: string;
    timestamp: number;
    agentId: string;
    runId?: string;
    operation: string;
    entryId: string;
    entryType: string;
    entryTimestamp: number;
    metadata?: Record<string, any>;
    contentHash: string;
    signature?: string;
}

/**
 * Classe implémentant le système de traçabilité pour les mémoires d'agents
 */
export class MemoTracerImpl implements MemoTracer {
    private options: Required<MemoTracerInitOptions>;
    private traces: Map<string, TraceObject> = new Map();

    constructor(options?: MemoTracerInitOptions) {
        // Valeurs par défaut
        this.options = {
            tracesDir: './.memo-traces',
            secretKey: 'default-secret-key-change-in-production',
            traceIdPrefix: 'trace',
            defaultFormat: 'json',
            autoSave: true,
            detailLevel: 'standard',
            ...options
        };
    }

    /**
     * Initialise le traceur
     */
    async initialize(): Promise<void> {
        // Créer le dossier des traces s'il n'existe pas
        await fs.mkdir(this.options.tracesDir, { recursive: true });
    }

    /**
     * Génère un ID unique pour une trace
     */
    private generateTraceId(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `${this.options.traceIdPrefix}-${timestamp}-${random}`;
    }

    /**
     * Calcule un hash pour le contenu
     */
    private calculateContentHash(data: any): string {
        return createHash('sha256')
            .update(typeof data === 'string' ? data : JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Signe une trace avec la clé secrète
     */
    private signTrace(trace: TraceObject): string {
        const dataToSign = JSON.stringify({
            traceId: trace.traceId,
            timestamp: trace.timestamp,
            agentId: trace.agentId,
            runId: trace.runId,
            operation: trace.operation,
            entryId: trace.entryId,
            entryType: trace.entryType,
            entryTimestamp: trace.entryTimestamp,
            contentHash: trace.contentHash
        });

        return createHmac('sha256', this.options.secretKey)
            .update(dataToSign)
            .digest('hex');
    }

    /**
     * Crée une trace à partir d'une entrée mémoire
     */
    async createTrace<T>(
        entry: MemoEntry<T>,
        options?: MemoTraceOptions
    ): Promise<string> {
        const traceId = this.generateTraceId();
        const now = Date.now();

        // Déterminer l'opération à partir du contexte
        const operation = options?.context?.operation || 'access';

        // Créer l'objet de trace
        const trace: TraceObject = {
            traceId,
            timestamp: now,
            agentId: entry.agentId,
            runId: entry.runId,
            operation,
            entryId: entry.id,
            entryType: entry.type,
            entryTimestamp: entry.timestamp,
            contentHash: entry.contentHash || this.calculateContentHash(entry.data)
        };

        // Ajouter les métadonnées si demandé
        if (this.options.detailLevel === 'verbose') {
            trace.metadata = {
                ...entry.metadata,
                ...options?.context
            };
        } else if (this.options.detailLevel === 'standard') {
            // En standard, on garde juste les métadonnées essentielles
            const { source, category, importance } = entry.metadata || {};
            trace.metadata = {
                source,
                category,
                importance,
                ...options?.context
            };
        }

        // Signer la trace si demandé
        if (options?.signed !== false) {
            trace.signature = this.signTrace(trace);
        }

        // Stocker en mémoire
        this.traces.set(traceId, trace);

        // Sauvegarder la trace si autoSave est activé
        if (this.options.autoSave) {
            await this.saveTrace(traceId, JSON.stringify(trace));
        }

        return traceId;
    }

    /**
     * Vérifie l'intégrité d'une trace
     */
    async verifyTrace(traceData: string): Promise<boolean> {
        try {
            // Parser la trace
            const trace = JSON.parse(traceData) as TraceObject;

            // Si pas de signature, impossible de vérifier
            if (!trace.signature) {
                return false;
            }

            // Calculer la signature attendue
            const expectedSignature = this.signTrace(trace);

            // Comparer avec la signature stockée
            return trace.signature === expectedSignature;
        } catch (error) {
            console.error('Erreur lors de la vérification de la trace :', error);
            return false;
        }
    }

    /**
     * Enregistre une trace dans le système de fichiers
     */
    async saveTrace(traceId: string, traceData: string): Promise<void> {
        try {
            // Créer le chemin du fichier
            const tracePath = join(this.options.tracesDir, `${traceId}.trace.json`);

            // Assurer que le dossier existe
            await fs.mkdir(dirname(tracePath), { recursive: true });

            // Écrire le fichier de trace
            await fs.writeFile(tracePath, traceData);
        } catch (error) {
            console.error(`Erreur lors de l'enregistrement de la trace ${traceId} :`, error);
        }
    }

    /**
     * Récupère une trace par son ID
     */
    async getTrace(traceId: string): Promise<string | null> {
        // D'abord chercher en mémoire
        const memoryTrace = this.traces.get(traceId);
        if (memoryTrace) {
            return JSON.stringify(memoryTrace);
        }

        // Sinon chercher sur le disque
        try {
            const tracePath = join(this.options.tracesDir, `${traceId}.trace.json`);
            const traceData = await fs.readFile(tracePath, 'utf-8');
            return traceData;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error(`Erreur lors de la récupération de la trace ${traceId} :`, error);
            }
            return null;
        }
    }

    /**
     * Liste toutes les traces disponibles
     */
    async listTraces(filter?: {
        agentId?: string;
        runId?: string;
        operation?: string;
        fromTimestamp?: number;
        toTimestamp?: number;
    }): Promise<string[]> {
        try {
            // Lire tous les fichiers dans le dossier des traces
            const files = await fs.readdir(this.options.tracesDir);
            const traceIds = files
                .filter(file => file.endsWith('.trace.json'))
                .map(file => file.replace('.trace.json', ''));

            // Si pas de filtre, retourner tous les IDs
            if (!filter) {
                return traceIds;
            }

            // Filtrer les traces selon les critères
            const filteredTraceIds: string[] = [];

            for (const traceId of traceIds) {
                const traceData = await this.getTrace(traceId);
                if (!traceData) continue;

                try {
                    const trace = JSON.parse(traceData) as TraceObject;

                    // Appliquer les filtres
                    let match = true;

                    if (filter.agentId && trace.agentId !== filter.agentId) {
                        match = false;
                    }

                    if (filter.runId && trace.runId !== filter.runId) {
                        match = false;
                    }

                    if (filter.operation && trace.operation !== filter.operation) {
                        match = false;
                    }

                    if (filter.fromTimestamp && trace.timestamp < filter.fromTimestamp) {
                        match = false;
                    }

                    if (filter.toTimestamp && trace.timestamp > filter.toTimestamp) {
                        match = false;
                    }

                    if (match) {
                        filteredTraceIds.push(traceId);
                    }
                } catch (error) {
                    console.error(`Erreur lors du traitement de la trace ${traceId} :`, error);
                }
            }

            return filteredTraceIds;
        } catch (error) {
            console.error('Erreur lors de la liste des traces :', error);
            return [];
        }
    }

    /**
     * Génère un rapport des traces pour un ID d'exécution spécifique
     */
    async generateRunReport(runId: string): Promise<string> {
        const traces = await this.listTraces({ runId });

        if (traces.length === 0) {
            return `Aucune trace trouvée pour l'exécution ${runId}`;
        }

        const traceObjects: TraceObject[] = [];

        // Récupérer toutes les traces pour cette exécution
        for (const traceId of traces) {
            const traceData = await this.getTrace(traceId);
            if (traceData) {
                try {
                    const trace = JSON.parse(traceData) as TraceObject;
                    traceObjects.push(trace);
                } catch (error) {
                    console.error(`Erreur lors du traitement de la trace ${traceId} :`, error);
                }
            }
        }

        // Trier par horodatage
        traceObjects.sort((a, b) => a.timestamp - b.timestamp);

        // Générer le rapport
        let report = `# Rapport de traçabilité pour l'exécution ${runId}\n\n`;
        report += `Nombre de traces : ${traceObjects.length}\n`;
        report += `Date de première trace : ${new Date(traceObjects[0].timestamp).toISOString()}\n`;
        report += `Date de dernière trace : ${new Date(traceObjects[traceObjects.length - 1].timestamp).toISOString()}\n\n`;

        report += `## Chronologie des opérations\n\n`;

        for (const trace of traceObjects) {
            const timeFormatted = new Date(trace.timestamp).toISOString();
            report += `- ${timeFormatted} : ${trace.operation} sur ${trace.entryType} (ID: ${trace.entryId})\n`;
        }

        return report;
    }

    /**
     * Nettoie les anciennes traces
     */
    async cleanupOldTraces(maxAgeDays: number): Promise<number> {
        const now = Date.now();
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        const cutoffTimestamp = now - maxAgeMs;

        let removedCount = 0;

        try {
            const files = await fs.readdir(this.options.tracesDir);
            const traceFiles = files.filter(file => file.endsWith('.trace.json'));

            for (const file of traceFiles) {
                const traceId = file.replace('.trace.json', '');
                const traceData = await this.getTrace(traceId);

                if (!traceData) continue;

                try {
                    const trace = JSON.parse(traceData) as TraceObject;

                    if (trace.timestamp < cutoffTimestamp) {
                        // Supprimer la trace
                        const tracePath = join(this.options.tracesDir, file);
                        await fs.unlink(tracePath);

                        // Supprimer également de la mémoire
                        this.traces.delete(traceId);

                        removedCount++;
                    }
                } catch (error) {
                    console.error(`Erreur lors du traitement de la trace ${traceId} :`, error);
                }
            }
        } catch (error) {
            console.error('Erreur lors du nettoyage des traces :', error);
        }

        return removedCount;
    }
}