import path from 'path';
import chalk from 'chalk';
import { execaCommand } from 'execa';
import fs from 'fs-extra';

interface BacklogItem {
  priority: number;
  status: 'pending' | 'done' | 'invalid' | 'in-progress';
  path: string;
  dependencies: string[];
  metadata: {
    routeType: string;
    isCritical: boolean;
    hasDatabase: boolean;
    hasAuthentication: boolean;
  };
}

interface Backlog {
  [key: string]: BacklogItem;
}

export async function migrate(fileName: string): Promise<void> {
  try {
    // Vérifier si le fichier existe dans le backlog
    const backlogPath = path.resolve(process.cwd(), 'backlogDoDotmcp.json');

    if (!(await fs.pathExists(backlogPath))) {
      console.error(
        chalk.red(
          `❌ Fichier backlogDoDotmcp.json introuvable. Exécutez d'abord la commande de génération de backlog.`
        )
      );
      return;
    }

    const backlogData = await fs.readFile(backlogPath, 'utf8');
    const backlog: Backlog = JSON.parse(backlogData);

    if (!backlog[fileName]) {
      console.error(chalk.red(`❌ Le fichier ${fileName} n'existe pas dans le backlog.`));
      return;
    }

    // Vérification des dépendances
    const dependencies = backlog[fileName].dependencies;
    const dependenciesNotDone = dependencies.filter(
      (dep) => backlog[dep] && backlog[dep].status !== 'done'
    );

    if (dependenciesNotDone.length > 0) {
      console.warn(
        chalk.yellow('⚠️ Attention: Les dépendances suivantes ne sont pas encore migrées:')
      );
      dependenciesNotDone.forEach((dep) => {
        console.warn(
          chalk.yellow(`   - ${dep} (${backlog[dep] ? backlog[dep].status : 'non trouvé'})`)
        );
      });

      // Demande de confirmation
      console.log(chalk.yellow('Voulez-vous continuer la migration malgré tout ? (Y/n)'));
      // Note: Dans un vrai CLI interactif, nous demanderions l'entrée utilisateur ici
      // Pour cette démo, on assume que oui
    }

    // Mise à jour du statut en "in-progress"
    backlog[fileName].status = 'in-progress';
    await fs.writeFile(backlogPath, JSON.stringify(backlog, null, 2), 'utf8');
    console.log(chalk.blue(`🔄 Début de la migration de ${fileName}...`));

    // Exécution de la migration
    // Dans un vrai outil, on pourrait appeler un script de migration ou un agent IA ici
    console.log(chalk.blue(`🤖 Exécution de l'agent de migration pour ${fileName}...`));

    try {
      // Simulation d'un appel à un agent ou à un processus de migration
      // Dans un vrai outil, on utiliserait execa pour appeler un script ou un agent
      // await execaCommand(`node migration-toolkit/migrate.js ${backlog[fileName].path}`);

      // Mise à jour du statut après succès
      backlog[fileName].status = 'done';
      await fs.writeFile(backlogPath, JSON.stringify(backlog, null, 2), 'utf8');
      console.log(chalk.green(`✅ Migration de ${fileName} terminée avec succès!`));
    } catch (error) {
      // En cas d'erreur, mettre le statut à "invalid"
      backlog[fileName].status = 'invalid';
      await fs.writeFile(backlogPath, JSON.stringify(backlog, null, 2), 'utf8');
      console.error(chalk.red(`❌ Erreur lors de la migration de ${fileName}:`, error));
    }
  } catch (error) {
    console.error(chalk.red('❌ Erreur:', error));
  }
}
