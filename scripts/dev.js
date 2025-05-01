/**
 * scripts/dev.js - Script de démarrage en mode développement
 * Ce script remplace la commande nx dev
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
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

// Fonction pour vérifier si des services doivent être démarrés
function shouldStartServices() {
  try {
    // Vérifier si le fichier .env existe et contient AUTO_START_SERVICES=true
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const autoStart = /AUTO_START_SERVICES\s*=\s*true/i.test(envContent);
      return autoStart;
    }
    return false;
  } catch (_error) {
    console.error(
      `${colors.yellow}Avertissement: Impossible de vérifier la configuration des services${colors.reset}`
    );
    return false;
  }
}

// Fonction principale
async function main() {
  console.log(
    `${colors.cyan}${colors.bright}===========================================${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bright}   Démarrage en mode développement        ${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bright}===========================================${colors.reset}`
  );

  // Vérifier que l'environnement est correctement installé
  console.log(`${colors.green}Vérification de l'environnement...${colors.reset}`);

  if (!fs.existsSync('node_modules')) {
    console.log(
      `${colors.yellow}Les modules Node.js ne sont pas installés. Installation en cours...${colors.reset}`
    );
    runCommand('npm install', 'Installation des dépendances');
  }

  // Vérifier la configuration TypeScript
  if (!fs.existsSync('tsconfig.json')) {
    console.error(`${colors.red}Erreur: tsconfig.json non trouvé${colors.reset}`);
    process.exit(1);
  }

  // Exécuter le script setup.js s'il existe
  if (fs.existsSync('scripts/setup.js')) {
    console.log(`${colors.green}Exécution du script de configuration...${colors.reset}`);
    runCommand('node scripts/setup.js', 'Configuration du projet');
  }

  // Démarrer les services si nécessaire
  if (shouldStartServices()) {
    console.log(`${colors.green}Démarrage des services...${colors.reset}`);

    // Démarrer Docker si nécessaire
    if (fs.existsSync('docker-compose.dev.yml')) {
      runCommand(
        'docker-compose -f docker-compose.dev.yml up -d',
        'Démarrage des conteneurs Docker'
      );
    }

    // Démarrer BullMQ si nécessaire
    if (fs.existsSync('scripts/agent-manager.js')) {
      runCommand('node scripts/agent-manager.js bullmq-orchestrator', 'Démarrage de BullMQ');
    }
  }

  // Exécuter les tâches principales de développement
  console.log(`${colors.green}Démarrage du mode développement...${colors.reset}`);

  // Si le projet est un monorepo avec apps, détecter l'application à démarrer
  if (fs.existsSync('apps')) {
    const apps = fs
      .readdirSync('apps')
      .filter((app) => fs.statSync(path.join('apps', app)).isDirectory());

    if (apps.length > 0) {
      console.log(`${colors.blue}Applications disponibles:${colors.reset}`);
      apps.forEach((app, index) => {
        console.log(`  ${index + 1}. ${app}`);
      });

      // Dans un script automatisé, nous pouvons démarrer la première application par défaut
      // Dans un environnement interactif, vous pourriez utiliser readline pour demander à l'utilisateur
      console.log(
        `${colors.yellow}Démarrage de la première application par défaut: ${apps[0]}${colors.reset}`
      );

      // Vérifier s'il y a un script de démarrage dans cette application
      const appDir = path.join('apps', apps[0]);
      if (fs.existsSync(path.join(appDir, 'package.json'))) {
        const appPkg = require('path.join(process.cwd(), appDir, 'package.json'));

        if (appPkg.scripts?.dev) {
          process.chdir(appDir);
          runCommand('npm run dev', `Démarrage de l'application ${apps[0]}`);
          return;
        }
      }
    }
  }

  // Vérifier si c'est un projet NestJS par la présence de nest-cli.json
  if (fs.existsSync('nest-cli.json')) {
    runCommand('npx nest start --watch', 'Démarrage du serveur NestJS en mode watch');
    return;
  }

  // Vérifier si c'est un projet Remix par la présence de remix.config.js
  if (fs.existsSync('remix.config.js')) {
    runCommand('npx remix dev', 'Démarrage du serveur Remix en mode développement');
    return;
  }

  // Fallback: tenter d'exécuter ts-node sur le fichier principal
  if (fs.existsSync('src/index.ts')) {
    runCommand(
      'npx ts-node-dev --respawn src/index.ts',
      'Démarrage du serveur TypeScript en mode watch'
    );
  } else if (fs.existsSync('src/main.ts')) {
    runCommand(
      'npx ts-node-dev --respawn src/main.ts',
      'Démarrage du serveur TypeScript en mode watch'
    );
  } else {
    console.log(
      `${colors.yellow}Aucun point d'entrée spécifique trouvé. Démarrage en mode interactif.${colors.reset}`
    );
    console.log(
      `${colors.green}Environnement de développement prêt. Vous pouvez maintenant modifier les fichiers.${colors.reset}`
    );
  }
}

// Exécuter le script
main().catch((error) => {
  console.error(`${colors.red}Erreur non gérée:${colors.reset}`, error);
  process.exit(1);
});
