#!/bin/bash
# Script pour tester automatiquement les redirections les plus importantes
# Ce script vérifie que les redirections sont correctement configurées

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Options par défaut
BASE_URL="http://localhost:3000"
REPORTS_DIR="./reports"
OUTPUT_DIR="./reports/tests"
TEST_SEO_ONLY=false
VERBOSE=false
MAX_TESTS=50
TEST_ALL=false
TIMEOUT=10

# Afficher l'aide
function show_help() {
  echo -e "${BLUE}=== Test des redirections ===${NC}"
  echo ""
  echo "Ce script teste automatiquement les redirections en effectuant"
  echo "des requêtes HTTP pour vérifier les codes de statut et les destinations."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -b, --base-url URL    URL de base pour les tests (par défaut: http://localhost:3000)"
  echo "  -r, --reports DIR     Répertoire contenant les rapports d'analyse (par défaut: ./reports)"
  echo "  -o, --output DIR      Répertoire de sortie pour les rapports de test (par défaut: ./reports/tests)"
  echo "  -s, --seo-only        Tester uniquement les routes SEO importantes (par défaut: false)"
  echo "  -a, --all             Tester toutes les routes (par défaut: false, limite: 50)"
  echo "  -m, --max NUM         Nombre maximum de tests par catégorie (par défaut: 50)"
  echo "  -t, --timeout SEC     Délai d'attente en secondes pour chaque requête (par défaut: 10)"
  echo "  -v, --verbose         Mode verbeux"
  echo "  --help                Afficher cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 -b https://example.com -s -v"
  exit 0
}

# Traiter les arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--base-url)
      BASE_URL="$2"
      shift 2
      ;;
    -r|--reports)
      REPORTS_DIR="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -s|--seo-only)
      TEST_SEO_ONLY=true
      shift
      ;;
    -a|--all)
      TEST_ALL=true
      shift
      ;;
    -m|--max)
      MAX_TESTS="$2"
      shift 2
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo -e "${RED}❌ Option inconnue: $1${NC}"
      show_help
      ;;
  esac
done

# Vérifier si le répertoire des rapports existe
if [ ! -d "$REPORTS_DIR" ]; then
  echo -e "${RED}❌ Le répertoire des rapports n'existe pas: ${REPORTS_DIR}${NC}"
  exit 1
fi

# Créer le répertoire de sortie s'il n'existe pas
mkdir -p "$OUTPUT_DIR"

# Vérifier que curl est installé
if ! command -v curl &> /dev/null; then
  echo -e "${RED}❌ curl n'est pas installé. Veuillez l'installer pour exécuter ce script.${NC}"
  exit 1
fi

# Afficher le début de l'exécution
if [ "$VERBOSE" = true ]; then
  echo -e "${BLUE}=== Test des redirections ===${NC}"
  echo -e "URL de base: ${BASE_URL}"
  echo -e "Répertoire des rapports: ${REPORTS_DIR}"
  echo -e "Répertoire de sortie: ${OUTPUT_DIR}"
  echo -e "Tester uniquement les routes SEO: ${TEST_SEO_ONLY}"
  echo -e "Tester toutes les routes: ${TEST_ALL}"
  echo -e "Nombre maximum de tests: ${MAX_TESTS}"
  echo -e "Délai d'attente: ${TIMEOUT} secondes"
  echo ""
fi

# Vérifier les fichiers nécessaires
REDIRECTS_FILE="${REPORTS_DIR}/redirects.json"
GONE_FILE="${REPORTS_DIR}/deleted_routes.json"
MAPPING_FILE="${REPORTS_DIR}/legacy_route_map.json"
SEO_ROUTES_FILE="${REPORTS_DIR}/seo_routes.json"

# Vérifier l'existence des fichiers requis
FILES_MISSING=false

if [ ! -f "$REDIRECTS_FILE" ]; then
  echo -e "${YELLOW}⚠️ Le fichier de redirections n'existe pas: ${REDIRECTS_FILE}${NC}"
  FILES_MISSING=true
fi

if [ ! -f "$GONE_FILE" ]; then
  echo -e "${YELLOW}⚠️ Le fichier des routes supprimées n'existe pas: ${GONE_FILE}${NC}"
  FILES_MISSING=true
fi

if [ ! -f "$MAPPING_FILE" ]; then
  echo -e "${YELLOW}⚠️ Le fichier de mapping des routes n'existe pas: ${MAPPING_FILE}${NC}"
  FILES_MISSING=true
fi

if [ "$TEST_SEO_ONLY" = true ] && [ ! -f "$SEO_ROUTES_FILE" ]; then
  echo -e "${RED}❌ Le fichier des routes SEO n'existe pas: ${SEO_ROUTES_FILE}${NC}"
  echo -e "Ce fichier est requis pour l'option --seo-only."
  exit 1
fi

if [ "$FILES_MISSING" = true ]; then
  echo -e "${YELLOW}⚠️ Certains fichiers de configuration manquent. Les tests seront limités.${NC}"
fi

# Fichiers pour les résultats
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
RESULTS_JSON="${OUTPUT_DIR}/test-results-${TIMESTAMP}.json"
RESULTS_MD="${OUTPUT_DIR}/test-results-${TIMESTAMP}.md"
SUMMARY_FILE="${OUTPUT_DIR}/test-summary-${TIMESTAMP}.txt"

# Exécuter les tests
echo -e "${BLUE}Exécution des tests de redirection...${NC}"

# Script Node.js pour effectuer les tests
NODE_SCRIPT=$(cat << 'EOF'
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Arguments de ligne de commande
const baseUrl = process.argv[2];
const redirectsPath = process.argv[3];
const gonePath = process.argv[4];
const mappingPath = process.argv[5];
const seoRoutesPath = process.argv[6];
const resultsJsonPath = process.argv[7];
const resultsMdPath = process.argv[8];
const summaryPath = process.argv[9];
const testSeoOnly = process.argv[10] === 'true';
const testAll = process.argv[11] === 'true';
const maxTests = parseInt(process.argv[12]);
const timeout = parseInt(process.argv[13]);
const verbose = process.argv[14] === 'true';

// Structure pour les résultats
const results = {
  metadata: {
    timestamp: new Date().toISOString(),
    baseUrl,
    testSeoOnly,
    testAll,
    maxTests
  },
  summary: {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0
  },
  tests: []
};

// Variables pour suivre les routes testées
const testedRoutes = new Set();
let seoRoutes = [];

// Charger les routes SEO (si disponibles)
if (fs.existsSync(seoRoutesPath)) {
  try {
    seoRoutes = JSON.parse(fs.readFileSync(seoRoutesPath, 'utf8'));
    console.log(`Chargement de ${seoRoutes.length} routes SEO critiques.`);
  } catch (error) {
    console.error(`Erreur lors du chargement des routes SEO: ${error.message}`);
    seoRoutes = [];
  }
}

// Fonction pour vérifier si une route est importante pour le SEO
function isSeoRoute(route) {
  return seoRoutes.includes(route);
}

// Fonction pour tester une URL
async function testUrl(url, expectedStatus, expectedLocation = null, type) {
  // Nettoyer l'URL
  url = url.trim();
  
  // Si l'URL commence par /, ajouter l'URL de base
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Si cette URL a déjà été testée, ne pas la tester à nouveau
  const urlKey = `${fullUrl}|${expectedStatus}|${expectedLocation}`;
  if (testedRoutes.has(urlKey)) {
    return {
      skipped: true,
      url,
      fullUrl,
      reason: 'URL déjà testée'
    };
  }
  
  testedRoutes.add(urlKey);
  
  // Si on teste uniquement les routes SEO et que ce n'est pas une route SEO, ignorer
  if (testSeoOnly && !isSeoRoute(url) && type !== 'seo') {
    return {
      skipped: true,
      url,
      fullUrl,
      reason: 'Non SEO'
    };
  }
  
  return new Promise((resolve) => {
    // Commande curl avec options -s (silencieux), -I (uniquement les en-têtes), 
    // -L (suivre les redirections) et -w (format de sortie personnalisé)
    const curlProcess = spawn('curl', [
      '-s',
      '-I',
      '-o', '/dev/null',
      '-m', timeout.toString(),
      '-w', '%{http_code} %{redirect_url}',
      fullUrl
    ]);
    
    let output = '';
    
    curlProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curlProcess.stderr.on('data', (data) => {
      console.error(`Erreur curl: ${data}`);
    });
    
    curlProcess.on('close', (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          url,
          fullUrl,
          expectedStatus,
          expectedLocation,
          actualStatus: null,
          actualLocation: null,
          error: `Erreur curl (code ${code})`
        });
        return;
      }
      
      // Extraire le code de statut et l'URL de redirection
      const parts = output.trim().split(' ');
      const actualStatus = parseInt(parts[0]);
      const actualLocation = parts.slice(1).join(' ');
      
      // Vérifier si le code de statut correspond
      const statusSuccess = actualStatus === expectedStatus;
      
      // Vérifier si l'URL de redirection correspond (uniquement pour les redirections)
      let locationSuccess = true;
      if (expectedLocation && (actualStatus === 301 || actualStatus === 302)) {
        // Nettoyer les URLs pour la comparaison
        const cleanExpectedLocation = expectedLocation.replace(/^https?:\/\/[^\/]+/, '');
        const cleanActualLocation = actualLocation.replace(/^https?:\/\/[^\/]+/, '');
        locationSuccess = cleanActualLocation.includes(cleanExpectedLocation);
      }
      
      resolve({
        success: statusSuccess && locationSuccess,
        url,
        fullUrl,
        expectedStatus,
        expectedLocation,
        actualStatus,
        actualLocation,
        type
      });
    });
  });
}

// Fonction pour tester une collection d'URLs
async function testUrls(urls, category, description) {
  console.log(`Test de ${urls.length} ${category}...`);
  
  const results = [];
  for (const url of urls) {
    if (verbose) {
      process.stdout.write(`.`);
    }
    
    const result = await url.testFunction();
    results.push(result);
    
    if (!result.skipped) {
      if (result.success) {
        if (verbose) {
          process.stdout.write(`✓`);
        }
      } else {
        if (verbose) {
          process.stdout.write(`✗`);
        }
      }
    } else {
      if (verbose) {
        process.stdout.write(`-`);
      }
    }
  }
  
  if (verbose) {
    process.stdout.write(`\n`);
  }
  
  return {
    category,
    description,
    results
  };
}

// Collections d'URLs à tester
const urlsToTest = [];

// Charger les redirections
if (fs.existsSync(redirectsPath)) {
  try {
    const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
    
    Object.entries(redirects).forEach(([from, details]) => {
      const { to, status } = details;
      
      urlsToTest.push({
        url: from,
        testFunction: () => testUrl(from, status, to, 'redirect')
      });
    });
    
    console.log(`Chargement de ${Object.keys(redirects).length} redirections.`);
  } catch (error) {
    console.error(`Erreur lors du chargement des redirections: ${error.message}`);
  }
}

// Charger les routes supprimées
if (fs.existsSync(gonePath)) {
  try {
    const goneRoutes = JSON.parse(fs.readFileSync(gonePath, 'utf8'));
    
    goneRoutes.forEach(route => {
      urlsToTest.push({
        url: route,
        testFunction: () => testUrl(route, 410, null, 'gone')
      });
    });
    
    console.log(`Chargement de ${goneRoutes.length} routes supprimées.`);
  } catch (error) {
    console.error(`Erreur lors du chargement des routes supprimées: ${error.message}`);
  }
}

// Charger les mappings
if (fs.existsSync(mappingPath)) {
  try {
    const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    
    Object.entries(mappings).forEach(([from, to]) => {
      urlsToTest.push({
        url: from,
        testFunction: () => testUrl(from, 301, to, 'mapping')
      });
    });
    
    console.log(`Chargement de ${Object.keys(mappings).length} mappings.`);
  } catch (error) {
    console.error(`Erreur lors du chargement des mappings: ${error.message}`);
  }
}

// Effectuer les tests
(async () => {
  try {
    // Filtrer les routes à tester
    let filteredUrls = urlsToTest;
    
    // Si on teste uniquement les routes SEO, filtrer
    if (testSeoOnly) {
      filteredUrls = urlsToTest.filter(item => isSeoRoute(item.url));
      console.log(`Filtrage: ${filteredUrls.length} routes SEO importantes à tester.`);
    }
    
    // Si on ne teste pas toutes les routes, limiter
    if (!testAll && filteredUrls.length > maxTests) {
      // Prioritiser les routes SEO
      const seoUrls = filteredUrls.filter(item => isSeoRoute(item.url));
      const nonSeoUrls = filteredUrls.filter(item => !isSeoRoute(item.url));
      
      // Calculer combien de routes non-SEO on peut inclure
      const remainingSlots = Math.max(0, maxTests - seoUrls.length);
      
      // Combiner les routes SEO et un échantillon de routes non-SEO
      filteredUrls = [
        ...seoUrls,
        ...nonSeoUrls.slice(0, remainingSlots)
      ];
      
      console.log(`Limitation: Test de ${filteredUrls.length} routes (sur ${urlsToTest.length}).`);
    }
    
    // Effectuer les tests
    console.log(`Début des tests avec timeout de ${timeout}s par requête...`);
    
    const startTime = Date.now();
    const testResults = [];
    
    // Exécuter les tests par lots
    const BATCH_SIZE = 10;
    for (let i = 0; i < filteredUrls.length; i += BATCH_SIZE) {
      const batch = filteredUrls.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(item => item.testFunction());
      const batchResults = await Promise.all(batchPromises);
      
      testResults.push(...batchResults);
      
      console.log(`Progression: ${Math.min(i + BATCH_SIZE, filteredUrls.length)}/${filteredUrls.length} URLs testées`);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Calculer les statistiques
    results.summary.total = testResults.length;
    results.summary.success = testResults.filter(r => !r.skipped && r.success).length;
    results.summary.failed = testResults.filter(r => !r.skipped && !r.success).length;
    results.summary.skipped = testResults.filter(r => r.skipped).length;
    
    // Organiser les résultats par catégorie
    const successResults = testResults.filter(r => !r.skipped && r.success);
    const failedResults = testResults.filter(r => !r.skipped && !r.success);
    const skippedResults = testResults.filter(r => r.skipped);
    
    // Ajouter les résultats à la structure principale
    results.tests = testResults;
    
    // Écrire les résultats en JSON
    fs.writeFileSync(resultsJsonPath, JSON.stringify(results, null, 2), 'utf8');
    
    // Écrire les résultats en Markdown
    let markdownContent = `# Rapport de test des redirections\n\n`;
    markdownContent += `Test effectué le ${new Date().toLocaleString()}\n\n`;
    
    markdownContent += `## Résumé\n\n`;
    markdownContent += `- **URL de base**: ${baseUrl}\n`;
    markdownContent += `- **URLs testées**: ${results.summary.total}\n`;
    markdownContent += `- **Succès**: ${results.summary.success}\n`;
    markdownContent += `- **Échecs**: ${results.summary.failed}\n`;
    markdownContent += `- **Ignorées**: ${results.summary.skipped}\n`;
    markdownContent += `- **Durée**: ${duration.toFixed(2)} secondes\n\n`;
    
    // Échecs
    if (failedResults.length > 0) {
      markdownContent += `## Échecs (${failedResults.length})\n\n`;
      markdownContent += `| URL | Attendu | Obtenu | Destination attendue | Destination obtenue |\n`;
      markdownContent += `| --- | --- | --- | --- | --- |\n`;
      
      failedResults.forEach(r => {
        markdownContent += `| \`${r.url}\` | ${r.expectedStatus} | ${r.actualStatus || 'N/A'} | ${r.expectedLocation || 'N/A'} | ${r.actualLocation || 'N/A'} |\n`;
      });
      
      markdownContent += `\n`;
    }
    
    // Succès (limité pour éviter les fichiers trop grands)
    const successLimit = 20;
    markdownContent += `## Succès (${successResults.length})\n\n`;
    
    if (successResults.length > 0) {
      markdownContent += `| URL | Statut | Destination |\n`;
      markdownContent += `| --- | --- | --- |\n`;
      
      successResults.slice(0, successLimit).forEach(r => {
        markdownContent += `| \`${r.url}\` | ${r.actualStatus} | ${r.actualLocation || 'N/A'} |\n`;
      });
      
      if (successResults.length > successLimit) {
        markdownContent += `\n_... et ${successResults.length - successLimit} autres URL avec succès._\n`;
      }
      
      markdownContent += `\n`;
    }
    
    fs.writeFileSync(resultsMdPath, markdownContent, 'utf8');
    
    // Écrire un résumé
    let summaryContent = `Test des redirections - ${new Date().toLocaleString()}\n\n`;
    summaryContent += `Total: ${results.summary.total}\n`;
    summaryContent += `Succès: ${results.summary.success}\n`;
    summaryContent += `Échecs: ${results.summary.failed}\n`;
    summaryContent += `Ignorées: ${results.summary.skipped}\n`;
    summaryContent += `Durée: ${duration.toFixed(2)} secondes\n\n`;
    
    if (failedResults.length > 0) {
      summaryContent += `Échecs:\n`;
      failedResults.forEach(r => {
        summaryContent += `- ${r.url} (${r.expectedStatus} -> ${r.actualStatus || 'N/A'})\n`;
      });
    }
    
    fs.writeFileSync(summaryPath, summaryContent, 'utf8');
    
    console.log(`Tests terminés en ${duration.toFixed(2)} secondes.`);
    console.log(`Total: ${results.summary.total}, Succès: ${results.summary.success}, Échecs: ${results.summary.failed}, Ignorées: ${results.summary.skipped}`);
    console.log(`Résultats écrits dans:`);
    console.log(`- JSON: ${resultsJsonPath}`);
    console.log(`- Markdown: ${resultsMdPath}`);
    console.log(`- Résumé: ${summaryPath}`);
    
    // Sortir avec un code d'erreur si des échecs
    process.exit(results.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(`Erreur lors de l'exécution des tests:`, error);
    process.exit(1);
  }
})();
EOF
)

# Exécuter les tests
node -e "$NODE_SCRIPT" "$BASE_URL" "$REDIRECTS_FILE" "$GONE_FILE" "$MAPPING_FILE" "$SEO_ROUTES_FILE" "$RESULTS_JSON" "$RESULTS_MD" "$SUMMARY_FILE" "$TEST_SEO_ONLY" "$TEST_ALL" "$MAX_TESTS" "$TIMEOUT" "$VERBOSE"

EXIT_CODE=$?

# Afficher le résumé
echo ""
echo -e "${BLUE}Résumé des tests:${NC}"
cat "$SUMMARY_FILE"

# Fournir un lien vers le rapport détaillé
echo ""
echo -e "Rapport détaillé: ${RESULTS_MD}"

# Sortir avec le code d'erreur approprié
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les tests ont réussi${NC}"
  exit 0
else
  echo -e "${RED}❌ Certains tests ont échoué${NC}"
  exit 1
fi