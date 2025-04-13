import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../../core/mcp-agent';

interface SeoCheckResult {
  url: string;
  issues: string[];
  recommendations: string[];
  hasCanonical: boolean;
  missingMeta: string[];
  redirectChains: string[][];
}

export class SeoChecker implements MCPAgent {
  name = 'seo-checker-canonical';
  description = 'Vérifie les problèmes SEO dans les routes migrées et génère des balises canoniques';

  async process(context: MCPContext): Promise<any> {
    const { routesDir, routeMappingPath, generateReport = true, fixIssues = false } = context.inputs;
    
    if (!routesDir || !fs.existsSync(routesDir)) {
      return {
        success: false,
        error: `Le répertoire des routes n'existe pas: ${routesDir}`
      };
    }

    try {
      // Charger le mappage des routes si fourni
      let routeMappings = [];
      if (routeMappingPath && fs.existsSync(routeMappingPath)) {
        routeMappings = JSON.parse(fs.readFileSync(routeMappingPath, 'utf8'));
      }
      
      // Analyser les fichiers de routes Remix
      const seoResults = this.analyzeSeoIssues(routesDir, routeMappings);
      
      // Corriger les problèmes si demandé
      if (fixIssues) {
        this.fixSeoIssues(seoResults, routesDir);
      }
      
      // Générer un rapport
      if (generateReport) {
        const reportPath = path.join(process.cwd(), 'reports', 'seo-check-report.json');
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(seoResults, null, 2), 'utf8');
      }
      
      return {
        success: true,
        data: {
          seoResults,
          totalIssues: seoResults.reduce((sum, result) => sum + result.issues.length, 0),
          totalRecommendations: seoResults.reduce((sum, result) => sum + result.recommendations.length, 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de l'analyse SEO: ${error.message}`
      };
    }
  }

  private analyzeSeoIssues(routesDir: string, routeMappings: any[]): SeoCheckResult[] {
    const results: SeoCheckResult[] = [];
    
    // Récupérer tous les fichiers de routes Remix
    const routeFiles = this.getRouteFiles(routesDir);
    
    for (const routeFile of routeFiles) {
      const result = this.checkRouteFile(routeFile, routesDir, routeMappings);
      results.push(result);
    }
    
    // Vérifier les chaînes de redirection
    this.checkRedirectChains(results);
    
    return results;
  }

  private getRouteFiles(dir: string): string[] {
    let results: string[] = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        results = results.concat(this.getRouteFiles(itemPath));
      } else if (stat.isFile() && (itemPath.endsWith('.tsx') || itemPath.endsWith('.jsx'))) {
        results.push(itemPath);
      }
    }
    
    return results;
  }

  private checkRouteFile(filePath: string, routesDir: string, routeMappings: any[]): SeoCheckResult {
    const relativePath = path.relative(routesDir, filePath);
    const routeUrl = this.convertFilePathToUrl(relativePath);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const issues: string[] = [];
    const recommendations: string[] = [];
    let hasCanonical = false;
    const missingMeta: string[] = [];
    
    // Vérifier si le fichier a une balise meta
    if (!content.includes('meta:') && !content.includes('MetaFunction')) {
      issues.push('Aucune fonction meta trouvée');
      missingMeta.push('title');
      missingMeta.push('description');
    }
    
    // Vérifier si le fichier a une balise canonique
    hasCanonical = content.includes('rel="canonical"') || content.includes("rel='canonical'");
    
    if (!hasCanonical) {
      recommendations.push('Ajouter une balise canonique pour éviter le contenu dupliqué');
    }
    
    // Vérifier si le fichier est un catch-all pour les routes PHP
    if (relativePath.includes('$page_.php')) {
      recommendations.push('Route catch-all PHP détectée - surveiller les performances SEO');
    }
    
    // Vérifier les redirections
    const isRedirect = content.includes('redirect(');
    if (isRedirect) {
      // Vérifier que le code de statut est correct (301 pour les redirections permanentes)
      if (!content.includes('301') && !content.includes('308')) {
        issues.push('Redirection sans code 301 (permanent) - peut perdre du jus SEO');
      }
    }
    
    // Vérifier si c'est un loader avec erreur 410
    const isGone = content.includes('status: 410');
    if (isGone) {
      recommendations.push('Page supprimée avec 410 - bon pour le SEO');
    }
    
    return {
      url: routeUrl,
      issues,
      recommendations,
      hasCanonical,
      missingMeta,
      redirectChains: []
    };
  }

  private checkRedirectChains(results: SeoCheckResult[]): void {
    // Construire un graphe des redirections
    const redirectGraph: Record<string, string> = {};
    
    for (const result of results) {
      // Ajouter les redirections au graphe
      // Ceci est une simplification - en réalité, vous devriez analyser le code pour trouver les redirections
      // Pour cet exemple, nous utiliserons uniquement les URL qui contiennent "redirect"
      if (result.url.includes('redirect')) {
        // Simuler une redirection vers une autre URL
        const targetUrl = result.url.replace('redirect', 'target');
        redirectGraph[result.url] = targetUrl;
      }
    }
    
    // Détecter les chaînes de redirection
    for (const result of results) {
      const chains = this.findRedirectChain(result.url, redirectGraph, []);
      if (chains.length > 0) {
        result.redirectChains = chains;
        
        // Ajouter un problème si la chaîne est trop longue
        if (chains.some(chain => chain.length > 2)) {
          result.issues.push('Chaîne de redirection trop longue (>2) - impact sur les performances et le SEO');
        }
      }
    }
  }

  private findRedirectChain(url: string, redirectGraph: Record<string, string>, visited: string[]): string[][] {
    if (visited.includes(url)) {
      // Cycle détecté
      return [visited.concat(url)];
    }
    
    if (!redirectGraph[url]) {
      // Pas de redirection, fin de la chaîne
      return visited.length > 0 ? [visited.concat(url)] : [];
    }
    
    // Continuer à suivre la chaîne
    return this.findRedirectChain(redirectGraph[url], redirectGraph, visited.concat(url));
  }

  private convertFilePathToUrl(filePath: string): string {
    // Convertit un chemin de fichier de route Remix en URL
    // Exemple: 'fiche_.php.tsx' -> '/fiche.php'
    return '/' + filePath
      .replace(/\.tsx$|\.jsx$/g, '')
      .replace(/_\./g, '.')
      .replace(/\$/g, ':')
      .replace(/\./g, '/');
  }

  private fixSeoIssues(results: SeoCheckResult[], routesDir: string): void {
    for (const result of results) {
      // Ne traiter que les fichiers avec des problèmes
      if (result.issues.length === 0 && !result.missingMeta.length && result.hasCanonical) {
        continue;
      }
      
      // Retrouver le chemin du fichier
      const filePath = this.convertUrlToFilePath(result.url, routesDir);
      if (!fs.existsSync(filePath)) {
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Ajouter une balise canonique si manquante
      if (!result.hasCanonical) {
        // Trouver où insérer la balise canonique dans la fonction meta
        const metaFunctionMatch = content.match(/export\s+const\s+meta[^{]*{[^]*?return\s*\[[^]*?\]/s);
        
        if (metaFunctionMatch) {
          const metaFunction = metaFunctionMatch[0];
          const lastBracketIndex = metaFunction.lastIndexOf(']');
          
          if (lastBracketIndex !== -1) {
            const baseUrl = 'https://example.com'; // À remplacer par l'URL de base réelle
            const canonicalUrl = `${baseUrl}${result.url}`;
            
            const newMetaFunction = 
              metaFunction.substring(0, lastBracketIndex) + 
              `,\n    { rel: "canonical", href: "${canonicalUrl}" }` +
              metaFunction.substring(lastBracketIndex);
            
            content = content.replace(metaFunction, newMetaFunction);
            modified = true;
          }
        } else if (result.missingMeta.length > 0) {
          // Ajouter une fonction meta complète si elle est manquante
          const importMatch = content.match(/import\s+{[^}]*}\s+from\s+['"]@remix-run\/react['"]/);
          
          if (importMatch) {
            // Mettre à jour l'import pour inclure MetaFunction
            const importStatement = importMatch[0];
            const newImport = importStatement.replace('{', '{ MetaFunction, ');
            content = content.replace(importStatement, newImport);
            
            // Ajouter la fonction meta après les imports
            const baseUrl = 'https://example.com'; // À remplacer par l'URL de base réelle
            const canonicalUrl = `${baseUrl}${result.url}`;
            
            const metaFunction = `
export const meta: MetaFunction = () => {
  return [
    { title: "Page ${path.basename(result.url)}" },
    { name: "description", content: "Description de la page" },
    { rel: "canonical", href: "${canonicalUrl}" }
  ];
};
`;
            
            const lastImportIndex = content.lastIndexOf('import');
            const lastImportEndIndex = content.indexOf('\n', lastImportIndex);
            
            if (lastImportEndIndex !== -1) {
              content = 
                content.substring(0, lastImportEndIndex + 1) + 
                '\n' + metaFunction + 
                content.substring(lastImportEndIndex + 1);
              modified = true;
            }
          }
        }
      }
      
      // Enregistrer le fichier modifié
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }

  private convertUrlToFilePath(url: string, routesDir: string): string {
    // Convertit une URL en chemin de fichier de route Remix
    // Exemple: '/fiche.php' -> 'fiche_.php.tsx'
    
    // Supprimer le slash initial
    let filePath = url.startsWith('/') ? url.substring(1) : url;
    
    // Remplacer / par .
    filePath = filePath.replace(/\//g, '.');
    
    // Remplacer : par $
    filePath = filePath.replace(/:/g, '$');
    
    // Remplacer .php par _.php
    filePath = filePath.replace(/\.php/g, '_.php');
    
    // Ajouter l'extension .tsx
    if (!filePath.endsWith('.tsx')) {
      filePath += '.tsx';
    }
    
    return path.join(routesDir, filePath);
  }
}

export default new SeoChecker();