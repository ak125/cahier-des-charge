import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../../coreDoDotmcp-agent';

import { GeneratorAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
interface RouteMapping {
  from: string;
  to: string;
  type: 'exact' | 'redirect' | 'dynamic' | 'removed';
  status?: number;
  queryParams?: string[];
  description?: string;
}

interface RouteTemplates {
  [key: string]: string;
}

export class RemixRouteGenerator implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent, MCPAgent , GeneratorAgent{
  name = 'remix-route-generator';
  description = 'Génère des fichiers de routes Remix à partir d\'un mappage de routes PHP';

  private routeTemplates: RouteTemplates = {
    basic: `// {description}
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { MetaFunction } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: "Page {title}" },
    { name: "description", content: "Page {title} migrée depuis PHP" }
  ];
};

export const loader = async ({ request, params }) => {
  const url = new URL(request.url);
  {paramsExtraction}
  
  // TODO: Implémenter la logique métier
  // Appel à l'API NestJS ou autre source de données
  // const data = await fetch(\`http://localhost:3001/api/{apiEndpoint}\`).then(r => r.json());
  
  return json({
    params: {
      {paramsReturn}
    }
  });
};

export default function {componentName}() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Page {title}</h1>
      <p>Cette page a été migrée depuis PHP.</p>
      {/* TODO: Implémenter l'interface utilisateur */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );

  id: string = '';
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
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  type: string = '';
  version: string = '1.0.0';
}`,

    redirect: `// {description}
import { redirect } from '@remix-run/node';

export const loader = async ({ request, params }) => {
  const url = new URL(request.url);
  {paramsExtraction}
  
  // Redirection 301/302 de l'ancien chemin PHP vers la nouvelle route
  return redirect('/{redirectTarget}', {status});
};

export default function {componentName}() {
  // Cette fonction ne sera jamais appelée en raison de la redirection
  return null;
}`,

    dynamic: `// {description}
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { MetaFunction } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: "Page dynamique" },
    { name: "description", content: "Page dynamique migrée depuis PHP" }
  ];
};

export const loader = async ({ params, request }) => {
  const url = new URL(request.url);
  const phpFile = params.page;
  const query = Object.fromEntries(url.searchParams.entries());

  // Appel à l'API NestJS qui gère les routes legacy
  // TODO: Implémenter l'appel à l'API
  /*
  const res = await fetch(\`http://localhost:3001/api/legacy/\${phpFile}\`, {
    method: 'POST',
    body: JSON.stringify(query),
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!res.ok) {
    throw new Response("Page non trouvée", { status: 404 });
  }
  
  const data = await res.json();
  */
  
  // Données fictives pour le moment
  const data = {
    phpFile,
    params: query
  };
  
  return json(data);
};

export default function DynamicPhpPage() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Page {data.phpFile}</h1>
      <p>Cette page a été migrée depuis PHP.</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}`,

    removed: `// {description}
export const loader = async () => {
  // Renvoyer un code 410 Gone pour les ressources supprimées
  throw new Response("Cette ressource n'existe plus", { status: 410 });
};

export default function RemovedPage() {
  // Cette fonction ne sera jamais appelée en raison de l'erreur 410
  return null;
}`,

    catchAll: `// Route générique pour capturer toutes les URLs *.php non migrées
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { MetaFunction } from '@remix-run/react';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


export const meta: MetaFunction = () => {
  return [
    { title: "Page Legacy PHP" },
    { name: "description", content: "Page legacy migrée depuis PHP" }
  ];
};

export const loader = async ({ params, request }) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  
  // Vérifier si la page est en cours de migration
  const isMigrationPending = true; // TODO: vérifier l'état de la migration dans une base de données
  
  if (isMigrationPending) {
    // Option 1: Rediriger vers une page "en cours de migration"
    // return redirect('/migration-pending', 302);
    
    // Option 2: Appeler l'API legacy
    const res = await fetch(\`http://localhost:3001/api/legacy/\${params.page}\`, {
      method: 'POST',
      body: JSON.stringify(query),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      throw new Response("Page non trouvée", { status: 404 });
    }
    
    return json({
      page: params.page,
      params: query,
      legacy: true
    });
  }
  
  throw new Response("Page non trouvée", { status: 404 });
};

export default function CatchAllPhpPage() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Page Legacy: {data.page}</h1>
      <p>Cette page est en cours de migration depuis PHP.</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}`
  };

  async process(context: MCPContext): Promise<any> {
    const { routeMappingPath, outputDir, generateCatchAll = true } = context.inputs;
    
    if (!routeMappingPath || !fs.existsSync(routeMappingPath)) {
      return {
        success: false,
        error: `Le fichier de mappage des routes n'existe pas: ${routeMappingPath}`
      };
    }

    if (!outputDir) {
      return {
        success: false,
        error: `Le répertoire de sortie n'est pas spécifié`
      };
    }

    try {
      // Créer le répertoire de sortie s'il n'existe pas
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Lire le fichier de mappage des routes
      const routeMappings: RouteMapping[] = JSON.parse(fs.readFileSync(routeMappingPath, 'utf8'));
      
      // Générer les fichiers de routes Remix
      const generatedRoutes = this.generateRemixRoutes(routeMappings, outputDir);
      
      // Générer le catch-all pour les routes PHP non migrées
      if (generateCatchAll) {
        this.generateCatchAllRoute(outputDir);
      }
      
      return {
        success: true,
        data: {
          generatedRoutes,
          totalRoutes: generatedRoutes.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de la génération des routes Remix: ${error.message}`
      };
    }
  }

  private generateRemixRoutes(routeMappings: RouteMapping[], outputDir: string): string[] {
    const generatedRoutes: string[] = [];
    
    for (const mapping of routeMappings) {
      try {
        const remixRoute = this.createRemixRouteFile(mapping, outputDir);
        generatedRoutes.push(remixRoute);
      } catch (error) {
        console.error(`Erreur lors de la génération de la route ${mapping.from}:`, error);
      }
    }
    
    return generatedRoutes;
  }

  private createRemixRouteFile(mapping: RouteMapping, outputDir: string): string {
    // Déterminer le nom du fichier de route
    let routeFileName = '';
    
    if (mapping.to.endsWith('.php')) {
      // Format spécial pour les fichiers PHP simulés
      routeFileName = mapping.to;
    } else if (mapping.type === 'dynamic') {
      // Route dynamique avec paramètre
      routeFileName = '$page_.php.tsx';
    } else {
      // Convertir le chemin en nom de fichier de route Remix
      routeFileName = this.convertPathToRemixRoute(mapping.to);
    }
    
    // Préparer les variables pour les templates
    const componentName = this.createComponentName(mapping.to);
    const title = componentName.replace(/([A-Z])/g, ' $1').trim();
    const apiEndpoint = mapping.to.replace('.php', '').replace('_', '');
    
    // Préparer l'extraction des paramètres
    let paramsExtraction = '';
    let paramsReturn = '';
    
    if (mapping.queryParams && mapping.queryParams.length > 0) {
      paramsExtraction = mapping.queryParams.map(param => {
        return `const ${param} = url.searchParams.get('${param}');`;
      }).join('\n  ');
      
      paramsReturn = mapping.queryParams.map(param => {
        return `${param}`;
      }).join(',\n      ');
    }
    
    // Sélectionner le template approprié
    let template = '';
    
    switch (mapping.type) {
      case 'redirect':
        template = this.routeTemplates.redirect
          .replace('{redirectTarget}', mapping.to)
          .replace('{status}', (mapping.status || 302).toString());
        break;
      case 'dynamic':
        template = this.routeTemplates.dynamic;
        break;
      case 'removed':
        template = this.routeTemplates.removed;
        break;
      default:
        template = this.routeTemplates.basic;
    }
    
    // Remplacer les variables dans le template
    template = template
      .replace(/{description}/g, mapping.description || `Route pour ${mapping.from}`)
      .replace(/{componentName}/g, componentName)
      .replace(/{title}/g, title)
      .replace(/{apiEndpoint}/g, apiEndpoint)
      .replace(/{paramsExtraction}/g, paramsExtraction)
      .replace(/{paramsReturn}/g, paramsReturn);
    
    // Créer le chemin complet du fichier
    const filePath = path.join(outputDir, routeFileName + '.tsx');
    
    // Créer les répertoires parents si nécessaire
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Écrire le fichier
    fs.writeFileSync(filePath, template, 'utf8');
    
    return filePath;
  }

  private generateCatchAllRoute(outputDir: string): void {
    // Créer le fichier $page_.php.tsx pour capturer toutes les routes PHP
    const filePath = path.join(outputDir, '$page_.php.tsx');
    
    // Écrire le fichier
    fs.writeFileSync(filePath, this.routeTemplates.catchAll, 'utf8');
  }

  private convertPathToRemixRoute(path: string): string {
    // Convertir un chemin en nom de fichier de route Remix
    // Exemple: 'products/view' -> 'products.view'
    return path.replace(/\//g, '.') + '.tsx';
  }

  private createComponentName(path: string): string {
    // Convertir un chemin en nom de composant React
    // Exemple: 'products/view' -> 'ProductsView'
    return path
      .replace(/\.php$/, '')
      .split(/[\/\._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}

export default new RemixRouteGenerator();