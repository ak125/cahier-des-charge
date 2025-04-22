#!/bin/bash
# Script pour l'audit SEO périodique des routes .htaccess
# Ce script exécute une analyse complète des règles .htaccess pour détecter de nouvelles routes
# et générer un rapport d'audit SEO

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paramètres par défaut
HTACCESS_FILE=""
OUTPUT_DIR="./reports/seo-audit"
INCLUDE_COMMON_PHP=true
GENERATE_SEO_REPORT=true
COMPARE_PREVIOUS=true
NOTIFY=true
EMAIL_TO=""

# Afficher l'aide
function show_help() {
  echo -e "${BLUE}=== Audit SEO périodique des routes .htaccess ===${NC}"
  echo ""
  echo "Ce script exécute une analyse complète des règles .htaccess pour détecter"
  echo "de nouvelles routes et générer un rapport d'audit SEO."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -h, --htaccess FILE     Fichier .htaccess à analyser"
  echo "  -o, --output DIR        Répertoire de sortie pour les rapports (par défaut: ./reports/seo-audit)"
  echo "  -p, --php               Inclure les routes PHP courantes même si absentes du .htaccess (par défaut: oui)"
  echo "  -s, --seo               Générer un rapport d'audit SEO (par défaut: oui)"
  echo "  -c, --compare           Comparer avec le rapport précédent (par défaut: oui)"
  echo "  -n, --notify            Envoyer une notification par email (par défaut: oui)"
  echo "  -e, --email EMAIL       Adresse email pour les notifications"
  echo "  --help                  Afficher cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 -h /path/to/.htaccess -o ./reports/seo-audit -e admin@example.com"
  exit 0
}

# Traiter les arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--htaccess)
      HTACCESS_FILE="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -p|--php)
      if [[ "$2" == "oui" || "$2" == "true" || "$2" == "1" ]]; then
        INCLUDE_COMMON_PHP=true
      else
        INCLUDE_COMMON_PHP=false
      fi
      shift 2
      ;;
    -s|--seo)
      if [[ "$2" == "oui" || "$2" == "true" || "$2" == "1" ]]; then
        GENERATE_SEO_REPORT=true
      else
        GENERATE_SEO_REPORT=false
      fi
      shift 2
      ;;
    -c|--compare)
      if [[ "$2" == "oui" || "$2" == "true" || "$2" == "1" ]]; then
        COMPARE_PREVIOUS=true
      else
        COMPARE_PREVIOUS=false
      fi
      shift 2
      ;;
    -n|--notify)
      if [[ "$2" == "oui" || "$2" == "true" || "$2" == "1" ]]; then
        NOTIFY=true
      else
        NOTIFY=false
      fi
      shift 2
      ;;
    -e|--email)
      EMAIL_TO="$2"
      shift 2
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

# Vérifier que le fichier .htaccess est spécifié
if [ -z "$HTACCESS_FILE" ]; then
  echo -e "${RED}❌ Vous devez spécifier un fichier .htaccess avec l'option -h${NC}"
  exit 1
fi

# Vérifier que le fichier .htaccess existe
if [ ! -f "$HTACCESS_FILE" ]; then
  echo -e "${RED}❌ Le fichier .htaccess n'existe pas: ${HTACCESS_FILE}${NC}"
  exit 1
fi

# Créer le répertoire de sortie
mkdir -p "$OUTPUT_DIR"

# Générer un timestamp pour ce rapport
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_DIR="${OUTPUT_DIR}/${TIMESTAMP}"
mkdir -p "$REPORT_DIR"

# Afficher les informations d'audit
echo -e "${BLUE}=== Audit SEO périodique des routes .htaccess ===${NC}"
echo -e "Fichier .htaccess: ${HTACCESS_FILE}"
echo -e "Répertoire de sortie: ${REPORT_DIR}"
echo -e "Inclure les routes PHP courantes: ${INCLUDE_COMMON_PHP}"
echo -e "Générer un rapport d'audit SEO: ${GENERATE_SEO_REPORT}"
echo -e "Comparer avec le rapport précédent: ${COMPARE_PREVIOUS}"
echo -e "Envoyer une notification: ${NOTIFY}"
if [ "$NOTIFY" = "true" ]; then
  echo -e "Email pour les notifications: ${EMAIL_TO}"
fi
echo ""

# Exécuter l'analyse des règles .htaccess
echo -e "${BLUE}Analyse des règles .htaccess...${NC}"

# Préparer les options pour le script d'analyse
ANALYZE_OPTIONS=""
if [ "$INCLUDE_COMMON_PHP" = "true" ]; then
  ANALYZE_OPTIONS="$ANALYZE_OPTIONS --include-common-php"
fi
if [ "$GENERATE_SEO_REPORT" = "true" ]; then
  ANALYZE_OPTIONS="$ANALYZE_OPTIONS --seo"
fi

# Exécuter le script d'analyse
echo -e "Exécution: ./analyze-htaccess.sh -h \"$HTACCESS_FILE\" -o \"$REPORT_DIR\" $ANALYZE_OPTIONS"
./analyze-htaccess.sh -h "$HTACCESS_FILE" -o "$REPORT_DIR" $ANALYZE_OPTIONS

# Vérifier le résultat de l'analyse
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ L'analyse des règles .htaccess a échoué${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Analyse des règles .htaccess terminée${NC}"

# Comparer avec le rapport précédent
if [ "$COMPARE_PREVIOUS" = "true" ]; then
  echo -e "${BLUE}Comparaison avec le rapport précédent...${NC}"
  
  # Trouver le rapport précédent le plus récent
  PREVIOUS_REPORT_DIR=$(find "$OUTPUT_DIR" -maxdepth 1 -type d -not -name "$(basename $REPORT_DIR)" | sort -r | head -n 1)
  
  if [ -z "$PREVIOUS_REPORT_DIR" ] || [ ! -d "$PREVIOUS_REPORT_DIR" ]; then
    echo -e "${YELLOW}⚠️ Aucun rapport précédent trouvé pour la comparaison${NC}"
  else
    echo -e "Rapport précédent trouvé: ${PREVIOUS_REPORT_DIR}"
    
    # Comparer les fichiers de redirections
    if [ -f "$REPORT_DIR/redirects.json" ] && [ -f "$PREVIOUS_REPORT_DIR/redirects.json" ]; then
      echo -e "Comparaison des fichiers de redirections..."
      
      # Générer un rapport de comparaison
      COMPARISON_REPORT="$REPORT_DIR/comparison-report.json"
      
      # Utiliser jq pour comparer les fichiers
      NEW_REDIRECTS=$(jq -s '
        [
          # Accéder au premier fichier (actuel), obtenir les clés (URLs)
          (.[0] | keys[]) as $url
          # Filtrer les URLs qui n\'existent pas dans le deuxième fichier (précédent)
          | select(.[1][$url] | not)
          # Retourner l\'URL et sa configuration
          | {($url): .[0][$url]}
        ] | add // {}
      ' "$REPORT_DIR/redirects.json" "$PREVIOUS_REPORT_DIR/redirects.json")
      
      REMOVED_REDIRECTS=$(jq -s '
        [
          # Accéder au deuxième fichier (précédent), obtenir les clés (URLs)
          (.[1] | keys[]) as $url
          # Filtrer les URLs qui n\'existent pas dans le premier fichier (actuel)
          | select(.[0][$url] | not)
          # Retourner l\'URL et sa configuration
          | {($url): .[1][$url]}
        ] | add // {}
      ' "$REPORT_DIR/redirects.json" "$PREVIOUS_REPORT_DIR/redirects.json")
      
      CHANGED_REDIRECTS=$(jq -s '
        [
          # Accéder au premier fichier (actuel), obtenir les clés (URLs)
          (.[0] | keys[]) as $url
          # Filtrer les URLs qui existent dans les deux fichiers
          | select(.[1][$url])
          # Mais dont la configuration a changé
          | select(.[0][$url] != .[1][$url])
          # Retourner l\'URL et ses configurations (avant/après)
          | {($url): {"new": .[0][$url], "old": .[1][$url]}}
        ] | add // {}
      ' "$REPORT_DIR/redirects.json" "$PREVIOUS_REPORT_DIR/redirects.json")
      
      # Créer le rapport de comparaison
      jq -n --argjson new "$NEW_REDIRECTS" --argjson removed "$REMOVED_REDIRECTS" --argjson changed "$CHANGED_REDIRECTS" '{
        "timestamp": "'"$(date -Iseconds)"'",
        "new": ($new | length),
        "removed": ($removed | length),
        "changed": ($changed | length),
        "newRedirects": $new,
        "removedRedirects": $removed,
        "changedRedirects": $changed
      }' > "$COMPARISON_REPORT"
      
      echo -e "Rapport de comparaison généré: ${COMPARISON_REPORT}"
      
      # Afficher un résumé
      NEW_COUNT=$(jq '.new' "$COMPARISON_REPORT")
      REMOVED_COUNT=$(jq '.removed' "$COMPARISON_REPORT")
      CHANGED_COUNT=$(jq '.changed' "$COMPARISON_REPORT")
      
      echo -e "Résumé de la comparaison:"
      echo -e "- ${GREEN}Nouvelles redirections: ${NEW_COUNT}${NC}"
      echo -e "- ${RED}Redirections supprimées: ${REMOVED_COUNT}${NC}"
      echo -e "- ${YELLOW}Redirections modifiées: ${CHANGED_COUNT}${NC}"
      
      # Générer un rapport HTML
      HTML_REPORT="$REPORT_DIR/comparison-report.html"
      
      cat > "$HTML_REPORT" << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de comparaison - Audit SEO</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    h1, h2 { color: #333; }
    .summary { margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
    .new { color: #28a745; }
    .removed { color: #dc3545; }
    .changed { color: #fd7e14; }
    .section { margin-top: 30px; }
    .url-card {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 15px;
      background-color: #fff;
    }
    .url-card h4 {
      margin-top: 0;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .code {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
    }
    .empty-message {
      color: #666;
      font-style: italic;
    }
    .diff-table {
      width: 100%;
      border-collapse: collapse;
    }
    .diff-table th, .diff-table td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    .diff-table th {
      background-color: #f5f5f5;
      text-align: left;
    }
  </style>
</head>
<body>
  <h1>Rapport de comparaison - Audit SEO</h1>
  
  <div class="summary">
    <p><strong>Date de l'analyse :</strong> $(date '+%Y-%m-%d %H:%M:%S')</p>
    <p><strong>Comparaison entre :</strong></p>
    <ul>
      <li><strong>Rapport actuel :</strong> $(basename "$REPORT_DIR")</li>
      <li><strong>Rapport précédent :</strong> $(basename "$PREVIOUS_REPORT_DIR")</li>
    </ul>
    <p><strong>Résumé des modifications :</strong></p>
    <ul>
      <li><span class="new"><strong>Nouvelles redirections :</strong> ${NEW_COUNT}</span></li>
      <li><span class="removed"><strong>Redirections supprimées :</strong> ${REMOVED_COUNT}</span></li>
      <li><span class="changed"><strong>Redirections modifiées :</strong> ${CHANGED_COUNT}</span></li>
    </ul>
  </div>
  
  <div class="section">
    <h2 class="new">Nouvelles redirections (${NEW_COUNT})</h2>
    <div id="new-redirects">
      <!-- Rempli par JavaScript -->
    </div>
  </div>
  
  <div class="section">
    <h2 class="removed">Redirections supprimées (${REMOVED_COUNT})</h2>
    <div id="removed-redirects">
      <!-- Rempli par JavaScript -->
    </div>
  </div>
  
  <div class="section">
    <h2 class="changed">Redirections modifiées (${CHANGED_COUNT})</h2>
    <div id="changed-redirects">
      <!-- Rempli par JavaScript -->
    </div>
  </div>
  
  <script>
    // Charger les données de comparaison
    const comparisonData = $(cat "$COMPARISON_REPORT");
    
    // Fonction pour échapper le HTML
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    
    // Fonction pour formater un objet JSON
    function formatJson(obj) {
      return JSON.stringify(obj, null, 2)
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
    }
    
    // Remplir la section des nouvelles redirections
    const newRedirectsContainer = document.getElementById('new-redirects');
    if (comparisonData.new > 0) {
      const newUrls = Object.keys(comparisonData.newRedirects);
      newUrls.forEach(url => {
        const config = comparisonData.newRedirects[url];
        const card = document.createElement('div');
        card.className = 'url-card';
        card.innerHTML = \`
          <h4>\${escapeHtml(url)}</h4>
          <div class="code">\${formatJson(config)}</div>
        \`;
        newRedirectsContainer.appendChild(card);
      });
    } else {
      newRedirectsContainer.innerHTML = '<p class="empty-message">Aucune nouvelle redirection détectée.</p>';
    }
    
    // Remplir la section des redirections supprimées
    const removedRedirectsContainer = document.getElementById('removed-redirects');
    if (comparisonData.removed > 0) {
      const removedUrls = Object.keys(comparisonData.removedRedirects);
      removedUrls.forEach(url => {
        const config = comparisonData.removedRedirects[url];
        const card = document.createElement('div');
        card.className = 'url-card';
        card.innerHTML = \`
          <h4>\${escapeHtml(url)}</h4>
          <div class="code">\${formatJson(config)}</div>
        \`;
        removedRedirectsContainer.appendChild(card);
      });
    } else {
      removedRedirectsContainer.innerHTML = '<p class="empty-message">Aucune redirection supprimée.</p>';
    }
    
    // Remplir la section des redirections modifiées
    const changedRedirectsContainer = document.getElementById('changed-redirects');
    if (comparisonData.changed > 0) {
      const changedUrls = Object.keys(comparisonData.changedRedirects);
      changedUrls.forEach(url => {
        const change = comparisonData.changedRedirects[url];
        const card = document.createElement('div');
        card.className = 'url-card';
        card.innerHTML = \`
          <h4>\${escapeHtml(url)}</h4>
          <table class="diff-table">
            <tr>
              <th>Propriété</th>
              <th>Ancienne valeur</th>
              <th>Nouvelle valeur</th>
            </tr>
            <tr>
              <td>URL cible</td>
              <td>\${escapeHtml(change.old.to || '')}</td>
              <td>\${escapeHtml(change.new.to || '')}</td>
            </tr>
            <tr>
              <td>Statut HTTP</td>
              <td>\${change.old.status || ''}</td>
              <td>\${change.new.status || ''}</td>
            </tr>
          </table>
        \`;
        changedRedirectsContainer.appendChild(card);
      });
    } else {
      changedRedirectsContainer.innerHTML = '<p class="empty-message">Aucune redirection modifiée.</p>';
    }
  </script>
</body>
</html>
EOF
      
      echo -e "Rapport HTML de comparaison généré: ${HTML_REPORT}"
    else
      echo -e "${YELLOW}⚠️ Impossible de comparer les fichiers de redirections (fichiers manquants)${NC}"
    fi
    
    # Comparer les routes SEO
    if [ -f "$REPORT_DIR/seo_routes.json" ] && [ -f "$PREVIOUS_REPORT_DIR/seo_routes.json" ]; then
      echo -e "Comparaison des routes SEO..."
      
      # Générer un rapport de comparaison des routes SEO
      SEO_COMPARISON_REPORT="$REPORT_DIR/seo-comparison-report.json"
      
      # Utiliser jq pour comparer les fichiers de routes SEO
      NEW_SEO_ROUTES=$(jq -s '
        [
          # Accéder au premier fichier (actuel)
          .[0][] as $route
          # Filtrer les routes qui n\'existent pas dans le deuxième fichier (précédent)
          | select(.[1][] | . == $route | not)
        ]
      ' "$REPORT_DIR/seo_routes.json" "$PREVIOUS_REPORT_DIR/seo_routes.json")
      
      REMOVED_SEO_ROUTES=$(jq -s '
        [
          # Accéder au deuxième fichier (précédent)
          .[1][] as $route
          # Filtrer les routes qui n\'existent pas dans le premier fichier (actuel)
          | select(.[0][] | . == $route | not)
        ]
      ' "$REPORT_DIR/seo_routes.json" "$PREVIOUS_REPORT_DIR/seo_routes.json")
      
      # Créer le rapport de comparaison des routes SEO
      jq -n --argjson new "$NEW_SEO_ROUTES" --argjson removed "$REMOVED_SEO_ROUTES" '{
        "timestamp": "'"$(date -Iseconds)"'",
        "new": ($new | length),
        "removed": ($removed | length),
        "newRoutes": $new,
        "removedRoutes": $removed
      }' > "$SEO_COMPARISON_REPORT"
      
      echo -e "Rapport de comparaison des routes SEO généré: ${SEO_COMPARISON_REPORT}"
      
      # Afficher un résumé
      NEW_SEO_COUNT=$(jq '.new' "$SEO_COMPARISON_REPORT")
      REMOVED_SEO_COUNT=$(jq '.removed' "$SEO_COMPARISON_REPORT")
      
      echo -e "Résumé de la comparaison des routes SEO:"
      echo -e "- ${GREEN}Nouvelles routes SEO: ${NEW_SEO_COUNT}${NC}"
      echo -e "- ${RED}Routes SEO supprimées: ${REMOVED_SEO_COUNT}${NC}"
    else
      echo -e "${YELLOW}⚠️ Impossible de comparer les routes SEO (fichiers manquants)${NC}"
    fi
  fi
fi

# Générer un rapport SEO complet
if [ "$GENERATE_SEO_REPORT" = "true" ]; then
  echo -e "${BLUE}Génération du rapport SEO complet...${NC}"
  
  # Vérifier si le fichier seo_routes.json existe
  if [ ! -f "$REPORT_DIR/seo_routes.json" ]; then
    echo -e "${YELLOW}⚠️ Le fichier seo_routes.json n'existe pas, impossible de générer le rapport SEO${NC}"
  else
    # Générer le rapport SEO
    SEO_REPORT="$REPORT_DIR/seo-audit-report.html"
    
    # Compter le nombre de routes SEO
    SEO_ROUTES_COUNT=$(jq 'length' "$REPORT_DIR/seo_routes.json")
    
    # Obtenir le nombre total de redirections
    REDIRECTS_COUNT=0
    if [ -f "$REPORT_DIR/redirects.json" ]; then
      REDIRECTS_COUNT=$(jq 'length' "$REPORT_DIR/redirects.json")
    fi
    
    # Calculer le pourcentage de couverture SEO
    SEO_COVERAGE=0
    if [ $REDIRECTS_COUNT -gt 0 ]; then
      SEO_COVERAGE=$(echo "scale=2; $SEO_ROUTES_COUNT * 100 / $REDIRECTS_COUNT" | bc)
    fi
    
    # Générer le rapport HTML
    cat > "$SEO_REPORT" << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'audit SEO - Routes .htaccess</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    h1, h2 { color: #333; }
    .summary { margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
    .metrics { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }
    .metric-card {
      flex: 1;
      min-width: 200px;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      background-color: #fff;
      text-align: center;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .metric-name {
      font-size: 14px;
      color: #666;
    }
    .route-list {
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .route-item {
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
    }
    .route-item:last-child {
      border-bottom: none;
    }
    .route-item:hover {
      background-color: #f5f5f5;
    }
    .code {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .filter-input {
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .recommendations {
      margin-top: 30px;
      padding: 15px;
      background-color: #e9f7fd;
      border-left: 4px solid #0099cc;
      border-radius: 5px;
    }
    .recommendations h3 {
      margin-top: 0;
      color: #0077aa;
    }
  </style>
</head>
<body>
  <h1>Rapport d'audit SEO - Routes .htaccess</h1>
  
  <div class="summary">
    <p><strong>Date de l'analyse :</strong> $(date '+%Y-%m-%d %H:%M:%S')</p>
    <p><strong>Fichier .htaccess analysé :</strong> ${HTACCESS_FILE}</p>
  </div>
  
  <div class="metrics">
    <div class="metric-card">
      <div class="metric-name">Routes SEO critiques</div>
      <div class="metric-value">${SEO_ROUTES_COUNT}</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-name">Redirections totales</div>
      <div class="metric-value">${REDIRECTS_COUNT}</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-name">Couverture SEO</div>
      <div class="metric-value">${SEO_COVERAGE}%</div>
    </div>
  </div>
  
  <h2>Routes SEO critiques</h2>
  
  <input type="text" id="route-filter" class="filter-input" placeholder="Filtrer les routes...">
  
  <div id="route-list" class="route-list">
    <!-- Rempli dynamiquement par JavaScript -->
  </div>
  
  <div class="recommendations">
    <h3>Recommandations</h3>
    <ol>
      <li>Assurez-vous que toutes les routes SEO critiques sont correctement redirigées (code 301)</li>
      <li>Vérifiez régulièrement les logs pour identifier de nouvelles routes SEO potentielles</li>
      <li>Utilisez <code>./test-redirections.sh</code> pour tester les routes SEO critiques</li>
      <li>Surveillez les alertes de routes manquantes avec <code>./scripts/monitor-missed-routes.js</code></li>
    </ol>
  </div>
  
  <script>
    // Charger les données des routes SEO
    const seoRoutes = $(cat "$REPORT_DIR/seo_routes.json");
    
    // Fonction pour échapper le HTML
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    
    // Fonction pour remplir la liste des routes
    function populateRouteList(routes, filter = '') {
      const routeList = document.getElementById('route-list');
      routeList.innerHTML = '';
      
      // Filtrer les routes si nécessaire
      const filteredRoutes = filter 
        ? routes.filter(route => route.toLowerCase().includes(filter.toLowerCase()))
        : routes;
      
      if (filteredRoutes.length === 0) {
        routeList.innerHTML = '<div class="route-item">Aucune route ne correspond au filtre.</div>';
        return;
      }
      
      filteredRoutes.forEach(route => {
        const item = document.createElement('div');
        item.className = 'route-item';
        item.innerHTML = \`<code>\${escapeHtml(route)}</code>\`;
        routeList.appendChild(item);
      });
    }
    
    // Initialiser la liste des routes
    populateRouteList(seoRoutes);
    
    // Gérer le filtrage des routes
    const filterInput = document.getElementById('route-filter');
    filterInput.addEventListener('input', (e) => {
      populateRouteList(seoRoutes, e.target.value);
    });
  </script>
</body>
</html>
EOF
    
    echo -e "Rapport SEO complet généré: ${SEO_REPORT}"
  fi
fi

# Envoyer une notification
if [ "$NOTIFY" = "true" ] && [ ! -z "$EMAIL_TO" ]; then
  echo -e "${BLUE}Envoi d'une notification par email...${NC}"
  
  # Construire le message email
  EMAIL_SUBJECT="Rapport d'audit SEO des routes .htaccess - ${TIMESTAMP}"
  EMAIL_BODY="Rapport d'audit SEO des routes .htaccess\n\n"
  EMAIL_BODY+="Date de l'analyse: $(date '+%Y-%m-%d %H:%M:%S')\n"
  EMAIL_BODY+="Fichier .htaccess analysé: ${HTACCESS_FILE}\n\n"
  
  # Ajouter les statistiques
  EMAIL_BODY+="Statistiques:\n"
  
  SEO_ROUTES_COUNT=0
  if [ -f "$REPORT_DIR/seo_routes.json" ]; then
    SEO_ROUTES_COUNT=$(jq 'length' "$REPORT_DIR/seo_routes.json")
    EMAIL_BODY+="- Routes SEO critiques: ${SEO_ROUTES_COUNT}\n"
  fi
  
  REDIRECTS_COUNT=0
  if [ -f "$REPORT_DIR/redirects.json" ]; then
    REDIRECTS_COUNT=$(jq 'length' "$REPORT_DIR/redirects.json")
    EMAIL_BODY+="- Redirections totales: ${REDIRECTS_COUNT}\n"
  fi
  
  # Ajouter les résultats de la comparaison si disponibles
  if [ "$COMPARE_PREVIOUS" = "true" ] && [ -f "$REPORT_DIR/comparison-report.json" ]; then
    NEW_COUNT=$(jq '.new' "$REPORT_DIR/comparison-report.json")
    REMOVED_COUNT=$(jq '.removed' "$REPORT_DIR/comparison-report.json")
    CHANGED_COUNT=$(jq '.changed' "$REPORT_DIR/comparison-report.json")
    
    EMAIL_BODY+="\nComparaison avec le rapport précédent:\n"
    EMAIL_BODY+="- Nouvelles redirections: ${NEW_COUNT}\n"
    EMAIL_BODY+="- Redirections supprimées: ${REMOVED_COUNT}\n"
    EMAIL_BODY+="- Redirections modifiées: ${CHANGED_COUNT}\n"
  fi
  
  # Ajouter les résultats de la comparaison SEO si disponibles
  if [ "$COMPARE_PREVIOUS" = "true" ] && [ -f "$REPORT_DIR/seo-comparison-report.json" ]; then
    NEW_SEO_COUNT=$(jq '.new' "$REPORT_DIR/seo-comparison-report.json")
    REMOVED_SEO_COUNT=$(jq '.removed' "$REPORT_DIR/seo-comparison-report.json")
    
    EMAIL_BODY+="\nComparaison des routes SEO:\n"
    EMAIL_BODY+="- Nouvelles routes SEO: ${NEW_SEO_COUNT}\n"
    EMAIL_BODY+="- Routes SEO supprimées: ${REMOVED_SEO_COUNT}\n"
  fi
  
  # Ajouter les liens vers les rapports
  EMAIL_BODY+="\nRapports disponibles:\n"
  if [ -f "$REPORT_DIR/seo-audit-report.html" ]; then
    EMAIL_BODY+="- Rapport SEO complet: ${REPORT_DIR}/seo-audit-report.html\n"
  fi
  if [ -f "$REPORT_DIR/comparison-report.html" ]; then
    EMAIL_BODY+="- Rapport de comparaison: ${REPORT_DIR}/comparison-report.html\n"
  fi
  
  # Envoyer l'email
  echo -e "Envoi d'un email à ${EMAIL_TO}..."
  echo -e "$EMAIL_BODY" | mail -s "$EMAIL_SUBJECT" "$EMAIL_TO"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Email envoyé avec succès${NC}"
  else
    echo -e "${RED}❌ Échec de l'envoi de l'email${NC}"
  fi
fi

echo -e "${GREEN}✅ Audit SEO périodique terminé${NC}"
echo -e "Rapports disponibles dans: ${REPORT_DIR}"

# Créer un lien symbolique vers le dernier rapport
ln -sf "$REPORT_DIR" "${OUTPUT_DIR}/latest"
echo -e "Lien symbolique vers le dernier rapport créé: ${OUTPUT_DIR}/latest"