/**
 * Agent générateur de composants React
 * Génère des composants React basés sur différents modèles et templates
 * Date: 16 avril 2025
 */

import { AbstractGeneratorAgent, GeneratorConfig, GeneratedFile } from '../core/abstract-generator-agent';
import { AgentContext } from '../core/mcp-agent';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Configuration spécifique à l'agent générateur de composants React
 */
export interface ReactComponentConfig extends GeneratorConfig {
  componentName: string;        // Nom du composant à générer
  componentType: 'functional' | 'class' | 'hook' | 'page' | 'layout'; // Type de composant
  cssType?: 'css' | 'scss' | 'styled-components' | 'tailwind' | 'none'; // Type de style
  typescript?: boolean;         // Utiliser TypeScript
  stateManagement?: 'useState' | 'useReducer' | 'redux' | 'mobx' | 'none'; // Gestion d'état
  testing?: boolean;            // Générer des tests
  storybook?: boolean;          // Générer des stories Storybook
  props?: Array<{               // Propriétés du composant
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
  }>;
  features?: string[];          // Fonctionnalités à inclure (ex: 'routing', 'i18n')
  projectStructure?: 'atomic' | 'feature-based' | 'standard'; // Structure de projet
}

/**
 * Agent qui génère des composants React selon différents patterns et configurations
 */
export class ReactComponentGenerator extends AbstractGeneratorAgent<ReactComponentConfig> {
  // Identifiants de l'agent
  public id = 'react-component-generator';
  public name = 'Générateur de Composants React';
  public version = '1.0.0';
  public description = "Génère des composants React personnalisés selon différents patterns et configurations";

  // Templates par défaut
  private defaultTemplates: Record<string, string> = {
    'functional-ts': `import React, { FC } from 'react';
{{imports}}

interface {{componentName}}Props {
{{propsInterface}}
}

/**
 * {{componentName}} - {{componentDescription}}
 */
const {{componentName}}: FC<{{componentName}}Props> = ({ {{propsDestructuring}} }) => {
{{hooks}}
  return (
    <div{{className}}>
      {{content}}
    </div>
  );
};

export default {{componentName}};`,

    'functional-js': `import React from 'react';
{{imports}}

/**
 * {{componentName}} - {{componentDescription}}
 */
const {{componentName}} = ({ {{propsDestructuring}} }) => {
{{hooks}}
  return (
    <div{{className}}>
      {{content}}
    </div>
  );
};

export default {{componentName}};`,

    'class-ts': `import React, { Component } from 'react';
{{imports}}

interface {{componentName}}Props {
{{propsInterface}}
}

interface {{componentName}}State {
{{stateInterface}}
}

/**
 * {{componentName}} - {{componentDescription}}
 */
class {{componentName}} extends Component<{{componentName}}Props, {{componentName}}State> {
  constructor(props: {{componentName}}Props) {
    super(props);
    this.state = {
      {{initialState}}
    };
  }

  render() {
    const { {{propsDestructuring}} } = this.props;
    
    return (
      <div{{className}}>
        {{content}}
      </div>
    );
  }
}

export default {{componentName}};`,

    'class-js': `import React, { Component } from 'react';
{{imports}}

/**
 * {{componentName}} - {{componentDescription}}
 */
class {{componentName}} extends Component {
  constructor(props) {
    super(props);
    this.state = {
      {{initialState}}
    };
  }

  render() {
    const { {{propsDestructuring}} } = this.props;
    
    return (
      <div{{className}}>
        {{content}}
      </div>
    );
  }
}

export default {{componentName}};`,

    'hook-ts': `import { useState, useEffect } from 'react';

interface Use{{componentName}}Props {
{{propsInterface}}
}

interface Use{{componentName}}Result {
{{returnInterface}}
}

/**
 * use{{componentName}} - {{componentDescription}}
 */
export const use{{componentName}} = (props: Use{{componentName}}Props): Use{{componentName}}Result => {
{{hookImplementation}}

  return {
    {{returnValues}}
  };
};`,

    'hook-js': `import { useState, useEffect } from 'react';

/**
 * use{{componentName}} - {{componentDescription}}
 */
export const use{{componentName}} = (props) => {
{{hookImplementation}}

  return {
    {{returnValues}}
  };
};`,

    'css': `.{{className}} {
  /* Styles de base */
  display: flex;
  flex-direction: column;
}`,

    'scss': `.{{className}} {
  /* Styles de base */
  display: flex;
  flex-direction: column;
  
  &__header {
    margin-bottom: 1rem;
  }
  
  &__content {
    flex: 1;
  }
  
  &__footer {
    margin-top: 1rem;
  }
}`,

    'styled-components-ts': `import styled from 'styled-components';

export const {{componentName}}Container = styled.div\`
  /* Styles de base */
  display: flex;
  flex-direction: column;
\`;

export const {{componentName}}Header = styled.header\`
  margin-bottom: 1rem;
\`;

export const {{componentName}}Content = styled.div\`
  flex: 1;
\`;

export const {{componentName}}Footer = styled.footer\`
  margin-top: 1rem;
\`;`,

    'test-ts': `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {{componentName}} from './{{componentName}}';

describe('{{componentName}}', () => {
  test('renders correctly', () => {
    render(<{{componentName}} {{defaultProps}} />);
    expect(screen.getByTestId('{{testId}}')).toBeInTheDocument();
  });

  {{additionalTests}}
});`,

    'test-js': `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {{componentName}} from './{{componentName}}';

describe('{{componentName}}', () => {
  test('renders correctly', () => {
    render(<{{componentName}} {{defaultProps}} />);
    expect(screen.getByTestId('{{testId}}')).toBeInTheDocument();
  });

  {{additionalTests}}
});`,

    'storybook-ts': `import React from 'react';
import { Story, Meta } from '@storybook/react';
import {{componentName}}, { {{componentName}}Props } from './{{componentName}}';

export default {
  title: '{{storyCategory}}/{{componentName}}',
  component: {{componentName}},
  argTypes: {
    {{argTypes}}
  },
} as Meta;

const Template: Story<{{componentName}}Props> = (args) => <{{componentName}} {...args} />;

export const Default = Template.bind({});
Default.args = {
  {{defaultArgs}}
};

export const WithData = Template.bind({});
WithData.args = {
  {{withDataArgs}}
};`,

    'storybook-js': `import React from 'react';
import {{componentName}} from './{{componentName}}';

export default {
  title: '{{storyCategory}}/{{componentName}}',
  component: {{componentName}},
  argTypes: {
    {{argTypes}}
  },
};

const Template = (args) => <{{componentName}} {...args} />;

export const Default = Template.bind({});
Default.args = {
  {{defaultArgs}}
};

export const WithData = Template.bind({});
WithData.args = {
  {{withDataArgs}}
};`,

    'index-ts': `import {{componentName}} from './{{componentName}}';
export default {{componentName}};
export type { {{componentName}}Props } from './{{componentName}}';`,

    'index-js': `import {{componentName}} from './{{componentName}}';
export default {{componentName}};`
  };

  /**
   * Constructeur
   * @param config Configuration du générateur
   */
  constructor(config: Partial<ReactComponentConfig>) {
    super({
      outputDir: './src/components',
      templatesDir: './templates/react',
      overwrite: false,
      dryRun: false,
      format: 'tsx',
      prettify: true,
      createDirs: true,
      componentName: 'NewComponent',
      componentType: 'functional',
      cssType: 'css',
      typescript: true,
      stateManagement: 'useState',
      testing: false,
      storybook: false,
      props: [],
      ...config
    });
  }

  /**
   * Initialise les templates par défaut si aucun n'est trouvé
   */
  protected async prepare(): Promise<void> {
    // Si aucun template n'est chargé, utiliser ceux par défaut
    if (this.templates.size === 0) {
      for (const [name, content] of Object.entries(this.defaultTemplates)) {
        this.templates.set(name, content);
      }
      this.logger.info('Templates par défaut chargés');
    }
  }

  /**
   * Génère les fichiers de composant React
   */
  protected async generate(): Promise<void> {
    const { componentName, componentType, cssType, typescript, testing, storybook } = this.config;

    this.logger.info(`Génération du composant React "${componentName}" de type "${componentType}"`);

    // Déterminer les extensions de fichier
    const jsExtension = typescript ? '.tsx' : '.jsx';
    const cssExtension = cssType === 'scss' ? '.scss' : '.css';

    // Créer le répertoire du composant
    const componentDir = path.join(this.config.outputDir, componentName);
    
    // Générer le fichier principal du composant
    await this.generateComponentFile(componentDir, jsExtension);
    
    // Générer le fichier CSS si nécessaire
    if (cssType !== 'none' && cssType !== 'styled-components' && cssType !== 'tailwind') {
      await this.generateCssFile(componentDir, cssExtension);
    }

    // Générer le fichier styled-components si applicable
    if (cssType === 'styled-components') {
      await this.generateStyledComponentsFile(componentDir);
    }
    
    // Générer les tests si demandé
    if (testing) {
      await this.generateTestFile(componentDir, jsExtension);
    }
    
    // Générer les stories Storybook si demandé
    if (storybook) {
      await this.generateStorybookFile(componentDir, jsExtension);
    }
    
    // Générer un fichier index pour l'exportation
    await this.generateIndexFile(componentDir);
    
    this.logger.info(`Composant React "${componentName}" généré avec succès`);
  }

  /**
   * Génère le fichier principal du composant
   */
  private async generateComponentFile(componentDir: string, extension: string): Promise<void> {
    const { componentName, componentType, typescript, stateManagement, props } = this.config;
    
    // Déterminer le template à utiliser
    const templateKey = `${componentType}-${typescript ? 'ts' : 'js'}`;
    
    // Préparer les variables
    const variables: Record<string, string> = {
      componentName,
      componentDescription: `Composant ${componentName}`,
      imports: '',
      propsInterface: '',
      propsDestructuring: '',
      hooks: '',
      content: `<div data-testid="${this.camelCase(componentName)}">${componentName} Component</div>`,
      className: '',
      stateInterface: '',
      initialState: '',
      hookImplementation: '',
      returnValues: '',
      returnInterface: ''
    };
    
    // Gérer les importations
    let imports: string[] = [];
    
    // Préparer les props
    if (props && props.length > 0) {
      variables.propsDestructuring = props.map(prop => prop.name).join(', ');
      
      if (typescript) {
        variables.propsInterface = props.map(prop => {
          return `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`;
        }).join('\n');
      }
    } else {
      variables.propsInterface = '  // Définissez vos props ici';
      variables.propsDestructuring = '/* props */';
    }
    
    // Gérer la gestion d'état
    if (stateManagement === 'useState') {
      imports.push('useState');
      variables.hooks = '  const [state, setState] = useState({});\n';
    } else if (stateManagement === 'useReducer') {
      imports.push('useReducer');
      variables.hooks = '  const [state, dispatch] = useReducer((state, action) => {\n    switch (action.type) {\n      default:\n        return state;\n    }\n  }, {});\n';
    } else if (stateManagement === 'redux') {
      if (typescript) {
        imports = [...imports, ...['useDispatch', 'useSelector'].map(i => `import { ${i} } from 'react-redux';`)];
        variables.hooks = '  const dispatch = useDispatch();\n  const state = useSelector((state) => state);\n';
      } else {
        imports = [...imports, ...['useDispatch', 'useSelector'].map(i => `import { ${i} } from 'react-redux';`)];
        variables.hooks = '  const dispatch = useDispatch();\n  const state = useSelector((state) => state);\n';
      }
    }
    
    // Ajouter les importations spécifiques au React
    if (componentType !== 'hook') {
      if (imports.length > 0 && !imports.includes('React')) {
        if (typescript && componentType === 'functional') {
          // FC est déjà importé par défaut dans le template
        } else {
          imports.unshift('React');
        }
      }
    }
    
    // Gestion des styles
    if (this.config.cssType === 'css' || this.config.cssType === 'scss') {
      variables.imports += `import './${componentName}${this.config.cssType === 'scss' ? '.scss' : '.css'}';\n`;
      variables.className = ` className="${this.camelCase(componentName)}"`;
    } else if (this.config.cssType === 'styled-components') {
      variables.imports += `import { ${componentName}Container, ${componentName}Header, ${componentName}Content, ${componentName}Footer } from './${componentName}.styles';\n`;
      variables.content = `<${componentName}Container data-testid="${this.camelCase(componentName)}">
        <${componentName}Header>${componentName} Header</${componentName}Header>
        <${componentName}Content>
          ${componentName} Content
        </${componentName}Content>
        <${componentName}Footer>${componentName} Footer</${componentName}Footer>
      </${componentName}Container>`;
      variables.className = '';
    } else if (this.config.cssType === 'tailwind') {
      variables.className = ` className="flex flex-col"`;
    }
    
    // Formater les imports
    if (imports.length > 0) {
      if (imports.includes('React')) {
        imports = imports.filter(i => i !== 'React');
      }
      if (imports.length > 0) {
        variables.imports += `import { ${imports.join(', ')} } from 'react';\n`;
      }
    }
    
    // Recherche et application du template
    const template = this.templates.get(templateKey) || this.defaultTemplates[templateKey];
    
    if (!template) {
      throw new Error(`Template "${templateKey}" non trouvé`);
    }
    
    // Appliquer le template
    const content = this.applyTemplateVariables(template, variables);
    
    // Ajouter à la liste des fichiers générés
    this.generatedFiles.push({
      path: path.join(componentDir, `${componentName}${extension}`),
      content,
      type: 'component',
      template: templateKey,
      variables
    });
  }

  /**
   * Génère le fichier CSS pour le composant
   */
  private async generateCssFile(componentDir: string, extension: string): Promise<void> {
    const { componentName, cssType } = this.config;
    
    // Déterminer le template à utiliser
    const templateKey = cssType === 'scss' ? 'scss' : 'css';
    
    // Préparer les variables
    const variables: Record<string, string> = {
      className: this.camelCase(componentName)
    };
    
    // Rechercher et appliquer le template
    const template = this.templates.get(templateKey) || this.defaultTemplates[templateKey];
    
    if (!template) {
      throw new Error(`Template "${templateKey}" non trouvé`);
    }
    
    // Appliquer le template
    const content = this.applyTemplateVariables(template, variables);
    
    // Ajouter à la liste des fichiers générés
    this.generatedFiles.push({
      path: path.join(componentDir, `${componentName}${extension}`),
      content,
      type: 'style',
      template: templateKey,
      variables
    });
  }

  /**
   * Génère le fichier styled-components pour le composant
   */
  private async generateStyledComponentsFile(componentDir: string): Promise<void> {
    const { componentName, typescript } = this.config;
    
    // Déterminer le template à utiliser
    const templateKey = 'styled-components-ts';
    const extension = typescript ? '.ts' : '.js';
    
    // Préparer les variables
    const variables: Record<string, string> = {
      componentName
    };
    
    // Rechercher et appliquer le template
    const template = this.templates.get(templateKey) || this.defaultTemplates[templateKey];
    
    if (!template) {
      throw new Error(`Template "${templateKey}" non trouvé`);
    }
    
    // Appliquer le template
    const content = this.applyTemplateVariables(template, variables);
    
    // Ajouter à la liste des fichiers générés
    this.generatedFiles.push({
      path: path.join(componentDir, `${componentName}.styles${extension}`),
      content,
      type: 'styled-components',
      template: templateKey,
      variables
    });
  }

  /**
   * Génère le fichier de test pour le composant
   */
  private async generateTestFile(componentDir: string, extension: string): Promise<void> {
    const { componentName, typescript, props } = this.config;
    
    // Déterminer le template à utiliser
    const templateKey = `test-${typescript ? 'ts' : 'js'}`;
    
    // Préparer les variables
    const variables: Record<string, string> = {
      componentName,
      testId: this.camelCase(componentName),
      additionalTests: '',
      defaultProps: props && props.length > 0 
        ? props
            .filter(p => p.required)
            .map(p => `${p.name}={${p.defaultValue || this.getDefaultValueForType(p.type)}}`)
            .join(' ')
        : ''
    };
    
    // Ajouter des tests supplémentaires pour les props
    if (props && props.length > 0) {
      // Ajouter des tests pour les props qui affectent l'interface utilisateur
      const interactiveProps = props.filter(p => ['onClick', 'onChange'].some(eventName => p.name.includes(eventName)));
      
      if (interactiveProps.length > 0) {
        variables.additionalTests = interactiveProps.map(prop => {
          return `
  test('calls ${prop.name} when triggered', () => {
    const ${prop.name} = jest.fn();
    render(<${componentName} ${prop.name}={${prop.name}} ${variables.defaultProps} />);
    fireEvent.click(screen.getByTestId('${variables.testId}'));
    expect(${prop.name}).toHaveBeenCalled();
  });`;
        }).join('\n');
      }
    }
    
    // Rechercher et appliquer le template
    const template = this.templates.get(templateKey) || this.defaultTemplates[templateKey];
    
    if (!template) {
      throw new Error(`Template "${templateKey}" non trouvé`);
    }
    
    // Appliquer le template
    const content = this.applyTemplateVariables(template, variables);
    
    // Extension de fichier de test
    const testExtension = typescript ? '.test.tsx' : '.test.jsx';
    
    // Ajouter à la liste des fichiers générés
    this.generatedFiles.push({
      path: path.join(componentDir, `${componentName}${testExtension}`),
      content,
      type: 'test',
      template: templateKey,
      variables
    });
  }

  /**
   * Génère le fichier de story Storybook pour le composant
   */
  private async generateStorybookFile(componentDir: string, extension: string): Promise<void> {
    const { componentName, typescript, props } = this.config;
    
    // Déterminer le template à utiliser
    const templateKey = `storybook-${typescript ? 'ts' : 'js'}`;
    
    // Déterminer la catégorie Storybook en fonction du type de composant
    const storyCategory = this.determineStoryCategory();
    
    // Préparer les variables
    const variables: Record<string, string> = {
      componentName,
      storyCategory,
      argTypes: '',
      defaultArgs: '',
      withDataArgs: ''
    };
    
    // Générer les argTypes et args basés sur les props
    if (props && props.length > 0) {
      variables.argTypes = props.map(prop => {
        const type = this.getStorybookControlType(prop.type);
        return `${prop.name}: { control: '${type}' }`;
      }).join(',\n    ');
      
      variables.defaultArgs = props.map(prop => {
        return `${prop.name}: ${prop.defaultValue || this.getDefaultValueForType(prop.type)}`;
      }).join(',\n  ');
      
      variables.withDataArgs = props.map(prop => {
        // Fournir des données de test plus substantielles pour cette variante
        return `${prop.name}: ${this.getSampleValueForType(prop.type, prop.name)}`;
      }).join(',\n  ');
    }
    
    // Rechercher et appliquer le template
    const template = this.templates.get(templateKey) || this.defaultTemplates[templateKey];
    
    if (!template) {
      throw new Error(`Template "${templateKey}" non trouvé`);
    }
    
    // Appliquer le template
    const content = this.applyTemplateVariables(template, variables);
    
    // Extension de fichier Storybook
    const storybookExtension = typescript ? '.stories.tsx' : '.stories.jsx';
    
    // Ajouter à la liste des fichiers générés
    this.generatedFiles.push({
      path: path.join(componentDir, `${componentName}${storybookExtension}`),
      content,
      type: 'storybook',
      template: templateKey,
      variables
    });
  }

  /**
   * Génère un fichier index pour exporter le composant
   */
  private async generateIndexFile(componentDir: string): Promise<void> {
    const { componentName, typescript } = this.config;
    
    // Déterminer le template à utiliser
    const templateKey = `index-${typescript ? 'ts' : 'js'}`;
    const extension = typescript ? '.ts' : '.js';
    
    // Préparer les variables
    const variables: Record<string, string> = {
      componentName
    };
    
    // Rechercher et appliquer le template
    const template = this.templates.get(templateKey) || this.defaultTemplates[templateKey];
    
    if (!template) {
      throw new Error(`Template "${templateKey}" non trouvé`);
    }
    
    // Appliquer le template
    const content = this.applyTemplateVariables(template, variables);
    
    // Ajouter à la liste des fichiers générés
    this.generatedFiles.push({
      path: path.join(componentDir, `index${extension}`),
      content,
      type: 'index',
      template: templateKey,
      variables
    });
  }

  /**
   * Applique les variables à un template
   */
  private applyTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    // Remplacer toutes les variables dans le template
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    return result;
  }

  /**
   * Convertit un nom en camelCase
   */
  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Retourne une valeur par défaut en fonction du type TypeScript
   */
  private getDefaultValueForType(type: string): string {
    if (type.includes('string')) return '""';
    if (type.includes('number')) return '0';
    if (type.includes('boolean')) return 'false';
    if (type.includes('[]') || type.includes('Array')) return '[]';
    if (type.includes('object') || type.includes('{')) return '{}';
    if (type.includes('Function') || type.includes('=>')) return '() => {}';
    return '""';
  }

  /**
   * Retourne un exemple de valeur en fonction du type TypeScript
   */
  private getSampleValueForType(type: string, name: string): string {
    if (type.includes('string')) {
      if (name.includes('name')) return '"John Doe"';
      if (name.includes('title')) return '"Sample Title"';
      if (name.includes('description')) return '"This is a sample description for the component"';
      if (name.includes('url') || name.includes('link')) return '"https://example.com"';
      if (name.includes('image')) return '"https://via.placeholder.com/150"';
      return '"Sample Value"';
    }
    
    if (type.includes('number')) {
      if (name.includes('count')) return '42';
      if (name.includes('index')) return '0';
      if (name.includes('id')) return '101';
      return '42';
    }
    
    if (type.includes('boolean')) {
      if (name.includes('is') || name.includes('has')) return 'true';
      return 'true';
    }
    
    if (type.includes('[]') || type.includes('Array')) {
      if (type.includes('string')) {
        if (name.includes('names')) return '["John", "Jane", "Bob"]';
        if (name.includes('items')) return '["Item 1", "Item 2", "Item 3"]';
        return '["Sample 1", "Sample 2", "Sample 3"]';
      }
      
      if (type.includes('number')) return '[1, 2, 3, 4, 5]';
      
      if (type.includes('object')) {
        if (name.includes('users')) return '[{ id: 1, name: "John" }, { id: 2, name: "Jane" }]';
        if (name.includes('items')) return '[{ id: 1, title: "Item 1" }, { id: 2, title: "Item 2" }]';
        return '[{ id: 1, value: "Sample 1" }, { id: 2, value: "Sample 2" }]';
      }
      
      return '[]';
    }
    
    if (type.includes('object') || type.includes('{')) {
      if (name.includes('user')) return '{ id: 1, name: "John", email: "john@example.com" }';
      if (name.includes('config')) return '{ theme: "dark", language: "fr" }';
      return '{ key: "value" }';
    }
    
    if (type.includes('Function') || type.includes('=>')) {
      if (name.includes('onClick')) return '() => console.log("Clicked!")';
      if (name.includes('onChange')) return '(value) => console.log("Changed:", value)';
      if (name.includes('onSubmit')) return '(data) => console.log("Submitted:", data)';
      return '() => {}';
    }
    
    return '""';
  }

  /**
   * Détermine la catégorie Storybook en fonction du type de composant
   */
  private determineStoryCategory(): string {
    switch (this.config.componentType) {
      case 'functional':
      case 'class':
        if (this.config.projectStructure === 'atomic') {
          // Essayer de déterminer le niveau atomique du composant
          const name = this.config.componentName.toLowerCase();
          if (name.includes('button') || name.includes('icon') || name.includes('input')) {
            return 'Atoms';
          } else if (name.includes('card') || name.includes('form') || name.includes('list')) {
            return 'Molecules';
          } else if (name.includes('section') || name.includes('header') || name.includes('footer')) {
            return 'Organisms';
          } else if (name.includes('template')) {
            return 'Templates';
          } else if (name.includes('page')) {
            return 'Pages';
          }
        }
        return 'Components';
      case 'page':
        return 'Pages';
      case 'layout':
        return 'Layouts';
      case 'hook':
        return 'Hooks';
      default:
        return 'Components';
    }
  }

  /**
   * Retourne le type de contrôle Storybook approprié pour un type TypeScript
   */
  private getStorybookControlType(type: string): string {
    if (type.includes('string')) return 'text';
    if (type.includes('number')) return 'number';
    if (type.includes('boolean')) return 'boolean';
    if (type.includes('[]') || type.includes('Array')) return 'array';
    if (type.includes('object') || type.includes('{')) return 'object';
    if (type.includes('enum') || type.includes('|')) return 'select';
    if (type.includes('Function') || type.includes('=>')) return 'function';
    if (type.includes('Date')) return 'date';
    return 'text';
  }
}

/**
 * Exporte une factory pour créer l'agent
 */
export const createReactComponentGenerator = (config?: Partial<ReactComponentConfig>) => {
  return new ReactComponentGenerator(config || {});
};