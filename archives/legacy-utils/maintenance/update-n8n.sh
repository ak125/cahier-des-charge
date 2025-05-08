#!/bin/bash
# update-n8n.sh - Script pour mettre à jour n8n vers la dernière version stable
# Date: 10 avril 2025

echo "🔄 Mise à jour de n8n vers la dernière version stable..."

# Sauvegarde de la configuration actuelle
echo "📦 Sauvegarde de la configuration actuelle..."
cp docker-compose.n8n.yml docker-compose.n8n.yml.bak-$(date +%Y%m%d%H%M%S)

# Récupération de la dernière version stable de n8n
echo "🔍 Recherche de la dernière version stable de n8n..."
LATEST_VERSION=$(curl -s https://registry.hub.docker.com/v2/repositories/n8nio/n8n/tags?page_size=100 | jq -r '.results[] | select(.name | test("^[0-9]+\\.[0-9]+\\.[0-9]+$")) | .name' | sort -V | tail -n 1)

if [ -z "$LATEST_VERSION" ]; then
  echo "❌ Impossible de déterminer la dernière version de n8n."
  echo "⚠️ Utilisation de la version latest par défaut."
  LATEST_VERSION="latest"
else
  echo "✅ Dernière version stable trouvée: $LATEST_VERSION"
fi

# Mise à jour du fichier docker-compose.n8n.yml
echo "📝 Mise à jour du fichier docker-compose.n8n.yml..."
sed -i "s|image: n8nio/n8n:.*|image: n8nio/n8n:$LATEST_VERSION|g" docker-compose.n8n.yml

# Arrêt de l'instance n8n actuelle
echo "🛑 Arrêt de l'instance n8n actuelle..."
docker-compose -f docker-compose.n8n.yml down

# Suppression des volumes potentiellement problématiques
echo "🧹 Nettoyage des volumes obsolètes..."
docker volume prune -f

# Redémarrage de n8n avec la nouvelle version
echo "🚀 Démarrage de n8n avec la version $LATEST_VERSION..."
docker-compose -f docker-compose.n8n.yml up -d

# Vérification que n8n est bien démarré
echo "⏳ Vérification du démarrage de n8n..."
attempts=0
max_attempts=30

while [ $attempts -lt $max_attempts ]; do
  n8n_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678)
  
  if [ "$n8n_status" = "200" ] || [ "$n8n_status" = "401" ]; then
    echo "✅ n8n est démarré et répond correctement!"
    break
  fi
  
  attempts=$((attempts+1))
  echo "⏳ Attente de n8n... ($attempts/$max_attempts)"
  sleep 2
done

if [ $attempts -eq $max_attempts ]; then
  echo "❌ n8n n'a pas démarré correctement dans le temps imparti."
  echo "📊 Log de n8n:"
  docker-compose -f docker-compose.n8n.yml logs n8n
  exit 1
fi

echo ""
echo "✅ Mise à jour de n8n terminée avec succès!"
echo "📊 Version précédente: 0.236.0"
echo "📊 Nouvelle version: $LATEST_VERSION"
echo ""
echo "📌 Vous pouvez accéder à n8n à l'adresse: http://localhost:5678"
echo "   Identifiants: admin / cahier-des-charges-migrator"
echo ""
echo "⚠️ Si vous rencontrez des problèmes avec cette mise à jour, vous pouvez restaurer la configuration précédente:"
echo "   mv docker-compose.n8n.yml.bak-* docker-compose.n8n.yml"
echo "   docker-compose -f docker-compose.n8n.yml down"
echo "   docker-compose -f docker-compose.n8n.yml up -d"