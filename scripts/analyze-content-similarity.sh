#!/bin/bash

# Script d'analyse sémantique de la similarité des contenus
# pour détecter des duplications conceptuelles, même avec des fichiers structurellement différents
#
# Usage: ./scripts/analyze-content-similarity.sh [--threshold=N]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Options
THRESHOLD=60 # Pourcentage de similarité pour signaler des concepts similaires

# Traitement des arguments
for arg in "$@"; do
  case $arg in
    --threshold=*)
      THRESHOLD="${arg#*=}"
      if ! [[ "$THRESHOLD" =~ ^[0-9]+$ ]] || [ "$THRESHOLD" -lt 1 ] || [ "$THRESHOLD" -gt 100 ]; then
        echo -e "${RED}❌ Seuil de similarité conceptuelle invalide. Utilisation de la valeur par défaut (60%).${NC}"
        THRESHOLD=60
      fi
      echo -e "${BLUE}ℹ️ Seuil de similarité conceptuelle défini à ${THRESHOLD}%${NC}"
      ;;
  esac
done

# Répertoire de travail
WORKSPACE_DIR="/workspaces/cahier-des-charge"
CDC_DIR="${WORKSPACE_DIR}/cahier-des-charges"

# Fonction pour extraire les concepts clés d'un fichier
extract_key_concepts() {
  local file="$1"
  
  # Extraire le titre et les sous-titres (lignes commençant par # ou ##)
  grep -E "^#+ " "$file" | 
    # Supprimer les marqueurs markdown
    sed 's/^#\+\s*//' | 
    # Convertir en minuscules
    tr '[:upper:]' '[:lower:]' | 
    # Supprimer la ponctuation
    tr -d '[:punct:]' | 
    # Découper en mots
    tr ' ' '\n' | 
    # Supprimer les mots de moins de 4 caractères (articles, etc.)
    grep -E '.{4,}' | 
    # Trier et compter les occurrences
    sort | uniq -c | sort -nr
}

# Fonction pour calculer la similarité conceptuelle entre deux fichiers
calculate_concept_similarity() {
  local file1="$1"
  local file2="$2"
  
  # Fichiers temporaires pour stocker les concepts
  local concepts1=$(mktemp)
  local concepts2=$(mktemp)
  
  # Extraire les concepts clés
  extract_key_concepts "$file1" > "$concepts1"
  extract_key_concepts "$file2" > "$concepts2"
  
  # Obtenir les concepts communs
  local common_concepts=$(comm -12 <(sort "$concepts1") <(sort "$concepts2") | wc -l)
  
  # Obtenir le nombre total de concepts uniques dans les deux fichiers
  local total_concepts=$(cat "$concepts1" "$concepts2" | sort | uniq | wc -l)
  
  # Calculer la similarité en pourcentage
  local similarity=0
  if [ "$total_concepts" -gt 0 ]; then
    similarity=$(( (common_concepts * 100) / total_concepts ))
  fi
  
  # Nettoyer
  rm "$concepts1" "$concepts2"
  
  echo "$similarity"
}

# Fonction pour analyser les similarités conceptuelles
analyze_conceptual_similarity() {
  echo -e "${BLUE}🧠 Analyse des similarités conceptuelles entre fichiers...${NC}"
  
  # Obtenir la liste des fichiers markdown
  local md_files=($(find "$CDC_DIR" -maxdepth 1 -type f -name "*.md"))
  
  # Créer un tableau pour stocker les paires avec forte similarité
  declare -a similar_pairs
  
  # Comparer chaque paire de fichiers
  for ((i=0; i<${#md_files[@]}-1; i++)); do
    # Afficher la progression
    echo -e "${BLUE}Analyse du fichier [${i}/${#md_files[@]}]: $(basename "${md_files[$i]}")${NC}"
    
    for ((j=i+1; j<${#md_files[@]}; j++)); do
      # Vérifier rapidement si les fichiers ont une taille très différente
      local size1=$(wc -c < "${md_files[$i]}")
      local size2=$(wc -c < "${md_files[$j]}")
      local size_ratio=$(( (size1 * 100) / (size2 + 1) ))
      
      # Ignorer les paires avec une différence de taille trop importante
      if [ "$size_ratio" -lt 50 ] || [ "$size_ratio" -gt 200 ]; then
        continue
      fi
      
      # Calculer la similarité conceptuelle
      local similarity=$(calculate_concept_similarity "${md_files[$i]}" "${md_files[$j]}")
      
      # Si la similarité est supérieure au seuil, enregistrer la paire
      if [ "$similarity" -ge "$THRESHOLD" ]; then
        similar_pairs+=("${md_files[$i]}|${md_files[$j]}|$similarity")
      fi
    done
  done
  
  # Afficher les résultats
  if [ ${#similar_pairs[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune similarité conceptuelle significative détectée.${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}⚠️ Fichiers avec forte similarité conceptuelle:${NC}"
  
  # Trier les paires par similarité décroissante
  IFS=$'\n' sorted_pairs=($(sort -t'|' -k3 -nr <<<"${similar_pairs[*]}"))
  unset IFS
  
  for pair in "${sorted_pairs[@]}"; do
    IFS='|' read -r file1 file2 similarity <<< "$pair"
    echo -e "${PURPLE}${similarity}% de similarité conceptuelle entre:${NC}"
    echo -e "  1. ${file1}"
    echo -e "  2. ${file2}"
    
    # Afficher les concepts communs les plus importants
    echo -e "${BLUE}Concepts communs importants:${NC}"
    
    # Compter les occurrences des mots dans les deux fichiers
    cat "$file1" "$file2" | 
      tr '[:upper:]' '[:lower:]' | 
      tr -cs 'a-z' '\n' | 
      grep -E '.{4,}' | 
      sort | 
      uniq -c | 
      sort -nr | 
      head -5 | 
      sed 's/^/  /'
    
    echo
  done
  
  echo -e "${YELLOW}⚠️ Ces fichiers partagent des concepts similaires et pourraient bénéficier d'une fusion ou d'une réorganisation.${NC}"
  echo -e "${YELLOW}Utilisez le script cleanup-duplicates.sh pour une analyse plus détaillée et des options de suppression sécurisée.${NC}"
}

# Fonction principale
main() {
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${BLUE}🔍 Analyse de similarité conceptuelle du cahier des charges${NC}"
  echo -e "${BLUE}==================================================${NC}"
  
  analyze_conceptual_similarity
  
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${GREEN}✅ Analyse terminée${NC}"
  echo -e "${BLUE}==================================================${NC}"
}

# Exécuter le script
main
