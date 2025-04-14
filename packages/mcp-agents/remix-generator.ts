/**
 * remix-generator.ts
 * Agent MCP pour générer automatiquement des composants Remix à partir de fichiers PHP
 * 
 * Usage: 
 * - Appel direct: await generateRemixComponent('fiche.php')
 * - Via MCP API: POST /api/generate/remix avec le payload { source: 'fiche.php', options: {...} }
 * 
 * Date: 2025-04-13
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import axios from 'axios';
import { glob } from 'glob';
import { logger } from '../utils/logger';
import { extractMetaData } from './seo-checker';
import { detectRouteParams } from './router-analyzer';
import { extractDataStructure } from './php-analyzer-v2';
import { transformQueryToParams } from '../utils/url-transformer';
import { createAuditFile } from './consolidator';
import { supabaseClient } from '../utils/supabase-client';
import { PrismaClient } from '@prisma/client';

// Types pour les fichiers générés
interface GeneratedRemixComponent {
  mainFile: {
    path: string;
    content: string;
  };
  metaFile?: {
    path: string;
    content: string;
  };
  loaderFile?: {
    path: string;
    content: string;
  };
  actionFile?: {
    path: string;
    content: string;
  };
  canonicalFile?: {
    path: string;
    content: string;
  };
  schemaFile?: {
    path: string;
    content: string;
  };
  additionalFiles: Array<{
    path: string;
    content: string;
  }>;
  routePath: string;
  originalPhpFile: string;
  auditPath: string;
}

// Options de génération
interface RemixGeneratorOptions {
  outputDir?: string;
  dryRun?: boolean;
  withTests?: boolean;
  withStories?: boolean;
  useFlat?: boolean;
  skipSeo?: boolean;
  enableTypeGeneration?: boolean;
  aiProvider?: 'openai' | 'anthropic' | 'vertexai';
  aiModel?: string;
  forceRegenerate?: boolean;
}

// Configuration par défaut
const DEFAULT_OPTIONS: RemixGeneratorOptions = {
  outputDir: './apps/frontend/app/routes',
  dryRun: false,
  withTests: true,
  withStories: false,
  useFlat: true,
  skipSeo: false,
  enableTypeGeneration: true,
  aiProvider: 'openai',
  aiModel: 'gpt-4o',
  forceRegenerate: false,
};

// Initialisation du client Prisma
const prisma = new PrismaClient();

/**
 * Fonction principale pour générer un composant Remix à partir d'un fichier PHP
 */
export async function generateRemixComponent(
  phpFilePath: string, 
  options: RemixGeneratorOptions = {}
): Promise<GeneratedRemixComponent> {
  // Fusionner les options avec les options par défaut
  const opts = { ...DEFAULT_OPTIONS, ...options };
  logger.info(`Génération du composant Remix pour ${phpFilePath} démarrée`);
  
  // Vérifier que le fichier PHP existe
  if (!fs.existsSync(phpFilePath)) {
    throw new Error(`Le fichier PHP ${phpFilePath} n'existe pas`);
  }
  
  // Définir le chemin de sortie en fonction du mode (dry run ou non)
  const baseOutputDir = opts.dryRun 
    ? './simulations/routes' 
    : opts.outputDir;
  
  // Créer les répertoires de sortie s'ils n'existent pas
  if (!fs.existsSync(baseOutputDir)) {
    fs.mkdirSync(baseOutputDir, { recursive: true });
  }
  
  // Analyser le fichier PHP
  logger.debug(`Analyse du fichier PHP ${phpFilePath}`);
  const phpCode = fs.readFileSync(phpFilePath, 'utf-8');
  const fileHash = createHash('md5').update(phpCode).digest('hex');
  
  // Vérifier si ce fichier a déjà été généré et si le contenu est identique
  const existingRecord = await supabaseClient
    .from('generated_files')
    .select('*')
    .eq('source_file', phpFilePath)
    .eq('file_hash', fileHash)
    .maybeSingle();
  
  if (existingRecord.data && !opts.forceRegenerate) {
    logger.info(`Le fichier ${phpFilePath} a déjà été généré et n'a pas changé. Utilisation de la version en cache.`);
    return JSON.parse(existingRecord.data.generated_content);
  }
  
  // Extraire les métadonnées SEO
  logger.debug(`Extraction des métadonnées SEO pour ${phpFilePath}`);
  const seoMetadata = !opts.skipSeo ? await extractMetaData(phpFilePath) : null;
  
  // Analyser la structure des données
  logger.debug(`Extraction de la structure de données pour ${phpFilePath}`);
  const dataStructure = await extractDataStructure(phpFilePath);
  
  // Détecter les paramètres de route
  logger.debug(`Détection des paramètres de route pour ${phpFilePath}`);
  const routeParams = await detectRouteParams(phpFilePath);
  
  // Transformer l'URL PHP en URL Remix
  const remixRoutePath = transformPhpRouteToRemix(phpFilePath, routeParams);
  logger.info(`Route Remix définie: ${remixRoutePath}`);
  
  // Déterminer le nom de fichier de sortie
  const outputFileName = getRemixFileName(remixRoutePath, opts.useFlat);
  
  // Générer les fichiers Remix
  const result = await generateRemixFiles(
    phpFilePath,
    outputFileName,
    baseOutputDir,
    remixRoutePath,
    seoMetadata,
    dataStructure,
    routeParams,
    opts
  );
  
  // Sauvegarder les métadonnées dans Supabase
  await supabaseClient
    .from('generated_files')
    .upsert({
      source_file: phpFilePath,
      file_hash: fileHash,
      route_path: remixRoutePath,
      generated_content: JSON.stringify(result),
      seo_metadata: seoMetadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_file' });
  
  // Créer le fichier d'audit
  await createAuditFile(
    phpFilePath,
    result.mainFile.path,
    {
      routePath: remixRoutePath,
      dataStructure,
      seoMetadata,
      routeParams,
      generatedFiles: [
        result.mainFile.path,
        ...(result.metaFile ? [result.metaFile.path] : []),
        ...(result.loaderFile ? [result.loaderFile.path] : []),
        ...(result.actionFile ? [result.actionFile.path] : []),
        ...(result.canonicalFile ? [result.canonicalFile.path] : []),
        ...(result.schemaFile ? [result.schemaFile.path] : []),
        ...result.additionalFiles.map(f => f.path)
      ]
    }
  );
  
  logger.info(`Génération du composant Remix pour ${phpFilePath} terminée`);
  return result;
}

/**
 * Transformer une route PHP en route Remix
 */
function transformPhpRouteToRemix(phpFilePath: string, routeParams: any): string {
  // Extraire le nom du fichier sans l'extension
  const fileName = path.basename(phpFilePath, '.php');
  
  // Cas spéciaux
  if (fileName === 'index') {
    return '/';
  }
  
  // Construire le chemin de base
  let routePath = `/${fileName.toLowerCase()}`;
  
  // Ajouter les paramètres dynamiques s'il y en a
  if (routeParams && routeParams.length > 0) {
    // Pour les routes avec ID, on ajoute /$id
    if (routeParams.includes('id')) {
      routePath += '/$id';
    } 
    // Pour d'autres paramètres, on les ajoute en tant que segments dynamiques
    else {
      routeParams.forEach(param => {
        if (param !== 'id') {
          routePath += `/$${param}`;
        }
      });
    }
  }
  
  return routePath;
}

/**
 * Obtenir le nom du fichier Remix en fonction du chemin de route
 */
function getRemixFileName(routePath: string, useFlat: boolean): string {
  if (routePath === '/') {
    return '_index';
  }
  
  // Supprimer le slash initial
  let cleanPath = routePath.startsWith('/') ? routePath.substring(1) : routePath;
  
  // Remplacer les slashes par des points ou des slashes selon le mode
  if (useFlat) {
    // Format plat: user.$id.edit.tsx
    return cleanPath.replace(/\//g, '.').replace(/\$/g, '$');
  } else {
    // Format dossier: maintenir la structure des dossiers
    return cleanPath;
  }
}

/**
 * Générer tous les fichiers Remix pour un composant
 */
async function generateRemixFiles(
  phpFilePath: string,
  outputFileName: string,
  baseOutputDir: string,
  routePath: string,
  seoMetadata: any,
  dataStructure: any,
  routeParams: any,
  options: RemixGeneratorOptions
): Promise<GeneratedRemixComponent> {
  const additionalFiles = [];
  
  // Déterminer si la route a besoin d'un loader, action, etc.
  const needsLoader = hasDataFetching(phpFilePath);
  const needsAction = hasFormSubmission(phpFilePath);
  const needsCanonical = !options.skipSeo && seoMetadata && (seoMetadata.canonical || seoMetadata.title);
  
  // Préparer le contenu du fichier principal (route)
  const mainFileContent = await generateMainComponent(
    phpFilePath, 
    routePath, 
    dataStructure, 
    routeParams, 
    needsLoader, 
    needsAction,
    options
  );
  
  // Fichier principal
  const mainFilePath = path.join(
    baseOutputDir, 
    options.useFlat ? `${outputFileName}.tsx` : `${outputFileName}/index.tsx`
  );
  
  const result: GeneratedRemixComponent = {
    mainFile: {
      path: mainFilePath,
      content: mainFileContent,
    },
    additionalFiles: [],
    routePath,
    originalPhpFile: phpFilePath,
    auditPath: path.join('./audit', `${outputFileName.replace(/\$/g, '')}.audit.md`),
  };
  
  // Générer le fichier meta.ts si nécessaire
  if (!options.skipSeo && seoMetadata) {
    const metaContent = await generateMetaFile(routePath, seoMetadata, dataStructure, options);
    const metaFilePath = path.join(
      baseOutputDir,
      options.useFlat ? `${outputFileName}.meta.ts` : `${outputFileName}/meta.ts`
    );
    
    result.metaFile = {
      path: metaFilePath,
      content: metaContent,
    };
    
    // Écrire le fichier si ce n'est pas un dry run
    if (!options.dryRun) {
      const metaDir = path.dirname(metaFilePath);
      if (!fs.existsSync(metaDir)) {
        fs.mkdirSync(metaDir, { recursive: true });
      }
      fs.writeFileSync(metaFilePath, metaContent);
    }
  }
  
  // Générer le fichier loader.ts si nécessaire
  if (needsLoader) {
    const loaderContent = await generateLoaderFile(routePath, dataStructure, routeParams, options);
    const loaderFilePath = path.join(
      baseOutputDir,
      options.useFlat ? `${outputFileName}.loader.ts` : `${outputFileName}/loader.ts`
    );
    
    result.loaderFile = {
      path: loaderFilePath,
      content: loaderContent,
    };
    
    // Écrire le fichier si ce n'est pas un dry run
    if (!options.dryRun) {
      const loaderDir = path.dirname(loaderFilePath);
      if (!fs.existsSync(loaderDir)) {
        fs.mkdirSync(loaderDir, { recursive: true });
      }
      fs.writeFileSync(loaderFilePath, loaderContent);
    }
  }
  
  // Générer le fichier action.ts si nécessaire
  if (needsAction) {
    const actionContent = await generateActionFile(routePath, dataStructure, routeParams, options);
    const actionFilePath = path.join(
      baseOutputDir,
      options.useFlat ? `${outputFileName}.action.ts` : `${outputFileName}/action.ts`
    );
    
    result.actionFile = {
      path: actionFilePath,
      content: actionContent,
    };
    
    // Écrire le fichier si ce n'est pas un dry run
    if (!options.dryRun) {
      const actionDir = path.dirname(actionFilePath);
      if (!fs.existsSync(actionDir)) {
        fs.mkdirSync(actionDir, { recursive: true });
      }
      fs.writeFileSync(actionFilePath, actionContent);
    }
  }
  
  // Générer le fichier canonical.tsx si nécessaire
  if (needsCanonical) {
    const canonicalContent = generateCanonicalFile(routePath, seoMetadata);
    const canonicalFilePath = path.join(
      baseOutputDir,
      options.useFlat ? `${outputFileName}.canonical.tsx` : `${outputFileName}/canonical.tsx`
    );
    
    result.canonicalFile = {
      path: canonicalFilePath,
      content: canonicalContent,
    };
    
    // Écrire le fichier si ce n'est pas un dry run
    if (!options.dryRun) {
      const canonicalDir = path.dirname(canonicalFilePath);
      if (!fs.existsSync(canonicalDir)) {
        fs.mkdirSync(canonicalDir, { recursive: true });
      }
      fs.writeFileSync(canonicalFilePath, canonicalContent);
    }
  }
  
  // Générer le fichier schema.ts si nécessaire
  if (options.enableTypeGeneration && dataStructure) {
    const schemaContent = generateSchemaFile(dataStructure);
    const schemaFilePath = path.join(
      baseOutputDir,
      options.useFlat ? `${outputFileName}.schema.ts` : `${outputFileName}/schema.ts`
    );
    
    result.schemaFile = {
      path: schemaFilePath,
      content: schemaContent,
    };
    
    // Écrire le fichier si ce n'est pas un dry run
    if (!options.dryRun) {
      const schemaDir = path.dirname(schemaFilePath);
      if (!fs.existsSync(schemaDir)) {
        fs.mkdirSync(schemaDir, { recursive: true });
      }
      fs.writeFileSync(schemaFilePath, schemaContent);
    }
  }
  
  // Générer des tests si nécessaire
  if (options.withTests) {
    const testContent = generateTestFile(outputFileName, routePath, dataStructure);
    const testFilePath = path.join(
      baseOutputDir,
      options.useFlat ? `${outputFileName}.test.tsx` : `${outputFileName}/${path.basename(outputFileName)}.test.tsx`
    );
    
    additionalFiles.push({
      path: testFilePath,
      content: testContent,
    });
    
    // Écrire le fichier si ce n'est pas un dry run
    if (!options.dryRun) {
      const testDir = path.dirname(testFilePath);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.writeFileSync(testFilePath, testContent);
    }
  }
  
  // Générer des stories si nécessaire
  if (options.withStories) {
    const storyContent = generateStoryFile(outputFileName, routePath, dataStructure);
    const storyFilePath = path.join(
      baseOutputDir,
      options.useFlat ? `${outputFileName}.stories.tsx` : `${outputFileName}/${path.basename(outputFileName)}.stories.tsx`
    );
    
    additionalFiles.push({
      path: storyFilePath,
      content: storyContent,
    });
    
    // Écrire le fichier si ce n'est pas un dry run
    if (!options.dryRun) {
      const storyDir = path.dirname(storyFilePath);
      if (!fs.existsSync(storyDir)) {
        fs.mkdirSync(storyDir, { recursive: true });
      }
      fs.writeFileSync(storyFilePath, storyContent);
    }
  }
  
  result.additionalFiles = additionalFiles;
  
  // Écrire le fichier principal si ce n'est pas un dry run
  if (!options.dryRun) {
    const mainDir = path.dirname(mainFilePath);
    if (!fs.existsSync(mainDir)) {
      fs.mkdirSync(mainDir, { recursive: true });
    }
    fs.writeFileSync(mainFilePath, mainFileContent);
  }
  
  return result;
}

/**
 * Détecter si un fichier PHP contient des opérations de récupération de données
 */
function hasDataFetching(phpFilePath: string): boolean {
  const content = fs.readFileSync(phpFilePath, 'utf-8');
  
  // Rechercher des modèles courants de récupération de données
  return (
    content.includes('mysqli_query') ||
    content.includes('PDO') ||
    content.includes('mysql_query') ||
    content.includes('fetchAll') ||
    content.includes('fetch_assoc') ||
    content.includes('SELECT') ||
    content.includes('$_GET') ||
    content.includes('file_get_contents')
  );
}

/**
 * Détecter si un fichier PHP contient des soumissions de formulaire
 */
function hasFormSubmission(phpFilePath: string): boolean {
  const content = fs.readFileSync(phpFilePath, 'utf-8');
  
  // Rechercher des modèles courants de soumission de formulaire
  return (
    content.includes('$_POST') ||
    content.includes('method="post"') ||
    content.includes("method='post'") ||
    content.includes('INSERT INTO') ||
    content.includes('UPDATE') ||
    content.includes('DELETE FROM')
  );
}

/**
 * Générer le composant principal pour une route
 */
async function generateMainComponent(
  phpFilePath: string,
  routePath: string,
  dataStructure: any,
  routeParams: any,
  needsLoader: boolean,
  needsAction: boolean,
  options: RemixGeneratorOptions
): Promise<string> {
  // Extraire le nom du fichier sans l'extension comme nom de base pour le composant
  const baseComponentName = path.basename(phpFilePath, '.php');
  const componentName = `${baseComponentName.charAt(0).toUpperCase() + baseComponentName.slice(1)}Page`;
  
  // Préparer les imports
  const imports = [
    'import { useLoaderData } from "@remix-run/react";',
    'import { json } from "@remix-run/node";',
    'import { PageContainer } from "~/components/layout/PageContainer";',
  ];
  
  if (needsLoader) {
    if (options.useFlat) {
      imports.push(`import { loader } from "./${baseComponentName}.loader";`);
    } else {
      imports.push(`import { loader } from "./loader";`);
    }
  }
  
  if (needsAction) {
    if (options.useFlat) {
      imports.push(`import { action } from "./${baseComponentName}.action";`);
    } else {
      imports.push(`import { action } from "./action";`);
    }
  }
  
  // Construire le code du composant en utilisant les données extraites
  const componentTemplate = `
/**
 * Composant Remix pour la route ${routePath}
 * Généré automatiquement à partir de ${phpFilePath}
 * Date: ${new Date().toISOString()}
 */

${imports.join('\n')}

${needsLoader ? `// Exporter le loader\nexport { loader };` : ''}
${needsAction ? `// Exporter l'action\nexport { action };` : ''}

// Composant principal
export default function ${componentName}() {
  ${needsLoader ? 'const data = useLoaderData<typeof loader>();' : ''}

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">${baseComponentName.charAt(0).toUpperCase() + baseComponentName.slice(1)}</h1>
        
        ${needsLoader ? `
        {data && (
          <div className="bg-white shadow-md rounded-lg p-6">
            {/* Remplacer par le contenu réel basé sur les données */}
            <pre className="text-sm overflow-auto p-4 bg-gray-50 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        ` : ''}
        
        ${needsAction ? `
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Formulaire</h2>
          <form method="post" className="space-y-4 bg-white shadow-md rounded-lg p-6">
            {/* Remplacer par les champs réels du formulaire */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                id="name"
                name="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Soumettre
            </button>
          </form>
        </div>
        ` : ''}
      </div>
    </PageContainer>
  );
}
`;

  return componentTemplate.trim();
}

/**
 * Générer le fichier meta.ts pour les métadonnées SEO
 */
async function generateMetaFile(
  routePath: string, 
  seoMetadata: any,
  dataStructure: any,
  options: RemixGeneratorOptions
): Promise<string> {
  const metaTemplate = `
/**
 * Métadonnées SEO pour la route ${routePath}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

import type { MetaFunction } from "@remix-run/node";
import { getCanonicalUrl } from "~/utils/seo";

export const meta: MetaFunction = ({ data, params, location }) => {
  // Si aucune donnée n'est disponible (erreur ou chargement)
  if (!data) {
    return [
      { title: "${seoMetadata.title || 'Page non trouvée'}" },
      { name: "description", content: "La page demandée n'a pas été trouvée." },
      { name: "robots", content: "noindex, nofollow" }
    ];
  }

  const canonicalUrl = getCanonicalUrl("${routePath}", location);

  return [
    // Titre principal de la page
    { title: ${seoMetadata.title ? `"${seoMetadata.title}"` : 'data.title'} },
    
    // Description principale
    { name: "description", content: ${seoMetadata.description ? `"${seoMetadata.description}"` : 'data.description || ""'} },
    
    // Mots-clés
    { name: "keywords", content: ${seoMetadata.keywords ? `"${seoMetadata.keywords}"` : 'data.keywords || ""'} },
    
    // URL canonique
    { tagName: "link", rel: "canonical", href: ${seoMetadata.canonical ? `"${seoMetadata.canonical}"` : 'canonicalUrl'} },
    
    // Open Graph - pour un meilleur partage sur les réseaux sociaux
    { property: "og:title", content: ${seoMetadata.title ? `"${seoMetadata.title}"` : 'data.title'} },
    { property: "og:description", content: ${seoMetadata.description ? `"${seoMetadata.description}"` : 'data.description || ""'} },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: "website" },
    
    // Twitter Card
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: ${seoMetadata.title ? `"${seoMetadata.title}"` : 'data.title'} },
    { name: "twitter:description", content: ${seoMetadata.description ? `"${seoMetadata.description}"` : 'data.description || ""'} },
  ];
};
`;

  return metaTemplate.trim();
}

/**
 * Générer le fichier loader.ts pour la récupération des données
 */
async function generateLoaderFile(
  routePath: string,
  dataStructure: any,
  routeParams: any,
  options: RemixGeneratorOptions
): Promise<string> {
  // Déterminer le modèle Prisma à utiliser en fonction du nom de la route
  const routeSegments = routePath.split('/').filter(Boolean);
  const mainResource = routeSegments[0]?.replace('$', '') || 'index';
  
  // PascalCase pour le modèle Prisma
  const prismaModel = mainResource.charAt(0).toUpperCase() + mainResource.slice(1);
  
  const loaderTemplate = `
/**
 * Loader pour la route ${routePath}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Loader pour récupérer les données
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  ${routeParams?.length ? `// Récupérer les paramètres de la route
  ${routeParams.map(param => `const ${param} = params.${param};`).join('\n  ')}` : ''}
  
  try {
    ${routeParams?.includes('id') ? `
    // Vérifier que l'ID est valide
    if (!params.id || isNaN(Number(params.id))) {
      throw new Response("ID non valide", { status: 400 });
    }
    
    // Récupérer les données depuis Prisma
    const ${mainResource} = await prisma.${mainResource.toLowerCase()}.findUnique({
      where: { id: Number(params.id) },
    });
    
    if (!${mainResource}) {
      throw new Response("Données non trouvées", { status: 404 });
    }` : `
    // Récupérer les données depuis Prisma
    const ${mainResource}List = await prisma.${mainResource.toLowerCase()}.findMany({
      take: 20,
    });`}
    
    return json({
      ${routeParams?.includes('id') ? `${mainResource}` : `${mainResource}List`}
    });
  } catch (error) {
    console.error("Erreur de chargement:", error);
    throw new Response("Erreur lors de la récupération des données", { 
      status: error instanceof Response ? error.status : 500 
    });
  }
}
`;

  return loaderTemplate.trim();
}

/**
 * Générer le fichier action.ts pour la gestion des formulaires
 */
async function generateActionFile(
  routePath: string,
  dataStructure: any,
  routeParams: any,
  options: RemixGeneratorOptions
): Promise<string> {
  // Déterminer le modèle Prisma à utiliser en fonction du nom de la route
  const routeSegments = routePath.split('/').filter(Boolean);
  const mainResource = routeSegments[0]?.replace('$', '') || 'index';
  
  // PascalCase pour le modèle Prisma
  const prismaModel = mainResource.charAt(0).toUpperCase() + mainResource.slice(1);
  
  const actionTemplate = `
/**
 * Action pour la route ${routePath}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Action pour gérer les soumissions de formulaire
 */
export async function action({ params, request }: ActionFunctionArgs) {
  // Récupérer les données du formulaire
  const formData = await request.formData();
  ${routeParams?.includes('id') ? `const id = params.id;` : ''}
  
  try {
    // Déterminer l'action à effectuer en fonction de la méthode
    const method = formData.get("_method") || request.method;
    
    switch (method.toString().toUpperCase()) {
      case "POST": {
        // Créer une nouvelle entrée
        const newData = {
          // Remplacer par les champs réels du formulaire
          name: formData.get("name")?.toString() || "",
          // Ajouter d'autres champs selon le modèle de données
        };
        
        const created = await prisma.${mainResource.toLowerCase()}.create({
          data: newData,
        });
        
        return redirect(\`${routePath.replace('$id', '')}/\${created.id}\`);
      }
      
      case "PUT":
      case "PATCH": {
        ${routeParams?.includes('id') ? `
        // Vérifier que l'ID est valide
        if (!id || isNaN(Number(id))) {
          return json({ error: "ID non valide" }, { status: 400 });
        }
        
        // Mettre à jour une entrée existante
        const updateData = {
          // Remplacer par les champs réels du formulaire
          name: formData.get("name")?.toString(),
          // Ajouter d'autres champs selon le modèle de données
        };
        
        // Supprimer les champs undefined
        Object.keys(updateData).forEach(key => 
          updateData[key] === undefined && delete updateData[key]
        );
        
        await prisma.${mainResource.toLowerCase()}.update({
          where: { id: Number(id) },
          data: updateData,
        });
        
        return redirect(\`${routePath.replace('$id', '')}/\${id}\`);` : `
        return json({ error: "Méthode non supportée pour cette route" }, { status: 405 });`}
      }
      
      case "DELETE": {
        ${routeParams?.includes('id') ? `
        // Vérifier que l'ID est valide
        if (!id || isNaN(Number(id))) {
          return json({ error: "ID non valide" }, { status: 400 });
        }
        
        // Supprimer une entrée
        await prisma.${mainResource.toLowerCase()}.delete({
          where: { id: Number(id) },
        });
        
        return redirect("${routePath.replace('/$id', '')}");` : `
        return json({ error: "Méthode non supportée pour cette route" }, { status: 405 });`}
      }
      
      default:
        return json({ error: "Méthode non supportée" }, { status: 405 });
    }
  } catch (error) {
    console.error("Erreur d'action:", error);
    return json({ error: "Erreur lors du traitement de la demande" }, { status: 500 });
  }
}
`;

  return actionTemplate.trim();
}

/**
 * Générer le fichier canonical.tsx pour les liens canoniques
 */
function generateCanonicalFile(routePath: string, seoMetadata: any): string {
  const canonicalTemplate = `
/**
 * Composant pour générer les URLs canoniques pour la route ${routePath}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

import { useParams, useLocation } from "@remix-run/react";
import { generateCanonicalUrl } from "~/utils/seo";

export function CanonicalUrl() {
  const params = useParams();
  const location = useLocation();
  
  // Construction de l'URL canonique
  const baseUrl = \`https://\${window.location.hostname}\`;
  ${routePath.includes('$id') ? 
    `const path = \`${routePath.replace('$id', '\${params.id}')}\`;` : 
    `const path = "${routePath}";`}
  
  // Générer l'URL canonique complète
  const canonicalUrl = ${seoMetadata?.canonical ? 
    `"${seoMetadata.canonical}"` : 
    'generateCanonicalUrl(baseUrl, path)'};
  
  return (
    <link rel="canonical" href={canonicalUrl} />
  );
}
`;

  return canonicalTemplate.trim();
}

/**
 * Générer le fichier schema.ts pour les types TypeScript
 */
function generateSchemaFile(dataStructure: any): string {
  // Convertir la structure de données en types TypeScript
  const types = Object.keys(dataStructure || {}).map(key => {
    const structure = dataStructure[key];
    
    // Générer une interface pour chaque structure
    const properties = Object.keys(structure).map(prop => {
      const type = guessTypeFromValue(structure[prop]);
      return `  ${prop}: ${type};`;
    });
    
    return `
export interface ${key.charAt(0).toUpperCase() + key.slice(1)} {
${properties.join('\n')}
}`;
  });
  
  const schemaTemplate = `
/**
 * Types générés automatiquement à partir de la structure des données
 * Date: ${new Date().toISOString()}
 */

${types.length > 0 ? types.join('\n\n') : `
export interface PageData {
  // Ajouter les propriétés selon les besoins
  id?: number;
  title?: string;
  description?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormData {
  // Ajouter les propriétés selon les besoins
  name?: string;
  email?: string;
  message?: string;
}`}
`;

  return schemaTemplate.trim();
}

/**
 * Générer un fichier de test pour la route
 */
function generateTestFile(outputFileName: string, routePath: string, dataStructure: any): string {
  const componentName = path.basename(outputFileName, '.tsx');
  const pascalCaseName = componentName.replace(/[-._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, '');
  
  const testTemplate = `
/**
 * Tests pour la route ${routePath}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

import { render, screen } from '@testing-library/react';
import { createRemixStub } from '@remix-run/testing';
import ${pascalCaseName} from './${outputFileName}';

// Mock des données pour les tests
const mockData = {
  // Remplacer par des données réalistes
};

describe('${pascalCaseName} Component', () => {
  it('should render successfully', () => {
    // Créer un composant Remix de test avec les données mockées
    const RemixStub = createRemixStub([
      {
        path: '${routePath}',
        Component: ${pascalCaseName},
        loader: () => mockData,
      },
    ]);

    render(<RemixStub initialEntries={['${routePath.replace('$id', '1')}']} />);

    // Vérifier que le composant est rendu correctement
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  // Ajouter d'autres tests selon les besoins
});
`;

  return testTemplate.trim();
}

/**
 * Générer un fichier Storybook pour la route
 */
function generateStoryFile(outputFileName: string, routePath: string, dataStructure: any): string {
  const componentName = path.basename(outputFileName, '.tsx');
  const pascalCaseName = componentName.replace(/[-._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, '');
  
  const storyTemplate = `
/**
 * Storybook pour la route ${routePath}
 * Généré automatiquement
 * Date: ${new Date().toISOString()}
 */

import type { Meta, StoryObj } from '@storybook/react';
import { createRemixStub } from '@remix-run/testing';
import ${pascalCaseName} from './${outputFileName}';

// Données d'exemple pour les stories
const exampleData = {
  // Remplacer par des données réalistes
};

// Configuration de base pour Storybook
const meta: Meta<typeof ${pascalCaseName}> = {
  title: 'Routes/${pascalCaseName}',
  component: ${pascalCaseName},
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      // Créer un composant Remix de test avec les données mockées
      const RemixStub = createRemixStub([
        {
          path: '${routePath}',
          Component: Story,
          loader: () => exampleData,
        },
      ]);

      return <RemixStub initialEntries={['${routePath.replace('$id', '1')}']} />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ${pascalCaseName}>;

// Story principale
export const Default: Story = {};

// Autres variantes
export const Loading: Story = {
  parameters: {
    remix: {
      loaderData: null,
    },
  },
};

export const Error: Story = {
  parameters: {
    remix: {
      loaderData: { error: 'Une erreur est survenue' },
    },
  },
};
`;

  return storyTemplate.trim();
}

/**
 * Deviner le type TypeScript à partir d'une valeur
 */
function guessTypeFromValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  const type = typeof value;
  
  switch (type) {
    case 'string':
      // Détecter les formats de date
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'Date';
      }
      return 'string';
    case 'number':
      return Number.isInteger(value) ? 'number' : 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        return `${guessTypeFromValue(value[0])}[]`;
      }
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

// Export des fonctions principales
export default {
  generateRemixComponent,
};