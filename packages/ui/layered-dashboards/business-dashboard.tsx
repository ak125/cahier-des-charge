import { Box } from '@chakra-ui/react';
/**
 * Dashboard spécifique pour la couche métier
 * Affiche les KPIs business, l'état des domaines et l'utilisation du modèle
 */
import React, { useEffect, useState } from 'react';
import { CircuitState } from ..@cahier-des-charge/coordination/src/utils/circuit-breaker/base-circuit-breaker';
import { TraceEvent } from ..@cahier-des-charge/coordination/src/utils/traceability/traceability-service';
import BaseDashboard, { DashboardConfig } from './base-dashboard';

// Configuration du tableau de bord pour la couche métier
const defaultBusinessConfig: DashboardConfig = {
  title: 'Tableau de bord Métier',
  description: 'Monitoring des domaines métier, KPIs et utilisation des modèles',
  layer: 'business',
  refreshInterval: 45, // Rafraîchir toutes les 45 secondes

  // Sources de données pour ce dashboard
  dataSources: [
    {
      id: 'business-domains',
      name: 'Business Domains',
      url: '/api/business/domains',
      refreshInterval: 60,
    },
    {
      id: 'model-usage',
      name: 'Model Usage',
      url: '/api/business/models/usage',
      refreshInterval: 30,
    },
    {
      id: 'business-kpis',
      name: 'Business KPIs',
      url: '/api/business/kpis',
      refreshInterval: 120,
    },
    {
      id: 'circuit-breaker',
      name: 'Circuit Breaker',
      url: '/api/business/circuit-breaker/status',
      refreshInterval: 20,
    },
    {
      id: 'business-trace-events',
      name: 'Business Trace Events',
      url: '/api/traceability/events?layer=business',
      refreshInterval: 15,
    },
    {
      id: 'cross-layer-metrics',
      name: 'Cross-Layer Metrics',
      url: '/api/traceability/cross-layer-metrics?sourceLayer=business',
      refreshInterval: 30,
    },
    {
      id: 'domain-details',
      name: 'Domain Details',
      url: '/api/business/domains/details',
      refreshInterval: 60,
    },
    {
      id: 'model-details',
      name: 'Model Details',
      url: '/api/business/models/details',
      refreshInterval: 60,
    },
    {
      id: 'governance-decisions',
      name: 'Governance Decisions',
      url: '/api/governance/decisions?layer=business',
      refreshInterval: 60,
    },
    {
      id: 'migration-metrics',
      name: 'Migration Metrics',
      url: '/api/business/migrations/metrics',
      refreshInterval: 90,
    },
  ],

  // Sections du tableau de bord
  sections: [
    {
      id: 'overview',
      title: "Vue d'ensemble",
      description: 'État global des domaines métier',
      widgets: [
        {
          id: 'domain-status',
          title: 'État des domaines',
          type: 'status',
          size: 'md',
          metrics: [
            {
              id: 'active-domains',
              name: 'Domaines actifs',
              value: 0,
              status: 'success',
              dataSourceId: 'business-domains',
            },
            {
              id: 'pending-migrations',
              name: 'Migrations en attente',
              value: 0,
              status: 'warning',
              dataSourceId: 'business-domains',
            },
            {
              id: 'failed-domains',
              name: 'Domaines en échec',
              value: 0,
              status: 'error',
              dataSourceId: 'business-domains',
            },
          ],
        },
        {
          id: 'model-usage-summary',
          title: 'Utilisation des modèles',
          type: 'status',
          size: 'md',
          metrics: [
            {
              id: 'tokens-consumed',
              name: 'Tokens consommés',
              value: 0,
              dataSourceId: 'model-usage',
            },
            {
              id: 'api-requests',
              name: 'Requêtes API',
              value: 0,
              dataSourceId: 'model-usage',
            },
            {
              id: 'cost-estimate',
              name: 'Coût estimé',
              value: '0 €',
              dataSourceId: 'model-usage',
            },
          ],
        },
        {
          id: 'business-kpis-summary',
          title: 'KPIs métier',
          type: 'status',
          size: 'md',
          metrics: [
            {
              id: 'migration-success-rate',
              name: 'Taux de migration réussie',
              value: '0%',
              status: 'success',
              dataSourceId: 'business-kpis',
            },
            {
              id: 'avg-migration-time',
              name: 'Temps moyen de migration',
              value: '0 jours',
              dataSourceId: 'business-kpis',
            },
            {
              id: 'business-complexity',
              name: 'Complexité métier',
              value: 'Faible',
              dataSourceId: 'business-kpis',
            },
          ],
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
              dataSourceId: 'circuit-breaker',
            },
            {
              id: 'isolated-domains',
              name: 'Domaines isolés',
              value: 0,
              dataSourceId: 'circuit-breaker',
            },
            {
              id: 'migration-rejections',
              name: 'Migrations rejetées',
              value: 0,
              dataSourceId: 'circuit-breaker',
              status: 'warning',
            },
          ],
        },
      ],
    },
    {
      id: 'circuit-breaker-management',
      title: 'Gestion des Circuit Breakers',
      description: 'Supervision et contrôle des mécanismes de résilience des domaines métier',
      widgets: [
        {
          id: 'business-circuit-breaker-details',
          title: 'État détaillé des Circuit Breakers',
          type: 'table',
          size: 'xl',
          dataSourceId: 'circuit-breaker',
          tableConfig: {
            columns: [
              { id: 'id', label: 'ID', sortable: true },
              { id: 'domainName', label: 'Domaine', sortable: true },
              {
                id: 'state',
                label: 'État',
                sortable: true,
                formatter: (value) => {
                  switch (value) {
                    case 'open':
                      return { value: 'Ouvert', status: 'error' };
                    case 'half-open':
                      return { value: 'Semi-ouvert', status: 'warning' };
                    case 'closed':
                      return { value: 'Fermé', status: 'success' };
                    default:
                      return { value: value, status: 'info' };
                  }
                },
              },
              { id: 'failureCount', label: 'Échecs', sortable: true },
              { id: 'successCount', label: 'Succès', sortable: true },
              { id: 'lastFailureTime', label: 'Dernier échec', sortable: true },
              { id: 'failureReason', label: 'Raison', sortable: false },
              {
                id: 'fallbackEnabled',
                label: 'Repli actif',
                sortable: true,
                formatter: (value) => ({
                  value: value ? 'Oui' : 'Non',
                  status: value ? 'success' : 'warning',
                }),
              },
              {
                id: 'actions',
                label: 'Actions',
                sortable: false,
                formatter: (_value, row) => ({
                  actions: [
                    {
                      label: 'Réinitialiser',
                      action: `resetCircuitBreaker:${row.id}`,
                      status: row.state === 'closed' ? 'disabled' : 'primary',
                    },
                    {
                      label: row.fallbackEnabled ? 'Désactiver repli' : 'Activer repli',
                      action: row.fallbackEnabled
                        ? `disableFallback:${row.domainId}`
                        : `enableFallback:${row.domainId}`,
                      status: row.fallbackEnabled ? 'warning' : 'success',
                    },
                    {
                      label: 'Détails',
                      action: `showCircuitBreakerDetails:${row.id}`,
                      status: 'info',
                    },
                  ],
                }),
              },
            ],
            actions: {
              resetCircuitBreaker: async (id) => {
                console.log(`Réinitialisation du circuit breaker ${id}...`);
                await fetch(`/api/business/circuit-breakers/${id}/reset`, {
                  method: 'POST',
                });
                return { success: true, message: `Circuit breaker ${id} réinitialisé` };
              },
              enableFallback: async (domainId) => {
                console.log(`Activation du repli pour le domaine ${domainId}...`);
                await fetch(`/api/business/domains/${domainId}/fallback/enable`, {
                  method: 'POST',
                });
                return { success: true, message: `Repli activé pour le domaine ${domainId}` };
              },
              disableFallback: async (domainId) => {
                console.log(`Désactivation du repli pour le domaine ${domainId}...`);
                await fetch(`/api/business/domains/${domainId}/fallback/disable`, {
                  method: 'POST',
                });
                return { success: true, message: `Repli désactivé pour le domaine ${domainId}` };
              },
              showCircuitBreakerDetails: async (id) => {
                return {
                  success: true,
                  action: 'showModal',
                  modalId: 'circuit-breaker-detail',
                  modalProps: { breakerId: id },
                };
              },
            },
          },
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
            filters: ['domainId'],
          },
        },
      ],
    },
    {
      id: 'domain-details',
      title: 'Détails des domaines',
      widgets: [
        {
          id: 'domain-list',
          title: 'Gestion des domaines métier',
          type: 'table',
          size: 'xl',
          dataSourceId: 'domain-details',
          tableConfig: {
            columns: [
              { id: 'id', label: 'ID', sortable: true },
              { id: 'name', label: 'Nom', sortable: true },
              { id: 'type', label: 'Type', sortable: true },
              {
                id: 'status',
                label: 'Statut',
                sortable: true,
                formatter: (value) => {
                  switch (value) {
                    case 'active':
                      return { value: 'Actif', status: 'success' };
                    case 'pending-migration':
                      return { value: 'Attente migration', status: 'warning' };
                    case 'failed':
                      return { value: 'Échec', status: 'error' };
                    case 'migrated':
                      return { value: 'Migré', status: 'info' };
                    case 'maintenance':
                      return { value: 'Maintenance', status: 'warning' };
                    default:
                      return { value: value, status: 'info' };
                  }
                },
              },
              {
                id: 'migrationProgress',
                label: 'Progression',
                sortable: true,
                formatter: (value) => {
                  const percentage = typeof value === 'number' ? `${value.toFixed(1)}%` : value;
                  let status = 'info';
                  if (typeof value === 'number') {
                    if (value >= 95) status = 'success';
                    else if (value >= 50) status = 'warning';
                    else status = 'error';
                  }
                  return { value: percentage, status };
                },
              },
              {
                id: 'complexity',
                label: 'Complexité',
                sortable: true,
                formatter: (value) => {
                  switch (value) {
                    case 'low':
                      return { value: 'Faible', status: 'success' };
                    case 'medium':
                      return { value: 'Moyenne', status: 'info' };
                    case 'high':
                      return { value: 'Élevée', status: 'warning' };
                    case 'very-high':
                      return { value: 'Très élevée', status: 'error' };
                    default:
                      return { value: value, status: 'info' };
                  }
                },
              },
              {
                id: 'isolationState',
                label: 'Isolation',
                sortable: true,
                formatter: (value) => {
                  switch (value) {
                    case CircuitState.OPEN:
                      return { value: 'Isolé', status: 'error' };
                    case CircuitState.HALF_OPEN:
                      return { value: 'Test', status: 'warning' };
                    case CircuitState.CLOSED:
                      return { value: 'Normal', status: 'success' };
                    default:
                      return { value: value || 'N/A', status: 'info' };
                  }
                },
              },
              {
                id: 'actions',
                label: 'Actions',
                sortable: false,
                formatter: (_value, row) => ({
                  actions: [
                    {
                      label: row.status === 'maintenance' ? 'Activer' : 'Maintenance',
                      action:
                        row.status === 'maintenance'
                          ? `activateDomain:${row.id}`
                          : `maintenanceDomain:${row.id}`,
                      status: row.status === 'maintenance' ? 'success' : 'warning',
                    },
                    {
                      label: 'Analyser',
                      action: `analyzeDomain:${row.id}`,
                      status: 'primary',
                    },
                    {
                      label: 'Historique',
                      action: `showDomainHistory:${row.id}`,
                      status: 'info',
                    },
                  ],
                }),
              },
            ],
            actions: {
              activateDomain: async (id) => {
                console.log(`Activation du domaine ${id}...`);
                await fetch(`/api/business/domains/${id}/activate`, {
                  method: 'POST',
                });
                return { success: true, message: `Domaine ${id} activé` };
              },
              maintenanceDomain: async (id) => {
                console.log(`Mise en maintenance du domaine ${id}...`);
                await fetch(`/api/business/domains/${id}/maintenance`, {
                  method: 'POST',
                });
                return { success: true, message: `Domaine ${id} mis en maintenance` };
              },
              analyzeDomain: async (id) => {
                console.log(`Analyse du domaine ${id}...`);
                await fetch(`/api/business/domains/${id}/analyze`, {
                  method: 'POST',
                });
                return { success: true, message: `Analyse du domaine ${id} démarrée` };
              },
              showDomainHistory: async (id) => {
                return {
                  success: true,
                  action: 'showModal',
                  modalId: 'domain-history',
                  modalProps: { domainId: id },
                };
              },
            },
          },
        },
        {
          id: 'domain-distribution',
          title: 'Distribution par état',
          type: 'chart',
          size: 'md',
          chart: {
            id: 'domain-pie',
            title: 'Distribution des domaines',
            type: 'pie',
            data: {},
            dataSourceId: 'business-domains',
          },
        },
      ],
    },
    {
      id: 'traceability-analytics',
      title: 'Traçabilité & Analytics',
      description: "Analyse des traces d'exécution dans le domaine métier",
      widgets: [
        {
          id: 'business-flow-visualization',
          title: 'Flux des processus métier',
          type: 'flowChart',
          size: 'xl',
          dataSourceId: 'business-trace-events',
          flowChartConfig: {
            nodeField: 'event',
            edgesField: 'connections',
            nodeMetricField: 'count',
            nodeColorField: 'successRate',
          },
        },
        {
          id: 'business-trace-events-table',
          title: 'Événements de trace métier récents',
          type: 'table',
          size: 'lg',
          dataSourceId: 'business-trace-events',
          tableConfig: {
            columns: [
              { id: 'traceId', label: 'ID de trace', sortable: true },
              { id: 'event', label: 'Événement', sortable: true },
              { id: 'timestamp', label: 'Horodatage', sortable: true },
              { id: 'duration', label: 'Durée', sortable: true },
              { id: 'domainId', label: 'ID Domaine', sortable: true },
              {
                id: 'success',
                label: 'Succès',
                sortable: true,
                formatter: (value) => ({
                  value: value ? 'Oui' : 'Non',
                  status: value ? 'success' : 'error',
                }),
              },
              { id: 'parentTraceId', label: 'ID parent', sortable: true },
              {
                id: 'actions',
                label: 'Actions',
                sortable: false,
                formatter: (_value, row) => ({
                  actions: [
                    {
                      label: 'Détails',
                      action: `showTraceDetails:${row.traceId}`,
                      status: 'info',
                    },
                    {
                      label: 'Suivre',
                      action: `traceEvent:${row.traceId}`,
                      status: 'primary',
                    },
                  ],
                }),
              },
            ],
            actions: {
              showTraceDetails: async (id) => {
                return {
                  success: true,
                  action: 'showModal',
                  modalId: 'trace-details',
                  modalProps: { traceId: id },
                };
              },
              traceEvent: async (id) => {
                return { success: true, action: 'navigate', url: `/trace-explorer/${id}` };
              },
            },
          },
        },
        {
          id: 'cross-layer-business-impact',
          title: 'Impact métier des interactions inter-couches',
          type: 'chart',
          size: 'lg',
          dataSourceId: 'cross-layer-metrics',
          chart: {
            id: 'cross-layer-business-impact-chart',
            title: 'Impact métier des interactions',
            type: 'radar',
            data: {},
            refreshInterval: 60,
          },
        },
      ],
    },
    {
      id: 'model-usage',
      title: 'Utilisation des modèles',
      widgets: [
        {
          id: 'model-usage-management',
          title: 'Gestion des modèles métier',
          type: 'table',
          size: 'xl',
          dataSourceId: 'model-details',
          tableConfig: {
            columns: [
              { id: 'id', label: 'ID', sortable: true },
              { id: 'name', label: 'Nom', sortable: true },
              {
                id: 'tokensConsumed',
                label: 'Tokens consommés',
                sortable: true,
                formatter: (value) => {
                  return {
                    value: value.toLocaleString(),
                    status: value > 1000000 ? 'warning' : 'info',
                  };
                },
              },
              { id: 'requests', label: 'Requêtes', sortable: true },
              {
                id: 'costEstimate',
                label: 'Coût estimé',
                sortable: true,
                formatter: (value) => {
                  return {
                    value: `${value.toFixed(2)} €`,
                    status: value > 100 ? 'warning' : 'info',
                  };
                },
              },
              {
                id: 'averageLatency',
                label: 'Latence moyenne',
                sortable: true,
                formatter: (value) => {
                  return {
                    value: `${value} ms`,
                    status: value > 1000 ? 'error' : value > 500 ? 'warning' : 'success',
                  };
                },
              },
              {
                id: 'errorRate',
                label: "Taux d'erreur",
                sortable: true,
                formatter: (value) => {
                  return {
                    value: `${value.toFixed(2)}%`,
                    status: value > 5 ? 'error' : value > 1 ? 'warning' : 'success',
                  };
                },
              },
              { id: 'lastUsed', label: 'Dernière utilisation', sortable: true },
              {
                id: 'actions',
                label: 'Actions',
                sortable: false,
                formatter: (_value, row) => ({
                  actions: [
                    {
                      label: 'Optimiser',
                      action: `optimizeModel:${row.id}`,
                      status: 'primary',
                    },
                    {
                      label: 'Historique',
                      action: `showModelHistory:${row.id}`,
                      status: 'info',
                    },
                  ],
                }),
              },
            ],
            actions: {
              optimizeModel: async (id) => {
                console.log(`Optimisation du modèle ${id}...`);
                await fetch(`/api/business/models/${id}/optimize`, {
                  method: 'POST',
                });
                return { success: true, message: `Optimisation du modèle ${id} démarrée` };
              },
              showModelHistory: async (id) => {
                return {
                  success: true,
                  action: 'showModal',
                  modalId: 'model-history',
                  modalProps: { modelId: id },
                };
              },
            },
          },
        },
        {
          id: 'model-usage-chart',
          title: 'Consommation par modèle',
          type: 'chart',
          size: 'lg',
          chart: {
            id: 'model-usage-bar',
            title: 'Consommation par modèle',
            type: 'bar',
            data: {},
            dataSourceId: 'model-usage',
          },
        },
        {
          id: 'token-usage-trend',
          title: "Tendance d'utilisation des tokens",
          type: 'chart',
          size: 'lg',
          chart: {
            id: 'token-trend',
            title: 'Consommation de tokens sur 30 jours',
            type: 'line',
            data: {},
            dataSourceId: 'model-usage',
          },
        },
      ],
    },
    {
      id: 'governance-dashboard',
      title: 'Gouvernance & Décisions métier',
      description: 'Règles et décisions de gouvernance des domaines métier',
      widgets: [
        {
          id: 'business-governance-rules',
          title: 'Règles de gouvernance métier',
          type: 'table',
          size: 'lg',
          dataSourceId: 'governance-decisions',
          tableConfig: {
            columns: [
              { id: 'name', label: 'Nom', sortable: true },
              { id: 'description', label: 'Description', sortable: false },
              { id: 'priority', label: 'Priorité', sortable: true },
              {
                id: 'enabled',
                label: 'Active',
                sortable: true,
                formatter: (value) => ({
                  value: value ? 'Oui' : 'Non',
                  status: value ? 'success' : 'error',
                }),
              },
              { id: 'domainScope', label: 'Portée', sortable: true },
              { id: 'triggeredCount', label: 'Déclenchements', sortable: true },
              {
                id: 'actions',
                label: 'Actions',
                sortable: false,
                formatter: (_value, row) => ({
                  actions: [
                    {
                      label: row.enabled ? 'Désactiver' : 'Activer',
                      action: row.enabled ? `disableRule:${row.id}` : `enableRule:${row.id}`,
                      status: row.enabled ? 'warning' : 'success',
                    },
                    {
                      label: 'Éditer',
                      action: `editRule:${row.id}`,
                      status: 'info',
                    },
                  ],
                }),
              },
            ],
            actions: {
              disableRule: async (id) => {
                await fetch(`/api/governance/rules/${id}/disable`, {
                  method: 'POST',
                });
                return { success: true, message: `Règle ${id} désactivée` };
              },
              enableRule: async (id) => {
                await fetch(`/api/governance/rules/${id}/enable`, {
                  method: 'POST',
                });
                return { success: true, message: `Règle ${id} activée` };
              },
              editRule: async (id) => {
                return {
                  success: true,
                  action: 'showModal',
                  modalId: 'edit-rule',
                  modalProps: { ruleId: id },
                };
              },
            },
          },
        },
        {
          id: 'recent-business-decisions',
          title: 'Décisions métier récentes',
          type: 'timeline',
          size: 'lg',
          dataSourceId: 'governance-decisions',
          timelineConfig: {
            dateField: 'timestamp',
            titleField: 'ruleName',
            descriptionField: 'decision',
            statusField: 'result',
          },
        },
        {
          id: 'domain-influence-map',
          title: "Cartographie d'influence des domaines",
          type: 'network',
          size: 'xl',
          dataSourceId: 'domain-details',
          networkConfig: {
            nodeField: 'name',
            edgesField: 'influences',
            nodeValueField: 'migrationProgress',
            nodeGroupField: 'type',
            directed: true,
            physics: true,
          },
        },
      ],
    },
    {
      id: 'business-analytics',
      title: 'Analytiques métier',
      widgets: [
        {
          id: 'migration-performance',
          title: 'Performance des migrations',
          type: 'chart',
          size: 'lg',
          dataSourceId: 'migration-metrics',
          chart: {
            id: 'migration-performance-chart',
            title: 'Performance des migrations par domaine',
            type: 'scatter',
            data: {},
            refreshInterval: 90,
          },
        },
        {
          id: 'kpi-trends',
          title: 'Tendances KPIs',
          type: 'chart',
          size: 'lg',
          chart: {
            id: 'kpi-line',
            title: 'Évolution des KPIs',
            type: 'line',
            data: {},
            dataSourceId: 'business-kpis',
          },
        },
        {
          id: 'migration-progress',
          title: 'Progression des migrations',
          type: 'chart',
          size: 'md',
          chart: {
            id: 'migration-progress-bar',
            title: 'Progression par domaine',
            type: 'bar',
            data: {},
            dataSourceId: 'business-domains',
          },
        },
      ],
    },
  ],

  // Filtres disponibles
  filters: [
    {
      id: 'domainType',
      name: 'Type de domaine',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'ecommerce', label: 'E-commerce' },
        { value: 'content', label: 'Contenu' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'cms', label: 'CMS' },
        { value: 'api', label: 'API' },
      ],
      defaultValue: 'all',
    },
    {
      id: 'migrationStatus',
      name: 'Statut de migration',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'not-started', label: 'Non démarré' },
        { value: 'in-progress', label: 'En cours' },
        { value: 'completed', label: 'Terminé' },
        { value: 'failed', label: 'Échec' },
      ],
      defaultValue: 'all',
    },
    {
      id: 'period',
      name: 'Période',
      options: [
        { value: '7d', label: '7 jours' },
        { value: '30d', label: '30 jours' },
        { value: '90d', label: '90 jours' },
        { value: 'ytd', label: 'Depuis début année' },
        { value: 'all', label: "Tout l'historique" },
      ],
      defaultValue: '30d',
    },
    {
      id: 'circuitBreakerState',
      name: 'État du circuit',
      options: [
        { value: 'all', label: 'Tous les états' },
        { value: 'open', label: 'Ouverts' },
        { value: 'half-open', label: 'Semi-ouverts' },
        { value: 'closed', label: 'Fermés' },
      ],
      defaultValue: 'all',
    },
    {
      id: 'traceStatus',
      name: 'Statut des traces',
      options: [
        { value: 'all', label: 'Toutes' },
        { value: 'success', label: 'Réussies' },
        { value: 'error', label: 'En erreur' },
      ],
      defaultValue: 'all',
    },
    {
      id: 'complexityLevel',
      name: 'Niveau de complexité',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'low', label: 'Faible' },
        { value: 'medium', label: 'Moyen' },
        { value: 'high', label: 'Élevé' },
        { value: 'very-high', label: 'Très élevé' },
      ],
      defaultValue: 'all',
    },
  ],

  // Actions disponibles
  actions: [
    {
      id: 'generate-report',
      name: 'Générer rapport',
      handler: async () => {
        try {
          const response = await fetch('/api/business/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }

          console.log('Report generated successfully');
          return Promise.resolve();
        } catch (error) {
          console.error('Failed to generate report:', error);
          return Promise.reject(error);
        }
      },
      colorScheme: 'green',
    },
    {
      id: 'analyze-domains',
      name: 'Analyser les domaines',
      handler: async () => {
        try {
          const response = await fetch('/api/business/analyze-domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }

          console.log('Domain analysis started successfully');
          return Promise.resolve();
        } catch (error) {
          console.error('Failed to start domain analysis:', error);
          return Promise.reject(error);
        }
      },
      colorScheme: 'blue',
    },
    {
      id: 'optimize-model-usage',
      name: 'Optimiser utilisation modèles',
      handler: async () => {
        try {
          const response = await fetch('/api/business/optimize-model-usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }

          console.log('Model usage optimization started');
          return Promise.resolve();
        } catch (error) {
          console.error('Failed to optimize model usage:', error);
          return Promise.reject(error);
        }
      },
      colorScheme: 'purple',
    },
    {
      id: 'reset-business-circuit-breakers',
      name: 'Réinitialiser tous les circuits',
      handler: async () => {
        try {
          await fetch('/api/business/circuit-breakers/reset-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          return { success: true, message: 'Tous les circuit breakers réinitialisés' };
        } catch (error) {
          console.error('Failed to reset circuit breakers:', error);
          return { success: false, message: 'Échec de la réinitialisation des circuit breakers' };
        }
      },
      colorScheme: 'red',
    },
    {
      id: 'toggle-fallback-mode',
      name: 'Basculer mode repli global',
      handler: async () => {
        try {
          await fetch('/api/business/fallback/toggle-global', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          return { success: true, message: 'Mode de repli global basculé avec succès' };
        } catch (error) {
          console.error('Failed to toggle fallback mode:', error);
          return { success: false, message: 'Échec du basculement du mode de repli' };
        }
      },
      colorScheme: 'orange',
    },
    {
      id: 'update-migration-plan',
      name: 'Mettre à jour le plan de migration',
      handler: async () => {
        try {
          await fetch('/api/business/migrations/update-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          return { success: true, message: 'Plan de migration mis à jour avec succès' };
        } catch (error) {
          console.error('Failed to update migration plan:', error);
          return { success: false, message: 'Échec de la mise à jour du plan de migration' };
        }
      },
      colorScheme: 'teal',
    },
  ],
};

// Interface pour les props du composant
interface BusinessDashboardProps {
  config?: Partial<DashboardConfig>;
  onLayerChange?: (layer: 'orchestration' | 'agents' | 'business' | 'all') => void;
  className?: string;
}

/**
 * Tableau de bord pour la couche métier
 */
const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  config = {},
  onLayerChange,
  className,
}) => {
  // État local pour la configuration fusionnée
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    ...defaultBusinessConfig,
    ...config,
    // Fusionner les sources de données
    dataSources: [...defaultBusinessConfig.dataSources, ...(config.dataSources || [])],
    // Fusionner les sections
    sections: [...defaultBusinessConfig.sections, ...(config.sections || [])],
    // Fusionner les filtres
    filters: [...(defaultBusinessConfig.filters || []), ...(config.filters || [])],
    // Fusionner les actions
    actions: [...(defaultBusinessConfig.actions || []), ...(config.actions || [])],
  });

  // États locaux pour les données temps réel
  const [circuitBreakerStats, setCircuitBreakerStats] = useState<{
    open: number;
    halfOpen: number;
    closed: number;
    total: number;
  }>({
    open: 1,
    halfOpen: 0,
    closed: 8,
    total: 9,
  });

  const [recentTraces, setRecentTraces] = useState<TraceEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Effet pour charger les données réelles
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Charger les stats des circuit breakers
        const cbResponse = await fetch('/api/business/circuit-breakers/stats');
        if (cbResponse.ok) {
          const cbStats = await cbResponse.json();
          setCircuitBreakerStats(cbStats);
        }

        // Charger les traces récentes
        const tracesResponse = await fetch('/api/traceability/events?layer=business&limit=10');
        if (tracesResponse.ok) {
          const traces = await tracesResponse.json();
          setRecentTraces(traces);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
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
      setDashboardConfig((prevConfig) => {
        // Simuler des mises à jour pour quelques métriques
        const updatedSections = prevConfig.sections.map((section) => ({
          ...section,
          widgets: section.widgets.map((widget) => {
            if (widget.id === 'domain-status' && widget.metrics) {
              return {
                ...widget,
                metrics: widget.metrics.map((metric) => {
                  if (metric.id === 'active-domains') {
                    return { ...metric, value: Math.floor(Math.random() * 20) + 5 };
                  }
                  if (metric.id === 'pending-migrations') {
                    return { ...metric, value: Math.floor(Math.random() * 8) };
                  }
                  if (metric.id === 'failed-domains') {
                    return { ...metric, value: Math.floor(Math.random() * 3) };
                  }
                  return metric;
                }),
              };
            }
            if (widget.id === 'model-usage-summary' && widget.metrics) {
              return {
                ...widget,
                metrics: widget.metrics.map((metric) => {
                  if (metric.id === 'tokens-consumed') {
                    return { ...metric, value: Math.floor(Math.random() * 500000) + 100000 };
                  }
                  if (metric.id === 'api-requests') {
                    return { ...metric, value: Math.floor(Math.random() * 5000) + 1000 };
                  }
                  if (metric.id === 'cost-estimate') {
                    return { ...metric, value: `${(Math.random() * 100 + 20).toFixed(2)} €` };
                  }
                  return metric;
                }),
              };
            }
            if (widget.id === 'business-kpis-summary' && widget.metrics) {
              return {
                ...widget,
                metrics: widget.metrics.map((metric) => {
                  if (metric.id === 'migration-success-rate') {
                    const rate = Math.floor(Math.random() * 25) + 75;
                    return {
                      ...metric,
                      value: `${rate}%`,
                      status: rate > 90 ? 'success' : rate > 75 ? 'warning' : 'error',
                    };
                  }
                  if (metric.id === 'avg-migration-time') {
                    return { ...metric, value: `${Math.floor(Math.random() * 10) + 2} jours` };
                  }
                  if (metric.id === 'business-complexity') {
                    const complexities = ['Faible', 'Moyenne', 'Élevée', 'Très élevée'];
                    return {
                      ...metric,
                      value: complexities[Math.floor(Math.random() * complexities.length)],
                    };
                  }
                  return metric;
                }),
              };
            }
            return widget;
          }),
        }));

        return { ...prevConfig, sections: updatedSections };
      });
    };

    // Simuler des mises à jour de données périodiques
    const interval = setInterval(simulateDataUpdate, 7000);

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
          recentTraces,
        }}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      />
    </Box>
  );
};

export default BusinessDashboard;
