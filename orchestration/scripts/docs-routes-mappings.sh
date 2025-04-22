#!/bin/bash
# Script pour générer une documentation des mappings de routes
# docs-routes-mappings.sh

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
REPORTS_DIR="./reports"
OUTPUT_DIR="./docs/routes"
OUTPUT_FORMAT="markdown" # markdown, html, json
INCLUDE_TIMESTAMPS=true
INCLUDE_STATS=true
INCLUDE_MISSED_URLS=true
INCLUDE_GOT_STATUS=true

# Afficher l'aide
function show_help {
  echo -e "${BLUE}Documentation des mappings de routes${NC}"
  echo ""
  echo "Ce script génère une documentation complète des mappings de routes"
  echo "à partir des fichiers générés par l'analyse .htaccess."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -r, --reports-dir DIR    Répertoire des rapports d'entrée (défaut: $REPORTS_DIR)"
  echo "  -o, --output-dir DIR     Répertoire de sortie pour la documentation (défaut: $OUTPUT_DIR)"
  echo "  -f, --format FORMAT      Format de sortie: markdown, html, json (défaut: $OUTPUT_FORMAT)"
  echo "  --no-timestamps          Ne pas inclure les horodatages"
  echo "  --no-stats               Ne pas inclure les statistiques"
  echo "  --no-missed-urls         Ne pas inclure les URLs manquées"
  echo "  --no-got-status          Ne pas inclure les tests de statut"
  echo "  --help                   Afficher cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 -f html -o ./public/docs/routes"
  exit 0
}

# Traiter les arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--reports-dir)
      REPORTS_DIR="$2"
      shift 2
      ;;
    -o|--output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -f|--format)
      OUTPUT_FORMAT="$2"
      if [[ ! "$OUTPUT_FORMAT" =~ ^(markdown|html|json)$ ]]; then
        echo -e "${RED}Format invalide. Utilisez 'markdown', 'html' ou 'json'.${NC}"
        exit 1
      fi
      shift 2
      ;;
    --no-timestamps)
      INCLUDE_TIMESTAMPS=false
      shift
      ;;
    --no-stats)
      INCLUDE_STATS=false
      shift
      ;;
    --no-missed-urls)
      INCLUDE_MISSED_URLS=false
      shift
      ;;
    --no-got-status)
      INCLUDE_GOT_STATUS=false
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo -e "${RED}Option inconnue: $1${NC}"
      show_help
      ;;
  esac
done

# Vérifier que le répertoire des rapports existe
if [ ! -d "$REPORTS_DIR" ]; then
  echo -e "${RED}❌ Le répertoire des rapports n'existe pas: $REPORTS_DIR${NC}"
  exit 1
fi

# Créer le répertoire de sortie
mkdir -p "$OUTPUT_DIR"

# Vérifier les fichiers d'entrée nécessaires
REDIRECTS_FILE="$REPORTS_DIR/redirects.json"
DELETED_ROUTES_FILE="$REPORTS_DIR/deleted_routes.json"
LEGACY_ROUTE_MAP_FILE="$REPORTS_DIR/legacy_route_map.json"
SEO_ROUTES_FILE="$REPORTS_DIR/seo_routes.json"

MISSING_FILES=()
for file in "$REDIRECTS_FILE" "$DELETED_ROUTES_FILE" "$LEGACY_ROUTE_MAP_FILE" "$SEO_ROUTES_FILE"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠️ Certains fichiers d'entrée sont manquants:${NC}"
  for file in "${MISSING_FILES[@]}"; do
    echo "   - $file"
  done
  echo -e "${YELLOW}La documentation générée pourrait être incomplète.${NC}"
fi

# Déterminer la date de génération et les noms de fichiers de sortie
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
DATE_SLUG=$(date "+%Y%m%d")

BASE_FILENAME="routes-mapping-$DATE_SLUG"
case "$OUTPUT_FORMAT" in
  markdown)
    OUTPUT_FILE="$OUTPUT_DIR/$BASE_FILENAME.md"
    ;;
  html)
    OUTPUT_FILE="$OUTPUT_DIR/$BASE_FILENAME.html"
    ;;
  json)
    OUTPUT_FILE="$OUTPUT_DIR/$BASE_FILENAME.json"
    ;;
esac

# Calculer les statistiques
TOTAL_REDIRECTS=0
TOTAL_DELETED=0
TOTAL_MAPPINGS=0
TOTAL_SEO_ROUTES=0

if [ -f "$REDIRECTS_FILE" ]; then
  TOTAL_REDIRECTS=$(jq 'length' "$REDIRECTS_FILE")
fi

if [ -f "$DELETED_ROUTES_FILE" ]; then
  TOTAL_DELETED=$(jq 'length' "$DELETED_ROUTES_FILE")
fi

if [ -f "$LEGACY_ROUTE_MAP_FILE" ]; then
  TOTAL_MAPPINGS=$(jq 'length' "$LEGACY_ROUTE_MAP_FILE")
fi

if [ -f "$SEO_ROUTES_FILE" ]; then
  TOTAL_SEO_ROUTES=$(jq 'length' "$SEO_ROUTES_FILE")
fi

# Récupérer les URLs manquées si demandé
MISSED_URLS_LOG="./logs/missed_legacy_routes.log"
MISSED_URLS_DATA=()
if [ "$INCLUDE_MISSED_URLS" = true ] && [ -f "$MISSED_URLS_LOG" ]; then
  echo -e "${BLUE}Analyse des URLs manquées...${NC}"
  
  # Extraire et compter les URLs
  declare -A url_counts
  while IFS='|' read -r date method url rest; do
    url=$(echo "$url" | xargs) # Trim whitespace
    if [ -n "$url" ]; then
      ((url_counts["$url"]++))
    fi
  done < <(cat "$MISSED_URLS_LOG")
  
  # Trier par nombre d'occurrences (du plus grand au plus petit)
  for url in "${!url_counts[@]}"; do
    MISSED_URLS_DATA+=("$url:${url_counts["$url"]}")
  done
  
  # Trier les données
  IFS=$'\n' MISSED_URLS_DATA=($(sort -t: -k2,2nr <<<"${MISSED_URLS_DATA[*]}"))
  unset IFS
fi

# Fonction pour tester le statut d'une URL si demandé
function get_url_status {
  local url="$1"
  local base_url="${2:-http://localhost:3000}"
  
  if [ "$INCLUDE_GOT_STATUS" != true ]; then
    echo "Non testé"
    return
  fi
  
  # Pour les tests locaux
  if [[ "$url" == /* ]]; then
    url="${base_url}${url}"
  fi
  
  # Tenter d'obtenir le code de statut
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  echo "$status"
}

# Générer la documentation selon le format demandé
echo -e "${BLUE}Génération de la documentation au format $OUTPUT_FORMAT...${NC}"

case "$OUTPUT_FORMAT" in
  markdown)
    # Générer l'en-tête
    cat > "$OUTPUT_FILE" << EOL
# Documentation des Mappings de Routes

**Projet:** Migration PHP vers Remix
EOL

    if [ "$INCLUDE_TIMESTAMPS" = true ]; then
      cat >> "$OUTPUT_FILE" << EOL
**Généré le:** $TIMESTAMP
EOL
    fi

    if [ "$INCLUDE_STATS" = true ]; then
      cat >> "$OUTPUT_FILE" << EOL

## Statistiques

- Redirections: $TOTAL_REDIRECTS
- Pages supprimées: $TOTAL_DELETED
- Mappings: $TOTAL_MAPPINGS
- Routes SEO critiques: $TOTAL_SEO_ROUTES
EOL
    fi

    # Ajouter les redirections
    if [ -f "$REDIRECTS_FILE" ]; then
      cat >> "$OUTPUT_FILE" << EOL

## Redirections

Ces routes sont configurées pour rediriger vers une nouvelle URL.

| Route d'origine | Destination | Statut | Test |
|----------------|------------|--------|------|
EOL

      # Parcourir les redirections
      jq -r 'to_entries | .[] | "\(.key)|\(.value.to)|\(.value.status)"' "$REDIRECTS_FILE" | while IFS='|' read -r from to status; do
        test_status=$(get_url_status "$from")
        echo "| \`$from\` | \`$to\` | $status | $test_status |" >> "$OUTPUT_FILE"
      done
    fi

    # Ajouter les pages supprimées
    if [ -f "$DELETED_ROUTES_FILE" ]; then
      cat >> "$OUTPUT_FILE" << EOL

## Pages Supprimées

Ces routes sont marquées comme supprimées (HTTP 410 Gone).

| Route | Test |
|-------|------|
EOL

      # Parcourir les pages supprimées
      jq -r '.[]' "$DELETED_ROUTES_FILE" | while read -r route; do
        test_status=$(get_url_status "$route")
        echo "| \`$route\` | $test_status |" >> "$OUTPUT_FILE"
      done
    fi

    # Ajouter les mappings
    if [ -f "$LEGACY_ROUTE_MAP_FILE" ]; then
      cat >> "$OUTPUT_FILE" << EOL

## Mappings de Routes

Ces routes sont mappées entre les anciennes URLs PHP et les nouvelles routes Remix.

| Ancienne route | Nouvelle route | Test |
|---------------|---------------|------|
EOL

      # Parcourir les mappings
      jq -r 'to_entries | .[] | "\(.key)|\(.value)"' "$LEGACY_ROUTE_MAP_FILE" | while IFS='|' read -r from to; do
        test_status=$(get_url_status "$from")
        echo "| \`$from\` | \`$to\` | $test_status |" >> "$OUTPUT_FILE"
      done
    fi

    # Ajouter les routes SEO
    if [ -f "$SEO_ROUTES_FILE" ]; then
      cat >> "$OUTPUT_FILE" << EOL

## Routes SEO Critiques

Ces routes sont considérées comme critiques pour le référencement.

| Route | Statut |
|-------|--------|
EOL

      # Parcourir les routes SEO
      jq -r '.[]' "$SEO_ROUTES_FILE" | while read -r route; do
        # Déterminer le statut (en cherchant dans les autres fichiers)
        status="Non géré"
        
        if [ -f "$REDIRECTS_FILE" ] && jq -e ".\"$route\"" "$REDIRECTS_FILE" > /dev/null; then
          redirect_info=$(jq -r ".\"$route\"" "$REDIRECTS_FILE")
          to=$(echo "$redirect_info" | jq -r '.to')
          code=$(echo "$redirect_info" | jq -r '.status')
          status="Redirection ($code) vers \`$to\`"
        elif [ -f "$LEGACY_ROUTE_MAP_FILE" ] && jq -e ".\"$route\"" "$LEGACY_ROUTE_MAP_FILE" > /dev/null; then
          to=$(jq -r ".\"$route\"" "$LEGACY_ROUTE_MAP_FILE")
          status="Mappé vers \`$to\`"
        elif [ -f "$DELETED_ROUTES_FILE" ] && jq -e "index(\"$route\") >= 0" "$DELETED_ROUTES_FILE" > /dev/null; then
          status="Supprimé (410 Gone)"
        fi
        
        echo "| \`$route\` | $status |" >> "$OUTPUT_FILE"
      done
    fi

    # Ajouter les URLs manquées
    if [ "$INCLUDE_MISSED_URLS" = true ] && [ ${#MISSED_URLS_DATA[@]} -gt 0 ]; then
      cat >> "$OUTPUT_FILE" << EOL

## URLs Manquées Fréquemment

Ces URLs ont été demandées mais ne sont pas gérées par le système. Elles sont classées par nombre d'occurrences.

| URL | Occurrences | Suggestion |
|-----|-------------|------------|
EOL

      # Limiter à 20 URLs les plus fréquentes
      count=0
      for entry in "${MISSED_URLS_DATA[@]}"; do
        IFS=':' read -r url occurrences <<< "$entry"
        
        # Générer une suggestion basique
        suggestion="Considérer une redirection 301"
        if [[ "$url" == *.php* ]]; then
          new_url=$(echo "$url" | sed 's/\.php//')
          suggestion="Rediriger vers \`$new_url\`"
        fi
        
        echo "| \`$url\` | $occurrences | $suggestion |" >> "$OUTPUT_FILE"
        
        ((count++))
        if [ $count -ge 20 ]; then
          break
        fi
      done
      
      # Indiquer s'il y a plus d'URLs
      if [ ${#MISSED_URLS_DATA[@]} -gt 20 ]; then
        cat >> "$OUTPUT_FILE" << EOL
| ... | ... | ... |
EOL
        echo "**Note:** ${#MISSED_URLS_DATA[@]} URLs manquées au total. Seules les 20 plus fréquentes sont affichées." >> "$OUTPUT_FILE"
      fi
    fi

    # Ajouter les recommandations
    cat >> "$OUTPUT_FILE" << EOL

## Recommandations

1. **Vérifier les redirections critiques** - Assurez-vous que toutes les routes SEO ont un traitement approprié
2. **Utiliser le code 301** - Les redirections permanentes doivent utiliser le code 301 (pas 302)
3. **Préférer 410 à 404** - Pour les pages supprimées, utilisez 410 (Gone) plutôt que 404 (Not Found)
4. **Tester les redirections** - Validez toutes les redirections importantes avec un outil comme Screaming Frog
5. **Surveiller les URLs manquées** - Examinez régulièrement les URLs manquées pour les ajouter au système

## Maintenance

Cette documentation est générée automatiquement à partir des fichiers de configuration. Pour la mettre à jour, exécutez:

```bash
./docs-routes-mappings.sh
```

Dernière mise à jour: $TIMESTAMP
EOL
    ;;

  html)
    # En-tête HTML
    cat > "$OUTPUT_FILE" << EOL
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation des Mappings de Routes</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: Consolas, monospace;
        }
        .stats {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            flex: 1;
            min-width: 150px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .stat-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 24px;
            color: #3498db;
        }
        .recommendations {
            background-color: #f9f9f9;
            padding: 20px;
            border-left: 4px solid #3498db;
            margin: 20px 0;
        }
        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
    <h1>Documentation des Mappings de Routes</h1>
    <p><strong>Projet:</strong> Migration PHP vers Remix</p>
EOL

    if [ "$INCLUDE_TIMESTAMPS" = true ]; then
      cat >> "$OUTPUT_FILE" << EOL
    <p><strong>Généré le:</strong> $TIMESTAMP</p>
EOL
    fi

    if [ "$INCLUDE_STATS" = true ]; then
      cat >> "$OUTPUT_FILE" << EOL
    <h2>Statistiques</h2>
    <div class="stats">
        <div class="stat-card">
            <div class="stat-title">Redirections</div>
            <div class="stat-value">$TOTAL_REDIRECTS</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Pages supprimées</div>
            <div class="stat-value">$TOTAL_DELETED</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Mappings</div>
            <div class="stat-value">$TOTAL_MAPPINGS</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Routes SEO</div>
            <div class="stat-value">$TOTAL_SEO_ROUTES</div>
        </div>
    </div>
EOL
    fi

    # Ajouter les redirections
    if [ -f "$REDIRECTS_FILE" ]; then
      cat >> "$OUTPUT_FILE" << EOL
    <h2>Redirections</h2>
    <p>Ces routes sont configurées pour rediriger vers une nouvelle URL.</p>
    <table>
        <thead>
            <tr>
                <th>Route d'origine</th>
                <th>Destination</th>
                <th>Statut</th>
                <th>Test</th>
            </tr>
        </thead>
        <tbody>
EOL

      # Parcourir les redirections
      jq -r 'to_entries | .[] | "\(.key)|\(.value.to)|\(.value.status)"' "$REDIRECTS_FILE" | while IFS='|' read -r from to status; do
        test_status=$(get_url_status "$from")
        echo "            <tr>
                <td><code>$from</code></td>
                <td><code>$to</code></td>
                <td>$status</td>
                <td>$test_status</td>
            </tr>" >> "$OUTPUT_FILE"
      done

      cat >> "$OUTPUT_FILE" << EOL
        </tbody>
    </table>
EOL
    fi

    # Ajouter les pages supprimées
    if [ -f "$DELETED_ROUTES_FILE" ]; then
      cat >> "$OUTPUT_FILE" << EOL
    <h2>Pages Supprimées</h2>
    <p>Ces routes sont marquées comme supprimées (HTTP 410 Gone).</p>
    <table>
        <thead>
            <tr>
                <th>Route</th>
                <th>Test</th>
            </tr>
        </thead>
        <tbody>
EOL

      # Parcourir les pages supprimées
      jq -r '.[]' "$DELETED_ROUTES_FILE" | while read -r route; do
        test_status=$(get_url_status "$route")
        echo "            <tr>
                <td><code>$route</code></td>
                <td>$test_status</td>
            </tr>" >> "$OUTPUT_FILE"
      done

      cat >> "$OUTPUT_FILE" << EOL
        </tbody>
    </table>
EOL
    fi

    # Ajouter les mappings
    if [ -f "$LEGACY_ROUTE_MAP_FILE" ]; then
      cat >> "$OUTPUT_FILE" << EOL
    <h2>Mappings de Routes</h2>
    <p>Ces routes sont mappées entre les anciennes URLs PHP et les nouvelles routes Remix.</p>
    <table>
        <thead>
            <tr>
                <th>Ancienne route</th>
                <th>Nouvelle route</th>
                <th>Test</th>
            </tr>
        </thead>
        <tbody>
EOL

      # Parcourir les mappings
      jq -r 'to_entries | .[] | "\(.key)|\(.value)"' "$LEGACY_ROUTE_MAP_FILE" | while IFS='|' read -r from to; do
        test_status=$(get_url_status "$from")
        echo "            <tr>
                <td><code>$from</code></td>
                <td><code>$to</code></td>
                <td>$test_status</td>
            </tr>" >> "$OUTPUT_FILE"
      done

      cat >> "$OUTPUT_FILE" << EOL
        </tbody>
    </table>
EOL
    fi

    # Ajouter les routes SEO
    if [ -f "$SEO_ROUTES_FILE" ]; then
      cat >> "$OUTPUT_FILE" << EOL
    <h2>Routes SEO Critiques</h2>
    <p>Ces routes sont considérées comme critiques pour le référencement.</p>
    <table>
        <thead>
            <tr>
                <th>Route</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
EOL

      # Parcourir les routes SEO
      jq -r '.[]' "$SEO_ROUTES_FILE" | while read -r route; do
        # Déterminer le statut (en cherchant dans les autres fichiers)
        status="Non géré"
        
        if [ -f "$REDIRECTS_FILE" ] && jq -e ".\"$route\"" "$REDIRECTS_FILE" > /dev/null; then
          redirect_info=$(jq -r ".\"$route\"" "$REDIRECTS_FILE")
          to=$(echo "$redirect_info" | jq -r '.to')
          code=$(echo "$redirect_info" | jq -r '.status')
          status="Redirection ($code) vers <code>$to</code>"
        elif [ -f "$LEGACY_ROUTE_MAP_FILE" ] && jq -e ".\"$route\"" "$LEGACY_ROUTE_MAP_FILE" > /dev/null; then
          to=$(jq -r ".\"$route\"" "$LEGACY_ROUTE_MAP_FILE")
          status="Mappé vers <code>$to</code>"
        elif [ -f "$DELETED_ROUTES_FILE" ] && jq -e "index(\"$route\") >= 0" "$DELETED_ROUTES_FILE" > /dev/null; then
          status="Supprimé (410 Gone)"
        fi
        
        echo "            <tr>
                <td><code>$route</code></td>
                <td>$status</td>
            </tr>" >> "$OUTPUT_FILE"
      done

      cat >> "$OUTPUT_FILE" << EOL
        </tbody>
    </table>
EOL
    fi

    # Ajouter les URLs manquées
    if [ "$INCLUDE_MISSED_URLS" = true ] && [ ${#MISSED_URLS_DATA[@]} -gt 0 ]; then
      cat >> "$OUTPUT_FILE" << EOL
    <h2>URLs Manquées Fréquemment</h2>
    <p>Ces URLs ont été demandées mais ne sont pas gérées par le système. Elles sont classées par nombre d'occurrences.</p>
    <table>
        <thead>
            <tr>
                <th>URL</th>
                <th>Occurrences</th>
                <th>Suggestion</th>
            </tr>
        </thead>
        <tbody>
EOL

      # Limiter à 20 URLs les plus fréquentes
      count=0
      for entry in "${MISSED_URLS_DATA[@]}"; do
        IFS=':' read -r url occurrences <<< "$entry"
        
        # Générer une suggestion basique
        suggestion="Considérer une redirection 301"
        if [[ "$url" == *.php* ]]; then
          new_url=$(echo "$url" | sed 's/\.php//')
          suggestion="Rediriger vers <code>$new_url</code>"
        fi
        
        echo "            <tr>
                <td><code>$url</code></td>
                <td>$occurrences</td>
                <td>$suggestion</td>
            </tr>" >> "$OUTPUT_FILE"
        
        ((count++))
        if [ $count -ge 20 ]; then
          break
        fi
      done
      
      cat >> "$OUTPUT_FILE" << EOL
        </tbody>
    </table>
EOL

      # Indiquer s'il y a plus d'URLs
      if [ ${#MISSED_URLS_DATA[@]} -gt 20 ]; then
        echo "    <p><strong>Note:</strong> ${#MISSED_URLS_DATA[@]} URLs manquées au total. Seules les 20 plus fréquentes sont affichées.</p>" >> "$OUTPUT_FILE"
      fi
    fi

    # Ajouter les recommandations
    cat >> "$OUTPUT_FILE" << EOL
    <h2>Recommandations</h2>
    <div class="recommendations">
        <ol>
            <li><strong>Vérifier les redirections critiques</strong> - Assurez-vous que toutes les routes SEO ont un traitement approprié</li>
            <li><strong>Utiliser le code 301</strong> - Les redirections permanentes doivent utiliser le code 301 (pas 302)</li>
            <li><strong>Préférer 410 à 404</strong> - Pour les pages supprimées, utilisez 410 (Gone) plutôt que 404 (Not Found)</li>
            <li><strong>Tester les redirections</strong> - Validez toutes les redirections importantes avec un outil comme Screaming Frog</li>
            <li><strong>Surveiller les URLs manquées</strong> - Examinez régulièrement les URLs manquées pour les ajouter au système</li>
        </ol>
    </div>

    <h2>Maintenance</h2>
    <p>Cette documentation est générée automatiquement à partir des fichiers de configuration. Pour la mettre à jour, exécutez:</p>
    <pre><code>./docs-routes-mappings.sh</code></pre>

    <footer>
        Dernière mise à jour: $TIMESTAMP
    </footer>
</body>
</html>
EOL
    ;;

  json)
    # Créer une structure JSON pour la documentation
    TEMP_JSON=$(mktemp)
    
    cat > "$TEMP_JSON" << EOL
{
  "metadata": {
    "project": "Migration PHP vers Remix",
    "generated": "$TIMESTAMP",
    "stats": {
      "redirects": $TOTAL_REDIRECTS,
      "deleted": $TOTAL_DELETED,
      "mappings": $TOTAL_MAPPINGS,
      "seoRoutes": $TOTAL_SEO_ROUTES
    }
  },
  "redirects": {},
  "deleted": [],
  "mappings": {},
  "seoRoutes": {},
  "missedUrls": []
}
EOL

    # Ajouter les redirections
    if [ -f "$REDIRECTS_FILE" ]; then
      jq -r 'to_entries | map({key: .key, value: {destination: .value.to, status: .value.status}}) | from_entries' "$REDIRECTS_FILE" > "$TEMP_JSON.redirects"
      jq --slurpfile redirects "$TEMP_JSON.redirects" '.redirects = $redirects[0]' "$TEMP_JSON" > "$TEMP_JSON.tmp" && mv "$TEMP_JSON.tmp" "$TEMP_JSON"
      rm "$TEMP_JSON.redirects"
    fi
    
    # Ajouter les pages supprimées
    if [ -f "$DELETED_ROUTES_FILE" ]; then
      jq --slurpfile deleted "$DELETED_ROUTES_FILE" '.deleted = $deleted[0]' "$TEMP_JSON" > "$TEMP_JSON.tmp" && mv "$TEMP_JSON.tmp" "$TEMP_JSON"
    fi
    
    # Ajouter les mappings
    if [ -f "$LEGACY_ROUTE_MAP_FILE" ]; then
      jq --slurpfile mappings "$LEGACY_ROUTE_MAP_FILE" '.mappings = $mappings[0]' "$TEMP_JSON" > "$TEMP_JSON.tmp" && mv "$TEMP_JSON.tmp" "$TEMP_JSON"
    fi
    
    # Ajouter les routes SEO avec leur statut
    if [ -f "$SEO_ROUTES_FILE" ]; then
      # Créer un fichier temporaire pour les routes SEO
      echo "{}" > "$TEMP_JSON.seo"
      
      jq -r '.[]' "$SEO_ROUTES_FILE" | while read -r route; do
        # Déterminer le statut (en cherchant dans les autres fichiers)
        status="Not handled"
        
        if [ -f "$REDIRECTS_FILE" ] && jq -e ".\"$route\"" "$REDIRECTS_FILE" > /dev/null; then
          redirect_info=$(jq -r ".\"$route\"" "$REDIRECTS_FILE")
          to=$(echo "$redirect_info" | jq -r '.to')
          code=$(echo "$redirect_info" | jq -r '.status')
          status="{\"type\": \"redirect\", \"code\": $code, \"destination\": \"$to\"}"
        elif [ -f "$LEGACY_ROUTE_MAP_FILE" ] && jq -e ".\"$route\"" "$LEGACY_ROUTE_MAP_FILE" > /dev/null; then
          to=$(jq -r ".\"$route\"" "$LEGACY_ROUTE_MAP_FILE")
          status="{\"type\": \"mapping\", \"destination\": \"$to\"}"
        elif [ -f "$DELETED_ROUTES_FILE" ] && jq -e "index(\"$route\") >= 0" "$DELETED_ROUTES_FILE" > /dev/null; then
          status="{\"type\": \"gone\", \"code\": 410}"
        else
          status="{\"type\": \"unknown\"}"
        fi
        
        # Échapper les caractères pour jq
        route_escaped=$(echo "$route" | sed 's/\//\\\//g')
        
        # Ajouter à la structure JSON
        jq ".[\"$route_escaped\"] = $status" "$TEMP_JSON.seo" > "$TEMP_JSON.seo.tmp" && mv "$TEMP_JSON.seo.tmp" "$TEMP_JSON.seo"
      done
      
      # Mettre à jour le fichier principal
      jq --slurpfile seo "$TEMP_JSON.seo" '.seoRoutes = $seo[0]' "$TEMP_JSON" > "$TEMP_JSON.tmp" && mv "$TEMP_JSON.tmp" "$TEMP_JSON"
      rm "$TEMP_JSON.seo"
    fi
    
    # Ajouter les URLs manquées
    if [ "$INCLUDE_MISSED_URLS" = true ] && [ ${#MISSED_URLS_DATA[@]} -gt 0 ]; then
      echo "[]" > "$TEMP_JSON.missed"
      
      # Limiter à 100 URLs les plus fréquentes
      count=0
      for entry in "${MISSED_URLS_DATA[@]}"; do
        IFS=':' read -r url occurrences <<< "$entry"
        
        # Générer une suggestion basique
        suggestion="Consider a 301 redirect"
        if [[ "$url" == *.php* ]]; then
          new_url=$(echo "$url" | sed 's/\.php//')
          suggestion="Redirect to $new_url"
        fi
        
        # Échapper les caractères pour jq
        url_escaped=$(echo "$url" | sed 's/\//\\\//g')
        
        # Ajouter à la structure JSON
        jq ". += [{\"url\": \"$url_escaped\", \"occurrences\": $occurrences, \"suggestion\": \"$suggestion\"}]" "$TEMP_JSON.missed" > "$TEMP_JSON.missed.tmp" && mv "$TEMP_JSON.missed.tmp" "$TEMP_JSON.missed"
        
        ((count++))
        if [ $count -ge 100 ]; then
          break
        fi
      done
      
      # Mettre à jour le fichier principal
      jq --slurpfile missed "$TEMP_JSON.missed" '.missedUrls = $missed[0]' "$TEMP_JSON" > "$TEMP_JSON.tmp" && mv "$TEMP_JSON.tmp" "$TEMP_JSON"
      rm "$TEMP_JSON.missed"
    fi
    
    # Ajouter les recommandations
    jq '. += {"recommendations": [
      "Verify critical redirects - Ensure all SEO routes have appropriate handling",
      "Use 301 code - Permanent redirects should use 301 status code (not 302)",
      "Prefer 410 over 404 - For removed pages, use 410 (Gone) rather than 404 (Not Found)",
      "Test redirects - Validate all important redirects with a tool like Screaming Frog",
      "Monitor missed URLs - Regularly review missed URLs to add them to the system"
    ]}' "$TEMP_JSON" > "$TEMP_JSON.tmp" && mv "$TEMP_JSON.tmp" "$TEMP_JSON"
    
    # Finaliser le fichier JSON avec formatage
    jq '.' "$TEMP_JSON" > "$OUTPUT_FILE"
    rm "$TEMP_JSON"
    ;;
esac

# Créer un fichier d'index si le format est HTML ou Markdown
if [ "$OUTPUT_FORMAT" = "html" ] || [ "$OUTPUT_FORMAT" = "markdown" ]; then
  INDEX_FILE="$OUTPUT_DIR/index.$OUTPUT_FORMAT"
  
  # Lister tous les fichiers de documentation générés
  echo -e "${BLUE}Création du fichier d'index...${NC}"
  
  case "$OUTPUT_FORMAT" in
    markdown)
      cat > "$INDEX_FILE" << EOL
# Documentation des Mappings de Routes

## Archives disponibles

EOL

      for file in "$OUTPUT_DIR"/*; do
        if [ "$file" != "$INDEX_FILE" ]; then
          filename=$(basename "$file")
          echo "- [${filename%.*}](./$filename)" >> "$INDEX_FILE"
        fi
      done
      ;;
      
    html)
      cat > "$INDEX_FILE" << EOL
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation des Mappings de Routes - Index</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2 {
            color: #2c3e50;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 10px;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
    <h1>Documentation des Mappings de Routes</h1>
    <h2>Archives disponibles</h2>
    <ul>
EOL

      for file in "$OUTPUT_DIR"/*; do
        if [ "$file" != "$INDEX_FILE" ]; then
          filename=$(basename "$file")
          date_part=${filename#routes-mapping-}
          date_part=${date_part%.*}
          
          # Formater la date si possible
          formatted_date=$(date -d "${date_part:0:4}-${date_part:4:2}-${date_part:6:2}" "+%d %B %Y" 2>/dev/null || echo "$date_part")
          
          echo "        <li><a href=\"./$filename\">Documentation du $formatted_date</a></li>" >> "$INDEX_FILE"
        fi
      done

      cat >> "$INDEX_FILE" << EOL
    </ul>
    <footer>
        Dernière mise à jour: $TIMESTAMP
    </footer>
</body>
</html>
EOL
      ;;
  esac
fi

echo -e "${GREEN}✅ Documentation générée avec succès: $OUTPUT_FILE${NC}"

if [ -f "$INDEX_FILE" ]; then
  echo -e "Index créé: $INDEX_FILE"
fi

# Résumé des statistiques
echo -e "\n${BLUE}Résumé:${NC}"
echo -e "- Redirections: ${GREEN}$TOTAL_REDIRECTS${NC}"
echo -e "- Pages supprimées: ${GREEN}$TOTAL_DELETED${NC}"
echo -e "- Mappings: ${GREEN}$TOTAL_MAPPINGS${NC}"
echo -e "- Routes SEO critiques: ${GREEN}$TOTAL_SEO_ROUTES${NC}"

if [ "$INCLUDE_MISSED_URLS" = true ]; then
  echo -e "- URLs manquées: ${GREEN}${#MISSED_URLS_DATA[@]}${NC}"
fi