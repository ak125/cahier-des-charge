/**
 * Configuration centralisée pour les tableaux de bord et outils de migration
 */

const path = require('path');
const os = require('os');
const fs = require('fs-extra');

/**
 * Racine du projet
 */
const ROOT_DIR = path.resolve(process.cwd());

/**
 * Chemins principaux
 */
const PATHS = {
  ROOT: ROOT_DIR,
  SCRIPTS_DIR: path.join(ROOT_DIR, 'scripts'),
  REPORTS_DIR: path.join(ROOT_DIR, 'reports'),
  EXECUTION_REPORTS: path.join(ROOT_DIR, 'reports', 'execution'),
  MODULE_REPORTS: path.join(ROOT_DIR, 'reports', 'modules'),
  METRICS_REPORTS: path.join(ROOT_DIR, 'reports', 'metrics'),
  DASHBOARD_DIR: path.join(ROOT_DIR, 'dashboard'),
  LAYERED_DASHBOARDS_DIR: path.join(ROOT_DIR, 'layered-dashboards'),
  AUDIT_REPORTS: path.join(ROOT_DIR, 'audit', 'reports'),
  MODULES_DIR: path.join(ROOT_DIR, 'modules')
};

/**
 * Configuration du dashboard
 */
const DASHBOARD = {
  PORT: process.env.DASHBOARD_PORT || 3000,
  AUDIT_PORT: process.env.AUDIT_DASHBOARD_PORT || 3002,
  AGENTS_PORT: process.env.AGENTS_DASHBOARD_PORT || 3003,
  UNIFIED_PORT: process.env.UNIFIED_DASHBOARD_PORT || 3001
};

/**
 * Configuration des étapes de migration
 */
const MIGRATION = {
  STEPS: [
    {
      name: "Analyse initiale",
      agents: ["legacy-discovery", "complexity-analyzer"],
      priority: "high"
    },
    {
      name: "Audit des fichiers",
      agents: ["code-auditor", "sql-analyzer"],
      priority: "high"
    },
    {
      name: "Planification",
      agents: ["migration-planner", "dependency-analyzer"],
      priority: "medium"
    },
    {
      name: "Migration backend",
      agents: ["nestjs-adapter", "prisma-adapter"],
      priority: "high"
    },
    {
      name: "Migration frontend",
      agents: ["remix-converter", "ui-generator"],
      priority: "high"
    },
    {
      name: "Tests et validation",
      agents: ["test-generator", "validator"],
      priority: "medium"
    },
    {
      name: "Optimisation SEO",
      agents: ["seo-validator", "redirect-handler"],
      priority: "medium"
    },
    {
      name: "Déploiement",
      agents: ["ci-configurator", "deployment-validator"],
      priority: "low"
    }
  ]
};

/**
 * S'assurer que les répertoires requis existent
 */
Object.values(PATHS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.warn(`Impossible de créer le répertoire ${dir}: ${error.message}`);
    }
  }
});

/**
 * Exporter la configuration centralisée
 */
function loadConfig() {
  return {
    PATHS,
    DASHBOARD,
    MIGRATION
  };
}

module.exports = {
  loadConfig
};