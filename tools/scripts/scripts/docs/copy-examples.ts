/**
 * copy-examples.ts
 * 
 * Script qui extrait les exemples de code depuis les répertoires d'exemples
 * et les intègre à la documentation.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '@nestjs/common';
import glob from 'fast-glob';

const logger = new Logger('ExamplesCopier');

/**
 * Copie les exemples de code dans la documentation
 * @param outputDir Dossier de sortie pour les fichiers markdown
 */
export async function copyExamples(outputDir: string): Promise<void> {
    try {
        const examplesOutputDir = path.join(outputDir, 'examples');
        await fs.ensureDir(examplesOutputDir);

        // Créer le fichier d'index des exemples
        await generateExamplesIndex(examplesOutputDir);

        // Créer la catégorisation pour Docusaurus
        await createExamplesCategoryConfig(examplesOutputDir);

        // Trouver tous les exemples dans le dossier examples
        const rootDir = process.cwd();
        const examplesDir = path.join(rootDir, 'examples');

        if (await fs.pathExists(examplesDir)) {
            // Copier les exemples par catégorie
            await copyExamplesByCategory(examplesDir, examplesOutputDir);
        } else {
            logger.warn(`Répertoire d'exemples non trouvé: ${examplesDir}`);
            // Créer un exemple par défaut pour la démonstration
            await createDefaultExample(examplesOutputDir);
        }

        logger.log(`Exemples de code copiés dans ${examplesOutputDir}`);

    } catch (error: any) {
        logger.error(`Erreur lors de la copie des exemples: ${error.message}`);
        throw error;
    }
}

/**
 * Génère la page d'index des exemples
 */
async function generateExamplesIndex(outputDir: string): Promise<void> {
    const indexContent = `---
id: index
title: Exemples de Code
sidebar_label: Vue d'ensemble
slug: /examples
---

# Exemples de Code

Cette section contient des exemples de code pratiques qui illustrent l'utilisation de notre plateforme dans différents scénarios.

## Agents

Exemples d'utilisation et de création d'agents.

- [Agent simple](/docs/examples/agents/simple-agent)
- [Chaîne d'agents](/docs/examples/agents/agent-chain)
- [Agent personnalisé](/docs/examples/agents/custom-agent)

## MCP (Model Context Protocol)

Exemples d'implémentation et d'utilisation de MCP.

- [Client MCP de base](/docs/examples/mcp/basic-client)
- [Serveur MCP](/docs/examples/mcp/mcp-server)
- [API MCP personnalisée](/docs/examples/mcp/custom-api)

## Intégration

Exemples d'intégration avec d'autres systèmes.

- [Intégration API](/docs/examples/integration/api-integration)
- [Webhook GitHub](/docs/examples/integration/github-webhook)
- [Middleware Express](/docs/examples/integration/express-middleware)

## Workflows

Exemples de workflows complets.

- [Validation de code](/docs/examples/workflows/code-validation)
- [Génération de rapport](/docs/examples/workflows/report-generation)
- [Pipeline CI/CD](/docs/examples/workflows/ci-cd-pipeline)
`;

    await fs.writeFile(path.join(outputDir, 'index.md'), indexContent);
}

/**
 * Crée le fichier de configuration de catégorie pour Docusaurus
 */
async function createExamplesCategoryConfig(outputDir: string): Promise<void> {
    const categoryConfig = {
        "label": "Exemples de Code",
        "position": 5,
        "collapsed": false
    };

    await fs.writeJSON(path.join(outputDir, '_category_.json'), categoryConfig, { spaces: 2 });
}

/**
 * Copie les exemples de code organisés par catégorie
 */
async function copyExamplesByCategory(examplesDir: string, outputDir: string): Promise<void> {
    // Obtenir toutes les catégories (dossiers de premier niveau dans le répertoire examples)
    const categories = await fs.readdir(examplesDir);

    for (const category of categories) {
        const categoryPath = path.join(examplesDir, category);
        const stats = await fs.stat(categoryPath);

        if (stats.isDirectory()) {
            const categoryOutputDir = path.join(outputDir, category);
            await fs.ensureDir(categoryOutputDir);

            // Créer la configuration de catégorie
            const categoryConfig = {
                "label": formatCategoryName(category),
                "position": getCategoryPosition(category),
                "collapsed": false
            };

            await fs.writeJSON(path.join(categoryOutputDir, '_category_.json'), categoryConfig, { spaces: 2 });

            // Créer l'index de la catégorie
            await createCategoryIndex(category, categoryPath, categoryOutputDir);

            // Copier les exemples individuels
            await processExamplesInCategory(category, categoryPath, categoryOutputDir);
        }
    }
}

/**
 * Crée le fichier d'index pour une catégorie d'exemples
 */
async function createCategoryIndex(category: string, categoryPath: string, outputDir: string): Promise<void> {
    // Lire les exemples dans cette catégorie
    const examples = await fs.readdir(categoryPath);
    const examplesList = [];

    for (const example of examples) {
        const examplePath = path.join(categoryPath, example);
        const stats = await fs.stat(examplePath);

        if (stats.isDirectory()) {
            // Essayer de lire README.md ou description.txt pour obtenir la description
            let description = '';
            const readmePath = path.join(examplePath, 'README.md');
            const descPath = path.join(examplePath, 'description.txt');

            if (await fs.pathExists(readmePath)) {
                const readme = await fs.readFile(readmePath, 'utf-8');
                const firstLine = readme.trim().split('\n')[0].replace(/^#\s*/, '');
                description = firstLine || example;
            } else if (await fs.pathExists(descPath)) {
                description = await fs.readFile(descPath, 'utf-8');
                description = description.split('\n')[0]; // Prendre seulement la première ligne
            } else {
                description = `Exemple ${example}`;
            }

            examplesList.push({ name: example, description });
        }
    }

    // Créer le contenu de l'index
    const indexContent = `---
id: index
title: Exemples de ${formatCategoryName(category)}
sidebar_label: Vue d'ensemble
slug: /examples/${category}
---

# Exemples de ${formatCategoryName(category)}

${getCategoryDescription(category)}

## Exemples disponibles

${examplesList.map(example => `- [${formatExampleName(example.name)}](/docs/examples/${category}/${example.name}) - ${example.description}`).join('\n')}
`;

    await fs.writeFile(path.join(outputDir, 'index.md'), indexContent);
}

/**
 * Traite les exemples individuels dans une catégorie
 */
async function processExamplesInCategory(category: string, categoryPath: string, categoryOutputDir: string): Promise<void> {
    const examples = await fs.readdir(categoryPath);

    for (const example of examples) {
        const examplePath = path.join(categoryPath, example);
        const stats = await fs.stat(examplePath);

        if (stats.isDirectory()) {
            // Créer un fichier markdown pour cet exemple
            await createExampleMarkdown(category, example, examplePath, categoryOutputDir);
        }
    }
}

/**
 * Crée un fichier markdown pour un exemple spécifique
 */
async function createExampleMarkdown(category: string, exampleName: string, examplePath: string, outputDir: string): Promise<void> {
    // Vérifier s'il y a un README.md
    const readmePath = path.join(examplePath, 'README.md');
    let content = '';

    if (await fs.pathExists(readmePath)) {
        // Utiliser le contenu du README.md
        content = await fs.readFile(readmePath, 'utf-8');
    } else {
        // Générer un contenu basé sur les fichiers trouvés
        content = await generateExampleContent(exampleName, examplePath);
    }

    // Ajouter les métadonnées frontmatter
    const frontmatter = `---
id: ${exampleName}
title: ${formatExampleName(exampleName)}
sidebar_label: ${formatExampleName(exampleName)}
slug: /examples/${category}/${exampleName}
---

`;

    // Écrire le fichier final
    await fs.writeFile(path.join(outputDir, `${exampleName}.md`), frontmatter + content);
}

/**
 * Génère le contenu d'un exemple basé sur les fichiers trouvés
 */
async function generateExampleContent(exampleName: string, examplePath: string): Promise<string> {
    let content = `# ${formatExampleName(exampleName)}\n\n`;

    // Vérifier s'il y a un fichier description.txt
    const descPath = path.join(examplePath, 'description.txt');
    if (await fs.pathExists(descPath)) {
        content += await fs.readFile(descPath, 'utf-8') + '\n\n';
    } else {
        content += `Cet exemple montre comment utiliser ${formatExampleName(exampleName)}.\n\n`;
    }

    // Trouver tous les fichiers de code
    const codeFiles = await glob(['**/*.ts', '**/*.js', '**/*.json', '**/*.md'], {
        cwd: examplePath,
        ignore: ['node_modules/**', 'dist/**', '*.test.ts', '*.spec.ts']
    });

    if (codeFiles.length > 0) {
        content += '## Code Source\n\n';

        for (const file of codeFiles) {
            const filePath = path.join(examplePath, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const extension = path.extname(file).slice(1);

            content += `### ${file}\n\n\`\`\`${extension}\n${fileContent}\n\`\`\`\n\n`;
        }
    }

    // Ajouter des instructions d'exécution
    const packageJsonPath = path.join(examplePath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
        content += '## Exécution\n\n';
        content += '```bash\n';
        content += '# Installer les dépendances\nnpm install\n\n';

        const packageJson = await fs.readJSON(packageJsonPath);
        if (packageJson.scripts) {
            content += '# Exécuter l\'exemple\n';
            if (packageJson.scripts.start) {
                content += 'npm start\n';
            } else if (packageJson.scripts.dev) {
                content += 'npm run dev\n';
            } else {
                content += 'node index.js\n';
            }
        }
        content += '```\n\n';
    }

    return content;
}

/**
 * Crée un exemple par défaut si aucun exemple n'est trouvé
 */
async function createDefaultExample(outputDir: string): Promise<void> {
    logger.log('Création d\'exemples par défaut...');

    // Créer des catégories
    const categories = ['agents', 'mcp', 'integration', 'workflows'];

    for (const category of categories) {
        const categoryDir = path.join(outputDir, category);
        await fs.ensureDir(categoryDir);

        // Créer la configuration de catégorie
        const categoryConfig = {
            "label": formatCategoryName(category),
            "position": getCategoryPosition(category),
            "collapsed": false
        };

        await fs.writeJSON(path.join(categoryDir, '_category_.json'), categoryConfig, { spaces: 2 });

        // Créer l'index de la catégorie
        const indexContent = `---
id: index
title: Exemples de ${formatCategoryName(category)}
sidebar_label: Vue d'ensemble
slug: /examples/${category}
---

# Exemples de ${formatCategoryName(category)}

${getCategoryDescription(category)}

## Exemples disponibles

Cette section sera automatiquement mise à jour lorsque des exemples de code seront ajoutés au répertoire \`examples/${category}\`.
`;

        await fs.writeFile(path.join(categoryDir, 'index.md'), indexContent);
    }

    // Créer un exemple simple dans chaque catégorie
    await createSimpleExample(path.join(outputDir, 'agents'), 'simple-agent');
    await createSimpleMCPExample(path.join(outputDir, 'mcp'), 'basic-client');
    await createSimpleIntegrationExample(path.join(outputDir, 'integration'), 'api-integration');
    await createSimpleWorkflowExample(path.join(outputDir, 'workflows'), 'code-validation');
}

/**
 * Crée un exemple simple d'agent
 */
async function createSimpleExample(categoryDir: string, exampleName: string): Promise<void> {
    const exampleContent = `---
id: ${exampleName}
title: Agent Simple
sidebar_label: Agent Simple
slug: /examples/agents/${exampleName}
---

# Exemple d'Agent Simple

Cet exemple montre comment créer et utiliser un agent simple avec notre plateforme.

## Code Source

### simple-agent.ts

\`\`\`typescript
import { BaseAgent } from '../core/interfaces/base-agent';

/**
 * Un agent simple qui démontre les fonctionnalités de base
 */
export class SimpleAgent implements BaseAgent {
  private id: string;
  private name: string;
  private initialized: boolean = false;
  
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  
  /**
   * Initialise l'agent avec une configuration
   */
  async initialize(config?: any): Promise<void> {
    console.log(\`Agent \${this.name} (ID: \${this.id}) initialisé avec config:\`, config);
    this.initialized = true;
  }
  
  /**
   * Ferme proprement l'agent
   */
  async shutdown(): Promise<void> {
    console.log(\`Agent \${this.name} (ID: \${this.id}) arrêté\`);
    this.initialized = false;
  }
  
  /**
   * Exécute une tâche simple
   */
  async processTask(task: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('Agent non initialisé');
    }
    
    console.log(\`Agent \${this.name} traite la tâche:\`, task);
    
    // Simuler un traitement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'success',
      result: \`Tâche \${task.id || 'inconnue'} traitée avec succès\`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Vérifie si l'agent est disponible
   */
  isAvailable(): boolean {
    return this.initialized;
  }
  
  /**
   * Récupère le statut de l'agent
   */
  getStatus(): string {
    return this.initialized ? 'active' : 'inactive';
  }
}
\`\`\`

### usage-example.ts

\`\`\`typescript
import { SimpleAgent } from './simple-agent';

async function main() {
  // Créer une instance d'agent simple
  const agent = new SimpleAgent('agent-123', 'MonAgentSimple');
  
  try {
    // Initialiser l'agent
    await agent.initialize({ timeout: 5000, debug: true });
    
    console.log(\`Statut de l'agent: \${agent.getStatus()}\`);
    console.log(\`Agent disponible: \${agent.isAvailable()}\`);
    
    // Exécuter une tâche
    const result = await agent.processTask({ 
      id: 'task-001',
      type: 'analysis',
      data: { text: 'Exemple de texte à analyser' }
    });
    
    console.log('Résultat:', result);
    
    // Arrêter l'agent
    await agent.shutdown();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

main();
\`\`\`

## Exécution

\`\`\`bash
# Installer les dépendances
npm install

# Exécuter l'exemple
ts-node usage-example.ts
\`\`\`

## Explication

Cet exemple illustre:

1. Comment créer un agent qui implémente l'interface \`BaseAgent\`
2. Comment initialiser et arrêter correctement l'agent
3. Comment traiter une tâche simple
4. Comment vérifier l'état et la disponibilité de l'agent

Vous pouvez utiliser ce modèle comme point de départ pour créer vos propres agents personnalisés.
`;

    await fs.writeFile(path.join(categoryDir, `${exampleName}.md`), exampleContent);
}

/**
 * Crée un exemple simple de client MCP
 */
async function createSimpleMCPExample(categoryDir: string, exampleName: string): Promise<void> {
    const exampleContent = `---
id: ${exampleName}
title: Client MCP de Base
sidebar_label: Client MCP de Base
slug: /examples/mcp/${exampleName}
---

# Exemple de Client MCP de Base

Cet exemple montre comment créer un client simple qui se connecte à un serveur MCP.

## Code Source

### mcp-client.ts

\`\`\`typescript
import { MCPClient } from '@mcp/client';

/**
 * Un client MCP simple
 */
export class SimpleMCPClient {
  private client: MCPClient;
  private connected: boolean = false;
  
  constructor(serverUrl: string, apiKey: string) {
    this.client = new MCPClient({
      serverUrl,
      apiKey,
      timeout: 10000,
      retries: 3
    });
  }
  
  /**
   * Se connecte au serveur MCP
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
      console.log('Connecté au serveur MCP');
    } catch (error) {
      console.error('Erreur de connexion au serveur MCP:', error);
      throw error;
    }
  }
  
  /**
   * Ferme la connexion au serveur
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
      console.log('Déconnecté du serveur MCP');
    }
  }
  
  /**
   * Envoie une requête au serveur MCP
   */
  async sendRequest(context: any, prompt: string): Promise<any> {
    if (!this.connected) {
      throw new Error('Client non connecté');
    }
    
    console.log('Envoi de la requête au serveur MCP...');
    
    const response = await this.client.sendRequest({
      context,
      prompt,
      options: {
        temperature: 0.7,
        maxTokens: 1000
      }
    });
    
    return response;
  }
  
  /**
   * Récupère les modèles disponibles sur le serveur
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.connected) {
      throw new Error('Client non connecté');
    }
    
    const models = await this.client.getAvailableModels();
    return models;
  }
}
\`\`\`

### usage-example.ts

\`\`\`typescript
import { SimpleMCPClient } from './mcp-client';

async function main() {
  // Créer une instance du client MCP
  const client = new SimpleMCPClient(
    'https://mcp-server.example.com',
    'votre-clé-api'
  );
  
  try {
    // Se connecter au serveur
    await client.connect();
    
    // Récupérer les modèles disponibles
    const models = await client.getAvailableModels();
    console.log('Modèles disponibles:', models);
    
    // Envoyer une requête
    const response = await client.sendRequest(
      { previousMessages: [] },
      'Génère un résumé de 3 paragraphes sur les avantages de l\\'architecture MCP.'
    );
    
    console.log('Réponse du serveur:');
    console.log(response.result);
    
    // Se déconnecter
    await client.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

main();
\`\`\`

## Exécution

\`\`\`bash
# Installer les dépendances
npm install @mcp/client

# Exécuter l'exemple
ts-node usage-example.ts
\`\`\`

## Explication

Cet exemple illustre:

1. Comment créer un client MCP simple
2. Comment se connecter à un serveur MCP
3. Comment envoyer des requêtes avec contexte et prompt
4. Comment gérer les réponses du serveur

Ce client peut être intégré dans n'importe quelle application TypeScript/JavaScript pour accéder aux fonctionnalités MCP.
`;

    await fs.writeFile(path.join(categoryDir, `${exampleName}.md`), exampleContent);
}

/**
 * Crée un exemple simple d'intégration API
 */
async function createSimpleIntegrationExample(categoryDir: string, exampleName: string): Promise<void> {
    const exampleContent = `---
id: ${exampleName}
title: Intégration API
sidebar_label: Intégration API
slug: /examples/integration/${exampleName}
---

# Exemple d'Intégration API

Cet exemple montre comment intégrer les agents IA avec une API externe.

## Code Source

### api-integration.ts

\`\`\`typescript
import axios from 'axios';
import { BaseAgent } from '../core/interfaces/base-agent';

/**
 * Agent d'intégration API qui se connecte à des services externes
 */
export class APIIntegrationAgent implements BaseAgent {
  private id: string;
  private name: string;
  private apiUrl: string;
  private apiKey: string;
  private initialized: boolean = false;
  
  constructor(id: string, name: string, apiUrl: string, apiKey: string) {
    this.id = id;
    this.name = name;
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }
  
  /**
   * Initialise la connexion à l'API
   */
  async initialize(config?: any): Promise<void> {
    console.log(\`Agent \${this.name} initialise la connexion à l'API: \${this.apiUrl}\`);
    
    try {
      // Vérifier que l'API est accessible
      const response = await axios.get(\`\${this.apiUrl}/health\`, {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`
        }
      });
      
      if (response.status === 200 && response.data.status === 'ok') {
        this.initialized = true;
        console.log('Connexion à l\\'API établie avec succès');
      } else {
        throw new Error(\`L'API a retourné un statut non valide: \${response.status}\`);
      }
    } catch (error) {
      console.error('Erreur lors de la connexion à l\\'API:', error);
      throw new Error(\`Échec de la connexion à l'API: \${error.message}\`);
    }
  }
  
  /**
   * Ferme la connexion
   */
  async shutdown(): Promise<void> {
    console.log(\`Agent \${this.name} ferme la connexion à l'API\`);
    this.initialized = false;
  }
  
  /**
   * Envoie des données à l'API externe
   */
  async sendData(data: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('Agent non initialisé');
    }
    
    console.log(\`Envoi de données à l'API: \${this.apiUrl}/data\`);
    
    try {
      const response = await axios.post(\`\${this.apiUrl}/data\`, data, {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\\'envoi de données à l\\'API:', error);
      throw error;
    }
  }
  
  /**
   * Récupère des données depuis l'API externe
   */
  async fetchData(query: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('Agent non initialisé');
    }
    
    console.log(\`Récupération de données depuis l'API: \${this.apiUrl}/data\`);
    
    try {
      const response = await axios.get(\`\${this.apiUrl}/data\`, {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`
        },
        params: query
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de données depuis l\\'API:', error);
      throw error;
    }
  }
  
  /**
   * Vérifie si l'agent est disponible
   */
  isAvailable(): boolean {
    return this.initialized;
  }
}
\`\`\`

### usage-example.ts

\`\`\`typescript
import { APIIntegrationAgent } from './api-integration';

async function main() {
  // Créer une instance de l'agent d'intégration API
  const agent = new APIIntegrationAgent(
    'api-agent-001',
    'ExternalAPIAgent',
    'https://api.example.com/v1',
    'votre-clé-api'
  );
  
  try {
    // Initialiser l'agent
    await agent.initialize();
    
    console.log(\`Agent disponible: \${agent.isAvailable()}\`);
    
    // Récupérer des données
    const data = await agent.fetchData({
      category: 'news',
      limit: 10
    });
    
    console.log('Données récupérées:', data);
    
    // Envoyer des données transformées
    const processedData = {
      source: 'notre-plateforme',
      content: data.items.map((item: any) => ({
        id: item.id,
        title: item.title.toUpperCase(),
        summary: \`Résumé: \${item.description.substring(0, 100)}...\`
      }))
    };
    
    const result = await agent.sendData(processedData);
    console.log('Résultat de l\\'envoi:', result);
    
    // Fermer l'agent
    await agent.shutdown();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

main();
\`\`\`

## Exécution

\`\`\`bash
# Installer les dépendances
npm install axios

# Exécuter l'exemple
ts-node usage-example.ts
\`\`\`

## Explication

Cet exemple illustre:

1. Comment créer un agent qui se connecte à une API externe
2. Comment authentifier les requêtes avec une clé API
3. Comment envoyer et récupérer des données depuis l'API
4. Comment gérer les erreurs de communication

Cette approche peut être adaptée pour intégrer votre plateforme avec n'importe quelle API REST.
`;

    await fs.writeFile(path.join(categoryDir, `${exampleName}.md`), exampleContent);
}

/**
 * Crée un exemple simple de workflow
 */
async function createSimpleWorkflowExample(categoryDir: string, exampleName: string): Promise<void> {
    const exampleContent = `---
id: ${exampleName}
title: Validation de Code
sidebar_label: Validation de Code
slug: /examples/workflows/${exampleName}
---

# Exemple de Workflow de Validation de Code

Cet exemple montre comment créer un workflow complet de validation de code utilisant plusieurs agents.

## Code Source

### code-validation-workflow.ts

\`\`\`typescript
import { Workflow } from '../core/workflow';
import { LinterAgent } from './agents/linter-agent';
import { SecurityScannerAgent } from './agents/security-scanner-agent';
import { TestRunnerAgent } from './agents/test-runner-agent';
import { NotifierAgent } from './agents/notifier-agent';

/**
 * Workflow de validation de code qui orchestre plusieurs agents
 */
export class CodeValidationWorkflow extends Workflow {
  private linter: LinterAgent;
  private securityScanner: SecurityScannerAgent;
  private testRunner: TestRunnerAgent;
  private notifier: NotifierAgent;
  
  constructor(config: any) {
    super('code-validation', 'Workflow de validation de code');
    
    // Initialiser les agents
    this.linter = new LinterAgent('linter', 'Code Linter');
    this.securityScanner = new SecurityScannerAgent('security', 'Scanner de sécurité');
    this.testRunner = new TestRunnerAgent('tests', 'Exécuteur de tests');
    this.notifier = new NotifierAgent('notifier', 'Agent de notification');
    
    // Configuration spécifique
    this.config = config || {};
  }
  
  /**
   * Initialise le workflow et ses agents
   */
  async initialize(): Promise<void> {
    console.log('Initialisation du workflow de validation de code...');
    
    await this.linter.initialize(this.config.linter);
    await this.securityScanner.initialize(this.config.security);
    await this.testRunner.initialize(this.config.tests);
    await this.notifier.initialize(this.config.notifier);
    
    console.log('Workflow de validation de code initialisé');
  }
  
  /**
   * Exécute le workflow complet de validation
   */
  async execute(codebase: { path: string, files: string[] }): Promise<any> {
    console.log(\`Exécution du workflow de validation sur \${codebase.files.length} fichiers\`);
    
    // Étape 1: Lint du code
    console.log('Étape 1: Linting du code...');
    const lintResults = await this.linter.analyzeCode(codebase);
    
    if (lintResults.errors.length > 0) {
      console.log(\`Erreurs de lint trouvées: \${lintResults.errors.length}\`);
    }
    
    // Étape 2: Analyse de sécurité
    console.log('Étape 2: Analyse de sécurité...');
    const securityResults = await this.securityScanner.scanCode(codebase);
    
    if (securityResults.vulnerabilities.length > 0) {
      console.log(\`Vulnérabilités trouvées: \${securityResults.vulnerabilities.length}\`);
    }
    
    // Étape 3: Exécution des tests
    console.log('Étape 3: Exécution des tests...');
    const testResults = await this.testRunner.runTests(codebase.path);
    
    // Étape 4: Notification des résultats
    const summary = {
      linting: {
        success: lintResults.errors.length === 0,
        errors: lintResults.errors,
        warnings: lintResults.warnings
      },
      security: {
        success: securityResults.vulnerabilities.length === 0,
        vulnerabilities: securityResults.vulnerabilities,
        score: securityResults.score
      },
      tests: {
        success: testResults.failed === 0,
        passed: testResults.passed,
        failed: testResults.failed,
        coverage: testResults.coverage
      },
      timestamp: new Date().toISOString()
    };
    
    // Envoyer la notification
    await this.notifier.sendNotification({
      title: \`Rapport de validation de code - \${new Date().toLocaleDateString()}\`,
      summary: summary
    });
    
    return summary;
  }
  
  /**
   * Ferme proprement le workflow
   */
  async shutdown(): Promise<void> {
    console.log('Arrêt du workflow de validation de code...');
    
    await this.linter.shutdown();
    await this.securityScanner.shutdown();
    await this.testRunner.shutdown();
    await this.notifier.shutdown();
    
    console.log('Workflow arrêté');
  }
}
\`\`\`

### usage-example.ts

\`\`\`typescript
import { CodeValidationWorkflow } from './code-validation-workflow';

async function main() {
  // Configuration du workflow
  const config = {
    linter: {
      rules: {
        semicolon: 'error',
        quotes: 'warning',
        'max-line-length': 100
      }
    },
    security: {
      scanDepth: 'high',
      includeDependencies: true
    },
    tests: {
      timeout: 5000,
      collectCoverage: true
    },
    notifier: {
      channels: ['email', 'slack'],
      recipients: ['team@example.com']
    }
  };
  
  // Créer et initialiser le workflow
  const workflow = new CodeValidationWorkflow(config);
  await workflow.initialize();
  
  try {
    // Exécuter le workflow sur un répertoire de code
    const results = await workflow.execute({
      path: './src',
      files: [
        './src/index.ts',
        './src/utils/helpers.ts',
        './src/components/button.tsx'
      ]
    });
    
    // Afficher les résultats
    console.log('Résultats de la validation:');
    console.log(JSON.stringify(results, null, 2));
    
    // Vérifier le statut global
    const overallSuccess = 
      results.linting.success && 
      results.security.success && 
      results.tests.success;
    
    console.log(\`Statut global: \${overallSuccess ? 'SUCCÈS' : 'ÉCHEC'}\`);
  } catch (error) {
    console.error('Erreur dans l\\'exécution du workflow:', error);
  } finally {
    // Toujours arrêter proprement le workflow
    await workflow.shutdown();
  }
}

main();
\`\`\`

## Exécution

\`\`\`bash
# Installer les dépendances
npm install

# Exécuter l'exemple
ts-node usage-example.ts
\`\`\`

## Explication

Cet exemple illustre:

1. Comment créer un workflow qui orchestre plusieurs agents spécialisés
2. Comment structurer un processus de validation de code en étapes logiques
3. Comment chaque agent effectue une tâche spécifique dans le workflow
4. Comment agréger et communiquer les résultats

Ce modèle de workflow peut être adapté pour d'autres cas d'utilisation comme le déploiement continu, l'analyse de données ou la génération de rapports.
`;

    await fs.writeFile(path.join(categoryDir, `${exampleName}.md`), exampleContent);
}

/**
 * Formate le nom d'une catégorie pour l'affichage
 */
function formatCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
        'agents': 'Agents',
        'mcp': 'MCP',
        'integration': 'Intégration',
        'workflows': 'Workflows'
    };

    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Détermine la position d'une catégorie dans la barre latérale
 */
function getCategoryPosition(category: string): number {
    const positions: Record<string, number> = {
        'agents': 1,
        'mcp': 2,
        'integration': 3,
        'workflows': 4
    };

    return positions[category] || 99;
}

/**
 * Formate le nom d'un exemple pour l'affichage
 */
function formatExampleName(example: string): string {
    return example
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Obtient la description d'une catégorie
 */
function getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
        'agents': 'Exemples de code montrant comment créer et utiliser différents types d\'agents dans votre application.',
        'mcp': 'Exemples d\'implémentation du protocole Model Context Protocol (MCP) pour les clients et serveurs.',
        'integration': 'Exemples montrant comment intégrer la plateforme avec des services et API externes.',
        'workflows': 'Exemples de workflows complets combinant plusieurs agents et services pour accomplir des tâches complexes.'
    };

    return descriptions[category] || 'Exemples de code pour cette catégorie.';
}