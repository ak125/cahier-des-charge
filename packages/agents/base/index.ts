/**
 * Classes et interfaces de base pour les agents
 * Ce fichier définit l'architecture commune à tous les agents
 */

export interface AgentOptions {
    modelName?: string;
    maxTokens?: number;
    temperature?: number;
    context?: Record<string, any>;
    timeout?: number;
}

export interface AgentResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    executionTime?: number;
}

export interface Agent<T = any> {
    execute(input: any): Promise<AgentResult<T>>;
    getCapabilities(): string[];
    getModelInfo(): { name: string; version: string };
}

export abstract class BaseAgent<T = any> implements Agent<T> {
    protected options: AgentOptions;

    constructor(options: AgentOptions = {}) {
        this.options = {
            modelName: 'default',
            maxTokens: 2048,
            temperature: 0.7,
            timeout: 30000,
            ...options
        };
    }

    abstract execute(input: any): Promise<AgentResult<T>>;

    getCapabilities(): string[] {
        return ['text-processing'];
    }

    getModelInfo() {
        return {
            name: this.options.modelName || 'default',
            version: '1.0'
        };
    }
}