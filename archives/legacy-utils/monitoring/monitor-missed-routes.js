#!/usr/bin/env node
/**
 * Service de surveillance proactive des routes manquées
 * Analyse les logs des routes manquées et envoie des alertes
 * si des seuils sont dépassés
 */

const fs = require('fsstructure-agent');
const path = require('pathstructure-agent');
const nodemailer = require('nodemailerstructure-agent');

// Configuration
const CONFIG = {
  // Seuils d'alerte (nombre d'accès dans la période)
  thresholds: {
    high: 50, // Alerte haute priorité
    medium: 20, // Alerte moyenne priorité
    low: 10, // Alerte basse priorité
  },

  // Période d'analyse en heures
  period: 24,

  // Configuration email
  email: {
    enabled: true,
    from: 'surveillance@example.com',
    to: 'admin@example.com',
    subject: 'Alerte de routes manquées - Migration PHP vers Remix',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'user',
    smtpPass: 'password',
    secure: false,
  },

  // Configuration Slack (optionnel)
  slack: {
    enabled: false,
    webhookUrl: 'https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ',
    channel: '#migration-alerts',
  },

  // Chemin des fichiers
  paths: {
    logFile: path.resolve(process.cwd(), 'logs/missed_legacy_routes.log'),
    reportDir: path.resolve(process.cwd(), 'reports/alerts'),
    configFile: path.resolve(process.cwd(), 'reports/seo_routes.json'),
    whitelistFile: path.resolve(process.cwd(), 'config/routes-alert-whitelist.json'),
  },
};

// Vérifier si nécessaire de créer les répertoires
if (!fs.existsSync(CONFIG.paths.reportDir)) {
  fs.mkdirSync(CONFIG.paths.reportDir, { recursive: true });
}

// Charger la liste blanche (URLs à ignorer)
let whitelist = [];
try {
  if (fs.existsSync(CONFIG.paths.whitelistFile)) {
    whitelist = JSON.parse(fs.readFileSync(CONFIG.paths.whitelistFile, 'utf8'));
    console.log(`Liste blanche chargée: ${whitelist.length} URLs ignorées`);
  } else {
    console.log('Aucune liste blanche trouvée, toutes les URLs seront analysées');
    // Créer un fichier whitelist par défaut
    fs.writeFileSync(
      CONFIG.paths.whitelistFile,
      JSON.stringify(
        {
          ignored_routes: ['/favicon.ico', '/robots.txt', '/sitemap.xml'],
          ignored_patterns: [
            '^/assets/',
            '^/static/',
            '\\.jpg$',
            '\\.png$',
            '\\.gif$',
            '\\.css$',
            '\\.js$',
          ],
        },
        null,
        2
      ),
      'utf8'
    );
    console.log(`Fichier de liste blanche par défaut créé: ${CONFIG.paths.whitelistFile}`);
  }
} catch (err) {
  console.error('Erreur lors du chargement de la liste blanche:', err);
}

// Charger les routes SEO importantes
let seoRoutes = [];
try {
  if (fs.existsSync(CONFIG.paths.configFile)) {
    seoRoutes = JSON.parse(fs.readFileSync(CONFIG.paths.configFile, 'utf8'));
    console.log(`Routes SEO chargées: ${seoRoutes.length} routes`);
  } else {
    console.log('Aucun fichier de routes SEO trouvé');
  }
} catch (err) {
  console.error('Erreur lors du chargement des routes SEO:', err);
}

/**
 * Fonction principale d'analyse
 */
async function analyzeRoutes() {
  console.log(`=== Analyse des routes manquées (${new Date().toISOString()}) ===`);

  // Vérifier si le fichier de log existe
  if (!fs.existsSync(CONFIG.paths.logFile)) {
    console.log('Aucun fichier de log trouvé, rien à analyser');
    return;
  }

  // Lire le fichier de log
  const logContent = fs.readFileSync(CONFIG.paths.logFile, 'utf8');
  const logLines = logContent.split('\n').filter((line) => line.trim());
  console.log(`Fichier de log chargé: ${logLines.length} entrées`);

  // Déterminer la date limite pour la période d'analyse
  const periodLimit = new Date();
  periodLimit.setHours(periodLimit.getHours() - CONFIG.period);

  // Analyser les logs
  const routeCounts = new Map();
  const routeDetails = new Map();
  let recentCount = 0;

  logLines.forEach((line) => {
    const parts = line.split(' | ');
    if (parts.length >= 3) {
      const timestamp = parts[0];
      const method = parts[1];
      const url = parts[2];
      const userAgent = parts[3] || 'Unknown';
      const referer = parts[4] || 'Direct';

      // Vérifier si l'entrée est dans la période d'analyse
      const logDate = new Date(timestamp);
      if (logDate >= periodLimit) {
        recentCount++;

        // Vérifier si l'URL est dans la liste blanche
        const isWhitelisted = checkWhitelist(url);
        if (!isWhitelisted) {
          // Incrémenter le compteur pour cette URL
          routeCounts.set(url, (routeCounts.get(url) || 0) + 1);

          // Stocker les détails pour cette URL
          if (!routeDetails.has(url)) {
            routeDetails.set(url, {
              lastAccess: timestamp,
              methods: new Set(),
              userAgents: new Set(),
              referers: new Set(),
              isSeoRoute: seoRoutes.includes(url),
            });
          }

          const details = routeDetails.get(url);
          details.lastAccess = timestamp; // Mettre à jour le dernier accès
          details.methods.add(method);
          details.userAgents.add(userAgent);
          details.referers.add(referer);
        }
      }
    }
  });

  console.log(`Entrées récentes (dernières ${CONFIG.period}h): ${recentCount}`);
  console.log(`Routes uniques détectées: ${routeCounts.size}`);

  // Trier les routes par nombre d'accès
  const sortedRoutes = [...routeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([url, count]) => ({
      url,
      count,
      priority: getPriority(count, routeDetails.get(url).isSeoRoute),
      isSeoRoute: routeDetails.get(url).isSeoRoute,
      lastAccess: routeDetails.get(url).lastAccess,
      methods: [...routeDetails.get(url).methods],
      userAgents: [...routeDetails.get(url).userAgents].slice(0, 3),
      referers: [...routeDetails.get(url).referers].slice(0, 3),
    }));

  // Filtrer les routes qui dépassent les seuils
  const alertRoutes = sortedRoutes.filter(
    (route) => route.priority === 'high' || route.priority === 'medium' || route.priority === 'low'
  );

  console.log(`Routes dépassant les seuils: ${alertRoutes.length}`);

  // Si aucune alerte, terminer
  if (alertRoutes.length === 0) {
    console.log('Aucune alerte à envoyer');
    return;
  }

  // Générer le rapport
  const report = generateReport(alertRoutes, recentCount);

  // Enregistrer le rapport
  const reportPath = path.join(
    CONFIG.paths.reportDir,
    `missed-routes-alert-${new Date().toISOString().replace(/:/g, '-')}.html`
  );
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`Rapport enregistré: ${reportPath}`);

  // Envoyer les alertes
  if (CONFIG.email.enabled) {
    await sendEmailAlert(alertRoutes, reportPath);
  }

  if (CONFIG.slack.enabled) {
    await sendSlackAlert(alertRoutes);
  }

  console.log('Analyse terminée');
}

/**
 * Vérifier si une URL est dans la liste blanche
 */
function checkWhitelist(url) {
  try {
    // Charger la configuration whitelist complète
    const whitelistConfig = JSON.parse(fs.readFileSync(CONFIG.paths.whitelistFile, 'utf8'));

    // Vérifier les routes exactes ignorées
    if (whitelistConfig.ignored_routes?.includes(url)) {
      return true;
    }

    // Vérifier les patterns ignorés
    if (whitelistConfig.ignored_patterns) {
      return whitelistConfig.ignored_patterns.some((pattern) => {
        const regex = new RegExp(pattern);
        return regex.test(url);
      });
    }

    return false;
  } catch (err) {
    console.error('Erreur lors de la vérification de la liste blanche:', err);
    return false;
  }
}

/**
 * Déterminer la priorité d'une route en fonction du nombre d'accès
 */
function getPriority(count, isSeoRoute) {
  // Multiplier les seuils par 2 pour les routes non-SEO
  const multiplier = isSeoRoute ? 1 : 2;

  if (count >= CONFIG.thresholds.high / multiplier) return 'high';
  if (count >= CONFIG.thresholds.medium / multiplier) return 'medium';
  if (count >= CONFIG.thresholds.low / multiplier) return 'low';
  return 'none';
}

/**
 * Générer un rapport HTML
 */
function generateReport(routes, totalCount) {
  const highPriorityCount = routes.filter((r) => r.priority === 'high').length;
  const mediumPriorityCount = routes.filter((r) => r.priority === 'medium').length;
  const lowPriorityCount = routes.filter((r) => r.priority === 'low').length;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerte - Routes PHP manquées</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    h1 { color: #333; }
    .summary { margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
    .high { color: #dc3545; font-weight: bold; }
    .medium { color: #fd7e14; font-weight: bold; }
    .low { color: #ffc107; font-weight: bold; }
    .seo-badge { 
      display: inline-block; 
      background-color: #28a745; 
      color: white; 
      padding: 2px 5px; 
      border-radius: 3px; 
      font-size: 0.8em; 
      margin-left: 5px;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .code { font-family: monospace; background-color: #eee; padding: 2px 4px; }
    .details { font-size: 0.9em; color: #666; margin-top: 5px; }
    .recommendation {
      background-color: #e9f7fd;
      border-left: 4px solid #0099cc;
      padding: 10px 15px;
      margin-top: 5px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>Alerte - Routes PHP manquées</h1>
  
  <div class="summary">
    <p><strong>Date de l'analyse :</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Période analysée :</strong> Dernières ${CONFIG.period} heures</p>
    <p><strong>Entrées analysées :</strong> ${totalCount}</p>
    <p><strong>Alertes :</strong></p>
    <ul>
      <li><span class="high">Haute priorité :</span> ${highPriorityCount}</li>
      <li><span class="medium">Moyenne priorité :</span> ${mediumPriorityCount}</li>
      <li><span class="low">Basse priorité :</span> ${lowPriorityCount}</li>
    </ul>
  </div>
  
  <h2>Routes manquées</h2>
  
  <table>
    <thead>
      <tr>
        <th>URL</th>
        <th>Accès</th>
        <th>Priorité</th>
        <th>Dernier accès</th>
        <th>Détails</th>
      </tr>
    </thead>
    <tbody>
      ${routes
        .map(
          (route) => `
        <tr>
          <td>
            <code>${route.url}</code>
            ${route.isSeoRoute ? '<span class="seo-badge">SEO</span>' : ''}
          </td>
          <td>${route.count}</td>
          <td class="${route.priority}">${route.priority.toUpperCase()}</td>
          <td>${new Date(route.lastAccess).toLocaleString()}</td>
          <td>
            <div class="details">
              <strong>Méthodes :</strong> ${route.methods.join(', ')}<br>
              <strong>Référents :</strong> ${route.referers
                .map((r) => (r === 'Direct' ? r : `<code>${r}</code>`))
                .join(', ')}
            </div>
            <div class="recommendation">
              ${getRecommendation(route)}
            </div>
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  
  <div style="margin-top: 30px;">
    <h3>Actions recommandées</h3>
    <ol>
      <li>Ajouter des redirections pour les routes à haute priorité dans votre fichier de configuration</li>
      <li>Exécuter <code>./analyze-htaccess.sh</code> pour mettre à jour les redirections</li>
      <li>Utiliser <code>./test-redirections.sh</code> pour vérifier les nouvelles redirections</li>
      <li>Mettre à jour la documentation dans le tableau de bord des routes</li>
    </ol>
  </div>
  
  <p style="margin-top: 30px; font-size: 0.8em; color: #666;">
    Ce rapport a été généré automatiquement par le service de surveillance des routes manquées.
  </p>
</body>
</html>`;
}

/**
 * Générer une recommandation pour une route
 */
function getRecommendation(route) {
  if (route.url.endsWith('.php')) {
    // Route PHP
    const baseUrl = route.url.split('?')[0];
    const targetUrl = baseUrl.replace('.php', '');

    return `
      <strong>Suggestion :</strong> Ajouter une redirection 301 vers <code>${targetUrl}</code><br>
      <code>
        "${route.url}": {<br>
        &nbsp;&nbsp;"to": "${targetUrl}",<br>
        &nbsp;&nbsp;"status": 301<br>
        }
      </code>
    `;
  }
  if (route.isSeoRoute) {
    // Route SEO
    return `
      <strong>Action prioritaire :</strong> Cette route est critique pour le SEO. 
      Examiner les logs pour déterminer d'où viennent ces accès et configurer une redirection appropriée.
    `;
  }
  // Autre route
  return `
      <strong>Analyse suggérée :</strong> Examiner les référents pour déterminer la source de ces accès
      et décider si une redirection ou une suppression (410 Gone) est appropriée.
    `;
}

/**
 * Envoyer une alerte par email
 */
async function sendEmailAlert(routes, reportPath) {
  try {
    console.log("Envoi de l'alerte par email...");

    // Créer un transporteur d'email
    const transporter = nodemailer.createTransport({
      host: CONFIG.email.smtpHost,
      port: CONFIG.email.smtpPort,
      secure: CONFIG.email.secure,
      auth: {
        user: CONFIG.email.smtpUser,
        pass: CONFIG.email.smtpPass,
      },
    });

    // Construire le corps de l'email
    const highPriorityRoutes = routes.filter((r) => r.priority === 'high');

    // Préparer le corps du message
    let textBody = 'Alerte - Routes PHP manquées\n\n';
    textBody += `Date : ${new Date().toLocaleString()}\n`;
    textBody += `Période analysée : Dernières ${CONFIG.period} heures\n\n`;
    textBody += `${routes.length} routes dépassent les seuils d'alerte :\n`;
    textBody += `- Haute priorité : ${routes.filter((r) => r.priority === 'high').length}\n`;
    textBody += `- Moyenne priorité : ${routes.filter((r) => r.priority === 'medium').length}\n`;
    textBody += `- Basse priorité : ${routes.filter((r) => r.priority === 'low').length}\n\n`;

    if (highPriorityRoutes.length > 0) {
      textBody += 'Routes à haute priorité :\n';
      highPriorityRoutes.forEach((route) => {
        textBody += `- ${route.url} (${route.count} accès)\n`;
      });
      textBody += '\n';
    }

    textBody += 'Consultez le rapport complet pour plus de détails et de recommandations.\n';
    textBody += `Le rapport est disponible dans : ${reportPath}\n\n`;
    textBody += '---\n';
    textBody +=
      'Ce message a été généré automatiquement par le service de surveillance des routes manquées.';

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: CONFIG.email.from,
      to: CONFIG.email.to,
      subject: CONFIG.email.subject,
      text: textBody,
      html: fs.readFileSync(reportPath, 'utf8'),
      attachments: [
        {
          filename: path.basename(reportPath),
          path: reportPath,
        },
      ],
    });

    console.log('Alerte email envoyée:', info.messageId);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email:", err);
  }
}

/**
 * Envoyer une alerte sur Slack
 */
async function sendSlackAlert(routes) {
  try {
    if (!CONFIG.slack.enabled || !CONFIG.slack.webhookUrl) {
      return;
    }

    console.log("Envoi de l'alerte sur Slack...");

    const highPriorityRoutes = routes.filter((r) => r.priority === 'high');
    const mediumPriorityRoutes = routes.filter((r) => r.priority === 'medium');

    // Construire le message Slack
    const message = {
      channel: CONFIG.slack.channel,
      username: 'Surveillance Routes PHP',
      icon_emoji: ':warning:',
      text: `:warning: *Alerte - Routes PHP manquées*\n${routes.length} routes dépassent les seuils d'alerte`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Alerte - Routes PHP manquées',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*${routes.length} routes* dépassent les seuils d'alerte dans les dernières ${CONFIG.period} heures :\n` +
              `• Haute priorité : *${routes.filter((r) => r.priority === 'high').length}*\n` +
              `• Moyenne priorité : *${routes.filter((r) => r.priority === 'medium').length}*\n` +
              `• Basse priorité : *${routes.filter((r) => r.priority === 'low').length}*`,
          },
        },
      ],
    };

    // Ajouter les routes à haute priorité
    if (highPriorityRoutes.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Routes à haute priorité :*',
        },
      });

      const routeText = highPriorityRoutes
        .slice(0, 5) // Limiter à 5 pour éviter les messages trop longs
        .map(
          (route) => `• \`${route.url}\` - ${route.count} accès${route.isSeoRoute ? ' (SEO)' : ''}`
        )
        .join('\n');

      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: routeText,
        },
      });

      if (highPriorityRoutes.length > 5) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_...et ${highPriorityRoutes.length - 5} autres routes à haute priorité_`,
          },
        });
      }
    }

    // Ajouter les routes à moyenne priorité (résumé)
    if (mediumPriorityRoutes.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Routes à moyenne priorité :* ${mediumPriorityRoutes.length} routes`,
        },
      });
    }

    // Ajouter un lien vers le tableau de bord
    message.blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Voir le tableau de bord',
            emoji: true,
          },
          url: 'http://localhost:3000/dashboard/htaccess',
        },
      ],
    });

    // Envoyer l'alerte à Slack
    const response = await fetch(CONFIG.slack.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('Alerte Slack envoyée avec succès');
    } else {
      console.error("Erreur lors de l'envoi de l'alerte Slack:", await response.text());
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'alerte Slack:", err);
  }
}

// Exécuter l'analyse
analyzeRoutes().catch((err) => {
  console.error("Erreur lors de l'analyse:", err);
  process.exit(1);
});
