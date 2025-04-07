# Projet Codespaces

Ce projet est conçu pour faciliter le développement dans un environnement Codespaces. Il comprend un ensemble de fichiers et de scripts pour automatiser l'installation et la configuration d'un cahier des charges.

## Structure du projet

```
projet-codespaces
├── .devcontainer
│   ├── devcontainer.json
│   └── Dockerfile
├── scripts
│   └── setup.sh
├── cahier-des-charges.zip.b64
├── .gitignore
└── README.md
```

## Fichiers principaux

- **.devcontainer/devcontainer.json** : Configuration de l'environnement de développement dans Codespaces. Définit les paramètres nécessaires pour le conteneur, tels que l'image de base et les extensions à installer.

- **.devcontainer/Dockerfile** : Utilisé pour construire l'image Docker pour l'environnement de développement. Contient des instructions pour installer des dépendances et configurer l'environnement.

- **scripts/setup.sh** : Script shell qui automatise l'installation du cahier des charges. Il décode un fichier `.b64`, extrait son contenu, installe Pandoc si nécessaire, et donne les droits d'exécution à un script d'exportation.

- **cahier-des-charges.zip.b64** : Archive encodée en base64 contenant le cahier des charges à extraire.

- **.gitignore** : Spécifie les fichiers et répertoires à ignorer par Git lors des commits.

## Installation

Pour installer le projet, exécutez le script `setup.sh` dans le répertoire `scripts`. Ce script se charge de décoder et d'extraire le cahier des charges, ainsi que d'installer les dépendances nécessaires.

```bash
cd scripts
bash setup.sh
```

## Utilisation

Après l'installation, vous pouvez accéder au cahier des charges extrait dans le répertoire `cahier-des-charges`. Utilisez les fichiers et les scripts fournis pour travailler sur le projet.

## Contribuer

Les contributions sont les bienvenues ! Veuillez soumettre une demande de tirage pour toute amélioration ou correction.