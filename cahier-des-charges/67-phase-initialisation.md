# 🔒 Phase 0 — Initialisation & Sécurisation du Contexte

Cette phase vise à **figer l'état du projet legacy**, garantir la traçabilité complète des données, du code, et des règles de configuration avant toute transformation.

## 📋 Étapes clés

### ✅ Étape 0.1 – Geler le code PHP via Git

- **Action** : Créer un tag Git `legacy-vFinal`  
- **Complément** : Utiliser `git bundle` pour une archive hors-ligne
- **Objectif** : Avoir une sauvegarde immuable et versionnée du code source

```bash
git tag legacy-vFinal
git bundle create legacy-vFinal.bundle --all
```

### 0.2 Export de la base de données

L'exportation de la base de données MySQL, compressée et hashée, garantit l'intégrité et la vérifiabilité des données lors de la migration.

```bash
# Export complet de la base de données avec structure et données
mysqldump --set-gtid-purged=OFF --triggers --routines --events --single-transaction \
  --no-tablespaces --hex-blob --complete-insert --default-character-set=utf8mb4 \
  -u username -p database_name > database_export.sql

# Compression du fichier d'export
gzip -9 database_export.sql

# Génération d'un hash SHA256 pour vérification ultérieure
sha256sum database_export.sql.gz > database_export.sql.gz.sha256
```

### 0.3 Sauvegarde des configurations serveur

La sauvegarde du fichier .htaccess est cruciale pour conserver les règles de redirection et les configurations spécifiques au serveur Apache.

```bash
# Création d'un répertoire de sauvegarde pour les configurations
mkdir -p backup/server-config

# Copie des fichiers .htaccess (y compris ceux dans les sous-répertoires)
find /var/www/html -name ".htaccess" -exec cp --parents {} backup/server-config \;

# Sauvegarde des configurations spécifiques Apache (si présentes)
cp /etc/apache2/sites-available/000-default.conf backup/server-config/

# Sauvegarde des configurations PHP
cp /etc/php/7.4/apache2/php.ini backup/server-config/
```

### 0.4 Configuration des environnements Docker

Le verrouillage des versions Docker via des digests assure la reproductibilité des environnements, minimisant les risques liés aux mises à jour inattendues des images.

```dockerfile
# Exemple de Dockerfile avec version verrouillée via digest
FROM node:18.16.0@sha256:7e77d632817c0e42f52bbb884f266bfe0ebf3a445990f64e3fb6e4095e2e7e98

# Configuration de l'environnement
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Exposition des ports
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
```

## 🛠️ Astuce avancée

Envisagez l'utilisation de Docker Compose pour orchestrer vos services, ce qui facilitera la gestion des dépendances et la configuration des conteneurs.

```yaml
# docker-compose.yml exemple
version: '3.8'

services:
  nestjs-api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    image: nestjs-api:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/mydb
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  remix-frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    image: remix-frontend:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - API_URL=http://nestjs-api:3000
    ports:
      - "8080:8080"
    depends_on:
      - nestjs-api

  postgres:
    image: postgres:14.5@sha256:9eabcad4fd68aaca85eb411e45b4309f47d65cf02256c1ac5a49a3fed5fe51c1
    restart: unless-stopped
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 📋 Liste de vérification pour la phase d'initialisation

- [ ] Archive Git créée et vérifiée
- [ ] Base de données exportée, compressée et hashée
- [ ] Fichiers .htaccess et configurations serveur sauvegardés
- [ ] Images Docker verrouillées avec des digests
- [ ] Docker Compose configuré pour l'environnement de développement
- [ ] Documentation des étapes effectuées
- [ ] Copies de sauvegarde stockées dans plusieurs emplacements sécurisés

Cette phase d'initialisation établit la fondation solide nécessaire pour entamer le processus de migration avec confiance et sécurité.
