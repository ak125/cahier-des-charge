VERSION 0.7

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim

# Définition des cibles communes
deps:
    WORKDIR /app
    COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
    COPY apps/*/package.json ./apps/
    COPY packages/*/package.json ./packages/
    RUN npm install -g pnpm
    RUN pnpm install --frozen-lockfile
    SAVE ARTIFACT /app/node_modules

lint:
    FROM +deps
    COPY . .
    RUN pnpm lint
    SAVE ARTIFACT /app/node_modules AS LOCAL node_modules

test:
    FROM +deps
    COPY . .
    RUN pnpm test
    SAVE ARTIFACT /app/reports AS LOCAL reports

# Build Remix
remix-build:
    FROM +deps
    COPY . .
    WORKDIR /app
    RUN pnpm --filter=remix build
    SAVE ARTIFACT /app/apps/remix/dist AS LOCAL apps/remix/dist

# Build NestJS
nestjs-build:
    FROM +deps
    COPY . .
    WORKDIR /app
    RUN pnpm --filter=nestjs build
    SAVE ARTIFACT /app/apps/nestjs/dist AS LOCAL apps/nestjs/dist

# Image Docker pour Remix
remix-image:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app
    COPY --from=+remix-build /app/apps/remix/dist /app
    COPY --from=+remix-build /app/node_modules /app/node_modules
    COPY apps/remix/package.json .
    RUN npm install -g pm2
    ENTRYPOINT ["pm2-runtime", "start", "server.js"]
    SAVE IMAGE mcp-remix:latest

# Image Docker pour NestJS
nestjs-image:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app
    COPY --from=+nestjs-build /app/apps/nestjs/dist /app
    COPY --from=+nestjs-build /app/node_modules /app/node_modules
    COPY apps/nestjs/package.json .
    RUN npm install -g pm2
    ENTRYPOINT ["pm2-runtime", "start", "main.js"]
    SAVE IMAGE mcp-nestjs:latest

# Image Docker pour Temporal Worker
temporal-worker:
    FROM +deps
    COPY . .
    RUN pnpm --filter=temporal-worker build
    ENTRYPOINT ["node", "dist/worker.js"]
    SAVE IMAGE mcp-temporal-worker:latest

# Cible CI
ci:
    BUILD +deps
    BUILD +lint
    BUILD +test
    BUILD +remix-build
    BUILD +nestjs-build

# Cible de déploiement
deploy:
    BUILD +remix-image
    BUILD +nestjs-image
    BUILD +temporal-worker