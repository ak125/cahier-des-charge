/**
 * Dashboard spécifique à la couche d'orchestration
 * Affiche les métriques et l'état de santé de l'infrastructure d'orchestration
 */
import React, { useEffect, useState } from 'react';
import { CircuitState } from ..@cahier-des-charge/coordination/src/utils/circuit-breaker/base-circuit-breaker';
import { TraceEvent } from ..@cahier-des-charge/coordination/src/utils/traceability/traceability-service';
import BaseDashboard, { DashboardConfig } from './base-dashboard';

// Configuration du tableau de bord d'orchestration
const orchestrationDashboardConfig: DashboardConfig = {
  title: "Tableau de bord d'orchestration",
  description: "Supervision et contrôle de la couche d'orchestration de l'architecture à 3 couches",
  layer: 'orchestration',
  refreshInterval: 30, // rafraîchir toutes les 30 secondes

  // Sources de données pour ce tableau de bord
  dataSources: [
    {
      id: 'orchestration-status',
      name: 'État des orchestrateurs',
      url: '/api/orchestration/status',
      refreshInterval: 15,
    },
    {
      id: 'workflows-metrics',
      name: 'Métriques des workflows',
      url: '/api/orchestration/workflows/metrics',
      refreshInterval: 60,
    },
    {
      id: 'task-queue-stats',
      name: "Statistiques des files d'attente",
      url: '/api/orchestration/queues',
      refreshInterval: 30,
    },
    {
      id: 'resource-allocation',
      name: 'Allocation des ressources',
      url: '/api/orchestration/resources',
      refreshInterval: 120,
    },
    {
      id: 'circuit-breakers',
      name: 'État des circuit breakers',
      url: '/api/orchestration/circuit-breakers',
      refreshInterval: 30,
    },
    {
      id: 'trace-events',
      name: 'Événements de trace',
      url: '/api/traceability/events',
      refreshInterval: 15,
    },
    {
      id: 'cross-layer-metrics',
      name: 'Métriques inter-couches',
      url: '/api/traceability/cross-layer-metrics',
      refreshInterval: 45,
    },
    {
      id: 'workflow-details',
      name: 'Détails des workflows',
      url: '/api/orchestration/workflows/details',
      refreshInterval: 60,
    },
    {
      id: 'governance-decisions',
      name: 'Décisions de gouvernance',
      url: '/api/governance/decisions',
      refreshInterval: 90,
    },
  ],

  // Filtres disponibles
  filters: [
    {
      id: 'environment',
      name: 'Environnement',
      options: [
        { value: 'all', label: 'Tous les environnements' },
        { value: 'production', label: 'Production' },
        { value: 'staging', label: 'Pré-production' },
        { value: 'development', label: 'Développement' },
      ],
      defaultValue: 'all',
    },
    {
      id: 'timeRange',
      name: 'Période',
      options: [
        { value: '15m', label: '15 dernières minutes' },
        { value: '1h', label: 'Dernière heure' },
        { value: '6h', label: '6 dernières heures' },
        { value: '24h', label: '24 dernières heures' },
        { value: '7d', label: '7 derniers jours' },
        { value: '30d', label: '30 derniers jours' },
      ],
      defaultValue: '6h',
    },
    {
      id: 'workflowType',
      name: 'Type de workflow',
      options: [
        { value: 'all', label: 'Tous les types' },
        { value: 'n8n', label: 'n8n' },
        { value: 'bullmq', label: 'BullMQ' },
        { value: 'shell', label: 'Scripts Shell' },
        { value: 'temporal', label: 'Temporal' },
      ],
      defaultValue: 'all',
    },
    {
      id: 'circuitBreakerState',
      name: 'État des circuits',
      options: [
        { value: 'all', label: 'Tous les états' },
        { value: 'open', label: 'Ouverts' },
        { value: 'half-open', label: 'Semi-ouverts' },
        { value: 'closed', label: 'Fermés' },
      ],
      defaultValue: 'all',
    },
  ],

  // Actions disponibles
  actions: [
    {
      id: 'reset-circuit-breakers',
      name: 'Réinitialiser tous les circuit breakers',
      handler: async () => {
        console.log('Réinitialisation des circuit breakers...');
        // Dans une implémentation réelle, on appellerait une API
        await fetch('/api/orchestration/circuit-breakers/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Circuit breakers réinitialisés avec succès');
        return { success: true, message: 'Circuit breakers réinitialisés avec succès' };
      },
    },
    {
      id: 'pause-all-workflows',
      name: 'Mettre en pause tous les workflows',
      handler: async () => {
        console.log('Mise en pause des workflows...');
        // Dans une implémentation réelle, on appellerait une API
        await fetch('/api/orchestration/workflows/pause-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Workflows mis en pause avec succès');
        return { success: true, message: 'Workflows mis en pause avec succès' };
      },
    },
    {
      id: 'restart-failed-workflows',
      name: 'Redémarrer les workflows en échec',
      handler: async () => {
        console.log('Redémarrage des workflows en échec...');
        await fetch('/api/orchestration/workflows/restart-failed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Workflows en échec redémarrés avec succès');
        return { success: true, message: 'Workflows en échec redémarrés avec succès' };
      },
    },
    {
      id: 'clear-failed-tasks',
      name: 'Nettoyer les tâches en échec',
      handler: async () => {
        console.log('Nettoyage des tâches en échec...');
        await fetch('/api/orchestration/tasks/clear-failed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Tâches en échec nettoyées avec succès');
        return { success: true, message: 'Tâches en échec nettoyées avec succès' };
      },
    },
    {
      id: 'export-metrics',
      name: 'Exporter les métriques (CSV)',
      handler: async () => {
        console.log('Export des métriques...');
        const response = await fetch('/api/orchestration/metrics/export', {
          method: 'GET',
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `orchestration-metrics-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        console.log('Métriques exportées avec succès');
        return { success: true, message: 'Métriques exportées avec succès' };
      },
    },
    {
      id: 'trigger-health-check',
      name: 'Exécuter diagnostic complet',
      handler: async () => {
        console.log('Exécution du diagnostic de santé...');
        await fetch('/api/orchestration/health-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Diagnostic de santé terminé');
        return { success: true, message: 'Diagnostic de santé terminé' };
      },
    },
  ],

  // Sections du tableau de bord
  sections: [
    {
      id: 'orchestration-health',
      title: 'État de santé global',
      description: "Vue d'ensemble de l'état de santé de la couche d'orchestration",
      widgets: [
        {
          id: 'orchestration-status-summary',
          title: 'État des orchestrateurs',
          type: 'status',
          size: 'xl',
          dataSourceId: 'orchestration-status',
          metrics: [
            {
              id: 'temporal-health',
              name: 'Temporal',
              value: 'Opérationnel',
              status: 'success',
            },
            {
              id: 'n8n-health',
              name: 'n8n',
              value: 'Opérationnel',
              status: 'success',
            },
            {
              id: 'bullmq-health',
              name: 'BullMQ',
              value: 'Opérationnel',
              status: 'success',
            },
            {
              id: 'kafka-health',
              name: 'Kafka',
              value: 'Dégradé',
              status: 'warning',
            },
            {
              id: 'mcp-health',
              name: 'MCP',
              value: 'Opérationnel',
              status: 'success',
            },
          ],
        },
        {
          id: 'circuit-breakers-status',
          title: 'Circuit Breakers',
          type: 'status',
          size: 'md',
          dataSourceId: 'circuit-breakers',
          metrics: [
            {
              id: 'open-breakers',
              name: 'Ouverts',
              value: 2,
              status: 'error',
            },
            {
              id: 'half-open-breakers',
              name: 'Semi-ouverts',
              value: 1,
              status: 'warning',
            },
            {
              id: 'closed-breakers',
              name: 'Fermés',
              value: 12,
              status: 'success',
            },
          ],
        },
        {
          id: 'trace-propagation',
          title: 'Propagation des traces',
          type: 'status',
          size: 'md',
          dataSourceId: 'cross-layer-metrics',
          metrics: [
            {
              id: 'trace-success-rate',
              name: 'Taux de propagation',
              value: '98.5%',
              status: 'success',
            },
            {
              id: 'trace-latency',
              name: 'Latence moyenne',
              value: '45ms',
              status: 'success',
            },
            {
              id: 'trace-errors',
              name: 'Erreurs de trace',
              value: '12',
              status: 'warning',
            },
          ],
        },
      ],
    },
    {
      id: 'circuit-breaker-management',
      title: 'Gestion des Circuit Breakers',
      description: 'Supervision et contrôle des mécanismes de résilience',
      widgets: [
        {
          id: 'circuit-breaker-details',
          title: 'État détaillé des Circuit Breakers',
          type: 'table',
          size: 'xl',
          dataSourceId: 'circuit-breakers',
          tableConfig: {
            columns: [
              { id: 'id', label: 'ID', sortable: true },
              { id: 'name', label: 'Nom', sortable: true },
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
              { id: 'targetWorkflowId', label: 'Workflow ciblé', sortable: true },
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
                      label: 'Forcer ouvert',
                      action: `forceOpenCircuitBreaker:${row.id}`,
                      status: row.state === 'open' ? 'disabled' : 'danger',
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
                await fetch(`/api/orchestration/circuit-breakers/${id}/reset`, {
                  method: 'POST',
                });
                return { success: true, message: `Circuit breaker ${id} réinitialisé` };
              },
              forceOpenCircuitBreaker: async (id) => {
                console.log(`Ouverture forcée du circuit breaker ${id}...`);
                await fetch(`/api/orchestration/circuit-breakers/${id}/force-open`, {
                  method: 'POST',
                });
                return { success: true, message: `Circuit breaker ${id} forcé ouvert` };
              },
              showCircuitBreakerDetails: async (id) => {
                console.log(`Affichage des détails du circuit breaker ${id}...`);
                // Cette action pourrait ouvrir une modal avec les détails
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
          dataSourceId: 'circuit-breakers',
          timelineConfig: {
            dateField: 'timestamp',
            titleField: 'event',
            descriptionField: 'description',
            statusField: 'status',
            filters: ['breakerId'],
          },
        },
      ],
    },
    {
      id: 'workflow-metrics',
      title: 'Métriques des workflows',
      description: "Performance et santé des workflows d'orchestration",
      widgets: [
        {
          id: 'workflow-throughput',
          title: 'Débit des workflows',
          type: 'chart',
          size: 'lg',
          dataSourceId: 'workflows-metrics',
          chart: {
            id: 'workflow-throughput-chart',
            title: 'Exécutions par minute',
            type: 'line',
            data: {},
            refreshInterval: 60,
          },
        },
        {
          id: 'workflow-success-rate',
          title: 'Taux de succès',
          type: 'chart',
          size: 'md',
          dataSourceId: 'workflows-metrics',
          chart: {
            id: 'workflow-success-chart',
            title: 'Taux de succès (%)',
            type: 'area',
            data: {},
            refreshInterval: 60,
          },
        },
        {
          id: 'workflow-latency',
          title: 'Latence des workflows',
          type: 'chart',
          size: 'md',
          dataSourceId: 'workflows-metrics',
          chart: {
            id: 'workflow-latency-chart',
            title: "Temps d'exécution moyen (ms)",
            type: 'bar',
            data: {},
            refreshInterval: 60,
          },
        },
        {
          id: 'workflow-management',
          title: 'Gestion des workflows',
          type: 'table',
          size: 'xl',
          dataSourceId: 'workflow-details',
          tableConfig: {
            columns: [
              { id: 'id', label: 'ID', sortable: true },
              { id: 'name', label: 'Nom', sortable: true },
              { id: 'type', label: 'Type', sortable: true },
              {
                id: 'status',
                label: 'État',
                sortable: true,
                formatter: (value) => {
                  switch (value) {
                    case 'active':
                      return { value: 'Actif', status: 'success' };
                    case 'inactive':
                      return { value: 'Inactif', status: 'info' };
                    case 'failed':
                      return { value: 'Échec', status: 'error' };
                    case 'paused':
                      return { value: 'En pause', status: 'warning' };
                    default:
                      return { value: value, status: 'info' };
                  }
                },
              },
              { id: 'executionCount', label: 'Exécutions', sortable: true },
              {
                id: 'successRate',
                label: 'Taux de succès',
                sortable: true,
                formatter: (value) => {
                  const percentage = typeof value === 'number' ? `${value.toFixed(1)}%` : value;
                  let status = 'info';
                  if (typeof value === 'number') {
                    if (value >= 95) status = 'success';
                    else if (value >= 75) status = 'warning';
                    else status = 'error';
                  }
                  return { value: percentage, status };
                },
              },
              { id: 'lastExecution', label: 'Dernière exécution', sortable: true },
              {
                id: 'avgDuration',
                label: 'Durée moyenne',
                sortable: true,
                formatter: (value) => {
                  if (typeof value !== 'number') return { value, status: 'info' };
                  return {
                    value: value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(2)}s`,
                    status: value < 2000 ? 'success' : value < 5000 ? 'warning' : 'error',
                  };
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
                      label: row.status === 'paused' ? 'Reprendre' : 'Pause',
                      action:
                        row.status === 'paused'
                          ? `resumeWorkflow:${row.id}`
                          : `pauseWorkflow:${row.id}`,
                      status: row.status === 'paused' ? 'success' : 'warning',
                    },
                    {
                      label: 'Réexécuter',
                      action: `rerunWorkflow:${row.id}`,
                      status: 'primary',
                    },
                    {
                      label: 'Logs',
                      action: `showWorkflowLogs:${row.id}`,
                      status: 'info',
                    },
                  ],
                }),
              },
            ],
            actions: {
              pauseWorkflow: async (id) => {
                console.log(`Mise en pause du workflow ${id}...`);
                await fetch(`/api/orchestration/workflows/${id}/pause`, {
                  method: 'POST',
                });
                return { success: true, message: `Workflow ${id} mis en pause` };
              },
              resumeWorkflow: async (id) => {
                console.log(`Reprise du workflow ${id}...`);
                await fetch(`/api/orchestration/workflows/${id}/resume`, {
                  method: 'POST',
                });
                return { success: true, message: `Workflow ${id} repris` };
              },
              rerunWorkflow: async (id) => {
                console.log(`Réexécution du workflow ${id}...`);
                await fetch(`/api/orchestration/workflows/${id}/rerun`, {
                  method: 'POST',
                });
                return { success: true, message: `Workflow ${id} relancé` };
              },
              showWorkflowLogs: async (id) => {
                console.log(`Affichage des logs du workflow ${id}...`);
                // Cette action pourrait ouvrir une modal avec les logs
                return {
                  success: true,
                  action: 'showModal',
                  modalId: 'workflow-logs',
                  modalProps: { workflowId: id },
                };
              },
            },
          },
        },
      ],
    },
    {
      id: 'queue-metrics',
      title: "Files d'attente",
      description: "État et performances des files d'attente de tâches",
      widgets: [
        {
          id: 'queue-depth',
          title: "Profondeur des files d'attente",
          type: 'status',
          size: 'lg',
          dataSourceId: 'task-queue-stats',
          metrics: [
            {
              id: 'high-priority-queue',
              name: 'File prioritaire',
              value: '12',
              status: 'success',
              trend: -5,
            },
            {
              id: 'normal-priority-queue',
              name: 'File normale',
              value: '345',
              status: 'warning',
              trend: 15,
            },
            {
              id: 'low-priority-queue',
              name: 'File basse priorité',
              value: '1,234',
              status: 'error',
              trend: 25,
            },
            {
              id: 'failed-queue',
              name: "File d'échecs",
              value: '7',
              status: 'warning',
              trend: -10,
            },
          ],
        },
        {
          id: 'queue-processing-rate',
          title: 'Taux de traitement',
          type: 'chart',
          size: 'md',
          dataSourceId: 'task-queue-stats',
          chart: {
            id: 'queue-processing-chart',
            title: 'Tâches traitées par seconde',
            type: 'bar',
            data: {},
            refreshInterval: 30,
          },
        },
      ],
    },
    {
      id: 'traceability-analytics',
      title: 'Traçabilité & Analytics',
      description: "Analyse des traces d'exécution à travers les couches",
      widgets: [
        {
          id: 'trace-flow-visualization',
          title: 'Flux des opérations',
          type: 'flowChart',
          size: 'xl',
          dataSourceId: 'trace-events',
          flowChartConfig: {
            nodeField: 'event',
            edgesField: 'connections',
            nodeMetricField: 'count',
            nodeColorField: 'successRate',
          },
        },
        {
          id: 'trace-events-table',
          title: 'Événements de trace récents',
          type: 'table',
          size: 'lg',
          dataSourceId: 'trace-events',
          tableConfig: {
            columns: [
              { id: 'traceId', label: 'ID de trace', sortable: true },
              { id: 'event', label: 'Événement', sortable: true },
              { id: 'timestamp', label: 'Horodatage', sortable: true },
              { id: 'duration', label: 'Durée', sortable: true },
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
                      action: `traceWorkflow:${row.traceId}`,
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
              traceWorkflow: async (id) => {
                return { success: true, action: 'navigate', url: `/trace-explorer/${id}` };
              },
            },
          },
        },
        {
          id: 'cross-layer-performance',
          title: 'Performance inter-couches',
          type: 'chart',
          size: 'lg',
          dataSourceId: 'cross-layer-metrics',
          chart: {
            id: 'cross-layer-performance-chart',
            title: 'Temps de traitement par couche (ms)',
            type: 'bar',
            data: {},
            refreshInterval: 60,
          },
        },
      ],
    },
    {
      id: 'governance-dashboard',
      title: 'Gouvernance & Prise de décision',
      description: 'Règles et décisions de gouvernance entre couches',
      widgets: [
        {
          id: 'governance-rules',
          title: 'Règles de gouvernance actives',
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
              { id: 'triggeredCount', label: 'Déclenchements', sortable: true },
              { id: 'lastTriggered', label: 'Dernier déclenchement', sortable: true },
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
                console.log(`Désactivation de la règle ${id}...`);
                await fetch(`/api/governance/rules/${id}/disable`, {
                  method: 'POST',
                });
                return { success: true, message: `Règle ${id} désactivée` };
              },
              enableRule: async (id) => {
                console.log(`Activation de la règle ${id}...`);
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
          id: 'recent-decisions',
          title: 'Décisions récentes',
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
      ],
    },
    {
      id: 'resource-usage',
      title: 'Utilisation des ressources',
      description: "Consommation de ressources par l'infrastructure d'orchestration",
      widgets: [
        {
          id: 'cpu-usage',
          title: 'Utilisation CPU',
          type: 'chart',
          size: 'md',
          dataSourceId: 'resource-allocation',
          chart: {
            id: 'cpu-usage-chart',
            title: 'Utilisation CPU (%)',
            type: 'line',
            data: {},
            refreshInterval: 30,
          },
        },
        {
          id: 'memory-usage',
          title: 'Utilisation mémoire',
          type: 'chart',
          size: 'md',
          dataSourceId: 'resource-allocation',
          chart: {
            id: 'memory-usage-chart',
            title: 'Utilisation mémoire (GB)',
            type: 'line',
            data: {},
            refreshInterval: 30,
          },
        },
        {
          id: 'disk-io',
          title: 'I/O disque',
          type: 'chart',
          size: 'md',
          dataSourceId: 'resource-allocation',
          chart: {
            id: 'disk-io-chart',
            title: 'Opérations I/O par seconde',
            type: 'area',
            data: {},
            refreshInterval: 30,
          },
        },
        {
          id: 'network-throughput',
          title: 'Débit réseau',
          type: 'chart',
          size: 'md',
          dataSourceId: 'resource-allocation',
          chart: {
            id: 'network-throughput-chart',
            title: 'Débit réseau (MB/s)',
            type: 'area',
            data: {},
            refreshInterval: 30,
          },
        },
      ],
    },
  ],
};

interface OrchestrationDashboardProps {
  onLayerChange?: (layer: 'orchestration' | 'agents' | 'business' | 'all') => void;
}

/**
 * Composant de tableau de bord pour la couche d'orchestration
 */
const OrchestrationDashboard: React.FC<OrchestrationDashboardProps> = ({ onLayerChange }) => {
  // État pour les données en direct
  const [circuitBreakerStats, setCircuitBreakerStats] = useState<{
    open: number;
    halfOpen: number;
    closed: number;
    total: number;
  }>({
    open: 2,
    halfOpen: 1,
    closed: 12,
    total: 15,
  });

  const [recentTraces, setRecentTraces] = useState<TraceEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Effet pour charger les données au chargement et toutes les 30 secondes
  useEffect(() => {
    // Fonction qui charge les données
    const loadDashboardData = async () => {
      try {
        // Charger les stats des circuit breakers
        const cbResponse = await fetch('/api/orchestration/circuit-breakers/stats');
        if (cbResponse.ok) {
          const cbStats = await cbResponse.json();
          setCircuitBreakerStats(cbStats);
        }

        // Charger les traces récentes
        const tracesResponse = await fetch('/api/traceability/events?limit=10');
        if (tracesResponse.ok) {
          const traces = await tracesResponse.json();
          setRecentTraces(traces);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
      }
    };

    // Charger les données immédiatement
    loadDashboardData();

    // Puis configurer l'intervalle de rafraîchissement
    const intervalId = setInterval(loadDashboardData, 30000);

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, []);

  return (
    <BaseDashboard
      config={orchestrationDashboardConfig}
      onLayerChange={onLayerChange}
      data={{
        circuitBreakerStats,
        recentTraces,
      }}
      onTabChange={setActiveTab}
      activeTab={activeTab}
    />
  );
};

export default OrchestrationDashboard;
