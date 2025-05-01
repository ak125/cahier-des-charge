import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Badge, Card, Col, Divider, Grid, List, ListItem, Text, Title } from '@tremor/react';

interface Agent {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  status: 'active' | 'inactive' | 'error';
  lastExecution?: string;
  averageExecutionTime?: number;
  successRate?: number;
}

export const loader = async () => {
  // Simuler des données d'agents pour la démonstration
  // Dans un environnement de production, ces données seraient chargées depuis votre API
  const agents: Agent[] = [
    {
      id: 'php-analyzer-agent',
      name: 'PHP Analyzer',
      description: 'Analyse la structure et le code PHP pour la migration',
      version: '1.2.0',
      category: 'analysis',
      status: 'active',
      lastExecution: '2025-04-22T10:15:30Z',
      averageExecutionTime: 1250,
      successRate: 97,
    },
    {
      id: 'remix-generator',
      name: 'Remix Generator',
      description: "Génère des composants Remix à partir d'analyses de code",
      version: '2.0.1',
      category: 'migration',
      status: 'active',
      lastExecution: '2025-04-22T11:30:45Z',
      averageExecutionTime: 3200,
      successRate: 89,
    },
    {
      id: 'mysql-analyzer',
      name: 'MySQL Analyzer',
      description: 'Analyse les schémas et requêtes MySQL pour la migration vers Prisma',
      version: '1.0.5',
      category: 'analysis',
      status: 'active',
      lastExecution: '2025-04-21T16:45:12Z',
      averageExecutionTime: 2100,
      successRate: 92,
    },
    {
      id: 'seo-meta',
      name: 'SEO Meta',
      description: 'Génère et optimise les balises meta pour le référencement',
      version: '0.9.2',
      category: 'optimization',
      status: 'active',
      lastExecution: '2025-04-22T09:10:25Z',
      averageExecutionTime: 950,
      successRate: 100,
    },
    {
      id: 'ab-strategy-tester',
      name: 'A/B Strategy Tester',
      description: 'Compare différentes stratégies de migration',
      version: '1.0.0',
      category: 'testing',
      status: 'active',
      lastExecution: '2025-04-21T14:20:30Z',
      averageExecutionTime: 5600,
      successRate: 100,
    },
    {
      id: 'migration-orchestrator',
      name: 'Migration Orchestrator',
      description: "Coordonne l'exécution des migrations entre les agents",
      version: '1.3.1',
      category: 'orchestration',
      status: 'active',
      lastExecution: '2025-04-22T08:05:15Z',
      averageExecutionTime: 1850,
      successRate: 94,
    },
    {
      id: 'agent-health-checker',
      name: 'Agent Health Checker',
      description: 'Surveille la santé et les performances des agents',
      version: '1.0.3',
      category: 'monitoring',
      status: 'active',
      lastExecution: '2025-04-22T12:00:00Z',
      averageExecutionTime: 450,
      successRate: 100,
    },
  ];

  const categories = Array.from(new Set(agents.map((agent) => agent.category)));

  return json({ agents, categories });
};

// Fonction utilitaire pour formater la durée
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

export default function AgentsPage() {
  const { agents, categories } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Agents MCP</h1>
        <p className="text-gray-600">
          Vue d'ensemble et statut des agents disponibles dans le pipeline MCP
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title>Résumé des Agents</Title>
          <Badge size="sm" color="blue">
            {agents.length} agents disponibles
          </Badge>
        </div>

        <Grid numItemsMd={3} numItemsLg={5} className="gap-4">
          <Card decoration="top" decorationColor="green">
            <Text className="text-center text-gray-500">Actifs</Text>
            <p className="text-center text-2xl font-semibold mt-2">
              {agents.filter((a) => a.status === 'active').length}
            </p>
          </Card>

          <Card decoration="top" decorationColor="red">
            <Text className="text-center text-gray-500">Inactifs</Text>
            <p className="text-center text-2xl font-semibold mt-2">
              {agents.filter((a) => a.status === 'inactive').length}
            </p>
          </Card>

          <Card decoration="top" decorationColor="amber">
            <Text className="text-center text-gray-500">Catégories</Text>
            <p className="text-center text-2xl font-semibold mt-2">{categories.length}</p>
          </Card>

          <Card decoration="top" decorationColor="indigo">
            <Text className="text-center text-gray-500">Taux de succès moyen</Text>
            <p className="text-center text-2xl font-semibold mt-2">
              {Math.round(agents.reduce((acc, a) => acc + (a.successRate || 0), 0) / agents.length)}
              %
            </p>
          </Card>

          <Card decoration="top" decorationColor="cyan">
            <Text className="text-center text-gray-500">Temps moyen</Text>
            <p className="text-center text-2xl font-semibold mt-2">
              {formatDuration(
                Math.round(
                  agents.reduce((acc, a) => acc + (a.averageExecutionTime || 0), 0) / agents.length
                )
              )}
            </p>
          </Card>
        </Grid>
      </Card>

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold capitalize">{category}</h2>
            <Badge size="sm" color="gray" className="ml-2">
              {agents.filter((a) => a.category === category).length} agents
            </Badge>
          </div>

          <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
            {agents
              .filter((agent) => agent.category === category)
              .map((agent) => (
                <Card key={agent.id} className="relative">
                  <div className="absolute top-3 right-3">
                    <Badge
                      color={
                        agent.status === 'active'
                          ? 'green'
                          : agent.status === 'error'
                            ? 'red'
                            : 'gray'
                      }
                      size="sm"
                    >
                      {agent.status}
                    </Badge>
                  </div>

                  <Title>{agent.name}</Title>
                  <Text className="mt-2">{agent.description}</Text>

                  <Divider />

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div>
                      <Text className="text-xs text-gray-500">Version</Text>
                      <p className="text-sm font-medium">{agent.version}</p>
                    </div>

                    {agent.lastExecution && (
                      <div>
                        <Text className="text-xs text-gray-500">Dernière exécution</Text>
                        <p className="text-sm font-medium">
                          {new Date(agent.lastExecution).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}

                    {agent.averageExecutionTime !== undefined && (
                      <div>
                        <Text className="text-xs text-gray-500">Temps moyen</Text>
                        <p className="text-sm font-medium">
                          {formatDuration(agent.averageExecutionTime)}
                        </p>
                      </div>
                    )}

                    {agent.successRate !== undefined && (
                      <div>
                        <Text className="text-xs text-gray-500">Taux de succès</Text>
                        <p className="text-sm font-medium">{agent.successRate}%</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
          </Grid>
        </div>
      ))}
    </div>
  );
}
