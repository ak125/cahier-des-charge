import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// Configuration pour la Documentation Générative Unifiée

const config: Config = {
  title: 'Documentation Générative Unifiée',
  tagline: 'Documentation centralisée et actualisée automatiquement pour le projet',
  favicon: 'img/favicon.ico',

  // URL de production du site
  url: 'https://votre-organisation.github.io',
  baseUrl: '/',

  organizationName: 'votre-organisation',
  projectName: 'cahier-des-charge',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Support multilingue - français par défaut
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Possibilité d'éditer directement depuis la documentation
          editUrl: 'https://github.com/votre-organisation/cahier-des-charge/tree/main/documentation-site/',
          // Générateurs de documentation automatique
          remarkPlugins: [require('remark-admonitions')],
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            title: 'Journal du projet',
            description: 'Journal des évolutions et mises à jour',
          },
          // Options pour la qualité des articles
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    // Plugin pour la documentation générée depuis JSDoc/TSDoc
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: [
          '../agents/index.ts',
          '../agents/seo-checker-agent.ts',
          '../agents/mcp-verifier.ts',
          '../agents/api'
        ],
        tsconfig: '../tsconfig.json',
        out: 'api',
        sidebar: {
          categoryLabel: 'API',
          position: 2,
          fullNames: true
        }
      },
    ],
    // Plugin pour la recherche dans la documentation
    '@docusaurus/plugin-content-search',
    // Plugin pour la navigation par catégories
    '@docusaurus/plugin-content-docs',
    // Plugin pour les visualisations interactives
    'docusaurus-plugin-mermaid'
  ],

  themeConfig: {
    // Image pour les réseaux sociaux
    image: 'img/documentation-sociale-card.jpg',
    navbar: {
      title: 'Documentation Unifiée',
      logo: {
        alt: 'Logo du projet',
        src: 'img/logo.svg',
      },
      items: [
        // Documentation principale
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        // Documentation API générée automatiquement
        {
          to: '/api',
          label: 'API',
          position: 'left'
        },
        // Section spécifique pour les agents IA
        {
          to: '/docs/agents',
          label: 'Agents IA',
          position: 'left'
        },
        // Journal des mises à jour
        { to: '/blog', label: 'Journal', position: 'left' },
        // Lien vers le dépôt GitHub
        {
          href: 'https://github.com/votre-organisation/cahier-des-charge',
          label: 'GitHub',
          position: 'right',
        },
        // Sélecteur de langue
        {
          type: 'localeDropdown',
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
              label: 'API',
              to: '/api',
            },
            {
              label: 'Agents IA',
              to: '/docs/agents',
            },
          ],
        },
        {
          title: 'Communauté',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/votre-projet',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/votre-projet',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/votre-projet',
            },
          ],
        },
        {
          title: 'Ressources',
          items: [
            {
              label: 'Journal',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/votre-organisation/cahier-des-charge',
            },
            {
              label: 'Signaler un problème',
              href: 'https://github.com/votre-organisation/cahier-des-charge/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Votre Organisation. Documentation générée automatiquement et construite avec Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'diff', 'json', 'yaml', 'php', 'typescript'],
    },
    // Activer la recherche algolia (à configurer)
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_API_KEY',
      indexName: 'YOUR_INDEX_NAME',
      contextualSearch: true,
    },
    // Configuration pour le plugin mermaid (diagrammes)
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
