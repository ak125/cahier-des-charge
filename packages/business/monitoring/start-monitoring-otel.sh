#!/bin/bash

# Script pour démarrer la stack complète de monitoring: Prometheus, Grafana, Jaeger et OpenTelemetry

echo "🚀 Démarrage de la stack complète de monitoring avec OpenTelemetry..."

# Vérification de la présence de docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Erreur: docker-compose n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

# Emplacement du répertoire actuel
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$DIR")"

# Vérifier si le fichier docker-compose.monitoring.yml existe
if [ ! -f "$ROOT_DIR/docker-compose.monitoring.yml" ]; then
    echo "❌ Erreur: Le fichier docker-compose.monitoring.yml n'existe pas à l'emplacement attendu."
    exit 1
fi

# Vérifier si package.json existe pour installer les dépendances OpenTelemetry
if [ -f "$ROOT_DIR/package.json" ]; then
    echo "📦 Vérification des dépendances OpenTelemetry..."
    
    # Installer les dépendances OpenTelemetry si elles ne sont pas déjà présentes
    if ! grep -q "@opentelemetry/sdk-node" "$ROOT_DIR/package.json"; then
        echo "📥 Installation des dépendances OpenTelemetry..."
        cd "$ROOT_DIR"
        npm install --save @opentelemetry/sdk-node @opentelemetry/api @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-proto @opentelemetry/exporter-metrics-otlp-proto \
            @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/context-async-hooks
    else
        echo "✅ Les dépendances OpenTelemetry sont déjà installées."
    fi
fi

# Démarrage des services avec docker-compose
echo "🐳 Démarrage des conteneurs Docker..."
docker-compose -f "$ROOT_DIR/docker-compose.monitoring.yml" up -d

# Vérification que les services sont bien démarrés
echo "⏳ Vérification des services..."
sleep 5

if docker-compose -f "$ROOT_DIR/docker-compose.monitoring.yml" ps | grep -q "Up"; then
    echo "✅ Services de monitoring démarrés avec succès"
    
    echo "
🔍 Accès aux interfaces:
    - Prometheus: http://localhost:9090
    - Grafana:    http://localhost:3000 (admin/mcppassword)
    - Jaeger:     http://localhost:16686
    "

    # Démarrage du serveur de métriques (si TypeScript est installé)
    if command -v ts-node &> /dev/null; then
        echo "🔄 Démarrage du serveur de métriques..."
        
        # Vérifier si le fichier metrics-server.ts existe
        if [ -f "$DIR/metrics-server.ts" ]; then
            # Démarrer le serveur en arrière-plan
            ts-node "$DIR/metrics-server.ts" &
            SERVER_PID=$!
            echo "✅ Serveur de métriques démarré avec PID $SERVER_PID"
            echo "📊 Métriques disponibles sur: http://localhost:3001/metrics"
        else
            echo "⚠️  Le fichier metrics-server.ts n'existe pas. Le serveur de métriques ne sera pas démarré."
        fi
    else
        echo "ℹ️  ts-node n'est pas installé. Pour démarrer le serveur de métriques manuellement:"
        echo "  npm install -g ts-node"
        echo "  ts-node $DIR/metrics-server.ts"
    fi
    
    echo "
🚀 Vous pouvez maintenant instrumenter vos agents avec OpenTelemetry:
    - Importez { AgentTracer } from './monitoring/telemetry' dans vos agents
    - Importez { OrchestratorTracer } from './monitoring/telemetry' dans vos orchestrateurs
    - Consultez /monitoring/telemetry/README.md pour plus d'informations
    "
    
    # Proposer d'exécuter les exemples
    echo "📋 Voulez-vous exécuter les exemples d'agents instrumentés avec OpenTelemetry? (o/n)"
    read -r EXEC_EXAMPLES
    
    if [[ "$EXEC_EXAMPLES" == "o" || "$EXEC_EXAMPLES" == "O" || "$EXEC_EXAMPLES" == "oui" ]]; then
        echo "🏃 Exécution de l'exemple d'agent..."
        ts-node "$DIR/telemetry/exemple-agent.ts"
        
        echo ""
        echo "🏃 Exécution de l'exemple d'orchestrateur..."
        ts-node "$DIR/telemetry/exemple-orchestrateur.ts"
        
        echo ""
        echo "✅ Exemples exécutés. Vous pouvez maintenant visualiser les traces dans Jaeger: http://localhost:16686"
    fi
    
else
    echo "❌ Erreur lors du démarrage des services de monitoring"
    echo "Consultez les logs pour plus de détails: docker-compose -f \"$ROOT_DIR/docker-compose.monitoring.yml\" logs"
    exit 1
fi