#!/bin/bash
# Analyseur avancé de doublons pour projets TypeScript/JavaScript
# Date: 9 mai 2025

# Définition des couleurs
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
OUTPUT_DIR="./reports/advanced-duplicate-analysis-$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="$OUTPUT_DIR/advanced-duplicate-analysis-report.md"
HTML_REPORT="$OUTPUT_DIR/duplicate-visualization.html"
DUPLICATE_CODE_DIR="$OUTPUT_DIR/duplicate-snippets"
JSON_REPORT="$OUTPUT_DIR/duplicate-data.json"

# Seuils de similarité (en pourcentage)
THRESHOLD_HIGH=80
THRESHOLD_MEDIUM=60
THRESHOLD_LOW=40

# Métriques de similarité
MIN_TOKENS=50  # Nombre minimal de jetons pour considérer une duplication

# Créer les répertoires
mkdir -p "$OUTPUT_DIR"
mkdir -p "$DUPLICATE_CODE_DIR"

# Vérification des outils requis
command -v jq >/dev/null 2>&1 || { echo -e "${RED}[ERROR]${NC} jq n'est pas installé. Installation en cours..."; apt-get update && apt-get install -y jq; }
command -v cloc >/dev/null 2>&1 || { echo -e "${RED}[ERROR]${NC} cloc n'est pas installé. Installation en cours..."; apt-get update && apt-get install -y cloc; }

# Fonctions d'aide
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Initialiser les rapports
cat > "$REPORT_FILE" << EOF
# Rapport d'analyse avancée de doublons
Date: $(date +"%d/%m/%Y %H:%M:%S")

Ce rapport présente une analyse détaillée des doublons dans le code source,
en se basant sur plusieurs métriques de similarité.

## Résumé

EOF

# Initialiser le JSON
echo "{\"duplicates\": []}" > "$JSON_REPORT"

# Initialiser le HTML pour la visualisation
cat > "$HTML_REPORT" << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visualisation des doublons de code</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #2980b9;
            margin-top: 30px;
        }
        h3 {
            color: #3498db;
        }
        .metrics {
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
        }
        .duplicate-group {
            background-color: #f8f9fa;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 20px 0;
        }
        .high-similarity {
            border-left-color: #e74c3c;
        }
        .medium-similarity {
            border-left-color: #f39c12;
        }
        .low-similarity {
            border-left-color: #2ecc71;
        }
        .file-path {
            font-family: monospace;
            background-color: #eee;
            padding: 5px;
            border-radius: 3px;
        }
        pre {
            background-color: #f1f1f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        code {
            font-family: Consolas, Monaco, 'Andale Mono', monospace;
        }
        .stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        .stat-card {
            flex: 1;
            min-width: 250px;
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .chart-container {
            height: 300px;
            margin: 30px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .similarity-indicator {
            display: inline-block;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .similarity-high {
            background-color: #e74c3c;
        }
        .similarity-medium {
            background-color: #f39c12;
        }
        .similarity-low {
            background-color: #2ecc71;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Visualisation des doublons de code</h1>
        <p>Date de l'analyse: $(date +"%d/%m/%Y %H:%M:%S")</p>
        
        <div class="metrics">
            <h2>Métriques globales</h2>
            <div class="stats">
                <div class="stat-card">
                    <h3>Fichiers analysés</h3>
                    <p id="total-files">Calcul en cours...</p>
                </div>
                <div class="stat-card">
                    <h3>Lignes de code</h3>
                    <p id="total-lines">Calcul en cours...</p>
                </div>
                <div class="stat-card">
                    <h3>Doublons détectés</h3>
                    <p id="total-duplicates">Calcul en cours...</p>
                </div>
                <div class="stat-card">
                    <h3>Taux de duplication</h3>
                    <p id="duplication-rate">Calcul en cours...</p>
                </div>
            </div>
        </div>
        
        <h2>Groupes de doublons par similarité</h2>
        <p>
            <span class="similarity-indicator similarity-high"></span> Similarité élevée (>80%)<br>
            <span class="similarity-indicator similarity-medium"></span> Similarité moyenne (60-80%)<br>
            <span class="similarity-indicator similarity-low"></span> Similarité faible (40-60%)
        </p>
        
        <div id="duplicate-groups">
            Chargement des données...
        </div>
        
        <h2>Recommandations</h2>
        <div id="recommendations">
            <p>Les recommandations seront générées après l'analyse complète...</p>
        </div>
    </div>

    <script>
        // Les données seront injectées ici après l'analyse
        const duplicateData = [];
        
        document.addEventListener('DOMContentLoaded', function() {
            // Cette fonction sera remplie après l'analyse
        });
    </script>
</body>
</html>
EOF

log "Début de l'analyse avancée des doublons..."

############################################################
# ÉTAPE 1: COLLECTE DES FICHIERS À ANALYSER
############################################################

log "Collecte des fichiers à analyser..."

# Créer une liste de fichiers TypeScript/JavaScript
FILES_LIST="$OUTPUT_DIR/files-list.txt"

find ./packages ./apps -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" \
  -not -path "*/backup/*" \
  -not -path "*/archives/*" \
  > "$FILES_LIST"

FILES_COUNT=$(wc -l < "$FILES_LIST")
log "Trouvé $FILES_COUNT fichiers à analyser"

# Calculer les statistiques de base avec cloc
log "Calcul des statistiques de code..."
cloc --list-file="$FILES_LIST" --json --out="$OUTPUT_DIR/code-stats.json"

# Extraire les statistiques pour le rapport
if [ -f "$OUTPUT_DIR/code-stats.json" ]; then
  TOTAL_FILES=$(jq '.header.n_files' "$OUTPUT_DIR/code-stats.json")
  TOTAL_LINES=$(jq '.SUM.code // 0' "$OUTPUT_DIR/code-stats.json")
  
  cat >> "$REPORT_FILE" << EOF
- **Fichiers analysés**: $TOTAL_FILES
- **Lignes de code**: $TOTAL_LINES

EOF
else
  warn "Impossible de générer les statistiques de code"
  TOTAL_FILES=$FILES_COUNT
  TOTAL_LINES="N/A"
fi

############################################################
# ÉTAPE 2: ANALYSE DES FICHIERS PAR CONCEPT
############################################################

log "Analyse des fichiers par concept..."

# Liste des concepts à analyser avec leurs identifiants uniques
declare -A CONCEPTS
CONCEPTS=(
  ["Orchestrator"]="class.*Orchestrator|interface.*Orchestrator|StandardizedOrchestrator"
  ["Redis"]="class.*RedisService|RedisJson|interface.*RedisOptions"
  ["BullMQ"]="class.*BullMQAdapter|StandardizedBullMQAdapter|Queue|QueueEvents"
  ["Temporal"]="class.*TemporalAdapter|StandardizedTemporalAdapter|WorkflowClient"
  ["OpenAPI"]="createOpenApiGenerator|OpenAPIRegistry|TypeBox"
  ["OrchestratorBridge"]="class.*OrchestratorBridge|interface.*OrchestratorBridgeOptions"
  ["BaseAgent"]="class.*BaseAgent|abstract.*BaseAgent|interface.*BaseAgent"
  ["AdapterAgent"]="class.*AdapterAgent|abstract.*AdapterAgent|interface.*AdapterAgent"
)

# Pour chaque concept, analyser les fichiers et créer un groupe de similitude
for concept in "${!CONCEPTS[@]}"; do
  pattern="${CONCEPTS[$concept]}"
  concept_slug=$(echo "$concept" | tr '[:upper:]' '[:lower:]')
  
  log "Analyse du concept: $concept (motif: $pattern)"
  
  # Créer un fichier pour stocker les résultats
  concept_results="$OUTPUT_DIR/${concept_slug}-results.txt"
  
  # Rechercher les fichiers contenant le motif
  grep -l -E "$pattern" $(cat "$FILES_LIST") 2>/dev/null > "$OUTPUT_DIR/${concept_slug}-files.txt" || true
  
  # Compter les fichiers
  files_count=$(wc -l < "$OUTPUT_DIR/${concept_slug}-files.txt")
  
  if [ "$files_count" -eq 0 ]; then
    warn "Aucun fichier trouvé pour le concept $concept"
    continue
  fi
  
  log "  Trouvé $files_count fichiers pour le concept $concept"
  
  # Ajouter au rapport
  cat >> "$REPORT_FILE" << EOF
## Concept: $concept

Fichiers identifiés: $files_count

| Fichier | Extrait | Similarité |
|---------|---------|------------|
EOF
  
  # Liste pour stocker les lignes correspondantes
  declare -A matches
  file_index=0
  
  # Pour chaque fichier, extraire les lignes pertinentes
  while IFS= read -r file; do
    # Extraire les lignes correspondant au motif avec contexte
    grep -n -A 10 -B 5 -E "$pattern" "$file" 2>/dev/null > "$OUTPUT_DIR/${concept_slug}-match-${file_index}.txt" || true
    
    # Récupérer un extrait pour le rapport
    if [ -s "$OUTPUT_DIR/${concept_slug}-match-${file_index}.txt" ]; then
      excerpt=$(head -n 3 "$OUTPUT_DIR/${concept_slug}-match-${file_index}.txt" | sed 's/^/    /g')
      echo "| \`$file\` | \`\`\`typescript<br/>$excerpt<br/>...\`\`\` | - |" >> "$REPORT_FILE"
      
      # Sauvegarder le match pour comparaison
      matches[$file_index]="$file"
    fi
    
    file_index=$((file_index + 1))
  done < "$OUTPUT_DIR/${concept_slug}-files.txt"
  
  # Si plus d'un fichier correspond, comparer les contenus
  if [ "${#matches[@]}" -gt 1 ]; then
    log "  Comparaison des contenus pour $concept (${#matches[@]} fichiers)"
    
    # Créer un dossier pour stocker les extraits
    mkdir -p "$DUPLICATE_CODE_DIR/$concept_slug"
    
    # Ajouter une section dans le rapport
    cat >> "$REPORT_FILE" << EOF

### Analyse de similarité pour $concept

EOF
    
    # Comparer chaque paire de fichiers
    for i in "${!matches[@]}"; do
      file1="${matches[$i]}"
      
      for j in "${!matches[@]}"; do
        # Ne pas comparer un fichier avec lui-même et éviter les comparaisons en double
        if [ "$i" -lt "$j" ]; then
          file2="${matches[$j]}"
          
          # Extraire le nom de base des fichiers
          base1=$(basename "$file1")
          base2=$(basename "$file2")
          
          log "    Comparaison: $base1 <-> $base2"
          
          # Extraire uniquement les définitions pertinentes
          grep -A 50 -E "$pattern" "$file1" > "$DUPLICATE_CODE_DIR/$concept_slug/${base1}-extract.ts"
          grep -A 50 -E "$pattern" "$file2" > "$DUPLICATE_CODE_DIR/$concept_slug/${base2}-extract.ts"
          
          # Comparer les contenus avec diff et calculer un score de similarité approximatif
          diff_output=$(diff -u "$DUPLICATE_CODE_DIR/$concept_slug/${base1}-extract.ts" "$DUPLICATE_CODE_DIR/$concept_slug/${base2}-extract.ts")
          
          # Calculer un score de similarité basé sur le nombre de lignes diff
          total_lines=$(cat "$DUPLICATE_CODE_DIR/$concept_slug/${base1}-extract.ts" "$DUPLICATE_CODE_DIR/$concept_slug/${base2}-extract.ts" | wc -l)
          diff_lines=$(echo "$diff_output" | grep -E "^[+-]" | wc -l)
          
          # Éviter la division par zéro
          if [ "$total_lines" -eq 0 ]; then
            similarity=0
          else
            # La similarité est inversement proportionnelle aux différences
            similarity=$(( 100 - (diff_lines * 100 / total_lines) ))
          fi
          
          # Déterminer le niveau de similarité
          similarity_level="N/A"
          if [ "$similarity" -ge "$THRESHOLD_HIGH" ]; then
            similarity_level="ÉLEVÉ"
          elif [ "$similarity" -ge "$THRESHOLD_MEDIUM" ]; then
            similarity_level="MOYEN"
          elif [ "$similarity" -ge "$THRESHOLD_LOW" ]; then
            similarity_level="FAIBLE"
          fi
          
          # Enregistrer la comparaison dans le rapport
          cat >> "$REPORT_FILE" << EOF
#### Comparaison: ${base1} <-> ${base2}

- **Similarité**: ${similarity}% (${similarity_level})
- **Fichier 1**: \`${file1}\`
- **Fichier 2**: \`${file2}\`

EOF
          
          # Si similarité élevée ou moyenne, ajouter à la liste des doublons potentiels
          if [ "$similarity" -ge "$THRESHOLD_LOW" ]; then
            # Créer un extrait de la diff pour le rapport
            echo "$diff_output" > "$DUPLICATE_CODE_DIR/$concept_slug/diff-${base1}-${base2}.diff"
            
            # Ajouter au JSON pour la visualisation
            tmp_json="$OUTPUT_DIR/tmp-duplicate-$i-$j.json"
            cat > "$tmp_json" << EOF
{
  "concept": "$concept",
  "similarity": $similarity,
  "similarityLevel": "$similarity_level",
  "file1": "$file1",
  "file2": "$file2",
  "base1": "$base1",
  "base2": "$base2",
  "diffFile": "duplicate-snippets/$concept_slug/diff-${base1}-${base2}.diff"
}
EOF
            
            # Ajouter au JSON principal
            jq --argjson newItem "$(cat $tmp_json)" '.duplicates += [$newItem]' "$JSON_REPORT" > "$OUTPUT_DIR/tmp.json"
            mv "$OUTPUT_DIR/tmp.json" "$JSON_REPORT"
            rm "$tmp_json"
          fi
        fi
      done
    done
  fi
  
  # Ajouter une ligne vide entre les concepts
  echo "" >> "$REPORT_FILE"
done

############################################################
# ÉTAPE 3: ANALYSE GLOBALE DES DOUBLONS VIA JSCPD
############################################################

log "Analyse globale des doublons avec des techniques avancées..."

# Si jscpd est disponible, l'utiliser pour une analyse plus approfondie
if command -v npx &>/dev/null; then
  log "Installation et exécution de jscpd pour l'analyse globale..."
  
  # Créer un fichier de configuration temporaire
  cat > "$OUTPUT_DIR/jscpd.json" << EOF
{
  "threshold": 1,
  "reporters": ["json"],
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/backup/**",
    "**/archives/**",
    "**/*.d.ts"
  ],
  "absolute": true,
  "output": "$OUTPUT_DIR"
}
EOF
  
  # Exécuter jscpd
  npx jscpd --config "$OUTPUT_DIR/jscpd.json" ./packages ./apps &> "$OUTPUT_DIR/jscpd-output.log" || true
  
  # Si le fichier de rapport a été généré, l'utiliser
  if [ -f "$OUTPUT_DIR/jscpd-report.json" ]; then
    log "Analyse jscpd terminée avec succès"
    
    # Extraire les statistiques
    DUPLICATES_COUNT=$(jq '.statistics.total.duplicates' "$OUTPUT_DIR/jscpd-report.json")
    DUPLICATED_LINES=$(jq '.statistics.total.duplicatedLines' "$OUTPUT_DIR/jscpd-report.json")
    DUPLICATION_PERCENTAGE=$(jq '.statistics.total.percentage' "$OUTPUT_DIR/jscpd-report.json")
    
    cat >> "$REPORT_FILE" << EOF
## Analyse globale des doublons

- **Doublons détectés**: $DUPLICATES_COUNT
- **Lignes dupliquées**: $DUPLICATED_LINES
- **Taux de duplication**: $DUPLICATION_PERCENTAGE%

EOF
    
    # Ajouter les 10 doublons les plus importants
    cat >> "$REPORT_FILE" << EOF
### Top 10 des doublons les plus importants

| Fichier 1 | Fichier 2 | Lignes dupliquées | Similarité |
|-----------|-----------|-------------------|------------|
EOF
    
    jq -r '.duplicates | sort_by(-.fragment.lines) | .[0:10] | .[] | "| `\(.firstFile.name)` | `\(.secondFile.name)` | \(.fragment.lines) | \(.fragment.lines / (.firstFile.lines + .secondFile.lines) * 100 | floor)% |"' "$OUTPUT_DIR/jscpd-report.json" >> "$REPORT_FILE" || true
  else
    warn "L'analyse jscpd n'a pas généré de rapport"
  fi
else
  warn "npx n'est pas disponible, l'analyse jscpd sera ignorée"
fi

############################################################
# ÉTAPE 4: GÉNÉRER DES RECOMMANDATIONS
############################################################

log "Génération des recommandations..."

cat >> "$REPORT_FILE" << EOF
## Recommandations de déduplication

En se basant sur l'analyse des doublons, voici les recommandations pour la déduplication :

EOF

# Analyser les résultats et générer des recommandations
HIGH_SIMILARITY_COUNT=$(jq '.duplicates | map(select(.similarity >= '$THRESHOLD_HIGH')) | length' "$JSON_REPORT")
MEDIUM_SIMILARITY_COUNT=$(jq '.duplicates | map(select(.similarity >= '$THRESHOLD_MEDIUM' and .similarity < '$THRESHOLD_HIGH')) | length' "$JSON_REPORT")
LOW_SIMILARITY_COUNT=$(jq '.duplicates | map(select(.similarity >= '$THRESHOLD_LOW' and .similarity < '$THRESHOLD_MEDIUM')) | length' "$JSON_REPORT")

cat >> "$REPORT_FILE" << EOF
### Résumé des doublons

- **Doublons à similarité élevée**: $HIGH_SIMILARITY_COUNT (>$THRESHOLD_HIGH%)
- **Doublons à similarité moyenne**: $MEDIUM_SIMILARITY_COUNT (entre $THRESHOLD_MEDIUM% et $THRESHOLD_HIGH%)
- **Doublons à similarité faible**: $LOW_SIMILARITY_COUNT (entre $THRESHOLD_LOW% et $THRESHOLD_MEDIUM%)

### Actions recommandées

EOF

# Générer des recommandations par concept
for concept in "${!CONCEPTS[@]}"; do
  concept_json=$(jq '.duplicates | map(select(.concept == "'$concept'"))' "$JSON_REPORT")
  concept_count=$(echo "$concept_json" | jq 'length')
  
  if [ "$concept_count" -gt 0 ]; then
    high_count=$(echo "$concept_json" | jq 'map(select(.similarity >= '$THRESHOLD_HIGH')) | length')
    
    if [ "$high_count" -gt 0 ]; then
      cat >> "$REPORT_FILE" << EOF
#### $concept

Il existe $high_count groupes de fichiers avec une similarité élevée pour le concept $concept.
Recommandation: **Fusionner immédiatement** ces fichiers en conservant:

EOF
      
      # Trouver le fichier le plus récent ou dans le chemin standard pour chaque groupe
      echo "$concept_json" | jq -r 'group_by(.concept) | .[] | sort_by(-.similarity) | .[0] | "- Conserver `\(.file1)` ou `\(.file2)` selon le chemin standard ou la date de modification la plus récente"' >> "$REPORT_FILE"
      
      cat >> "$REPORT_FILE" << EOF

EOF
    fi
  fi
done

# Recommandations générales
cat >> "$REPORT_FILE" << EOF
### Recommandations générales

1. **Priorité haute**: Fusionner les $HIGH_SIMILARITY_COUNT fichiers ayant une similarité >$THRESHOLD_HIGH%.
2. **Priorité moyenne**: Examiner les $MEDIUM_SIMILARITY_COUNT fichiers ayant une similarité entre $THRESHOLD_MEDIUM% et $THRESHOLD_HIGH%.
3. **Priorité basse**: Évaluer les $LOW_SIMILARITY_COUNT fichiers ayant une similarité entre $THRESHOLD_LOW% et $THRESHOLD_MEDIUM%.

### Structure cible recommandée

Pour réduire les doublons à l'avenir, standardisez votre structure de projet:

\`\`\`
packages/
  ├── business/           # Couche métier
  │   └── src/
  │       ├── api/        # API OpenAPI avec TypeBox
  │       ├── orchestration/
  │       │   ├── adapters/
  │       │   │   ├── standardized-temporal-adapter.ts
  │       │   │   └── standardized-bullmq-adapter.ts
  │       │   └── standardized-orchestrator.ts
  │       └── tests/      # Tests unitaires
  ├── core/               # Abstractions et interfaces
  │   └── src/
  └── infrastructure/     # Services d'infrastructure
      └── src/
          └── redis/      # Service Redis avec RedisJSON
\`\`\`

Assurez-vous que les développeurs connaissent cette structure et savent où placer les nouveaux fichiers.
EOF

############################################################
# ÉTAPE 5: FINALISER LA VISUALISATION HTML
############################################################

log "Finalisation de la visualisation HTML..."

# Compter les doublons par niveau de similarité
TOTAL_DUPLICATES=$(jq '.duplicates | length' "$JSON_REPORT")

# Mettre à jour le HTML avec les données
sed -i "s/const duplicateData = \[\]/const duplicateData = $(cat $JSON_REPORT)/" "$HTML_REPORT"
sed -i "s/document.addEventListener('DOMContentLoaded', function() {/document.addEventListener('DOMContentLoaded', function() {\n            document.getElementById('total-files').textContent = '$TOTAL_FILES';\n            document.getElementById('total-lines').textContent = '$TOTAL_LINES';\n            document.getElementById('total-duplicates').textContent = '$TOTAL_DUPLICATES';\n            document.getElementById('duplication-rate').textContent = '$DUPLICATION_PERCENTAGE%';\n            \n            const duplicateGroupsContainer = document.getElementById('duplicate-groups');\n            duplicateGroupsContainer.innerHTML = '';\n            \n            // Grouper par concept\n            const conceptGroups = {};\n            duplicateData.duplicates.forEach(duplicate => {\n                if (!conceptGroups[duplicate.concept]) {\n                    conceptGroups[duplicate.concept] = [];\n                }\n                conceptGroups[duplicate.concept].push(duplicate);\n            });\n            \n            // Créer les groupes\n            for (const [concept, duplicates] of Object.entries(conceptGroups)) {\n                const conceptElement = document.createElement('div');\n                conceptElement.innerHTML = \`<h3>\${concept} (\${duplicates.length} doublons)</h3>\`;\n                \n                duplicates.forEach(duplicate => {\n                    const similarityClass = duplicate.similarity >= $THRESHOLD_HIGH ? 'high-similarity' : \n                                          duplicate.similarity >= $THRESHOLD_MEDIUM ? 'medium-similarity' : 'low-similarity';\n                    \n                    const duplicateElement = document.createElement('div');\n                    duplicateElement.className = \`duplicate-group \${similarityClass}\`;\n                    duplicateElement.innerHTML = \`\n                        <h4>Similarité: \${duplicate.similarity}% (\${duplicate.similarityLevel})</h4>\n                        <p><strong>Fichier 1:</strong> <span class=\"file-path\">\${duplicate.file1}</span></p>\n                        <p><strong>Fichier 2:</strong> <span class=\"file-path\">\${duplicate.file2}</span></p>\n                    \`;\n                    \n                    conceptElement.appendChild(duplicateElement);\n                });\n                \n                duplicateGroupsContainer.appendChild(conceptElement);\n            }\n            \n            // Recommandations\n            const recommendationsContainer = document.getElementById('recommendations');\n            recommendationsContainer.innerHTML = \`\n                <p>Basé sur l'analyse, nous recommandons de:</p>\n                <ul>\n                    <li><strong>Fusionner immédiatement</strong> les \${$HIGH_SIMILARITY_COUNT} doublons à similarité élevée</li>\n                    <li><strong>Examiner</strong> les \${$MEDIUM_SIMILARITY_COUNT} doublons à similarité moyenne</li>\n                    <li><strong>Évaluer</strong> les \${$LOW_SIMILARITY_COUNT} doublons à similarité faible</li>\n                </ul>\n            \`;\n/" "$HTML_REPORT"

success "Analyse avancée des doublons terminée!"
success "Rapports disponibles dans le dossier: $OUTPUT_DIR"
success "  - Rapport texte: $REPORT_FILE"
success "  - Visualisation: $HTML_REPORT"
success "  - Données JSON: $JSON_REPORT"

echo -e "\n${GREEN}=== Analyse avancée des doublons terminée ===${NC}\n"
