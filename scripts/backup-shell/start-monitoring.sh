#!/bin/bash

# Script de démarrage pour la stack de monitoring Prometheus/Grafana

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Veuillez installer Docker pour continuer."
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose n'est pas installé. Veuillez installer Docker Compose pour continuer."
    exit 1
fi

echo "Démarrage de la stack de monitoring..."

# Créer les répertoires nécessaires s'ils n'existent pas déjà
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/provisioning/datasources

# Démarrer les conteneurs avec docker-compose
docker-compose -f docker-compose.monitoring.yml up -d

# Vérifier le statut des conteneurs
echo "Vérification de l'état des conteneurs..."
docker-compose -f docker-compose.monitoring.yml ps

echo "La stack de monitoring est maintenant disponible aux adresses suivantes :"
echo "- Grafana: http://localhost:3000 (identifiants: admin/mcppassword)"
echo "- Prometheus: http://localhost:9090"
echo "- AlertManager: http://localhost:9093"