import express from 'express';
import { MCPAgent } from '@model-context-protocol/core';
/**
 * Options de configuration pour le serveur MCP
 */
export interface MCPServerOptions {
    port?: number;
    basePath?: string;
    enableCors?: boolean;
}
/**
 * Classe d'implémentation du serveur MCP
 */
export declare class MCPServer {
    private app;
    private port;
    private basePath;
    constructor(options?: MCPServerOptions);
    /**
     * Configure les routes par défaut du serveur MCP
     */
    private setupDefaultRoutes;
    /**
     * Enregistre un nouvel agent dans le serveur MCP
     */
    registerAgent(agentName: string, agent: MCPAgent): void;
    /**
     * Démarre le serveur MCP
     */
    start(): void;
    /**
     * Récupère l'instance Express sous-jacente
     */
    getExpressApp(): express.Application;
}
export default MCPServer;
