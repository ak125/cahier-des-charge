#!/bin/bash
# start-n8n.sh - Lance l'instance n8n pour le pipeline de migration

echo "🚀 Démarrage de n8n pour le pipeline de migration..."

# Vérifier si docker-compose.n8n.yml existe
if [ ! -f "docker-compose.n8n.yml" ]; then
  echo "❌ Fichier docker-compose.n8n.yml non trouvé. Exécutez d'abord n8n-setup.sh."
  exit 1
fi

# Démarrer n8n avec docker-compose
docker-compose -f docker-compose.n8n.yml up -d

# Attendre que n8n soit prêt
echo "⏳ Attente du démarrage de n8n..."
attempts=0
max_attempts=30

while [ $attempts -lt $max_attempts ]; do
  if curl -s http://localhost:5678/rest/settings > /dev/null; then
    echo "✅ n8n est prêt!"
    break
  fi
  
  attempts=$((attempts+1))
  echo "⏳ Attente de n8n... ($attempts/$max_attempts)"
  sleep 2
done

if [ $attempts -eq $max_attempts ]; then
  echo "❌ n8n n'a pas démarré dans le temps imparti."
  exit 1
fi

# Installer les dépendances nécessaires pour le script d'importation
if ! npm list axios > /dev/null 2>&1; then
  echo "📦 Installation de la dépendance axios..."
  npm install --no-save axios
fi

# Importer les workflows
echo "📥 Importation des workflows dans n8n..."
node scripts/migration/import-n8n-workflows.js

echo "📊 n8n est accessible à l'adresse: http://localhost:5678"
echo "   Identifiants: admin / cahier-des-charges-migrator"
echo ""
echo "📝 Pour lancer une migration via le pipeline, utilisez: ./scripts/migration/run-migration.sh"
