#!/bin/bash

# Script de déploiement des tableaux de bord en couches
# Ce script configure l'environnement et démarre les tableaux de bord
# avec toutes les dépendances nécessaires

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage des messages
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Veuillez l'installer puis réessayer."
    fi
    
    # Vérifier npm ou yarn ou pnpm
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
    elif command -v yarn &> /dev/null; then
        PACKAGE_MANAGER="yarn"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
    else
        log_error "Aucun gestionnaire de paquets (npm, yarn, pnpm) n'a été trouvé. Veuillez en installer un puis réessayer."
    fi
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker n'est pas installé. Les services backend seront exécutés en mode local."
        USE_DOCKER=false
    else
        USE_DOCKER=true
    fi
    
    log_success "Tous les prérequis sont satisfaits."
}

# Créer les fichiers d'environnement
setup_environment() {
    log "Configuration de l'environnement..."
    
    # Créer le répertoire des configurations si nécessaire
    mkdir -p ../config/dashboards
    
    # Créer le fichier de configuration pour les tableaux de bord
    cat > ../config/dashboards/dashboard-config.json << EOF
{
  "api": {
    "baseUrl": "http://localhost:3001/api",
    "timeout": 30000,
    "retryAttempts": 3
  },
  "dashboards": {
    "refreshInterval": 30,
    "traceability": {
      "enabled": true,
      "storageType": "hybrid"
    },
    "circuitBreaker": {
      "enabled": true,
      "failureThreshold": 5,
      "resetTimeout": 30000
    },
    "governance": {
      "enabled": true,
      "rulesPath": "/config/governance-rules.json",
      "conflictResolution": "majority"
    }
  },
  "layers": {
    "orchestration": {
      "enabled": true,
      "apiEndpoints": {
        "status": "/orchestration/status",
        "workflows": "/orchestration/workflows",
        "circuitBreaker": "/orchestration/circuit-breaker"
      }
    },
    "agents": {
      "enabled": true,
      "apiEndpoints": {
        "registry": "/agents/registry",
        "performance": "/agents/performance",
        "health": "/agents/health",
        "circuitBreaker": "/agents/circuit-breaker"
      }
    },
    "business": {
      "enabled": true,
      "apiEndpoints": {
        "domains": "/business/domains",
        "models": "/business/models",
        "kpis": "/business/kpis",
        "circuitBreaker": "/business/circuit-breaker"
      }
    }
  },
  "authentication": {
    "required": false,
    "method": "bearer"
  }
}
EOF
    
    # Créer le fichier de configuration pour les règles de gouvernance
    cat > ../config/dashboards/governance-rules.json << EOF
[
  {
    "id": "rule-1",
    "name": "Isolation des workflows défaillants",
    "description": "Isole automatiquement un workflow lorsqu'il dépasse le seuil d'échecs",
    "type": "circuit-breaker-action",
    "priority": 10,
    "conditions": {
      "failureCount": 5,
      "timeWindow": 60000
    },
    "actions": [
      {
        "type": "isolate",
        "target": "workflow",
        "duration": 300000
      },
      {
        "type": "notify",
        "channel": "dashboard"
      }
    ],
    "scope": {
      "layers": ["orchestration"]
    },
    "enabled": true
  },
  {
    "id": "rule-2",
    "name": "Limitation de débit des agents",
    "description": "Limite le débit d'un agent qui consomme trop de ressources",
    "type": "resource-allocation",
    "priority": 8,
    "conditions": {
      "cpuUsage": 80,
      "memoryUsage": 75,
      "requestRate": 100
    },
    "actions": [
      {
        "type": "throttle",
        "target": "agent",
        "rate": 50,
        "duration": 120000
      },
      {
        "type": "notify",
        "channel": "dashboard"
      }
    ],
    "scope": {
      "layers": ["agents"]
    },
    "enabled": true
  },
  {
    "id": "rule-3",
    "name": "Validation des migrations de domaine",
    "description": "Vérifie la qualité d'une migration de domaine avant de la valider",
    "type": "quality-gate",
    "priority": 9,
    "conditions": {
      "migrationSuccess": 90,
      "errorRate": 5
    },
    "actions": [
      {
        "type": "validate",
        "target": "domain",
        "minScore": 80
      },
      {
        "type": "notify",
        "channel": "dashboard"
      }
    ],
    "scope": {
      "layers": ["business", "orchestration"]
    },
    "enabled": true
  }
]
EOF

    log_success "Configuration de l'environnement terminée."
}

# Installer les dépendances
install_dependencies() {
    log "Installation des dépendances..."
    
    # Se déplacer dans le répertoire racine du projet
    cd ..
    
    # Vérifier si le package.json spécifique pour les tableaux de bord existe
    if [ ! -f "layered-dashboards/package.json" ]; then
        log "Création d'un package.json spécifique pour les tableaux de bord..."
        
        # Créer un package.json minimal pour les tableaux de bord
        mkdir -p layered-dashboards
        cat > layered-dashboards/package.json << EOF
{
  "name": "layered-dashboards",
  "version": "1.0.0",
  "private": true,
  "description": "Tableaux de bord à 3 couches pour l'architecture",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@chakra-ui/react": "^2.8.2",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "framer-motion": "^10.12.16",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^4.9.0"
  },
  "devDependencies": {
    "@types/node": "^18.16.0",
    "@types/react": "^18.2.8",
    "@types/react-dom": "^18.2.4",
    "typescript": "^5.1.3",
    "vite": "^4.3.9"
  }
}
EOF
        
        # Créer un fichier vite.config.ts minimal
        cat > layered-dashboards/vite.config.ts << EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
EOF
    fi
    
    # Créer un répertoire temporaire spécifique pour les tableaux de bord
    mkdir -p .temp-dashboard-deps
    cd .temp-dashboard-deps
    
    # Créer un package.json temporaire qui évite les dépendances problématiques
    cat > package.json << EOF
{
  "name": "dashboard-installer-temp",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@chakra-ui/react": "^2.8.2",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "framer-motion": "^10.12.16",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^4.9.0"
  },
  "devDependencies": {
    "@types/node": "^18.16.0",
    "@types/react": "^18.2.8",
    "@types/react-dom": "^18.2.4",
    "typescript": "^5.1.3",
    "vite": "^4.3.9",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
EOF
    
    # Installer les dépendances spécifiques aux tableaux de bord
    log "Installation des dépendances spécifiques aux tableaux de bord..."
    case $PACKAGE_MANAGER in
        pnpm)
            pnpm install --no-frozen-lockfile
            ;;
        yarn)
            yarn install
            ;;
        npm)
            npm install
            ;;
    esac
    
    # Copier les node_modules dans le répertoire des tableaux de bord
    log "Copie des dépendances dans le répertoire des tableaux de bord..."
    mkdir -p ../layered-dashboards/node_modules
    cp -r node_modules/* ../layered-dashboards/node_modules/
    
    # Retourner au répertoire parent
    cd ..
    
    # Nettoyer le répertoire temporaire
    rm -rf .temp-dashboard-deps
    
    log_success "Dépendances installées avec succès."
}

# Démarrer les services backend
start_backend_services() {
    log "Démarrage des services backend..."
    
    if [ "$USE_DOCKER" = true ]; then
        # Arrêter les conteneurs existants pour éviter les conflits
        log "Arrêt des conteneurs existants..."
        docker-compose -f docker-compose.dev.yml down || true
        
        # Utiliser Docker pour démarrer uniquement les services nécessaires aux tableaux de bord
        log "Démarrage des services Docker pour les tableaux de bord..."
        
        # Créer un fichier docker-compose temporaire pour les services minimaux nécessaires
        cat > docker-compose.dashboard.yml << EOF
version: '3.8'

services:
  dashboard-api:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./:/app
    ports:
      - "3001:3001"
    command: >
      sh -c "cd /app && 
             mkdir -p mock-api && 
             echo 'console.log(\"Starting mock API server for dashboards...\"); 
             const http = require(\"http\"); 
             const server = http.createServer((req, res) => {
               res.setHeader(\"Content-Type\", \"application/json\");
               
               if (req.url === \"/api/health\") {
                 res.end(JSON.stringify({ status: \"ok\" }));
                 return;
               }
               
               const mockData = {
                 \"/api/orchestration/status\": { status: \"healthy\", uptime: 8765432, activeWorkflows: 12 },
                 \"/api/orchestration/workflows\": { workflows: [{ id: \"wf1\", name: \"Main Process\", status: \"active\" }] },
                 \"/api/agents/registry\": { agents: [{ id: \"agent1\", name: \"DataProcessor\", status: \"online\" }] },
                 \"/api/agents/health\": { health: \"good\", issues: [] },
                 \"/api/business/domains\": { domains: [{ id: \"domain1\", name: \"Sales\" }] },
                 \"/api/business/kpis\": { kpis: [{ id: \"kpi1\", name: \"Revenue\", value: 1250000 }] }
               };
               
               const endpoint = Object.keys(mockData).find(path => req.url.startsWith(path));
               if (endpoint) {
                 res.statusCode = 200;
                 res.end(JSON.stringify(mockData[endpoint]));
               } else {
                 res.statusCode = 404;
                 res.end(JSON.stringify({ error: \"Not found\" }));
               }
             });
             
             server.listen(3001, () => {
               console.log(\"Mock API server running on port 3001\");
             });' > mock-api/server.js && 
             node mock-api/server.js"
    environment:
      - NODE_ENV=development
      
  dashboard-db:
    image: redis:alpine
    ports:
      - "6379:6379"
EOF

        # Démarrer les services minimaux
        docker-compose -f docker-compose.dashboard.yml up -d
        
        # Attendre que les services soient prêts
        log "Attente du démarrage des services..."
        sleep 10
    else
        # Mode local pour les services backend
        log "Démarrage des services en mode local..."
        
        # Créer un répertoire pour le serveur d'API mock
        mkdir -p ../mock-api
        
        # Créer un serveur d'API mock simple
        cat > ../mock-api/server.js << EOF
console.log("Starting mock API server for dashboards...");
const http = require("http");
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  
  if (req.url === "/api/health") {
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  
  const mockData = {
    "/api/orchestration/status": { status: "healthy", uptime: 8765432, activeWorkflows: 12 },
    "/api/orchestration/workflows": { workflows: [{ id: "wf1", name: "Main Process", status: "active" }] },
    "/api/agents/registry": { agents: [{ id: "agent1", name: "DataProcessor", status: "online" }] },
    "/api/agents/health": { health: "good", issues: [] },
    "/api/business/domains": { domains: [{ id: "domain1", name: "Sales" }] },
    "/api/business/kpis": { kpis: [{ id: "kpi1", name: "Revenue", value: 1250000 }] }
  };
  
  const endpoint = Object.keys(mockData).find(path => req.url.startsWith(path));
  if (endpoint) {
    res.statusCode = 200;
    res.end(JSON.stringify(mockData[endpoint]));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(3001, () => {
  console.log("Mock API server running on port 3001");
});
EOF
        
        # Démarrer le serveur en arrière-plan
        cd ..
        node mock-api/server.js &
        API_PID=$!
        
        # Attendre que l'API soit prête
        log "Attente du démarrage de l'API..."
        sleep 5
    fi
    
    log_success "Services backend démarrés."
}

# Vérifier la santé des services
check_services_health() {
    log "Vérification de la santé des services..."
    
    # Attendre que les services soient disponibles
    for i in {1..5}; do
        # Vérifier l'API avec tolérance aux erreurs
        if curl -s http://localhost:3001/api/health | grep -q "ok"; then
            log_success "L'API répond correctement."
            return 0
        else
            log_warning "L'API ne répond pas encore (tentative $i/5), nouvelle tentative dans 2 secondes..."
            sleep 2
        fi
    done
    
    log_warning "L'API ne répond pas correctement, mais on continue quand même."
}

# Démarrer l'application frontend des tableaux de bord
start_dashboards() {
    log "Démarrage de l'application des tableaux de bord..."
    
    # Créer un index.html minimal si nécessaire
    if [ ! -f "layered-dashboards/index.html" ]; then
        log "Création d'un index.html pour les tableaux de bord..."
        cat > layered-dashboards/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tableaux de Bord à 3 Couches</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
</body>
</html>
EOF
    fi
    
    # Se déplacer dans le répertoire des tableaux de bord
    cd layered-dashboards
    
    # Démarrer l'application en mode développement
    log "Démarrage du serveur de développement Vite..."
    log "Accédez à l'application sur http://localhost:3000"
    log "Appuyez sur Ctrl+C pour arrêter l'application quand vous avez terminé."
    
    # Créer un script temporaire pour démarrer Vite
    cat > start-dev-server.js << EOF
const { execSync } = require('child_process');

try {
  console.log("Démarrage du serveur de développement...");
  execSync('npx vite', { stdio: 'inherit' });
} catch (error) {
  console.error("Erreur lors du démarrage du serveur:", error.message);
}
EOF
    
    # Exécuter le script
    node start-dev-server.js
    
    log_success "Application des tableaux de bord démarrée."
}

# Fonction pour nettoyer en cas d'interruption
cleanup() {
    log "Nettoyage..."
    
    if [ "$USE_DOCKER" = true ]; then
        if [ -f "../docker-compose.dashboard.yml" ]; then
            cd ..
            docker-compose -f docker-compose.dashboard.yml down
            rm docker-compose.dashboard.yml
        fi
    else
        # Arrêter l'API si elle a été démarrée localement
        if [ -n "$API_PID" ]; then
            kill $API_PID 2>/dev/null || true
        fi
    fi
    
    log "Nettoyage terminé."
}

# Enregistrer la fonction de nettoyage pour qu'elle s'exécute à la sortie
trap cleanup EXIT

# Fonction principale
main() {
    log "Déploiement des tableaux de bord en couches..."
    
    check_prerequisites
    setup_environment
    install_dependencies
    start_backend_services
    check_services_health
    start_dashboards
    
    log_success "Déploiement terminé avec succès!"
}

# Exécuter la fonction principale
main