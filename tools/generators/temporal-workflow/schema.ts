export interface TemporalWorkflowGeneratorSchema {
    name: string;
    category: 'migration' | 'integration' | 'audit' | 'notification' | 'orchestration';
    directory?: string;
    timeout?: string;
}