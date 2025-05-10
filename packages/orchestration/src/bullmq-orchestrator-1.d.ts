import { OrchestratorAgent, AgentResult } from 'mcp-types';
export declare class BullMqOrchestrator implements OrchestratorAgent {
    id: string;
    name: string;
    type: string;
    version: string;
    executeSequence(agents: string[], inputs: Record<string, any>, options?: Record<string, any>): Promise<AgentResult>;
    handleFailure(workflowId: string, errorContext: Record<string, any>): Promise<AgentResult>;
    orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult>;
    reportStatus(workflowId: string, status: "started" | "running" | "completed" | "failed", metadata?: Record<string, any>): Promise<void>;
    isReady(): boolean;
    getMetadata(): Record<string, any>;
}
//# sourceMappingURL=bullmq-orchestrator-1.d.ts.map