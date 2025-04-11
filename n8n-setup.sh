#!/bin/bash
# n8n-setup.sh - Installation et configuration de n8n pour le pipeline de migration
# Date: 10 avril 2025

echo "🚀 Installation et configuration de n8n pour le pipeline de migration..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
  echo "❌ Docker n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier si docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
  echo "❌ docker-compose n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Créer le dossier pour les données persistantes de n8n
mkdir -p .n8n/data

# Créer le fichier docker-compose pour n8n s'il n'existe pas déjà
if [ ! -f "docker-compose.n8n.yml" ]; then
  echo "📝 Création du fichier docker-compose.n8n.yml..."
  cat > docker-compose.n8n.yml << 'EOF'
version: '3'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=cahier-des-charges-migrator
      - N8N_HOST=${N8N_HOST:-localhost}
      - N8N_PORT=${N8N_PORT:-5678}
      - N8N_PROTOCOL=${N8N_PROTOCOL:-http}
      - NODE_ENV=production
      - WEBHOOK_URL=http://${N8N_HOST:-localhost}:${N8N_PORT:-5678}/
      - EXECUTIONS_PROCESS=main
      - DB_TYPE=sqlite
      - DB_SQLITE_PATH=/home/node/.n8n/database.sqlite
      - N8N_PUSH_BACKEND=websocket
    volumes:
      - ./.n8n/data:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows
      - ./config:/home/node/.n8n/config
      - ./assets:/home/node/.n8n/assets
      - ./reports:/home/node/.n8n/reports
EOF
  echo "✅ Fichier docker-compose.n8n.yml créé"
fi

# Créer le script pour importer les workflows dans n8n
echo "📝 Création du script d'importation des workflows..."
cat > scripts/migration/import-n8n-workflows.js << 'EOF'
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';
const N8N_USER = process.env.N8N_BASIC_AUTH_USER || 'admin';
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD || 'cahier-des-charges-migrator';

const n8nUrl = `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}`;
const authString = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');

// Lire le fichier principal des workflows
async function importWorkflows() {
  console.log('📥 Importation des workflows n8n...');
  
  try {
    // Lire le fichier principal des workflows
    const mainPipelinePath = path.resolve(__dirname, '../../n8n.pipeline.json');
    const configDir = path.resolve(__dirname, '../../config');
    
    if (fs.existsSync(mainPipelinePath)) {
      console.log(`Importation du pipeline principal: ${mainPipelinePath}`);
      const pipelineData = JSON.parse(fs.readFileSync(mainPipelinePath, 'utf8'));
      
      // Importer chaque workflow
      if (pipelineData.workflows && Array.isArray(pipelineData.workflows)) {
        for (const workflow of pipelineData.workflows) {
          await importWorkflow(workflow, 'pipeline principal');
        }
      }
    }
    
    // Lire les fichiers de workflow dans le dossier config
    const n8nConfigFiles = fs.readdirSync(configDir)
      .filter(file => file.includes('.n8n.') && file.endsWith('.json'));
    
    for (const configFile of n8nConfigFiles) {
      const filePath = path.join(configDir, configFile);
      console.log(`Importation du workflow de configuration: ${filePath}`);
      
      try {
        const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await importWorkflow(workflowData, configFile);
      } catch (err) {
        console.error(`❌ Erreur lors de la lecture/importation du fichier ${configFile}:`, err.message);
      }
    }
    
    console.log('✅ Importation des workflows terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation des workflows:', error.message);
    process.exit(1);
  }
}

// Importer un workflow dans n8n
async function importWorkflow(workflow, source) {
  try {
    const workflowName = workflow.name || (workflow.id ? `Workflow ${workflow.id}` : 'Sans nom');
    console.log(`🔄 Importation du workflow: ${workflowName} depuis ${source}`);
    
    // Préparer les données pour l'API n8n
    const apiData = {
      name: workflowName,
      nodes: workflow.nodes || [],
      connections: workflow.connections || {},
      active: workflow.active || false,
      settings: workflow.settings || {},
      tags: workflow.tags || [],
    };
    
    // Envoyer à l'API n8n
    const response = await axios.post(`${n8nUrl}/rest/workflows`, apiData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      }
    });
    
    if (response.status === 200) {
      console.log(`✅ Workflow "${workflowName}" importé avec succès!`);
    } else {
      console.warn(`⚠️ Importation du workflow "${workflowName}" a retourné un statut inattendu:`, response.status);
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.warn(`⚠️ Le workflow "${workflow.name || 'sans nom'}" existe déjà dans n8n.`);
    } else {
      console.error(`❌ Erreur lors de l'importation du workflow:`, error.message);
    }
  }
}

// Exécuter l'importation
importWorkflows();
EOF

mkdir -p scripts/migration
chmod +x scripts/migration/import-n8n-workflows.js
echo "✅ Script d'importation des workflows créé dans scripts/migration/import-n8n-workflows.js"

# Créer le script pour lancer n8n
echo "📝 Création du script de lancement n8n..."
cat > scripts/migration/start-n8n.sh << 'EOF'
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
EOF

chmod +x scripts/migration/start-n8n.sh
echo "✅ Script de lancement n8n créé dans scripts/migration/start-n8n.sh"

# Créer le script pour lancer une migration
echo "📝 Création du script d'exécution de migration..."
cat > scripts/migration/run-migration.sh << 'EOF'
#!/bin/bash
# run-migration.sh - Lance une migration via le pipeline n8n

echo "🚀 Lancement d'une migration via le pipeline n8n..."

# Vérifier si n8n est en cours d'exécution
if ! curl -s http://localhost:5678/rest/settings > /dev/null; then
  echo "❌ n8n n'est pas en cours d'exécution. Lancez-le d'abord avec: ./scripts/migration/start-n8n.sh"
  exit 1
fi

# Paramètres de la migration
WORKFLOW_ID=${1:-"php-analyzer"}  # ID du workflow à exécuter, php-analyzer par défaut
SOURCE_PATH=${2:-"./app"}         # Chemin source par défaut
TARGET_PATH=${3:-"./reports/analysis"} # Chemin cible par défaut

echo "📋 Paramètres de la migration:"
echo "   - Workflow: $WORKFLOW_ID"
echo "   - Chemin source: $SOURCE_PATH"
echo "   - Chemin cible: $TARGET_PATH"

# Demander confirmation
echo -n "❓ Voulez-vous lancer cette migration? (o/n): "
read -r answer

if [[ ! "$answer" =~ ^[oO]$ ]]; then
  echo "❌ Migration annulée."
  exit 0
fi

# Créer le dossier cible s'il n'existe pas
mkdir -p "$TARGET_PATH"

# Lancer l'exécution du workflow
echo "🔄 Lancement du workflow $WORKFLOW_ID..."

# Authentification pour l'API n8n
N8N_USER=${N8N_BASIC_AUTH_USER:-"admin"}
N8N_PASSWORD=${N8N_BASIC_AUTH_PASSWORD:-"cahier-des-charges-migrator"}
AUTH_STRING=$(echo -n "$N8N_USER:$N8N_PASSWORD" | base64)

# Récupérer l'ID interne du workflow
WORKFLOW_DATA=$(curl -s -H "Authorization: Basic $AUTH_STRING" http://localhost:5678/rest/workflows)
INTERNAL_ID=$(echo "$WORKFLOW_DATA" | grep -o "\"id\":\"[^\"]*\",\"name\":\"[^\"]*$WORKFLOW_ID" | head -1 | cut -d'"' -f4)

if [ -z "$INTERNAL_ID" ]; then
  echo "❌ Workflow '$WORKFLOW_ID' non trouvé dans n8n."
  exit 1
fi

# Lancer l'exécution
EXECUTION_DATA=$(curl -s -X POST \
  -H "Authorization: Basic $AUTH_STRING" \
  -H "Content-Type: application/json" \
  -d "{\"workflowData\": {\"id\": \"$INTERNAL_ID\"}, \"runData\": {\"sourcePath\": \"$SOURCE_PATH\", \"targetPath\": \"$TARGET_PATH\"}}" \
  http://localhost:5678/rest/workflows/$INTERNAL_ID/execute)

EXECUTION_ID=$(echo "$EXECUTION_DATA" | grep -o "\"id\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)

if [ -z "$EXECUTION_ID" ]; then
  echo "❌ Erreur lors du lancement de l'exécution."
  exit 1
fi

echo "✅ Migration lancée avec l'ID d'exécution: $EXECUTION_ID"
echo "   Vous pouvez suivre l'avancement dans l'interface n8n: http://localhost:5678/execution/$EXECUTION_ID"
EOF

chmod +x scripts/migration/run-migration.sh
echo "✅ Script d'exécution de migration créé dans scripts/migration/run-migration.sh"

# Ajouter des scripts npm pour n8n
echo "📝 Mise à jour du package.json avec les scripts n8n..."
# Sauvegarde du package.json
cp package.json package.json.n8n.bak

# Ajouter les scripts n8n au package.json
if [ -f "package.json" ]; then
  # Utiliser jq s'il est disponible, sinon utiliser sed
  if command -v jq &> /dev/null; then
    jq '.scripts += {
      "n8n:setup": "./n8n-setup.sh",
      "n8n:start": "./scripts/migration/start-n8n.sh",
      "n8n:stop": "docker-compose -f docker-compose.n8n.yml down",
      "n8n:migrate": "./scripts/migration/run-migration.sh",
      "n8n:logs": "docker-compose -f docker-compose.n8n.yml logs -f n8n"
    }' package.json > package.json.tmp && mv package.json.tmp package.json
  else
    # Utiliser sed si jq n'est pas disponible
    sed -i '/"scripts": {/a \
    "n8n:setup": "./n8n-setup.sh",\
    "n8n:start": "./scripts/migration/start-n8n.sh",\
    "n8n:stop": "docker-compose -f docker-compose.n8n.yml down",\
    "n8n:migrate": "./scripts/migration/run-migration.sh",\
    "n8n:logs": "docker-compose -f docker-compose.n8n.yml logs -f n8n",' package.json
  fi
  echo "✅ Scripts n8n ajoutés au package.json"
else
  echo "⚠️ Fichier package.json non trouvé, les scripts npm n'ont pas été ajoutés."
fi

# Créer un fichier de documentation
echo "📝 Création de la documentation pour n8n..."
mkdir -p docs/pipeline
cat > docs/pipeline/n8n-pipeline.md << 'EOF'
# Pipeline de Migration avec n8n

Ce document décrit comment utiliser n8n pour automatiser le processus de migration du code PHP vers NestJS/Remix.

## 📋 Vue d'ensemble

n8n est une plateforme d'automatisation de flux de travail qui nous permet de créer des pipelines de migration efficaces et visuels. Dans ce projet, n8n est utilisé pour :

1. Analyser le code PHP existant
2. Générer des rapports d'analyse
3. Orchestrer les étapes de migration
4. Générer du code pour la nouvelle architecture
5. Valider les migrations

## 🚀 Installation et configuration

### Prérequis

- Docker et docker-compose installés
- Node.js (pour les scripts d'importation)

### Installation

```bash
# Installer et configurer n8n
npm run n8n:setup

# Démarrer n8n
npm run n8n:start
```

L'interface de n8n sera accessible à l'adresse : http://localhost:5678
- Identifiants: admin / cahier-des-charges-migrator

## 🔄 Pipelines disponibles

Le projet inclut plusieurs pipelines préconfigurés :

1. **PHP Analyzer** (ID: `php-analyzer`)
   - Analyse les fichiers PHP existants
   - Extrait la structure, les dépendances et la logique métier
   - Génère des rapports JSON détaillés

2. **Code Generator** (ID: `code-generator`)
   - Génère du code NestJS/Remix à partir des rapports d'analyse
   - Crée la structure de fichiers cible
   - Applique les transformations nécessaires

3. **Documentation Updater** (ID: `docs-updater`)
   - Met à jour la documentation en fonction du code migré
   - Génère des rapports de migration

## 🛠️ Utilisation

### Lancer une migration

```bash
# Syntaxe : npm run n8n:migrate [WORKFLOW_ID] [SOURCE_PATH] [TARGET_PATH]

# Exemple avec le pipeline par défaut (php-analyzer)
npm run n8n:migrate

# Exemple avec un pipeline spécifique et des chemins personnalisés
npm run n8n:migrate code-generator ./reports/analysis ./src/generated
```

### Arrêter n8n

```bash
npm run n8n:stop
```

### Voir les logs de n8n

```bash
npm run n8n:logs
```

## 📊 Structure des workflows

Tous les workflows de pipeline sont définis dans les fichiers suivants :

- `n8n.pipeline.json` : Définition principale des workflows
- `config/*.n8n.json` : Configurations spécifiques à certains workflows

## 🔧 Personnalisation

Pour créer ou modifier un workflow :

1. Accédez à l'interface n8n à http://localhost:5678
2. Créez ou modifiez le workflow selon vos besoins
3. Exportez-le et intégrez-le dans `n8n.pipeline.json` ou créez un nouveau fichier dans `config/`

## 🔄 Intégration avec le cahier des charges

Les pipelines n8n sont conçus pour fonctionner en parallèle du cahier des charges. Ils implémentent les processus décrits dans le cahier des charges et s'assurent que la migration respecte les exigences spécifiées.

Les étapes de migration définies dans le cahier des charges sont automatisées via ces pipelines, ce qui permet :
- Une exécution cohérente et répétable
- Un suivi précis de la progression
- La génération de rapports détaillés
- Une traçabilité complète du processus
EOF

echo "✅ Documentation n8n créée dans docs/pipeline/n8n-pipeline.md"

# Mise à jour du .gitignore pour n8n
echo "📝 Mise à jour du .gitignore pour n8n..."
if [ -f ".gitignore" ]; then
  echo -e "\n# n8n\n.n8n/\n" >> .gitignore
  echo "✅ .gitignore mis à jour pour n8n"
else
  echo "# n8n" > .gitignore
  echo ".n8n/" >> .gitignore
  echo "✅ Fichier .gitignore créé pour n8n"
fi

echo ""
echo "✅ Installation et configuration de n8n terminées!"
echo ""
echo "🚀 Pour démarrer n8n, exécutez: npm run n8n:start"
echo "📊 L'interface n8n sera accessible à: http://localhost:5678"
echo "   Identifiants: admin / cahier-des-charges-migrator"
echo ""
echo "📝 Documentation: docs/pipeline/n8n-pipeline.md"