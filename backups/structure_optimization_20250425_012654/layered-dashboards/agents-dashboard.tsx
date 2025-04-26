/**
 * Dashboard spécifique pour la couche des agents
 * Affiche l'état des agents, leur performance et les métriques de santé
 */
import React, { useState, useEffect } from reactstructure-agent';
import BaseDashboard, { DashboardConfig } from ./base-dashboardstructure-agent';
import { Box } from @chakra-ui/reactstructure-agent';
import { CircuitState } from ../utils/circuit-breaker/base-circuit-breakerstructure-agent';
import { TraceEvent } from ../utils/traceability/traceability-servicestructure-agent';

// Types pour les agents
interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'disabled' | 'failed' | 'idle';
  version: string;
  lastExecution?: Date;
  successRate: number;
  avgExecutionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  isolationState: CircuitState;
}

// Types pour les circuit breakers des agents
interface AgentCircuitBreakerDetail {
  id: string;
  agentId: string;
  agentName: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  failureReason?: string;
  resetTimeout: number;
  substitutionAgentId?: string;
}

// Configuration du tableau de bord pour la couche des agents
const defaultAgentsConfig: DashboardConfig = {
  title: "Tableau de bord des Agents",
  description: "Monitoring des agents, de leurs performances et de leur état de santé",
  layer: 'agents',
  refreshInterval: 20, // Rafraîchir toutes les 20 secondes
  
  // Sources de données pour ce dashboard
  dataSources: [
    {
      id: 'AgentRegistry',
      name: 'Agent Registry',
      url: '/api/agents/registry',
      refreshInterval: 30
    },
    {
      id: 'agent-performance',
      name: 'Agent Performance',
      url: '/api/agents/performance',
      refreshInterval: 15
    },
    {
      id: 'agent-health',
      name: 'Agent Health',
      url: '/api/agents/health',
      refreshInterval: 10
    },
    {
      id: 'circuit-breaker',
      name: 'Circuit Breaker',
      url: '/api/agents/circuit-breaker/status',
      refreshInterval: 10
    },
    {
      id: 'agent-trace-events',
      name: 'Agent Trace Events',
      url: '/api/traceability/events?layer=agents',
      refreshInterval: 15
    },
    {
      id: 'cross-layer-metrics',
      name: 'Cross-Layer Metrics',
      url: '/api/traceability/cross-layer-metrics?sourceLayer=agents',
      refreshInterval: 30
    },
    {
      id: 'agent-details',
      name: 'Agent Details',
      url: '/api/agents/details',
      refreshInterval: 45
    },
    {
      id: 'governance-decisions',
      name: 'Governance Decisions',
      url: '/api/governance/decisions?layer=agents',
      refreshInterval: 60
    }
  ],
  
  // Sections du tableau de bord
  sections: [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      description: 'État global des agents de la plateforme',
      widgets: [
        {
          id: 'agent-status-summary',
          title: 'État des Agents',
          type: 'status',
          size: 'md',
          metrics: [
            {
              id: 'active-agents',
              name: 'Agents actifs',
              value: 0,
              status: 'success',
              dataSourceId: 'AgentRegistry'
            },
            {
              id: 'disabled-agents',
              name: 'Agents désactivés',
              value: 0,
              status: 'warning',
              dataSourceId: 'AgentRegistry'
            },
            {
              id: 'failed-agents',
              name: 'Agents en échec',
              value: 0,
              status: 'error',
              dataSourceId: 'agent-health'
            }
          ]
        },
        {
          id: 'agent-performance-summary',
          title: 'Performance des Agents',
          type: 'status',
          size: 'md',
          metrics: [
            {
              id: 'avg-execution-time',
              name: 'Temps d\'exécution moyen',
              value: '0 ms',
              dataSourceId: 'agent-performance'
            },
            {
              id: 'success-rate',
              name: 'Taux de réussite',
              value: '0%',
              status: 'success',
              dataSourceId: 'agent-performance'
            },
            {
              id: 'throughput',
              name: 'Débit (req/min)',
              value: 0,
              dataSourceId: 'agent-performance'
            }
          ]
        },
        {
          id: 'agent-resource-usage',
          title: 'Utilisation des ressources',
          type: 'status',
          size: 'md',
          metrics: [
            {
              id: 'avg-memory-usage',
              name: 'Utilisation mémoire',
              value: '0 MB',
              dataSourceId: 'agent-health'
            },
            {
              id: 'avg-cpu-usage',
              name: 'Utilisation CPU',
              value: '0%',
              dataSourceId: 'agent-health'
            },
            {
              id: 'network-usage',
              name: 'Utilisation réseau',
              value: '0 KB/s',
              dataSourceId: 'agent-health'
            }
          ]
        },
        {
          id: 'circuit-breaker-status',
          title: 'Circuit Breaker',
          type: 'status',
          size: 'md',
          metrics: [
            {
              id: 'circuit-state',
              name: 'État du circuit',
              value: 'CLOSED',
              status: 'success',
              dataSourceId: 'circuit-breaker'
            },
            {
              id: 'disabled-agents-count',
              name: 'Agents temporairement désactivés',
              value: 0,
              dataSourceId: 'circuit-breaker'
            },
            {
              id: 'failure-rate',
              name: 'Taux d\'échec',
              value: '0%',
              dataSourceId: 'circuit-breaker'
            }
          ]
        }
      ]
    },
    {
      id: 'circuit-breaker-management',
      title: 'Gestion des Circuit Breakers',
      description: 'Supervision et contrôle des mécanismes de résilience des agents',
      widgets: [
        {
          id: 'agent-circuit-breaker-details',
          title: 'État détaillé des Circuit Breakers',
          type: 'table',
          size: 'xl',
          dataSourceId: 'circuit-breaker',
          tableConfig: {
            columns: [
              { id: 'id', label: 'ID', sortable: true },
              { id: 'agentName', label: 'Agent', sortable: true },
              { id: 'state', label: 'État', sortable: true, 
                formatter: (value) => {
                  switch(value) {
                    case 'open': return { value: 'Ouvert', status: 'error' };
                    case 'half-open': return { value: 'Semi-ouvert', status: 'warning' };
                    case 'closed': return { value: 'Fermé', status: 'success' };
                    default: return { value: value, status: 'info' };
                  }
                }
              },
              { id: 'failureCount', label: 'Échecs', sortable: true },
              { id: 'successCount', label: 'Succès', sortable: true },
              { id: 'lastFailureTime', label: 'Dernier échec', sortable: true },
              { id: 'failureReason', label: 'Raison', sortable: false },
              { id: 'substitutionAgentId', label: 'Agent de substitution', sortable: false },
              { id: 'actions', label: 'Actions', sortable: false, 
                formatter: (value, row) => ({
                  actions: [
                    { 
                      label: 'Réinitialiser', 
                      action: `resetCircuitBreaker:${row.id}`,
                      status: row.state === 'closed' ? 'disabled' : 'primary' 
                    },
                    { 
                      label: 'Substituer', 
                      action: `substituteAgent:${row.agentId}`,
                      status: row.substitutionAgentId ? 'disabled' : 'warning' 
                    },
                    { 
                      label: 'Détails', 
                      action: `showCircuitBreakerDetails:${row.id}`,
                      status: 'info' 
                    }
                  ]
                })
              }
            ],
            actions: {
              resetCircuitBreaker: async (id) => {
                console.log(`Réinitialisation du circuit breaker ${id}...`);
                await fetch(`/api/agents/circuit-breakers/${id}/reset`, {
                  method: 'POST'
                });
                return { success: true, message: `Circuit breaker ${id} réinitialisé` };
              },
              substituteAgent: async (agentId) => {
                console.log(`Substitution de l'agent ${agentId}...`);
                await fetch(`/api/agents/${agentId}/substitute`, {
                  method: 'POST'
                });
                return { success: true, message: `Agent ${agentId} substitué temporairement` };
              },
              showCircuitBreakerDetails: async (id) => {
                return { success: true, action: 'showModal', modalId: 'circuit-breaker-detail', modalProps: { breakerId: id } };
              }
            }
          }
        },
        {
          id: 'circuit-breaker-history',
          title: 'Historique des transitions',
          type: 'timeline',
          size: 'lg',
          dataSourceId: 'circuit-breaker',
          timelineConfig: {
            dateField: 'timestamp',
            titleField: 'event',
            descriptionField: 'description',
            statusField: 'status',
            filters: ['agentId']
          }
        }
      ]
    },
    {
      id: 'agent-details',
      title: 'Détails des agents',
      widgets: [
        {
          id: 'agent-list',
          title: 'Gestion des agents',
          type: 'table',
          size: 'xl',
          dataSourceId: 'agent-details',
          tableConfig: {
            columns: [
              { id: 'id', label: 'ID', sortable: true },
              { id: 'name', label: 'Nom', sortable: true },
              { id: 'type', label: 'Type', sortable: true },
              { id: 'status', label: 'Statut', sortable: true, 
                formatter: (value) => {
                  switch(value) {
                    case 'active': return { value: 'Actif', status: 'success' };
                    case 'disabled': return { value: 'Désactivé', status: 'warning' };
                    case 'failed': return { value: 'En échec', status: 'error' };
                    case 'idle': return { value: 'Inactif', status: 'info' };
                    default: return { value: value, status: 'info' };
                  }
                }
              },
              { id: 'version', label: 'Version', sortable: true },
              { id: 'successRate', label: 'Taux de succès', sortable: true,
                formatter: (value) => {
                  const percentage = typeof value === 'number' ? `${value.toFixed(1)}%` : value;
                  let status = 'info';
                  if (typeof value === 'number') {
                    if (value >= 95) status = 'success';
                    else if (value >= 80) status = 'warning';
                    else status = 'error';
                  }
                  return { value: percentage, status };
                }
              },
              { id: 'avgExecutionTime', label: 'Temps d\'exécution', sortable: true,
                formatter: (value) => {
                  if (typeof value !== 'number') return { value, status: 'info' };
                  return { 
                    value: value < 1000 
                      ? `${value}ms` 
                      : `${(value/1000).toFixed(2)}s`, 
                    status: value < 1000 ? 'success' : (value < 3000 ? 'warning' : 'error')
                  };
                }
              },
              { id: 'isolationState', label: 'Isolation', sortable: true, 
                formatter: (value) => {
                  switch(value) {
                    case CircuitState.OPEN: return { value: 'Isolé', status: 'error' };
                    case CircuitState.HALF_OPEN: return { value: 'Test', status: 'warning' };
                    case CircuitState.CLOSED: return { value: 'Normal', status: 'success' };
                    default: return { value: value || 'N/A', status: 'info' };
                  }
                }
              },
              { id: 'actions', label: 'Actions', sortable: false, 
                formatter: (value, row) => ({
                  actions: [
                    { 
                      label: row.status === 'disabled' ? 'Activer' : 'Désactiver', 
                      action: row.status === 'disabled' ? `enableAgent:${row.id}` : `disableAgent:${row.id}`,
                      status: row.status === 'disabled' ? 'success' : 'warning'
                    },
                    { 
                      label: 'Relancer', 
                      action: `restartAgent:${row.id}`,
                      status: 'primary' 
                    },
                    { 
                      label: 'Historique', 
                      action: `showAgentHistory:${row.id}`,
                      status: 'info' 
                    }
                  ]
                })
              }
            ],
            actions: {
              enableAgent: async (id) => {
                console.log(`Activation de l'agent ${id}...`);
                await fetch(`/api/agents/${id}/enable`, {
                  method: 'POST'
                });
                return { success: true, message: `Agent ${id} activé` };
              },
              disableAgent: async (id) => {
                console.log(`Désactivation de l'agent ${id}...`);
                await fetch(`/api/agents/${id}/disable`, {
                  method: 'POST'
                });
                return { success: true, message: `Agent ${id} désactivé` };
              },
              restartAgent: async (id) => {
                console.log(`Redémarrage de l'agent ${id}...`);
                await fetch(`/api/agents/${id}/restart`, {
                  method: 'POST'
                });
                return { success: true, message: `Agent ${id} redémarré` };
              },
              showAgentHistory: async (id) => {
                return { success: true, action: 'showModal', modalId: 'agent-history', modalProps: { agentId: id } };
              }
            }
          }
        },
        {
          id: 'agent-performance-chart',
          title: 'Performance des agents',
          type: 'chart',
          size: 'lg',
          chart: {
            id: 'agent-performance-timeline',
            title: 'Évolution de la performance',
            type: 'line',
            data: {},
            dataSourceId: 'agent-performance'
          }
        }
      ]
    },
    {
      id: 'traceability-analytics',
      title: 'Traçabilité & Analytics',
      description: 'Analyse des traces d\'exécution à travers les couches',
      widgets: [
        {
          id: 'trace-flow-visualization',
          title: 'Flux d\'interactions entre agents',
          type: 'flowChart',
          size: 'xl',
          dataSourceId: 'agent-trace-events',
          flowChartConfig: {
            nodeField: 'event',
            edgesField: 'connections',
            nodeMetricField: 'count',
            nodeColorField: 'successRate'
          }
        },
        {
          id: 'trace-events-table',
          title: 'Événements de trace récents',
          type: 'table',
          size: 'lg',
          dataSourceId: 'agent-trace-events',
          tableConfig: {
            columns: [
              { id: 'traceId', label: 'ID de trace', sortable: true },
              { id: 'event', label: 'Événement', sortable: true },
              { id: 'timestamp', label: 'Horodatage', sortable: true },
              { id: 'duration', label: 'Durée', sortable: true },
              { id: 'agentId', label: 'ID Agent', sortable: true },
              { id: 'success', label: 'Succès', sortable: true,
                formatter: (value) => ({ 
                  value: value ? 'Oui' : 'Non', 
                  status: value ? 'success' : 'error' 
                })
              },
              { id: 'parentTraceId', label: 'ID parent', sortable: true },
              { id: 'actions', label: 'Actions', sortable: false, 
                formatter: (value, row) => ({
                  actions: [
                    { 
                      label: 'Détails', 
                      action: `showTraceDetails:${row.traceId}`,
                      status: 'info' 
                    },
                    { 
                      label: 'Suivre', 
                      action: `traceEvent:${row.traceId}`,
                      status: 'primary' 
                    }
                  ]
                })
              }
            ],
            actions: {
              showTraceDetails: async (id) => {
                return { success: true, action: 'showModal', modalId: 'trace-details', modalProps: { traceId: id } };
              },
              traceEvent: async (id) => {
                return { success: true, action: 'navigate', url: `/trace-explorer/${id}` };
              }
            }
          }
        },
        {
          id: 'cross-layer-performance',
          title: 'Interactions inter-couches',
          type: 'chart',
          size: 'lg',
          dataSourceId: 'cross-layer-metrics',
          chart: {
            id: 'cross-layer-performance-chart',
            title: 'Interactions entre couches',
            type: 'sankey',
            data: {},
            refreshInterval: 60
          }
        }
      ]
    },
    {
      id: 'agent-health',
      title: 'Santé des agents',
      widgets: [
        {
          id: 'health-metrics-chart',
          title: 'Métriques de santé',
          type: 'chart',
          size: 'lg',
          chart: {
            id: 'health-metrics',
            title: 'Ressources par agent',
            type: 'bar',
            data: {},
            dataSourceId: 'agent-health'
          }
        },
        {
          id: 'error-distribution',
          title: 'Distribution des erreurs',
          type: 'chart',
          size: 'md',
          chart: {
            id: 'error-pie',
            title: 'Types d\'erreurs',
            type: 'pie',
            data: {},
            dataSourceId: 'agent-health'
          }
        }
      ]
    },
    {
      id: 'governance-dashboard',
      title: 'Gouvernance & Coordination',
      description: 'Coordination entre agents et règles de gouvernance',
      widgets: [
        {
          id: 'agent-governance-rules',
          title: 'Règles de gouvernance actives',
          type: 'table',
          size: 'lg',
          dataSourceId: 'governance-decisions',
          tableConfig: {
            columns: [
              { id: 'name', label: 'Nom', sortable: true },
              { id: 'description', label: 'Description', sortable: false },
              { id: 'priority', label: 'Priorité', sortable: true },
              { id: 'enabled', label: 'Active', sortable: true,
                formatter: (value) => ({ 
                  value: value ? 'Oui' : 'Non', 
                  status: value ? 'success' : 'error' 
                })
              },
              { id: 'agentScope', label: 'Portée', sortable: true },
              { id: 'triggeredCount', label: 'Déclenchements', sortable: true },
              { id: 'actions', label: 'Actions', sortable: false, 
                formatter: (value, row) => ({
                  actions: [
                    { 
                      label: row.enabled ? 'Désactiver' : 'Activer', 
                      action: row.enabled ? `disableRule:${row.id}` : `enableRule:${row.id}`,
                      status: row.enabled ? 'warning' : 'success'
                    },
                    { 
                      label: 'Éditer', 
                      action: `editRule:${row.id}`,
                      status: 'info' 
                    }
                  ]
                })
              }
            ],
            actions: {
              disableRule: async (id) => {
                await fetch(`/api/governance/rules/${id}/disable`, {
                  method: 'POST'
                });
                return { success: true, message: `Règle ${id} désactivée` };
              },
              enableRule: async (id) => {
                await fetch(`/api/governance/rules/${id}/enable`, {
                  method: 'POST'
                });
                return { success: true, message: `Règle ${id} activée` };
              },
              editRule: async (id) => {
                return { success: true, action: 'showModal', modalId: 'edit-rule', modalProps: { ruleId: id } };
              }
            }
          }
        },
        {
          id: 'recent-agent-decisions',
          title: 'Décisions récentes',
          type: 'timeline',
          size: 'lg',
          dataSourceId: 'governance-decisions',
          timelineConfig: {
            dateField: 'timestamp',
            titleField: 'ruleName',
            descriptionField: 'decision',
            statusField: 'result'
          }
        },
        {
          id: 'agent-dependencies',
          title: 'Dépendances entre agents',
          type: 'dependencyGraph',
          size: 'xl',
          dataSourceId: 'agent-details',
          dependencyGraphConfig: {
            nodeField: 'name',
            edgesField: 'dependencies',
            nodeStatusField: 'status',
            directed: true,
            hierarchical: true
          }
        }
      ]
    },
    {
      id: 'agent-manifest',
      title: 'Manifestes',
      widgets: [
        {
          id: 'manifest-versions',
          title: 'Versions des manifestes',
          type: 'list',
          size: 'lg',
          metrics: []
        }
      ]
    }
  ],
  
  // Filtres disponibles
  filters: [
    {
      id: 'agentType',
      name: 'Type d\'agent',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'analyzer', label: 'Analyseurs' },
        { value: 'verifier', label: 'Vérificateurs' },
        { value: 'generator', label: 'Générateurs' },
        { value: 'qa', label: 'QA' },
        { value: 'seo', label: 'SEO' }
      ],
      defaultValue: 'all'
    },
    {
      id: 'status',
      name: 'Statut',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'active', label: 'Actif' },
        { value: 'disabled', label: 'Désactivé' },
        { value: 'failed', label: 'En échec' }
      ],
      defaultValue: 'all'
    },
    {
      id: 'circuitBreakerState',
      name: 'État du circuit',
      options: [
        { value: 'all', label: 'Tous les états' },
        { value: 'open', label: 'Ouverts' },
        { value: 'half-open', label: 'Semi-ouverts' },
        { value: 'closed', label: 'Fermés' }
      ],
      defaultValue: 'all'
    },
    {
      id: 'traceStatus',
      name: 'Statut des traces',
      options: [
        { value: 'all', label: 'Toutes' },
        { value: 'success', label: 'Réussies' },
        { value: 'error', label: 'En erreur' }
      ],
      defaultValue: 'all'
    }
  ],
  
  // Actions disponibles
  actions: [
    {
      id: 'refresh-manifests',
      name: 'Actualiser les manifestes',
      handler: async () => {
        try {
          const response = await fetch('/api/agents/refresh-manifests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          console.log('Manifests refreshed successfully');
          return Promise.resolve();
        } catch (error) {
          console.error('Failed to refresh manifests:', error);
          return Promise.reject(error);
        }
      },
      colorScheme: 'blue'
    },
    {
      id: 'reset-agent-failures',
      name: 'Réinitialiser les échecs',
      handler: async () => {
        try {
          const response = await fetch('/api/agents/reset-failures', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          console.log('Agent failures reset successfully');
          return Promise.resolve();
        } catch (error) {
          console.error('Failed to reset agent failures:', error);
          return Promise.reject(error);
        }
      },
      colorScheme: 'orange'
    },
    {
      id: 'validate-dependencies',
      name: 'Valider les dépendances',
      handler: async () => {
        try {
          const response = await fetch('/api/agents/validate-dependencies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          console.log('Dependencies validated successfully');
          return Promise.resolve();
        } catch (error) {
          console.error('Failed to validate dependencies:', error);
          return Promise.reject(error);
        }
      },
      colorScheme: 'green'
    },
    {
      id: 'reset-circuit-breakers',
      name: 'Réinitialiser tous les circuits',
      handler: async () => {
        try {
          await fetch('/api/agents/circuit-breakers/reset-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          return { success: true, message: 'Tous les circuit breakers réinitialisés' };
        } catch (error) {
          console.error('Failed to reset circuit breakers:', error);
          return { success: false, message: 'Échec de la réinitialisation des circuit breakers' };
        }
      },
      colorScheme: 'red'
    },
    {
      id: 'export-agent-metrics',
      name: 'Exporter métriques (CSV)',
      handler: async () => {
        try {
          const response = await fetch('/api/agents/metrics/export', {
            method: 'GET'
          });
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `agent-metrics-${new Date().toISOString()}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          return { success: true, message: 'Métriques exportées avec succès' };
        } catch (error) {
          console.error('Failed to export metrics:', error);
          return { success: false, message: 'Échec de l\'export des métriques' };
        }
      },
      colorScheme: 'teal'
    },
    {
      id: 'health-check-all-agents',
      name: 'Vérifier tous les agents',
      handler: async () => {
        try {
          await fetch('/api/agents/health-check-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          return { success: true, message: 'Vérification de santé lancée pour tous les agents' };
        } catch (error) {
          console.error('Failed to run health check:', error);
          return { success: false, message: 'Échec du lancement de la vérification' };
        }
      },
      colorScheme: 'purple'
    }
  ]
};

// Interface pour les props du composant
interface AgentsDashboardProps {
  config?: Partial<DashboardConfig>;
  onLayerChange?: (layer: 'orchestration' | 'agents' | 'business' | 'all') => void;
  className?: string;
}

/**
 * Tableau de bord pour la couche des agents
 */
const AgentsDashboard: React.FC<AgentsDashboardProps> = ({
  config = {},
  onLayerChange,
  className
}) => {
  // État local pour la configuration fusionnée
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    ...defaultAgentsConfig,
    ...config,
    // Fusionner les sources de données
    dataSources: [
      ...defaultAgentsConfig.dataSources,
      ...(config.dataSources || [])
    ],
    // Fusionner les sections
    sections: [
      ...defaultAgentsConfig.sections,
      ...(config.sections || [])
    ],
    // Fusionner les filtres
    filters: [
      ...(defaultAgentsConfig.filters || []),
      ...(config.filters || [])
    ],
    // Fusionner les actions
    actions: [
      ...(defaultAgentsConfig.actions || []),
      ...(config.actions || [])
    ]
  });

  // États locaux pour les données temps réel
  const [circuitBreakerStats, setCircuitBreakerStats] = useState<{
    open: number;
    halfOpen: number;
    closed: number;
    total: number;
  }>({
    open: 1,
    halfOpen: 2,
    closed: 14,
    total: 17
  });

  const [recentTraces, setRecentTraces] = useState<TraceEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Effet pour charger les données réelles
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Charger les stats des circuit breakers
        const cbResponse = await fetch('/api/agents/circuit-breakers/stats');
        if (cbResponse.ok) {
          const cbStats = await cbResponse.json();
          setCircuitBreakerStats(cbStats);
        }

        // Charger les traces récentes
        const tracesResponse = await fetch('/api/traceability/events?layer=agents&limit=10');
        if (tracesResponse.ok) {
          const traces = await tracesResponse.json();
          setRecentTraces(traces);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données du tableau de bord:", error);
      }
    };

    // Charger les données immédiatement et configurer l'intervalle
    loadDashboardData();
    const intervalId = setInterval(loadDashboardData, 30000);
    
    // Nettoyage
    return () => clearInterval(intervalId);
  }, []);

  // Effet pour simuler le chargement de données réelles
  useEffect(() => {
    const simulateDataUpdate = () => {
      setDashboardConfig(prevConfig => {
        // Simuler des mises à jour pour quelques métriques
        const updatedSections = prevConfig.sections.map(section => ({
          ...section,
          widgets: section.widgets.map(widget => {
            if (widget.id === 'agent-status-summary' && widget.metrics) {
              return {
                ...widget,
                metrics: widget.metrics.map(metric => {
                  if (metric.id === 'active-agents') {
                    return { ...metric, value: Math.floor(Math.random() * 15) + 10 };
                  }
                  if (metric.id === 'disabled-agents') {
                    return { ...metric, value: Math.floor(Math.random() * 3) };
                  }
                  if (metric.id === 'failed-agents') {
                    return { ...metric, value: Math.floor(Math.random() * 2) };
                  }
                  return metric;
                })
              };
            }
            if (widget.id === 'agent-performance-summary' && widget.metrics) {
              return {
                ...widget,
                metrics: widget.metrics.map(metric => {
                  if (metric.id === 'avg-execution-time') {
                    return { ...metric, value: `${Math.floor(Math.random() * 1000) + 200} ms` };
                  }
                  if (metric.id === 'success-rate') {
                    const rate = Math.floor(Math.random() * 15) + 85;
                    return { 
                      ...metric, 
                      value: `${rate}%`,
                      status: rate > 95 ? 'success' : rate > 80 ? 'warning' : 'error'
                    };
                  }
                  if (metric.id === 'throughput') {
                    return { ...metric, value: Math.floor(Math.random() * 50) + 20 };
                  }
                  return metric;
                })
              };
            }
            return widget;
          })
        }));
        
        return { ...prevConfig, sections: updatedSections };
      });
    };
    
    // Simuler des mises à jour de données périodiques
    const interval = setInterval(simulateDataUpdate, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Box className={className}>
      <BaseDashboard 
        config={dashboardConfig}
        onLayerChange={onLayerChange}
        debug={false}
        data={{
          circuitBreakerStats,
          recentTraces
        }}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      />
    </Box>
  );
};

export default AgentsDashboard;