#!/bin/bash
set -e

# Fonction pour afficher des messages colorés
function log {
  local color="\033[0;36m"
  local reset="\033[0m"
  echo -e "${color}[MIGRATION PIPELINE]${reset} $1"
}

# Vérifier si les variables d'environnement nécessaires sont définies
if [ -z "$N8N_JWT_SECRET" ]; then
  log "⚠️ N8N_JWT_SECRET n'est pas défini. Une valeur par défaut sera utilisée (non recommandé pour la production)."
  export N8N_JWT_SECRET="defaultsecret-please-change-me-for-production"
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  log "⚠️ Les variables SUPABASE_URL et/ou SUPABASE_KEY ne sont pas définies. Les fonctionnalités Supabase seront désactivées."
fi

# Installer les dépendances
log "🔄 Installation des dépendances du projet..."
pnpm install

# Vérifier si n8n doit être lancé
if [ "$START_N8N" = "true" ]; then
  log "🚀 Démarrage de n8n en arrière-plan..."
  n8n start &
  sleep 5
  
  # Importer les workflows n8n si spécifié
  if [ "$IMPORT_N8N_WORKFLOWS" = "true" ]; then
    log "📥 Importation des workflows n8n..."
    node scripts/import-n8n-workflows.js
  fi
fi

# Construire le projet
log "🏗️ Construction du projet..."
turbo run build

# Démarrer le serveur MCP si demandé
if [ "$START_MCP_SERVER" = "true" ]; then
  log "🚀 Démarrage du serveur MCP..."
  cd apps/mcp-server
  ts-node src/index.ts &
  cd ../..
fi

# Exécuter la pipeline de migration si demandée
if [ "$RUN_MIGRATION" = "true" ]; then
  log "🔄 Exécution de la pipeline de migration..."
  node run-pipeline.js
fi

# Si une commande personnalisée est fournie, l'exécuter
if [ $# -gt 0 ]; then
  log "🧰 Exécution de la commande personnalisée : $@"
  exec "$@"
else
  # Garder le conteneur en vie
  log "✅ Initialisation terminée. Le conteneur reste actif."
  tail -f /dev/null
fi