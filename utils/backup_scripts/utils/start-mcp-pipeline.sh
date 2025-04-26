#!/bin/bash
# Script pour démarrer l'ensemble du pipeline MCP avec l'intégration PostgreSQL LISTEN/NOTIFY
# À exécuter depuis la racine du projet

set -e
echo "🚀 Démarrage du pipeline MCP complet..."

# Fonction pour vérifier si un conteneur Docker est en cours d'exécution
check_container_running() {
  docker ps --filter "name=$1" --format "{{.Names}}" | grep -q "$1"
}

# Fonction pour arrêter proprement en cas d'interruption
cleanup() {
  echo -e "\n⚠️ Arrêt des processus..."
  kill $BACKEND_PID $REDIS_AGENT_PID 2>/dev/null || true
  echo "✅ Pipeline arrêté."
  exit 0
}

# Piéger les signaux SIGINT et SIGTERM
trap cleanup SIGINT SIGTERM

# 1. Vérifier que les services Docker nécessaires sont démarrés
echo "🔍 Vérification des services Docker nécessaires..."

if ! check_container_running "postgres"; then
  echo "⚠️ Le conteneur PostgreSQL n'est pas en cours d'exécution."
  echo "📋 Démarrage des services avec Docker Compose..."
  docker-compose -f docker-compose.dev.yml up -d postgres redis
  echo "⏳ Attente du démarrage complet des services..."
  sleep 10
fi

# 2. Appliquer les migrations Prisma si nécessaire
echo "🔄 Application des migrations Prisma..."
pnpm prisma migrate deploy

# 3. Déployer les triggers PostgreSQL LISTEN/NOTIFY
echo "🔧 Déploiement des triggers PostgreSQL..."
./migration-toolkit/deploy-pg-triggers.sh

# 4. Démarrer le serveur backend NestJS
echo "🚀 Démarrage du serveur backend NestJS..."
cd apps/backend && pnpm dev &
BACKEND_PID=$!
echo "💡 PID du serveur backend: $BACKEND_PID"

# Attendre que le backend soit opérationnel
echo "⏳ Attente du démarrage complet du serveur backend..."
sleep 10

# 5. Démarrer l'agent Redis PHP Analyzer
echo "🤖 Démarrage de l'agent Redis PHP Analyzer..."
cd ../../agents && pnpm ts-node php-analyzer-agent.ts &
REDIS_AGENT_PID=$!
echo "💡 PID de l'agent Redis: $REDIS_AGENT_PID"

# 6. Afficher les informations d'utilisation
echo -e "\n✅ Pipeline MCP complet démarré avec succès !"
echo "---------------------------------------------"
echo "🔗 URLs disponibles :"
echo "   - Backend API: http://localhost:3333"
echo "   - Dashboard Remix: http://localhost:3000/dashboard/jobs-advanced"
echo "   - API WebHook pour n8n: http://localhost:3333/webhooks/mcp-job"
echo "---------------------------------------------"
echo "📋 Pour tester le pipeline :"
echo "   1. Créer un job via l'API : "
echo "      curl -X POST http://localhost:3333/webhooks/mcp-job -H 'Content-Type: application/json' -d '{\"filePath\":\"/legacy/src/test.php\",\"agentType\":\"php-analyzer\"}'"
echo "   2. Ou utiliser le script de test : ./migration-toolkit/test-notify-system.sh"
echo "   3. Ou importer le workflow n8n : workflows/mcp-php-analysis-pipeline.json"
echo "---------------------------------------------"
echo "⚠️ Appuyez sur Ctrl+C pour arrêter le pipeline"
echo "---------------------------------------------"

# Attendre que les processus en arrière-plan se terminent
wait