import { OrchestratorAgent, AgentResult } from 'mcp-types';
export declare class OrchestratorBridge implements OrchestratorAgent {
    id: string;
    type: string;
    executeSequence(agents: string[], inputs: Record<string, any>, options?: Record<string, any>): Promise<AgentResult>;
    handleFailure(workflowId: string, errorContext: Record<string, any>): Promise<AgentResult>;
    reportStatus(workflowId: string, status: "started" | "running" | "completed" | "failed", metadata?: Record<string, any>): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=orchestrator-bridge-3.d.ts.map