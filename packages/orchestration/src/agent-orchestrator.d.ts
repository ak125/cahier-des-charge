interface AuditConfig {
    phpFilePath: string;
    outputDir?: string;
    createGitHubIssue?: boolean;
    assignee?: string;
    runAgents?: string[];
}
/**
 * Orchestrateur des agents d'audit qui exécute chaque agent dans l'ordre
 * et combine leurs résultats.
 */
declare class AgentOrchestrator {
    private config;
    constructor(config: AuditConfig);
    /**
     * Valide si le fichier PHP existe
     */
    private validateFile;
    /**
     * Initialise le rapport d'audit avec un template vide si celui-ci n'existe pas
     */
    private initializeAuditFile;
    /**
     * Exécute un agent d'audit spécifique
     */
    private runAgent;
    /**
     * Crée une issue GitHub pour le rapport d'audit
     */
    private createGitHubIssue;
    /**
     * Exécute tous les agents d'audit
     */
    runAll(): Promise<void>;
}
export { AgentOrchestrator };
//# sourceMappingURL=agent-orchestrator.d.ts.map