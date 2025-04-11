# Procédure d'installation du pipeline IA de migration

## 🛠️ Prérequis techniques

- Node.js 20+
- Docker + Docker Compose
- PostgreSQL (via Docker ou instance distante)
- Redis (via Docker ou service)
- Accès SSH/API GitHub
- n8n (auto-hébergé ou Cloud)
- Environnement Linux/Unix recommandé (pour scripts)

## 📦 Clonage et préparation du dépôt

```bash
git clone https://github.com/[ton-org]/remix-nestjs-monorepo.git
cd remix-nestjs-monorepo

# Installation des dépendances
npm install

# Configuration des variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos paramètres

# Préparation du monorepo
npm run setup

# Initialisation de Prisma
npm run prisma:generate
```

## 🐳 Configuration de l'environnement Docker

```bash
# Démarrer l'infrastructure de base
docker-compose up -d db redis

# Attendre que la base de données soit prête
npm run wait-for-db

# Lancer les migrations initiales
npm run prisma:migrate
```

## 🤖 Installation des agents IA

```bash
# Installation des agents IA
cd tools/agents
npm install

# Configuration des agents
cp config.example.json config.json
# Éditer config.json avec vos clés API et paramètres

# Vérification de l'installation
npm run test-agents
```

## 🔄 Configuration de n8n

### Méthode 1: n8n auto-hébergé

```bash
# Démarrer n8n via Docker Compose
docker-compose up -d n8n

# Attendre que n8n soit disponible
echo "Attente du démarrage de n8n..."
sleep 15

# Importer les workflows
cd tools/n8n
npm run import-workflows
```

### Méthode 2: n8n Cloud

1. Connectez-vous à votre compte n8n Cloud
2. Créez un nouveau espace de travail dédié au projet
3. Configurez les variables d'environnement requises:
   - `GITHUB_TOKEN`: Token d'accès GitHub
   - `POSTGRES_CONNECTION`: Chaîne de connexion PostgreSQL
   - `REDIS_URL`: URL de connexion Redis
   - `OPENAI_API_KEY`: Clé API OpenAI (ou autre modèle)
4. Importez manuellement les workflows depuis `tools/n8n/workflows/*.json`

## 🔑 Configuration des secrets et tokens

```bash
# Génération du fichier .env.local pour les clés d'API
./scripts/generate-secrets.sh

# Cryptage des secrets pour le déploiement
./scripts/encrypt-secrets.sh

# Configuration des variables d'environnement GitHub
./scripts/setup-github-secrets.sh
```

## 📋 Vérification de l'installation

```bash
# Exécuter les tests de base
npm run test

# Vérifier la connectivité des agents
npm run test:agents

# Vérifier les workflows n8n
npm run test:workflows

# Générer un rapport d'installation
npm run generate-setup-report
```

## 🚀 Lancement des premiers tests de migration

```bash
# Déclencher un test de migration sur un module simple
./scripts/trigger-migration-test.sh modules/simple-module

# Vérifier les logs
./scripts/check-migration-logs.sh

# Visualiser les résultats sur le dashboard
echo "Ouvrir http://localhost:3000/migration-dashboard"
```

## 📊 Validation de l'installation

Une installation réussie doit afficher:

- ✅ Base de données PostgreSQL accessible
- ✅ Redis fonctionnel
- ✅ Agents IA opérationnels
- ✅ Workflows n8n importés et actifs
- ✅ Monorepo prêt pour le développement
- ✅ Scripts de migration tests exécutés avec succès

En cas d'erreur lors de l'installation, consultez le fichier de diagnostic généré dans `logs/setup-diagnostic.log` et la section troubleshooting de la documentation.
