import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../../coreDoDotmcp-agent';

import { GeneratorAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
interface IterationConfig {
  name: string;
  description: string;
  tasks: IterationTask[];
  dependencies?: string[];
  estimatedEffort?: string;
}

interface IterationTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  type: 'component' | 'route' | 'api' | 'test' | 'doc' | 'other';
  filePath?: string;
  dependencies?: string[];
  assignedTo?: string;
}

export class DevGenerator implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent, MCPAgent , GeneratorAgent{
  name = 'dev-generator';
  description = 'Génère les composants nécessaires pour continuer l\'itération du développement dans le cadre de la migration PHP vers Remix';

  private templateMap = {
    component: `import React from 'react';
import { useTranslation } from 'react-i18next';

interface {{ComponentName}}Props {
  // TODO: Définir les propriétés du composant
}

/**
 * {{ComponentName}} - {{description}}
 * 
 * @component
 * Créé pour l'itération: {{iterationName}}
 */
export function {{ComponentName}}(props: {{ComponentName}}Props) {
  const { t } = useTranslation();
  
  return (
    <div className="{{componentClassName}}">
      <h2>{t('{{translationKey}}')}</h2>
      {/* TODO: Implémenter le composant */}
    </div>
  );

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  name: string = '';
  type: string = '';
  version: string = '1.0.0';
}
`,
    
    route: `import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { MetaFunction } from '@remix-run/react';

/**
 * Route: {{routePath}}
 * Description: {{description}}
 * Itération: {{iterationName}}
 */

export const meta: MetaFunction = () => {
  return [
    { title: "{{pageTitle}}" },
    { name: "description", content: "{{metaDescription}}" }
  ];
};

export const loader = async ({ request, params }) => {
  const url = new URL(request.url);
  
  // TODO: Implémenter la logique métier
  // Appel à l'API ou autre source de données
  
  return json({
    // Données à retourner
  });
};

export default function {{componentName}}() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>{{pageTitle}}</h1>
      {/* TODO: Implémenter l'interface utilisateur */}
    </div>
  );
}
`,
    
    api: `import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Contrôleur: {{controllerName}}
 * Description: {{description}}
 * Itération: {{iterationName}}
 */
@ApiTags('{{apiTag}}')
@Controller('{{apiPath}}')
export class {{controllerName}}Controller {
  
  @Get()
  @ApiOperation({ summary: 'Récupère les données' })
  @ApiResponse({ status: 200, description: 'Données récupérées avec succès' })
  async findAll() {
    // TODO: Implémenter la logique pour récupérer les données
    return [];
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Récupère une entité par ID' })
  @ApiResponse({ status: 200, description: 'Entité récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Entité non trouvée' })
  async findOne(@Param('id') id: string) {
    // TODO: Implémenter la logique pour récupérer une entité
    return { id };
  }
  
  @Post()
  @ApiOperation({ summary: 'Crée une nouvelle entité' })
  @ApiResponse({ status: 201, description: 'Entité créée avec succès' })
  async create(@Body() createDto: any) {
    // TODO: Implémenter la logique pour créer une entité
    return createDto;
  }
}
`,
    
    test: `import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{componentName}} } from '../{{componentPath}}';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


/**
 * Tests pour: {{componentName}}
 * Description: {{description}}
 * Itération: {{iterationName}}
 */
describe('{{componentName}}', () => {
  test('devrait s\'afficher correctement', () => {
    // Arrange
    render(<{{componentName}} />);
    
    // Act - aucune action nécessaire pour ce test
    
    // Assert
    expect(screen.getByText(/{{expectedText}}/i)).toBeInTheDocument();
  });
  
  test('devrait gérer l\'interaction utilisateur', async () => {
    // Arrange
    render(<{{componentName}} />);
    
    // Act
    // TODO: Simuler une interaction utilisateur
    // const button = screen.getByRole('button', { name: /click me/i });
    // await userEvent.click(button);
    
    // Assert
    // TODO: Vérifier le comportement attendu
    // await waitFor(() => {
    //   expect(screen.getByText(/résultat attendu/i)).toBeInTheDocument();
    // });
  });
});
`,
    
    iteration: `# Itération: {{iterationName}}

## Description
{{description}}

## Tâches
{{tasks}}

## Dépendances
{{dependencies}}

## Effort estimé
{{estimatedEffort}}

## État actuel
- Date de début: {{startDate}}
- Date prévue de fin: {{endDate}}
- Progression: {{progress}}%

## Notes
- Créé le {{creationDate}}
`
  };

  async process(context: MCPContext): Promise<any> {
    const {
      iterationName,
      iterationDescription,
      outputDir,
      tasksConfig,
      createIteration = true,
      createComponents = true
    } = context.inputs;
    
    if (!iterationName) {
      return {
        success: false,
        error: "Le nom de l'itération n'est pas spécifié"
      };
    }
    
    if (!outputDir) {
      return {
        success: false,
        error: "Le répertoire de sortie n'est pas spécifié"
      };
    }
    
    try {
      // Créer le répertoire de sortie s'il n'existe pas
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Préparer l'objet de configuration de l'itération
      const iterationConfig: IterationConfig = {
        name: iterationName,
        description: iterationDescription || `Itération ${iterationName} de la migration PHP vers Remix`,
        tasks: tasksConfig?.tasks || this.generateDefaultTasks(iterationName),
        dependencies: tasksConfig?.dependencies || [],
        estimatedEffort: tasksConfig?.estimatedEffort || "À déterminer"
      };
      
      const generatedFiles = [];
      
      // Générer le fichier de configuration de l'itération si demandé
      if (createIteration) {
        const iterationFilePath = this.generateIterationFile(iterationConfig, outputDir);
        generatedFiles.push(iterationFilePath);
      }
      
      // Générer les composants pour chaque tâche si demandé
      if (createComponents) {
        const componentFiles = this.generateComponentsForTasks(iterationConfig, outputDir);
        generatedFiles.push(...componentFiles);
      }
      
      return {
        success: true,
        data: {
          iteration: iterationConfig,
          generatedFiles,
          totalFiles: generatedFiles.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de la génération des composants pour l'itération: ${error.message}`
      };
    }
  }
  
  private generateDefaultTasks(iterationName: string): IterationTask[] {
    // Générer des tâches par défaut pour l'itération
    return [
      {
        id: `${iterationName}-task-1`,
        name: "Analyse des routes existantes",
        description: "Analyser les routes PHP existantes à migrer dans cette itération",
        status: "pending",
        type: "other"
      },
      {
        id: `${iterationName}-task-2`,
        name: "Création des composants Remix",
        description: "Créer les composants Remix nécessaires pour cette itération",
        status: "pending",
        type: "component",
        filePath: "app/components/"
      },
      {
        id: `${iterationName}-task-3`,
        name: "Implémentation des routes",
        description: "Implémenter les routes Remix correspondant aux pages PHP",
        status: "pending",
        type: "route",
        filePath: "app/routes/"
      },
      {
        id: `${iterationName}-task-4`,
        name: "Création des points d'API",
        description: "Créer les points d'API NestJS pour les données",
        status: "pending",
        type: "api",
        filePath: "apps/backend/src/controllers/"
      },
      {
        id: `${iterationName}-task-5`,
        name: "Tests d'intégration",
        description: "Créer et exécuter les tests d'intégration pour les nouvelles fonctionnalités",
        status: "pending",
        type: "test"
      }
    ];
  }
  
  private generateIterationFile(config: IterationConfig, outputDir: string): string {
    // Générer le fichier markdown de l'itération
    const now = new Date();
    const creationDate = now.toISOString().split('T')[0];
    const endDate = new Date(now.setDate(now.getDate() + 14)).toISOString().split('T')[0];
    
    // Formatage des tâches pour le markdown
    const tasksMarkdown = config.tasks.map(task => {
      return `- [${task.status === 'completed' ? 'x' : ' '}] **${task.name}**: ${task.description} (${task.type})`;
    }).join('\n');
    
    // Formatage des dépendances pour le markdown
    const dependenciesMarkdown = config.dependencies && config.dependencies.length > 0
      ? config.dependencies.map(dep => `- ${dep}`).join('\n')
      : "Aucune dépendance externe";
    
    // Générer le contenu du fichier
    let content = this.templateMap.iteration
      .replace(/\{\{iterationName\}\}/g, config.name)
      .replace(/\{\{description\}\}/g, config.description)
      .replace(/\{\{tasks\}\}/g, tasksMarkdown)
      .replace(/\{\{dependencies\}\}/g, dependenciesMarkdown)
      .replace(/\{\{estimatedEffort\}\}/g, config.estimatedEffort)
      .replace(/\{\{startDate\}\}/g, creationDate)
      .replace(/\{\{endDate\}\}/g, endDate)
      .replace(/\{\{progress\}\}/g, '0')
      .replace(/\{\{creationDate\}\}/g, creationDate);
    
    // Chemin du fichier de sortie
    const fileName = `iteration-${config.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    const filePath = path.join(outputDir, fileName);
    
    // Écrire le fichier
    fs.writeFileSync(filePath, content, 'utf8');
    
    return filePath;
  }
  
  private generateComponentsForTasks(config: IterationConfig, baseOutputDir: string): string[] {
    const generatedFiles: string[] = [];
    
    // Créer un composant pour chaque tâche de type composant ou route
    for (const task of config.tasks) {
      if (task.type === 'component' || task.type === 'route' || task.type === 'api' || task.type === 'test') {
        try {
          const fileName = this.generateComponentFile(task, config, baseOutputDir);
          if (fileName) {
            generatedFiles.push(fileName);
          }
        } catch (error) {
          console.error(`Erreur lors de la génération du composant pour la tâche ${task.id}:`, error);
        }
      }
    }
    
    return generatedFiles;
  }
  
  private generateComponentFile(task: IterationTask, config: IterationConfig, baseOutputDir: string): string {
    // Déterminer le type de fichier à générer
    const templateKey = task.type;
    const template = this.templateMap[templateKey];
    
    if (!template) {
      throw new Error(`Template non trouvé pour le type ${task.type}`);
    }
    
    // Préparer le nom du composant
    const componentName = this.createComponentName(task.name);
    const componentClassName = this.createComponentClassName(componentName);
    
    // Déterminer le répertoire de sortie
    let outputDir = baseOutputDir;
    if (task.filePath) {
      // Utiliser le chemin spécifié dans la tâche
      outputDir = path.join(baseOutputDir, task.filePath);
    } else {
      // Utiliser un chemin par défaut basé sur le type
      switch (task.type) {
        case 'component':
          outputDir = path.join(baseOutputDir, 'components');
          break;
        case 'route':
          outputDir = path.join(baseOutputDir, 'routes');
          break;
        case 'api':
          outputDir = path.join(baseOutputDir, 'api');
          break;
        case 'test':
          outputDir = path.join(baseOutputDir, 'tests');
          break;
        default:
          outputDir = path.join(baseOutputDir, task.type);
      }
    }
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Déterminer le nom du fichier
    let fileName = '';
    switch (task.type) {
      case 'component':
        fileName = `${componentName}.tsx`;
        break;
      case 'route':
        fileName = `${componentName.toLowerCase()}.tsx`;
        break;
      case 'api':
        fileName = `${componentName.toLowerCase()}.controller.ts`;
        break;
      case 'test':
        fileName = `${componentName}.test.tsx`;
        break;
      default:
        fileName = `${componentName.toLowerCase()}.ts`;
    }
    
    // Chemin complet du fichier
    const filePath = path.join(outputDir, fileName);
    
    // Préparer les variables pour le template
    const routePath = task.name.toLowerCase().replace(/\s+/g, '-');
    const apiPath = routePath;
    const apiTag = task.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    const controllerName = componentName;
    const pageTitle = task.name;
    const metaDescription = task.description;
    const translationKey = `${componentName.toLowerCase()}.title`;
    const componentPath = `./${componentName}`;
    const expectedText = task.name;
    
    // Remplacer les variables dans le template
    let content = template
      .replace(/\{\{ComponentName\}\}/g, componentName)
      .replace(/\{\{componentName\}\}/g, componentName)
      .replace(/\{\{componentClassName\}\}/g, componentClassName)
      .replace(/\{\{description\}\}/g, task.description)
      .replace(/\{\{iterationName\}\}/g, config.name)
      .replace(/\{\{routePath\}\}/g, routePath)
      .replace(/\{\{pageTitle\}\}/g, pageTitle)
      .replace(/\{\{metaDescription\}\}/g, metaDescription)
      .replace(/\{\{translationKey\}\}/g, translationKey)
      .replace(/\{\{apiPath\}\}/g, apiPath)
      .replace(/\{\{apiTag\}\}/g, apiTag)
      .replace(/\{\{controllerName\}\}/g, controllerName)
      .replace(/\{\{componentPath\}\}/g, componentPath)
      .replace(/\{\{expectedText\}\}/g, expectedText);
    
    // Écrire le fichier
    fs.writeFileSync(filePath, content, 'utf8');
    
    return filePath;
  }
  
  private createComponentName(name: string): string {
    // Convertir un nom en PascalCase pour le nom du composant
    // Exemple: "Gestion des utilisateurs" -> "GestionDesUtilisateurs"
    return name
      .split(/[\s_-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }
  
  private createComponentClassName(componentName: string): string {
    // Convertir un nom de composant en kebab-case pour la classe CSS
    // Exemple: "GestionDesUtilisateurs" -> "gestion-des-utilisateurs"
    return componentName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }
}

export default new DevGenerator();