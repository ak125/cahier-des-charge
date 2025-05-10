#!/bin/bash
# Analyseur de doublons de fonctions et méthodes
# Date: 9 mai 2025

# Définition des couleurs
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
OUTPUT_DIR="./reports/function-signature-analysis-$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="$OUTPUT_DIR/function-signature-analysis.md"
JSON_FILE="$OUTPUT_DIR/function-signatures.json"

# Créer les répertoires
mkdir -p "$OUTPUT_DIR"

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
# Rapport d'analyse des signatures de fonctions et méthodes
Date: $(date +"%d/%m/%Y %H:%M:%S")

Ce rapport présente les fonctions et méthodes ayant des signatures identiques ou similaires,
ce qui pourrait indiquer des doublons fonctionnels.

## Résumé

EOF

# Initialiser le JSON
echo "{\"signatures\": []}" > "$JSON_FILE"

log "Début de l'analyse des signatures de fonctions..."

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

############################################################
# ÉTAPE 2: EXTRACTION DES SIGNATURES DE FONCTION
############################################################

log "Extraction des signatures de fonction..."

# Créer un fichier temporaire pour stocker toutes les signatures
SIGNATURES_FILE="$OUTPUT_DIR/all-signatures.txt"
touch "$SIGNATURES_FILE"

# Pour chaque fichier, extraire les signatures de fonction
file_count=0
while IFS= read -r file; do
  file_count=$((file_count + 1))
  
  # Afficher la progression
  if [ $((file_count % 50)) -eq 0 ]; then
    log "  Progression: $file_count/$FILES_COUNT fichiers analysés"
  fi
  
  # Extraire les signatures de fonction
  # Format: classe.méthode(args) ou fonction(args)
  # 1. Fonctions standard
  grep -n -E '^\s*(export\s+)?(function|const|let|var)\s+([a-zA-Z0-9_]+)\s*\([^)]*\)' "$file" | 
    sed -E "s/^([0-9]+):.*(function|const|let|var)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\).*/\3(\4)|\1|$file/" >> "$SIGNATURES_FILE"
  
  # 2. Méthodes de classe
  grep -n -E '^\s*(public|private|protected)?\s*([a-zA-Z0-9_]+)\s*\([^)]*\)' "$file" | 
    sed -E "s/^([0-9]+):.*?(public|private|protected)?\s*([a-zA-Z0-9_]+)\s*\(([^)]*)\).*/\3(\4)|\1|$file/" >> "$SIGNATURES_FILE"
  
  # 3. Méthodes de classe avec modificateurs TypeScript
  grep -n -E '^\s*(public|private|protected)?\s*(static|async)?\s*([a-zA-Z0-9_]+)\s*\([^)]*\)' "$file" | 
    sed -E "s/^([0-9]+):.*?(public|private|protected)?\s*(static|async)?\s*([a-zA-Z0-9_]+)\s*\(([^)]*)\).*/\4(\5)|\1|$file/" >> "$SIGNATURES_FILE"
  
  # 4. Fonctions fléchées
  grep -n -E '^\s*(export\s+)?(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(\(.*\)|[a-zA-Z0-9_]+)\s*=>' "$file" | 
    sed -E "s/^([0-9]+):.*(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(\(([^)]*)\)|([a-zA-Z0-9_]+)).*/\3(\5\6)|\1|$file/" >> "$SIGNATURES_FILE"
done < "$FILES_LIST"

# Trier les signatures pour regrouper les doublons
sort "$SIGNATURES_FILE" -o "$SIGNATURES_FILE"

log "Extraction des signatures terminée"

############################################################
# ÉTAPE 3: ANALYSE DES SIGNATURES DUPLIQUÉES
############################################################

log "Analyse des signatures dupliquées..."

# Créer un fichier pour les signatures uniques (pour référence)
UNIQUE_SIGNATURES="$OUTPUT_DIR/unique-signatures.txt"
DUPLICATE_SIGNATURES="$OUTPUT_DIR/duplicate-signatures.txt"

# Extraire le nom de la fonction/méthode pour les regroupements
cut -d'(' -f1 "$SIGNATURES_FILE" | sort | uniq -c | sort -nr > "$OUTPUT_DIR/function-name-counts.txt"

# Trouver les signatures qui apparaissent plusieurs fois
prev_sig=""
prev_file=""
prev_line=""
duplicates=0

# Créer une structure temporaire pour stocker les groupes de signatures dupliquées
mkdir -p "$OUTPUT_DIR/duplicate-groups"

current_group=""
while IFS='|' read -r signature line file; do
  sig_name=$(echo "$signature" | cut -d'(' -f1)
  
  # Si la signature est similaire à la précédente (même nom de fonction)
  if [[ "$sig_name" == "$(echo "$prev_sig" | cut -d'(' -f1)" && -n "$prev_sig" && "$file" != "$prev_file" ]]; then
    if [ -z "$current_group" ]; then
      # Créer un nouveau groupe
      current_group="group_${duplicates}"
      mkdir -p "$OUTPUT_DIR/duplicate-groups/$current_group"
      duplicates=$((duplicates + 1))
      
      # Enregistrer la première occurrence
      echo "$prev_sig|$prev_line|$prev_file" > "$OUTPUT_DIR/duplicate-groups/$current_group/occurrences.txt"
    fi
    
    # Ajouter cette occurrence
    echo "$signature|$line|$file" >> "$OUTPUT_DIR/duplicate-groups/$current_group/occurrences.txt"
  elif [ -n "$current_group" ]; then
    # Finaliser le groupe précédent
    current_group=""
  fi
  
  # Mettre à jour les valeurs pour la prochaine itération
  prev_sig="$signature"
  prev_line="$line"
  prev_file="$file"
done < "$SIGNATURES_FILE"

log "Trouvé $duplicates groupes de signatures potentiellement dupliquées"

############################################################
# ÉTAPE 4: GÉNÉRATION DU RAPPORT
############################################################

log "Génération du rapport détaillé..."

cat >> "$REPORT_FILE" << EOF
- **Fichiers analysés**: $FILES_COUNT
- **Groupes de signatures similaires détectés**: $duplicates

## Groupes de signatures similaires

EOF

# Pour chaque groupe de doublons, analyser et ajouter au rapport
group_id=0
while [ $group_id -lt $duplicates ]; do
  group_dir="$OUTPUT_DIR/duplicate-groups/group_${group_id}"
  group_file="$group_dir/occurrences.txt"
  
  if [ -f "$group_file" ]; then
    # Compter les occurrences
    occurrences=$(wc -l < "$group_file")
    
    # Obtenir le nom de la fonction
    first_line=$(head -n 1 "$group_file")
    function_name=$(echo "$first_line" | cut -d'|' -f1 | cut -d'(' -f1)
    
    cat >> "$REPORT_FILE" << EOF
### $function_name ($occurrences occurrences)

| Signature | Fichier | Ligne |
|-----------|---------|-------|
EOF
    
    # Ajouter chaque occurrence au rapport
    while IFS='|' read -r signature line file; do
      echo "| \`$signature\` | \`$file\` | $line |" >> "$REPORT_FILE"
      
      # Ajouter au JSON
      tmp_json="$OUTPUT_DIR/tmp-signature-$group_id.json"
      cat > "$tmp_json" << EOF
{
  "functionName": "$function_name",
  "signature": "$signature",
  "file": "$file",
  "line": $line
}
EOF
      
      # Ajouter au JSON principal
      jq --argjson newItem "$(cat $tmp_json)" '.signatures += [$newItem]' "$JSON_FILE" > "$OUTPUT_DIR/tmp.json"
      mv "$OUTPUT_DIR/tmp.json" "$JSON_FILE"
      rm "$tmp_json"
    done < "$group_file"
    
    cat >> "$REPORT_FILE" << EOF

EOF
  fi
  
  group_id=$((group_id + 1))
done

############################################################
# ÉTAPE 5: RECOMMANDATIONS
############################################################

log "Génération des recommandations..."

cat >> "$REPORT_FILE" << EOF
## Recommandations

L'analyse a identifié $duplicates groupes de fonctions ou méthodes avec des signatures similaires.
Ces groupes représentent des candidats potentiels pour la déduplication et la refactorisation:

1. **Extraire en utilitaires communs**: Pour les fonctions utilitaires qui apparaissent dans plusieurs fichiers,
   envisagez de les extraire dans des modules d'utilitaires partagés.

2. **Abstraire en classes de base**: Pour les méthodes de classe qui se répètent dans plusieurs classes,
   envisagez de créer une classe de base ou d'utiliser la composition.

3. **Examiner les implémentations**: Pour les fonctions ayant la même signature mais dans des contextes différents,
   vérifiez si les implémentations sont similaires ou différentes par nécessité.

### Fonctions à haute priorité pour la déduplication

EOF

# Identifier les groupes avec le plus grand nombre d'occurrences
top_duplicates=$(find "$OUTPUT_DIR/duplicate-groups" -name "occurrences.txt" -exec wc -l {} \; | sort -nr | head -5)

if [ -n "$top_duplicates" ]; then
  echo "$top_duplicates" | while read -r count file; do
    if [ -f "$file" ]; then
      first_line=$(head -n 1 "$file")
      function_name=$(echo "$first_line" | cut -d'|' -f1 | cut -d'(' -f1)
      
      cat >> "$REPORT_FILE" << EOF
- **$function_name** ($count occurrences) - Apprécie dans plusieurs fichiers
EOF
    fi
  done
else
  echo "Aucun groupe majeur de duplications identifié." >> "$REPORT_FILE"
fi

success "Analyse des signatures de fonctions terminée!"
success "Rapport disponible dans: $REPORT_FILE"
success "Données JSON disponibles dans: $JSON_FILE"

echo -e "\n${GREEN}=== Analyse des signatures de fonctions terminée ===${NC}\n"
