#!/bin/bash

# Script pour corriger les erreurs survenues lors de la réorganisation
# Utilisation: ./scripts/fix-migration-errors.sh

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Correction des erreurs de migration...${NC}"

# Liste des scripts qui ont échoué lors de la migration
FAILED_SCRIPTS=(
  "analyze-similarity.sh"
  "analyze-content-similarity.sh"
  "cleanup-duplicates.sh"
  "deduplicate-files.sh"
  "dry-run-all.sh"
  "fix-permissions.sh"
  "insert-and-track.sh"
  "install-pipeline.sh"
  "make-scripts-executable.sh"
  "monitor-resources.sh"
  "optimize-project.sh"
  "pipeline-logs.sh"
  "pipeline-status.sh"
  "rectify-cdc.sh"
  "rename-files.sh"
  "render-html.sh"
  "setup-parallel-cahier.sh"
  "setup-tracking.sh"
  "start-pipeline.sh"
  "stop-pipeline.sh"
  "update-cahier.sh"
  "analyze-similarity.ts"
  "cahier-des-charges-verifier.ts"
  "deduplicate-files.ts"
  "render-html.ts"
  "sync-migration-status.ts"
  "update-cahier.ts"
)

# Fonction pour déterminer le dossier de destination
get_destination_dir() {
  local filename="$1"
  
  if [[ "$filename" == *"verify"* || "$filename" == *"check"* || "$filename" == *"audit"* ]]; then
    echo "scripts/verifiers"
  elif [[ "$filename" == *"util"* || "$filename" == *"helper"* || "$filename" == *"dry-run"* ]]; then
    echo "scripts/utils"
  elif [[ "$filename" == *"template"* || "$filename" == *"generate"* ]]; then
    echo "scripts/templates"
  else
    echo "scripts"
  fi
}

# Corriger les problèmes de copie des scripts
fixed_count=0
for script in "${FAILED_SCRIPTS[@]}"; do
  # Vérifier si le script existe dans le dossier source
  if [ -f "scripts/$script" ]; then
    src="scripts/$script"
    dst_dir=$(get_destination_dir "$script")
    dst="$dst_dir/$script"
    
    # S'assurer que le répertoire de destination existe
    mkdir -p "$dst_dir"
    
    # Copier le fichier
    if cp "$src" "$dst"; then
      echo -e "${GREEN}✅ Copié: $src -> $dst${NC}"
      fixed_count=$((fixed_count+1))
      
      # Rendre le script exécutable si c'est un .sh
      if [[ "$script" == *.sh ]]; then
        chmod +x "$dst"
        echo -e "${GREEN}  → Script rendu exécutable${NC}"
      fi
    else
      echo -e "${RED}❌ Échec de copie: $src -> $dst${NC}"
    fi
  elif [ -f "cahier/$script" ]; then
    # Certains scripts peuvent être dans le dossier cahier
    src="cahier/$script"
    dst_dir=$(get_destination_dir "$script")
    dst="$dst_dir/$script"
    
    # S'assurer que le répertoire de destination existe
    mkdir -p "$dst_dir"
    
    # Copier le fichier
    if cp "$src" "$dst"; then
      echo -e "${GREEN}✅ Copié: $src -> $dst${NC}"
      fixed_count=$((fixed_count+1))
      
      # Rendre le script exécutable si c'est un .sh
      if [[ "$script" == *.sh ]]; then
        chmod +x "$dst"
        echo -e "${GREEN}  → Script rendu exécutable${NC}"
      fi
    else
      echo -e "${RED}❌ Échec de copie: $src -> $dst${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Script source non trouvé: $script${NC}"
  fi
done

# Vérifier s'il manque le fichier 00-sommaire.md dans cahier-des-charges
if [ ! -f "cahier-des-charges/00-sommaire.md" ] && [ -f "cahier/00-sommaire.md" ]; then
  cp "cahier/00-sommaire.md" "cahier-des-charges/00-sommaire.md"
  echo -e "${GREEN}✅ Copié: cahier/00-sommaire.md -> cahier-des-charges/00-sommaire.md${NC}"
  fixed_count=$((fixed_count+1))
fi

# Mise à jour du fichier de configuration principal si nécessaire
if [ -f "cahier_check.config.json" ]; then
  # Vérifier si les chemins dans le fichier de configuration pointent vers la nouvelle structure
  if grep -q '"cahier": "./cahier/"' "cahier_check.config.json"; then
    # Mettre à jour les chemins
    sed -i 's/"cahier": "\.\/cahier\/"/"cahier": "\.\/cahier-des-charges\/"/g' "cahier_check.config.json"
    sed -i 's/"htmlOutput": "\.\/dist\/cahier\.html"/"htmlOutput": "\.\/dist\/cahier-des-charges\.html"/g' "cahier_check.config.json"
    echo -e "${GREEN}✅ Fichier cahier_check.config.json mis à jour avec les nouveaux chemins${NC}"
    fixed_count=$((fixed_count+1))
  fi
fi

# Créer un fichier index.md dans cahier-des-charges si manquant
if [ ! -f "cahier-des-charges/index.md" ]; then
  cat > "cahier-des-charges/index.md" << EOL
# Cahier des Charges - Migration PHP vers NestJS/Remix

Bienvenue dans le cahier des charges pour la migration de l'application PHP legacy vers NestJS et Remix.

## Navigation rapide

- [Sommaire](./00-sommaire.md)
- [Vue d'ensemble](./docs/01-vue-ensemble.md)
- [Analyse de l'existant](./docs/02-analyse-existant.md)

## Structure du cahier des charges

- **docs/** - Documentation générale
- **audits/** - Analyses détaillées des fichiers
- **backlogs/** - Tâches de migration par fichier
- **impact-graphs/** - Graphes de dépendances
- **rapports/** - Rapports générés

## Dernière mise à jour

$(date)
EOL
  echo -e "${GREEN}✅ Fichier index.md créé dans cahier-des-charges${NC}"
  fixed_count=$((fixed_count+1))
fi

# Rapport final
echo -e "\n${BLUE}📊 Résumé des corrections${NC}"
echo -e "${GREEN}✅ $fixed_count problèmes corrigés${NC}"
echo -e "${YELLOW}⚠️ ${#FAILED_SCRIPTS[@]} scripts étaient à corriger${NC}"

# Conseils pour les prochaines étapes
echo -e "\n${BLUE}📋 Prochaines étapes recommandées${NC}"
echo -e "1. Vérifier les fichiers non copiés qui nécessitent une attention manuelle"
echo -e "2. Exécuter la commande './scripts/verify-cahier.sh' pour vérifier la cohérence"
echo -e "3. Mettre à jour les références dans les scripts pour pointer vers la nouvelle structure"
echo -e "4. Envisager de supprimer l'ancien dossier 'cahier' après une vérification complète"

# Rendre ce script exécutable
chmod +x /workspaces/cahier-des-charge/scripts/fix-migration-errors.sh
