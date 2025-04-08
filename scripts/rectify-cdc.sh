#!/bin/bash

# Script pour rectifier le cahier des charges après analyse
# Gère la fusion, suppression et réorganisation des fichiers

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Répertoire de travail
CDC_DIR="/workspaces/cahier-des-charge/cahier-des-charges"
BACKUP_DIR="${CDC_DIR}/backups"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$CDC_DIR" ]; then
  echo -e "${RED}❌ Erreur: Le répertoire du cahier des charges n'existe pas${NC}"
  exit 1
fi

# Créer une sauvegarde avant toute opération
create_backup() {
  echo -e "${BLUE}📦 Création d'une sauvegarde de sécurité...${NC}"
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_file="${BACKUP_DIR}/backup_${timestamp}.tar.gz"
  
  mkdir -p "$BACKUP_DIR"
  tar -czf "$backup_file" -C "$(dirname "$CDC_DIR")" "$(basename "$CDC_DIR")"
  
  echo -e "${GREEN}✅ Sauvegarde créée: $backup_file${NC}"
  return 0
}

# Fusion de fichiers dupliqués 
merge_duplicates() {
  echo -e "${BLUE}🔄 Fusion des fichiers dupliqués...${NC}"
  
  # Structure des duplications détectées
  # Format: "fichier_canonique|fichier_dupliqué1,fichier_dupliqué2,..."
  local duplicates=(
    "41-gel-code-legacy.md|62-gel-code-legacy.md,70-gel-code-legacy.md,76-gel-code-legacy.md"
    "42-gel-structure-cible.md|63-gel-structure-cible.md,75-gel-structure-cible.md,81-gel-structure-cible.md"
    "43-socle-ia-analyse-migration.md|67-socle-ia-analyse-migration.md,77-socle-ia-analyse-migration.md,83-socle-ia-analyse-migration.md"
    "44-verification-environnement-test.md|60-verification-env-test.md"
    "45-profil-monorepo-reference.md|10c-finaliser-profil-monorepo.md"
    "47-backlog-modules-fonctionnels.md|10d-backlog-par-modules.md"
  )
  
  for entry in "${duplicates[@]}"; do
    IFS='|' read -r canonical duplicates_list <<< "$entry"
    IFS=',' read -ra duplicate_files <<< "$duplicates_list"
    
    canonical_path="${CDC_DIR}/${canonical}"
    
    if [ ! -f "$canonical_path" ]; then
      echo -e "${YELLOW}⚠️ Fichier canonique non trouvé: $canonical_path${NC}"
      continue
    fi
    
    echo -e "${BLUE}🔄 Traitement du fichier canonique: $canonical${NC}"
    
    for duplicate in "${duplicate_files[@]}"; do
      duplicate_path="${CDC_DIR}/${duplicate}"
      
      if [ ! -f "$duplicate_path" ]; then
        echo -e "${YELLOW}⚠️ Fichier dupliqué non trouvé: $duplicate_path${NC}"
        continue
      fi
      
      echo -e "${YELLOW}🗃️ Conservation du fichier canonique: $canonical${NC}"
      echo -e "${RED}🗑️ Suppression du fichier dupliqué: $duplicate${NC}"
      
      # Vérification des différences avant suppression
      if ! cmp -s "$canonical_path" "$duplicate_path"; then
        echo -e "${YELLOW}⚠️ Attention: Le fichier dupliqué contient des différences${NC}"
        echo -e "${BLUE}ℹ️ Différences:${NC}"
        diff -u "$duplicate_path" "$canonical_path" | head -n 10
        
        echo -e "${YELLOW}Que souhaitez-vous faire?${NC}"
        echo -e "  ${CYAN}[1]${NC} Conserver le fichier canonique uniquement"
        echo -e "  ${CYAN}[2]${NC} Fusionner les différences dans le fichier canonique"
        echo -e "  ${CYAN}[3]${NC} Ignorer ce fichier"
        read -p "Votre choix: " -n 1 -r
        echo
        
        case $REPLY in
          1)
            # Supprimer le fichier dupliqué
            rm "$duplicate_path"
            echo -e "${GREEN}✓ Fichier dupliqué supprimé${NC}"
            ;;
          2)
            # Fusionner les différences dans le fichier canonique
            # En utilisant merge pour conserver les deux versions en cas de conflit
            merge "$canonical_path" "$duplicate_path" "$canonical_path.merged"
            mv "$canonical_path.merged" "$canonical_path"
            rm "$duplicate_path"
            echo -e "${GREEN}✓ Fichiers fusionnés et dupliqué supprimé${NC}"
            ;;
          3)
            echo -e "${YELLOW}⚠️ Fichier ignoré${NC}"
            ;;
          *)
            echo -e "${YELLOW}⚠️ Choix non reconnu. Aucune action effectuée.${NC}"
            ;;
        esac
      else
        # Les fichiers sont identiques, suppression directe
        rm "$duplicate_path"
        echo -e "${GREEN}✓ Fichier dupliqué supprimé (contenu identique)${NC}"
      fi
    done
  done
}

# Mettre à jour les références dans les fichiers
update_references() {
  echo -e "${BLUE}🔄 Mise à jour des références dans les fichiers...${NC}"
  
  # Liste des remplacements à effectuer (ancien|nouveau)
  local replacements=(
    "10c-finaliser-profil-monorepo.md|45-profil-monorepo-reference.md"
    "10d-backlog-par-modules.md|47-backlog-modules-fonctionnels.md"
    "interdependances.md|36-interdependances.md"
    "changelog.md|38-changelog.md"
    ".content_suggestions.md|09-content-suggestions.md"
  )
  
  for file in "$CDC_DIR"/*.md; do
    for replacement in "${replacements[@]}"; do
      IFS='|' read -r old_ref new_ref <<< "$replacement"
      
      # Remplacer les références dans les liens markdown
      if grep -q "\[$old_ref\]" "$file" || grep -q "($old_ref)" "$file"; then
        sed -i "s|\[$old_ref\]|\[$new_ref\]|g" "$file"
        sed -i "s|($old_ref)|($new_ref)|g" "$file"
        echo -e "${GREEN}✓ Références mises à jour dans: $(basename "$file")${NC}"
      fi
    done
  done
}

# Mettre à jour le journal des modifications
update_journal() {
  echo -e "${BLUE}📝 Mise à jour du journal des modifications...${NC}"
  
  local journal_file="${CDC_DIR}/38-journal-modifications.md"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  if [ ! -f "$journal_file" ]; then
    echo -e "${RED}❌ Journal des modifications non trouvé: $journal_file${NC}"
    return 1
  fi
  
  local entry="### $timestamp\n**Auteur**: Script de rectification\n**Sections**: Multiples\n**Type**: Maintenance\n**Résumé**: Rectification automatique du cahier des charges. Fusion des fichiers dupliqués, mise à jour des références et réorganisation de la structure documentaire pour améliorer la cohérence globale.\n\n"
  
  # Insérer l'entrée après la ligne "## 📜 Journal des modifications" ou au début
  if grep -q "## 📜 Journal des modifications" "$journal_file"; then
    sed -i "/## 📜 Journal des modifications/a $entry" "$journal_file"
  else
    # Trouver le premier titre de niveau 2 ou 1 et insérer après
    sed -i "0,/^#/ s/^#.*$/&\n\n$entry/" "$journal_file"
  fi
  
  echo -e "${GREEN}✓ Journal des modifications mis à jour${NC}"
}

# Vérifier les conventions de nommage des fichiers
check_naming_conventions() {
  echo -e "${BLUE}🔍 Vérification des conventions de nommage...${NC}"
  
  local non_standard_files=$(find "$CDC_DIR" -maxdepth 1 -type f -name "*.md" | 
                           grep -v -E "^${CDC_DIR}/[0-9]{2}-[a-z0-9-]+\.md$" |
                           grep -v -E "^${CDC_DIR}/[0-9]{3}-[a-z0-9-]+\.md$" |
                           grep -v -E "^${CDC_DIR}/[0-9]{2}[a-z]-[a-z0-9-]+\.md$")
  
  if [ -n "$non_standard_files" ]; then
    echo -e "${YELLOW}⚠️ Fichiers avec format non standard détectés:${NC}"
    echo "$non_standard_files" | sed 's/^/  /'
    
    for file in $non_standard_files; do
      local basename=$(basename "$file")
      
      echo -e "${YELLOW}Fichier: $basename${NC}"
      echo -e "${YELLOW}Souhaitez-vous renommer ce fichier? (o/n)${NC}"
      read -p "" -n 1 -r
      echo
      
      if [[ $REPLY =~ ^[Oo]$ ]]; then
        echo -e "${YELLOW}Entrez un numéro de section pour ce fichier (ex: 99):${NC}"
        read -p "" section_num
        
        if [[ ! "$section_num" =~ ^[0-9]+$ ]]; then
          echo -e "${RED}❌ Numéro de section invalide.${NC}"
        else
          # Extraire le nom sans extension et sans numéro de section existant
          local name=$(basename "$file" .md | sed -E 's/^[0-9]+[a-z]?-//')
          local new_name="${CDC_DIR}/${section_num}-${name}.md"
          
          mv "$file" "$new_name"
          echo -e "${GREEN}✓ Fichier renommé: $basename -> $(basename "$new_name")${NC}"
        fi
      fi
    done
  else
    echo -e "${GREEN}✓ Tous les fichiers suivent les conventions de nommage${NC}"
  fi
}

# Fonction principale
main() {
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${BLUE}🛠️ Rectification du cahier des charges${NC}"
  echo -e "${BLUE}==================================================${NC}"
  
  # Créer une sauvegarde avant toute modification
  create_backup
  
  # Exécuter les actions de rectification
  check_naming_conventions
  merge_duplicates
  update_references
  update_journal
  
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${GREEN}✅ Rectification terminée${NC}"
  echo -e "${BLUE}==================================================${NC}"
}

# Exécuter le script
main
