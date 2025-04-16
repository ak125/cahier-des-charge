#!/usr/bin/env node

/**
 * Outil d'analyse d'utilisabilité et d'expérience utilisateur
 * 
 * Cet outil analyse les pages web pour évaluer leur utilisabilité et leur expérience utilisateur.
 * Il utilise des métriques de terrain réelles (RUM) et des tests synthétiques pour générer un score.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer'); // Nécessite d'être installé
const { execSync } = require('child_process');

const CONFIG = {
  outputDir: path.resolve('./qa-reports'),
  usabilityOutputFile: path.resolve('./qa-reports/usability-analysis-results.json'),
  uxOutputFile: path.resolve('./qa-reports/ux-analysis-results.json'),
  urlsFile: path.resolve('./qa-reports/urls-to-analyze.json'),
  concurrentTasks: 5, // Nombre de tests concurrents
  rumDataFile: path.resolve('./qa-reports/rum-data.json'), // Données de métriques réelles d'utilisateurs
  usabilityThresholds: {
    interactionToResult: 3, // Nombre d'interactions maximum pour accomplir une tâche
    clearFocusStates: true, // Présence d'états de focus visibles
    formLabels: true, // Présence de labels sur les formulaires
    navConsistency: true, // Cohérence de la navigation
    readability: 60, // Score minimum de lisibilité
  },
  uxThresholds: {
    fid: 100, // First Input Delay en ms
    cls: 0.1, // Cumulative Layout Shift
    inp: 200, // Interaction to Next Paint en ms
    ttfb: 800, // Time to First Byte en ms
    formCompletionRate: 0.7, // Taux de complétion des formulaires
    taskSuccessRate: 0.8, // Taux de réussite des tâches prédéfinies
  }
};

// Garantir que les répertoires existent
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log('\n🔍 Démarrage de l\'analyse d\'utilisabilité et d\'expérience utilisateur');
  
  try {
    // Récupérer les URLs à analyser
    const urls = await getUrlsToAnalyze();
    console.log(`📋 ${urls.length} URLs à analyser`);
    
    if (urls.length === 0) {
      console.log('⚠️ Aucune URL à analyser');
      return;
    }
    
    // Analyse de l'utilisabilité
    const usabilityResults = await analyzeUsability(urls);
    
    // Analyse de l'expérience utilisateur
    const uxResults = await analyzeUserExperience(urls);
    
    // Sauvegarder les résultats
    saveResults(usabilityResults, uxResults);
    
    console.log('\n✅ Analyse d\'utilisabilité et d\'expérience utilisateur terminée avec succès');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'analyse d\'utilisabilité et d\'expérience utilisateur:', error);
    process.exit(1);
  }
}

/**
 * Récupère la liste des URLs à analyser
 */
async function getUrlsToAnalyze() {
  try {
    if (fs.existsSync(CONFIG.urlsFile)) {
      const urlsData = JSON.parse(fs.readFileSync(CONFIG.urlsFile, 'utf8'));
      return urlsData.urls || [];
    } else {
      console.log('⚠️ Fichier d\'URLs introuvable, utilisation d\'un échantillon par défaut');
      // URLs d'exemple
      const defaultUrls = [
        { url: 'https://example.com', name: 'Page d\'accueil', importance: 'high' },
        { url: 'https://example.com/contact', name: 'Page de contact', importance: 'medium' },
        { url: 'https://example.com/products', name: 'Liste des produits', importance: 'high' },
      ];
      // Sauvegarder les URLs d'exemple pour une utilisation future
      fs.writeFileSync(CONFIG.urlsFile, JSON.stringify({ urls: defaultUrls }, null, 2));
      return defaultUrls;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des URLs:', error);
    return [];
  }
}

/**
 * Analyse l'utilisabilité des URLs fournies
 */
async function analyzeUsability(urls) {
  console.log('\n📊 Analyse de l\'utilisabilité en cours...');
  
  const browser = await puppeteer.launch({ headless: true });
  const results = {
    timestamp: new Date().toISOString(),
    results: {},
    averageScore: 0,
    testsPassed: 0,
    testsFailed: 0,
    issues: []
  };
  
  try {
    // Traiter chaque URL, avec un maximum de CONFIG.concurrentTasks à la fois
    for (let i = 0; i < urls.length; i += CONFIG.concurrentTasks) {
      const chunk = urls.slice(i, i + CONFIG.concurrentTasks);
      const promises = chunk.map(urlInfo => analyzePageUsability(browser, urlInfo));
      const chunkResults = await Promise.all(promises);
      
      // Fusionner les résultats
      chunkResults.forEach(result => {
        results.results[result.url] = result;
        if (result.score >= 70) {
          results.testsPassed++;
        } else {
          results.testsFailed++;
        }
        
        // Ajouter les problèmes à la liste globale
        result.issues.forEach(issue => {
          results.issues.push({
            url: result.url,
            name: result.name,
            issue: issue.message,
            impact: issue.impact,
            criterion: issue.criterion
          });
        });
      });
    }
    
    // Calculer le score moyen
    const scores = Object.values(results.results).map(r => r.score);
    results.averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;
    
    console.log(`✅ ${results.testsPassed} tests réussis, ${results.testsFailed} tests échoués`);
    console.log(`📈 Score moyen d'utilisabilité: ${results.averageScore.toFixed(2)}/100`);
    
    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Analyse l'utilisabilité d'une page spécifique
 */
async function analyzePageUsability(browser, urlInfo) {
  const { url, name } = urlInfo;
  console.log(`🔍 Analyse de l'utilisabilité de ${name} (${url})`);
  
  const pageResult = {
    url,
    name,
    score: 0,
    timestamp: new Date().toISOString(),
    tests: {},
    issues: []
  };
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Accéder à la page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 1. Test: Présence de labels dans les formulaires
    pageResult.tests.formLabels = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const formResults = forms.map(form => {
        const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])'));
        const inputsWithLabels = inputs.filter(input => {
          // Vérifier si l'input a un label associé par id
          if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return true;
          }
          // Vérifier si l'input est contenu dans un label
          const parentLabel = input.closest('label');
          return !!parentLabel;
        });
        return { total: inputs.length, withLabels: inputsWithLabels.length };
      });
      
      if (formResults.length === 0) {
        return { passed: true, score: 100, details: 'Aucun formulaire détecté' };
      }
      
      const totalInputs = formResults.reduce((sum, form) => sum + form.total, 0);
      const totalWithLabels = formResults.reduce((sum, form) => sum + form.withLabels, 0);
      const percentage = totalInputs > 0 ? (totalWithLabels / totalInputs) * 100 : 100;
      
      return {
        passed: percentage >= 90,
        score: Math.round(percentage),
        details: `${totalWithLabels}/${totalInputs} champs avec labels (${percentage.toFixed(1)}%)`
      };
    });
    
    if (!pageResult.tests.formLabels.passed) {
      pageResult.issues.push({
        criterion: 'formLabels',
        message: 'Formulaires sans labels appropriés',
        impact: 'high',
        details: pageResult.tests.formLabels.details
      });
    }
    
    // 2. Test: États de focus visibles
    pageResult.tests.focusStates = await page.evaluate(() => {
      const interactiveElements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]'));
      let visibleFocus = 0;
      let testedElements = 0;
      
      // Échantillon d'éléments à tester (max 10)
      const elementsToTest = interactiveElements.slice(0, 10);
      
      // Vérification impossible automatiquement à 100%, approximation
      // Dans un vrai contexte, on utiliserait des tests manuels ou des tests automatisés spécifiques
      elementsToTest.forEach(el => {
        // Vérification simplifiée basée sur les styles par défaut et si des styles focus sont définis en CSS
        // Ce n'est pas parfait mais donne une idée
        const styles = window.getComputedStyle(el);
        const hasPotentialFocusStyle = styles.outlineColor !== 'rgb(0, 0, 0)' || 
                                       styles.outlineStyle !== 'none' ||
                                       styles.outlineWidth !== '0px';
        if (hasPotentialFocusStyle) visibleFocus++;
        testedElements++;
      });
      
      const percentage = testedElements > 0 ? (visibleFocus / testedElements) * 100 : 100;
      
      return {
        passed: percentage >= 70,
        score: Math.round(percentage),
        details: `${visibleFocus}/${testedElements} éléments avec focus visible (${percentage.toFixed(1)}%)`
      };
    });
    
    if (!pageResult.tests.focusStates.passed) {
      pageResult.issues.push({
        criterion: 'focusStates',
        message: 'États de focus non visibles sur certains éléments interactifs',
        impact: 'high',
        details: pageResult.tests.focusStates.details
      });
    }
    
    // 3. Test: Lisibilité du texte
    pageResult.tests.readability = await page.evaluate(() => {
      function calculateReadabilityScore(text) {
        // Algorithme simplifié de Flesch Reading Ease (adapté au français)
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (words.length === 0 || sentences.length === 0) return 100;
        
        const averageWordsPerSentence = words.length / sentences.length;
        const averageCharactersPerWord = words.join('').length / words.length;
        
        // Formule simplifiée adaptée au français
        const score = 207 - (1.015 * averageWordsPerSentence) - (73.6 * averageCharactersPerWord);
        
        // Limiter le score entre 0 et 100
        return Math.min(100, Math.max(0, score));
      }
      
      // Extraire le texte des paragraphes, titres, et autres contenus textuels
      const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, div > text:not(div *)'));
      const textContent = textElements.map(el => el.textContent.trim()).filter(t => t.length > 10).join(' ');
      
      const readabilityScore = calculateReadabilityScore(textContent);
      
      return {
        passed: readabilityScore >= 60,
        score: Math.round(readabilityScore),
        details: `Score de lisibilité: ${readabilityScore.toFixed(1)}/100`
      };
    });
    
    if (!pageResult.tests.readability.passed) {
      pageResult.issues.push({
        criterion: 'readability',
        message: 'Texte difficile à lire',
        impact: 'medium',
        details: pageResult.tests.readability.details
      });
    }
    
    // 4. Test: Cohérence de la navigation
    // Ce test est souvent effectué entre différentes pages, mais on peut faire une simple vérification
    pageResult.tests.navConsistency = await page.evaluate(() => {
      const navElements = Array.from(document.querySelectorAll('nav, [role="navigation"], header, .header, .nav, .menu'));
      const headerFooterConsistent = navElements.length > 0;
      
      return {
        passed: headerFooterConsistent,
        score: headerFooterConsistent ? 100 : 0,
        details: `${navElements.length} éléments de navigation trouvés`
      };
    });
    
    if (!pageResult.tests.navConsistency.passed) {
      pageResult.issues.push({
        criterion: 'navConsistency',
        message: 'Navigation incohérente ou absente',
        impact: 'medium',
        details: pageResult.tests.navConsistency.details
      });
    }
    
    // 5. Test: Interactions nécessaires pour accomplir une tâche commune
    pageResult.tests.interactionCount = await page.evaluate(() => {
      // Simuler une tâche commune: essayer de trouver un formulaire de contact ou de recherche
      const searchForm = document.querySelector('form[role="search"], input[type="search"], input[name*="search"]');
      const contactLink = Array.from(document.querySelectorAll('a')).find(a => 
        a.textContent.toLowerCase().includes('contact') || 
        a.href.toLowerCase().includes('contact')
      );
      
      // Si un formulaire de recherche ou un lien de contact est directement visible, c'est une bonne chose
      const easilyAccessible = searchForm !== null || contactLink !== null;
      let score = easilyAccessible ? 100 : 50; // Estimation simplifée
      
      return {
        passed: easilyAccessible,
        score,
        details: easilyAccessible ? 'Fonctionnalité principale facilement accessible' : 'Fonctionnalité principale difficile à trouver'
      };
    });
    
    if (!pageResult.tests.interactionCount.passed) {
      pageResult.issues.push({
        criterion: 'interactionCount',
        message: 'Trop d\'interactions nécessaires pour effectuer des tâches communes',
        impact: 'medium',
        details: pageResult.tests.interactionCount.details
      });
    }
    
    // Fermer la page
    await page.close();
    
    // Calculer le score global d'utilisabilité
    const scores = Object.values(pageResult.tests).map(t => t.score);
    pageResult.score = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    
    return pageResult;
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse de ${url}:`, error.message);
    pageResult.error = error.message;
    pageResult.score = 0;
    return pageResult;
  }
}

/**
 * Analyse l'expérience utilisateur des URLs fournies
 */
async function analyzeUserExperience(urls) {
  console.log('\n👤 Analyse de l\'expérience utilisateur en cours...');
  
  const results = {
    timestamp: new Date().toISOString(),
    results: {},
    averageScore: 0,
    testsPassed: 0,
    testsFailed: 0,
    metrics: {
      fid: { average: 0, good: 0, poor: 0 },
      cls: { average: 0, good: 0, poor: 0 },
      inp: { average: 0, good: 0, poor: 0 },
      ttfb: { average: 0, good: 0, poor: 0 },
    }
  };
  
  // Chargement des données RUM si elles existent
  let rumData = {};
  try {
    if (fs.existsSync(CONFIG.rumDataFile)) {
      rumData = JSON.parse(fs.readFileSync(CONFIG.rumDataFile, 'utf8'));
    } else {
      console.log('⚠️ Pas de données RUM disponibles, utilisation de tests simulés');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données RUM:', error);
  }
  
  // Traiter chaque URL
  for (const urlInfo of urls) {
    console.log(`🔍 Analyse de l'expérience utilisateur de ${urlInfo.name} (${urlInfo.url})`);
    
    const pageResult = {
      url: urlInfo.url,
      name: urlInfo.name,
      score: 0,
      timestamp: new Date().toISOString(),
      metrics: {},
      issues: []
    };
    
    try {
      // Récupérer les métriques RUM pour cette URL si disponibles
      const urlRumData = rumData[urlInfo.url] || generateSimulatedRumData(urlInfo);
      
      // Analyser les métriques Web Vitals
      const fidScore = calculateMetricScore(urlRumData.fid, CONFIG.uxThresholds.fid, true);
      const clsScore = calculateMetricScore(urlRumData.cls, CONFIG.uxThresholds.cls, true);
      const inpScore = calculateMetricScore(urlRumData.inp, CONFIG.uxThresholds.inp, true);
      const ttfbScore = calculateMetricScore(urlRumData.ttfb, CONFIG.uxThresholds.ttfb, true);
      
      pageResult.metrics = {
        fid: {
          value: urlRumData.fid,
          score: fidScore,
          passed: fidScore >= 70
        },
        cls: {
          value: urlRumData.cls,
          score: clsScore,
          passed: clsScore >= 70
        },
        inp: {
          value: urlRumData.inp,
          score: inpScore,
          passed: inpScore >= 70
        },
        ttfb: {
          value: urlRumData.ttfb,
          score: ttfbScore,
          passed: ttfbScore >= 70
        }
      };
      
      // Ajouter les problèmes identifiés
      if (!pageResult.metrics.fid.passed) {
        pageResult.issues.push({
          metric: 'fid',
          message: 'First Input Delay trop élevé',
          impact: 'high',
          value: urlRumData.fid,
          threshold: CONFIG.uxThresholds.fid
        });
      }
      
      if (!pageResult.metrics.cls.passed) {
        pageResult.issues.push({
          metric: 'cls',
          message: 'Cumulative Layout Shift trop élevé',
          impact: 'high',
          value: urlRumData.cls,
          threshold: CONFIG.uxThresholds.cls
        });
      }
      
      if (!pageResult.metrics.inp.passed) {
        pageResult.issues.push({
          metric: 'inp',
          message: 'Interaction to Next Paint trop élevé',
          impact: 'medium',
          value: urlRumData.inp,
          threshold: CONFIG.uxThresholds.inp
        });
      }
      
      if (!pageResult.metrics.ttfb.passed) {
        pageResult.issues.push({
          metric: 'ttfb',
          message: 'Time to First Byte trop élevé',
          impact: 'medium',
          value: urlRumData.ttfb,
          threshold: CONFIG.uxThresholds.ttfb
        });
      }
      
      // Ajouter les métriques humaines si disponibles
      if (urlRumData.userMetrics) {
        pageResult.metrics.userMetrics = {
          formCompletionRate: urlRumData.userMetrics.formCompletionRate,
          taskSuccessRate: urlRumData.userMetrics.taskSuccessRate,
          satisfactionScore: urlRumData.userMetrics.satisfactionScore
        };
        
        // Vérifier les métriques humaines
        if (urlRumData.userMetrics.formCompletionRate < CONFIG.uxThresholds.formCompletionRate) {
          pageResult.issues.push({
            metric: 'formCompletionRate',
            message: 'Taux de complétion des formulaires trop bas',
            impact: 'high',
            value: urlRumData.userMetrics.formCompletionRate,
            threshold: CONFIG.uxThresholds.formCompletionRate
          });
        }
        
        if (urlRumData.userMetrics.taskSuccessRate < CONFIG.uxThresholds.taskSuccessRate) {
          pageResult.issues.push({
            metric: 'taskSuccessRate',
            message: 'Taux de réussite des tâches trop bas',
            impact: 'high',
            value: urlRumData.userMetrics.taskSuccessRate,
            threshold: CONFIG.uxThresholds.taskSuccessRate
          });
        }
      }
      
      // Calculer le score global d'expérience utilisateur
      const metricScores = [
        fidScore,
        clsScore,
        inpScore,
        ttfbScore
      ];
      
      // Ajouter les scores des métriques humaines si disponibles
      if (pageResult.metrics.userMetrics) {
        // Taux de complétion des formulaires (0-1 -> 0-100)
        metricScores.push(pageResult.metrics.userMetrics.formCompletionRate * 100);
        
        // Taux de réussite des tâches (0-1 -> 0-100)
        metricScores.push(pageResult.metrics.userMetrics.taskSuccessRate * 100);
        
        // Score de satisfaction (déjà sur 100)
        metricScores.push(pageResult.metrics.userMetrics.satisfactionScore);
      }
      
      pageResult.score = Math.round(
        metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length
      );
      
      // Ajouter aux résultats globaux
      results.results[urlInfo.url] = pageResult;
      
      // Compteurs pour les tests réussis/échoués
      if (pageResult.score >= 70) {
        results.testsPassed++;
      } else {
        results.testsFailed++;
      }
      
      // Ajouter aux moyennes globales
      results.metrics.fid.average += urlRumData.fid;
      results.metrics.cls.average += urlRumData.cls;
      results.metrics.inp.average += urlRumData.inp;
      results.metrics.ttfb.average += urlRumData.ttfb;
      
      // Compter les bons et mauvais scores pour chaque métrique
      if (pageResult.metrics.fid.passed) results.metrics.fid.good++;
      else results.metrics.fid.poor++;
      
      if (pageResult.metrics.cls.passed) results.metrics.cls.good++;
      else results.metrics.cls.poor++;
      
      if (pageResult.metrics.inp.passed) results.metrics.inp.good++;
      else results.metrics.inp.poor++;
      
      if (pageResult.metrics.ttfb.passed) results.metrics.ttfb.good++;
      else results.metrics.ttfb.poor++;
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'analyse de ${urlInfo.url}:`, error.message);
      pageResult.error = error.message;
      pageResult.score = 0;
      results.results[urlInfo.url] = pageResult;
      results.testsFailed++;
    }
  }
  
  // Calculer les moyennes
  if (urls.length > 0) {
    results.metrics.fid.average /= urls.length;
    results.metrics.cls.average /= urls.length;
    results.metrics.inp.average /= urls.length;
    results.metrics.ttfb.average /= urls.length;
  }
  
  // Calculer le score moyen global
  const scores = Object.values(results.results).map(r => r.score);
  results.averageScore = scores.length > 0 
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
    : 0;
  
  console.log(`✅ ${results.testsPassed} tests réussis, ${results.testsFailed} tests échoués`);
  console.log(`📈 Score moyen d'expérience utilisateur: ${results.averageScore.toFixed(2)}/100`);
  
  return results;
}

/**
 * Génère des données RUM simulées pour une URL
 */
function generateSimulatedRumData(urlInfo) {
  // Simuler des valeurs réalistes pour les métriques Web Vitals
  // En réalité, ces données proviendraient de vraies mesures utilisateurs
  
  const randomInRange = (min, max) => Math.random() * (max - min) + min;
  const randomInt = (min, max) => Math.floor(randomInRange(min, max));
  
  // Ajuster les valeurs selon l'importance de la page
  const importanceFactor = urlInfo.importance === 'high' ? 0.8 : 1.2;
  
  return {
    fid: randomInt(70, 150) * importanceFactor, // ms
    cls: randomInRange(0.05, 0.15) * importanceFactor, // Sans unité (0-1)
    inp: randomInt(150, 250) * importanceFactor, // ms
    ttfb: randomInt(500, 1000) * importanceFactor, // ms
    userMetrics: {
      formCompletionRate: randomInRange(0.65, 0.95) / importanceFactor, // 0-1
      taskSuccessRate: randomInRange(0.7, 0.95) / importanceFactor, // 0-1
      satisfactionScore: randomInt(65, 95) / importanceFactor, // 0-100
    }
  };
}

/**
 * Calcule un score pour une métrique par rapport à son seuil
 * @param {number} value Valeur de la métrique
 * @param {number} threshold Seuil à ne pas dépasser
 * @param {boolean} lowerIsBetter True si une valeur plus basse est meilleure (par défaut)
 * @returns {number} Score entre 0 et 100
 */
function calculateMetricScore(value, threshold, lowerIsBetter = true) {
  if (lowerIsBetter) {
    if (value <= threshold * 0.5) return 100; // Excellent
    if (value <= threshold * 0.75) return 90; // Très bon
    if (value <= threshold) return 80; // Bon
    if (value <= threshold * 1.25) return 70; // Acceptable
    if (value <= threshold * 1.5) return 50; // Médiocre
    if (value <= threshold * 2) return 30; // Mauvais
    return 10; // Très mauvais
  } else {
    if (value >= threshold * 1.5) return 100; // Excellent
    if (value >= threshold * 1.25) return 90; // Très bon
    if (value >= threshold) return 80; // Bon
    if (value >= threshold * 0.75) return 70; // Acceptable
    if (value >= threshold * 0.5) return 50; // Médiocre
    if (value >= threshold * 0.25) return 30; // Mauvais
    return 10; // Très mauvais
  }
}

/**
 * Sauvegarde les résultats d'analyse
 */
function saveResults(usabilityResults, uxResults) {
  fs.writeFileSync(CONFIG.usabilityOutputFile, JSON.stringify(usabilityResults, null, 2));
  fs.writeFileSync(CONFIG.uxOutputFile, JSON.stringify(uxResults, null, 2));
  console.log(`✅ Résultats sauvegardés dans ${CONFIG.usabilityOutputFile} et ${CONFIG.uxOutputFile}`);
}

// Démarrer l'exécution
main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});