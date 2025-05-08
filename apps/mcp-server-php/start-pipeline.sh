#!/bin/bash
set -e

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Fonction pour afficher des étapes
step() {
  echo -e "\n${GREEN}=== $1 ===${NC}\n"
}

# Fonction pour afficher des avertissements
warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Fonction pour afficher des erreurs
error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

# Vérification des variables d'environnement
check_env() {
  step "Vérification de l'environnement"
  
  # Créer le fichier .env s'il n'existe pas
  if [ ! -f .env ]; then
    log "Création du fichier .env par défaut"
    cat > .env << EOL
# Configuration du MCP PHP Analyzer Server
PORT=3000
NODE_ENV=production
MCP_SERVER_ID=php-analyzer
LOG_LEVEL=info

# Configuration Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Répertoires d'analyse PHP
PHP_SRC_DIR=/app/src
OUTPUT_DIR=/app/output
EOL
    warn "Fichier .env créé avec des valeurs par défaut. Veuillez le modifier si nécessaire."
  else
    log "Fichier .env trouvé, chargement des variables d'environnement"
  fi
  
  # Charger les variables d'environnement
  export $(grep -v '^#' .env | xargs)
  
  # Vérifier les répertoires
  mkdir -p ${OUTPUT_DIR:-/app/output}
  
  if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    log "Configuration Supabase détectée ✅"
  else
    warn "Variables Supabase non définies. L'enregistrement dans Supabase sera désactivé."
  fi
  
  log "Environnement vérifié ✅"
}

# Démarrage du serveur MCP
start_mcp_server() {
  step "Démarrage du serveur MCP PHP Analyzer"
  
  # Vérifier si le serveur est déjà compilé
  if [ ! -d "dist" ]; then
    log "Compilation du serveur MCP..."
    npm run build
  fi
  
  # Démarrer le serveur en arrière-plan
  log "Démarrage du serveur MCP sur le port ${PORT:-3000}..."
  node dist/index.js > server.log 2>&1 &
  SERVER_PID=$!
  
  # Attendre que le serveur soit prêt
  log "Attente du démarrage du serveur..."
  sleep 3
  
  # Vérifier si le serveur est en cours d'exécution
  if ps -p $SERVER_PID > /dev/null; then
    log "Serveur MCP démarré avec succès (PID: $SERVER_PID) ✅"
    log "URL du serveur: http://localhost:${PORT:-3000}"
    log "Logs du serveur: server.log"
  else
    error "Échec du démarrage du serveur MCP. Vérifiez les logs: server.log"
  fi
}

# Exécution du pipeline d'analyse PHP
run_php_analyzer() {
  step "Exécution du pipeline d'analyse PHP"
  
  # Déterminer le répertoire source PHP
  SRC_DIR=${PHP_SRC_DIR:-/app/src}
  OUT_DIR=${OUTPUT_DIR:-/app/output}
  
  # Vérifier si le répertoire source existe
  if [ ! -d "$SRC_DIR" ]; then
    warn "Le répertoire source $SRC_DIR n'existe pas. Création d'un répertoire exemple..."
    mkdir -p "$SRC_DIR"
    echo "<?php\n\nclass ExampleClass {\n    public function hello() {\n        echo 'Hello, World!';\n    }\n}" > "$SRC_DIR/Example.php"
    log "Fichier exemple créé: $SRC_DIR/Example.php"
  fi
  
  # Compter les fichiers PHP
  PHP_FILES=$(find "$SRC_DIR" -name "*.php" | wc -l)
  
  if [ "$PHP_FILES" -eq 0 ]; then
    warn "Aucun fichier PHP trouvé dans $SRC_DIR. Rien à analyser."
    return
  fi
  
  log "Nombre de fichiers PHP trouvés: $PHP_FILES"
  
  # Exécuter l'analyseur PHP
  log "Démarrage de l'analyse PHP..."
  
  # Déterminer si on sauvegarde dans Supabase
  SUPABASE_FLAG=""
  if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    SUPABASE_FLAG="--save-to-supabase"
    log "Sauvegarde dans Supabase activée"
  fi
  
  # Exécuter l'analyse
  if [ "$PHP_FILES" -gt 100 ]; then
    warn "Grand nombre de fichiers détecté ($PHP_FILES). Limitation à 100 fichiers."
    MAX_FILES="--max-files 100"
  else
    MAX_FILES=""
  fi
  
  log "Analyse en cours... Cela peut prendre un moment."
  node dist/agents/php-analyzer-v2.js --directory "$SRC_DIR" --output-dir "$OUT_DIR" $SUPABASE_FLAG $MAX_FILES
  
  RESULT=$?
  if [ $RESULT -eq 0 ]; then
    log "Analyse PHP terminée avec succès ✅"
    log "Résultats enregistrés dans: $OUT_DIR"
  else
    error "Échec de l'analyse PHP. Code de sortie: $RESULT"
  fi
}

# Webhook vers n8n (optionnel)
notify_n8n() {
  step "Notification du pipeline n8n"
  
  if [ -n "$N8N_WEBHOOK_URL" ]; then
    log "Envoi de notification à n8n..."
    
    # Créer un payload JSON avec les résultats
    PAYLOAD="{\"event\":\"php_analysis_completed\",\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"files_analyzed\":\"$PHP_FILES\",\"output_dir\":\"$OUT_DIR\"}"
    
    # Envoyer la notification
    curl -s -X POST "$N8N_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" > /dev/null
    
    log "Notification envoyée à n8n ✅"
  else
    log "Aucune URL de webhook n8n configurée. Étape ignorée."
  fi
}

# Afficher le récapitulatif
show_summary() {
  step "Récapitulatif"
  
  echo -e "${GREEN}🚀 Pipeline d'analyse PHP terminé avec succès${NC}"
  echo ""
  echo -e "${BLUE}📊 Statistiques :${NC}"
  echo "  • Serveur MCP : http://localhost:${PORT:-3000}"
  echo "  • Fichiers PHP analysés : $PHP_FILES"
  echo "  • Répertoire de sortie : $OUT_DIR"
  
  if [ -f "$OUT_DIR/analysis_summary.json" ]; then
    SUCCESS_COUNT=$(grep -o '"success":[0-9]*' "$OUT_DIR/analysis_summary.json" | cut -d':' -f2)
    ERROR_COUNT=$(grep -o '"errors":[0-9]*' "$OUT_DIR/analysis_summary.json" | cut -d':' -f2)
    echo "  • Analyses réussies : $SUCCESS_COUNT"
    echo "  • Analyses en erreur : $ERROR_COUNT"
  fi
  
  if [ -n "$SUPABASE_URL" ]; then
    echo "  • Résultats enregistrés dans Supabase"
  fi
  
  echo ""
  echo -e "${BLUE}📂 Rapports disponibles :${NC}"
  echo "  • JSON : $OUT_DIR/*.audit.json"
  echo "  • Markdown : $OUT_DIR/*.audit.md"
  echo "  • Résumé global : $OUT_DIR/analysis_summary.json"
  
  echo ""
  echo -e "${YELLOW}Pour arrêter le serveur MCP : kill $SERVER_PID${NC}"
}

# Fonction principale
main() {
  echo -e "${GREEN}"
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║             MCP PHP ANALYZER SERVER PIPELINE              ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  
  # Exécution des étapes
  check_env
  start_mcp_server
  run_php_analyzer
  notify_n8n
  show_summary
}

# Exécution du script
main