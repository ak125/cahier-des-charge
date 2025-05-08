/**
 * generate-guides.ts
 * 
 * Script qui génère des guides interactifs expliquant l'utilisation des fonctionnalités
 * principales de la plateforme, avec des exemples de code exécutables.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '@nestjs/common';
import glob from 'fast-glob';

const logger = new Logger('GuidesGenerator');

interface GuideMetadata {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    difficulty: 'débutant' | 'intermédiaire' | 'avancé';
    estimatedTime: string;
    author?: string;
    updated?: string;
}

/**
 * Génère les guides interactifs pour la documentation
 * @param outputDir Dossier de sortie pour les fichiers markdown
 */
export async function generateGuides(outputDir: string): Promise<void> {
    try {
        const guidesOutputDir = path.join(outputDir, 'guides');
        await fs.ensureDir(guidesOutputDir);

        // Créer le fichier d'index des guides
        await generateGuidesIndex(guidesOutputDir);

        // Créer la catégorisation pour Docusaurus
        await createGuidesCategoryConfig(guidesOutputDir);

        // Récupérer les métadonnées des guides depuis un fichier de configuration
        const guidesMetadata = await loadGuidesMetadata();

        // Générer les différentes catégories de guides
        const categories = ['getting-started', 'agents', 'mcp', 'integration', 'troubleshooting'];
        for (const category of categories) {
            await generateGuideCategory(category, guidesMetadata, guidesOutputDir);
        }

        logger.log(`Guides interactifs générés dans ${guidesOutputDir}`);

    } catch (error: any) {
        logger.error(`Erreur lors de la génération des guides: ${error.message}`);
        throw error;
    }
}

/**
 * Génère la page d'index des guides
 */
async function generateGuidesIndex(outputDir: string): Promise<void> {
    const indexContent = `---
id: index
title: Guides Interactifs
sidebar_label: Vue d'ensemble
slug: /guides
---

# Guides Interactifs

Cette section contient des guides étape par étape pour vous aider à utiliser efficacement la plateforme.

## Par où commencer

- [Premiers pas avec les agents IA](/docs/guides/getting-started/first-steps)
- [Comprendre l'architecture MCP](/docs/guides/getting-started/mcp-architecture)
- [Configurer votre environnement](/docs/guides/getting-started/setup-environment)

## Utilisation des Agents

- [Créer un agent personnalisé](/docs/guides/agents/create-custom-agent)
- [Connecter des agents entre eux](/docs/guides/agents/connect-agents)
- [Déboguer un agent](/docs/guides/agents/debug-agent)

## Intégration MCP

- [Implémenter un serveur MCP](/docs/guides/mcp/implement-server)
- [Créer un client MCP](/docs/guides/mcp/create-client)
- [Étendre les capacités MCP](/docs/guides/mcp/extend-capabilities)

## Intégration avec d'autres systèmes

- [Intégrer avec des API externes](/docs/guides/integration/external-apis)
- [Connecter à des services cloud](/docs/guides/integration/cloud-services)
- [Orchestrer avec GitHub Actions](/docs/guides/integration/github-actions)

## Résolution de problèmes

- [Diagnostiquer les erreurs communes](/docs/guides/troubleshooting/common-errors)
- [Optimiser les performances](/docs/guides/troubleshooting/performance)
- [Logs et monitoring](/docs/guides/troubleshooting/logs-monitoring)
`;

    await fs.writeFile(path.join(outputDir, 'index.md'), indexContent);
}

/**
 * Crée le fichier de configuration de catégorie pour Docusaurus
 */
async function createGuidesCategoryConfig(outputDir: string): Promise<void> {
    const categoryConfig = {
        "label": "Guides Interactifs",
        "position": 4,
        "collapsed": false
    };

    await fs.writeJSON(path.join(outputDir, '_category_.json'), categoryConfig, { spaces: 2 });
}

/**
 * Charge les métadonnées des guides depuis le fichier de configuration
 */
async function loadGuidesMetadata(): Promise<GuideMetadata[]> {
    try {
        const metadataPath = path.join(process.cwd(), 'documentation', 'guides-metadata.json');

        // Vérifier si le fichier existe, sinon créer un fichier de métadonnées par défaut
        if (!await fs.pathExists(metadataPath)) {
            logger.log('Fichier de métadonnées des guides non trouvé, création d\'un fichier par défaut');
            const defaultMetadata = createDefaultGuidesMetadata();
            await fs.writeJSON(metadataPath, defaultMetadata, { spaces: 2 });
            return defaultMetadata;
        }

        // Charger les métadonnées existantes
        return await fs.readJSON(metadataPath);
    } catch (error: any) {
        logger.error(`Erreur lors du chargement des métadonnées des guides: ${error.message}`);
        return createDefaultGuidesMetadata();
    }
}

/**
 * Crée des métadonnées de guides par défaut
 */
function createDefaultGuidesMetadata(): GuideMetadata[] {
    const currentDate = new Date().toISOString().split('T')[0];

    return [
        {
            id: 'first-steps',
            title: 'Premiers pas avec les agents IA',
            description: 'Apprenez les bases de l\'utilisation des agents IA dans votre projet.',
            category: 'getting-started',
            tags: ['débutant', 'agents', 'introduction'],
            difficulty: 'débutant',
            estimatedTime: '10 minutes',
            updated: currentDate
        },
        {
            id: 'mcp-architecture',
            title: 'Comprendre l\'architecture MCP',
            description: 'Une vue d\'ensemble de l\'architecture Model Context Protocol (MCP) et comment elle fonctionne.',
            category: 'getting-started',
            tags: ['mcp', 'architecture', 'concept'],
            difficulty: 'intermédiaire',
            estimatedTime: '15 minutes',
            updated: currentDate
        },
        {
            id: 'create-custom-agent',
            title: 'Créer un agent personnalisé',
            description: 'Guide pas à pas pour créer votre propre agent adapté à vos besoins spécifiques.',
            category: 'agents',
            tags: ['agents', 'développement', 'personnalisation'],
            difficulty: 'intermédiaire',
            estimatedTime: '30 minutes',
            updated: currentDate
        },
        {
            id: 'implement-server',
            title: 'Implémenter un serveur MCP',
            description: 'Comment créer et configurer un serveur MCP pour vos agents.',
            category: 'mcp',
            tags: ['mcp', 'serveur', 'implémentation'],
            difficulty: 'avancé',
            estimatedTime: '45 minutes',
            updated: currentDate
        },
        {
            id: 'external-apis',
            title: 'Intégrer avec des API externes',
            description: 'Connectez votre système à des API externes pour étendre ses capacités.',
            category: 'integration',
            tags: ['api', 'intégration', 'externe'],
            difficulty: 'intermédiaire',
            estimatedTime: '25 minutes',
            updated: currentDate
        },
        {
            id: 'common-errors',
            title: 'Diagnostiquer les erreurs communes',
            description: 'Solutions aux problèmes les plus fréquemment rencontrés dans la plateforme.',
            category: 'troubleshooting',
            tags: ['débogage', 'erreurs', 'résolution'],
            difficulty: 'débutant',
            estimatedTime: '20 minutes',
            updated: currentDate
        }
    ];
}

/**
 * Génère une catégorie de guides
 */
async function generateGuideCategory(
    category: string,
    guidesMetadata: GuideMetadata[],
    outputDir: string
): Promise<void> {
    const categoryDir = path.join(outputDir, category);
    await fs.ensureDir(categoryDir);

    // Filtrer les guides pour cette catégorie
    const categoryGuides = guidesMetadata.filter(guide => guide.category === category);

    // Créer la configuration de catégorie
    const categoryConfig = {
        "label": getCategoryLabel(category),
        "position": getCategoryPosition(category),
        "collapsed": false
    };

    await fs.writeJSON(path.join(categoryDir, '_category_.json'), categoryConfig, { spaces: 2 });

    // Créer la page d'index de la catégorie
    const indexContent = `---
id: index
title: ${getCategoryLabel(category)}
sidebar_label: Vue d'ensemble
slug: /guides/${category}
---

# ${getCategoryLabel(category)}

${getCategoryDescription(category)}

## Guides disponibles dans cette catégorie

${categoryGuides.map(guide => `- [${guide.title}](/docs/guides/${category}/${guide.id}) - ${guide.description}`).join('\n')}
`;

    await fs.writeFile(path.join(categoryDir, 'index.md'), indexContent);

    // Générer chaque guide dans cette catégorie
    for (const guide of categoryGuides) {
        await generateGuide(guide, category, categoryDir);
    }
}

/**
 * Génère un guide individuel
 */
async function generateGuide(
    guide: GuideMetadata,
    category: string,
    outputDir: string
): Promise<void> {
    // Vérifier si un template existe pour ce guide
    const templatePath = path.join(process.cwd(), 'documentation', 'templates', 'guides', `${guide.id}.md`);
    let guideContent = '';

    if (await fs.pathExists(templatePath)) {
        // Utiliser le template existant
        guideContent = await fs.readFile(templatePath, 'utf-8');
    } else {
        // Créer un contenu par défaut
        guideContent = createDefaultGuideContent(guide);
    }

    // Ajouter les métadonnées frontmatter
    const frontmatter = `---
id: ${guide.id}
title: ${guide.title}
sidebar_label: ${guide.title}
description: ${guide.description}
tags: [${guide.tags.join(', ')}]
slug: /guides/${category}/${guide.id}
---

`;

    const finalContent = frontmatter + guideContent;
    await fs.writeFile(path.join(outputDir, `${guide.id}.md`), finalContent);
}

/**
 * Crée un contenu par défaut pour un guide
 */
function createDefaultGuideContent(guide: GuideMetadata): string {
    return `# ${guide.title}

> **Difficulté:** ${guide.difficulty} | **Temps estimé:** ${guide.estimatedTime}${guide.updated ? ` | **Mis à jour:** ${guide.updated}` : ''}

${guide.description}

## Objectifs

- Objectif 1
- Objectif 2
- Objectif 3

## Prérequis

- Prérequis 1
- Prérequis 2

## Étape 1 : Première étape

Description de la première étape...

\`\`\`typescript
// Exemple de code pour l'étape 1
function exampleFunction() {
  console.log("Étape 1 terminée!");
}
\`\`\`

## Étape 2 : Deuxième étape

Description de la deuxième étape...

\`\`\`typescript
// Exemple de code pour l'étape 2
async function anotherExample() {
  return await someAsyncOperation();
}
\`\`\`

## Étape 3 : Troisième étape

Description de la troisième étape...

## Résumé

Ce que nous avons appris dans ce guide...

## Prochaines étapes

- [Lien vers un guide associé](/docs/guides/category/guide-id)
- [Autre ressource utile](/docs/category/resource)

## Ressources supplémentaires

- [Documentation externe](https://example.com)
- [Article de blog pertinent](https://blog.example.com)
`;
}

/**
 * Obtient l'étiquette d'affichage d'une catégorie
 */
function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        'getting-started': 'Premiers pas',
        'agents': 'Utilisation des Agents',
        'mcp': 'Intégration MCP',
        'integration': 'Intégration externe',
        'troubleshooting': 'Résolution de problèmes'
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Obtient la position d'une catégorie dans la barre latérale
 */
function getCategoryPosition(category: string): number {
    const positions: Record<string, number> = {
        'getting-started': 1,
        'agents': 2,
        'mcp': 3,
        'integration': 4,
        'troubleshooting': 5
    };
    return positions[category] || 99;
}

/**
 * Obtient la description d'une catégorie
 */
function getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
        'getting-started': 'Ces guides vous aideront à débuter avec la plateforme et à comprendre les concepts fondamentaux.',
        'agents': 'Apprenez à créer, configurer, et utiliser efficacement les agents IA dans vos workflows.',
        'mcp': 'Découvrez comment implémenter et utiliser le protocole Model Context Protocol (MCP) dans vos projets.',
        'integration': 'Guides pour intégrer votre système avec des services et API externes.',
        'troubleshooting': 'Solutions aux problèmes courants et astuces pour optimiser votre expérience.'
    };
    return descriptions[category] || 'Guides pour cette catégorie.';
}