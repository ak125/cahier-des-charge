FROM node:20-slim

# Installation des dépendances système nécessaires pour PHP Parser
RUN apt-get update && \
    apt-get install -y php-cli git && \
    rm -rf /var/lib/apt/lists/*

# Configuration de l'environnement de travail
WORKDIR /app

# Copie des fichiers de dépendances pour installation
COPY package*.json ./
RUN npm install

# Copie du reste du code source
COPY . .

# Construction du projet (si TypeScript)
RUN npm run build

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000
ENV MCP_SERVER_ID=php-analyzer
ENV LOG_LEVEL=info

# Exposition du port pour le serveur MCP
EXPOSE 3000

# Commande de démarrage avec possibilité de substitution
CMD ["npm", "start"]