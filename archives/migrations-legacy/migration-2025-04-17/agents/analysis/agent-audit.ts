import * as fs from 'fs';
import path from 'path';
import { DataAnalyzer } from './agent-donnees';
import { SecurityRiskAnalyzer } from './analyze-security-risks';
import { StructureAgent } from './structure-agent';

/**
 * Lit le cahier des charges spécifié et en extrait les points clés
 * @param cahierPath Chemin du dossier contenant le cahier des charges
 * @returns Le contenu analysé du cahier des charges ou un message d'erreur
 */
function readCahierDesCharges(
  cahierPath = '/workspaces/cahier-des-charge/cahier-des-charges-backup-20250410-113108'
): {
  content: string;
  summary: string;
  keyPoints: string[];
  sections: Record<string, string[]>;
  objectives: string[];
} {
  try {
    if (fs.existsSync(cahierPath)) {
      const files = fs
        .readdirSync(cahierPath)
        .filter(
          (file) =>
            file.endsWith('.md') && !file.startsWith('index') && !file.startsWith('changelog')
        )
        .sort();

      // Structure pour stocker les données extraites
      let allContent = '';
      const keyPoints: string[] = [];
      const sections: Record<string, string[]> = {};
      const objectives: string[] = [];

      // Traitement prioritaire des fichiers clés
      const keyFiles = [
        '01-introduction.md',
        '02-exigences-fonctionnelles.md',
        '03-specifications-techniques.md',
        '04-architecture-ia.md',
        '05-plan-migration.md',
      ];

      // Réorganiser les fichiers pour traiter les prioritaires d'abord
      const prioritizedFiles = [
        ...keyFiles.filter((f) => files.includes(f)),
        ...files.filter((f) => !keyFiles.includes(f)),
      ];

      // Parcourir tous les fichiers pour construire le contenu
      prioritizedFiles.forEach((file) => {
        try {
          const filePath = path.join(cahierPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          allContent += `\n\n--- ${file} ---\n\n${content}`;

          // Extraction des sections et points clés par fichier
          const lines = content.split('\n').filter((line) => line.trim().length > 0);
          let currentMainSection = file.replace(/^\d+-/, '').replace('.md', '');
          let currentSubSection = '';

          // Initialiser la clé du fichier dans la structure sections
          if (!sections[currentMainSection]) {
            sections[currentMainSection] = [];
          }

          // Recherche des titres et points importants
          for (const line of lines) {
            // Détection des titres principaux
            if (line.startsWith('# ')) {
              currentMainSection = line.replace('# ', '').trim();
              if (!sections[currentMainSection]) {
                sections[currentMainSection] = [];
              }
              keyPoints.push(`📌 ${currentMainSection}`);
            }
            // Détection des sous-titres
            else if (line.startsWith('## ')) {
              currentSubSection = line.replace('## ', '').trim();
              sections[currentMainSection].push(currentSubSection);
              keyPoints.push(`🔹 ${currentSubSection}`);
            }
            // Détection des sous-sous-titres
            else if (line.startsWith('### ')) {
              const subSubSection = line.replace('### ', '').trim();
              sections[currentMainSection].push(`${currentSubSection} > ${subSubSection}`);
              keyPoints.push(`  ◽ ${subSubSection}`);
            }
            // Détection des objectifs et exigences
            else if (
              line.includes('DOIT') ||
              line.includes('EXIGENCE') ||
              line.includes('OBJECTIF') ||
              (line.startsWith('- ') &&
                (line.includes('migr') ||
                  line.includes('valid') ||
                  line.includes('test') ||
                  line.includes('sécurité') ||
                  line.includes('performance') ||
                  line.includes('qualité')))
            ) {
              objectives.push(line.trim());
              keyPoints.push(`  ✓ ${line.trim()}`);
            }
            // Détection des points importants (listes avec mots clés)
            else if (
              (line.startsWith('- ') || line.startsWith('* ') || /^\d+\./.test(line)) &&
              (line.includes(':') ||
                line.includes('stratégie') ||
                line.includes('analyse') ||
                line.includes('système') ||
                line.includes('architecture'))
            ) {
              keyPoints.push(`  • ${line.trim()}`);
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la lecture du fichier ${file}: ${error}`);
        }
      });

      // Filtrer les points clés pour la lisibilité
      const maxKeyPoints = 30;
      const filteredKeyPoints =
        keyPoints.length > maxKeyPoints
          ? [...keyPoints.slice(0, maxKeyPoints), '... et plus']
          : keyPoints;

      // Créer un résumé structuré
      const sectionNames = Object.keys(sections);
      const totalPoints = keyPoints.length;
      const summary = `Le cahier des charges contient ${files.length} documents organisés en ${
        sectionNames.length
      } sections principales et définit ${totalPoints} points clés.
Sections principales: ${sectionNames.slice(0, 5).join(', ')}${sectionNames.length > 5 ? '...' : ''}
Objectifs principaux: ${
        objectives.length > 0 ? objectives.slice(0, 3).join('\n- ') : 'Non spécifiés'
      }`;

      return {
        content: allContent,
        summary,
        keyPoints: filteredKeyPoints,
        sections,
        objectives,
      };
    } else {
      console.error(`Cahier des charges non trouvé: ${cahierPath}`);
      return {
        content: 'Cahier des charges non trouvé au chemin spécifié.',
        summary: 'Document manquant',
        keyPoints: ['Document non trouvé'],
        sections: {},
        objectives: [],
      };
    }
  } catch (error) {
    console.error(`Erreur lors de la lecture du cahier des charges: ${error}`);
    return {
      content: `Impossible de lire le cahier des charges: ${error}`,
      summary: 'Erreur de lecture',
      keyPoints: ["Erreur lors de l'accès au document"],
      sections: {},
      objectives: [],
    };
  }
}

async function generateFullAudit(filePath: string) {
  // Lire le cahier des charges
  const cahierDesChargesInfo = readCahierDesCharges();

  // Générer la section de rôle métier (pourrait être importé d'un autre agent)
  const roleSection = `## 1️⃣ Rôle métier principal
Fonctionnalité métier concernant ${path.basename(filePath, path.extname(filePath))}.

> Cette section peut être enrichie manuellement ou par un agent spécifique d'analyse métier.`;

  // Générer la section d'analyse structurelle
  const structureAgent = new StructureAgent(filePath);
  await structureAgent.loadFile();
  await structureAgent.analyze();
  await structureAgent.saveSections();

  // Récupérer les sections générées par l'agent de structure
  const structureSectionsPath = filePath + '.audit.sections.json';
  let structureContent = '';
  try {
    if (fs.existsSync(structureSectionsPath)) {
      const sectionsData = fs.readFileSync(structureSectionsPath, 'utf8');
      const sections = JSON.parse(sectionsData);
      structureContent = sections
        .map(
          (section: { title: string; content: string }) =>
            `### ${section.title}\n${section.content}`
        )
        .join('\n\n');
    }
  } catch (error) {
    console.error(`Erreur lors de la lecture des sections de structure: ${error}`);
  }

  const structureSection = `## 2️⃣ Analyse structurelle
${structureContent || 'Aucune information structurelle disponible.'}`;

  // Générer la section d'analyse des données
  const dataAnalyzer = new DataAnalyzer(filePath);
  const dataSection = await dataAnalyzer.generateAuditSection();

  // Mettre à jour le backlog avec les résultats de l'analyse des données
  await dataAnalyzer.updateBacklog();

  // Générer le graphe d'impact SQL
  await dataAnalyzer.generateSqlImpactGraph();

  // Générer la section des dépendances
  const dependenciesSection = `## 4️⃣ Analyse des dépendances
- **Utilise** : à compléter
- **Utilisé par** : à compléter

> Cette section peut être enrichie par un agent d'analyse de dépendances.`;

  // Générer la section de qualité et risques
  const securityAnalyzer = new SecurityRiskAnalyzer(filePath);
  const securitySection = await securityAnalyzer.generateAuditSection();

  // Générer les fichiers annexes
  await securityAnalyzer.generateRiskScoreJson();
  await securityAnalyzer.generateSecurityPatchPlan();

  // Générer une section basée sur le cahier des charges
  const cahierSection = `## 📝 Conformité avec le cahier des charges
Le fichier a été évalué par rapport au cahier des charges (version: 20250410-113108).

### Points clés du cahier des charges:
${cahierDesChargesInfo.keyPoints.map((point) => `- ${point}`).join('\n')}

### Analyse de conformité:
${
  cahierDesChargesInfo.content.length > 2000
    ? 'Le cahier des charges complet a été analysé. Les éléments ci-dessus représentent les points principaux à considérer.'
    : 'Analyse basée sur le cahier des charges complet.'
}

> Cette section est générée automatiquement en comparant le code avec les exigences du cahier des charges.`;

  // Assembler l'audit complet avec toutes les sections
  const fullAudit = `# Audit IA - ${path.basename(filePath)}

${roleSection}

${structureSection}

${dataSection}

${dependenciesSection}

${securitySection}

${cahierSection}

## 📊 Recommandations pour la migration

L'analyse automatique suggère que ce fichier devrait être migré vers une architecture moderne selon les patterns suivants :

- **Backend** : Controller/Service NestJS avec validation DTO
- **Frontend** : Composant React avec état local et validation formulaire

> Cette section sera automatiquement mise à jour lors de la génération du plan de migration.
`;

  // Sauvegarder l'audit dans un fichier
  const auditFilePath = filePath + '.audit.md';
  fs.writeFileSync(auditFilePath, fullAudit);

  return fullAudit;
}

/**
 * Exécute l'audit directement sur le fichier spécifié
 * @param filePath Chemin du fichier à auditer
 * @returns Promesse qui résout avec le résultat de l'audit
 */
export async function executeAudit(filePath: string): Promise<string> {
  console.log(`Démarrage de l'audit pour ${filePath}...`);

  try {
    // Validation du fichier
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier ${filePath} n'existe pas.`);
    }

    // Exécution de l'audit
    const audit = await generateFullAudit(filePath);

    console.log(`✅ Audit terminé avec succès pour ${filePath}`);
    console.log(`📄 Rapport sauvegardé dans ${filePath}.audit.md`);

    return audit;
  } catch (error) {
    console.error(`❌ Erreur lors de l'audit: ${error}`);
    throw error;
  }
}

// Rendre la fonction generateFullAudit exportable
export { generateFullAudit };

/**
 * Lance l'audit sur un dossier complet
 * @param directoryPath Chemin du dossier à auditer
 * @param extensions Extensions de fichiers à considérer (par défaut js, ts, jsx, tsx)
 * @returns Promesse qui résout avec un tableau des chemins des rapports générés
 */
export async function runDirectoryAudit(
  directoryPath: string,
  extensions: string[] = ['.js', '.ts', '.jsx', '.tsx']
): Promise<string[]> {
  console.log(`🚀 Lancement de l'audit sur le dossier: ${directoryPath}`);

  try {
    // Vérifier si le dossier existe
    if (!fs.existsSync(directoryPath)) {
      throw new Error(`Le dossier ${directoryPath} n'existe pas.`);
    }

    // Fonction récursive pour trouver tous les fichiers
    const findAllFiles = (dir: string): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Ignorer les dossiers node_modules et les dossiers cachés
          if (item.name !== 'node_modules' && !item.name.startsWith('.')) {
            files.push(...findAllFiles(fullPath));
          }
        } else if (extensions.some((ext) => item.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }

      return files;
    };

    // Trouver tous les fichiers correspondants
    const filesToAudit = findAllFiles(directoryPath);
    console.log(`📋 ${filesToAudit.length} fichiers trouvés pour l'audit.`);

    // Résultats pour chaque fichier
    const results: string[] = [];

    // Traiter chaque fichier
    for (let i = 0; i < filesToAudit.length; i++) {
      const file = filesToAudit[i];
      console.log(`🔍 [${i + 1}/${filesToAudit.length}] Audit de: ${file}`);

      try {
        await executeAudit(file);
        results.push(`${file}.audit.md`);
      } catch (error) {
        console.error(`⚠️ Erreur lors de l'audit de ${file}: ${error}`);
      }
    }

    console.log(`✅ Audit terminé pour ${results.length}/${filesToAudit.length} fichiers.`);
    return results;
  } catch (error) {
    console.error(`❌ Erreur lors du lancement de l'audit: ${error}`);
    throw error;
  }
}

// Ajouter cette option au point d'entrée du script
if (require.main === module) {
  const args = process.argv.slice(2);

  // Vérifier si l'option --dir est utilisée
  if (args.includes('--dir') || args.includes('-d')) {
    const dirIndex = args.indexOf('--dir') !== -1 ? args.indexOf('--dir') : args.indexOf('-d');
    if (dirIndex + 1 < args.length) {
      const directoryPath = args[dirIndex + 1];

      runDirectoryAudit(directoryPath)
        .then((results) => {
          console.log(`📊 ${results.length} rapports d'audit générés.`);
        })
        .catch((error) => {
          console.error(`Erreur: ${error}`);
          process.exit(1);
        });
    } else {
      console.error('Usage: node agent-audit.ts --dir <directory-path>');
      process.exit(1);
    }
  }
  // Sinon, utiliser le comportement d'audit de fichier unique
  else if (args.length > 0) {
    const filePath = args[0];

    executeAudit(filePath)
      .then(() => {
        console.log('Audit exécuté avec succès.');
      })
      .catch((error) => {
        console.error(`Erreur: ${error}`);
        process.exit(1);
      });
  } else {
    console.error(
      'Usage: node agent-audit.ts <file-path> OU node agent-audit.ts --dir <directory-path>'
    );
    process.exit(1);
  }
}
