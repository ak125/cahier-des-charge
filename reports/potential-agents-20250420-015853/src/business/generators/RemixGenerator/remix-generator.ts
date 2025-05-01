import fs from 'fs';
import path from 'path';
import { analyzePhpFile } from '../analysis/PhpAnalyzer';
import { AgentResult, MigrationConfig, PhpAnalysisResult } from '../types';

/**
 * Agent de génération Remix à partir de fichiers PHP
 * Responsable de la transformation d'un fichier PHP en composant Remix
 */
export class RemixGenerator {
  constructor(private config: MigrationConfig) {}

  /**
   * Génère un composant Remix à partir d'un fichier PHP
   * @param sourceFilePath Chemin vers le fichier PHP source
   * @param destinationPath Dossier de destination pour les fichiers Remix générés
   */
  async generateFromPhp(sourceFilePath: string, destinationPath: string): Promise<AgentResult> {
    try {
      console.log(`[RemixGenerator] Analyse du fichier PHP : ${sourceFilePath}`);

      // 1. Analyser le fichier PHP avec PhpAnalyzer
      const analysisResult = await analyzePhpFile(sourceFilePath);

      // 2. Générer les fichiers Remix
      const remixComponents = await this.generateRemixComponents(sourceFilePath, analysisResult);

      // 3. Écrire les fichiers générés
      await this.writeRemixFiles(remixComponents, destinationPath);

      // 4. Générer un rapport d'audit
      const auditReport = this.generateAuditReport(sourceFilePath, remixComponents);

      return {
        success: true,
        sourceFile: sourceFilePath,
        generatedFiles: Object.keys(remixComponents),
        auditReport,
      };
    } catch (error) {
      console.error(
        `[RemixGenerator] Erreur lors de la génération de Remix pour ${sourceFilePath}:`,
        error
      );
      return {
        success: false,
        sourceFile: sourceFilePath,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Génère les composants Remix à partir du fichier PHP analysé
   */
  private async generateRemixComponents(sourceFilePath: string, analysisResult: PhpAnalysisResult) {
    const fileBaseName = path.basename(sourceFilePath, '.php');
    const sourceContent = fs.readFileSync(sourceFilePath, 'utf-8');

    // Transformer le PHP en composants Remix
    const remixComponentContent = await this.transformPhpToRemix(sourceContent, analysisResult);

    // Générer le fichier meta.ts pour les métadonnées SEO
    const metaFileContent = await this.generateMetaFile(sourceContent, analysisResult);

    // Générer le fichier loader.ts pour les données
    const loaderFileContent = await this.generateLoaderFile(sourceContent, analysisResult);

    // Générer le fichier schema.ts pour Prisma/validation des données
    const schemaFileContent = await this.generateSchemaFile(analysisResult);

    return {
      [`${fileBaseName}.tsx`]: remixComponentContent,
      [`${fileBaseName}.meta.ts`]: metaFileContent,
      [`${fileBaseName}.loader.ts`]: loaderFileContent,
      [`${fileBaseName}.schema.ts`]: schemaFileContent,
    };
  }

  /**
   * Transforme un fichier PHP en composant Remix
   */
  private async transformPhpToRemix(
    sourceContent: string,
    analysisResult: PhpAnalysisResult
  ): Promise<string> {
    const { htmlStructure, seoMetadata } = analysisResult;

    // Extraire la structure principale du HTML
    const mainContent = this.extractMainContent(analysisResult.htmlContent);

    // Transformer les éléments PHP en syntaxe JSX
    const jsxContent = this.transformToJsx(mainContent, analysisResult);

    // Générer les imports nécessaires
    const imports = this.generateImports(analysisResult);

    // Déterminer si le composant a besoin de state local
    const needsState = this.determineIfNeedsState(mainContent, analysisResult);

    // Créer le composant React
    return `${imports}

/**
 * Composant ${analysisResult.fileName} 
 * Généré automatiquement à partir de ${analysisResult.fileName}.php
 */
export default function ${this.capitalize(analysisResult.fileName)}() {
  const data = useLoaderData<typeof loader>();
  ${needsState ? this.generateLocalState(analysisResult) : ''}
  
  return (
    <main className="container product-page">
      ${jsxContent}
    </main>
  );
}`;
  }

  /**
   * Génère le fichier meta.ts pour les métadonnées SEO
   */
  private async generateMetaFile(
    sourceContent: string,
    analysisResult: PhpAnalysisResult
  ): Promise<string> {
    const { seoMetadata } = analysisResult;

    // Extraire le titre, la description et l'URL canonique des métadonnées
    const title = seoMetadata['title'] || '';
    const description = seoMetadata['description'] || '';
    const canonical = seoMetadata['canonical'] || '';

    // Extraire les balises Open Graph
    const ogTags = Object.entries(seoMetadata)
      .filter(([key]) => key.startsWith('og:'))
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string>
      );

    return `import type { MetaFunction } from "@remix-run/node";
import { loader } from "./${analysisResult.fileName}.loader";

/**
 * Métadonnées pour ${analysisResult.fileName}
 * Générées automatiquement à partir de ${analysisResult.fileName}.php
 */
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: "Erreur - Page non trouvée" },
      { name: "description", content: "La page demandée n'existe pas" }
    ];
  }

  const product = data.product;
  
  return [
    { title: \`\${product.nom} | Notre Catalogue\` },
    { name: "description", content: \`Découvrez \${product.nom} - \${product.description.substring(0, 150)}...\` },
    { tagName: "link", rel: "canonical", href: \`https://www.notre-site.fr/catalogue/\${product.id}\` },
    { property: "og:title", content: product.nom },
    { property: "og:description", content: \`Découvrez \${product.nom} - \${product.description.substring(0, 150)}...\` },
    { property: "og:image", content: product.image_principale ? \`/images/produits/\${product.image_principale}\` : "/images/default-product.jpg" },
    { property: "og:url", content: \`https://www.notre-site.fr/catalogue/\${product.id}\` },
    { property: "og:type", content: "product" }
  ];
};`;
  }

  /**
   * Génère le fichier loader.ts pour charger les données
   */
  private async generateLoaderFile(
    sourceContent: string,
    analysisResult: PhpAnalysisResult
  ): Promise<string> {
    const { sqlQueries } = analysisResult;

    // Transformer les requêtes SQL en requêtes Prisma
    const prismaQueries = this.transformSqlToPrisma(sqlQueries);

    return `import { json, LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/lib/db.server";
import { NotFoundError } from "~/lib/errors";

/**
 * Loader pour ${analysisResult.fileName}
 * Généré automatiquement à partir de ${analysisResult.fileName}.php
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  const productId = Number(params.id);
  
  if (isNaN(productId) || productId <= 0) {
    return redirect("/catalogue");
  }
  
  try {
    // Récupérer le produit
    const product = await db.produit.findUnique({
      where: { id: productId },
      rejectOnNotFound: true,
    });
    
    // Récupérer les catégories associées
    const categories = await db.categorie.findMany({
      where: {
        produits: {
          some: {
            produitId: productId
          }
        }
      },
      select: {
        id: true,
        nom: true
      }
    });
    
    // Si le produit a des produits associés, les récupérer
    let relatedProducts = [];
    if (product.produits_associes) {
      const relatedIds = product.produits_associes.split(',').map(id => Number(id.trim()));
      relatedProducts = await db.produit.findMany({
        where: {
          id: {
            in: relatedIds
          }
        },
        select: {
          id: true,
          nom: true,
          prix: true,
          prix_promo: true,
          image_principale: true
        }
      });
    }
    
    return json({
      product,
      categories,
      relatedProducts
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new Response("Produit non trouvé", { status: 404 });
    }
    throw error;
  }
}`;
  }

  /**
   * Génère le fichier schema.ts pour les validations et le modèle de données
   */
  private async generateSchemaFile(analysisResult: PhpAnalysisResult): Promise<string> {
    const { sqlQueries } = analysisResult;

    // Extraire les tables et les colonnes des requêtes SQL
    const tables = this.extractTablesFromQueries(sqlQueries);

    return `import { z } from "zod";

/**
 * Schéma pour ${analysisResult.fileName}
 * Généré automatiquement à partir de ${analysisResult.fileName}.php
 */

// Schéma de validation pour le produit
export const ProductSchema = z.object({
  id: z.number().int().positive(),
  nom: z.string().min(1),
  description: z.string(),
  prix: z.number().positive(),
  prix_promo: z.number().optional(),
  stock: z.number().int().min(0),
  reference: z.string(),
  image_principale: z.string().optional(),
  images_supplementaires: z.string().optional(),
  specifications: z.string().optional(),
  produits_associes: z.string().optional()
});

// Type pour le produit
export type Product = z.infer<typeof ProductSchema>;

// Schéma de validation pour les catégories
export const CategorySchema = z.object({
  id: z.number().int().positive(),
  nom: z.string().min(1)
});

// Type pour les catégories
export type Category = z.infer<typeof CategorySchema>;

// Schéma pour les produits associés
export const RelatedProductSchema = z.object({
  id: z.number().int().positive(),
  nom: z.string().min(1),
  prix: z.number().positive(),
  prix_promo: z.number().optional(),
  image_principale: z.string().optional()
});

// Type pour les produits associés
export type RelatedProduct = z.infer<typeof RelatedProductSchema>;`;
  }

  /**
   * Écrit les fichiers Remix générés dans le dossier de destination
   */
  private async writeRemixFiles(files: Record<string, string>, destinationPath: string) {
    // Créer le dossier de destination s'il n'existe pas
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }

    // Écrire chaque fichier généré
    for (const [fileName, content] of Object.entries(files)) {
      const filePath = path.join(destinationPath, fileName);
      fs.writeFileSync(filePath, content);
      console.log(`[RemixGenerator] Fichier généré : ${filePath}`);
    }
  }

  /**
   * Génère un rapport d'audit sur la migration
   */
  private generateAuditReport(sourceFilePath: string, remixComponents: Record<string, string>) {
    const fileName = path.basename(sourceFilePath, '.php');
    const report = `# Rapport de migration PHP → Remix pour ${fileName}

## Fichier source
- ${sourceFilePath}

## Fichiers générés
${Object.keys(remixComponents)
  .map((file) => `- ${file}`)
  .join('\n')}

## Analyse de la migration
- **Complexité du fichier source** : ${this.estimateComplexity(sourceFilePath)}
- **Points d'attention SEO** : ${this.extractSeoPoints(remixComponents)}
- **Routes préservées** : ${this.extractPreservedRoutes(sourceFilePath, remixComponents)}

## Recommandations
${this.generateRecommendations(remixComponents)}
`;

    // Écrire le rapport d'audit
    const auditPath = path.join(process.cwd(), 'audit');
    if (!fs.existsSync(auditPath)) {
      fs.mkdirSync(auditPath, { recursive: true });
    }

    const auditFilePath = path.join(auditPath, `${fileName}.audit.md`);
    fs.writeFileSync(auditFilePath, report);

    return {
      path: auditFilePath,
      content: report,
    };
  }

  /**
   * Estime la complexité du fichier PHP source
   */
  private estimateComplexity(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const phpBlocks = (content.match(/<\?php/g) || []).length;
    const sqlQueries = (content.match(/SELECT|INSERT|UPDATE|DELETE/gi) || []).length;

    let complexity = 'Faible';
    if (lines > 300 || sqlQueries > 5) {
      complexity = 'Moyenne';
    }
    if (lines > 500 || sqlQueries > 10 || phpBlocks > 3) {
      complexity = 'Élevée';
    }

    return `${complexity} (${lines} lignes, ${sqlQueries} requêtes SQL, ${phpBlocks} blocs PHP)`;
  }

  /**
   * Extrait les points d'attention SEO des composants générés
   */
  private extractSeoPoints(components: Record<string, string>) {
    const metaFile = Object.entries(components).find(([name]) => name.endsWith('.meta.ts'));
    if (!metaFile) return 'Aucune métadonnée SEO détectée';

    const metaContent = metaFile[1];
    const hasCanonical = metaContent.includes('canonical');
    const hasOpenGraph = metaContent.includes('og:');
    const hasStructuredData = metaContent.includes('jsonLd');

    const points = [];
    if (hasCanonical) points.push('URL canonique préservée');
    if (hasOpenGraph) points.push('Balises Open Graph générées');
    if (hasStructuredData) points.push('Données structurées JSON-LD ajoutées');

    return points.length ? points.join(', ') : 'Métadonnées SEO basiques';
  }

  /**
   * Extrait les routes préservées du fichier source
   */
  private extractPreservedRoutes(sourceFilePath: string, components: Record<string, string>) {
    const fileName = path.basename(sourceFilePath, '.php');
    const loaderFile = Object.entries(components).find(([name]) => name.endsWith('.loader.ts'));

    if (!loaderFile) return 'Aucune route extraite';

    // Détection basique des paramètres d'URL
    const loaderContent = loaderFile[1];
    const paramsMatch = loaderContent.match(/params\.([\w]+)/g);
    const uniqueParams = [...new Set(paramsMatch?.map((p) => p.replace('params.', '')) || [])];

    if (uniqueParams.length === 0) {
      return `Route statique : /${fileName}`;
    }

    return `Route dynamique : /${fileName}/[${uniqueParams.join('][')}]`;
  }

  /**
   * Génère des recommandations basées sur l'analyse
   */
  private generateRecommendations(components: Record<string, string>) {
    const recommendations = [];

    // Vérifier si le loader utilise Prisma
    const loaderFile = Object.entries(components).find(([name]) => name.endsWith('.loader.ts'));
    if (loaderFile && !loaderFile[1].includes('prisma')) {
      recommendations.push(
        '- Migrer les requêtes SQL vers Prisma pour une meilleure sécurité et maintenabilité'
      );
    }

    // Vérifier si le composant utilise des hooks
    const componentFile = Object.entries(components).find(([name]) => name.endsWith('.tsx'));
    if (
      componentFile &&
      !componentFile[1].includes('useState') &&
      !componentFile[1].includes('useLoaderData')
    ) {
      recommendations.push(
        '- Optimiser le composant en utilisant useLoaderData pour accéder aux données'
      );
    }

    // Vérifier les imports manquants
    const allComponents = Object.values(components).join('\n');
    if (!allComponents.includes('import { db }') && allComponents.includes('prisma')) {
      recommendations.push("- Ajouter l'import de client Prisma via db");
    }

    return recommendations.length
      ? recommendations.join('\n')
      : '- Aucune recommandation particulière';
  }

  /**
   * Extrait le contenu principal du HTML
   */
  private extractMainContent(htmlContent: string): string {
    // Tenter d'extraire le contenu de la balise <main>
    const mainMatch = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(htmlContent);
    if (mainMatch) {
      return mainMatch[1];
    }

    // Si aucune balise main n'est trouvée, chercher le contenu du body
    const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(htmlContent);
    if (bodyMatch) {
      return bodyMatch[1]
        .replace(/<header[^>]*>[\s\S]*?<\/header>/i, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/i, '');
    }

    return htmlContent;
  }

  /**
   * Transforme le HTML en JSX
   */
  private transformToJsx(htmlContent: string, analysisResult: PhpAnalysisResult): string {
    // Remplacer les blocs PHP par leur équivalent JSX
    let jsxContent = htmlContent
      // Remplacer les echo par des expressions JSX
      .replace(/<\?php\s+echo\s+(.*?);\s*\?>/g, '{$1}')

      // Remplacer les boucles foreach
      .replace(
        /<\?php\s+foreach\s*\((.*?)\s+as\s+(.*?)\):\s*\?>([\s\S]*?)<\?php\s+endforeach;\s*\?>/g,
        (_, collection, item, content) => {
          const itemVar = item.includes('=>') ? item.split('=>')[1].trim() : item.trim();
          return `{${collection}.map((${itemVar}) => (
                  ${content.replace(/<\?php\s+echo\s+(.*?);\s*\?>/g, '{$1}')}
                ))}`;
        }
      )

      // Remplacer les conditions if
      .replace(
        /<\?php\s+if\s*\((.*?)\):\s*\?>([\s\S]*?)(?:<\?php\s+else:\s*\?>([\s\S]*?))?<\?php\s+endif;\s*\?>/g,
        (_, condition, ifContent, elseContent) => {
          if (elseContent) {
            return `{${condition} ? (
                    ${ifContent.replace(/<\?php\s+echo\s+(.*?);\s*\?>/g, '{$1}')}
                  ) : (
                    ${elseContent.replace(/<\?php\s+echo\s+(.*?);\s*\?>/g, '{$1}')}
                  )}`;
          }
          return `{${condition} && (
                  ${ifContent.replace(/<\?php\s+echo\s+(.*?);\s*\?>/g, '{$1}')}
                )}`;
        }
      )

      // Remplacements pour adapter à JSX
      .replace(/class=/g, 'className=')
      .replace(/for=/g, 'htmlFor=')

      // Gérer les attributs utilisant des variables PHP
      .replace(/([a-zA-Z-]+)=["']\{\$(.*?)\}["']/g, '$1={$2}');

    // Transformer les formulaires en formulaires Remix
    jsxContent = jsxContent.replace(
      /<form([^>]*)action=["']([^"']*)["']([^>]*)>/g,
      '<Form$1action="$2"$3>'
    );
    jsxContent = jsxContent.replace(/<\/form>/g, '</Form>');

    // Remplacer htmlspecialchars par la notation JSX
    jsxContent = jsxContent.replace(/htmlspecialchars\(\$(.*?)\)/g, '$1');

    // Transformer les liens PHP en liens Remix
    jsxContent = jsxContent.replace(
      /<a([^>]*)href=["']([^"']*\.php)(\?[^"']*)?["']([^>]*)>/g,
      (_, before, phpFile, query, after) => {
        const path = phpFile.replace('.php', '');
        const queryParams = query || '';
        return `<Link${before}to="${path}${queryParams}"${after}>`;
      }
    );
    jsxContent = jsxContent.replace(/<\/a>/g, '</Link>');

    return jsxContent;
  }

  /**
   * Génère les imports nécessaires pour le composant
   */
  private generateImports(analysisResult: PhpAnalysisResult): string {
    const imports = [
      'import { useLoaderData } from "@remix-run/react";',
      'import { Link, Form } from "@remix-run/react";',
      `import { loader } from "./${analysisResult.fileName}.loader";`,
    ];

    // Ajouter des imports en fonction des besoins
    const hasFormElements =
      analysisResult.htmlStructure.forms && analysisResult.htmlStructure.forms.length > 0;
    if (hasFormElements) {
      imports.push('import { useActionData } from "@remix-run/react";');
    }

    return imports.join('\n');
  }

  /**
   * Détermine si le composant a besoin d'un state local
   */
  private determineIfNeedsState(content: string, analysisResult: PhpAnalysisResult): boolean {
    // Détecter les cas où le composant aurait besoin d'un state local
    const hasFormWithoutAction = content.includes('<form') && !content.includes('action=');
    const hasDynamicElements = content.includes('onclick=') || content.includes('onchange=');
    const hasUserInput =
      analysisResult.htmlStructure.forms &&
      analysisResult.htmlStructure.forms.some((form) =>
        form.fields.some((field) => ['text', 'number', 'select'].includes(field.type))
      );

    return hasFormWithoutAction || hasDynamicElements || hasUserInput;
  }

  /**
   * Génère le code pour le state local si nécessaire
   */
  private generateLocalState(analysisResult: PhpAnalysisResult): string {
    const localStateCode = [];

    // Ajouter du state pour les formulaires présents
    if (analysisResult.htmlStructure.forms && analysisResult.htmlStructure.forms.length > 0) {
      const form = analysisResult.htmlStructure.forms[0];

      if (form.fields.some((field) => field.name === 'quantity')) {
        localStateCode.push('const [quantity, setQuantity] = useState(1);');
        localStateCode.push('');
        localStateCode.push('const handleQuantityChange = (e) => {');
        localStateCode.push('  const newQuantity = parseInt(e.target.value, 10);');
        localStateCode.push('  if (newQuantity > 0 && newQuantity <= data.product.stock) {');
        localStateCode.push('    setQuantity(newQuantity);');
        localStateCode.push('  }');
        localStateCode.push('};');
      }
    }

    if (localStateCode.length > 0) {
      localStateCode.unshift('// Import React hooks');
      localStateCode.unshift('import { useState } from "react";');
      return localStateCode.join('\n');
    }

    return '';
  }

  /**
   * Transforme les requêtes SQL en requêtes Prisma
   */
  private transformSqlToPrisma(sqlQueries: any[]): string[] {
    const prismaQueries: string[] = [];

    sqlQueries.forEach((query) => {
      if (query.type === 'SELECT') {
        // Exemple de transformation de SELECT en requête Prisma
        const table = query.tables[0];
        const model = this.snakeToCamel(table);

        prismaQueries.push(`const result = await prisma.${model}.findMany({
  where: {
    // Conditions de la requête
  },
  select: {
    // Champs à sélectionner
  }
});`);
      }
    });

    return prismaQueries;
  }

  /**
   * Extrait les tables et colonnes des requêtes SQL
   */
  private extractTablesFromQueries(sqlQueries: any[]): Record<string, string[]> {
    const tables: Record<string, string[]> = {};

    sqlQueries.forEach((query) => {
      query.tables.forEach((table: string) => {
        if (!tables[table]) {
          tables[table] = [];
        }

        // Extraire les colonnes mentionnées dans la requête
        const columnMatch = query.query.match(
          new RegExp(`SELECT\\s+([\\w\\s,*]+)\\s+FROM\\s+${table}`, 'i')
        );
        if (columnMatch) {
          const columns = columnMatch[1].split(',').map((col: string) => col.trim());
          columns.forEach((col: string) => {
            if (col !== '*' && !tables[table].includes(col)) {
              tables[table].push(col);
            }
          });
        }
      });
    });

    return tables;
  }

  /**
   * Convertit snake_case en camelCase
   */
  private snakeToCamel(str: string): string {
    return str.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
  }

  /**
   * Met en majuscule la première lettre d'une chaîne
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default RemixGenerator;
