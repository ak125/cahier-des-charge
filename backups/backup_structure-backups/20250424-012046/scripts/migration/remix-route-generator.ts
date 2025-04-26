/**
 * remix-route-generator.ts
 * 
 * Générateur automatique de routes Remix basé sur les plans de migration
 * Crée les fichiers de route, loaders, actions, composants UI et tests
 * 
 * Usage: ts-node remix-route-generator.ts <chemin-plan-migration.md> [--dry-run]
 * 
 * Date: 11 avril 2025
 */

import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';
import { execSync } from child_processstructure-agent';

interface MigrationPlan {
  fileName: string;
  outputDir: string;
  routePath: string;
  componentName: string;
  fields: {
    name: string;
    type: string;
    isRequired: boolean;
    description?: string;
    label?: string;
    isFormField?: boolean;
  }[];
  endpoints: {
    method: string;
    path: string;
    description: string;
    returnType?: string;
    params?: string[];
  }[];
  hasForms: boolean;
  hasTables: boolean;
}

/**
 * Extrait les informations du plan de migration
 */
function extractRemixMigrationInfo(filePath: string): MigrationPlan {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.migration_plan.md');
  const phpFileName = fileName.endsWith('.php') ? fileName : `${fileName}.php`;
  const baseName = phpFileName.replace('.php', '');
  
  // Convertir le nom en kebab-case pour les routes Remix
  const kebabCaseName = baseName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]/g, '-')
    .toLowerCase();
  
  // Convertir en PascalCase pour les noms de composants
  const pascalCaseName = kebabCaseName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Extraire les informations sur les endpoints à partir du contenu du plan
  const endpointsRegex = /## 🎨 Plan de migration Remix\s+([\s\S]+?)(?=##|$)/;
  const endpointsMatch = content.match(endpointsRegex);
  
  const endpoints = [];
  const fields = [];
  let hasForms = false;
  let hasTables = false;
  
  if (endpointsMatch) {
    const endpointsContent = endpointsMatch[1];
    // Analyser les informations du tableau pour extraire les endpoints et déduire la structure
    const tableRowsRegex = /\|(.*?)\|(.*?)\|/g;
    let match;
    
    while ((match = tableRowsRegex.exec(endpointsContent)) !== null) {
      const source = match[1].trim();
      const target = match[2].trim();
      
      if (source !== 'Élément PHP' && target !== 'Cible Remix') {
        // Détecter les formulaires
        if (source.toLowerCase().includes('formulaire') || source.toLowerCase().includes('form')) {
          hasForms = true;
          endpoints.push({
            method: 'POST',
            path: `/${kebabCaseName}`,
            description: `Traiter le formulaire ${kebabCaseName}`
          });
        }
        
        // Détecter les chargements de données
        if (source.toLowerCase().includes('chargement') || source.toLowerCase().includes('load')) {
          endpoints.push({
            method: 'GET',
            path: `/${kebabCaseName}`,
            description: `Charger les données pour ${kebabCaseName}`
          });
        }
        
        // Détecter les tables ou listes
        if (source.toLowerCase().includes('table') || 
            source.toLowerCase().includes('liste') || 
            source.toLowerCase().includes('list')) {
          hasTables = true;
        }
      }
    }
  }
  
  // Si aucun endpoint n'a été détecté, ajouter un loader par défaut
  if (endpoints.length === 0) {
    endpoints.push({
      method: 'GET',
      path: `/${kebabCaseName}`,
      description: `Charger la page ${kebabCaseName}`
    });
  }
  
  // Extraire des champs potentiels depuis le contenu
  // Chercher les mentions de champs, propriétés ou colonnes dans le contenu
  const fieldsRegex = /(field|property|champ|propriété|colonne|input)\s+['"]?(\w+)['"]?\s+(is|of type|de type)\s+['"]?(\w+)['"]?/gi;
  let fieldMatch;
  
  while ((fieldMatch = fieldsRegex.exec(content)) !== null) {
    const fieldName = fieldMatch[2];
    const fieldType = mapPhpTypeToTypescript(fieldMatch[4]);
    
    // Créer un libellé lisible pour le champ
    const label = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
    
    fields.push({
      name: fieldName,
      type: fieldType,
      isRequired: true,
      label,
      isFormField: hasForms && !['id', 'createdAt', 'updatedAt'].includes(fieldName)
    });
  }
  
  // Si aucun champ n'a été détecté, ajouter des champs par défaut
  if (fields.length === 0) {
    const defaultFields = [
      { name: 'id', type: 'number', label: 'ID' },
      { name: 'title', type: 'string', label: 'Titre' },
      { name: 'description', type: 'string', label: 'Description' },
      { name: 'createdAt', type: 'Date', label: 'Date de création' }
    ];
    
    defaultFields.forEach(field => {
      fields.push({
        ...field,
        isRequired: field.name !== 'description',
        isFormField: hasForms && !['id', 'createdAt', 'updatedAt'].includes(field.name)
      });
    });
  }
  
  return {
    fileName: phpFileName,
    outputDir: `app/routes/${kebabCaseName}`,
    routePath: `/${kebabCaseName}`,
    componentName: pascalCaseName,
    fields,
    endpoints,
    hasForms,
    hasTables
  };
}

/**
 * Mappe les types PHP vers TypeScript
 */
function mapPhpTypeToTypescript(phpType: string): string {
  const typeMap: { [key: string]: string } = {
    'int': 'number',
    'integer': 'number',
    'float': 'number',
    'double': 'number',
    'string': 'string',
    'bool': 'boolean',
    'boolean': 'boolean',
    'array': 'any[]',
    'object': 'Record<string, any>',
    'mixed': 'any',
    'null': 'null',
    'resource': 'any',
    'callable': 'Function',
    'iterable': 'any[]',
    'void': 'void',
    'date': 'Date',
    'datetime': 'Date'
  };
  
  return typeMap[phpType.toLowerCase()] || 'any';
}

/**
 * Génère le fichier de route principal Remix
 */
function generateRouteFile(plan: MigrationPlan): string {
  const { componentName, hasForms, hasTables, fields } = plan;
  
  // Fonction pour générer des importations
  const generateImports = () => {
    let imports = `import { json, LoaderFunction, MetaFunction } from @remix-run/nodestructure-agent";\n`;
    imports += `import { useLoaderData, Link } from @remix-run/reactstructure-agent";\n`;
    
    if (hasForms) {
      imports += `import { Form, useActionData, useSubmit, useTransition } from @remix-run/reactstructure-agent";\n`;
      imports += `import { ActionFunction } from @remix-run/nodestructure-agent";\n`;
      imports += `import { z } from zodstructure-agent";\n`;
      imports += `import { conform, useForm } from @conform-to/reactstructure-agent";\n`;
      imports += `import { parse } from @conform-to/zodstructure-agent";\n`;
    }
    
    return imports;
  };
  
  // Fonction pour générer le schéma Zod si des formulaires sont présents
  const generateZodSchema = () => {
    if (!hasForms) return '';
    
    const formFields = fields.filter(field => field.isFormField);
    
    let schema = `// Schéma de validation Zod\nconst schema = z.object({\n`;
    
    formFields.forEach((field, index) => {
      const isLast = index === formFields.length - 1;
      
      schema += `  ${field.name}: z.${
        field.type === 'number' ? 'number()' :
        field.type === 'boolean' ? 'boolean()' :
        field.type === 'Date' ? 'string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)' :
        'string()'
      }${field.isRequired ? '' : '.optional()'}${isLast ? '' : ','}\n`;
    });
    
    schema += `});\n\n`;
    return schema;
  };
  
  // Fonction pour générer le loader
  const generateLoader = () => {
    return `// Fonction de chargement des données
export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Récupérer les données depuis l'API
    const response = await fetch(\`\${process.env.API_URL}/${componentName.toLowerCase()}\`);
    
    if (!response.ok) {
      throw new Error(\`Erreur lors de la récupération des données: \${response.status}\`);
    }
    
    const data = await response.json();
    
    return json({
      items: data,
      error: null
    });
  } catch (error) {
    console.error('Erreur du loader:', error);
    return json({
      items: [],
      error: 'Impossible de charger les données. Veuillez réessayer plus tard.'
    });
  }
};\n\n`;
  };
  
  // Fonction pour générer l'action si des formulaires sont présents
  const generateAction = () => {
    if (!hasForms) return '';
    
    return `// Fonction de traitement du formulaire
export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const submission = parse(formData, { schema });
    
    if (!submission.value || submission.intent !== 'submit') {
      return json({ status: 'error', errors: submission.error }, { status: 400 });
    }
    
    // Envoyer les données à l'API
    const response = await fetch(\`\${process.env.API_URL}/${componentName.toLowerCase()}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission.value),
    });
    
    if (!response.ok) {
      throw new Error(\`Erreur lors de la soumission du formulaire: \${response.status}\`);
    }
    
    return json({ status: 'success', errors: null });
  } catch (error) {
    console.error('Erreur de l\\'action:', error);
    return json({ 
      status: 'error', 
      errors: { _form: 'Erreur lors de la soumission du formulaire. Veuillez réessayer.' } 
    }, { status: 500 });
  }
};\n\n`;
  };
  
  // Fonction pour générer les métadonnées
  const generateMeta = () => {
    return `// Métadonnées de la page
export const meta: MetaFunction = () => {
  return [
    { title: "${componentName} | Mon application" },
    { name: "description", content: "Page ${componentName}" },
  ];
};\n\n`;
  };
  
  // Fonction pour générer le composant principal
  const generateComponent = () => {
    let component = `// Composant principal
export default function ${componentName}() {\n`;
    
    // Ajout des hooks nécessaires
    component += `  const { items, error } = useLoaderData<typeof loader>();\n`;
    
    if (hasForms) {
      component += `  const actionData = useActionData<typeof action>();\n`;
      component += `  const [form, { field }] = useForm<z.infer<typeof schema>>({
    id: "${componentName.toLowerCase()}-form",
    lastSubmission: actionData as any,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });\n`;
      component += `  const transition = useTransition();\n`;
      component += `  const isSubmitting = transition.state === "submitting";\n\n`;
    }
    
    // Début du JSX
    component += `  return (\n`;
    component += `    <div className="container mx-auto px-4 py-8">\n`;
    component += `      <h1 className="text-3xl font-bold mb-6">${componentName}</h1>\n\n`;
    
    // Affichage des erreurs
    component += `      {error && (\n`;
    component += `        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">\n`;
    component += `          {error}\n`;
    component += `        </div>\n`;
    component += `      )}\n\n`;
    
    // Affichage du formulaire si nécessaire
    if (hasForms) {
      component += `      <div className="bg-white p-6 rounded-lg shadow-md mb-8">\n`;
      component += `        <h2 className="text-xl font-semibold mb-4">Ajouter un nouvel élément</h2>\n`;
      component += `        <Form method="post" {...form.props}>\n`;
      
      // Génération des champs du formulaire
      fields.filter(field => field.isFormField).forEach(field => {
        component += `          <div className="mb-4">\n`;
        component += `            <label htmlFor="${field.name}" className="block text-sm font-medium text-gray-700 mb-1">\n`;
        component += `              ${field.label}${field.isRequired ? ' *' : ''}\n`;
        component += `            </label>\n`;
        
        if (field.type === 'boolean') {
          component += `            <input\n`;
          component += `              type="checkbox"\n`;
          component += `              {...field("${field.name}")}\n`;
          component += `              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"\n`;
          component += `            />\n`;
        } else if (field.type === 'Date') {
          component += `            <input\n`;
          component += `              type="date"\n`;
          component += `              {...field("${field.name}")}\n`;
          component += `              className="w-full px-3 py-2 border border-gray-300 rounded-md"\n`;
          component += `            />\n`;
        } else {
          component += `            <input\n`;
          component += `              type="${field.type === 'number' ? 'number' : 'text'}"\n`;
          component += `              {...field("${field.name}")}\n`;
          component += `              className="w-full px-3 py-2 border border-gray-300 rounded-md"\n`;
          component += `              ${field.isRequired ? 'required' : ''}\n`;
          component += `            />\n`;
        }
        
        component += `            {field("${field.name}").error && (\n`;
        component += `              <p className="mt-1 text-sm text-red-600">{field("${field.name}").error}</p>\n`;
        component += `            )}\n`;
        component += `          </div>\n`;
      });
      
      component += `          {actionData?.errors?._form && (\n`;
      component += `            <div className="text-red-600 mb-4">{actionData.errors._form}</div>\n`;
      component += `          )}\n\n`;
      
      component += `          <button\n`;
      component += `            type="submit"\n`;
      component += `            disabled={isSubmitting}\n`;
      component += `            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"\n`;
      component += `          >\n`;
      component += `            {isSubmitting ? "Envoi en cours..." : "Enregistrer"}\n`;
      component += `          </button>\n`;
      
      component += `        </Form>\n`;
      component += `      </div>\n\n`;
    }
    
    // Affichage des données sous forme de tableau si nécessaire
    if (hasTables) {
      component += `      <div className="bg-white rounded-lg shadow-md">\n`;
      component += `        <h2 className="text-xl font-semibold p-6 border-b">Liste des éléments</h2>\n\n`;
      
      component += `        {items.length === 0 ? (\n`;
      component += `          <div className="p-6 text-center text-gray-500">\n`;
      component += `            Aucun élément trouvé.\n`;
      component += `          </div>\n`;
      component += `        ) : (\n`;
      component += `          <div className="overflow-x-auto">\n`;
      component += `            <table className="min-w-full divide-y divide-gray-200">\n`;
      component += `              <thead className="bg-gray-50">\n`;
      component += `                <tr>\n`;
      
      // En-têtes du tableau
      fields.forEach(field => {
        component += `                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n`;
        component += `                    ${field.label}\n`;
        component += `                  </th>\n`;
      });
      
      component += `                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">\n`;
      component += `                    Actions\n`;
      component += `                  </th>\n`;
      component += `                </tr>\n`;
      component += `              </thead>\n`;
      component += `              <tbody className="bg-white divide-y divide-gray-200">\n`;
      component += `                {items.map((item) => (\n`;
      component += `                  <tr key={item.id} className="hover:bg-gray-50">\n`;
      
      // Cellules du tableau
      fields.forEach(field => {
        component += `                    <td className="px-6 py-4 whitespace-nowrap">\n`;
        if (field.type === 'Date') {
          component += `                      {new Date(item.${field.name}).toLocaleDateString()}\n`;
        } else if (field.type === 'boolean') {
          component += `                      {item.${field.name} ? "Oui" : "Non"}\n`;
        } else {
          component += `                      {item.${field.name}}\n`;
        }
        component += `                    </td>\n`;
      });
      
      component += `                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">\n`;
      component += `                      <Link\n`;
      component += `                        to={\`/${componentName.toLowerCase()}/\${item.id}\`}\n`;
      component += `                        className="text-indigo-600 hover:text-indigo-900 mr-4"\n`;
      component += `                      >\n`;
      component += `                        Détails\n`;
      component += `                      </Link>\n`;
      component += `                      <Link\n`;
      component += `                        to={\`/${componentName.toLowerCase()}/\${item.id}/edit\`}\n`;
      component += `                        className="text-blue-600 hover:text-blue-900"\n`;
      component += `                      >\n`;
      component += `                        Éditer\n`;
      component += `                      </Link>\n`;
      component += `                    </td>\n`;
      component += `                  </tr>\n`;
      component += `                ))}\n`;
      component += `              </tbody>\n`;
      component += `            </table>\n`;
      component += `          </div>\n`;
      component += `        )}\n`;
      component += `      </div>\n`;
    } else {
      // Affichage des données sous forme de cartes si pas de tableau
      component += `      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n`;
      component += `        {items.length === 0 ? (\n`;
      component += `          <div className="col-span-full text-center text-gray-500 bg-white p-8 rounded-lg shadow-md">\n`;
      component += `            Aucun élément trouvé.\n`;
      component += `          </div>\n`;
      component += `        ) : (\n`;
      component += `          items.map((item) => (\n`;
      component += `            <div key={item.id} className="bg-white p-6 rounded-lg shadow-md">\n`;
      
      fields.forEach(field => {
        if (field.name === 'title' || field.name === 'name') {
          component += `              <h3 className="text-lg font-semibold mb-2">{item.${field.name}}</h3>\n`;
        } else if (field.name === 'description') {
          component += `              <p className="text-gray-600 mb-4">{item.${field.name}}</p>\n`;
        } else if (field.name !== 'id') {
          component += `              <div className="text-sm mb-1">\n`;
          component += `                <span className="font-medium">${field.label}: </span>\n`;
          if (field.type === 'Date') {
            component += `                {new Date(item.${field.name}).toLocaleDateString()}\n`;
          } else if (field.type === 'boolean') {
            component += `                {item.${field.name} ? "Oui" : "Non"}\n`;
          } else {
            component += `                {item.${field.name}}\n`;
          }
          component += `              </div>\n`;
        }
      });
      
      component += `              <div className="mt-4 flex justify-end space-x-2">\n`;
      component += `                <Link\n`;
      component += `                  to={\`/${componentName.toLowerCase()}/\${item.id}\`}\n`;
      component += `                  className="text-indigo-600 hover:text-indigo-900"\n`;
      component += `                >\n`;
      component += `                  Détails\n`;
      component += `                </Link>\n`;
      component += `                <Link\n`;
      component += `                  to={\`/${componentName.toLowerCase()}/\${item.id}/edit\`}\n`;
      component += `                  className="text-blue-600 hover:text-blue-900"\n`;
      component += `                >\n`;
      component += `                  Éditer\n`;
      component += `                </Link>\n`;
      component += `              </div>\n`;
      component += `            </div>\n`;
      component += `          ))\n`;
      component += `        )}\n`;
      component += `      </div>\n`;
    }
    
    // Fin du composant
    component += `    </div>\n`;
    component += `  );\n`;
    component += `}\n`;
    
    return component;
  };
  
  // Assembler tous les éléments
  return `${generateImports()}
${generateZodSchema()}${generateLoader()}${generateAction()}${generateMeta()}${generateComponent()}`;
}

/**
 * Génère le fichier de test pour la route Remix
 */
function generateTestFile(plan: MigrationPlan): string {
  const { componentName } = plan;
  
  return `import { render, screen } from @testing-library/reactstructure-agent";
import { json } from @remix-run/nodestructure-agent";
import { useLoaderData } from @remix-run/reactstructure-agent";
import ${componentName} from ./${componentName.toLowerCase()}structure-agent";

// Mock des hooks Remix
jest.mock("@remix-run/react", () => ({
  useLoaderData: jest.fn(),
  Link: ({ children, to, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  Form: ({ children, ...props }) => <form {...props}>{children}</form>,
  useActionData: jest.fn(),
  useTransition: jest.fn(),
}));

describe("${componentName} Component", () => {
  const mockItems = [
    {
      id: 1,
      title: "Item 1",
      description: "Description de l'item 1",
      createdAt: "2025-04-11T00:00:00Z",
    },
    {
      id: 2,
      title: "Item 2",
      description: "Description de l'item 2",
      createdAt: "2025-04-11T00:00:00Z",
    },
  ];

  beforeEach(() => {
    (useLoaderData as jest.Mock).mockReturnValue({
      items: mockItems,
      error: null,
    });
  });

  test("renders component correctly with items", () => {
    render(<${componentName} />);
    
    // Vérifier que le titre est présent
    expect(screen.getByText("${componentName}")).toBeInTheDocument();
    
    // Vérifier que les éléments sont affichés
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getAllByText("Détails").length).toBe(2);
    expect(screen.getAllByText("Éditer").length).toBe(2);
  });

  test("displays error message when there is an error", () => {
    (useLoaderData as jest.Mock).mockReturnValue({
      items: [],
      error: "Une erreur est survenue",
    });
    
    render(<${componentName} />);
    
    expect(screen.getByText("Une erreur est survenue")).toBeInTheDocument();
  });

  test("displays empty state when no items", () => {
    (useLoaderData as jest.Mock).mockReturnValue({
      items: [],
      error: null,
    });
    
    render(<${componentName} />);
    
    expect(screen.getByText("Aucun élément trouvé.")).toBeInTheDocument();
  });
});
`;
}

/**
 * Génère le fichier de métadonnées pour la route Remix
 */
function generateMetaFile(plan: MigrationPlan): string {
  const { componentName } = plan;
  
  return `import { MetaFunction } from @remix-run/nodestructure-agent";

/**
 * Métadonnées pour la route ${componentName}
 */
export const meta: MetaFunction = () => {
  return [
    { title: "${componentName} | Mon application" },
    { name: "description", content: "Page ${componentName} avec toutes les fonctionnalités nécessaires" },
    { property: "og:title", content: "${componentName} | Mon application" },
    { property: "og:description", content: "Page ${componentName} avec toutes les fonctionnalités nécessaires" },
    { name: "robots", content: "index, follow" },
    { name: "canonical", content: "https://example.com/${componentName.toLowerCase()}" },
  ];
};
`;
}

/**
 * Génère le fichier de loader pour la route Remix
 */
function generateLoaderFile(plan: MigrationPlan): string {
  const { componentName } = plan;
  
  return `import { json, LoaderFunction } from @remix-run/nodestructure-agent";

/**
 * Fonction de chargement des données pour la route ${componentName}
 */
export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    // Récupérer les données depuis l'API
    const response = await fetch(\`\${process.env.API_URL}/${componentName.toLowerCase()}\`);
    
    if (!response.ok) {
      throw new Error(\`Erreur lors de la récupération des données: \${response.status}\`);
    }
    
    const data = await response.json();
    
    return json({
      items: data,
      error: null
    });
  } catch (error) {
    console.error('Erreur du loader:', error);
    return json({
      items: [],
      error: 'Impossible de charger les données. Veuillez réessayer plus tard.'
    });
  }
};
`;
}

/**
 * Génère le fichier d'action pour la route Remix (si elle a un formulaire)
 */
function generateActionFile(plan: MigrationPlan): string {
  const { componentName, hasForms, fields } = plan;
  
  if (!hasForms) {
    return '';
  }
  
  const formFields = fields.filter(field => field.isFormField);
  
  let schema = `// Schéma de validation Zod\nconst schema = z.object({\n`;
  
  formFields.forEach((field, index) => {
    const isLast = index === formFields.length - 1;
    
    schema += `  ${field.name}: z.${
      field.type === 'number' ? 'number()' :
      field.type === 'boolean' ? 'boolean()' :
      field.type === 'Date' ? 'string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)' :
      'string()'
    }${field.isRequired ? '' : '.optional()'}${isLast ? '' : ','}\n`;
  });
  
  schema += `});\n\n`;
  
  return `import { json, ActionFunction } from @remix-run/nodestructure-agent";
import { z } from zodstructure-agent";
import { parse } from @conform-to/zodstructure-agent";

${schema}/**
 * Fonction de traitement du formulaire pour la route ${componentName}
 */
export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const submission = parse(formData, { schema });
    
    if (!submission.value || submission.intent !== 'submit') {
      return json({ status: 'error', errors: submission.error }, { status: 400 });
    }
    
    // Envoyer les données à l'API
    const response = await fetch(\`\${process.env.API_URL}/${componentName.toLowerCase()}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission.value),
    });
    
    if (!response.ok) {
      throw new Error(\`Erreur lors de la soumission du formulaire: \${response.status}\`);
    }
    
    return json({ status: 'success', errors: null });
  } catch (error) {
    console.error('Erreur de l\\'action:', error);
    return json({ 
      status: 'error', 
      errors: { _form: 'Erreur lors de la soumission du formulaire. Veuillez réessayer.' } 
    }, { status: 500 });
  }
};
`;
}

/**
 * Génère tous les fichiers de la route Remix
 */
function generateRemixRoute(plan: MigrationPlan, dryRun = false): void {
  const { outputDir, componentName, fileName, hasForms } = plan;
  
  console.log(`📦 Génération de la route Remix pour ${fileName}...`);
  
  // Créer les fichiers
  const files = [
    {
      name: `${componentName.toLowerCase()}.tsx`,
      content: generateRouteFile(plan)
    },
    {
      name: `${componentName.toLowerCase()}.test.tsx`,
      content: generateTestFile(plan)
    },
    {
      name: `meta.ts`,
      content: generateMetaFile(plan)
    },
    {
      name: `loader.ts`,
      content: generateLoaderFile(plan)
    }
  ];
  
  // Ajouter le fichier d'action si nécessaire
  if (hasForms) {
    files.push({
      name: `action.ts`,
      content: generateActionFile(plan)
    });
  }
  
  if (dryRun) {
    console.log('🔍 Mode dry-run: les fichiers ne seront pas créés');
    
    files.forEach(file => {
      console.log(`\n📄 ${file.name}:`);
      console.log('-'.repeat(50));
      console.log(file.content);
      console.log('-'.repeat(50));
    });
    
    return;
  }
  
  // Créer le répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Écrire les fichiers
  files.forEach(file => {
    if (file.content) { // Ne pas écrire les fichiers vides
      fs.writeFileSync(`${outputDir}/${file.name}`, file.content);
      console.log(`✅ Fichier généré: ${outputDir}/${file.name}`);
    }
  });
  
  console.log(`\n🚀 Route Remix générée avec succès pour ${fileName}!`);
}

/**
 * Fonction principale
 */
function main() {
  // Récupérer les arguments de la ligne de commande
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
    Usage: ts-node remix-route-generator.ts <chemin-plan-migration.md> [--dry-run]
    Options:
      --dry-run: Affiche les fichiers qui seraient générés sans les créer réellement
    `);
    process.exit(0);
  }
  
  const filePath = args[0];
  const dryRun = args.includes('--dry-run');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Le fichier ${filePath} n'existe pas`);
    process.exit(1);
  }
  
  // Extraire les informations du plan de migration
  const plan = extractRemixMigrationInfo(filePath);
  
  // Générer la route Remix
  generateRemixRoute(plan, dryRun);
}

// Exécuter la fonction principale
if (require.main === module) {
  main();
}

// Exporter les fonctions pour une utilisation par d'autres modules
export { extractRemixMigrationInfo, generateRemixRoute };