#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const chalk = require('chalk');
const mustache = require('mustache');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parsing des arguments
const argv = yargs(hideBin(process.argv))
  .option('type', {
    alias: 't',
    description: 'Type de génération (module, agent, strategy, workflow)',
    type: 'string',
    demandOption: true,
  })
  .option('name', {
    alias: 'n',
    description: "Nom de l'élément à générer",
    type: 'string',
    demandOption: true,
  })
  .option('description', {
    alias: 'd',
    description: "Description de l'élément",
    type: 'string',
  })
  .option('cdc-section', {
    description: 'Section du cahier des charges associée',
    type: 'string',
  })
  .option('force', {
    alias: 'f',
    description: "Forcer l'écrasement des fichiers existants",
    type: 'boolean',
    default: false,
  })
  .help()
  .alias('help', 'h').argv;

// Configuration
const CONFIG_PATH = path.join(process.cwd(), 'config', 'generation-config.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
} catch (error) {
  console.error(chalk.red(`Erreur lors du chargement de la configuration: ${error.message}`));
  console.error(chalk.yellow('Utilisez la configuration par défaut...'));
  config = {
    generators: {
      module: {
        template_dir: 'templates/module',
        output_dir: 'src/modules',
        tests: true,
      },
      agent: {
        template_dir: 'templates/agent',
        output_dir: 'src/agents',
        tests: true,
      },
      strategy: {
        template_dir: 'templates/strategy',
        output_dir: 'src/strategies',
        tests: true,
      },
      workflow: {
        template_dir: 'templates/workflow',
        output_dir: 'workflows',
        tests: false,
      },
    },
    variables: {
      project_name: 'migration-ai-pipeline',
      author: 'AI Migration Team',
    },
  };
}

// Conversion du nom
function formatName(name, format) {
  const kebabCase = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const camelCase = kebabCase.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const pascalCase = camelCase[0].toUpperCase() + camelCase.slice(1);
  const snakeCase = kebabCase.replace(/-/g, '_');

  switch (format) {
    case 'kebab':
      return kebabCase;
    case 'camel':
      return camelCase;
    case 'pascal':
      return pascalCase;
    case 'snake':
      return snakeCase;
    default:
      return name;
  }
}

// Fonction principale de génération
async function generateTechnicalFiles() {
  const { type, name, description, force } = argv;

  // Vérification du type
  if (!config.generators[type]) {
    console.error(chalk.red(`Type de génération non pris en charge: ${type}`));
    console.error(chalk.yellow(`Types disponibles: ${Object.keys(config.generators).join(', ')}`));
    process.exit(1);
  }

  const generatorConfig = config.generators[type];
  const templateDir = path.join(process.cwd(), generatorConfig.template_dir);
  const outputBaseDir = path.join(process.cwd(), generatorConfig.output_dir);
  const outputDir = path.join(outputBaseDir, formatName(name, 'kebab'));

  // Vérifier si les répertoires de templates existent
  if (!fs.existsSync(templateDir)) {
    console.error(chalk.red(`Répertoire de templates non trouvé: ${templateDir}`));
    console.error(chalk.yellow('Création du répertoire de templates...'));
    await createTemplateDir(templateDir, type);
  }

  // Vérifier si le répertoire de sortie existe déjà
  if (fs.existsSync(outputDir) && !force) {
    console.error(chalk.red(`Le répertoire existe déjà: ${outputDir}`));
    console.error(chalk.yellow('Utilisez --force pour écraser les fichiers existants'));
    process.exit(1);
  }

  // Créer le répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(chalk.blue(`🔍 Génération des fichiers pour ${type}: ${name}`));

  // Exécution des hooks pre-generate si définis
  if (config.hooks?.pre_generate) {
    console.log(chalk.blue(`🔄 Exécution du hook pre-generate: ${config.hooks.pre_generate}`));
    try {
      await exec(`${config.hooks.pre_generate} ${type} ${name}`);
    } catch (error) {
      console.error(chalk.red(`Erreur lors de l'exécution du hook pre-generate: ${error.message}`));
    }
  }

  // Variables pour les templates
  const templateVars = {
    name,
    description: description || `${formatName(name, 'pascal')} ${type}`,
    kebabName: formatName(name, 'kebab'),
    camelName: formatName(name, 'camel'),
    pascalName: formatName(name, 'pascal'),
    snakeName: formatName(name, 'snake'),
    cdcSection: argv['cdc-section'] || '',
    date: new Date().toISOString(),
    year: new Date().getFullYear(),
    ...config.variables,
  };

  // Fonction pour générer les fichiers à partir de templates
  const generateFromTemplates = async (templatesPath, outputPath) => {
    if (!fs.existsSync(templatesPath)) return;

    const files = fs.readdirSync(templatesPath);

    for (const file of files) {
      const sourcePath = path.join(templatesPath, file);
      const stats = fs.statSync(sourcePath);

      if (stats.isDirectory()) {
        const newOutputPath = path.join(outputPath, file);
        if (!fs.existsSync(newOutputPath)) {
          fs.mkdirSync(newOutputPath, { recursive: true });
        }
        await generateFromTemplates(sourcePath, newOutputPath);
      } else {
        // Traiter le nom du fichier avec les variables
        const destFileName = file
          .replace('.mustache', '')
          .replace(/\[kebabName\]/g, templateVars.kebabName)
          .replace(/\[camelName\]/g, templateVars.camelName)
          .replace(/\[pascalName\]/g, templateVars.pascalName)
          .replace(/\[snakeName\]/g, templateVars.snakeName);

        const destPath = path.join(outputPath, destFileName);

        if (file.endsWith('.mustache')) {
          // Traiter en tant que template Mustache
          const template = fs.readFileSync(sourcePath, 'utf8');
          const rendered = mustache.render(template, templateVars);
          fs.writeFileSync(destPath, rendered);
          console.log(chalk.green(`✅ Fichier généré: ${destPath}`));
        } else {
          // Copier tel quel
          fs.copyFileSync(sourcePath, destPath);
          console.log(chalk.green(`✅ Fichier copié: ${destPath}`));
        }
      }
    }
  };

  // Générer les fichiers
  await generateFromTemplates(templateDir, outputDir);

  // Mise à jour du journal d'activité
  updateGenerationLog(type, name, outputDir);

  // Exécution des hooks post-generate si définis
  if (config.hooks?.post_generate) {
    console.log(chalk.blue(`🔄 Exécution du hook post-generate: ${config.hooks.post_generate}`));
    try {
      await exec(`${config.hooks.post_generate} ${type} ${name} ${outputDir}`);
    } catch (error) {
      console.error(
        chalk.red(`Erreur lors de l'exécution du hook post-generate: ${error.message}`)
      );
    }
  }

  console.log(chalk.green(`✨ Génération des fichiers ${type} terminée avec succès!`));
  console.log(chalk.blue(`📁 Fichiers générés dans: ${outputDir}`));
}

// Mise à jour du journal d'activité
function updateGenerationLog(type, name, outputDir) {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'generation-activity.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] Generated ${type} "${name}" in ${outputDir}\n`;

  fs.appendFileSync(logFile, logEntry);
}

// Création du répertoire de templates par défaut
async function createTemplateDir(templateDir, type) {
  fs.mkdirSync(templateDir, { recursive: true });

  // Créer des templates par défaut selon le type
  switch (type) {
    case 'module':
      // Créer des templates minimaux pour un module
      fs.writeFileSync(
        path.join(templateDir, '[kebabName].module.ts.mustache'),
        `import { Module } from '@nestjs/common';
import { {{pascalName}}Service } from './{{kebabName}}.service';
import { {{pascalName}}Controller } from './{{kebabName}}.controller';

/**
 * Module {{pascalName}}
 * @generated from CahierDesCharges:Modules:{{pascalName}}
 * @see {{{cdcSection}}}
 */
@Module({
  providers: [{{pascalName}}Service],
  controllers: [{{pascalName}}Controller],
  exports: [{{pascalName}}Service],
})
export class {{pascalName}}Module {}`
      );

      fs.writeFileSync(
        path.join(templateDir, '[kebabName].service.ts.mustache'),
        `import { Injectable } from '@nestjs/common';

/**
 * Service {{pascalName}}
 * @generated from CahierDesCharges:Modules:{{pascalName}}
 * @see {{{cdcSection}}}
 */
@Injectable()
export class {{pascalName}}Service {
  // Implémentation du service
}`
      );

      fs.writeFileSync(
        path.join(templateDir, '[kebabName].controller.ts.mustache'),
        `import { Controller } from '@nestjs/common';
import { {{pascalName}}Service } from './{{kebabName}}.service';

/**
 * Contrôleur {{pascalName}}
 * @generated from CahierDesCharges:Modules:{{pascalName}}
 * @see {{{cdcSection}}}
 */
@Controller('{{kebabName}}')
export class {{pascalName}}Controller {
  constructor(private readonly {{camelName}}Service: {{pascalName}}Service) {}
  
  // Implémentation du contrôleur
}`
      );

      // Créer le répertoire pour les tests
      fs.mkdirSync(path.join(templateDir, 'tests'), { recursive: true });

      fs.writeFileSync(
        path.join(templateDir, 'tests', '[kebabName].service.spec.ts.mustache'),
        `import { Test, TestingModule } from '@nestjs/testing';
import { {{pascalName}}Service } from '../{{kebabName}}.service';

describe('{{pascalName}}Service', () => {
  let service: {{pascalName}}Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{{pascalName}}Service],
    }).compile();

    service = module.get<{{pascalName}}Service>({{pascalName}}Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});`
      );
      break;

    // Ajouter d'autres types selon les besoins
    case 'agent':
    case 'strategy':
    case 'workflow':
      fs.writeFileSync(
        path.join(templateDir, 'README.md.mustache'),
        `# {{pascalName}} {{type}}

## Description

{{description}}

## Usage

\`\`\`typescript
// Example usage
\`\`\`

## Generated

This file was automatically generated from the Cahier des Charges.
{{#cdcSection}}
See: {{{cdcSection}}}
{{/cdcSection}}
`
      );
      break;
  }

  console.log(chalk.green(`✅ Templates par défaut créés pour ${type}`));
}

// Exécution
generateTechnicalFiles().catch((error) => {
  console.error(chalk.red(`❌ Erreur lors de la génération des fichiers: ${error.message}`));
  process.exit(1);
});
