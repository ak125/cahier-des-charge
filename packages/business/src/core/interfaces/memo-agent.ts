/**
 * memo-agent.ts
 * 
 * Interface pour les agents avec capacités de mémoire à long terme
 */

import { BaseAgent } from './base-agent';
import { MemoData, MemoResult } from '../memo/memo-manager';

/**
 * Extension de BaseAgent avec des capacités de mémoire
 */
export interface MemoAgent extends BaseAgent {
    /**
     * Initialise la mémoire de l'agent
     */
    initializeMemory(): Promise<boolean>;

    /**
     * Stocke une information en mémoire
     */
    remember<T>(key: string, data: MemoData<T>): Promise<string>;

    /**
     * Récupère une information depuis la mémoire
     */
    recall<T>(key: string): Promise<MemoResult<T>>;

    /**
     * Recherche des informations correspondant à une requête
     */
    searchMemory<T>(query: Record<string, any>): Promise<MemoResult<T>[]>;

    /**
     * Recherche des informations sémantiquement similaires
     */
    findSimilar<T>(embeddings: number[]): Promise<MemoResult<T>[]>;

    /**
     * Supprime une information de la mémoire
     */
    forget(key: string): Promise<boolean>;

    /**
     * Nettoie les mémoires expirées
     */
    cleanupMemory(): Promise<{ shortTerm: number; longTerm: number }>;

    /**
     * Obtient un rapport des traces pour une exécution spécifique
     */
    getMemoryTraceReport(runId: string): Promise<string | null>;
}