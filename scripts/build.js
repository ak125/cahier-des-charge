/**
 * scripts/build.js - Script de construction du projet
 * Ce script remplace la commande nx build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Fonction pour exécuter des commandes avec logging
function runCommand(command, description) {
  console.log(`${colors.blue}${colors.bright}> ${description}${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (_error) {
    console.error(`${colors.red}Erreur lors de l'exécution de: ${command}${colors.reset}`);
    return false;
  }
}

// Fonction pour vérifier si une commande existe dans le PATH
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (_error) {
    return false;
  }
}

// Fonction pour installer Earthly
function installEarthly() {
  console.log(`${colors.yellow}Earthly n'est pas installé. Installation en cours...${colors.reset}`);

  try {
    // Détecter le système d'exploitation
    const platform = os.platform();

    if (platform === 'linux') {
      // Installation sur Linux
      runCommand('sudo /bin/sh -c \'wget https://github.com/earthly/earthly/releases/latest/download/earthly-linux-amd64 -O /usr/local/bin/earthly && chmod +x /usr/local/bin/earthly && /usr/local/bin/earthly bootstrap --with-autocomplete\'', 'Installation de Earthly sur Linux');
    } else if (platform === 'darwin') {
      // Installation sur macOS
      runCommand('brew install earthly && earthly bootstrap --with-autocomplete', 'Installation de Earthly sur macOS');
    } else if (platform.includes('win')) {
      // Installation sur Windows
      console.log(`${colors.red}L'installation automatique de Earthly sur Windows n'est pas prise en charge.${colors.reset}`);
      console.log(`${colors.yellow}Veuillez consulter https://earthly.dev/get-earthly pour les instructions d'installation manuelle.${colors.reset}`);
      return false;
    } else {
      console.log(`${colors.red}Système d'exploitation non pris en charge pour l'installation automatique: ${platform}${colors.reset}`);
      console.log(`${colors.yellow}Veuillez consulter https://earthly.dev/get-earthly pour les instructions d'installation manuelle.${colors.reset}`);
      return false;
    }

    // Vérifier si l'installation a réussi
    if (commandExists('earthly')) {
      console.log(`${colors.green}Earthly a été installé avec succès!${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}L'installation de Earthly a échoué.${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}Erreur lors de l'installation de Earthly: ${error.message}${colors.reset}`);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log(
    `${colors.cyan}${colors.bright}===========================================${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bright}   Construction du projet                 ${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bright}===========================================${colors.reset}`
  );

  const startTime = Date.now();

  // Vérifier TypeScript
  console.log(`${colors.green}Vérification des types TypeScript...${colors.reset}`);
  runCommand('npx tsc --noEmit', 'Vérification des types');

  // Vérifier s'il s'agit d'un projet Earthly (présence de Earthfile)
  if (fs.existsSync('Earthfile')) {
    console.log(
      `${colors.green}Détection d'Earthfile - utilisation de la construction Earthly${colors.reset}`
    );

    // Vérifier si Earthly est installé
    if (!commandExists('earthly')) {
      console.log(`${colors.yellow}Earthly n'est pas installé sur votre système.${colors.reset}`);

      // Demander à l'utilisateur s'il souhaite installer Earthly
      console.log(`${colors.cyan}Voulez-vous installer Earthly automatiquement? (O/n)${colors.reset}`);

      // Simuler une entrée utilisateur "O" pour cette démo
      // Dans un script réel, vous pourriez utiliser readline pour obtenir l'entrée utilisateur
      const userInput = 'O';

      if (userInput.toLowerCase() === 'o' || userInput === '') {
        const installSuccess = installEarthly();
        if (!installSuccess) {
          console.log(`${colors.yellow}Utilisation de la construction alternative sans Earthly...${colors.reset}`);
          buildWithoutEarthly();
          return;
        }
      } else {
        console.log(`${colors.yellow}Utilisation de la construction alternative sans Earthly...${colors.reset}`);
        buildWithoutEarthly();
        return;
      }
    }

    runCommand('earthly +ci', 'Construction avec Earthly');
  } else {
    buildWithoutEarthly();
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(
    `${colors.green}${colors.bright}Construction terminée en ${duration.toFixed(2)} secondes${colors.reset
    }`
  );
}

// Fonction pour construire le projet sans Earthly
function buildWithoutEarthly() {
  // Vérifier s'il y a des applications dans le dossier apps (monorepo)
  if (fs.existsSync('apps')) {
    const apps = fs
      .readdirSync('apps')
      .filter((app) => fs.statSync(path.join('apps', app)).isDirectory());

    if (apps.length > 0) {
      console.log(`${colors.green}Projet monorepo détecté${colors.reset}`);

      // Construire chaque application
      for (const app of apps) {
        console.log(`${colors.yellow}Construction de l'application: ${app}${colors.reset}`);
        const appDir = path.join('apps', app);

        if (fs.existsSync(path.join(appDir, 'package.json'))) {
          const appPkg = require(path.join(process.cwd(), appDir, 'package.json'));

          if (appPkg.scripts?.build) {
            process.chdir(appDir);
            runCommand('npm run build', `Construction de ${app}`);
            process.chdir(process.cwd());
          } else {
            console.log(
              `${colors.yellow}Pas de script build trouvé pour ${app}, tentative de construction automatique...${colors.reset}`
            );

            // Vérifier s'il s'agit d'un projet NestJS
            if (fs.existsSync(path.join(appDir, 'nest-cli.json'))) {
              process.chdir(appDir);
              runCommand('npx nest build', `Construction de ${app} avec NestJS CLI`);
              process.chdir(process.cwd());
            }
            // Vérifier s'il s'agit d'un projet Remix
            else if (fs.existsSync(path.join(appDir, 'remix.config.js'))) {
              process.chdir(appDir);
              runCommand('npx remix build', `Construction de ${app} avec Remix`);
              process.chdir(process.cwd());
            }
            // Fallback: tentative générique
            else if (fs.existsSync(path.join(appDir, 'tsconfig.json'))) {
              process.chdir(appDir);
              runCommand('npx tsc --build', `Construction de ${app} avec TypeScript`);
              process.chdir(process.cwd());
            }
          }
        }
      }
    }
  } else {
    // Construction d'un projet unique

    // Vérifier s'il s'agit d'un projet NestJS
    if (fs.existsSync('nest-cli.json')) {
      runCommand('npx nest build', 'Construction avec NestJS CLI');
    }
    // Vérifier s'il s'agit d'un projet Remix
    else if (fs.existsSync('remix.config.js')) {
      runCommand('npx remix build', 'Construction avec Remix');
    }
    // Fallback: utilisation de TypeScript
    else {
      console.log(
        `${colors.yellow}Aucune configuration spécifique détectée, utilisation de TypeScript${colors.reset}`
      );
      runCommand('npx tsc --build', 'Construction avec TypeScript');
    }
  }
}

// Exécuter le script
main().catch((error) => {
  console.error(`${colors.red}Erreur non gérée:${colors.reset}`, error);
  process.exit(1);
});
