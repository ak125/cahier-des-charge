import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execaCommand } from 'execa';

interface RouteValidationResult {
  valid: boolean;
  invalidRoutes: Array<{
    route: string;
    errors: string[];
  }>;
}

/**
 * Vérifie que toutes les routes Remix sont valides
 * @returns true si toutes les routes sont valides, false sinon
 */
export async function verifyRoutes(): Promise<boolean> {
  try {
    console.log(chalk.blue('🔍 Vérification des routes Remix...'));
    
    // Chemin vers les routes Remix
    const remixRoutesPath = path.resolve(process.cwd(), '../../app/routes');
    
    // Vérifier si le dossier des routes existe
    if (!await fs.pathExists(remixRoutesPath)) {
      console.error(chalk.red(`❌ Dossier des routes Remix introuvable: ${remixRoutesPath}`));
      return false;
    }
    
    // Récupérer toutes les routes
    const routeFiles = await fs.readdir(remixRoutesPath);
    const tsxRoutes = routeFiles.filter(file => file.endsWith('.tsx'));
    
    if (tsxRoutes.length === 0) {
      console.error(chalk.red('❌ Aucune route Remix trouvée'));
      return false;
    }
    
    console.log(chalk.blue(`📁 ${tsxRoutes.length} routes trouvées`));
    
    // Vérification des routes
    const invalidRoutes: Array<{route: string; errors: string[]}> = [];
    
    for (const routeFile of tsxRoutes) {
      const routePath = path.join(remixRoutesPath, routeFile);
      const routeContent = await fs.readFile(routePath, 'utf-8');
      
      const errors: string[] = [];
      
      // Vérification 1: les routes doivent avoir un composant par défaut
      if (!routeContent.includes('export default function')) {
        errors.push('Aucun composant React exporté par défaut');
      }
      
      // Vérification 2: les routes doivent avoir un loader ou une action
      const hasLoader = routeContent.includes('export function loader') || routeContent.includes('export async function loader');
      const hasAction = routeContent.includes('export function action') || routeContent.includes('export async function action');
      if (!hasLoader && !hasAction) {
        errors.push('Ni loader ni action défini');
      }
      
      // Vérification 3: vérifier si les hooks useLoaderData ou useActionData sont utilisés quand nécessaire
      if (hasLoader && !routeContent.includes('useLoaderData')) {
        errors.push('Le hook useLoaderData n\'est pas utilisé alors qu\'un loader est défini');
      }
      
      if (hasAction && routeContent.includes('Form') && !routeContent.includes('useActionData')) {
        errors.push('Le hook useActionData n\'est pas utilisé alors qu\'un action est défini avec un Form');
      }
      
      // Vérification 4: vérifier si les meta informations sont définies
      if (!routeContent.includes('export const meta')) {
        errors.push('Les meta tags ne sont pas définis');
      }
      
      // Vérification 5: vérifier l'absence d'erreurs de syntaxe ou d'imports
      if (routeContent.includes('from "../models') && !routeContent.includes('from "../models/')) {
        errors.push('Import de modèle potentiellement incorrect (chemin relatif mal formé)');
      }
      
      // Ajout à la liste des routes invalides si des erreurs sont trouvées
      if (errors.length > 0) {
        invalidRoutes.push({
          route: routeFile,
          errors
        });
      }
    }
    
    // Génération du rapport
    const validationResult: RouteValidationResult = {
      valid: invalidRoutes.length === 0,
      invalidRoutes
    };
    
    // Sauvegarde du rapport
    const reportPath = path.resolve(process.cwd(), '../../audit', 'route-validation.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeFile(reportPath, JSON.stringify(validationResult, null, 2));
    
    // Affichage des résultats
    if (validationResult.valid) {
      console.log(chalk.green(`\n✅ Toutes les routes Remix sont valides! (${tsxRoutes.length} routes vérifiées)`));
    } else {
      console.error(chalk.red(`\n❌ ${invalidRoutes.length} route(s) avec des problèmes:`));
      
      invalidRoutes.forEach(({ route, errors }) => {
        console.error(chalk.red(`\n📄 ${route}:`));
        errors.forEach(error => {
          console.error(chalk.red(`   - ${error}`));
        });
      });
      
      console.error(chalk.red(`\n❌ Vérification des routes échouée. Veuillez corriger les erreurs avant de continuer.`));
    }
    
    return validationResult.valid;
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la vérification des routes:'), error);
    return false;
  }
}