#!/bin/bash

# Script de démarrage du pipeline IA de migration
# Prépare l'environnement, configure et lance les services nécessaires

set -e

echo "🚀 Démarrage du pipeline IA de migration..."

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

# Vérifier Docker
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker et/ou Docker Compose ne sont pas installés. Veuillez les installer d'abord."
    exit 1
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord (version 20+ recommandée)."
    exit 1
fi
node_version=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$node_version" -lt 20 ]; then
    echo "⚠️ Version de Node.js détectée: $(node -v). Une version 20+ est recommandée."
fi

# Création répertoires projet
mkdir -p tools/agents/{php-analyzer,dev-generator,sql-mapper,docs-writer}
mkdir -p config/env
mkdir -p workflows
mkdir -p logs/{agents,n8n,db}
mkdir -p dashboard

# Charger les variables d'environnement
if [ -f "config/env/.env" ]; then
  echo "📝 Chargement des variables d'environnement..."
  source config/env/.env
else
  echo "📝 Création du fichier .env depuis le template par défaut..."
  cp config/env/.default.env config/env/.env
  source config/env/.env
  echo "⚠️ Veuillez personnaliser le fichier config/env/.env avec vos informations"
fi

# Installation des dépendances
echo "📦 Installation des dépendances..."
if command -v pnpm &> /dev/null; then
  pnpm install
else
  npm install
fi

# Import des workflows n8n
echo "🔄 Importation des workflows n8n..."
if [ -f "n8n.pipeline.json" ]; then
  echo "🔧 Préparation des workflows n8n..."
  mkdir -p tmp/workflows
  node tools/scripts/prepare-n8n-workflows.js
fi

# Lancement des services Docker
echo "🐳 Lancement des services Docker..."
docker-compose -f docker-compose.dev.yml up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
node tools/scripts/wait-for-services.js

# Démarrer les agents avec PM2
echo "🤖 Démarrage des agents IA..."
if command -v pm2 &> /dev/null; then
  pm2 start ecosystem.config.js
else
  echo "⚠️ PM2 n'est pas installé. Installation..."
  npm install -g pm2
  pm2 start ecosystem.config.js
fi

# Affichage des informations d'accès
echo "
✅ Pipeline IA démarré avec succès!

🌐 Accès aux services:
   - n8n: http://localhost:5678
   - Code Server: http://localhost:8080
   - Dashboard de migration: http://localhost:3000

📊 Statut des agents:
$(pm2 status)

📝 Logs disponibles dans ./logs/
"

echo "✨ Prêt pour la migration!"
