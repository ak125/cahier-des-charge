/**
 * Script pour corriger automatiquement les erreurs d'importation
 *
 * Ce script parcourt tous les fichiers TypeScript et corrige les erreurs
 * d'importation typiques identifiées par BiomeJS, notamment :
 * - Les chemins non entourés de guillemets
 * - Les chaînes "structure-agent" incorrectement ajoutées à la fin des chemins d'importation
 */

const fs = require('fs');
const _path = require('path');
const { glob } = require('glob');

async function main() {
  console.log('Recherche des fichiers TypeScript...');

  // Recherche tous les fichiers TypeScript dans le projet
  const files = await glob('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.git/**',
      'backups/**',
      'clean-structure-backups/**', // Ajout de ce dossier à ignorer
      '**/backup*/**', // Ignorer tous les dossiers de sauvegarde
      '**/legacy/**', // Ignorer les dossiers legacy
    ],
  });

  console.log(`${files.length} fichiers trouvés. Début de l'analyse et de la correction...`);

  let correctedFiles = 0;
  let errors = 0;

  for (const file of files) {
    try {
      // Lecture du fichier
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      let _wasModified = false;

      // Correction des importations avec regex plus robustes

      // 1. Correction des importations sans guillemets et avec "structure-agent"
      const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+([^"'`;]+)(["`']?);?/g;
      content = content.replace(importRegex, (match, importPath, quote) => {
        // Si le chemin ne contient pas de guillemets ou est malformé
        if (!quote || quote === '') {
          _wasModified = true;

          // Détection de "structure-agent" à la fin
          const structureAgentIndex = importPath.indexOf('structure-agent');
          if (structureAgentIndex > -1) {
            // Récupérer le chemin sans "structure-agent"
            const cleanPath = importPath.substring(0, structureAgentIndex);
            return `import ${match.split('from')[0].trim()} from '${cleanPath}';`;
          }
          return `import ${match.split('from')[0].trim()} from '${importPath}';`;
        }
        return match;
      });

      // 2. Correction spécifique pour les importations avec @workspaces/...
      const workspaceImportRegex =
        /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+@workspaces\/([^"'`;]+)(["`']?);?/g;
      content = content.replace(workspaceImportRegex, (match, importPath, _quote) => {
        _wasModified = true;

        // Détection de "structure-agent" à la fin
        const structureAgentIndex = importPath.indexOf('structure-agent');
        if (structureAgentIndex > -1) {
          // Récupérer le chemin sans "structure-agent"
          const cleanPath = importPath.substring(0, structureAgentIndex);
          return `import ${match.split('from')[0].trim()} from '@workspaces/${cleanPath}';`;
        }
        return `import ${match.split('from')[0].trim()} from '@workspaces/${importPath}';`;
      });

      // 3. Correction des exports sans guillemets
      const exportRegex = /export\s+(?:\*|\{[^}]+})\s+from\s+([^"'`;]+)(["`']?);?/g;
      content = content.replace(exportRegex, (match, exportPath, quote) => {
        // Si le chemin ne contient pas de guillemets
        if (!quote || quote === '') {
          _wasModified = true;

          // Détection de "structure-agent" à la fin
          const structureAgentIndex = exportPath.indexOf('structure-agent');
          if (structureAgentIndex > -1) {
            // Récupérer le chemin sans "structure-agent"
            const cleanPath = exportPath.substring(0, structureAgentIndex);
            return `export ${match.split('from')[0].trim()} from '${cleanPath}';`;
          }
          return `export ${match.split('from')[0].trim()} from '${exportPath}';`;
        }
        return match;
      });

      // 4. Correction plus agressive des importations malformatées comme "fs-extrastructure-agent"
      const badImportRegex = /import\s+(\w+)\s+from'\s+(\w+)structure-agent'/g;
      content = content.replace(badImportRegex, (_match, varName, libName) => {
        _wasModified = true;
        return `import ${varName} from '${libName}';`;
      });

      // 5. Correction des importations où le chemin contient "DoDot" (cela semble être un motif d'erreur courant)
      content = content.replace(/DoDot(\w+)'/g, (_match, name) => {
        _wasModified = true;
        return `${name}'`;
      });

      // Si le contenu a été modifié, sauvegarder le fichier
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        correctedFiles++;
        console.log(`✅ Corrigé: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la correction de ${file}:`, error);
      errors++;
    }
  }

  console.log(`
==== Résultats de la correction ====
Fichiers analysés: ${files.length}
Fichiers corrigés: ${correctedFiles}
Erreurs: ${errors}
====================================
`);
}

main().catch(console.error);
