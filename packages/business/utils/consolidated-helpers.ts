/**
 * Helpers consolidés pour les workflows
 * Ce fichier regroupe toutes les fonctions utilitaires précédemment séparées dans différents fichiers
 */

/**
 * Crée un ID unique pour un workflow
 */
export function generateWorkflowId(prefix: string = 'wf'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Formate une durée en millisecondes en format lisible
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Analyse les erreurs et retourne un message utilisateur approprié
 */
export function parseError(error: any): string {
    if (!error) return 'Une erreur inconnue est survenue';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error.message) return error.message;
    return JSON.stringify(error);
}

/**
 * Vérifie si un workflow a expiré
 */
export function isWorkflowExpired(startTime: Date, timeoutMs: number): boolean {
    return Date.now() - startTime.getTime() > timeoutMs;
}

/**
 * Divise un travail en lots (chunks)
 */
export function chunkWork<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
}

/**
 * Pause l'exécution pendant un temps donné
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Effectue une tentative d'exécution avec possibilité de réessayer
 */
export async function withRetry<T>(
    fn: () => Promise<T>, 
    options: { retries: number; delay: number; backoff?: number }
): Promise<T> {
    const { retries, delay, backoff = 1 } = options;
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await sleep(delay);
        return withRetry(fn, { 
            retries: retries - 1, 
            delay: delay * backoff,
            backoff 
        });
    }
}
