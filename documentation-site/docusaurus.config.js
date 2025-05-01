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
          editUrl:
            'https://github.com/votre-organisation/migration-ai-tools/edit/main/documentation-site/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/votre-organisation/migration-ai-tools/edit/main/documentation-site/blog/',
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
