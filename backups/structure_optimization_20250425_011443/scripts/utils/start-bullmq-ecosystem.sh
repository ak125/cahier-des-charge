#!/bin/bash
# Script pour démarrer l'écosystème BullMQ pour MCP
# À exécuter depuis la racine du projet

set -e
echo "🚀 Démarrage de l'écosystème BullMQ pour MCP..."

# Vérification de Redis
echo "🔍 Vérification de Redis..."
if ! command -v redis-cli &> /dev/null; then
  echo "⚠️ redis-cli n'est pas installé. Veuillez installer Redis ou utiliser Docker."
  echo "📝 Démarrage de Redis avec Docker..."
  docker run --name redis-mcp -p 6379:6379 -d redis:alpine
  echo "⏳ Attente du démarrage de Redis..."
  sleep 3
else
  # Vérifier si Redis est en cours d'exécution
  if ! redis-cli ping &> /dev/null; then
    echo "⚠️ Redis n'est pas en cours d'exécution."
    echo "📝 Démarrage de Redis avec Docker..."
    docker run --name redis-mcp -p 6379:6379 -d redis:alpine
    echo "⏳ Attente du démarrage de Redis..."
    sleep 3
  else
    echo "✅ Redis est en cours d'exécution."
  fi
fi

# Fonction pour gérer l'arrêt propre
cleanup() {
  echo -e "\n⚠️ Arrêt des processus..."
  kill $MCP_SERVER_PID $PHP_WORKER_PID $JS_WORKER_PID $VERIFIER_WORKER_PID $ORCHESTRATOR_PID 2>/dev/null || true
  echo "✅ Écosystème BullMQ arrêté."
  exit 0
}

# Piéger les signaux SIGINT et SIGTERM
trap cleanup SIGINT SIGTERM

# Démarrage du serveur MCP
echo "🚀 Démarrage du serveur MCP..."
cd apps/mcp-server && pnpm dev &
MCP_SERVER_PID=$!
echo "💡 PID du serveur MCP: $MCP_SERVER_PID"

# Attendre que le serveur MCP soit opérationnel
echo "⏳ Attente du démarrage du serveur MCP..."
sleep 5

# Démarrage du worker PHP Analyzer
echo "🤖 Démarrage du worker PHP Analyzer..."
cd ../../agents/workers && pnpm ts-node php-analyzer.worker.ts &
PHP_WORKER_PID=$!
echo "💡 PID du worker PHP Analyzer: $PHP_WORKER_PID"

# Démarrage du worker JS Analyzer
echo "🤖 Démarrage du worker JS Analyzer..."
cd ../../agents/workers && pnpm ts-node js-analyzer.worker.ts &
JS_WORKER_PID=$!
echo "💡 PID du worker JS Analyzer: $JS_WORKER_PID"

# Démarrage du worker MCP Verifier
echo "🤖 Démarrage du worker MCP Verifier..."
cd ../../agents/workers && pnpm ts-node mcp-verifier.worker.ts &
VERIFIER_WORKER_PID=$!
echo "💡 PID du worker MCP Verifier: $VERIFIER_WORKER_PID"

# Démarrage de l'orchestrateur BullMQ
echo "🎯 Démarrage de l'orchestrateur BullMQ..."
cd ../../agents && pnpm ts-node bullmq-orchestrator.ts &
ORCHESTRATOR_PID=$!
echo "💡 PID de l'orchestrateur BullMQ: $ORCHESTRATOR_PID"

# Affichage des URLs et informations utiles
echo -e "\n✅ Écosystème BullMQ démarré avec succès!"
echo "---------------------------------------------"
echo "🔗 URLs disponibles:"
echo "   - API MCP: http://localhost:3030/api"
echo "   - Interface Bull Board: http://localhost:3030/queues"
echo "   - Dashboard Remix: http://localhost:3000/dashboard/bullmq"
echo "---------------------------------------------"
echo "📋 Pour tester l'API:"
echo "   curl -X POST http://localhost:3030/api/jobs/php-analyzer -H 'Content-Type: application/json' -d '{\"filePath\":\"/test/example.php\"}'"
echo "   curl -X POST http://localhost:3030/api/jobs/verification -H 'Content-Type: application/json' -d '{\"filePrefix\":\"fiche\"}'"
echo "---------------------------------------------"
echo "⚠️ Appuyez sur Ctrl+C pour arrêter l'écosystème BullMQ"
echo "---------------------------------------------"

# Attendre que les processus en arrière-plan se terminent
wait