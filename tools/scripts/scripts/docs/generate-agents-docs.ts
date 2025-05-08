/**
 * generate-agents-docs.ts
 * 
 * Script qui extrait les informations des agents depuis le registre
 * et génère la documentation associée au format Markdown pour Docusaurus.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '@nestjs/common';
import { AgentRegistryManager } from '../../agents/agent-registry';

const logger = new Logger('AgentsDocGenerator');

/**
 * Fonction principale pour générer la documentation des agents
 * @param outputDir Dossier de sortie pour les fichiers markdown
 */
export async function generateAgentsDocumentation(outputDir: string): Promise<void> {
    try {
        const agentsOutputDir = path.join(outputDir, 'agents');
        await fs.ensureDir(agentsOutputDir);

        // Créer le fichier d'index des agents
        await generateAgentsIndex(agentsOutputDir);

        // Initialiser le registre d'agents
        const registry = AgentRegistryManager.getInstance();
        await registry.loadManifest();

        // Créer la catégorisation pour Docusaurus
        await createAgentsCategoryConfig(agentsOutputDir);

        // Générer la documentation pour chaque couche
        await generateLayerDocumentation('orchestration', registry, agentsOutputDir);
        await generateLayerDocumentation('coordination', registry, agentsOutputDir);
        await generateLayerDocumentation('business', registry, agentsOutputDir);

        logger.log(`Documentation des agents générée dans ${agentsOutputDir}`);

    } catch (error: any) {
        logger.error(`Erreur lors de la génération de la documentation des agents: ${error.message}`);
        throw error;
    }
}

/**
 * Génère la page d'index des agents
 */
async function generateAgentsIndex(outputDir: string): Promise<void> {
    const indexContent = `---
id: index
title: Agents IA
sidebar_label: Vue d'ensemble
slug: /agents
---

# Agents IA

Notre plateforme utilise une architecture modulaire basée sur des agents intelligents répartis en trois couches :

## Couche d'Orchestration

Les agents d'orchestration coordonnent l'ensemble du flux de travail et gèrent le cycle de vie des processus.

- [Orchestrateurs](/docs/agents/orchestration)
- [Planificateurs](/docs/agents/orchestration/schedulers)
- [Moniteurs](/docs/agents/orchestration/monitors)

## Couche de Coordination

Les agents de coordination assurent la communication et l'intégration entre les différents systèmes.

- [Adaptateurs](/docs/agents/coordination/adapters)
- [Ponts](/docs/agents/coordination/bridges)
- [Registres](/docs/agents/coordination/registries)

## Couche Métier

Les agents métier effectuent des tâches spécifiques d'analyse, de génération et de validation.

- [Analyseurs](/docs/agents/business/analyzers)
- [Générateurs](/docs/agents/business/generators)
- [Validateurs](/docs/agents/business/validators)
- [Parseurs](/docs/agents/business/parsers)

Chaque agent est conçu pour être modulaire, réutilisable et facile à intégrer dans différents flux de travail.
`;

    await fs.writeFile(path.join(outputDir, 'index.md'), indexContent);
}

/**
 * Crée le fichier de configuration de catégorie pour Docusaurus
 */
async function createAgentsCategoryConfig(outputDir: string): Promise<void> {
    const categoryConfig = {
        "label": "Agents IA",
        "position": 2,
        "collapsed": false
    };

    await fs.writeJSON(path.join(outputDir, '_category_.json'), categoryConfig, { spaces: 2 });
}

/**
 * Génère la documentation pour une couche spécifique d'agents
 */
async function generateLayerDocumentation(
    layer: 'orchestration' | 'coordination' | 'business',
    registry: AgentRegistryManager,
    outputDir: string
): Promise<void> {
    const layerDir = path.join(outputDir, layer);
    await fs.ensureDir(layerDir);

    // Créer la page d'index pour cette couche
    const layerIndexContent = `---
id: index
title: Agents de ${layer}
sidebar_label: Vue d'ensemble
slug: /agents/${layer}
---

# Agents de ${getLayerFriendlyName(layer)}

${getLayerDescription(layer)}

## Agents disponibles

${getAgentListMarkdown(registry, layer)}
`;

    await fs.writeFile(path.join(layerDir, 'index.md'), layerIndexContent);

    // Créer la configuration de catégorie pour la couche
    const layerCategoryConfig = {
        "label": `Agents de ${getLayerFriendlyName(layer)}`,
        "position": getLayerPosition(layer),
        "collapsed": false
    };

    await fs.writeJSON(path.join(layerDir, '_category_.json'), layerCategoryConfig, { spaces: 2 });

    // Générer la documentation individuelle pour chaque agent
    const agents = registry.getAgentsByLayer(layer);

    for (const agent of agents) {
        await generateAgentDocumentation(agent, layer, layerDir);
    }
}

/**
 * Génère la documentation pour un agent spécifique
 */
async function generateAgentDocumentation(agent: any, layer: string, outputDir: string): Promise<void> {
    const agentId = agent.id || 'agent-sans-id';
    const agentName = agent.name || agentId;
    const agentType = agent.type || 'non-spécifié';
    const agentVersion = agent.version || '1.0.0';
    const agentDescription = agent.description || 'Aucune description disponible.';
    const agentStatus = agent.status || 'active';

    const agentFilename = `${agentId.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;

    const agentContent = `---
id: ${agentId}
title: ${agentName}
sidebar_label: ${agentName}
slug: /agents/${layer}/${agentId}
---

# ${agentName}

**Type:** ${agentType}  
**Version:** ${agentVersion}  
**Statut:** ${agentStatus}

## Description

${agentDescription}

## Fonctionnalités principales

${getAgentFunctionalities(agent)}

## Configuration

${getAgentConfig(agent)}

## Dépendances

${getAgentDependencies(agent)}

## Exemples d'utilisation

${getAgentExamples(agent)}

## API

${getAgentAPI(agent)}
`;

    await fs.writeFile(path.join(outputDir, agentFilename), agentContent);
}

/**
 * Utilitaires d'aide à la génération de la documentation
 */
function getLayerFriendlyName(layer: string): string {
    const names: Record<string, string> = {
        'orchestration': 'l\'Orchestration',
        'coordination': 'la Coordination',
        'business': 'la Couche Métier'
    };
    return names[layer] || layer;
}

function getLayerDescription(layer: string): string {
    const descriptions: Record<string, string> = {
        'orchestration': 'Les agents d\'orchestration sont responsables de la coordination des flux de travail, de la surveillance des processus et de la planification des tâches.',
        'coordination': 'Les agents de coordination assurent l\'interopérabilité entre différents systèmes et facilitent la communication entre les composants.',
        'business': 'Les agents métier effectuent des actions spécifiques liées aux fonctionnalités principales : analyse, génération, validation et parsing de données.'
    };
    return descriptions[layer] || 'Ces agents font partie de notre architecture modulaire.';
}

function getLayerPosition(layer: string): number {
    const positions: Record<string, number> = {
        'orchestration': 1,
        'coordination': 2,
        'business': 3
    };
    return positions[layer] || 99;
}

function getAgentListMarkdown(registry: AgentRegistryManager, layer: string): string {
    const agents = registry.getAgentsByLayer(layer as any);
    if (agents.length === 0) {
        return '*Aucun agent disponible dans cette couche.*';
    }

    return agents.map(agent => {
        const id = (agent as any).id || 'agent-sans-id';
        const name = (agent as any).name || id;
        const description = (agent as any).description || 'Aucune description disponible.';

        return `- [${name}](/docs/agents/${layer}/${id}) - ${description.split('.')[0]}.`;
    }).join('\n');
}

function getAgentFunctionalities(agent: any): string {
    if (!agent.functionalities || agent.functionalities.length === 0) {
        return '- Fonctionnalités non documentées';
    }

    return agent.functionalities.map((func: string) => `- ${func}`).join('\n');
}

function getAgentConfig(agent: any): string {
    if (!agent.config) {
        return 'Aucune configuration spécifique requise.';
    }

    return '```json\n' + JSON.stringify(agent.config, null, 2) + '\n```';
}

function getAgentDependencies(agent: any): string {
    if (!agent.dependencies || agent.dependencies.length === 0) {
        return 'Cet agent n\'a pas de dépendances externes.';
    }

    return agent.dependencies.map((dep: string) => `- ${dep}`).join('\n');
}

function getAgentExamples(agent: any): string {
    if (!agent.examples || agent.examples.length === 0) {
        return 'Exemples non disponibles.';
    }

    return agent.examples.map((example: any) => {
        const title = example.title || 'Exemple';
        const code = example.code || '';

        return `### ${title}\n\n\`\`\`typescript\n${code}\n\`\`\``;
    }).join('\n\n');
}

function getAgentAPI(agent: any): string {
    if (!agent.api) {
        return 'Documentation API détaillée non disponible.';
    }

    let apiDoc = '';

    if (agent.api.methods) {
        apiDoc += '### Méthodes\n\n';
        for (const method of agent.api.methods) {
            apiDoc += `#### \`${method.name}(${method.params || ''})\`\n\n`;
            apiDoc += `${method.description || 'Aucune description disponible.'}\n\n`;

            if (method.returns) {
                apiDoc += `**Retourne:** ${method.returns}\n\n`;
            }
        }
    }

    return apiDoc || 'Documentation API détaillée non disponible.';
}