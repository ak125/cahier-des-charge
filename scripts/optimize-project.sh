#!/bin/bash

# Script pour optimiser la structure du projet et nettoyer les fichiers obsolètes
# Usage: ./scripts/optimize-project.sh [--dry-run] [--force]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Options
DRY_RUN=false
FORCE=false

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      echo -e "${YELLOW}⚠️ Mode simulation activé - aucune modification ne sera effectuée${NC}"
      ;;
    --force)
      FORCE=true
      echo -e "${YELLOW}⚠️ Mode force activé - actions appliquées sans confirmation${NC}"
      ;;
  esac
done

# Répertoire de travail
WORKSPACE_DIR="/workspaces/cahier-des-charge"
cd $WORKSPACE_DIR

# Dossiers à exclure systématiquement des analyses
EXCLUDE_DIRS=(
  "node_modules"
  ".git"
  "cahier-des-charges/backups"  # Répertoire de sauvegarde à préserver
)

# Fichiers à préserver même s'ils semblent obsolètes
PRESERVE_FILES=(
  "**/archive-version.js"       # Script de versionnement
  "**/backup_*.tar.gz"          # Fichiers de sauvegarde
  "**/deprecated*.js"           # Fichiers explicitement marqués comme dépréciés mais nécessaires
)

# Configuration spécifique à la structure du cahier des charges
CDC_STRUCTURE=(
  # Format: "prefix:description:standard_format"
  "00-09:Introduction et fondamentaux:XX-name.md"
  "10-29:Phase de préparation:XX-name.md"
  "30-39:Interface utilisateur et outils:XX-name.md"
  "40-49:Configuration technique:XX-name.md"
  "50-59:Validation et qualité:XX-name.md"
  "60-79:Sécurité et déploiement:XX-name.md"
  "80-99:Documentation et suivi:XX-name.md"
  "100-199:Modules fonctionnels avancés:XXX-name.md"
)

# Fichiers requis par section (ne pas signaler comme obsolètes)
CDC_REQUIRED_FILES=(
  "00-sommaire.md"
  "01-introduction.md"
  "38-journal-modifications.md"
)

# Fichiers de la nomenclature 10x qui correspondent à un format spécial
CDC_SPECIAL_FORMAT=(
  "10b-verification-env-test.md"
  "10c-finaliser-profil-monorepo.md"
  "10d-backlog-par-modules.md"
)

# Construction des exclusions pour find
build_find_excludes() {
  local excludes=""
  for dir in "${EXCLUDE_DIRS[@]}"; do
    excludes="$excludes -not -path \"*/$dir/*\""
  done
  echo "$excludes"
}

# Construction des préservations pour grep
build_preserve_patterns() {
  local patterns=""
  for file in "${PRESERVE_FILES[@]}"; do
    if [ -z "$patterns" ]; then
      patterns="$file"
    else
      patterns="$patterns|$file"
    fi
  done
  echo "$patterns"
}

FIND_EXCLUDES=$(build_find_excludes)
PRESERVE_PATTERNS=$(build_preserve_patterns)

# Fonction pour demander confirmation
confirm() {
  if [ "$FORCE" = true ]; then
    return 0
  fi
  
  read -p "Voulez-vous continuer? (o/n): " -n 1 -r
  echo
  [[ $REPLY =~ ^[Oo]$ ]]
}

# Fonction de nettoyage
cleanup() {
  echo -e "${BLUE}🧹 Nettoyage du projet...${NC}"
  
  # 1. Supprimer les fichiers temporaires
  echo -e "${BLUE}Recherche des fichiers temporaires...${NC}"
  
  # Utilisation d'une commande eval pour les exclusions dynamiques
  TEMP_FILES=$(eval "find . -type f \( -name \"*.tmp\" -o -name \"*.bak\" -o -name \"*.log\" \) $FIND_EXCLUDES 2>/dev/null" | 
               grep -v -E "$PRESERVE_PATTERNS" || true)
  
  if [ -n "$TEMP_FILES" ]; then
    echo -e "${YELLOW}Fichiers temporaires trouvés:${NC}"
    echo "$TEMP_FILES"
    
    if [ "$DRY_RUN" = false ]; then
      echo -e "${YELLOW}Ces fichiers seront supprimés. ${NC}"
      if confirm; then
        for file in $TEMP_FILES; do
          echo "Suppression de $file"
          rm -f "$file"
        done
      else
        echo -e "${YELLOW}Suppression annulée par l'utilisateur.${NC}"
      fi
    fi
  else
    echo -e "${GREEN}Aucun fichier temporaire trouvé.${NC}"
  fi
  
  # 2. Nettoyer node_modules si le fichier package.json existe
  if [ -f "package.json" ]; then
    echo -e "${BLUE}Nettoyage des dépendances npm...${NC}"
    
    if [ "$DRY_RUN" = false ]; then
      if confirm; then
        npm prune
      else
        echo -e "${YELLOW}Nettoyage npm annulé par l'utilisateur.${NC}"
      fi
    else
      echo "Simulation: npm prune"
    fi
  fi
  
  # 3. Fichiers potentiellement dupliqués (amélioration de la détection)
  echo -e "${BLUE}Recherche des fichiers potentiellement dupliqués dans le cahier des charges...${NC}"
  
  echo -e "${YELLOW}Note: Ce sont uniquement des fichiers avec la même somme MD5, mais ils peuvent avoir un contenu légitime identique.${NC}"
  echo -e "${YELLOW}Une vérification manuelle est nécessaire avant toute action.${NC}"
  
  # Trouver les fichiers avec le même hash MD5, afficher les premiers octets pour permettre une comparaison rapide
  TMP_DUPES_FILE=$(mktemp)
  find ./cahier-des-charges -type f -name "*.md" -exec md5sum {} \; | sort > $TMP_DUPES_FILE
  
  DUPES=$(cat $TMP_DUPES_FILE | cut -d ' ' -f 1 | uniq -d)
  
  if [ -n "$DUPES" ]; then
    echo -e "${YELLOW}Hashes MD5 dupliqués potentiels:${NC}"
    for hash in $DUPES; do
      echo -e "${YELLOW}Hash: $hash${NC}"
      grep "$hash" $TMP_DUPES_FILE | awk '{print "  " $2}'
      echo ""
    done
    
    echo -e "${YELLOW}⚠️ AUCUNE ACTION AUTOMATIQUE N'EST RECOMMANDÉE - Vérifiez manuellement ces fichiers${NC}"
  else
    echo -e "${GREEN}Aucun fichier dupliqué trouvé.${NC}"
  fi
  
  rm -f $TMP_DUPES_FILE
}

# Fonction de réorganisation améliorée avec logique du cahier des charges
restructure() {
  echo -e "${BLUE}🏗️ Optimisation de la structure du projet...${NC}"
  
  # 1. S'assurer que les répertoires standards existent
  STD_DIRS=("cahier-des-charges" "docs" "scripts" "assets" "assets/images")
  
  for dir in "${STD_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
      echo -e "${YELLOW}Création du répertoire standard manquant: $dir${NC}"
      
      if [ "$DRY_RUN" = false ]; then
        mkdir -p "$dir"
      fi
    fi
  done
  
  # 2. Vérifier si des fichiers Markdown sont en dehors du répertoire approprié
  # Exclusion des fichiers spéciaux qui ont leur place à la racine
  MISPLACED_MDS=$(find . -name "*.md" -not -path "*/cahier-des-charges/*" -not -path "*/docs/*" \
                         -not -path "*/node_modules/*" -not -path "*/.git/*" \
                         -not -name "README.md" -not -name "CHANGELOG.md" -not -name "LICENSE.md")
  
  if [ -n "$MISPLACED_MDS" ]; then
    echo -e "${YELLOW}Fichiers Markdown potentiellement mal placés:${NC}"
    echo "$MISPLACED_MDS"
    
    echo -e "${YELLOW}⚠️ Certains de ces fichiers peuvent avoir une place légitime. Vérifiez avant de déplacer.${NC}"
    
    if [ "$DRY_RUN" = false ] && [ "$FORCE" = false ]; then
      echo -e "${YELLOW}Voulez-vous analyser ces fichiers individuellement? (o/n)${NC}"
      if confirm; then
        for file in $MISPLACED_MDS; do
          echo -e "${YELLOW}Fichier: $file${NC}"
          echo -e "${YELLOW}Déplacer vers docs/? (o/n)${NC}"
          if confirm; then
            filename=$(basename "$file")
            mkdir -p docs
            mv "$file" "docs/$filename"
            echo "• $file -> docs/$filename"
          else
            echo "• Conservé à l'emplacement actuel"
          fi
        done
      fi
    elif [ "$DRY_RUN" = false ] && [ "$FORCE" = true ]; then
      echo -e "${YELLOW}En mode force, aucun déplacement automatique n'est effectué pour éviter de briser la structure.${NC}"
    fi
  else
    echo -e "${GREEN}Tous les fichiers Markdown semblent bien organisés.${NC}"
  fi
  
  # 3. Vérifier la numérotation des fichiers du cahier des charges
  echo -e "${BLUE}Analyse des schémas de numérotation des fichiers du cahier des charges...${NC}"
  
  # Au lieu de signaler uniquement les incohérences, affichons les différents schémas de numérotation
  echo -e "${YELLOW}Différents schémas de numérotation détectés:${NC}"
  
  # Schéma à deux chiffres (standard 01-, 02-, etc.)
  echo -e "${BLUE}Schéma standard (XX-nom.md):${NC}"
  find ./cahier-des-charges -name "[0-9][0-9]-*.md" | sort | head -5 | sed 's/^/  /'
  echo "  ..."
  
  # Schéma à trois chiffres (100-, 101-, etc.)
  echo -e "${BLUE}Schéma à trois chiffres (XXX-nom.md):${NC}"
  find ./cahier-des-charges -name "[0-9][0-9][0-9]-*.md" | sort | head -5 | sed 's/^/  /'
  echo "  ..."
  
  # Autres schémas
  echo -e "${BLUE}Autres schémas:${NC}"
  find ./cahier-des-charges -name "[0-9]*-*.md" -not -name "[0-9][0-9]-*.md" -not -name "[0-9][0-9][0-9]-*.md" | sort | sed 's/^/  /'
  
  echo -e "${YELLOW}Note: Les différents schémas peuvent être intentionnels pour différentes sections.${NC}"
  echo -e "${YELLOW}Aucune action automatique n'est recommandée sans comprendre la logique de numérotation.${NC}"
  
  # Nouvelle section - Vérifier et suggérer des réorganisations basées sur la logique du CDC
  echo -e "${BLUE}Analyse des fichiers spéciaux (format 10x):${NC}"
  SPECIAL_FORMAT_FILES=$(find ./cahier-des-charges -name "10?-*.md")
  
  if [ -n "$SPECIAL_FORMAT_FILES" ]; then
    echo -e "${YELLOW}Fichiers au format spécial 10x:${NC}"
    echo "$SPECIAL_FORMAT_FILES" | sed 's/^/  /'
    
    # Vérifier s'il existe déjà une structure numérique standard (11, 12, etc.)
    STANDARD_FORMAT_EXISTS=$(find ./cahier-des-charges -name "1[1-9]-*.md" | wc -l)
    
    if [ "$STANDARD_FORMAT_EXISTS" -gt 0 ]; then
      echo -e "${YELLOW}Suggestion: Envisager de renommer les fichiers 10x en format standard 1x pour cohérence.${NC}"
      
      if [ "$DRY_RUN" = false ] && [ "$FORCE" = false ]; then
        echo -e "${YELLOW}Voulez-vous voir des suggestions de renommage? (o/n)${NC}"
        if confirm; then
          for file in $SPECIAL_FORMAT_FILES; do
            basename=$(basename "$file")
            # Suggérer un nouveau nom avec numéro séquentiel
            new_name="1$(echo "$basename" | sed 's/10\([a-z]\)/\1/')"
            echo "  $basename → $new_name"
          done
          echo -e "${YELLOW}Note: Renommage manuel recommandé après révision du sommaire.${NC}"
        fi
      fi
    fi
  fi
}

# Fonction pour identifier les fichiers potentiellement obsolètes
find_obsolete() {
  echo -e "${BLUE}🔍 Recherche des fichiers potentiellement obsolètes...${NC}"
  
  # Fichiers non modifiés depuis plus de 90 jours (avec exclusions améliorées)
  OLD_FILES=$(eval "find . -type f $FIND_EXCLUDES -mtime +90 2>/dev/null" | 
              grep -v -E "$PRESERVE_PATTERNS" || true)
  
  if [ -n "$OLD_FILES" ]; then
    echo -e "${YELLOW}Fichiers non modifiés depuis plus de 90 jours:${NC}"
    echo "$OLD_FILES"
    echo -e "${YELLOW}⚠️ Ces fichiers peuvent être légitimement anciens. Aucune action automatique recommandée.${NC}"
  else
    echo -e "${GREEN}Aucun fichier ancien détecté.${NC}"
  fi
  
  # Fichiers avec des noms suggérant qu'ils sont obsolètes, avec exclusion des fichiers à préserver
  echo -e "${BLUE}Recherche de fichiers avec des noms suggérant l'obsolescence...${NC}"
  
  # Exclure les fichiers de sauvegarde du répertoire backups
  OBSOLETE_PATTERN_FILES=$(eval "find . -type f $FIND_EXCLUDES -name \"*old*\" -o -name \"*backup*\" -o -name \"*deprecated*\" -o -name \"*archive*\" 2>/dev/null" | 
                          grep -v -E "$PRESERVE_PATTERNS" | 
                          grep -v "./cahier-des-charges/backups" || true)
  
  if [ -n "$OBSOLETE_PATTERN_FILES" ]; then
    echo -e "${YELLOW}Fichiers potentiellement obsolètes (par convention de nommage):${NC}"
    echo "$OBSOLETE_PATTERN_FILES"
    echo -e "${YELLOW}⚠️ Ces fichiers peuvent être intentionnellement nommés ainsi mais toujours nécessaires.${NC}"
    echo -e "${YELLOW}Examiner manuellement avant toute action.${NC}"
  else
    echo -e "${GREEN}Aucun fichier avec convention de nommage d'obsolescence (hors exceptions).${NC}"
  fi
}

# Fonction pour analyser la complexité du projet
analyze_complexity() {
  echo -e "${BLUE}📊 Analyse de la complexité du projet...${NC}"
  
  # Compter le nombre de fichiers par type
  echo -e "${BLUE}Distribution des fichiers:${NC}"
  echo "  • Fichiers Markdown (*.md): $(find . -name "*.md" | wc -l)"
  echo "  • Scripts shell (*.sh): $(find . -name "*.sh" | wc -l)"
  echo "  • JavaScript (*.js): $(find . -name "*.js" | wc -l)"
  echo "  • TypeScript (*.ts): $(find . -name "*.ts" | wc -l)"
  
  # Taille totale du projet
  echo -e "${BLUE}Taille du projet:${NC}"
  du -sh . | sed 's/\t/ /' | sed 's/^/  /'
  
  # Taille du cahier des charges
  echo -e "${BLUE}Taille du cahier des charges:${NC}"
  du -sh ./cahier-des-charges | sed 's/\t/ /' | sed 's/^/  /'
  
  # Analyse des dépendances npm
  if [ -f "package.json" ]; then
    echo -e "${BLUE}Analyse des dépendances npm:${NC}"
    echo "  • Nombre de dépendances: $(grep -c "\"dependencies\":" package.json)"
    echo "  • Nombre de dépendances de développement: $(grep -c "\"devDependencies\":" package.json)"
  fi
}

# Fonction pour analyser la structure du cahier des charges
analyze_cdc_structure() {
  echo -e "${BLUE}📚 Analyse de la structure du cahier des charges...${NC}"
  
  # Vérifier si le sommaire existe
  if [ -f "./cahier-des-charges/00-sommaire.md" ]; then
    echo -e "${GREEN}✓ Sommaire trouvé${NC}"
  else
    echo -e "${YELLOW}⚠️ Sommaire manquant (00-sommaire.md)${NC}"
  fi
  
  # Analyser la répartition des fichiers par section
  echo -e "${BLUE}Répartition des fichiers par section:${NC}"
  
  for section_info in "${CDC_STRUCTURE[@]}"; do
    IFS=':' read -r range description format <<< "$section_info"
    
    # Extraire les limites de la plage
    IFS='-' read -r lower_limit upper_limit <<< "$range"
    
    # Compter les fichiers dans cette section
    if [[ "$format" == "XX-name.md" ]]; then
      section_files=$(find ./cahier-des-charges -name "[${lower_limit:0:1}][${lower_limit:1}]-*.md" -o -name "[${upper_limit:0:1}][${upper_limit:1}]-*.md" | wc -l)
    else
      section_files=$(find ./cahier-des-charges -name "${lower_limit}-*.md" -o -name "${upper_limit}-*.md" | wc -l)
    fi
    
    echo -e "  • ${BLUE}$description${NC} ($range): $section_files fichiers"
  done
  
  # Détecter les fichiers qui ne correspondent à aucune section
  echo -e "${BLUE}Recherche de fichiers hors nomenclature standard:${NC}"
  
  # Construire un pattern regex pour exclure les formats spéciaux connus
  special_pattern=""
  for file in "${CDC_SPECIAL_FORMAT[@]}"; do
    if [ -z "$special_pattern" ]; then
      special_pattern="$file"
    else
      special_pattern="$special_pattern|$file"
    fi
  done
  
  # Trouver les fichiers avec des formats non standard
  nonstandard_files=$(find ./cahier-des-charges -name "*.md" | 
                     grep -v -E "([0-9]{2}|[0-9]{3})-[a-z].*\.md" | 
                     grep -v -E "$special_pattern" || true)
  
  if [ -n "$nonstandard_files" ]; then
    echo -e "${YELLOW}Fichiers avec format non standard:${NC}"
    echo "$nonstandard_files" | sed 's/^/  /'
  else
    echo -e "${GREEN}✓ Tous les fichiers suivent les formats de nomenclature standard${NC}"
  fi
}

# Fonction pour vérifier la cohérence des références entre fichiers
check_references() {
  echo -e "${BLUE}🔗 Vérification des références entre les fichiers...${NC}"
  
  # Rechercher les liens internes markdown qui pourraient être brisés
  broken_refs=0
  
  for file in $(find ./cahier-des-charges -name "*.md"); do
    # Extraire les références aux autres fichiers du cahier des charges
    refs=$(grep -o -E "\[[^\]]+\]\(([^)]+\.md)\)" "$file" | grep -o -E "\([^)]+\.md\)" | tr -d '()' || true)
    
    for ref in $refs; do
      # Vérifier si la référence pointe vers un fichier existant
      if [[ "$ref" == /* ]]; then
        # Chemin absolu
        if [ ! -f "./$ref" ]; then
          echo -e "${YELLOW}⚠️ Lien brisé dans $file: $ref${NC}"
          ((broken_refs++))
        fi
      else
        # Chemin relatif
        dir=$(dirname "$file")
        if [ ! -f "$dir/$ref" ]; then
          echo -e "${YELLOW}⚠️ Lien brisé dans $file: $ref${NC}"
          ((broken_refs++))
        fi
      fi
    done
  done
  
  if [ $broken_refs -eq 0 ]; then
    echo -e "${GREEN}✓ Aucun lien brisé détecté${NC}"
  else
    echo -e "${YELLOW}⚠️ $broken_refs liens brisés détectés${NC}"
  fi
}

# Fonction pour suggérer des améliorations basées sur la structure
suggest_cdc_improvements() {
  echo -e "${BLUE}💡 Suggestions d'amélioration du cahier des charges:${NC}"
  
  # Vérifier si certaines sections semblent sous-documentées
  for section_info in "${CDC_STRUCTURE[@]}"; do
    IFS=':' read -r range description format <<< "$section_info"
    IFS='-' read -r lower_limit upper_limit <<< "$range"
    
    # Compter les fichiers dans cette section
    if [[ "$format" == "XX-name.md" ]]; then
      section_files=$(find ./cahier-des-charges -name "[${lower_limit:0:1}][${lower_limit:1}]-*.md" -o -name "[${upper_limit:0:1}][${upper_limit:1}]-*.md" | wc -l)
    else
      section_files=$(find ./cahier-des-charges -name "${lower_limit}-*.md" -o -name "${upper_limit}-*.md" | wc -l)
    fi
    
    if [ "$section_files" -le 1 ]; then
      echo -e "  • La section ${YELLOW}$description${NC} ($range) semble peu documentée ($section_files fichiers)"
    fi
  done
  
  # Vérifier la présence de la documentation pour chaque partie du processus de migration
  key_topics=("préparation" "migration" "validation" "déploiement" "suivi")
  for topic in "${key_topics[@]}"; do
    topic_coverage=$(grep -l -i "$topic" ./cahier-des-charges/*.md | wc -l)
    if [ "$topic_coverage" -le 2 ]; then
      echo -e "  • Le sujet '${YELLOW}$topic${NC}' pourrait bénéficier d'une documentation plus complète"
    fi
  done
  
  # Vérifier la structure des fichiers récemment modifiés
  recent_files=$(find ./cahier-des-charges -name "*.md" -mtime -14 | wc -l)
  echo -e "  • ${BLUE}$recent_files${NC} fichiers ont été modifiés dans les 14 derniers jours"
  
  # Suggestion sur la numérotation et l'organisation
  echo -e "  • Envisager de réorganiser les fichiers avec numérotation '10x' dans la section standard 10-19"
}

# Fonction principale
main() {
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${BLUE}📊 Optimisation de la structure et nettoyage du projet${NC}"
  echo -e "${BLUE}==================================================${NC}"
  
  cleanup
  echo
  restructure
  echo
  find_obsolete
  echo
  analyze_complexity
  echo
  analyze_cdc_structure
  echo
  check_references
  echo
  suggest_cdc_improvements
  
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${GREEN}✅ Analyse terminée${NC}"
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Pour appliquer les modifications, relancez sans l'option --dry-run${NC}"
  fi
  
  echo -e "${BLUE}==================================================${NC}"
}

# Exécution
main
