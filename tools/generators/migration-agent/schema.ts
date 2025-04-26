export interface MigrationAgentGeneratorSchema {
    name: string;
    type: 'analysis' | 'migration' | 'transformation' | 'verification' | 'integration';
    directory?: string;
    tags?: string;
}