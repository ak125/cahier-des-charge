#!/bin/bash

# Script pour détecter les dépendances non utilisées dans un monorepo NX

# Définition des couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Détecteur de dépendances inutilisées ===${NC}"
echo "Ce script va analyser les dépendances non utilisées dans votre monorepo."

# Vérifier si depcheck est installé
if ! command -v depcheck &> /dev/null && ! npm list -g depcheck &> /dev/null; then
  echo -e "${YELLOW}Le package 'depcheck' n'est pas installé. Utilisation de l'analyse manuelle.${NC}"
  USE_DEPCHECK=0
else
  USE_DEPCHECK=1
  echo -e "${GREEN}Utilisation de depcheck pour l'analyse${NC}"
fi

# Fonction pour analyser les dépendances d'un package
analyze_package() {
  local package_dir=$1
  local package_name=$(basename "$package_dir")
  
  echo -e "${YELLOW}Analyse de $package_name...${NC}"
  
  # Vérifier si package.json existe
  if [ ! -f "$package_dir/package.json" ]; then
    echo -e "${RED}Pas de package.json trouvé dans $package_dir${NC}"
    return
  fi
  
  if [ "$USE_DEPCHECK" -eq 1 ]; then
    # Utiliser depcheck si disponible
    echo -e "${GREEN}Exécution de depcheck pour $package_name${NC}"
    npx depcheck "$package_dir" --json | jq '.dependencies'
  else
    # Analyse manuelle basique
    echo -e "${YELLOW}Analyse manuelle des dépendances pour $package_name${NC}"
    
    # Extraire les dépendances du package.json
    local dependencies=$(jq -r '.dependencies | keys[]' "$package_dir/package.json" 2>/dev/null || echo "")
    local devDependencies=$(jq -r '.devDependencies | keys[]' "$package_dir/package.json" 2>/dev/null || echo "")
    
    if [ -z "$dependencies" ] && [ -z "$devDependencies" ]; then
      echo -e "${RED}Aucune dépendance trouvée dans $package_name${NC}"
      return
    fi
    
    # Créer une liste combinée de toutes les dépendances
    local all_deps=("$dependencies" "$devDependencies")
    
    echo -e "${GREEN}Dépendances trouvées:${NC}"
    
    # Pour chaque dépendance, vérifier si elle est référencée dans les fichiers de code
    for dep in "${all_deps[@]}"; do
      if [ -n "$dep" ]; then
        # Comptez les références à cette dépendance dans les fichiers source
        local references=$(find "$package_dir" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.json" \) -not -path "*/node_modules/*" -not -path "*/dist/*" | xargs grep -l "$dep" 2>/dev/null | wc -l)
        
        if [ "$references" -eq 0 ]; then
          echo -e "${RED}Potentiellement inutilisée: $dep${NC}"
        else
          echo -e "${GREEN}Utilisée ($references références): $dep${NC}"
        fi
      fi
    done
  fi
  
  echo -e "${YELLOW}Analyse terminée pour $package_name${NC}"
  echo "---------------------------------------------"
}

# Fonction principale
main() {
  local target_dir=${1:-"."}
  
  echo -e "${GREEN}Recherche des packages dans $target_dir${NC}"
  
  # Vérifier si le répertoire cible est un package
  if [ -f "$target_dir/package.json" ]; then
    analyze_package "$target_dir"
    return
  fi
  
  # Chercher tous les packages dans le monorepo
  local packages=$(find "$target_dir" -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.nx/*" | xargs -n1 dirname)
  
  if [ -z "$packages" ]; then
    echo -e "${RED}Aucun package trouvé dans $target_dir${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Packages trouvés:${NC}"
  for pkg in $packages; do
    echo " - $pkg"
  done
  
  echo ""
  read -p "Voulez-vous analyser tous ces packages? (o/n): " confirm
  if [ "$confirm" = "o" ] || [ "$confirm" = "O" ] || [ "$confirm" = "oui" ]; then
    for pkg in $packages; do
      analyze_package "$pkg"
    done
    
    echo -e "${GREEN}Analyse terminée pour tous les packages${NC}"
  else
    echo -e "${YELLOW}Analyse annulée${NC}"
  fi
}

# Exécution avec le répertoire fourni en argument ou le répertoire courant
main "${1:-.}"