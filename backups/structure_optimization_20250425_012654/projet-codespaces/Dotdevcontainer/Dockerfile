FROM ubuntu:20.04

# Installer les dépendances nécessaires
RUN apt-get update && apt-get install -y \
    unzip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Installer Pandoc
RUN apt-get update && apt-get install -y pandoc

# Définir le répertoire de travail
WORKDIR /workspace

# Copier le script d'installation
COPY ../scripts/setup.sh /usr/local/bin/setup.sh

# Donner les droits d'exécution au script
RUN chmod +x /usr/local/bin/setup.sh

# Exécuter le script d'installation
CMD ["/usr/local/bin/setup.sh"]