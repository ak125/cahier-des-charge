import bodyParser from 'body-parser';
import express from 'express';
import { runCITester } from '../index';
import { CITest } from '../types';

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware pour parser le JSON
app.use(bodyParser.json());

// Point d'entrée principal pour générer un pipeline CI
app.post('/api/generate-ci', async (req, res) => {
  try {
    const {
      projectPath,
      outputPath,
      generateWorkflow = true,
      validateSetup = true,
      localTest = false,
      customTests = [],
      configOptions = {},
    } = req.body;

    if (!projectPath) {
      return res.status(400).json({
        success: false,
        error: 'Le chemin du projet est requis',
      });
    }

    // Exécuter l'agent CI-Tester
    const result = await runCITester({
      configPath: configOptions.configPath,
      generateWorkflow,
      validateCurrentSetup: validateSetup,
      localTest,
      outputPath,
      dryRun: req.query.dryRun === 'true',
      verbose: req.query.verbose === 'true',
    });

    return res.json({
      success: true,
      result: {
        status: result.status,
        generatedFiles: result.generatedFiles,
        detectedTests: result.detectedTests.length,
        timestamp: result.timestamp,
      },
      logs: result.logs,
    });
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Validation d'un test spécifique
app.post('/api/validate-test', async (req, res) => {
  try {
    const { test } = req.body;

    if (!test || !test.command) {
      return res.status(400).json({
        success: false,
        error: 'Un objet test avec une commande est requis',
      });
    }

    // Convertir en objet CITest si ce n'est pas déjà fait
    const ciTest: CITest = {
      name: test.name || 'Test personnalisé',
      command: test.command,
      description: test.description || "Test personnalisé défini par l'utilisateur",
      required: test.required !== undefined ? test.required : false,
      category: test.category,
      options: test.options,
    };

    // Tester la validité de la commande
    try {
      const { execSync } = require('child_process');

      // Pour certaines commandes sensibles, on fait juste un check de version
      if (ciTest.command.includes('npm ci') || ciTest.command.includes('npm install')) {
        execSync('npm -v', { stdio: 'ignore' });
      } else if (ciTest.command.startsWith('npx ')) {
        const packageName = ciTest.command.split(' ')[1];
        execSync(
          `npx ${packageName} --version || npx ${packageName} -v || npx ${packageName} help`,
          {
            stdio: 'ignore',
          }
        );
      } else {
        // Adapter la commande pour un test non destructif
        let command = ciTest.command;
        if (command.includes('npm run ')) {
          command = command.replace('npm run ', 'npm run --dry-run ');
        } else if (command.includes('npm test')) {
          command = command.replace('npm test', 'npm test --dry-run');
        }

        execSync(command, { stdio: 'ignore' });
      }

      return res.json({
        success: true,
        valid: true,
        test: ciTest,
      });
    } catch (cmdError) {
      return res.json({
        success: true,
        valid: false,
        error: cmdError.message,
        test: ciTest,
      });
    }
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Route pour récupérer les tests détectés dans un projet
app.get('/api/detect-tests', async (req, res) => {
  try {
    const { projectPath } = req.query;

    if (!projectPath || typeof projectPath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Le chemin du projet est requis',
      });
    }

    // Exécuter uniquement la partie détection des tests
    const result = await runCITester({
      generateWorkflow: false,
      validateCurrentSetup: false,
      localTest: false,
      dryRun: true,
      verbose: false,
    });

    return res.json({
      success: true,
      detectedTests: result.detectedTests,
    });
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Route pour les informations sur le dernier run CI
app.get('/api/last-run', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const { projectPath } = req.query;
    const lastRunPath = projectPath
      ? path.join(projectPath.toString(), 'reports/ci_last_run.json')
      : path.join(process.cwd(), 'reports/ci_last_run.json');

    if (!fs.existsSync(lastRunPath)) {
      return res.status(404).json({
        success: false,
        error: 'Aucune information de dernière exécution trouvée',
      });
    }

    const lastRunData = JSON.parse(fs.readFileSync(lastRunPath, 'utf8'));

    return res.json({
      success: true,
      lastRun: lastRunData,
    });
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Démarrer le serveur uniquement si exécuté directement
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur API CI-Tester démarré sur le port ${PORT}`);
  });
}

// Exporter pour permettre l'intégration dans d'autres applications
export default app;
