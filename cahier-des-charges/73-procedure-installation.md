# Procédure d'installation du pipeline IA de migration

## 🚀 Vue d'ensemble

Cette procédure détaille l'installation complète du pipeline IA de migration, conçue pour être claire, versionnée et facilement partageable entre les équipes.

## 📋 Prérequis techniques

### Environnement requis

| Composant | Version | Notes |
|-----------|---------|-------|
| Node.js | 20.x+ | LTS recommandée |
| Docker | 24.x+ | Docker Compose V2 |
| Git | 2.40.0+ | |
| Python | 3.10+ | Pour scripts utilitaires |
| RAM | 16Go min. | 32Go recommandés |
| Stockage | 100Go SSD | |

### Services externes

| Service | Usage | Alternative auto-hébergée |
|---------|-------|---------------------------|
| GitHub | Gestion du code et CI/CD | GitLab |
| OpenAI API | Agents IA | Ollama avec LLM local |
| n8n.cloud | Workflows d'orchestration | n8n self-hosted |
| MongoDB Atlas | Stockage des résultats | MongoDB Community |

## 🛠️ Procédure d'installation

### 1. Préparation de l'environnement

```bash
# Créer le répertoire du projet
mkdir -p migration-ai-pipeline && cd migration-ai-pipeline

# Cloner le dépôt d'installation
git clone https://github.com/organisation/migration-ai-tools.git .

# Copier le fichier d'environnement par défaut
cp .env.example .env

# Éditer les variables d'environnement
nano .env
```

Variables essentielles à configurer dans `.env`:
