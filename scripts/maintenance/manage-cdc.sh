#!/bin/bash

# Script centralisé pour gérer le cahier des charges
# Permet de lancer toutes les opérations de maintenance, analyse et nettoyage

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Vérifier que le script est exécuté depuis le bon répertoire
if [ ! -d "./cahier-des-charges" ]; then
  echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
  exit 1
fi

# Vérifier et créer les droits d'exécution sur les scripts
check_and_chmod() {
  local scripts=(
    "scripts/cleanup-duplicates.sh"
    "scripts/analyze-content-similarity.sh"
    "scripts/optimize-project.sh"
    "scripts/monitor-resources.sh"
    "update-cahier.sh"
    "verify-cahier.sh"
    "scripts/rectify-cdc.sh"
  )
  
  for script in "${scripts[@]}"; do
    if [ -f "$script" ] && [ ! -x "$script" ]; then
      echo -e "${YELLOW}➡️ Attribution des droits d'exécution à $script${NC}"
      chmod +x "$script"
    fi
  done
}

# Afficher le menu principal
show_menu() {
  echo -e "${BLUE}==================================================${NC}"
  echo -e "${BLUE}🛠️  Gestion du Cahier des Charges${NC}"
  echo -e "${BLUE}==================================================${NC}"
  echo
  echo -e "${CYAN}1${NC}) Mettre à jour le cahier des charges"
  echo -e "${CYAN}2${NC}) Vérifier la cohérence du cahier des charges"
  echo -e "${CYAN}3${NC}) Analyser et supprimer les fichiers dupliqués"
  echo -e "${CYAN}4${NC}) Analyser la similarité conceptuelle entre fichiers"
  echo -e "${CYAN}5${NC}) Optimiser la structure du projet"
  echo -e "${CYAN}6${NC}) Surveiller les ressources système"
  echo -e "${CYAN}7${NC}) Générer la vue HTML complète"
  echo -e "${CYAN}8${NC}) Lancer toutes les analyses (sans modification)"
  echo -e "${CYAN}9${NC}) Rectifier le cahier des charges (fusion, suppression, réorganisation)"
  echo
  echo -e "${CYAN}q${NC}) Quitter"
  echo
  echo -e "${BLUE}==================================================${NC}"
}

# Gérer l'action sélectionnée
handle_action() {
  case $1 in
    1)
      echo -e "${BLUE}🔄 Mise à jour du cahier des charges...${NC}"
      if [ -x "./update-cahier.sh" ]; then
        ./update-cahier.sh
      else
        echo -e "${RED}❌ Script ./update-cahier.sh non trouvé ou non exécutable${NC}"
      fi
      ;;
    2)
      echo -e "${BLUE}🔍 Vérification de la cohérence du cahier des charges...${NC}"
      if [ -x "./verify-cahier.sh" ]; then
        ./verify-cahier.sh
      else
        echo -e "${RED}❌ Script ./verify-cahier.sh non trouvé ou non exécutable${NC}"
      fi
      ;;
    3)
      echo -e "${BLUE}🧹 Analyse et suppression des fichiers dupliqués...${NC}"
      if [ -x "./scripts/cleanup-duplicates.sh" ]; then
        echo -e "${YELLOW}Choisissez un mode:${NC}"
        echo -e "${CYAN}1${NC}) Mode simulation (--dry-run)"
        echo -e "${CYAN}2${NC}) Mode interactif (par défaut)"
        echo -e "${CYAN}3${NC}) Mode automatique (--non-interactive)"
        echo -e "${CYAN}q${NC}) Retour"
        read -p "Votre choix: " -n 1 -r
        echo
        
        case $REPLY in
          1)
            ./scripts/cleanup-duplicates.sh --dry-run
            ;;
          2)
            ./scripts/cleanup-duplicates.sh
            ;;
          3)
            ./scripts/cleanup-duplicates.sh --non-interactive
            ;;
          q|Q)
            return
            ;;
          *)
            echo -e "${RED}❌ Choix non reconnu${NC}"
            ;;
        esac
      else
        echo -e "${RED}❌ Script ./scripts/cleanup-duplicates.sh non trouvé ou non exécutable${NC}"
      fi
      ;;
    4)
      echo -e "${BLUE}🔍 Analyse de la similarité conceptuelle entre fichiers...${NC}"
      if [ -x "./scripts/analyze-content-similarity.sh" ]; then
        ./scripts/analyze-content-similarity.sh
      else
        echo -e "${RED}❌ Script ./scripts/analyze-content-similarity.sh non trouvé ou non exécutable${NC}"
      fi
      ;;
    5)
      echo -e "${BLUE}🏗️ Optimisation de la structure du projet...${NC}"
      if [ -x "./scripts/optimize-project.sh" ]; then
        echo -e "${YELLOW}Choisissez un mode:${NC}"
        echo -e "${CYAN}1${NC}) Mode simulation (--dry-run)"
        echo -e "${CYAN}2${NC}) Mode interactif (par défaut)"
        echo -e "${CYAN}3${NC}) Mode automatique (--force)"
        echo -e "${CYAN}q${NC}) Retour"
        read -p "Votre choix: " -n 1 -r
        echo
        
        case $REPLY in
          1)
            ./scripts/optimize-project.sh --dry-run
            ;;
          2)
            ./scripts/optimize-project.sh
            ;;
          3)
            ./scripts/optimize-project.sh --force
            ;;
          q|Q)
            return
            ;;
          *)
            echo -e "${RED}❌ Choix non reconnu${NC}"
            ;;
        esac
      else
        echo -e "${RED}❌ Script ./scripts/optimize-project.sh non trouvé ou non exécutable${NC}"
      fi
      ;;
    6)
      echo -e "${BLUE}📊 Surveillance des ressources système...${NC}"
      if [ -x "./scripts/monitor-resources.sh" ]; then
        ./scripts/monitor-resources.sh
      else
        echo -e "${RED}❌ Script ./scripts/monitor-resources.sh non trouvé ou non exécutable${NC}"
      fi
      ;;
    7)
      echo -e "${BLUE}🌐 Génération de la vue HTML complète...${NC}"
      if [ -f "./scripts/generate-html-view.js" ]; then
        if [ -x "$(command -v node)" ]; then
          node ./scripts/generate-html-view.js
          echo -e "${GREEN}✅ Vue HTML générée: vue-complete-auto.html${NC}"
        else
          echo -e "${RED}❌ Node.js n'est pas installé ou n'est pas disponible dans le PATH${NC}"
        fi
      else
        echo -e "${RED}❌ Script ./scripts/generate-html-view.js non trouvé${NC}"
      fi
      ;;
    8)
      echo -e "${BLUE}🔍 Lancement de toutes les analyses (sans modification)...${NC}"
      
      # Vérification
      if [ -x "./verify-cahier.sh" ]; then
        echo -e "${BLUE}1/4 - Vérification de la cohérence...${NC}"
        ./verify-cahier.sh
      fi
      
      # Analyse des duplications
      if [ -x "./scripts/cleanup-duplicates.sh" ]; then
        echo -e "${BLUE}2/4 - Analyse des fichiers dupliqués...${NC}"
        ./scripts/cleanup-duplicates.sh --dry-run
      fi
      
      # Analyse de la similarité conceptuelle
      if [ -x "./scripts/analyze-content-similarity.sh" ]; then
        echo -e "${BLUE}3/4 - Analyse de la similarité conceptuelle...${NC}"
        ./scripts/analyze-content-similarity.sh
      fi
      
      # Optimisation (mode simulation)
      if [ -x "./scripts/optimize-project.sh" ]; then
        echo -e "${BLUE}4/4 - Analyse de la structure du projet...${NC}"
        ./scripts/optimize-project.sh --dry-run
      fi
      
      echo -e "${GREEN}✅ Toutes les analyses sont terminées${NC}"
      ;;
    9)
      echo -e "${BLUE}🛠️ Rectification du cahier des charges...${NC}"
      if [ -x "./scripts/rectify-cdc.sh" ]; then
        ./scripts/rectify-cdc.sh
      else
        echo -e "${YELLOW}⚠️ Attribution des droits d'exécution au script...${NC}"
        chmod +x ./scripts/rectify-cdc.sh
        ./scripts/rectify-cdc.sh
      fi
      ;;
    q|Q)
      echo -e "${GREEN}👋 Au revoir!${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Option non reconnue${NC}"
      ;;
  esac
  
  echo
  echo -e "${YELLOW}Appuyez sur Entrée pour continuer...${NC}"
  read
}

# Fonction principale
main() {
  # Vérifier et attribuer les droits d'exécution
  check_and_chmod
  
  # Boucle principale
  while true; do
    clear
    show_menu
    read -p "Votre choix: " -n 1 -r
    echo
    handle_action $REPLY
  done
}

# Exécuter le script
main