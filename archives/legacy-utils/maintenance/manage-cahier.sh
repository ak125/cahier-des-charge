#!/bin/bash

# Menu interactif pour la gestion du cahier des charges
# Remplace manage-cahier.ts en version shell pour une meilleure compatibilité

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Fonction pour afficher la bannière
show_banner() {
  echo -e "${BLUE}${BOLD}"
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║                                                          ║"
  echo "║   🚀 Gestion du Cahier des Charges - Migration IA        ║"
  echo "║        PHP → NestJS/Remix - Codespaces CLI               ║"
  echo "║                                                          ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Fonction pour journaliser les actions
log_action() {
  local action="$1"
  local script="$2"
  local duration="$3"
  
  # Créer le répertoire de logs si nécessaire
  mkdir -p ./logs
  
  # Ajouter l'entrée au journal
  echo "$(date +'%Y-%m-%d %H:%M:%S') | $action | $script | ${duration}s" >> ./logs/cahier_menu.log
  
  echo -e "${GREEN}✅ Action enregistrée dans le journal${NC}"
}

# Fonction pour afficher le menu et obtenir le choix de l'utilisateur
show_menu() {
  clear
  show_banner
  
  echo -e "${CYAN}Choisissez une action :${NC}"
  echo ""
  echo -e "${BLUE}1️⃣  Mettre à jour le cahier des charges${NC} (update-cahier.sh)"
  echo -e "${BLUE}2️⃣  Vérifier la cohérence (structure, syntaxe, logique)${NC} (verify-cahier.sh)"
  echo -e "${BLUE}3️⃣  Supprimer les fichiers dupliqués (.md, .json, .ts)${NC} (deduplicate-files.sh)"
  echo -e "${BLUE}4️⃣  Analyser la similarité conceptuelle entre fichiers${NC} (analyze-similarity.sh)"
  echo -e "${BLUE}5️⃣  Générer la vue HTML interactive du cahier${NC} (render-html.sh)"
  echo -e "${BLUE}6️⃣  Lancer tous les scripts en mode dry run${NC} (dry-run-all.sh)"
  echo -e "${BLUE}7️⃣  Exporter vers GitHub (commit et PR)${NC} (export-to-github.sh)"
  echo -e "${BLUE}8️⃣  Générer les plans de migration${NC} (batch-generate-migration-plans.sh)"
  echo -e "${BLUE}9️⃣  Réorganiser la structure du projet${NC} (reorganize-project.sh)"
  echo -e "${BLUE}🔟 Lancer la migration progressive${NC} (run-progressive-migration.sh)"
  echo -e "${BLUE}1️⃣1️⃣ Gérer les fichiers (création/suppression)${NC}"
  echo -e "${BLUE}1️⃣2️⃣ Configuration du système${NC}"
  echo -e "${RED}0️⃣  Quitter${NC}"
  echo ""
  
  read -p "Votre choix [0-12] : " choice
  
  return "$choice"
}

# Fonction pour exécuter un script
run_script() {
  local script="$1"
  local description="$2"
  local dry_run="$3"
  
  # Vérifier si le script existe
  if [ ! -f "./scripts/$script" ]; then
    echo -e "${RED}❌ Script non trouvé : $script${NC}"
    read -p "Appuyez sur Entrée pour continuer..." dummy
    return 1
  fi
  
  # Rendre le script exécutable si nécessaire
  if [ ! -x "./scripts/$script" ]; then
    chmod +x "./scripts/$script"
  fi
  
  clear
  echo -e "${BLUE}${BOLD}Exécution de $description${NC}"
  echo -e "${CYAN}==============================================${NC}"
  
  # Mesurer le temps d'exécution
  local start_time=$(date +%s)
  
  # Exécuter le script
  if [ "$dry_run" = "true" ]; then
    ./scripts/$script --dry-run
    exit_code=$?
  else
    ./scripts/$script
    exit_code=$?
  fi
  
  # Calculer la durée
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # Journaliser l'action
  log_action "execute" "$script" "$duration"
  
  echo ""
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ $description terminé avec succès en ${duration}s${NC}"
  else
    echo -e "${RED}❌ $description a échoué (code: $exit_code) en ${duration}s${NC}"
  fi
  
  echo ""
  read -p "Appuyez sur Entrée pour continuer..." dummy
  
  return $exit_code
}

# Fonction pour créer ou modifier des fichiers
manage_files() {
  clear
  echo -e "${BLUE}${BOLD}Gestion des fichiers${NC}"
  echo -e "${CYAN}==============================================${NC}"
  
  echo -e "${CYAN}Choisissez une action :${NC}"
  echo ""
  echo -e "${BLUE}1. Créer un nouveau fichier .audit.md${NC}"
  echo -e "${BLUE}2. Créer un nouveau fichier .backlog.json${NC}"
  echo -e "${BLUE}3. Créer un nouveau fichier .impact_graph.json${NC}"
  echo -e "${BLUE}4. Supprimer un fichier existant${NC}"
  echo -e "${BLUE}5. Revenir au menu principal${NC}"
  echo ""
  
  read -p "Votre choix [1-5] : " file_choice
  
  case $file_choice in
    1)
      read -p "Nom du fichier (sans extension) : " filename
      read -p "Description du rôle métier : " role
      
      # Créer le fichier
      mkdir -p ./cahier
      
      cat > "./cahier/${filename}.audit.md" << EOL
# Audit IA - ${filename}

## 1️⃣ Rôle métier principal

${role}

## 2️⃣ Points d'entrée / déclenchement

À compléter...

## 3️⃣ Zone fonctionnelle détectée

À compléter...

## 4️⃣ Structure du code

À compléter...

## 1️⃣6️⃣ Migration vers NestJS/Remix

À compléter...
EOL
      
      echo -e "${GREEN}✅ Fichier ${filename}.audit.md créé dans ./cahier/${NC}"
      ;;
    
    2)
      read -p "Nom du fichier (sans extension) : " filename
      
      # Créer le fichier
      mkdir -p ./cahier
      
      cat > "./cahier/${filename}.backlog.json" << EOL
{
  "file": "${filename}",
  "priority": 5,
  "status": "to-do",
  "tasks": [
    {
      "type": "analyze",
      "target": "backend",
      "status": "pending",
      "description": "Analyser la structure du fichier"
    },
    {
      "type": "migrate",
      "target": "backend",
      "status": "pending",
      "description": "Migrer le code vers NestJS"
    }
  ]
}
EOL
      
      echo -e "${GREEN}✅ Fichier ${filename}.backlog.json créé dans ./cahier/${NC}"
      ;;
    
    3)
      read -p "Nom du fichier (sans extension) : " filename
      
      # Créer le fichier
      mkdir -p ./cahier
      
      cat > "./cahier/${filename}.impact_graph.json" << EOL
{
  "nodes": [
    "${filename}",
    "autre-fichier-1",
    "autre-fichier-2"
  ],
  "edges": [
    ["${filename}", "autre-fichier-1"],
    ["${filename}", "autre-fichier-2"]
  ]
}
EOL
      
      echo -e "${GREEN}✅ Fichier ${filename}.impact_graph.json créé dans ./cahier/${NC}"
      ;;
    
    4)
      # Lister les fichiers disponibles
      echo -e "${BLUE}Fichiers disponibles dans ./cahier/${NC}"
      
      if [ -d "./cahier" ]; then
        ls -la ./cahier
      else
        echo -e "${YELLOW}⚠️ Le répertoire ./cahier n'existe pas${NC}"
      fi
      
      echo ""
      read -p "Nom du fichier à supprimer (chemin complet) : " file_to_delete
      
      if [ -f "$file_to_delete" ]; then
        rm "$file_to_delete"
        echo -e "${GREEN}✅ Fichier $file_to_delete supprimé${NC}"
      else
        echo -e "${RED}❌ Fichier non trouvé : $file_to_delete${NC}"
      fi
      ;;
    
    5|*)
      # Rien à faire, retour au menu principal
      ;;
  esac
  
  read -p "Appuyez sur Entrée pour continuer..." dummy
}

# Fonction pour gérer la configuration
manage_config() {
  clear
  echo -e "${BLUE}${BOLD}Configuration du système${NC}"
  echo -e "${CYAN}==============================================${NC}"
  
  # Vérifier si le fichier de configuration existe
  if [ -f "./cahier_check.config.json" ]; then
    echo -e "${BLUE}Configuration actuelle :${NC}"
    cat "./cahier_check.config.json"
  else
    echo -e "${YELLOW}⚠️ Le fichier de configuration n'existe pas${NC}"
  fi
  
  echo ""
  echo -e "${CYAN}Choisissez une action :${NC}"
  echo ""
  echo -e "${BLUE}1. Créer/Remplacer la configuration par défaut${NC}"
  echo -e "${BLUE}2. Modifier le seuil de similarité${NC}"
  echo -e "${BLUE}3. Modifier les chemins (cahier, logs, etc.)${NC}"
  echo -e "${BLUE}4. Revenir au menu principal${NC}"
  echo ""
  
  read -p "Votre choix [1-4] : " config_choice
  
  case $config_choice in
    1)
      # Créer/Remplacer la configuration par défaut
      cat > "./cahier_check.config.json" << EOL
{
  "paths": {
    "cahier": "./cahier/",
    "scripts": "./scripts/",
    "logs": "./logs/",
    "htmlOutput": "./dist/cahier.html"
  },
  "rules": {
    "maxDuplicateThreshold": 0.85,
    "minStructureScore": 75,
    "allowInlineJS": false,
    "requireAuditMd": true
  },
  "github": {
    "owner": "votre-org",
    "repo": "remix-nestjs-monorepo",
    "branch": "main",
    "autoPR": true
  }
}
EOL
      
      echo -e "${GREEN}✅ Configuration par défaut créée/remplacée${NC}"
      ;;
    
    2)
      read -p "Nouveau seuil de similarité (0.0-1.0) : " threshold
      
      # Vérifier si le fichier existe
      if [ -f "./cahier_check.config.json" ]; then
        # Modifier le seuil
        sed -i "s/\"maxDuplicateThreshold\":[^,]*/\"maxDuplicateThreshold\": $threshold/" "./cahier_check.config.json"
        echo -e "${GREEN}✅ Seuil de similarité mis à jour${NC}"
      else
        echo -e "${RED}❌ Le fichier de configuration n'existe pas${NC}"
      fi
      ;;
    
    3)
      read -p "Chemin du répertoire cahier (défaut: ./cahier/) : " cahier_path
      read -p "Chemin des logs (défaut: ./logs/) : " logs_path
      read -p "Chemin du fichier HTML généré (défaut: ./dist/cahier.html) : " html_path
      
      # Vérifier si le fichier existe
      if [ -f "./cahier_check.config.json" ]; then
        # Modifier les chemins
        if [ ! -z "$cahier_path" ]; then
          sed -i "s|\"cahier\":[^,]*|\"cahier\": \"$cahier_path\"|" "./cahier_check.config.json"
        fi
        
        if [ ! -z "$logs_path" ]; then
          sed -i "s|\"logs\":[^,]*|\"logs\": \"$logs_path\"|" "./cahier_check.config.json"
        fi
        
        if [ ! -z "$html_path" ]; then
          sed -i "s|\"htmlOutput\":[^,]*|\"htmlOutput\": \"$html_path\"|" "./cahier_check.config.json"
        fi
        
        echo -e "${GREEN}✅ Chemins mis à jour${NC}"
      else
        echo -e "${RED}❌ Le fichier de configuration n'existe pas${NC}"
      fi
      ;;
    
    4|*)
      # Rien à faire, retour au menu principal
      ;;
  esac
  
  read -p "Appuyez sur Entrée pour continuer..." dummy
}

# Fonction pour ouvrir le dernier rapport
open_last_report() {
  # Trouver le dernier rapport généré
  local last_report=""
  
  if [ -d "./logs" ]; then
    last_report=$(ls -t ./logs/verification-*.md 2>/dev/null | head -n 1)
    
    if [ -z "$last_report" ]; then
      last_report=$(ls -t ./logs/dry-run-report-*.md 2>/dev/null | head -n 1)
    fi
  fi
  
  if [ -z "$last_report" ]; then
    echo -e "${RED}❌ Aucun rapport trouvé${NC}"
    read -p "Appuyez sur Entrée pour continuer..." dummy
    return 1
  fi
  
  clear
  echo -e "${BLUE}${BOLD}Dernier rapport généré : $(basename "$last_report")${NC}"
  echo -e "${CYAN}==============================================${NC}"
  echo ""
  
  cat "$last_report"
  
  echo ""
  read -p "Appuyez sur Entrée pour revenir au menu..." dummy
}

# Fonction pour exécuter la migration progressive
run_progressive_migration() {
  clear
  echo -e "${BLUE}${BOLD}Migration Progressive PHP → NestJS/Remix${NC}"
  echo -e "${CYAN}==============================================${NC}"
  
  echo -e "Cette fonctionnalité vous permet de migrer progressivement un fichier PHP"
  echo -e "vers NestJS/Remix tout en maintenant les deux versions en parallèle."
  echo -e ""
  echo -e "${YELLOW}Choisissez une option :${NC}"
  echo -e ""
  echo -e "${BLUE}1. Analyser un fichier PHP${NC} (génère les configurations de proxy)"
  echo -e "${BLUE}2. Générer tous les artefacts de migration${NC} (analyse complète)"
  echo -e "${BLUE}3. Revenir au menu principal${NC}"
  echo -e ""
  
  read -p "Votre choix [1-3] : " migration_choice
  
  case $migration_choice in
    1)
      read -p "Chemin du fichier PHP à analyser : " php_file
      
      if [ -f "$php_file" ]; then
        ./run-progressive-migration.sh "$php_file"
      else
        echo -e "${RED}❌ Fichier non trouvé : $php_file${NC}"
      fi
      ;;
    
    2)
      read -p "Chemin du fichier PHP à analyser : " php_file
      
      if [ -f "$php_file" ]; then
        ./run-progressive-migration.sh "$php_file" --generate-all
      else
        echo -e "${RED}❌ Fichier non trouvé : $php_file${NC}"
      fi
      ;;
    
    3|*)
      # Rien à faire, retour au menu principal
      return
      ;;
  esac
  
  read -p "Appuyez sur Entrée pour continuer..." dummy
}

# Fonction principale pour l'interface interactive
main() {
  while true; do
    show_menu
    choice=$?
    
    case $choice in
      1)
        run_script "update-cahier.sh" "Mise à jour du cahier des charges" false
        ;;
      2)
        run_script "verify-cahier.sh" "Vérification de la cohérence" false
        ;;
      3)
        run_script "deduplicate-files.sh" "Suppression des fichiers dupliqués" false
        ;;
      4)
        run_script "analyze-similarity.sh" "Analyse de similarité" false
        ;;
      5)
        run_script "render-html.sh" "Génération de la vue HTML" false
        ;;
      6)
        run_script "dry-run-all.sh" "Exécution de tous les scripts en mode dry run" false
        ;;
      7)
        run_script "export-to-github.sh" "Export vers GitHub (commit et PR)" false
        ;;
      8)
        run_script "batch-generate-migration-plans.sh" "Génération des plans de migration" false
        ;;
      9)
        run_script "reorganize-project.sh" "Réorganisation de la structure du projet" false
        ;;
      10)
        run_progressive_migration
        ;;
      11)
        manage_files
        ;;
      12)
        manage_config
        ;;
      0)
        clear
        echo -e "${GREEN}Au revoir ! Merci d'avoir utilisé le gestionnaire de cahier des charges.${NC}"
        exit 0
        ;;
      *)
        echo -e "${RED}❌ Choix invalide${NC}"
        read -p "Appuyez sur Entrée pour continuer..." dummy
        ;;
    esac
  done
}

# Lancer l'interface
main
