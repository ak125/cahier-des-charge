#!/bin/bash

# Script pour démarrer la stack de monitoring Prometheus/Grafana

echo "Démarrage de la stack de monitoring..."

# Vérification de la présence de docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "Erreur: docker-compose n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

# Emplacement du répertoire actuel
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$DIR")"

# Démarrage des services avec docker-compose
echo "Démarrage des conteneurs Prometheus et Grafana..."
docker-compose -f "$ROOT_DIR/docker-compose.monitoring.yml" up -d

# Vérification que les services sont bien démarrés
echo "Vérification des services..."
sleep 5

if docker-compose -f "$ROOT_DIR/docker-compose.monitoring.yml" ps | grep -q "Up"; then
    echo "✅ Services de monitoring démarrés avec succès"
    echo "📊 Grafana accessible sur: http://localhost:3000 (admin/mcppassword)"
    echo "📈 Prometheus accessible sur: http://localhost:9090"
else
    echo "❌ Erreur lors du démarrage des services de monitoring"
    echo "Consultez les logs pour plus de détails: docker-compose -f \"$ROOT_DIR/docker-compose.monitoring.yml\" logs"
    exit 1
fi

# Démarrage du serveur de métriques (si TypeScript est installé)
if command -v ts-node &> /dev/null; then
    echo "Démarrage du serveur de métriques..."
    ts-node "$DIR/metrics-server.ts" &
    echo "✅ Serveur de métriques démarré sur le port 3001"
else
    echo "ℹ️ ts-node n'est pas installé. Pour démarrer le serveur de métriques manuellement:"
    echo "  npm install -g ts-node"
    echo "  ts-node $DIR/metrics-server.ts"
fi

echo "Configuration terminée!"