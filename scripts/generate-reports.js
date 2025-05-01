#!/usr/bin/env node

/**
 * Script de génération de rapports périodiques pour le suivi du pipeline MCP
 * Génère des rapports quotidiens et hebdomadaires sur l'état des migrations
 *
 * Usage:
 *   node generate-reports.js --type=daily|weekly
 */

const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const CONFIG = {
  // Chemins des fichiers
  statusPath: path.resolve(__dirname, '../status.json'),
  logsPath: path.resolve(__dirname, '../logs/error.log'),
  redisJobsPath: path.resolve(__dirname, '../logs/jobs.redis.json'),

  // Dossier de sortie pour les rapports générés
  reportsOutputDir: path.resolve(__dirname, '../reports'),

  // Configuration des emails
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || 'mcp-pipeline@example.com',
    to: process.env.EMAIL_TO || 'team@example.com',
  },

  // Configuration Supabase (optionnelle)
  supabase: {
    enabled: process.env.SUPABASE_URL && process.env.SUPABASE_KEY,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
};

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    const reportType = getReportType();
    console.log(
      `Génération d'un rapport ${reportType === 'daily' ? 'quotidien' : 'hebdomadaire'}...`
    );

    // Charger les données
    const statusData = await loadStatusData();
    const errorLogs = await loadErrorLogs();
    const jobsData = await loadJobsData();

    // Générer les métriques
    const metrics = generateMetrics(statusData, jobsData);

    // Générer le rapport
    const reportData = {
      type: reportType,
      date: new Date().toISOString().split('T')[0],
      statusData,
      errorLogs: errorLogs.slice(-20), // 20 dernières erreurs
      metrics,
      period: reportType === 'daily' ? 'dernières 24h' : '7 derniers jours',
    };

    // Assembler le rapport
    const report = await generateReport(reportData);

    // Sauvegarder le rapport dans un fichier
    await saveReport(report, reportType);

    // Envoyer le rapport par email si configuré
    if (CONFIG.email.enabled) {
      await emailReport(report, reportType);
    }

    // Synchroniser avec Supabase si configuré
    if (CONFIG.supabase.enabled) {
      await syncReportToSupabase(reportData);
    }

    console.log(`Rapport ${reportType} généré avec succès!`);
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    process.exit(1);
  }
}

/**
 * Détermine le type de rapport à générer (quotidien ou hebdomadaire)
 */
function getReportType() {
  const args = process.argv.slice(2);
  const typeArg = args.find((arg) => arg.startsWith('--type='));

  if (typeArg) {
    const type = typeArg.split('=')[1];
    if (['daily', 'weekly'].includes(type)) {
      return type;
    }
  }

  const today = new Date();
  // Par défaut, rapport hebdomadaire le dimanche, quotidien les autres jours
  return today.getDay() === 0 ? 'weekly' : 'daily';
}

/**
 * Charge les données depuis le fichier status.json
 */
async function loadStatusData() {
  try {
    const content = await fs.readFile(CONFIG.statusPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erreur lors de la lecture de status.json:', error);
    return {
      lastUpdated: new Date().toISOString(),
      summary: { total: 0, pending: 0, done: 0, invalid: 0 },
      files: {},
    };
  }
}

/**
 * Charge les erreurs depuis le fichier de log
 */
async function loadErrorLogs() {
  try {
    const content = await fs.readFile(CONFIG.logsPath, 'utf8');
    return content.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Erreur lors de la lecture des logs:', error);
    return [];
  }
}

/**
 * Charge les données des jobs depuis jobs.redis.json
 */
async function loadJobsData() {
  try {
    const content = await fs.readFile(CONFIG.redisJobsPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erreur lors de la lecture de jobs.redis.json:', error);
    return { active: [], waiting: [], completed: [], failed: [] };
  }
}

/**
 * Génère des métriques pour le rapport
 */
function generateMetrics(statusData, jobsData) {
  const files = Object.values(statusData.files);
  const _now = Date.now();

  // Temps de traitement moyen
  const completedJobs = jobsData.completed || [];
  let avgProcessingTime = 0;

  if (completedJobs.length > 0) {
    const processingTimes = completedJobs
      .filter((job) => job.timestamp && job.completedOn)
      .map((job) => (job.completedOn - job.timestamp) / 1000); // en secondes

    if (processingTimes.length > 0) {
      avgProcessingTime =
        processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    }
  }

  // Taux de succès
  const successRate = (statusData.summary.done / (statusData.summary.total || 1)) * 100;

  // Identifier les agents les plus chargés et leurs erreurs
  const agentStats = {};
  files.forEach((file) => {
    if (!agentStats[file.agent]) {
      agentStats[file.agent] = { total: 0, done: 0, invalid: 0 };
    }

    agentStats[file.agent].total++;

    if (file.status === 'done') {
      agentStats[file.agent].done++;
    } else if (file.status === 'invalid') {
      agentStats[file.agent].invalid++;
    }
  });

  const agentsMetrics = Object.entries(agentStats)
    .map(([agent, stats]) => ({
      agent,
      total: stats.total,
      successRate: (stats.done / (stats.total || 1)) * 100,
      errorRate: (stats.invalid / (stats.total || 1)) * 100,
    }))
    .sort((a, b) => b.errorRate - a.errorRate);

  // Déterminer le taux de progression par jour
  const migrationsPerDay = statusData.summary.total / 7; // Estimation simpliste

  return {
    avgProcessingTime,
    successRate,
    agentsMetrics,
    migrationsPerDay,
    estimatedCompletionDays: Math.ceil(
      (files.length - statusData.summary.done) / (migrationsPerDay || 1)
    ),
  };
}

/**
 * Génère le contenu HTML du rapport
 */
async function generateReport(reportData) {
  // Template simple pour le rapport HTML
  const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rapport <%= type === 'daily' ? 'quotidien' : 'hebdomadaire' %> de migration - <%= date %></title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #2c3e50; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .summary-card { background-color: #f8f9fa; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .summary-card.success { border-left: 4px solid #28a745; }
        .summary-card.warning { border-left: 4px solid #ffc107; }
        .summary-card.danger { border-left: 4px solid #dc3545; }
        .summary-card.info { border-left: 4px solid #17a2b8; }
        .summary-number { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .metrics-container { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px; }
        .metric-item { background-color: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .metric-value { font-size: 20px; font-weight: bold; margin: 8px 0; }
        .metric-label { color: #6c757d; font-size: 14px; }
        .agents-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        .agents-table th, .agents-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .agents-table th { background-color: #f2f2f2; font-weight: 600; }
        .agents-table tr:nth-child(even) { background-color: #f9f9f9; }
        .errors-container { background-color: #f8d7da; border-radius: 6px; padding: 15px; margin-top: 30px; }
        .errors-list { font-family: monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        .error-item { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .progress-container { margin-top: 20px; }
        .progress-bar { height: 10px; background-color: #e9ecef; border-radius: 5px; margin-bottom: 10px; overflow: hidden; }
        .progress-value { height: 100%; background-color: #007bff; }
      </style>
    </head>
    <body>
      <h1>Rapport <%= type === 'daily' ? 'quotidien' : 'hebdomadaire' %> de migration PHP → Remix</h1>
      <p>Généré le <%= new Date().toLocaleString() %></p>
      
      <h2>Résumé - <%= period %></h2>
      <div class="summary-grid">
        <div class="summary-card info">
          <div>Total de fichiers</div>
          <div class="summary-number"><%= statusData.summary.total %></div>
        </div>
        <div class="summary-card success">
          <div>Fichiers migrés</div>
          <div class="summary-number"><%= statusData.summary.done %></div>
        </div>
        <div class="summary-card warning">
          <div>En attente</div>
          <div class="summary-number"><%= statusData.summary.pending %></div>
        </div>
        <div class="summary-card danger">
          <div>Erreurs</div>
          <div class="summary-number"><%= statusData.summary.invalid %></div>
        </div>
      </div>

      <h2>Métriques de performance</h2>
      <div class="metrics-container">
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">Temps moyen de traitement</div>
            <div class="metric-value"><%= metrics.avgProcessingTime.toFixed(1) %>s</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Taux de succès</div>
            <div class="metric-value"><%= metrics.successRate.toFixed(1) %>%</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Migrations par jour</div>
            <div class="metric-value"><%= metrics.migrationsPerDay.toFixed(1) %></div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Temps estimé restant</div>
            <div class="metric-value"><%= metrics.estimatedCompletionDays %> jours</div>
          </div>
        </div>
        
        <div class="progress-container">
          <h3>Progression globale</h3>
          <div class="progress-bar">
            <div class="progress-value" style="width: <%= metrics.successRate.toFixed(1) %>%;"></div>
          </div>
          <div><%= statusData.summary.done %>/<%= statusData.summary.total %> fichiers (<%= metrics.successRate.toFixed(1) %>%)</div>
        </div>
      </div>

      <h2>Performance des agents</h2>
      <table class="agents-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Total fichiers</th>
            <th>Taux de succès</th>
            <th>Taux d'erreur</th>
          </tr>
        </thead>
        <tbody>
          <% metrics.agentsMetrics.forEach(agent => { %>
            <tr>
              <td><%= agent.agent %></td>
              <td><%= agent.total %></td>
              <td><%= agent.successRate.toFixed(1) %>%</td>
              <td><%= agent.errorRate.toFixed(1) %>%</td>
            </tr>
          <% }); %>
        </tbody>
      </table>

      <% if (errorLogs && errorLogs.length > 0) { %>
        <h2>Dernières erreurs</h2>
        <div class="errors-container">
          <div class="errors-list">
            <% errorLogs.forEach(log => { %>
              <div class="error-item"><%= log %></div>
            <% }); %>
          </div>
        </div>
      <% } %>

      <% if (type === 'weekly') { %>
        <h2>Recommandations</h2>
        <ul>
          <% if (metrics.successRate < 80) { %>
            <li>Le taux de succès est inférieur à 80%. Vérifiez les agents qui génèrent le plus d'erreurs.</li>
          <% } %>
          <% const worstAgent = metrics.agentsMetrics[0]; %>
          <% if (worstAgent && worstAgent.errorRate > 20) { %>
            <li>L'agent <strong><%= worstAgent.agent %></strong> a un taux d'erreur élevé (<%= worstAgent.errorRate.toFixed(1) %>%). Une investigation est recommandée.</li>
          <% } %>
          <li>Estimation pour terminer toutes les migrations : <%= metrics.estimatedCompletionDays %> jours au rythme actuel.</li>
        </ul>
      <% } %>

      <p>
        <a href="http://localhost:3000/admin/jobs">Accéder au dashboard complet</a>
      </p>
    </body>
    </html>
  `;

  // Utiliser EJS pour le rendu
  try {
    return ejs.render(template, reportData);
  } catch (error) {
    console.error('Erreur lors de la génération du rapport HTML:', error);
    throw error;
  }
}

/**
 * Sauvegarde le rapport dans un fichier
 */
async function saveReport(reportContent, reportType) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${reportType}-migration-report-${timestamp}.html`;
  const outputPath = path.join(CONFIG.reportsOutputDir, filename);

  // Créer le dossier de rapports s'il n'existe pas
  try {
    await fs.mkdir(CONFIG.reportsOutputDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }

  await fs.writeFile(outputPath, reportContent);
  console.log(`Rapport sauvegardé dans: ${outputPath}`);

  // Créer un lien symbolique vers le dernier rapport
  const latestLinkPath = path.join(CONFIG.reportsOutputDir, `latest-${reportType}-report.html`);
  try {
    // Supprimer le lien symbolique existant si présent
    await fs.unlink(latestLinkPath).catch(() => {});
    // Créer un nouveau lien
    await fs.symlink(filename, latestLinkPath);
    console.log(`Lien vers le dernier rapport créé: ${latestLinkPath}`);
  } catch (error) {
    console.warn(`Impossible de créer le lien symbolique: ${error.message}`);
  }

  return outputPath;
}

/**
 * Envoie le rapport par email
 */
async function emailReport(report, reportType) {
  if (!CONFIG.email.auth.user || !CONFIG.email.auth.pass) {
    console.warn('Configuration email incomplète, email non envoyé');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: CONFIG.email.host,
      port: CONFIG.email.port,
      secure: CONFIG.email.secure,
      auth: CONFIG.email.auth,
    });

    const info = await transporter.sendMail({
      from: CONFIG.email.from,
      to: CONFIG.email.to,
      subject: `Rapport ${
        reportType === 'daily' ? 'quotidien' : 'hebdomadaire'
      } de migration PHP -> Remix`,
      html: report,
    });

    console.log(`Email envoyé: ${info.messageId}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
  }
}

/**
 * Synchronise le rapport avec Supabase
 */
async function syncReportToSupabase(reportData) {
  if (!CONFIG.supabase.enabled) {
    return;
  }

  try {
    const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key);

    // Convertir les données pour Supabase
    const report = {
      type: reportData.type,
      date: reportData.date,
      total_files: reportData.statusData.summary.total,
      done_files: reportData.statusData.summary.done,
      pending_files: reportData.statusData.summary.pending,
      error_files: reportData.statusData.summary.invalid,
      success_rate: reportData.metrics.successRate,
      avg_processing_time: reportData.metrics.avgProcessingTime,
      migrations_per_day: reportData.metrics.migrationsPerDay,
      estimated_completion_days: reportData.metrics.estimatedCompletionDays,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('migration_reports').insert(report);

    if (error) {
      console.error('Erreur lors de la synchronisation avec Supabase:', error);
    } else {
      console.log('Rapport synchronisé avec Supabase');
    }

    // Synchroniser également les métriques d'agents
    for (const agentMetric of reportData.metrics.agentsMetrics) {
      const { data: agentData, error: agentError } = await supabase.from('agent_metrics').insert({
        report_date: reportData.date,
        report_type: reportData.type,
        agent_name: agentMetric.agent,
        total_files: agentMetric.total,
        success_rate: agentMetric.successRate,
        error_rate: agentMetric.errorRate,
        created_at: new Date().toISOString(),
      });

      if (agentError) {
        console.error(
          `Erreur lors de la synchronisation des métriques de l'agent ${agentMetric.agent}:`,
          agentError
        );
      }
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation avec Supabase:', error);
  }
}

// Exécution du script
main().catch(console.error);
