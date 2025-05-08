/**
 * Script de génération automatique de documentation
 * 
 * Ce script génère la documentation des agents et composants du projet
 * Il est exécuté automatiquement lors des commits via un hook git
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemins des répertoires
const projectRoot = path.resolve(__dirname, '../../');
const agentsDir = path.join(projectRoot, 'agents');
const docsDir = path.join(__dirname, '../docs');
const agentDocsDir = path.join(docsDir, 'agents');

// Création des répertoires de documentation s'ils n'existent pas
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

if (!fs.existsSync(agentDocsDir)) {
    fs.mkdirSync(agentDocsDir, { recursive: true });
}

// Lecture du registre des agents pour générer la documentation dynamiquement
function generateAgentRegistry() {
    console.log('📝 Génération de la documentation du registre des agents...');

    try {
        const agentRegistryPath = path.join(agentsDir, 'agent-registry.ts');

        if (!fs.existsSync(agentRegistryPath)) {
            console.error(`❌ Fichier agent-registry.ts non trouvé à ${agentRegistryPath}`);
            return;
        }

        const registryContent = fs.readFileSync(agentRegistryPath, 'utf-8');
        const agentsList = [];

        // Expression régulière pour extraire les informations des agents
        const agentRegex = /^\s*'([^']+)':\s*{\s*name:\s*'([^']+)',\s*description:\s*'([^']+)'/gm;

        let match;
        while ((match = agentRegex.exec(registryContent)) !== null) {
            const [_, id, name, description] = match;
            agentsList.push({ id, name, description });
        }

        // Génération du fichier markdown pour la page d'index des agents
        const agentIndexContent = `---
id: agents
title: Agents IA
sidebar_label: Liste des Agents
slug: /agents
---

# Agents IA du Projet

Ce projet utilise plusieurs agents d'IA spécialisés pour différentes tâches d'automatisation,
de vérification et d'optimisation. Chaque agent a un rôle spécifique dans le flux de travail.

## Liste des Agents Disponibles

| ID | Nom | Description |
|----|-----|-------------|
${agentsList.map(agent => `| \`${agent.id}\` | ${agent.name} | ${agent.description} |`).join('\n')}

## Utilisation des Agents

Les agents peuvent être utilisés individuellement ou orchestrés ensemble selon les besoins.
Pour plus de détails sur l'API de chaque agent, consultez la [documentation API](/api).

### Exemple d'utilisation

\`\`\`typescript
import { loadAgent } from './agents';

// Charger un agent à partir de son ID
const seoChecker = await loadAgent('seo-checker');

// Exécuter l'agent
const result = await seoChecker.run({
  url: 'https://example.com'
});

console.log('Résultat:', result);
\`\`\`

## Intégration MCP

Les agents sont compatibles avec le Model Context Protocol (MCP) et peuvent être utilisés
comme des nœuds dans un pipeline MCP.
`;

        fs.writeFileSync(path.join(agentDocsDir, 'index.md'), agentIndexContent);
        console.log('✅ Documentation du registre des agents générée avec succès');

    } catch (error) {
        console.error(`❌ Erreur lors de la génération de la documentation du registre des agents: ${error.message}`);
    }
}

// Génération de la documentation détaillée pour chaque agent
function generateAgentDocs() {
    console.log('📝 Génération de la documentation détaillée des agents...');

    try {
        const agentFiles = fs.readdirSync(agentsDir)
            .filter(file => file.endsWith('-agent.ts') || file.endsWith('-verifier.ts'));

        for (const agentFile of agentFiles) {
            const agentPath = path.join(agentsDir, agentFile);
            const agentName = path.basename(agentFile, path.extname(agentFile));
            const outputPath = path.join(agentDocsDir, `${agentName}.md`);

            console.log(`Traitement de ${agentName}...`);

            // Extraction des commentaires JSDoc via un petit script temporaire
            const tempScriptPath = path.join(__dirname, '_temp-extract.js');

            fs.writeFileSync(tempScriptPath, `
        const fs = require('fs');
        const path = require('path');
        const ts = require('typescript');
        
        // Lire le fichier source
        const filePath = '${agentPath.replace(/\\/g, '\\\\')}';
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Parser le fichier pour extraire les commentaires JSDoc
        const sourceFile = ts.createSourceFile(
          filePath,
          fileContent,
          ts.ScriptTarget.Latest,
          true
        );
        
        // Récupérer les commentaires et la structure
        const comments = [];
        const classes = [];
        const interfaces = [];
        
        function visit(node) {
          // Extraire les commentaires JSDoc
          const jsDocs = ts.getJSDocCommentsAndTags(node);
          if (jsDocs && jsDocs.length > 0) {
            const docComment = jsDocs[0].comment || '';
            
            // Déterminer le type de nœud (classe, interface, méthode...)
            let nodeType = '';
            let nodeName = '';
            
            if (ts.isClassDeclaration(node) && node.name) {
              nodeType = 'class';
              nodeName = node.name.text;
              classes.push({ name: nodeName, doc: docComment });
            } else if (ts.isInterfaceDeclaration(node) && node.name) {
              nodeType = 'interface';
              nodeName = node.name.text;
              interfaces.push({ name: nodeName, doc: docComment });
            } else if (ts.isMethodDeclaration(node) && node.name) {
              nodeType = 'method';
              nodeName = node.name.getText(sourceFile);
            } else if (ts.isFunctionDeclaration(node) && node.name) {
              nodeType = 'function';
              nodeName = node.name.text;
            }
            
            if (nodeType && nodeName) {
              comments.push({ nodeType, nodeName, comment: docComment });
            }
          }
          
          ts.forEachChild(node, visit);
        }
        
        visit(sourceFile);
        
        // Générer le contenu Markdown
        let markdownContent = \`---
id: \${path.basename(filePath, '.ts')}
title: \${path.basename(filePath, '.ts').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
sidebar_label: \${path.basename(filePath, '.ts').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
---

# \${path.basename(filePath, '.ts').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}

\`;

        // Ajouter la documentation générale (premier commentaire JSDoc)
        if (comments.length > 0 && comments[0].comment) {
          markdownContent += comments[0].comment + "\\n\\n";
        }
        
        // Ajouter les informations sur les classes
        if (classes.length > 0) {
          markdownContent += "## Classes\\n\\n";
          for (const cls of classes) {
            markdownContent += \`### \${cls.name}\\n\\n\${cls.doc}\\n\\n\`;
          }
        }
        
        // Ajouter les informations sur les interfaces
        if (interfaces.length > 0) {
          markdownContent += "## Interfaces\\n\\n";
          for (const intf of interfaces) {
            markdownContent += \`### \${intf.name}\\n\\n\${intf.doc}\\n\\n\`;
          }
        }
        
        // Ajouter un lien vers la documentation API
        markdownContent += \`## Documentation API complète\\n\\n
Pour consulter la documentation technique complète générée à partir du code source, 
[visitez la documentation API](/api/classes/\${path.basename(filePath, '.ts')}.html).\\n\\n\`;
        
        console.log(JSON.stringify({ markdown: markdownContent }));
      `);

            try {
                const result = execSync(`node ${tempScriptPath}`);
                const { markdown } = JSON.parse(result.toString());
                fs.writeFileSync(outputPath, markdown);
                console.log(`✅ Documentation générée pour ${agentName}`);
            } catch (err) {
                console.error(`❌ Erreur lors du traitement de ${agentName}: ${err.message}`);
            } finally {
                // Nettoyage
                if (fs.existsSync(tempScriptPath)) {
                    fs.unlinkSync(tempScriptPath);
                }
            }
        }

    } catch (error) {
        console.error(`❌ Erreur lors de la génération de la documentation des agents: ${error.message}`);
    }
}

// Génération de la page d'introduction
function generateIntroPage() {
    console.log('📝 Génération de la page d'introduction...');
  
  const introContent = `---
id: intro
title: Introduction
sidebar_position: 1
slug: /
---

# Documentation Générative Unifiée

Bienvenue dans la documentation centralisée et générée automatiquement du projet. Cette documentation est
maintenue à jour automatiquement grâce à des processus de génération intégrés au cycle de développement.

## Structure de la Documentation

- **[Agents IA](/docs/agents)** - Documentation sur les agents d'IA utilisés dans le projet
- **[API](/api)** - Documentation technique générée automatiquement à partir du code source
- **[Journal](/blog)** - Journal des mises à jour et évolutions du projet

## Fonctionnalités Principales

- Documentation générée automatiquement à chaque commit
- Intégration fluide entre documentation technique et guides utilisateur
- Support multilingue
- Diagrammes et visualisations interactifs

## Démarrage Rapide

Pour commencer à utiliser le projet, consultez les guides suivants:

- [Installation et configuration](/docs/installation)
- [Premiers pas avec les agents](/docs/agents)
- [Architecture du projet](/docs/architecture)

## Génération de la Documentation

La documentation est générée automatiquement à l'aide des outils suivants:

- **TypeDoc** - Pour la documentation API à partir des commentaires JSDoc/TSDoc
- **Docusaurus** - Pour le site de documentation lui-même
- **Scripts personnalisés** - Pour extraire les informations des agents et autres composants

Pour mettre à jour la documentation localement, exécutez:

\`\`\`bash
pnpm run docs:generate
\`\`\`

Cette commande analyse le code source, extrait les commentaires JSDoc et génère la documentation actualisée.
`;

    fs.writeFileSync(path.join(docsDir, 'intro.md'), introContent);
    console.log('✅ Page d'introduction générée avec succès');
}

// Exécution des fonctions de génération
try {
    console.log('🚀 Démarrage de la génération de documentation...');
    generateIntroPage();
    generateAgentRegistry();
    generateAgentDocs();
    console.log('✅ Documentation générée avec succès !');
} catch (error) {
    console.error(`❌ Erreur lors de la génération de la documentation: ${error.message}`);
    process.exit(1);
}