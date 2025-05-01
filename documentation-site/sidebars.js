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
      items: ['agents/overview', 'agents/agent-development'],
    },
    {
      type: 'category',
      label: 'Workflows',
      items: ['workflows/migration-workflow', 'workflows/testing-workflow'],
    },
    {
      type: 'category',
      label: 'API',
      items: ['api/rest-api', 'api/internal-apis'],
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/troubleshooting', 'guides/best-practices'],
    },
    {
      type: 'category',
      label: 'Conventions',
      items: ['conventions/typescript-conventions'],
    },
    {
      type: 'category',
      label: 'Planning',
      items: ['planning/migration-strategy', 'planning/migration-plan'],
    },
  ],
};
