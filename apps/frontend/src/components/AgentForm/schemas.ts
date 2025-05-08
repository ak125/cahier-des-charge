import { Type, Static, StandardSchemas } from '../../../../../packages/schema-validation/src';

/**
 * Schéma de validation pour le formulaire d'agent dans l'interface utilisateur
 */
export const AgentFormSchema = Type.Object({
    name: Type.String({
        minLength: 3,
        maxLength: 100,
        description: 'Nom de l'agent(3- 100 caractères)'
  }),
    description: Type.String({
        minLength: 10,
        maxLength: 1000,
        description: 'Description détaillée des capacités de l'agent'
  }),
        version: Type.String({
            pattern: '^\\d+\\.\\d+\\.\\d+$',
            description: 'Version au format semver (ex: 1.0.0)'
        }),
            type: Type.Union([
                Type.Literal('analyzer'),
                Type.Literal('generator'),
                Type.Literal('transformer'),
                Type.Literal('validator')
            ], {
                description: 'Type d'agent'
  }),
                capabilities: Type.Array(
                    Type.String(),
                    {
                        minItems: 1,
                        description: 'Capacités techniques de l'agent'
    }
                ),
                    configuration: Type.Record(
                        Type.String(),
                        Type.Unknown(),
                        { description: 'Configuration personnalisée de l'agent' }
  ),
                        isActive: Type.Boolean({
                            default: true,
                            description: 'Indique si l'agent est actif'
  })
}, {
    $id: 'AgentForm',
        additionalProperties: false
});

// Type TypeScript généré automatiquement à partir du schéma
export type AgentFormData = Static<typeof AgentFormSchema>;

// Valeurs par défaut pour le formulaire
export const defaultAgentFormValues: AgentFormData = {
    name: '',
    description: '',
    version: '1.0.0',
    type: 'analyzer',
    capabilities: [],
    configuration: {},
    isActive: true
};