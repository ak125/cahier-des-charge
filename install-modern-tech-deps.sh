#!/bin/bash
# Script d'installation des dépendances pour les nouvelles technologies
# Date: 9 mai 2025
# Usage: ./install-modern-tech-deps.sh

# Afficher un message de log
log() {
  echo -e "\033[1;34m[INSTALL]\033[0m $1"
}

# Afficher une erreur
error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1"
  exit 1
}

# Afficher un avertissement
warn() {
  echo -e "\033[1;33m[WARNING]\033[0m $1"
}

# Afficher un succès
success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

# Vérifier si la commande pnpm est disponible
if ! command -v pnpm &> /dev/null; then
  error "pnpm n'est pas installé. Veuillez l'installer avec 'npm install -g pnpm'"
fi

log "Installation des dépendances pour les technologies modernes..."

# Créer un fichier temporaire pour les dépendances
TEMP_FILE=$(mktemp)

cat > "$TEMP_FILE" << EOF
{
  "dependencies": {
    "@temporalio/client": "^1.8.1",
    "@temporalio/worker": "^1.8.1",
    "@temporalio/common": "^1.8.1",
    "@temporalio/workflow": "^1.8.1",
    "@temporalio/activity": "^1.8.1",
    "bullmq": "^4.14.3",
    "ioredis": "^5.3.2",
    "@sinclair/typebox": "^0.31.28",
    "ajv": "^8.12.0",
    "ajv-formats": "^2.1.1",
    "@asteasolutions/openapi3-ts": "^0.27.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.8",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1"
  }
}
EOF

# Installer les dépendances dans le package business
log "Installation des dépendances dans packages/business..."
cd /workspaces/cahier-des-charge/packages/business || error "Le répertoire packages/business n'existe pas"
pnpm add $(jq -r '.dependencies | to_entries[] | "\(.key)@\(.value)"' "$TEMP_FILE") || warn "Problème lors de l'installation des dépendances"
pnpm add -D $(jq -r '.devDependencies | to_entries[] | "\(.key)@\(.value)"' "$TEMP_FILE") || warn "Problème lors de l'installation des dépendances de développement"

# Installer les dépendances dans l'application mcp-server
log "Installation des dépendances dans apps/mcp-server..."
cd /workspaces/cahier-des-charge/apps/mcp-server || error "Le répertoire apps/mcp-server n'existe pas"
pnpm add ioredis@5.3.2 || warn "Problème lors de l'installation de ioredis"

# Nettoyer le fichier temporaire
rm "$TEMP_FILE"

# Ajouter une entrée dans le fichier package.json pour les scripts
log "Ajout des scripts de test..."
cd /workspaces/cahier-des-charge || error "Impossible de revenir au répertoire racine"

if [ -f "jest.config.js" ]; then
  log "Mise à jour de jest.config.js pour inclure les nouveaux tests"
else
  cat > "jest.config.js" << EOF
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'packages/business/src/**/*.ts',
    'apps/mcp-server/src/**/*.ts',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
EOF
  success "Fichier jest.config.js créé"
fi

# Vérifier si Docker est installé pour Redis
if ! command -v docker &> /dev/null; then
  warn "Docker n'est pas installé. Il est recommandé pour exécuter Redis et Redis Stack"
  warn "Veuillez l'installer à partir de https://docs.docker.com/get-docker/"
else
  log "Vérification de l'existence des conteneurs Redis..."
  
  # Vérifier si le conteneur Redis Stack existe
  if ! docker ps -a | grep -q "redis-stack"; then
    log "Démarrage d'un conteneur Redis Stack..."
    docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest || \
      warn "Impossible de démarrer le conteneur Redis Stack. Si nécessaire, vous pouvez le démarrer manuellement."
  else
    # Vérifier si le conteneur est en cours d'exécution
    if ! docker ps | grep -q "redis-stack"; then
      log "Redémarrage du conteneur Redis Stack existant..."
      docker start redis-stack || warn "Impossible de démarrer le conteneur Redis Stack existant"
    else
      success "Le conteneur Redis Stack est déjà en cours d'exécution"
    fi
  fi

  # Vérifier si le conteneur Temporal est en cours d'exécution
  if ! docker ps -a | grep -q "temporal"; then
    log "Pour Temporal, vous pouvez utiliser la commande suivante pour démarrer un environnement de développement:"
    log "docker run --rm -p 7233:7233 -p 8233:8080 --network host temporalio/temporal:latest-auto-setup"
  fi
fi

log "Pour Temporal, veuillez consulter la documentation officielle pour démarrer un serveur de développement:"
log "https://docs.temporal.io/dev-guide/typescript/foundations#run-a-development-server"

success "Installation des dépendances terminée!"
echo ""
echo "Vous pouvez maintenant utiliser les technologies suivantes:"
echo "- Temporal.io pour l'orchestration de workflows complexes"
echo "- BullMQ pour les files d'attente rapides"
echo "- RedisJSON pour le stockage efficace de documents JSON"
echo "- OpenAPI 3.1 avec TypeBox pour la validation et documentation d'API"
echo ""
echo "Pour exécuter les tests, utilisez la commande suivante:"
echo "pnpm test"
