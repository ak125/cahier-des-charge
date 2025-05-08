/**
 * Utilitaires consolidés pour les workflows
 * Ce fichier a été généré automatiquement comme un stub pour résoudre les imports brisés.
 * Import original: ../utils/workflow-tester
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
 * Pause l'exécution pendant un temps donné
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
