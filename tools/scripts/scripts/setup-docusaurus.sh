#!/bin/bash

# Script d'installation et de configuration de Docusaurus

echo "Installation et configuration de Docusaurus..."

# Vérification de la présence de Node.js et npm/yarn
if ! command -v node &> /dev/null; then
    echo "Node.js est requis mais n'est pas installé."
    exit 1
fi

# Création du projet Docusaurus
npx create-docusaurus@latest documentation-site classic

# Déplacement dans le répertoire du projet
cd documentation-site

# Personnalisation de la configuration
cat > docusaurus.config.js << 'EOF'
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Documentation Technique du Projet Migration',
  tagline: 'Documentation centralisée et interactive',
  url: 'https://votre-organisation.github.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'votre-organisation',
  projectName: 'migration-ai-tools',
  
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/votre-organisation/migration-ai-tools/edit/main/documentation-site/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/votre-organisation/migration-ai-tools/edit/main/documentation-site/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Migration Projet',
      logo: {
        alt: 'Logo du projet',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Documentation',
        },
        { to: '/blog', label: 'Journal de migration', position: 'left' },
        {
          href: 'https://github.com/votre-organisation/migration-ai-tools',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
            {
              label: 'Architecture',
              to: '/docs/category/architecture',
            },
          ],
        },
        {
          title: 'Communauté',
          items: [
            {
              label: 'Slack',
              href: '#',
            },
            {
              label: 'Teams',
              href: '#',
            },
          ],
        },
        {
          title: 'Plus',
          items: [
            {
              label: 'Journal de migration',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/votre-organisation/migration-ai-tools',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Votre Organisation, Inc.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['php', 'typescript', 'bash'],
    },
  },
};
EOF

# Création de la structure de dossiers de documentation
mkdir -p docs/{getting-started,architecture,agents,workflows,api,guides,conventions,planning}

# Création d'un fichier d'introduction
cat > docs/intro.md << 'EOF'
---
sidebar_position: 1
---

# Introduction

Bienvenue dans la documentation technique centralisée du projet de migration.

Cette documentation est conçue pour être un point d'entrée unique pour toutes les informations techniques relatives au projet. Que vous soyez un développeur, un chef de projet ou un autre membre de l'équipe, vous trouverez ici les ressources dont vous avez besoin.

## Structure de la documentation

Notre documentation est organisée selon les sections suivantes :

- **Démarrage Rapide** : Instructions pour commencer à utiliser le projet
- **Architecture** : Documentation sur l'architecture du système
- **Agents** : Informations sur les agents et leur développement
- **Workflows** : Description des workflows de migration et de test
- **API** : Documentation des APIs REST et internes
- **Guides** : Guides pratiques et résolution de problèmes
- **Conventions** : Conventions de développement
- **Planning** : Documents relatifs à la planification de la migration

## Bénéfices d'une documentation centralisée

1. **Accessibilité** : Toutes les informations sont disponibles à un seul endroit
2. **Cohérence** : Format uniforme et structure logique
3. **Maintenabilité** : Plus facile à maintenir et à mettre à jour
4. **Recherche** : Fonction de recherche intégrée pour trouver rapidement l'information
5. **Versionnement** : Possibilité de consulter les versions précédentes de la documentation

## Comment contribuer

Pour ajouter ou modifier de la documentation :

1. Clonez le dépôt Git
2. Modifiez ou ajoutez des fichiers Markdown dans le dossier approprié
3. Soumettez une pull request avec vos modifications

Nous encourageons toute l'équipe à contribuer à la documentation pour la maintenir à jour et pertinente.
EOF

# Création du fichier de catégorie pour l'architecture
mkdir -p docs/category
cat > docs/category/architecture.md << 'EOF'
---
sidebar_position: 2
---

# Architecture

Documentation relative à l'architecture du système, ses principes et sa structure.

Cette section contient les documents techniques sur les composants du système, leurs interactions et les principes architecturaux qui guident le développement du projet.
EOF

# Ajout des sidebars pour la navigation
cat > sidebars.js << 'EOF'
/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

module.exports = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Démarrage Rapide',
      items: [
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/quickstart',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'category/architecture',
        'architecture/overview',
        'architecture/design-principles',
        'architecture/structure',
      ],
    },
    {
      type: 'category',
      label: 'Agents',
      items: [
        'agents/overview',
        'agents/agent-development',
      ],
    },
    {
      type: 'category',
      label: 'Workflows',
      items: [
        'workflows/migration-workflow',
        'workflows/testing-workflow',
      ],
    },
    {
      type: 'category',
      label: 'API',
      items: [
        'api/rest-api',
        'api/internal-apis',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/troubleshooting',
        'guides/best-practices',
      ],
    },
    {
      type: 'category',
      label: 'Conventions',
      items: [
        'conventions/typescript-conventions',
      ],
    },
    {
      type: 'category',
      label: 'Planning',
      items: [
        'planning/migration-strategy',
        'planning/migration-plan',
      ],
    },
  ],
};
EOF

# Création de fichiers de base pour chaque section
echo "# Installation" > docs/getting-started/installation.md
echo "# Configuration" > docs/getting-started/configuration.md
echo "# Guide Rapide" > docs/getting-started/quickstart.md
echo "# Vue d'ensemble de l'architecture" > docs/architecture/overview.md
echo "# Principes de conception" > docs/architecture/design-principles.md
echo "# Structure du projet" > docs/architecture/structure.md
echo "# Vue d'ensemble des agents" > docs/agents/overview.md
echo "# Développement d'agents" > docs/agents/agent-development.md
echo "# Workflow de migration" > docs/workflows/migration-workflow.md
echo "# Workflow de test" > docs/workflows/testing-workflow.md
echo "# REST API" > docs/api/rest-api.md
echo "# APIs internes" > docs/api/internal-apis.md
echo "# Résolution de problèmes" > docs/guides/troubleshooting.md
echo "# Bonnes pratiques" > docs/guides/best-practices.md

# Création d'un script de migration pour déplacer la documentation existante
cat > ../migrate-documentation.sh << 'EOF'
#!/bin/bash

# Script pour migrer la documentation existante vers la nouvelle structure Docusaurus

echo "Migration de la documentation existante..."

# Création d'un répertoire temporaire pour la documentation existante
mkdir -p temp_docs

# Copie des fichiers markdown existants
find .. -name "*.md" -not -path "../documentation-site/*" -not -path "../node_modules/*" -exec cp --parents {} temp_docs/ \;

# Maintenant on peut trier et déplacer les fichiers vers la bonne structure
# Par exemple, déplacer les fichiers d'architecture
if [ -d "temp_docs/../docs/architecture" ]; then
  cp temp_docs/../docs/architecture/* docs/architecture/
fi

# Déplacer les conventions
if [ -d "temp_docs/../docs/conventions" ]; then
  cp temp_docs/../docs/conventions/* docs/conventions/
fi

# Déplacer les documents de planification
if [ -d "temp_docs/../docs/planning" ]; then
  cp temp_docs/../docs/planning/* docs/planning/
fi

# Déplacer la documentation des agents
if [ -d "temp_docs/../agents" ]; then
  mkdir -p docs/agents/specific-agents
  cp temp_docs/../agents/AGENTS.md docs/agents/overview.md
  # Copier les autres fichiers des agents
  find temp_docs/../agents -name "*.md" -not -name "AGENTS.md" -exec cp {} docs/agents/specific-agents/ \;
fi

# Nettoyage
rm -rf temp_docs

echo "Migration de la documentation terminée."
EOF

chmod +x ../migrate-documentation.sh

echo "Configuration de Docusaurus terminée."
echo "Pour lancer le serveur de développement, exécutez : cd documentation-site && npm start"
echo "Pour migrer la documentation existante, exécutez : cd documentation-site && ./migrate-documentation.sh"