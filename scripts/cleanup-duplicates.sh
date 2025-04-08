#!/bin/bash

# Script pour la détection et suppression sécurisée des fichiers dupliqués
# en particulier dans le contexte d'un cahier des charges évolutif
#
# Usage: ./scripts/cleanup-duplicates.sh [--dry-run] [--interactive] [--auto-backup]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Options
DRY_RUN=false
INTERACTIVE=true
AUTO_BACKUP=true
THRESHOLD=95 # Pourcentage de similarité pour considérer des fichiers comme dupliqués

# Traitement des arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      echo -e "${YELLOW}⚠️ Mode simulation activé - aucune modification ne sera effectuée${NC}"
      ;;
    --non-interactive)
      INTERACTIVE=false
      echo -e "${YELLOW}⚠️ Mode non-interactif activé - utilisation des valeurs par défaut${NC}"
      ;;
    --no-backup)
      AUTO_BACKUP=false
      echo -e "${YELLOW}⚠️ Sauvegarde automatique désactivée${NC}"
      ;;
    --threshold=*)
      THRESHOLD="${arg#*=}"
      if ! [[ "$THRESHOLD" =~ ^[0-9]+$ ]] || [ "$THRESHOLD" -lt 1 ] || [ "$THRESHOLD" -gt 100 ]; then
        echo -e "${RED}❌ Seuil de similarité invalide. Utilisation de la valeur par défaut (95%).${NC}"
        THRESHOLD=95
      fi
      echo -e "${BLUE}ℹ️ Seuil de similarité défini à ${THRESHOLD}%${NC}"
      ;;
  esac
done

# Répertoire de travail
WORKSPACE_DIR="/workspaces/cahier-des-charge"
CDC_DIR="${WORKSPACE_DIR}/cahier-des-charges"
cd "$WORKSPACE_DIR"

# Vérification des dépendances
check_dependencies() {
  local missing_deps=false
  
  for cmd in diff wc awk sed grep md5sum; do
    if ! command -v "$cmd" &> /dev/null; then
      echo -e "${RED}❌ Commande requise non trouvée: $cmd${NC}"
      missing_deps=true
    fi
  done
  
  if [ "$missing_deps" = true ]; then
    echo -e "${RED}❌ Veuillez installer les dépendances manquantes avant de continuer.${NC}"
    exit 1
  fi
}

# Créer un répertoire de sauvegarde daté
create_backup_dir() {
  local backup_date=$(date +"%Y%m%d_%H%M%S")
  local backup_dir="${WORKSPACE_DIR}/cahier-des-charges/backups/backup_${backup_date}"
  
  mkdir -p "$backup_dir"
  echo "$backup_dir"
}

# Fonction pour créer une sauvegarde avant toute opération
backup_files() {
  if [ "$AUTO_BACKUP" = true ]; then
    echo -e "${BLUE}📦 Création d'une sauvegarde de sécurité...${NC}"
    
    local backup_dir=$(create_backup_dir)
    local backup_archive="${backup_dir}.tar.gz"
    
    # Créer une archive de tous les fichiers markdown du cahier des charges
    tar -czf "$backup_archive" -C "$WORKSPACE_DIR" cahier-des-charges/*.md
    
    echo -e "${GREEN}✅ Sauvegarde créée: $backup_archive${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️ Sauvegarde automatique désactivée. Aucune sauvegarde effectuée.${NC}"
    
    if [ "$INTERACTIVE" = true ]; then
      echo -e "${YELLOW}Voulez-vous continuer sans sauvegarde? (o/n)${NC}"
      read -p "" -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        echo -e "${RED}❌ Opération annulée par l'utilisateur.${NC}"
        exit 0
      fi
    fi
    
    return 0
  fi
}

# Analyse le contenu de deux fichiers pour déterminer leur similarité
compare_file_content() {
  local file1="$1"
  local file2="$2"
  
  # Comparer les tailles de fichier
  local size1=$(wc -c < "$file1")
  local size2=$(wc -c < "$file2")
  
  # Si les tailles sont très différentes, les fichiers ne sont probablement pas des doublons
  local size_ratio=$(( (size1 * 100) / (size2 + 1) ))
  if [ "$size_ratio" -lt 80 ] || [ "$size_ratio" -gt 120 ]; then
    echo "0" # 0% de similarité
    return
  fi
  
  # Comparer le contenu ligne par ligne
  local diff_lines=$(diff -y --suppress-common-lines "$file1" "$file2" | wc -l)
  local total_lines=$(wc -l < "$file1")
  
  # Calculer la similarité en pourcentage
  if [ "$total_lines" -eq 0 ]; then
    # Si un fichier est vide
    if [ "$size2" -eq 0 ]; then
      echo "100" # 100% de similarité (deux fichiers vides)
    else
      echo "0" # 0% de similarité (un fichier vide, l'autre non)
    fi
  else
    local different_percent=$(( (diff_lines * 100) / (total_lines + 1) ))
    local similarity=$((100 - different_percent))
    echo "$similarity"
  fi
}

# Affiche une comparaison visuelle des deux fichiers
display_comparison() {
  local file1="$1"
  local file2="$2"
  local similarity="$3"
  
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${BLUE}Comparaison des fichiers potentiellement dupliqués${NC}"
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${CYAN}Fichier 1:${NC} $file1"
  echo -e "${CYAN}Fichier 2:${NC} $file2"
  echo -e "${CYAN}Similarité:${NC} ${similarity}%"
  echo
  
  # Afficher les en-têtes (premières lignes) des deux fichiers
  echo -e "${CYAN}En-tête du fichier 1:${NC}"
  head -n 5 "$file1"
  echo -e "${YELLOW}...${NC}"
  echo
  
  echo -e "${CYAN}En-tête du fichier 2:${NC}"
  head -n 5 "$file2"
  echo -e "${YELLOW}...${NC}"
  echo
  
  # Afficher les différences principales
  echo -e "${CYAN}Principales différences:${NC}"
  diff --color=always -u "$file1" "$file2" | head -n 20
  
  if [ "$(diff -u "$file1" "$file2" | wc -l)" -gt 20 ]; then
    echo -e "${YELLOW}... (plus de différences) ...${NC}"
  fi
  
  echo -e "${BLUE}==================================================${NC}"
}

# Fonction pour détecter et traiter les fichiers dupliqués
detect_duplicates() {
  echo -e "${BLUE}🔍 Recherche des fichiers potentiellement dupliqués...${NC}"
  
  # Créer un fichier temporaire pour stocker les empreintes MD5
  local tmp_md5_file=$(mktemp)
  
  # Calculer les empreintes MD5 pour tous les fichiers markdown du cahier des charges
  find "$CDC_DIR" -type f -name "*.md" -exec md5sum {} \; | sort > "$tmp_md5_file"
  
  # Rechercher les doublons basés sur l'empreinte MD5
  local duplicates=$(cat "$tmp_md5_file" | cut -d ' ' -f 1 | sort | uniq -d)
  
  if [ -z "$duplicates" ]; then
    echo -e "${GREEN}✅ Aucun fichier dupliqué détecté par empreinte MD5.${NC}"
    rm "$tmp_md5_file"
    return 0
  fi
  
  echo -e "${YELLOW}⚠️ Fichiers potentiellement dupliqués détectés (même empreinte MD5):${NC}"
  
  # Parcourir les empreintes MD5 dupliquées
  for md5 in $duplicates; do
    echo -e "${PURPLE}Groupe de fichiers avec empreinte ${md5}:${NC}"
    
    # Obtenir la liste des fichiers avec cette empreinte MD5
    local md5_files=($(grep "$md5" "$tmp_md5_file" | awk '{print $2}'))
    
    # Afficher les fichiers
    for ((i=0; i<${#md5_files[@]}; i++)); do
      echo -e "  ${CYAN}[$i]${NC} ${md5_files[$i]}"
    done
    
    echo
    
    # Pour chaque paire de fichiers, effectuer une analyse plus approfondie
    for ((i=0; i<${#md5_files[@]}-1; i++)); do
      for ((j=i+1; j<${#md5_files[@]}; j++)); do
        local file1="${md5_files[$i]}"
        local file2="${md5_files[$j]}"
        
        # Vérifier si les noms de fichier indiquent une relation spécifique
        # Par exemple, si l'un est une version numérotée de l'autre
        if [[ "$(basename "$file1" .md)" =~ ^[0-9]+-(.*)$ ]] && 
           [[ "$(basename "$file2" .md)" =~ ^[0-9]+-(.*)$ ]]; then
          local base_name1="${BASH_REMATCH[1]}"
          local base_name2="${BASH_REMATCH[1]}"
          
          # Si les fichiers ont des bases similaires mais des numéros différents,
          # ils pourraient être des versions différentes du même document
          if [ "$base_name1" = "$base_name2" ]; then
            echo -e "${YELLOW}⚠️ Ces fichiers semblent être des versions numérotées du même document.${NC}"
            echo -e "${YELLOW}   Il est recommandé de les conserver tous les deux.${NC}"
            continue
          fi
        fi
        
        # Analyser la similarité du contenu
        local similarity=$(compare_file_content "$file1" "$file2")
        
        # Si la similarité est inférieure au seuil, ce ne sont probablement pas des doublons réels
        if [ "$similarity" -lt "$THRESHOLD" ]; then
          echo -e "${GREEN}✓ Similarité ${similarity}% entre [$i] et [$j] - Probablement pas des doublons réels${NC}"
          continue
        fi
        
        echo -e "${YELLOW}⚠️ Forte similarité (${similarity}%) entre [$i] et [$j]${NC}"
        
        if [ "$INTERACTIVE" = true ]; then
          # Afficher une comparaison visuelle
          display_comparison "$file1" "$file2" "$similarity"
          
          # Demander quelle action effectuer
          echo -e "${YELLOW}Que souhaitez-vous faire?${NC}"
          echo -e "  ${CYAN}[1]${NC} Conserver les deux fichiers"
          echo -e "  ${CYAN}[2]${NC} Supprimer le fichier [$i]: $(basename "$file1")"
          echo -e "  ${CYAN}[3]${NC} Supprimer le fichier [$j]: $(basename "$file2")"
          echo -e "  ${CYAN}[4]${NC} Fusionner les fichiers (conserver les différences)"
          echo -e "  ${CYAN}[q]${NC} Quitter l'analyse"
          
          read -p "Votre choix: " -n 1 -r
          echo
          
          case $REPLY in
            1)
              echo -e "${GREEN}✓ Les deux fichiers seront conservés.${NC}"
              ;;
            2)
              if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}(Simulation) Suppression de: $file1${NC}"
              else
                echo -e "${RED}🗑️ Suppression de: $file1${NC}"
                rm "$file1"
              fi
              ;;
            3)
              if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}(Simulation) Suppression de: $file2${NC}"
              else
                echo -e "${RED}🗑️ Suppression de: $file2${NC}"
                rm "$file2"
              fi
              ;;
            4)
              if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}(Simulation) Fusion des fichiers en: ${file1}.merged${NC}"
              else
                echo -e "${BLUE}🔄 Fusion des fichiers en: ${file1}.merged${NC}"
                # Utiliser diff3 pour fusionner les fichiers
                diff3 -m "$file1" "$file2" > "${file1}.merged"
                echo -e "${GREEN}✓ Fusion terminée. Vérifiez ${file1}.merged avant de remplacer les originaux.${NC}"
              fi
              ;;
            q|Q)
              echo -e "${YELLOW}⚠️ Analyse interrompue par l'utilisateur.${NC}"
              rm "$tmp_md5_file"
              return 0
              ;;
            *)
              echo -e "${YELLOW}⚠️ Choix non reconnu. Aucune action effectuée.${NC}"
              ;;
          esac
        else
          # En mode non-interactif, juste signaler les doublons potentiels
          echo -e "${YELLOW}⚠️ Fichiers potentiellement dupliqués détectés: $file1 et $file2 (similarité: ${similarity}%)${NC}"
        fi
        
        echo
      done
    done
  done
  
  rm "$tmp_md5_file"
}

# Fonction pour détecter et traiter les fichiers obsolètes ou mal nommés
detect_anomalies() {
  echo -e "${BLUE}🔍 Recherche d'anomalies dans les fichiers du cahier des charges...${NC}"
  
  # 1. Fichiers sans numéro de section
  local unnumbered_files=$(find "$CDC_DIR" -maxdepth 1 -type f -name "*.md" -not -name "[0-9]*-*.md")
  
  if [ -n "$unnumbered_files" ]; then
    echo -e "${YELLOW}⚠️ Fichiers sans numéro de section:${NC}"
    echo "$unnumbered_files" | sed 's/^/  /'
    
    if [ "$INTERACTIVE" = true ]; then
      echo -e "${YELLOW}Voulez-vous examiner ces fichiers pour décider de leur sort? (o/n)${NC}"
      read -p "" -n 1 -r
      echo
      
      if [[ $REPLY =~ ^[Oo]$ ]]; then
        for file in $unnumbered_files; do
          echo -e "${CYAN}Fichier:${NC} $file"
          echo -e "${CYAN}Contenu:${NC}"
          head -n 10 "$file"
          echo -e "${YELLOW}...${NC}"
          
          echo -e "${YELLOW}Que souhaitez-vous faire?${NC}"
          echo -e "  ${CYAN}[1]${NC} Conserver le fichier"
          echo -e "  ${CYAN}[2]${NC} Supprimer le fichier"
          echo -e "  ${CYAN}[3]${NC} Renommer le fichier avec un numéro de section"
          echo -e "  ${CYAN}[q]${NC} Passer au suivant"
          
          read -p "Votre choix: " -n 1 -r
          echo
          
          case $REPLY in
            1)
              echo -e "${GREEN}✓ Le fichier sera conservé.${NC}"
              ;;
            2)
              if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}(Simulation) Suppression de: $file${NC}"
              else
                echo -e "${RED}🗑️ Suppression de: $file${NC}"
                rm "$file"
              fi
              ;;
            3)
              echo -e "${YELLOW}Entrez un numéro de section pour ce fichier (ex: 99):${NC}"
              read -p "" section_num
              
              if [[ ! "$section_num" =~ ^[0-9]+$ ]]; then
                echo -e "${RED}❌ Numéro de section invalide.${NC}"
              else
                local basename=$(basename "$file" .md)
                local new_name="${CDC_DIR}/${section_num}-${basename}.md"
                
                if [ "$DRY_RUN" = true ]; then
                  echo -e "${YELLOW}(Simulation) Renommage: $file -> $new_name${NC}"
                else
                  echo -e "${BLUE}🔄 Renommage: $file -> $new_name${NC}"
                  mv "$file" "$new_name"
                fi
              fi
              ;;
            q|Q)
              echo -e "${YELLOW}Passage au fichier suivant.${NC}"
              ;;
            *)
              echo -e "${YELLOW}⚠️ Choix non reconnu. Aucune action effectuée.${NC}"
              ;;
          esac
          
          echo
        done
      fi
    fi
  else
    echo -e "${GREEN}✅ Tous les fichiers markdown ont un numéro de section.${NC}"
  fi
  
  # 2. Fichiers vides ou presque vides
  local empty_threshold=50 # caractères
  local empty_files=$(find "$CDC_DIR" -maxdepth 1 -type f -name "*.md" -size -${empty_threshold}c)
  
  if [ -n "$empty_files" ]; then
    echo -e "${YELLOW}⚠️ Fichiers vides ou presque vides (<${empty_threshold} caractères):${NC}"
    
    for file in $empty_files; do
      local size=$(wc -c < "$file")
      echo -e "  ${file} (${size} caractères)"
      
      if [ "$INTERACTIVE" = true ]; then
        echo -e "${YELLOW}Voulez-vous supprimer ce fichier vide? (o/n)${NC}"
        read -p "" -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Oo]$ ]]; then
          if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}(Simulation) Suppression de fichier vide: $file${NC}"
          else
            echo -e "${RED}🗑️ Suppression de fichier vide: $file${NC}"
            rm "$file"
          fi
        else
          echo -e "${GREEN}✓ Le fichier sera conservé.${NC}"
        fi
      fi
    done
  else
    echo -e "${GREEN}✅ Aucun fichier vide détecté.${NC}"
  fi
}

# Fonction principale
main() {
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${BLUE}🧹 Nettoyage sécurisé du cahier des charges${NC}"
  echo -e "${BLUE}==================================================${NC}"
  
  # Vérifier les dépendances
  check_dependencies
  
  # Créer une sauvegarde avant toute opération
  backup_files
  
  # Détecter et traiter les fichiers dupliqués
  detect_duplicates
  
  # Détecter et traiter les anomalies
  detect_anomalies
  
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${GREEN}✅ Analyse et nettoyage terminés${NC}"
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Aucune modification n'a été appliquée (mode simulation).${NC}"
    echo -e "${YELLOW}Relancez sans --dry-run pour appliquer les modifications.${NC}"
  fi
  
  echo -e "${BLUE}==================================================${NC}"
}

# Exécuter le script
main
