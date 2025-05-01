import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';

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
 * Vérifie si la migration d'un fichier est complète selon les critères de qualité
 * @param file Le nom du fichier PHP à vérifier
 * @param minScore Le score minimum requis (défaut: 95)
 * @returns true si la migration est complète, false sinon
 */
export async function checkCompletion(file: string, minScore = 95): Promise<boolean> {
  try {
    // Chemin vers le rapport QA du fichier
    const qaFilePath = path.resolve(process.cwd(), '../../audit', `${file}.qa.json`);

    // Vérifier si le fichier d'audit existe
    if (!(await fs.pathExists(qaFilePath))) {
      console.error(chalk.red(`❌ Rapport d'audit introuvable pour ${file}`));
      console.error(chalk.yellow(`💡 Exécutez d'abord : pnpmDoDotmcp qa ${file}`));
      return false;
    }

    // Lecture et parsing du rapport QA
    const qaData = await fs.readFile(qaFilePath, 'utf-8');
    const qa: QAReport = JSON.parse(qaData);

    // Vérifie si le score minimum est atteint
    const passesScoreCheck = qa.score >= minScore;

    // Vérifie des éléments critiques même si le score est bon
    const criticalChecks = [
      { condition: qa.routesCovered, message: 'Routes non couvertes' },
      { condition: qa.typesCovered, message: 'Types TS manquants' },
      { condition: qa.dbQueriesConverted, message: 'Requêtes SQL non converties en Prisma' },
      { condition: qa.metaTagsPresent, message: 'Balises meta manquantes' },
    ];

    const failedCriticalChecks = criticalChecks.filter((check) => !check.condition);
    const passesCriticalChecks = failedCriticalChecks.length === 0;

    // Affiche le résumé du rapport
    console.log(chalk.blue(`📊 Résumé de migration pour ${file}:`));
    console.log(
      `📝 Score global: ${
        qa.score >= minScore ? chalk.green(`${qa.score}%`) : chalk.red(`${qa.score}%`)
      }`
    );
    console.log(
      `🔢 Champs migrés: ${qa.migratedFields}/${qa.totalFields} (${Math.round(
        (qa.migratedFields / qa.totalFields) * 100
      )}%)`
    );

    // Affiche les statuts des vérifications critiques
    console.log(chalk.blue('\n📋 Vérifications critiques:'));
    console.log(`🛣️ Routes: ${qa.routesCovered ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`🧬 Types: ${qa.typesCovered ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`🗃️ Base de données: ${qa.dbQueriesConverted ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`🏷️ Meta tags: ${qa.metaTagsPresent ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`🔍 SEO: ${qa.seoCompliant ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(
      `♿ Accessibilité: ${
        qa.accessibilityScore >= 90
          ? chalk.green(`${qa.accessibilityScore}%`)
          : chalk.yellow(`${qa.accessibilityScore}%`)
      }`
    );

    // En cas d'échec, affiche les détails
    if (!passesScoreCheck || !passesCriticalChecks) {
      console.error(chalk.red('\n❌ Migration incomplète:'));

      if (!passesScoreCheck) {
        console.error(
          chalk.red(`   - Score insuffisant: ${qa.score}% (minimum requis: ${minScore}%)`)
        );
      }

      if (failedCriticalChecks.length > 0) {
        failedCriticalChecks.forEach((check) => {
          console.error(chalk.red(`   - ${check.message}`));
        });
      }

      if (qa.details.missingFields && qa.details.missingFields.length > 0) {
        console.error(chalk.red('\n🔍 Champs manquants:'));
        qa.details.missingFields.forEach((field) => {
          console.error(chalk.red(`   - ${field}`));
        });
      }

      if (qa.details.errorMessages && qa.details.errorMessages.length > 0) {
        console.error(chalk.red('\n⚠️ Erreurs:'));
        qa.details.errorMessages.forEach((error) => {
          console.error(chalk.red(`   - ${error}`));
        });
      }

      if (qa.details.warnings && qa.details.warnings.length > 0) {
        console.warn(chalk.yellow('\n⚠️ Avertissements:'));
        qa.details.warnings.forEach((warning) => {
          console.warn(chalk.yellow(`   - ${warning}`));
        });
      }

      console.error(chalk.red(`\n❌ La migration de ${file} n'est pas complète pour être mergée.`));
      return false;
    }

    // Si tout est OK
    console.log(chalk.green(`\n✅ Migration validée : ${file} (score ${qa.score}%)`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la vérification de ${file}:`), error);
    return false;
  }
}
