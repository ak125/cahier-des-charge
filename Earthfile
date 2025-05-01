VERSION 0.7

# Variables globales pour la configuration
ARG NODE_VERSION=20
ARG NX_CLOUD_ACCESS_TOKEN=""
ARG DEPLOY_ENV="dev"
ARG USE_CACHE="true"
ARG CACHE_REPO="cache/mcp-monorepo"
ARG WEBHOOK_URL=""

# Image de base avec des outils pré-installés
base:
FROM node:${NODE_VERSION}-slim

# Installation des dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    make \
    g++ \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Installation de pnpm
RUN curl -fsSL https://get.pnpm.io/install.sh | sh - \
    && ln -s /root/.local/share/pnpm/pnpm /usr/local/bin/pnpm

# Configuration de l'environnement
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NX_CLOUD_ACCESS_TOKEN=${NX_CLOUD_ACCESS_TOKEN}
WORKDIR /app

# Gestion des dépendances avec cache intelligent
deps:
FROM +base

# Copie des fichiers de configuration et des packages pour optimiser le cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/*/package.json ./apps-temp/
COPY packages/*/package.json ./packages-temp/

# Installation des dépendances avec pnpm et cache
RUN --mount=type=cache,target=/root/.pnpm-store \
    if [ "$USE_CACHE" = "true" ]; then \
    pnpm install --frozen-lockfile; \
    else \
    pnpm install --no-frozen-lockfile; \
    fi

# Sauvegarde des node_modules pour les étapes suivantes
SAVE ARTIFACT /app/node_modules node_modules
SAVE ARTIFACT /app AS LOCAL .pnpm-cache

# Génération du graphe de dépendances Nx pour améliorer les builds affectés
nx-deps:
FROM +deps
COPY --dir apps packages ./
COPY nx.json tsconfig*.json .eslintrc* ./

# Génération du fichier de dépendances Nx
RUN npx nx graph --file=.nx/deps.json

# Sauvegarde comme artefact local
SAVE ARTIFACT /app/.nx/deps.json AS LOCAL .nx/deps.json

# Lint avec Nx affected
lint:
FROM +nx-deps
COPY . .
ARG AFFECTED_ARGS="--all"

# Exécution du lint uniquement sur les projets affectés
RUN pnpm nx affected:lint ${AFFECTED_ARGS}

SAVE ARTIFACT /app/node_modules AS LOCAL node_modules

# Tests avec Nx affected pour exécution parallèle et caching intelligent
test:
FROM +nx-deps
COPY . .
ARG AFFECTED_ARGS="--all"

# Exécution des tests avec JWT
RUN pnpm nx affected:test ${AFFECTED_ARGS}

# Sauvegarde des rapports de couverture
SAVE ARTIFACT /app/coverage AS LOCAL coverage

# Vérification des types TypeScript sur les projets affectés
typecheck:
FROM +nx-deps
COPY . .
ARG AFFECTED_ARGS="--all"

# Vérification des types avec Nx
RUN pnpm nx affected --target=typecheck ${AFFECTED_ARGS}

# Build des projets affectés avec Nx
build:
FROM +nx-deps
COPY . .
ARG AFFECTED_ARGS="--all"
ARG PRODUCTION="true"

# Configuration conditionnelle pour la production
RUN if [ "$PRODUCTION" = "true" ]; then \
    pnpm nx affected:build ${AFFECTED_ARGS} --prod; \
    else \
    pnpm nx affected:build ${AFFECTED_ARGS}; \
    fi

# Sauvegarde des builds comme artefacts
SAVE ARTIFACT /app/dist AS LOCAL dist

# Scripts des agents MCP
mcp-scripts:
FROM +deps
COPY ./agents ./agents
COPY ./config/mcp ./config/mcp

# Construction des scripts MCP
RUN cd agents && pnpm build

# Sauvegarde des scripts générés
SAVE ARTIFACT /app/agents/dist AS LOCAL agents/dist

# Documentation avec Docusaurus
docs-build:
FROM +deps
COPY . .

# Installation des dépendances Docusaurus si nécessaires
RUN pnpm add -D @docusaurus/core @docusaurus/preset-classic

# Génération de la documentation
RUN cd documentation-site && pnpm build

# Sauvegarde du site statique généré
SAVE ARTIFACT /app/documentation-site/build AS LOCAL documentation-site/build

# Image Docker pour la documentation
docs-image:
FROM nginx:alpine
COPY +docs-build/documentation-site/build /usr/share/nginx/html
EXPOSE 80
SAVE IMAGE mcp-docs:${DEPLOY_ENV}

# Intégration CI complète
ci:
BUILD +nx-deps
BUILD +lint
BUILD +typecheck
BUILD +test
BUILD +build
BUILD +docs-build

# Notification de statut via webhook (optionnel)
RUN if [ ! -z "$WEBHOOK_URL" ]; then \
    curl -X POST -H "Content-Type: application/json" \
    -d '{"status": "success", "env": "'"$DEPLOY_ENV"'", "build": true}' \
    $WEBHOOK_URL; \
    fi

# Image Docker pour le déploiement de l'application monorepo
app-image:
FROM +base
COPY +build/dist /app/dist
COPY package.json pnpm-workspace.yaml ./

# Installation des dépendances de production uniquement
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --prod --frozen-lockfile

# Configuration du point d'entrée selon l'environnement
ARG APP="api"
RUN echo '#!/bin/sh\ncd /app && node dist/apps/'"$APP"'/main.js' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
SAVE IMAGE mcp-app-${APP}:${DEPLOY_ENV}

# Déploiement GitHub Actions intégré
github-actions-deploy:
FROM +base
ARG GITHUB_TOKEN=""
RUN --secret GITHUB_TOKEN=$GITHUB_TOKEN \
    if [ ! -z "$GITHUB_TOKEN" ]; then \
    echo "Configuration du déploiement GitHub Actions"; \
    # Commandes pour déclencher un déploiement via GitHub Actions \
    fi

# Commande pour générer les configurations de déploiement
generate-deploy-config:
FROM +base
COPY +nx-deps/.nx/deps.json /tmp/deps.json
COPY ./scripts/generate-deploy-config.js ./

# Génération des fichiers de configuration basés sur les dépendances
RUN node ./scripts/generate-deploy-config.js --env=${DEPLOY_ENV} --deps=/tmp/deps.json

SAVE ARTIFACT /app/deployment-${DEPLOY_ENV}.yaml AS LOCAL deployment-${DEPLOY_ENV}.yaml

# Cible de déploiement qui déclenche toute la chaîne
deploy:
BUILD +ci
ARG ENV=${DEPLOY_ENV}
BUILD --build-arg DEPLOY_ENV=${ENV} +app-image
BUILD --build-arg DEPLOY_ENV=${ENV} +docs-image
BUILD --build-arg DEPLOY_ENV=${ENV} +generate-deploy-config

# Notification de déploiement via webhook
RUN if [ ! -z "$WEBHOOK_URL" ]; then \
    curl -X POST -H "Content-Type: application/json" \
    -d '{"status": "deployed", "env": "'"$ENV"'"}' \
    $WEBHOOK_URL; \
    fi

# Message de succès
RUN echo "🚀 Déploiement de l'environnement ${ENV} terminé avec succès!"

# Commande locale pour initialiser le cache Nx Cloud
init-nx-cloud:
LOCALLY
RUN echo "⚙️ Configuration de Nx Cloud..."
RUN npx nx connect-to-nx-cloud
RUN echo "✅ Nx Cloud configuré avec succès!"