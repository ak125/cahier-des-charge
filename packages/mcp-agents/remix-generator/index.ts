import { BaseMcpAgent, AgentContext, AgentResult } from '../shared/base-agent';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Agent de génération de code Remix à partir de l'analyse PHP
 */
export class RemixGeneratorAgent extends BaseMcpAgent {
  name = 'remix-generator';
  version = '1.1.0';
  description = 'Génère du code Remix à partir de l\'analyse d\'une page PHP';

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      await this.logExecution(context, 'Démarrage de la génération Remix');
      
      // Vérification des données d'entrée
      if (!context.options?.phpAnalysis) {
        return {
          success: false,
          error: 'Pas d\'analyse PHP fournie. Exécutez d\'abord php-analyzer.',
          duration: Date.now() - startTime
        };
      }
      
      const { phpAnalysis } = context.options;
      
      if (!context.targetFile) {
        return {
          success: false,
          error: 'Pas de fichier cible spécifié pour la génération Remix',
          duration: Date.now() - startTime
        };
      }
      
      // S'assurer que le répertoire cible existe
      const targetDir = path.dirname(context.targetFile);
      await fs.mkdir(targetDir, { recursive: true });
      
      // Génération des composants Remix
      const remixCode = this.generateRemixCode(phpAnalysis, path.basename(context.targetFile, '.tsx'));
      const loaderCode = this.generateLoaderCode(phpAnalysis);
      const metaCode = this.generateMetaCode(phpAnalysis);
      const schemaCode = this.generateSchemaCode(phpAnalysis);
      
      // Écriture des fichiers générés
      const basePath = context.targetFile.replace(/\.tsx$/, '');
      await fs.writeFile(context.targetFile, remixCode);
      await fs.writeFile(`${basePath}.loader.ts`, loaderCode);
      await fs.writeFile(`${basePath}.meta.ts`, metaCode);
      
      // Créer le fichier de schéma dans un dossier séparé
      const schemaDir = path.join(path.dirname(path.dirname(basePath)), 'schemas');
      await fs.mkdir(schemaDir, { recursive: true });
      await fs.writeFile(path.join(schemaDir, `${path.basename(basePath)}.schema.ts`), schemaCode);
      
      await this.logExecution(context, 'Génération Remix terminée avec succès');
      
      return {
        success: true,
        data: {
          files: [
            context.targetFile,
            `${basePath}.loader.ts`,
            `${basePath}.meta.ts`,
            path.join(schemaDir, `${path.basename(basePath)}.schema.ts`)
          ],
          components: phpAnalysis.remixComponents
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      await this.logExecution(context, `Erreur lors de la génération: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  async validate(context: AgentContext): Promise<boolean> {
    const baseValidation = await super.validate(context);
    
    return baseValidation && 
           !!context.targetFile && 
           !!context.options?.phpAnalysis &&
           context.targetFile.endsWith('.tsx');
  }

  /**
   * Génère le composant principal Remix
   */
  private generateRemixCode(phpAnalysis: any, componentName: string): string {
    const hasForm = phpAnalysis.remixComponents?.some(c => c.type === 'Form');
    const hasPagination = phpAnalysis.remixComponents?.some(c => c.type === 'Pagination');
    
    return `import { json } from '@remix-run/node';
import { useLoaderData, Link${hasForm ? ', Form, useActionData' : ''} } from '@remix-run/react';
import { useState${hasPagination ? ', useEffect' : ''} } from 'react';
${hasPagination ? "import { useSearchParams } from '@remix-run/react';" : ''}
import type { loader } from './${componentName}.loader';
${hasForm ? `import { z } from 'zod';
import { validateForm } from '~/utils/validation';` : ''}

/**
 * ${componentName} Page
 * Migré depuis PHP: ${phpAnalysis.sourceFile || 'fichier PHP source'}
 */
export default function ${this.pascalCase(componentName)}() {
  const data = useLoaderData<typeof loader>();
  ${hasPagination ? `const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);` : ''}
  ${hasForm ? `const actionData = useActionData();
  const [formError, setFormError] = useState('');` : ''}

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">${this.titleCase(componentName)}</h1>
      
      {data.error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {data.error}
        </div>
      ) : (
        <>
          ${this.generateContentSection(phpAnalysis)}
          
          ${hasPagination ? this.generatePagination() : ''}
          
          ${hasForm ? this.generateForm(phpAnalysis) : ''}
        </>
      )}
      
      <div className="mt-8">
        <Link to="/" className="text-blue-500 hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
${hasForm ? this.generateAction() : ''}`;
  }

  /**
   * Génère le code du loader Remix
   */
  private generateLoaderCode(phpAnalysis: any): string {
    const hasDatabaseQueries = phpAnalysis.database?.queries?.length > 0;
    
    return `import { json } from '@remix-run/node';
import type { LoaderArgs } from '@remix-run/node';
${hasDatabaseQueries ? "import { db } from '~/utils/db.server';" : ''}
${phpAnalysis.globalVariables?.includes('_SESSION') ? "import { getSession } from '~/utils/session.server';" : ''}

export const loader = async ({ request, params }: LoaderArgs) => {
  try {
    ${this.generateLoaderLogic(phpAnalysis)}
    
    return json({
      data,
      ${hasDatabaseQueries ? 'totalItems,\n      totalPages,' : ''}
    });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: 'Une erreur est survenue lors du chargement des données' });
  }
};`;
  }

  /**
   * Génère le code pour les métadonnées (SEO)
   */
  private generateMetaCode(phpAnalysis: any): string {
    return `import type { V2_MetaFunction } from '@remix-run/node';

export const meta: V2_MetaFunction = ({ data }) => {
  if (!data?.data) {
    return [
      { title: 'Erreur' },
      { name: 'description', content: 'Une erreur est survenue lors du chargement de la page' }
    ];
  }

  return [
    { title: \`${this.titleCase(path.basename(phpAnalysis.sourceFile || '', '.php'))}\` },
    { 
      name: 'description', 
      content: 'Page ${path.basename(phpAnalysis.sourceFile || '', '.php')} migrée depuis PHP vers Remix' 
    }
  ];
};`;
  }

  /**
   * Génère le code pour la validation des données
   */
  private generateSchemaCode(phpAnalysis: any): string {
    // Détecter les champs probables du formulaire
    const hasForm = phpAnalysis.remixComponents?.some(c => c.type === 'Form');
    const formFields = this.detectFormFields(phpAnalysis);
    
    return `import { z } from 'zod';

/**
 * Schéma de validation pour ${path.basename(phpAnalysis.sourceFile || '', '.php')}
 * Généré automatiquement par MCP Remix Generator
 */
${hasForm ? `export const formSchema = z.object({
${formFields.map(field => `  ${field.name}: ${this.generateZodValidator(field)}`).join(',\n')}
});

export type FormData = z.infer<typeof formSchema>;` : '// Aucun formulaire détecté dans le fichier PHP source'}

/**
 * Schéma pour les données chargées par le loader
 */
export const dataSchema = z.object({
  // TODO: Définir le schéma des données retournées par le loader
  // Basé sur les tables: ${phpAnalysis.database?.tables?.join(', ') || 'aucune table détectée'}
});

export type LoaderData = z.infer<typeof dataSchema>;`;
  }

  /**
   * Génère une action pour le formulaire
   */
  private generateAction(): string {
    return `
export async function action({ request }) {
  const formData = await request.formData();
  const submission = Object.fromEntries(formData);
  
  // Validation avec Zod (à importer depuis le schéma)
  // const result = formSchema.safeParse(submission);
  // if (!result.success) {
  //   return json({ errors: result.error.flatten() }, { status: 400 });
  // }
  
  try {
    // TODO: Implémenter la logique de traitement du formulaire
    // Exemple: await db.createRecord(result.data);
    
    return json({ success: true });
  } catch (error) {
    console.error('Action error:', error);
    return json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}`;
  }

  /**
   * Génère la section principale du contenu basée sur l'analyse PHP
   */
  private generateContentSection(phpAnalysis: any): string {
    if (phpAnalysis.database?.tables?.length > 0) {
      return `{/* Affichage des données */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={\`/details/\${item.id}\`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>`;
    } else {
      return `{/* Contenu statique */}
          <div className="prose max-w-none">
            <p>Contenu de la page généré à partir de PHP.</p>
            <p>Les données dynamiques seront ajoutées selon le contexte.</p>
          </div>`;
    }
  }

  /**
   * Génère un composant de pagination
   */
  private generatePagination(): string {
    return `{/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex-1 flex justify-between sm:justify-end">
              <button
                onClick={() => setSearchParams({ page: Math.max(1, page - 1).toString() })}
                disabled={page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setSearchParams({ page: (page + 1).toString() })}
                disabled={page >= data.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>`;
  }

  /**
   * Génère un formulaire basé sur l'analyse PHP
   */
  private generateForm(phpAnalysis: any): string {
    const formFields = this.detectFormFields(phpAnalysis);
    
    return `{/* Formulaire */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Formulaire</h2>
            
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {formError}
              </div>
            )}
            
            {actionData?.success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                Formulaire soumis avec succès !
              </div>
            )}
            
            <Form method="post" className="space-y-4">
              ${formFields.map(field => this.generateFormField(field)).join('\n              ')}
              
              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Envoyer
                </button>
              </div>
            </Form>
          </div>`;
  }

  /**
   * Génère la logique du loader basée sur l'analyse PHP
   */
  private generateLoaderLogic(phpAnalysis: any): string {
    const hasDatabaseQueries = phpAnalysis.database?.queries?.length > 0;
    const hasPagination = phpAnalysis.remixComponents?.some(c => c.type === 'Pagination');
    
    if (hasDatabaseQueries) {
      return `const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    
    // Récupération des données depuis la base
    const [data, totalCount] = await Promise.all([
      db.${phpAnalysis.database.tables[0] || 'table'}.findMany({
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          title: true,
          date: true,
          // Ajoutez d'autres champs selon le contexte
        },
      }),
      db.${phpAnalysis.database.tables[0] || 'table'}.count(),
    ]);
    
    const totalPages = Math.ceil(totalCount / pageSize);
    const totalItems = totalCount;`;
    } else {
      return `// Données statiques ou API externes
    const data = {
      title: 'Titre de la page',
      content: 'Contenu de la page',
      // Ajoutez d'autres données selon le contexte
    };`;
    }
  }

  /**
   * Détecte les champs probables du formulaire à partir du code PHP
   */
  private detectFormFields(phpAnalysis: any): Array<{name: string, type: string, required: boolean}> {
    // Ceci est une simulation de détection - dans un agent réel, 
    // on analyserait le code PHP pour extraire les vrais champs
    return [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'message', type: 'text', required: false },
      { name: 'category', type: 'select', required: true },
    ];
  }

  /**
   * Génère un champ de formulaire basé sur le type
   */
  private generateFormField(field: {name: string, type: string, required: boolean}): string {
    if (field.type === 'text') {
      return `<div>
                <label htmlFor="${field.name}" className="block text-sm font-medium text-gray-700">
                  ${this.titleCase(field.name)}${field.required ? ' *' : ''}
                </label>
                <textarea
                  id="${field.name}"
                  name="${field.name}"
                  rows={3}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  ${field.required ? 'required' : ''}
                ></textarea>
              </div>`;
    } else if (field.type === 'select') {
      return `<div>
                <label htmlFor="${field.name}" className="block text-sm font-medium text-gray-700">
                  ${this.titleCase(field.name)}${field.required ? ' *' : ''}
                </label>
                <select
                  id="${field.name}"
                  name="${field.name}"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  ${field.required ? 'required' : ''}
                >
                  <option value="">Sélectionnez une option</option>
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </select>
              </div>`;
    } else {
      return `<div>
                <label htmlFor="${field.name}" className="block text-sm font-medium text-gray-700">
                  ${this.titleCase(field.name)}${field.required ? ' *' : ''}
                </label>
                <input
                  type="${field.type}"
                  name="${field.name}"
                  id="${field.name}"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  ${field.required ? 'required' : ''}
                />
              </div>`;
    }
  }

  /**
   * Génère un validateur Zod pour un champ
   */
  private generateZodValidator(field: {name: string, type: string, required: boolean}): string {
    let validator = 'z.string()';
    
    if (field.type === 'email') {
      validator = 'z.string().email("Format d\'email invalide")';
    }
    
    if (field.required) {
      validator += '.min(1, "Ce champ est requis")';
    } else {
      validator += '.optional()';
    }
    
    return validator;
  }

  /**
   * Convertit une chaîne en PascalCase
   */
  private pascalCase(str: string): string {
    return str.split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Convertit une chaîne en Title Case
   */
  private titleCase(str: string): string {
    return str.split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}

export const remixGenerator = new RemixGeneratorAgent();