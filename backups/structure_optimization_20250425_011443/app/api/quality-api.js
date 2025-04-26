const express = require(expressstructure-agent');
const router = express.Router();
const fs = require(fsstructure-agent');
const path = require(pathstructure-agent');
const cors = require(corsstructure-agent');
const rateLimit = require(express-rate-limitstructure-agent');
const swaggerUi = require(swagger-ui-expressstructure-agent');
const YAML = require(yamljsstructure-agent');

// Configuration
const CONFIG = {
  qaReportDir: path.resolve('./qa-reports'),
  dashboardDataFile: path.resolve('./qa-reports/qa-dashboard-data.json'),
  historicalDataFile: path.resolve('./qa-reports/qa-historical-data.json'),
  notificationsFile: path.resolve('./qa-reports/quality-alerts.json'),
  usabilityOutputFile: path.resolve('./qa-reports/usability-analysis-results.json'),
  uxOutputFile: path.resolve('./qa-reports/ux-analysis-results.json'),
  authEnabled: process.env.QUALITY_API_AUTH_ENABLED === 'true',
  apiKeys: (process.env.QUALITY_API_KEYS || '').split(',').filter(Boolean),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000, // 15 minutes par défaut
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 100 requêtes par fenêtre par défaut
};

// Limiter le taux de requêtes
const apiLimiter = rateLimit({
  windowMs: CONFIG.rateLimitWindow, 
  max: CONFIG.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' }
});

// Middleware d'authentification par API Key
const apiKeyAuth = (req, res, next) => {
  // Si l'authentification est désactivée, continuer
  if (!CONFIG.authEnabled) {
    return next();
  }
  
  const apiKey = req.header('X-API-Key');
  
  // Vérifier si l'API key est présente et valide
  if (!apiKey || !CONFIG.apiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'API key invalide ou manquante' });
  }
  
  next();
};

// Application des middlewares globaux
router.use(cors());
router.use(apiLimiter);
router.use(express.json());

// Documentation Swagger
const swaggerDocument = YAML.load(path.resolve('./app/api/quality-api-swagger.yaml'));
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * @route GET /api/quality/health
 * @description Vérifie si l'API est en ligne
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * @route GET /api/quality/dashboard
 * @description Récupère les données complètes du tableau de bord de qualité
 * @access Privé
 */
router.get('/dashboard', apiKeyAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG.dashboardDataFile)) {
      return res.status(404).json({ error: 'Données du tableau de bord non disponibles' });
    }
    
    const dashboardData = JSON.parse(fs.readFileSync(CONFIG.dashboardDataFile, 'utf8'));
    res.json(dashboardData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des données' });
  }
});

/**
 * @route GET /api/quality/historical
 * @description Récupère les données historiques de qualité
 * @access Privé
 */
router.get('/historical', apiKeyAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG.historicalDataFile)) {
      return res.status(404).json({ error: 'Données historiques non disponibles' });
    }
    
    const historicalData = JSON.parse(fs.readFileSync(CONFIG.historicalDataFile, 'utf8'));
    
    // Filtrer par période si demandé
    const { from, to } = req.query;
    if (from || to) {
      const fromDate = from ? new Date(from) : new Date(0);
      const toDate = to ? new Date(to) : new Date();
      
      historicalData.data = historicalData.data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= fromDate && entryDate <= toDate;
      });
    }
    
    res.json(historicalData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données historiques:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des données' });
  }
});

/**
 * @route GET /api/quality/alerts
 * @description Récupère les alertes de qualité
 * @access Privé
 */
router.get('/alerts', apiKeyAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG.notificationsFile)) {
      return res.json([]);
    }
    
    const alerts = JSON.parse(fs.readFileSync(CONFIG.notificationsFile, 'utf8'));
    
    // Filtrer par type si demandé
    const { type, category, limit } = req.query;
    
    let filteredAlerts = [...alerts];
    
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    if (category) {
      filteredAlerts = filteredAlerts.filter(alert => alert.category === category);
    }
    
    // Limiter le nombre de résultats si demandé
    if (limit && !isNaN(parseInt(limit))) {
      filteredAlerts = filteredAlerts.slice(-parseInt(limit));
    }
    
    res.json(filteredAlerts);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des alertes' });
  }
});

/**
 * @route GET /api/quality/file/:path
 * @description Récupère les données de qualité pour un fichier spécifique
 * @access Privé
 */
router.get('/file/:filePath(*)', apiKeyAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG.dashboardDataFile)) {
      return res.status(404).json({ error: 'Données du tableau de bord non disponibles' });
    }
    
    const dashboardData = JSON.parse(fs.readFileSync(CONFIG.dashboardDataFile, 'utf8'));
    const filePath = req.params.filePath;
    
    // Trouver le fichier demandé
    const fileData = dashboardData.results[filePath];
    
    if (!fileData) {
      return res.status(404).json({ error: 'Fichier non trouvé dans les données de qualité' });
    }
    
    res.json(fileData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données du fichier:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des données' });
  }
});

/**
 * @route GET /api/quality/category/:category
 * @description Récupère les données pour une catégorie spécifique (seo, performance, accessibility, bestPractices, usability, ux)
 * @access Privé
 */
router.get('/category/:category', apiKeyAuth, (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    let outputFile;
    
    // Déterminer le fichier à utiliser selon la catégorie
    switch (category) {
      case 'seo':
        outputFile = path.join(CONFIG.qaReportDir, 'seo-analysis-results.json');
        break;
      case 'performance':
        outputFile = path.join(CONFIG.qaReportDir, 'performance-analysis-results.json');
        break;
      case 'accessibility':
        outputFile = path.join(CONFIG.qaReportDir, 'accessibility-analysis-results.json');
        break;
      case 'bestpractices':
        outputFile = path.join(CONFIG.qaReportDir, 'best-practices-analysis-results.json');
        break;
      case 'usability':
        outputFile = CONFIG.usabilityOutputFile;
        break;
      case 'ux':
        outputFile = CONFIG.uxOutputFile;
        break;
      default:
        return res.status(400).json({ error: 'Catégorie non valide' });
    }
    
    if (!fs.existsSync(outputFile)) {
      return res.status(404).json({ error: `Données de ${category} non disponibles` });
    }
    
    const categoryData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    res.json(categoryData);
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de catégorie:`, error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des données' });
  }
});

/**
 * @route GET /api/quality/summary
 * @description Récupère un résumé des scores de qualité
 * @access Privé
 */
router.get('/summary', apiKeyAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG.dashboardDataFile)) {
      return res.status(404).json({ error: 'Données du tableau de bord non disponibles' });
    }
    
    const dashboardData = JSON.parse(fs.readFileSync(CONFIG.dashboardDataFile, 'utf8'));
    
    // Créer un résumé simplifié
    const summary = {
      timestamp: dashboardData.lastUpdate,
      averageScore: dashboardData.averageScore,
      performance: dashboardData.performanceStats.averageScore,
      accessibility: dashboardData.accessibilityStats.averageScore,
      bestPractices: dashboardData.bestPracticesStats.averageScore,
      totalFiles: dashboardData.stats.totalFiles,
      passedFiles: dashboardData.stats.passedFiles,
      failedFiles: dashboardData.stats.failedFiles
    };
    
    // Ajouter les scores d'utilisabilité et UX s'ils sont disponibles
    try {
      if (fs.existsSync(CONFIG.usabilityOutputFile)) {
        const usabilityData = JSON.parse(fs.readFileSync(CONFIG.usabilityOutputFile, 'utf8'));
        summary.usability = usabilityData.averageScore;
      }
      
      if (fs.existsSync(CONFIG.uxOutputFile)) {
        const uxData = JSON.parse(fs.readFileSync(CONFIG.uxOutputFile, 'utf8'));
        summary.ux = uxData.averageScore;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des scores d\'utilisabilité/UX:', error);
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des scores:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des données' });
  }
});

/**
 * @route POST /api/quality/trigger-analysis
 * @description Déclenche une analyse de qualité
 * @access Privé
 */
router.post('/trigger-analysis', apiKeyAuth, (req, res) => {
  try {
    const { type = 'incremental', targetDir } = req.body;
    
    // Vérifier si une analyse est déjà en cours
    const lockFile = path.join(CONFIG.qaReportDir, 'analysis.lock');
    if (fs.existsSync(lockFile)) {
      return res.status(409).json({ error: 'Une analyse est déjà en cours' });
    }
    
    // Créer un fichier de verrouillage
    fs.writeFileSync(lockFile, new Date().toISOString());
    
    // Construire la commande
    let command = 'node ./scripts/run-quality-checks.js';
    if (type === 'full') {
      command += ' --full';
    } else {
      command += ' --incremental';
    }
    
    if (targetDir) {
      command += ` --dir=${targetDir}`;
    }
    
    // Exécuter l'analyse de manière asynchrone
    const analysisProcess = spawn('sh', ['-c', command], { detached: true, stdio: 'ignore' });
    analysisProcess.unref();
    
    // Retourner immédiatement une réponse
    res.json({ status: 'started', type, targetDir });
    
    // Configurer un timeout pour supprimer le fichier de verrouillage si l'analyse échoue
    setTimeout(() => {
      if (fs.existsSync(lockFile)) {
        const lockTime = new Date(fs.readFileSync(lockFile, 'utf8'));
        const hoursPassed = (new Date() - lockTime) / (1000 * 60 * 60);
        
        // Si le verrouillage existe depuis plus de 2 heures, le supprimer
        if (hoursPassed > 2) {
          fs.unlinkSync(lockFile);
          console.log('Suppression du verrouillage obsolète');
        }
      }
    }, 2 * 60 * 60 * 1000); // 2 heures
  } catch (error) {
    console.error('Erreur lors du déclenchement de l\'analyse:', error);
    res.status(500).json({ error: 'Erreur serveur lors du déclenchement de l\'analyse' });
    
    // Nettoyer le fichier de verrouillage en cas d'erreur
    const lockFile = path.join(CONFIG.qaReportDir, 'analysis.lock');
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }
});

/**
 * @route GET /api/quality/status
 * @description Vérifie le statut de l'analyse en cours
 * @access Privé
 */
router.get('/status', apiKeyAuth, (req, res) => {
  try {
    const lockFile = path.join(CONFIG.qaReportDir, 'analysis.lock');
    if (fs.existsSync(lockFile)) {
      const lockTime = new Date(fs.readFileSync(lockFile, 'utf8'));
      
      res.json({
        status: 'running',
        startTime: lockTime.toISOString(),
        elapsedSeconds: Math.round((new Date() - lockTime) / 1000)
      });
    } else {
      res.json({
        status: 'idle',
        lastUpdate: fs.existsSync(CONFIG.dashboardDataFile)
          ? JSON.parse(fs.readFileSync(CONFIG.dashboardDataFile, 'utf8')).lastUpdate
          : null
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification du statut' });
  }
});

/**
 * @route GET /api/quality/issues
 * @description Récupère les problèmes de qualité les plus courants
 * @access Privé
 */
router.get('/issues', apiKeyAuth, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG.dashboardDataFile)) {
      return res.status(404).json({ error: 'Données du tableau de bord non disponibles' });
    }
    
    const dashboardData = JSON.parse(fs.readFileSync(CONFIG.dashboardDataFile, 'utf8'));
    
    // Si une catégorie est spécifiée, filtrer les problèmes par catégorie
    const { category } = req.query;
    
    if (category) {
      let outputFile;
      
      // Déterminer le fichier à utiliser selon la catégorie
      switch (category.toLowerCase()) {
        case 'seo':
          outputFile = path.join(CONFIG.qaReportDir, 'seo-analysis-results.json');
          break;
        case 'performance':
          outputFile = path.join(CONFIG.qaReportDir, 'performance-analysis-results.json');
          break;
        case 'accessibility':
          outputFile = path.join(CONFIG.qaReportDir, 'accessibility-analysis-results.json');
          break;
        case 'bestpractices':
          outputFile = path.join(CONFIG.qaReportDir, 'best-practices-analysis-results.json');
          break;
        case 'usability':
          outputFile = CONFIG.usabilityOutputFile;
          break;
        case 'ux':
          outputFile = CONFIG.uxOutputFile;
          break;
        default:
          return res.status(400).json({ error: 'Catégorie non valide' });
      }
      
      if (!fs.existsSync(outputFile)) {
        return res.status(404).json({ error: `Données de ${category} non disponibles` });
      }
      
      const categoryData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      
      // Extraire les problèmes spécifiques à cette catégorie
      const issuesMap = {};
      
      if (categoryData.issues) {
        // Si le format contient directement une liste d'issues
        res.json(categoryData.issues);
      } else if (categoryData.results) {
        // Si les issues sont dans les résultats individuels
        Object.values(categoryData.results).forEach(result => {
          if (result.issues) {
            result.issues.forEach(issue => {
              const key = issue.message || issue.criterion || issue.metric;
              if (!issuesMap[key]) {
                issuesMap[key] = {
                  message: issue.message || key,
                  count: 0,
                  impact: issue.impact || 'medium',
                  affectedFiles: []
                };
              }
              issuesMap[key].count++;
              if (result.url || result.file) {
                issuesMap[key].affectedFiles.push(result.url || result.file);
              }
            });
          }
        });
        
        // Convertir en tableau et trier par nombre d'occurrences
        const issues = Object.values(issuesMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, req.query.limit ? parseInt(req.query.limit) : 20);
        
        res.json(issues);
      } else {
        res.json([]);
      }
    } else {
      // Si aucune catégorie n'est spécifiée, renvoyer les problèmes globaux
      res.json(dashboardData.topIssues || []);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des problèmes:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des données' });
  }
});

// Gestion des erreurs 404 pour les routes non définies
router.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Export du routeur
module.exports = router;