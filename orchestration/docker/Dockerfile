FROM mcr.microsoft.com/devcontainers/typescript-node:18

# Installer les dépendances pour PHP et autres outils
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    php-cli \
    php-xml \
    php-curl \
    php-mysql \
    php-mbstring \
    php-zip \
    unzip \
    wget \
    git \
    jq \
    curl \
    sqlite3 \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Installer composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Installer les outils globaux de Node.js
RUN npm install -g pnpm turbo typescript ts-node n8n@0.234.0

# Créer un utilisateur non-root
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Configurer l'environnement de travail
WORKDIR /workspaces/migration-pipeline

# Copier les fichiers de configuration
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY config/mcp-server-config.json ./config/

# Configurer les permissions pour n8n
RUN mkdir -p /home/$USERNAME/.n8n && chown -R $USERNAME:$USERNAME /home/$USERNAME/.n8n

# Exposer les ports nécessaires
EXPOSE 3000 5678 8080

# Script d'entrée pour initialiser l'environnement
COPY ./scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Définir la commande par défaut
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]