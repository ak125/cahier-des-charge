---
title: Intégration de GitHub MCP Server dans le Pipeline IA
phase: automation
domain: integration, github
tags: [github, mcp, automation, pr, integration]
updatedAt: 2025-07-20
---

# 🧠 Intégration de GitHub MCP Server dans le Pipeline IA

## ✅ Objectifs

L'intégration du serveur Model Context Protocol (MCP) officiel de GitHub dans notre pipeline de migration IA permet de :

- **Automatiser la création de PRs** pour chaque fichier PHP migré
- **Ajouter des commentaires IA intelligents** sur les Pull Requests
- **Suivre l'état de migration** via commits, branches, labels et reviews
- **Centraliser le workflow** entre la génération IA et GitHub

Cette intégration renforce la traçabilité et la gouvernance du processus de migration tout en maintenant une interface humaine pour la validation finale.

## ⚙️ Installation & Configuration rapide

### Configuration dans VS Code + Docker

1. Ajoutez ce bloc dans `settings.json` (ou `.vscode/mcp.json`) :

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "github_token",
        "description": "GitHub Personal Access Token",
        "password": true
      }
    ],
    "servers": {
      "github": {
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "GITHUB_PERSONAL_ACCESS_TOKEN",
          "ghcr.io/github/github-mcp-server"
        ],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
        }
      }
    }
  }
}
```

### Configuration pour n8n

Pour l'intégration avec n8n, créez un fichier `.env` contenant :

