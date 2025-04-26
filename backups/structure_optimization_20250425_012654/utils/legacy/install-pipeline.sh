#!/bin/bash

# Script d'installation automatisée du pipeline IA
# Ce script implémente la procédure décrite dans le cahier des charges

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR=${INSTALL_DIR:-"/opt/ia-migration-pipeline"}
REPO_URL=${REPO_URL:-"https://github.com/organisation/ia-migration-pipeline.git"}
BRANCH=${BRANCH:-"main"}

# Fonction pour afficher les étapes
print_step() {
  echo -e "${BLUE}[ÉTAPE $1/$2] $3${NC}"
}

# Fonction pour afficher un succès
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher un avertissement
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Fonction pour afficher une erreur
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
  print_step 1 7 "Vérification des prérequis"
  
  # Vérifier Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js non trouvé. Veuillez installer Node.js v16 ou supérieur."
    exit 1
  fi
  NODE_VERSION=$(node -v | cut -d 'v' -f 2)
  if [[ ${NODE_VERSION%%.*} -lt 16 ]]; then
    print_error "Node.js v$NODE_VERSION détecté. Version 16 ou supérieure requise."
    exit 1
  fi
  print_success "Node.js v$NODE_VERSION détecté"
  
  # Vérifier npm
  if ! command -v npm &> /dev/null; then
    print_error "npm non trouvé."
    exit 1
  fi
  NPM_VERSION=$(npm -v)
  print_success "npm v$NPM_VERSION détecté"
  
  # Vérifier Docker
  if ! command -v docker &> /dev/null; then
    print_error "Docker non trouvé. Veuillez installer Docker v20 ou supérieur."
    exit 1
  fi
  DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
  print_success "Docker v$DOCKER_VERSION détecté"
  
  # Vérifier Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose non trouvé."
    exit 1
  fi
  DOCKER_COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
  print_success "Docker Compose v$DOCKER_COMPOSE_VERSION détecté"
  
  # Vérifier Git
  if ! command -v git &> /dev/null; then
    print_error "Git non trouvé. Veuillez installer Git v2.30 ou supérieur."
    exit 1
  fi
  GIT_VERSION=$(git --version | awk '{print $3}')
  print_success "Git v$GIT_VERSION détecté"
  
  # Vérifier la RAM disponible
  if command -v free &> /dev/null; then
    MEM_TOTAL=$(free -g | awk '/^Mem:/ {print $2}')
    if [[ $MEM_TOTAL -lt 8 ]]; then
      print_warning "Mémoire RAM détectée: ${MEM_TOTAL}GB. Minimum recommandé: 8GB."
    else
      print_success "Mémoire RAM détectée: ${MEM_TOTAL}GB"
    fi
  fi
  
  # Vérifier l'espace disque
  DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
  print_success "Espace disque disponible: $DISK_SPACE"
  
  echo
}

# Fonction pour préparer l'environnement
prepare_environment() {
  print_step 2 7 "Préparation de l'environnement d'installation"
  
  # Créer le répertoire d'installation
  if [ -d "$INSTALL_DIR" ]; then
    print_warning "Le répertoire $INSTALL_DIR existe déjà."
    read -p "Voulez-vous continuer et écraser les fichiers existants? (o/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
      print_error "Installation annulée."
      exit 1
    fi
  else
    mkdir -p "$INSTALL_DIR"
    print_success "Répertoire d'installation créé: $INSTALL_DIR"
  fi
  
  # Se déplacer dans le répertoire
  cd "$INSTALL_DIR" || { 
    print_error "Impossible d'accéder au répertoire $INSTALL_DIR"; 
    exit 1; 
  }
  
  # Cloner le dépôt
  print_success "Téléchargement du code source depuis $REPO_URL (branche: $BRANCH)"
  if [ -d ".git" ]; then
    git fetch --all
    git checkout "$BRANCH"
    git pull
  else
    git clone -b "$BRANCH" "$REPO_URL" .
  fi
  
  if [ $? -ne 0 ]; then
    print_error "Échec du clonage du dépôt."
    exit 1
  fi
  
  print_success "Code source téléchargé avec succès"
  echo
}

# Fonction pour installer les dépendances
install_dependencies() {
  print_step 3 7 "Installation des dépendances"
  
  # Installer les dépendances npm
  print_success "Installation des dépendances Node.js"
  npm install
  
  if [ $? -ne 0 ]; then
    print_error "Échec de l'installation des dépendances npm."
    exit 1
  fi
  
  print_success "Dépendances installées avec succès"
  echo
}

# Fonction pour configurer l'environnement
configure_environment() {
  print_step 4 7 "Configuration de l'environnement"
  
  # Vérifier si .env existe déjà
  if [ -f ".env" ]; then
    print_warning "Un fichier .env existe déjà."
    read -p "Voulez-vous le conserver? (o/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
      print_success "Conservation du fichier .env existant."
      return
    fi
  fi
  
  # Demander les informations nécessaires
  echo -e "${BLUE}Configuration des variables d'environnement${NC}"
  echo -e "${YELLOW}Appuyez sur Entrée pour utiliser les valeurs par défaut${NC}"
  
  # OpenAI
  read -p "Clé API OpenAI: " OPENAI_API_KEY
  read -p "ID d'organisation OpenAI [optionnel]: " OPENAI_ORG_ID
  
  # Base de données
  read -p "URI MongoDB [mongodb://localhost:27017/migration]: " MONGODB_URI
  MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/migration"}
  
  read -p "URL Redis [redis://localhost:6379]: " REDIS_URL
  REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}
  
  # GitHub
  read -p "Token GitHub: " GITHUB_TOKEN
  read -p "Dépôt GitHub [organisation/repository]: " GITHUB_REPO
  GITHUB_REPO=${GITHUB_REPO:-"organisation/repository"}
  
  read -p "Secret Webhook GitHub [auto-généré]: " GITHUB_WEBHOOK_SECRET
  if [ -z "$GITHUB_WEBHOOK_SECRET" ]; then
    GITHUB_WEBHOOK_SECRET=$(openssl rand -hex 20)
    print_success "Secret Webhook auto-généré: $GITHUB_WEBHOOK_SECRET"
  fi
  
  # Générer le fichier .env
  cat > .env << EOL
# Configuration générée automatiquement
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# API OpenAI
OPENAI_API_KEY=${OPENAI_API_KEY}
OPENAI_ORG_ID=${OPENAI_ORG_ID}

# Base de données
MONGODB_URI=${MONGODB_URI}
REDIS_URL=${REDIS_URL}

# GitHub
GITHUB_TOKEN=${GITHUB_TOKEN}
GITHUB_REPO=${GITHUB_REPO}
GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}

# Configuration du pipeline
MAX_CONCURRENT_MIGRATIONS=5
DEFAULT_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-ada-002
VECTOR_DB_PATH=${INSTALL_DIR}/data/vector_db
EOL
  
  print_success "Fichier .env créé avec succès"
  echo
}

# Fonction pour installer les composants Docker
install_docker_components() {
  print_step 5 7 "Installation des composants Docker"
  
  # Construire les images Docker
  print_success "Construction des images Docker"
  docker-compose build
  
  if [ $? -ne 0 ]; then
    print_error "Échec de la construction des images Docker."
    exit 1
  fi
  
  # Démarrer les services
  print_success "Démarrage des services Docker"
  docker-compose up -d
  
  if [ $? -ne 0 ]; then
    print_error "Échec du démarrage des services Docker."
    exit 1
  fi
  
  print_success "Services Docker démarrés avec succès"
  echo
}

# Fonction pour initialiser la base de données
initialize_database() {
  print_step 6 7 "Initialisation de la base de données"
  
  # Exécuter les migrations
  print_success "Exécution des migrations de base de données"
  npm run db:migrate
  
  if [ $? -ne 0 ]; then
    print_error "Échec des migrations de base de données."
    exit 1
  fi
  
  # Charger les données initiales
  print_success "Chargement des données initiales"
  npm run db:seed
  
  if [ $? -ne 0 ]; then
    print_warning "Échec du chargement des données initiales. L'installation peut tout de même continuer."
  else
    print_success "Base de données initialisée avec succès"
  fi
  
  echo
}

# Fonction pour configurer les agents IA et finaliser l'installation
finalize_installation() {
  print_step 7 7 "Configuration des agents IA et finalisation"
  
  # Initialiser les agents IA
  print_success "Initialisation des agents IA"
  npm run agents:init
  
  if [ $? -ne 0 ]; then
    print_warning "Problème lors de l'initialisation des agents IA. Vérifiez la configuration."
  else
    print_success "Agents IA initialisés"
  fi
  
  # Vérifier l'état des agents
  npm run agents:status
  
  # Générer la configuration des webhooks
  print_success "Génération de la configuration des webhooks"
  npm run generate-webhook-config
  
  # Afficher les instructions d'installation
  npm run show-webhook-instructions
  
  # Vérifier l'installation
  print_success "Vérification de l'installation"
  npm run verify-installation
  
  echo -e "${GREEN}===============================================${NC}"
  echo -e "${GREEN}  Installation du pipeline IA terminée !${NC}"
  echo -e "${GREEN}===============================================${NC}"
  echo
  echo -e "Le pipeline est installé dans: ${BLUE}$INSTALL_DIR${NC}"
  echo -e "Interface d'administration: ${BLUE}http://localhost:3000/admin${NC}"
  echo
  echo -e "${YELLOW}N'oubliez pas de configurer les webhooks GitHub selon les instructions ci-dessus.${NC}"
  echo
}

# Fonction principale
main() {
  echo -e "${GREEN}===============================================${NC}"
  echo -e "${GREEN}  Installation du Pipeline IA de Migration${NC}"
  echo -e "${GREEN}===============================================${NC}"
  echo
  
  # Exécuter toutes les étapes
  check_prerequisites
  prepare_environment
  install_dependencies
  configure_environment
  install_docker_components
  initialize_database
  finalize_installation
}

# Exécuter le script
main
