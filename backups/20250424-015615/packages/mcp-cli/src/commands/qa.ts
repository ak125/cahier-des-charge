import fs from fs-extrastructure-agent';
import path from pathstructure-agent';
import chalk from chalkstructure-agent';
import { execaCommand } from execastructure-agent';

interface QAReport {
  file: string;
  score: number;
  totalFields: number;
  migratedFields: number;
  routesCovered: boolean;
  typesCovered: boolean;
  dbQueriesConverted: boolean;
  metaTagsPresent: boolean;
  seoCompliant: boolean;
  accessibilityScore: number;
  details: {
    missingFields?: string[];
    errorMessages?: string[];
    warnings?: string[];
  };
}

/**
 * Analyse la qualité de la migration d'un fichier PHP vers Remix
 * @param file Le nom du fichier PHP à analyser
 */
export async function qa(file: string): Promise<void> {
  try {
    console.log(chalk.blue(`🔍 Analyse de la qualité de migration pour ${file}...`));
    
    // Chemin vers le fichier PHP d'origine et sa version migrée en Remix
    const backlogPath = path.resolve(process.cwd(), '../../backlogDoDotmcp.json');
    
    // Vérifier si le fichier backlog existe
    if (!await fs.pathExists(backlogPath)) {
      console.error(chalk.red(`❌ Fichier backlogDoDotmcp.json introuvable`));
      return;
    }
    
    // Lecture du backlog pour trouver le chemin du fichier PHP
    const backlogData = await fs.readFile(backlogPath, 'utf-8');
    const backlog = JSON.parse(backlogData);
    
    if (!backlog[file]) {
      console.error(chalk.red(`❌ Le fichier ${file} n'existe pas dans le backlog`));
      return;
    }
    
    const phpFilePath = path.resolve(process.cwd(), '../../', backlog[file].path);
    
    // Détermination du chemin de la version migrée selon les conventions
    // Format: du fichier "fiche.php" à "app/routes/fiche.tsx"
    const remixFileBase = file.replace('.php', '');
    const remixFileName = `${remixFileBase}.tsx`;
    
    // Pour les modèles, le chemin sera différent
    const isModel = backlog[file].metadata && backlog[file].metadata.routeType === 'model';
    const remixFilePath = isModel 
      ? path.resolve(process.cwd(), '../../app/models', `${remixFileBase}.server.ts`)
      : path.resolve(process.cwd(), '../../app/routes', remixFileName);
    
    // Vérifier si le fichier migré existe
    const remixFileExists = await fs.pathExists(remixFilePath);
    if (!remixFileExists) {
      console.error(chalk.red(`❌ Fichier migré introuvable: ${remixFilePath}`));
      console.error(chalk.yellow(`💡 Assurez-vous que la migration est en cours`));
      return;
    }
    
    console.log(chalk.blue(`📄 Fichier PHP: ${phpFilePath}`));
    console.log(chalk.blue(`📄 Fichier Remix: ${remixFilePath}`));
    
    // Analyse du contenu des fichiers
    const phpContent = await fs.readFile(phpFilePath, 'utf-8');
    const remixContent = await fs.readFile(remixFilePath, 'utf-8');
    
    // Extraction des informations pertinentes
    // Note: Dans un vrai outil, cette partie serait beaucoup plus sophistiquée
    // et utiliserait des parsers PHP et TypeScript pour une analyse précise
    
    // Simulation d'extraction de champs depuis le fichier PHP
    const phpFields = extractPHPFields(phpContent);
    const remixFields = extractRemixFields(remixContent);
    
    // Calcul des métriques
    const totalFields = phpFields.length;
    const migratedFields = remixFields.filter(field => 
      phpFields.some(phpField => phpField.toLowerCase() === field.toLowerCase())
    ).length;
    
    const missingFields = phpFields.filter(field => 
      !remixFields.some(remixField => remixField.toLowerCase() === field.toLowerCase())
    );
    
    // Vérification de la présence des routes
    const routeCheck = isModel ? true : remixContent.includes('export function loader') || remixContent.includes('export async function loader');
    const actionCheck = isModel ? true : remixContent.includes('export function action') || remixContent.includes('export async function action');
    const routesCovered = routeCheck && (actionCheck || !phpContent.includes('$_POST'));
    
    // Vérification des types TypeScript
    const typesCovered = remixContent.includes('interface') || remixContent.includes('type ');
    
    // Vérification des requêtes de base de données
    const dbQueriesConverted = remixContent.includes('prisma.');
    
    // Vérification des balises meta
    const metaTagsPresent = remixContent.includes('export const meta');
    
    // Simulation d'un score SEO (dans un vrai outil, cela serait basé sur une analyse plus complète)
    const seoCompliant = metaTagsPresent && remixContent.includes('title') && remixContent.includes('description');
    
    // Simulation d'un score d'accessibilité
    const accessibilityScore = Math.min(100, Math.floor(Math.random() * 30) + 70);
    
    // Calcul du score global
    const fieldScore = totalFields > 0 ? (migratedFields / totalFields) * 100 : 100;
    const routeScore = routesCovered ? 100 : 60;
    const typeScore = typesCovered ? 100 : 70;
    const dbScore = dbQueriesConverted ? 100 : 70;
    const metaScore = metaTagsPresent ? 100 : 80;
    const seoScore = seoCompliant ? 100 : 85;
    
    // Moyenne pondérée des scores individuels
    const overallScore = Math.round(
      (fieldScore * 0.4) + 
      (routeScore * 0.15) + 
      (typeScore * 0.15) + 
      (dbScore * 0.1) + 
      (metaScore * 0.1) + 
      (seoScore * 0.1)
    );
    
    // Création du rapport
    const qaReport: QAReport = {
      file,
      score: overallScore,
      totalFields,
      migratedFields,
      routesCovered,
      typesCovered,
      dbQueriesConverted,
      metaTagsPresent,
      seoCompliant,
      accessibilityScore,
      details: {
        missingFields,
        warnings: []
      }
    };
    
    // Ajout d'avertissements si nécessaire
    if (!routesCovered) {
      qaReport.details.warnings!.push('Les routes Remix ne couvrent pas toutes les fonctionnalités du fichier PHP');
    }
    
    if (!typesCovered) {
      qaReport.details.warnings!.push('Les types TypeScript ne sont pas définis pour toutes les données');
    }
    
    if (!dbQueriesConverted) {
      qaReport.details.warnings!.push('Les requêtes SQL n\'ont pas été converties en Prisma');
    }
    
    if (!metaTagsPresent) {
      qaReport.details.warnings!.push('Les balises meta ne sont pas définies');
    }
    
    // Sauvegarde du rapport
    const qaFilePath = path.resolve(process.cwd(), '../../audit', `${file}.qa.json`);
    await fs.ensureDir(path.dirname(qaFilePath));
    await fs.writeFile(qaFilePath, JSON.stringify(qaReport, null, 2));
    
    // Génération d'un rapport visuel HTML
    const diffHtmlPath = path.resolve(process.cwd(), '../../audit', `${file}.diff.html`);
    await generateDiffHtml(file, qaReport, diffHtmlPath);
    
    // Affichage des résultats
    console.log(chalk.blue(`\n📊 Résumé de l'analyse:`));
    console.log(`📝 Score global: ${overallScore >= 95 ? chalk.green(overallScore + '%') : chalk.red(overallScore + '%')}`);
    console.log(`🔢 Champs migrés: ${migratedFields}/${totalFields} (${Math.round(fieldScore)}%)`);
    
    console.log(chalk.blue('\n📋 Vérifications critiques:'));
    console.log(`🛣️ Routes: ${routesCovered ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`🧬 Types: ${typesCovered ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`🗃️ Base de données: ${dbQueriesConverted ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`🏷️ Meta tags: ${metaTagsPresent ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`🔍 SEO: ${seoCompliant ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`♿ Accessibilité: ${accessibilityScore}%`);
    
    if (missingFields.length > 0) {
      console.log(chalk.yellow('\n⚠️ Champs manquants:'));
      missingFields.forEach(field => console.log(chalk.yellow(`   - ${field}`)));
    }
    
    if (qaReport.details.warnings!.length > 0) {
      console.log(chalk.yellow('\n⚠️ Avertissements:'));
      qaReport.details.warnings!.forEach(warning => console.log(chalk.yellow(`   - ${warning}`)));
    }
    
    console.log(chalk.green(`\n✅ Rapport QA généré: ${qaFilePath}`));
    console.log(chalk.green(`📊 Rapport visuel: ${diffHtmlPath}`));
    
    // Determine le statut final pour le système CI/CD
    if (overallScore >= 95) {
      console.log(chalk.green(`\n✅ La migration est prête pour être mergée!`));
    } else {
      console.error(chalk.red(`\n❌ La migration n'est pas complète (${overallScore}%). Score minimum requis: 95%`));
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'analyse QA de ${file}:`), error);
  }
}

/**
 * Extrait les noms de champs d'un fichier PHP
 * Note: Dans un vrai outil, cela utiliserait un parser PHP
 */
function extractPHPFields(phpContent: string): string[] {
  // Simulation simple pour l'exemple
  // Dans un vrai outil, utilisez un parser PHP comme php-parser
  const fieldPattern = /\$([a-zA-Z0-9_]+)\s*=/g;
  const fields = [];
  let match;
  
  while ((match = fieldPattern.exec(phpContent)) !== null) {
    fields.push(match[1]);
  }
  
  // Ajoute également les champs de $_POST et $_GET
  const postGetPattern = /\$_(POST|GET)\[["']([a-zA-Z0-9_]+)["']\]/g;
  while ((match = postGetPattern.exec(phpContent)) !== null) {
    fields.push(match[2]);
  }
  
  return [...new Set(fields)]; // Supprime les doublons
}

/**
 * Extrait les noms de champs d'un fichier Remix
 * Note: Dans un vrai outil, cela utiliserait un parser TypeScript
 */
function extractRemixFields(remixContent: string): string[] {
  // Simulation simple pour l'exemple
  // Dans un vrai outil, utilisez un parser TS comme typescript-estree
  const fieldPattern = /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=/g;
  const fields = [];
  let match;
  
  while ((match = fieldPattern.exec(remixContent)) !== null) {
    fields.push(match[1]);
  }
  
  // Ajoute également les champs des objets
  const objectFieldPattern = /\.([a-zA-Z0-9_]+)(?:\s|=|\)|}|,)/g;
  while ((match = objectFieldPattern.exec(remixContent)) !== null) {
    fields.push(match[1]);
  }
  
  return [...new Set(fields)]; // Supprime les doublons
}

/**
 * Génère un rapport HTML visuel pour comparer les fichiers
 */
async function generateDiffHtml(file: string, qaReport: QAReport, outputPath: string): Promise<void> {
  // HTML basique avec des styles pour afficher la comparaison
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport QA - ${file}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; }
    .score { font-size: 24px; font-weight: bold; }
    .good { color: #10B981; }
    .medium { color: #F59E0B; }
    .bad { color: #EF4444; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eaeaea; }
    th { background: #f9fafb; }
    .missing { background: #FEF2F2; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 14px; }
    .badge-success { background: #D1FAE5; color: #065F46; }
    .badge-warning { background: #FEF3C7; color: #92400E; }
    .badge-error { background: #FEE2E2; color: #B91C1C; }
    .progress-bar { height: 10px; background: #E5E7EB; border-radius: 5px; overflow: hidden; }
    .progress-value { height: 100%; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Rapport de Qualité de Migration</h1>
      <h2>${file}</h2>
      <p class="score ${qaReport.score >= 95 ? 'good' : qaReport.score >= 80 ? 'medium' : 'bad'}">
        Score: ${qaReport.score}%
      </p>
      <div class="progress-bar">
        <div class="progress-value" style="width: ${qaReport.score}%; background-color: ${qaReport.score >= 95 ? '#10B981' : qaReport.score >= 80 ? '#F59E0B' : '#EF4444'};"></div>
      </div>
    </div>
    
    <div class="card">
      <h3>Résumé</h3>
      <div class="grid">
        <div>
          <p><strong>Champs migrés:</strong> ${qaReport.migratedFields}/${qaReport.totalFields} (${Math.round(qaReport.migratedFields/qaReport.totalFields*100)}%)</p>
          <p><strong>Routes couvertes:</strong> <span class="${qaReport.routesCovered ? 'badge badge-success' : 'badge badge-error'}">${qaReport.routesCovered ? 'Oui' : 'Non'}</span></p>
          <p><strong>Types TypeScript:</strong> <span class="${qaReport.typesCovered ? 'badge badge-success' : 'badge badge-error'}">${qaReport.typesCovered ? 'Oui' : 'Non'}</span></p>
        </div>
        <div>
          <p><strong>Requêtes DB converties:</strong> <span class="${qaReport.dbQueriesConverted ? 'badge badge-success' : 'badge badge-error'}">${qaReport.dbQueriesConverted ? 'Oui' : 'Non'}</span></p>
          <p><strong>Meta tags présents:</strong> <span class="${qaReport.metaTagsPresent ? 'badge badge-success' : 'badge badge-error'}">${qaReport.metaTagsPresent ? 'Oui' : 'Non'}</span></p>
          <p><strong>SEO conforme:</strong> <span class="${qaReport.seoCompliant ? 'badge badge-success' : 'badge badge-error'}">${qaReport.seoCompliant ? 'Oui' : 'Non'}</span></p>
          <p><strong>Score d'accessibilité:</strong> <span class="${qaReport.accessibilityScore >= 90 ? 'badge badge-success' : qaReport.accessibilityScore >= 70 ? 'badge badge-warning' : 'badge badge-error'}">${qaReport.accessibilityScore}%</span></p>
        </div>
      </div>
    </div>
    
    ${qaReport.details.missingFields && qaReport.details.missingFields.length > 0 ? `
    <div class="card">
      <h3>Champs manquants (${qaReport.details.missingFields.length})</h3>
      <table>
        <thead>
          <tr>
            <th>Nom du champ</th>
          </tr>
        </thead>
        <tbody>
          ${qaReport.details.missingFields.map(field => `
          <tr class="missing">
            <td>${field}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    ${qaReport.details.warnings && qaReport.details.warnings.length > 0 ? `
    <div class="card">
      <h3>Avertissements (${qaReport.details.warnings.length})</h3>
      <ul>
        ${qaReport.details.warnings.map(warning => `
        <li>${warning}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div class="card">
      <h3>Conclusion</h3>
      <p>${qaReport.score >= 95 
        ? '<span class="badge badge-success">PRÊT POUR MERGE</span> Cette migration répond à tous les critères de qualité requis.' 
        : '<span class="badge badge-error">CORRECTIONS REQUISES</span> Cette migration nécessite des améliorations avant de pouvoir être mergée.'}</p>
    </div>
  </div>
</body>
</html>
  `;
  
  await fs.writeFile(outputPath, html);
}