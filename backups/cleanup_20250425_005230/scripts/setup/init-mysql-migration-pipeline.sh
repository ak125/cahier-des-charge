#!/bin/bash

# Script d'initialisation pour le pipeline de migration MySQL vers PostgreSQL avec MCP
# Ce script configure l'environnement nécessaire pour exécuter le pipeline de migration

set -e

echo "🔄 Initialisation du pipeline de migration MySQL → PostgreSQL"
echo "=================================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Créer les dossiers nécessaires
mkdir -p /workspaces/cahier-des-charge/migration-results
mkdir -p /workspaces/cahier-des-charge/custom-nodes/mysql-mcp-node
mkdir -p /workspaces/cahier-des-charge/apps/mcp-server-mysql/src/services

echo "✅ Dossiers de travail créés"

# Installer les dépendances nécessaires pour le serveur MCP MySQL
echo "📦 Installation des dépendances pour le serveur MCP MySQL..."
cd /workspaces/cahier-des-charge/apps/mcp-server-mysql
npm init -y
npm install mysql2 dotenv typescript @types/node @types/mysql2 --save

# Initialiser le package.json pour le nœud n8n personnalisé
cd /workspaces/cahier-des-charge/custom-nodes/mysql-mcp-node
npm init -y
npm install n8n-core n8n-workflow --save

# Créer un fichier de configuration pour les variables d'environnement
cat > /workspaces/cahier-des-charge/apps/mcp-server-mysql/.env << EOF
# Configuration pour le serveur MCP MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=my_database

# Ne pas modifier cette ligne, elle est utilisée par le pipeline n8n
CONNECTION_STRING=mysql://\${MYSQL_USER}:\${MYSQL_PASSWORD}@\${MYSQL_HOST}:\${MYSQL_PORT}/\${MYSQL_DATABASE}
EOF

echo "✅ Fichier de configuration .env créé"

# Créer un fichier tsconfig.json pour le serveur MCP MySQL
cat > /workspaces/cahier-des-charge/apps/mcp-server-mysql/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

echo "✅ Configuration TypeScript créée"

# Mettre à jour le package.json pour le serveur MCP MySQL
cd /workspaces/cahier-des-charge/apps/mcp-server-mysql
sed -i 's/"main": "index.js"/"main": "dist\/index.js"/' package.json
sed -i 's/"scripts": {/"scripts": {\n    "build": "tsc",\n    "start": "node dist\/index.js",\n    "dev": "ts-node src\/index.ts",/' package.json

echo "✅ Configuration du package.json mise à jour"

# Installer n8n globalement si ce n'est pas déjà fait
if ! command -v n8n &> /dev/null; then
    echo "📦 Installation de n8n..."
    npm install -g n8n
fi

echo "✅ n8n est installé"

# Créer le dossier pour stocker les résultats de migration
mkdir -p /workspaces/cahier-des-charge/migration-results/$(date +%Y-%m-%d)

echo "✅ Dossier pour les résultats de migration créé"

# Message final
echo ""
echo "🎉 Initialisation terminée !"
echo "=================================================="
echo "Pour lancer le pipeline de migration :"
echo "1. Modifiez le fichier .env avec vos identifiants MySQL"
echo "2. Exécutez : n8n import --input=/workspaces/cahier-des-charge/config/migration/n8n-mysql-migration.json"
echo "3. Lancez n8n : n8n start"
echo "4. Accédez à l'interface n8n et exécutez le workflow 'Migration SQL complète - Pipeline'"
echo ""
echo "Les résultats seront disponibles dans le dossier /workspaces/cahier-des-charge/migration-results/"
echo "=================================================="