/**
 * Format de résultat standardisé pour les agents
 * Cette interface est utilisée par tous les agents pour retourner leurs résultats
 * de manière cohérente à travers les trois couches
 */
export interface AgentResult {
    success: boolean;
    data?: any;
    error?: string | Record<string, any>;
    metadata?: Record<string, any>;
}