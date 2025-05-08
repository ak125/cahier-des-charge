VERSION 0.7

ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine

deps:
COPY package.json package-lock.json ./
RUN npm ci
SAVE ARTIFACT node_modules /node_modules AS LOCAL node_modules

lint:
FROM +deps
COPY . .
RUN npx nx affected --target=lint --all

typecheck:
FROM +deps
COPY . .
RUN npx nx affected --target=typecheck --all

test:
FROM +deps
COPY . .
RUN npx nx affected --target=test --all
SAVE ARTIFACT coverage /coverage AS LOCAL coverage

build-all:
FROM +deps
COPY . .
RUN npx nx run-many --target=build --all --parallel=3 --configuration=production
SAVE ARTIFACT dist /dist AS LOCAL dist

build-frontend:
FROM +deps
COPY . .
RUN npx nx build frontend --configuration=production
SAVE ARTIFACT dist/apps/frontend /frontend-dist AS LOCAL dist/apps/frontend

build-backend:
FROM +deps
COPY . .
RUN npx nx build backend --configuration=production
SAVE ARTIFACT dist/apps/backend /backend-dist AS LOCAL dist/apps/backend

build-mcp-server:
FROM +deps
COPY . .
RUN npx nx build mcp-server --configuration=production
SAVE ARTIFACT dist/apps/mcp-server /mcp-server-dist AS LOCAL dist/apps/mcp-server

docker-frontend:
FROM +build-frontend
ARG DOCKER_TAG=latest
COPY +build-frontend/frontend-dist /app
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Configuration du container
WORKDIR /app
CMD ["nginx", "-g", "daemon off;"]

# Construction de l'image Docker
SAVE IMAGE frontend:${DOCKER_TAG}

docker-backend:
FROM +build-backend
ARG DOCKER_TAG=latest
COPY +build-backend/backend-dist /app

# Configuration du container
WORKDIR /app
CMD ["node", "main.js"]

# Construction de l'image Docker
SAVE IMAGE backend:${DOCKER_TAG}

docker-mcp-server:
FROM +build-mcp-server
ARG DOCKER_TAG=latest
COPY +build-mcp-server/mcp-server-dist /app

# Configuration du container
WORKDIR /app
CMD ["node", "main.js"]

# Construction de l'image Docker
SAVE IMAGE mcp-server:${DOCKER_TAG}

ci:
BUILD +deps
BUILD +lint
BUILD +typecheck
BUILD +test
BUILD +build-all