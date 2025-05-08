import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as glob from 'glob';

// Types pour l'agent
interface QaConfirmerContext {
  file?: string; // Fichier spécifique à traiter
  directory?: string; // Répertoire contenant les fichiers à traiter
  batchMode?: boolean; // Mode batch pour traiter tous les fichiers migrés
  includeNonVerified?: boolean; // Inclure les fichiers non encore vérifiés
  generateDashboard?: boolean; // Générer un tableau de bord global
  updateDiscoveryMap?: boolean; // Mettre à jour discovery_map.json avec l'état QA
  includeHtml?: boolean; // Générer également une version HTML
}

interface QaChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: 'technique' | 'champs' | 'tests' | 'seo' | 'accessibilite' | 'performance' | 'finale';
  importance: 'critical' | 'high' | 'medium' | 'low';
}

interface QaValidationResult {
  file: string;
  originalPhpFile: string;
  migrationScore: number; // De 0 à 5 étoiles
  status: 'verified' | 'divergent' | 'critical' | 'pending' | 'error' | 'in-review' | 'validated';
  lastAudit: string;
  lastVerification: string;
  qaCompletedBy?: string;
  qaCompletedDate?: string;
  agents: string[];
  migratedFiles: {
    backend?: string[];
    frontend?: string[];
  };
  checklist: QaChecklistItem[];
  missingFields: string[];
  missingRoutes: string[];
  missingEndpoints: string[];
  issues: string[];
  markdownPath: string;
  jsonPath: string;
}

interface QaDashboard {
  generatedDate: string;
  totalFiles: number;
  verifiedCount: number;
  divergentCount: number;
  criticalCount: number;
  pendingCount: number;
  inReviewCount: number;
  validatedCount: number;
  files: {
    [filename: string]: {
      status:
        | 'verified'
        | 'divergent'
        | 'critical'
        | 'pending'
        | 'error'
        | 'in-review'
        | 'validated';
      migrationScore: number;
      qaDate?: string;
      qaCompletedBy?: string;
      markdownPath: string;
    };
  };
}

/**
 * Agent de génération de fiches de validation QA
 * Produit une fiche lisible et vérifiable pour confirmer que la migration d'un module est complète
 */
export const qaConfirmerAgent = {
  name: 'qa-confirmer',
  description: 'Générateur de fiches de validation QA pour les modules migrés',

  async run(context: QaConfirmerContext) {
    const logs: string[] = [];
    let filesToProcess: string[] = [];

    try {
      logs.push(`🚀 Démarrage de l'agent de génération de fiches QA`);

      // Déterminer quels fichiers traiter
      if (context.file) {
        // Traiter un fichier spécifique
        const fullPath = this.resolvePhpFilePath(context.file);
        if (fs.existsSync(fullPath)) {
          filesToProcess = [fullPath];
          logs.push(`📄 Fichier à traiter: ${fullPath}`);
        } else {
          logs.push(`❌ Fichier non trouvé: ${fullPath}`);
          return { status: 'error', logs, error: `Fichier non trouvé: ${fullPath}` };
        }
      } else if (context.directory) {
        // Traiter tous les fichiers dans un répertoire
        const dirPath = this.resolvePhpFilePath(context.directory);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          const phpFiles = glob.sync(path.join(dirPath, '**/*.php'));
          filesToProcess = phpFiles;
          logs.push(`📁 Dossier à traiter: ${dirPath} (${phpFiles.length} fichiers PHP trouvés)`);
        } else {
          logs.push(`❌ Dossier non trouvé: ${dirPath}`);
          return { status: 'error', logs, error: `Dossier non trouvé: ${dirPath}` };
        }
      } else if (context.batchMode) {
        // Traiter tous les fichiers migres
        const verifierIndex = this.loadVerifierIndex();
        const fileEntries = Object.entries(verifierIndex.files);

        // Filtrer selon les critères
        filesToProcess = fileEntries
          .filter(([fileBase, fileInfo]) => {
            // Si includeNonVerified est false, ne prendre que les fichiers vérifiés
            if (!context.includeNonVerified && fileInfo.status !== 'verified') {
              return false;
            }

            // Trouver le fichier PHP original
            const originalPhpFile = this.findOriginalPhpFile(fileBase);
            return !!originalPhpFile;
          })
          .map(([fileBase, _]) => {
            const originalPhpFile = this.findOriginalPhpFile(fileBase);
            return originalPhpFile as string;
          });

        logs.push(`🔍 Mode batch: ${filesToProcess.length} fichiers PHP à traiter`);
      } else {
        logs.push(
          `❓ Aucun fichier ou dossier spécifié, veuillez fournir un fichier, un dossier ou activer le mode batch`
        );
        return { status: 'error', logs, error: 'Aucun fichier ou dossier spécifié' };
      }

      if (filesToProcess.length === 0) {
        logs.push(`✅ Aucun fichier à traiter`);
        return { status: 'success', logs, message: 'Aucun fichier à traiter' };
      }

      // Préparation pour stocker tous les résultats
      const results: QaValidationResult[] = [];
      let verifiedCount = 0;
      let divergentCount = 0;
      let criticalCount = 0;
      let pendingCount = 0;
      let inReviewCount = 0;

      // Traitement de chaque fichier
      for (const phpFile of filesToProcess) {
        logs.push(`\n🔍 Génération de la fiche QA pour: ${phpFile}`);

        try {
          const result = await this.generateQaChecklist(phpFile, logs);
          results.push(result);

          // Mise à jour des compteurs
          if (result.status === 'verified') verifiedCount++;
          else if (result.status === 'divergent') divergentCount++;
          else if (result.status === 'critical') criticalCount++;
          else if (result.status === 'pending') pendingCount++;
          else if (result.status === 'in-review') inReviewCount++;

          // Écriture de la fiche QA
          this.saveQaFile(result);
          logs.push(`📝 Fiche QA générée: ${result.markdownPath}`);

          // Mise à jour du discovery_map.json si demandé
          if (context.updateDiscoveryMap) {
            this.updateDiscoveryMap(result, logs);
          }
        } catch (err: any) {
          logs.push(`❌ Erreur lors de la génération pour ${phpFile}: ${err.message}`);
        }
      }

      // Générer le tableau de bord QA si demandé
      if (context.generateDashboard) {
        this.generateQaDashboard(results, logs);
      }

      logs.push(`\n📊 Résumé de la génération des fiches QA:`);
      logs.push(`   ✅ Vérifiés: ${verifiedCount}`);
      logs.push(`   ⚠️ Divergents: ${divergentCount}`);
      logs.push(`   🔴 Critiques: ${criticalCount}`);
      logs.push(`   ⏳ En attente: ${pendingCount}`);
      logs.push(`   🔍 En revue: ${inReviewCount}`);

      return {
        status: 'success',
        logs,
        summary: {
          total: filesToProcess.length,
          verified: verifiedCount,
          divergent: divergentCount,
          critical: criticalCount,
          pending: pendingCount,
          inReview: inReviewCount,
        },
        results,
      };
    } catch (err: any) {
      logs.push(`❌ Erreur générale: ${err.message}`);
      return { status: 'error', logs, error: err.message };
    }
  },

  /**
   * Résout le chemin complet d'un fichier PHP
   */
  resolvePhpFilePath(filePath: string): string {
    // Si le chemin est déjà absolu, le retourner tel quel
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    // Si le chemin commence par src/, app/, etc., considérer qu'il est relatif à la racine du projet
    if (filePath.startsWith('src/') || filePath.startsWith('app/')) {
      return path.resolve(filePath);
    }

    // Si c'est juste un nom de fichier, essayer de le trouver dans les emplacements standard
    if (!filePath.includes('/')) {
      const potentialLocations = [
        path.resolve('src', filePath),
        path.resolve('app', filePath),
        path.resolve('app/legacy', filePath),
      ];

      for (const location of potentialLocations) {
        if (fs.existsSync(location)) {
          return location;
        }
      }
    }

    // Sinon, considérer le chemin comme relatif au répertoire courant
    return path.resolve(filePath);
  },

  /**
   * Trouve le fichier PHP original à partir du nom de base
   */
  findOriginalPhpFile(fileBase: string): string | null {
    const potentialLocations = [
      path.resolve('src', `${fileBase}.php`),
      path.resolve('app', `${fileBase}.php`),
      path.resolve('app/legacy', `${fileBase}.php`),
    ];

    for (const location of potentialLocations) {
      if (fs.existsSync(location)) {
        return location;
      }
    }

    return null;
  },

  /**
   * Charge l'index des vérifications
   */
  loadVerifierIndex(): any {
    const indexPath = path.resolve('reports', 'verifier_index.json');

    if (fs.existsSync(indexPath)) {
      try {
        return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      } catch (err) {
        // En cas d'erreur, créer un nouvel index
        return { files: {} };
      }
    }

    return { files: {} };
  },

  /**
   * Génère une checklist QA pour un fichier PHP
   */
  async generateQaChecklist(phpFile: string, logs: string[]): Promise<QaValidationResult> {
    const fileBase = path.basename(phpFile, '.php');

    // Créer la structure de résultat
    const result: QaValidationResult = {
      file: fileBase,
      originalPhpFile: phpFile,
      migrationScore: 0,
      status: 'pending',
      lastAudit: '',
      lastVerification: '',
      agents: [],
      migratedFiles: {
        backend: [],
        frontend: [],
      },
      checklist: [],
      missingFields: [],
      missingRoutes: [],
      missingEndpoints: [],
      issues: [],
      markdownPath: path.resolve('reports', 'qa', `${fileBase}.qa.md`),
      jsonPath: path.resolve('reports', 'qa', `${fileBase}.qa.json`),
    };

    try {
      // 1. Lecture des audits existants
      const auditPath = path.resolve('audit', `${fileBase}.audit.md`);

      if (fs.existsSync(auditPath)) {
        const auditContent = fs.readFileSync(auditPath, 'utf-8');
        const auditDateMatch = auditContent.match(/Date: ([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        if (auditDateMatch) {
          result.lastAudit = auditDateMatch[1];
        } else {
          // Utiliser la date de modification du fichier
          const stats = fs.statSync(auditPath);
          result.lastAudit = stats.mtime.toISOString().split('T')[0];
        }

        // Extraire les agents mentionnés dans l'audit
        const agentsMatch = auditContent.match(/Agents?: ([a-zA-Z0-9-_,\s]+)/);
        if (agentsMatch) {
          result.agents = agentsMatch[1].split(/,\s*/).map((a) => a.trim());
        }

        logs.push(`📄 Fichier d'audit trouvé: ${auditPath}`);
      } else {
        logs.push(`⚠️ Fichier d'audit non trouvé: ${auditPath}`);
      }

      // 2. Lecture du rapport de vérification
      const verificationReportPath = path.resolve('audit', `${fileBase}.verification_report.json`);

      if (fs.existsSync(verificationReportPath)) {
        const verificationReport = JSON.parse(fs.readFileSync(verificationReportPath, 'utf-8'));

        result.status = verificationReport.status;
        result.lastVerification = verificationReport.verifiedDate?.split('T')[0] || '';
        result.migratedFiles = verificationReport.migratedFiles || { backend: [], frontend: [] };
        result.missingFields = verificationReport.missingFields || [];
        result.missingRoutes = verificationReport.missingRoutes || [];
        result.missingEndpoints = verificationReport.missingEndpoints || [];

        // Ajouter 'DiffVerifier' aux agents s'il n'est pas déjà présent
        if (!result.agents.includes('DiffVerifier')) {
          result.agents.push('DiffVerifier');
        }

        logs.push(`📄 Rapport de vérification trouvé: ${verificationReportPath}`);
      } else {
        logs.push(`⚠️ Rapport de vérification non trouvé: ${verificationReportPath}`);
      }

      // 3. Lecture du backlog
      const backlogPath = path.resolve('reports', 'analysis', `${fileBase}.backlog.json`);

      if (fs.existsSync(backlogPath)) {
        const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf-8'));

        // Ajouter les problèmes du backlog s'ils ne sont pas déjà présents
        backlog.tasks?.forEach((task: any) => {
          if (task.details) {
            if (task.type === 'fields' && task.details.fields) {
              task.details.fields.forEach((field: string) => {
                if (!result.missingFields.includes(field)) {
                  result.missingFields.push(field);
                }
              });
            } else if (task.type === 'routes' && task.details.routes) {
              task.details.routes.forEach((route: string) => {
                if (!result.missingRoutes.includes(route)) {
                  result.missingRoutes.push(route);
                }
              });
            } else if (task.type === 'endpoints' && task.details.endpoints) {
              task.details.endpoints.forEach((endpoint: string) => {
                if (!result.missingEndpoints.includes(endpoint)) {
                  result.missingEndpoints.push(endpoint);
                }
              });
            }
          }

          // Ajouter une description du problème s'il y en a une
          if (task.description && !result.issues.includes(task.description)) {
            result.issues.push(task.description);
          }
        });

        logs.push(`📄 Backlog trouvé: ${backlogPath}`);
      } else {
        logs.push(`ℹ️ Aucun backlog trouvé pour ${fileBase}`);
      }

      // 4. Générer la checklist technique
      result.checklist = this.generateChecklist(result);

      // 5. Calculer le score de migration
      result.migrationScore = this.calculateMigrationScore(result);

      // 6. Si le statut est 'verified' mais qu'il y a des problèmes, mettre en 'in-review'
      if (
        result.status === 'verified' &&
        (result.missingFields.length > 0 ||
          result.missingRoutes.length > 0 ||
          result.missingEndpoints.length > 0 ||
          result.issues.length > 0)
      ) {
        result.status = 'in-review';
      }

      return result;
    } catch (err: any) {
      logs.push(`❌ Erreur durant l'analyse : ${err.message}`);
      result.status = 'error';
      result.issues.push(`Erreur durant l'analyse : ${err.message}`);
      return result;
    }
  },

  /**
   * Génère une checklist pour un module
   */
  generateChecklist(result: QaValidationResult): QaChecklistItem[] {
    const checklist: QaChecklistItem[] = [];

    // 1. Vérifications techniques
    checklist.push({
      id: 'frontend-file',
      label: `Le fichier est présent dans \`apps/frontend/app/routes/${result.file}.tsx\``,
      checked:
        result.migratedFiles.frontend?.some((f) => f.includes(`${result.file}.tsx`)) || false,
      category: 'technique',
      importance: 'critical',
    });

    checklist.push({
      id: 'remix-loader',
      label: 'Le loader Remix est implémenté (`useLoaderData`)',
      checked:
        result.migratedFiles.frontend?.some((f) => {
          if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf-8');
            return content.includes('useLoaderData');
          }
          return false;
        }) || false,
      category: 'technique',
      importance: 'high',
    });

    checklist.push({
      id: 'nestjs-service',
      label: `Le service NestJS associé existe (\`${this.capitalizeFirstLetter(
        result.file
      )}Service\`)`,
      checked: result.migratedFiles.backend?.some((f) => f.includes('.service.ts')) || false,
      category: 'technique',
      importance: 'high',
    });

    checklist.push({
      id: 'prisma-types',
      label: 'Les types Prisma sont correctement alignés',
      checked:
        result.migratedFiles.backend?.some((f) => {
          if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf-8');
            return content.includes('prisma') || content.includes('PrismaClient');
          }
          return false;
        }) || false,
      category: 'technique',
      importance: 'medium',
    });

    checklist.push({
      id: 'all-fields',
      label: 'Tous les champs sont repris',
      checked: result.missingFields.length === 0,
      category: 'technique',
      importance: 'high',
    });

    // 2. Tests
    checklist.push({
      id: 'unit-tests',
      label: 'Tests unitaires du service NestJS générés',
      checked: this.checkIfTestsExist(result.file, 'unit'),
      category: 'tests',
      importance: 'high',
    });

    checklist.push({
      id: 'e2e-tests',
      label: 'Tests end-to-end Playwright OK',
      checked: this.checkIfTestsExist(result.file, 'e2e'),
      category: 'tests',
      importance: 'medium',
    });

    // 3. SEO
    checklist.push({
      id: 'seo-title',
      label: '`<title>` dynamique',
      checked:
        result.migratedFiles.frontend?.some((f) => {
          if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf-8');
            return content.includes('<title>') || content.includes('useTitle');
          }
          return false;
        }) || false,
      category: 'seo',
      importance: 'high',
    });

    checklist.push({
      id: 'seo-description',
      label: '`<meta name="description">` généré',
      checked:
        result.migratedFiles.frontend?.some((f) => {
          if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf-8');
            return (
              content.includes('meta name="description"') || content.includes('useDescription')
            );
          }
          return false;
        }) || false,
      category: 'seo',
      importance: 'high',
    });

    checklist.push({
      id: 'seo-canonical',
      label: '`<link rel="canonical">` défini',
      checked:
        result.migratedFiles.frontend?.some((f) => {
          if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf-8');
            return content.includes('rel="canonical"');
          }
          return false;
        }) || false,
      category: 'seo',
      importance: 'medium',
    });

    checklist.push({
      id: 'lighthouse',
      label: 'Analyse Lighthouse > 90%',
      checked: false, // Nécessite une vérification manuelle
      category: 'seo',
      importance: 'low',
    });

    // 4. Accessibilité
    checklist.push({
      id: 'a11y-semantic',
      label: 'Structure sémantique correcte (headings, landmarks)',
      checked: false, // Nécessite une vérification manuelle
      category: 'accessibilite',
      importance: 'medium',
    });

    // 5. Performance
    checklist.push({
      id: 'perf-bundle',
      label: 'Optimisation du bundle JS/CSS',
      checked: false, // Nécessite une vérification manuelle
      category: 'performance',
      importance: 'low',
    });

    // 6. Actions finales
    checklist.push({
      id: 'qa-validated',
      label: 'Ce fichier peut-il être marqué comme **"validé pour production"** ?',
      checked: false,
      category: 'finale',
      importance: 'critical',
    });

    // 7. Ajouter une entrée pour chaque champ manquant
    result.missingFields.forEach((field) => {
      checklist.push({
        id: `field-${field}`,
        label: field,
        checked: false,
        category: 'champs',
        importance: 'high',
      });
    });

    return checklist;
  },

  /**
   * Vérifie si des tests existent pour un module
   */
  checkIfTestsExist(fileBase: string, testType: 'unit' | 'e2e'): boolean {
    if (testType === 'unit') {
      const serviceName = `${this.capitalizeFirstLetter(fileBase)}Service`;
      const testPaths = [
        path.resolve('apps/backend/src/**', `${fileBase}.service.spec.ts`),
        path.resolve('apps/backend/test/unit', `${fileBase}.spec.ts`),
        path.resolve('apps/backend/test/unit', `${serviceName}.spec.ts`),
      ];

      for (const testPath of testPaths) {
        const testFiles = glob.sync(testPath);
        if (testFiles.length > 0) return true;
      }
    } else if (testType === 'e2e') {
      const testPaths = [
        path.resolve('apps/frontend/cypress/e2e', `${fileBase}.spec.ts`),
        path.resolve('apps/frontend/playwright/tests', `${fileBase}.spec.ts`),
        path.resolve('e2e/**', `${fileBase}.spec.ts`),
      ];

      for (const testPath of testPaths) {
        const testFiles = glob.sync(testPath);
        if (testFiles.length > 0) return true;
      }
    }

    return false;
  },

  /**
   * Calcule un score de migration
   */
  calculateMigrationScore(result: QaValidationResult): number {
    let score = 0;

    // Base: 1 étoile pour avoir migré le fichier
    if (result.migratedFiles.frontend?.length || result.migratedFiles.backend?.length) {
      score += 1;
    }

    // +1 étoile si le frontend existe
    if (result.migratedFiles.frontend?.length) {
      score += 1;
    }

    // +1 étoile si le backend existe
    if (result.migratedFiles.backend?.length) {
      score += 1;
    }

    // +1 étoile si pas de champs manquants
    if (result.missingFields.length === 0) {
      score += 1;
    }

    // +1 étoile si les tests existent
    if (this.checkIfTestsExist(result.file, 'unit') || this.checkIfTestsExist(result.file, 'e2e')) {
      score += 1;
    }

    // Limiter le score à 5
    return Math.min(score, 5);
  },

  /**
   * Sauvegarde la fiche QA (Markdown et JSON)
   */
  saveQaFile(result: QaValidationResult): void {
    const qaDir = path.dirname(result.markdownPath);

    if (!fs.existsSync(qaDir)) {
      fs.mkdirSync(qaDir, { recursive: true });
    }

    // Générer le contenu Markdown
    const markdownContent = this.generateMarkdownContent(result);
    fs.writeFileSync(result.markdownPath, markdownContent);

    // Générer le contenu JSON
    const jsonContent = this.generateJsonContent(result);
    fs.writeFileSync(result.jsonPath, JSON.stringify(jsonContent, null, 2));
  },

  /**
   * Génère le contenu Markdown pour la fiche QA
   */
  generateMarkdownContent(result: QaValidationResult): string {
    // Convertir le statut en emoji
    const statusEmoji =
      {
        verified: '✅ Vérifié',
        divergent: '⚠️ Divergent',
        critical: '🔴 Critique',
        pending: '⏳ En attente',
        error: '❌ Erreur',
        'in-review': '🔍 En revue',
        validated: '✅ Validé',
      }[result.status] || '❓ Inconnu';

    // Convertir le score en étoiles
    const scoreStars = '⭐'.repeat(result.migrationScore) + '☆'.repeat(5 - result.migrationScore);

    let markdown = `# ✅ QA Checklist – Migration du fichier \`${result.file}.php\`\n\n`;

    // Section Résumé
    markdown += `## 🔍 Résumé\n`;
    markdown += `- Fichier source : \`${result.originalPhpFile}\`\n`;
    markdown += `- Score de migration : ${scoreStars}\n`;
    markdown += `- Status de vérification : ${statusEmoji}\n`;

    if (result.lastAudit) {
      markdown += `- Dernier audit : ${result.lastAudit}\n`;
    }

    if (result.lastVerification) {
      markdown += `- Dernière vérification : ${result.lastVerification}\n`;
    }

    if (result.agents.length > 0) {
      markdown += `- Agents IA : ${result.agents.map((a) => `\`${a}\``).join(', ')}\n`;
    }

    markdown += `\n---\n\n`;

    // Section Technique
    markdown += `## ✅ Checklist Technique\n\n`;
    const techniqueItems = result.checklist.filter((item) => item.category === 'technique');
    for (const item of techniqueItems) {
      markdown += `- [${item.checked ? 'x' : ' '}] ${item.label}\n`;
    }

    markdown += `\n---\n\n`;

    // Section Champs manquants (si applicable)
    if (result.missingFields.length > 0) {
      markdown += `## 🧠 Champs manquants détectés\n\n`;

      const champItems = result.checklist.filter((item) => item.category === 'champs');
      for (const item of champItems) {
        markdown += `- [${item.checked ? 'x' : ' '}] \`${item.label}\`\n`;
      }

      markdown += `> Ces champs doivent être ajoutés dans la réponse du loader ou le modèle Prisma\n\n`;
      markdown += `---\n\n`;
    }

    // Section Tests
    markdown += `## 🧪 Tests\n\n`;
    const testItems = result.checklist.filter((item) => item.category === 'tests');
    for (const item of testItems) {
      markdown += `- [${item.checked ? 'x' : ' '}] ${item.label}\n`;
    }

    markdown += `\n---\n\n`;

    // Section SEO
    markdown += `## 🔗 SEO & Métadonnées\n\n`;
    const seoItems = result.checklist.filter((item) => item.category === 'seo');
    for (const item of seoItems) {
      markdown += `- [${item.checked ? 'x' : ' '}] ${item.label}\n`;
    }

    markdown += `\n---\n\n`;

    // Section Accessibilité (si présente)
    const a11yItems = result.checklist.filter((item) => item.category === 'accessibilite');
    if (a11yItems.length > 0) {
      markdown += `## ♿ Accessibilité\n\n`;
      for (const item of a11yItems) {
        markdown += `- [${item.checked ? 'x' : ' '}] ${item.label}\n`;
      }
      markdown += `\n---\n\n`;
    }

    // Section Performance (si présente)
    const perfItems = result.checklist.filter((item) => item.category === 'performance');
    if (perfItems.length > 0) {
      markdown += `## ⚡ Performance\n\n`;
      for (const item of perfItems) {
        markdown += `- [${item.checked ? 'x' : ' '}] ${item.label}\n`;
      }
      markdown += `\n---\n\n`;
    }

    // Section Problèmes (si applicable)
    if (result.issues.length > 0) {
      markdown += `## ⚠️ Problèmes détectés\n\n`;
      for (const issue of result.issues) {
        markdown += `- ${issue}\n`;
      }
      markdown += `\n---\n\n`;
    }

    // Section Action finale
    markdown += `## ✅ Action finale\n\n`;
    const finaleItems = result.checklist.filter((item) => item.category === 'finale');
    for (const item of finaleItems) {
      markdown += `> [ ] ${item.label}\n`;
    }

    return markdown;
  },

  /**
   * Génère le contenu JSON pour la fiche QA
   */
  generateJsonContent(result: QaValidationResult): any {
    return {
      file: result.file,
      originalPhpFile: result.originalPhpFile,
      status: result.status,
      migrationScore: result.migrationScore,
      lastAudit: result.lastAudit,
      lastVerification: result.lastVerification,
      agents: result.agents,
      checklist: Object.fromEntries(result.checklist.map((item) => [item.id, item.checked])),
      missingFields: result.missingFields,
      missingRoutes: result.missingRoutes,
      missingEndpoints: result.missingEndpoints,
      issues: result.issues,
      migratedFiles: {
        backend: result.migratedFiles.backend,
        frontend: result.migratedFiles.frontend,
      },
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Génère un tableau de bord QA global
   */
  generateQaDashboard(results: QaValidationResult[], logs: string[]): void {
    const dashboardPath = path.resolve('reports', 'qa', 'qa-dashboard.md');
    const dashboardJsonPath = path.resolve('reports', 'qa', 'qa-dashboard.json');

    // Créer le répertoire si nécessaire
    const dashboardDir = path.dirname(dashboardPath);
    if (!fs.existsSync(dashboardDir)) {
      fs.mkdirSync(dashboardDir, { recursive: true });
    }

    // Préparer les données du tableau de bord
    const dashboard: QaDashboard = {
      generatedDate: new Date().toISOString(),
      totalFiles: results.length,
      verifiedCount: results.filter((r) => r.status === 'verified').length,
      divergentCount: results.filter((r) => r.status === 'divergent').length,
      criticalCount: results.filter((r) => r.status === 'critical').length,
      pendingCount: results.filter((r) => r.status === 'pending').length,
      inReviewCount: results.filter((r) => r.status === 'in-review').length,
      validatedCount: results.filter((r) => r.status === 'validated').length,
      files: {},
    };

    // Remplir les détails des fichiers
    for (const result of results) {
      dashboard.files[result.file] = {
        status: result.status,
        migrationScore: result.migrationScore,
        qaDate: result.qaCompletedDate,
        qaCompletedBy: result.qaCompletedBy,
        markdownPath: path.relative(process.cwd(), result.markdownPath),
      };
    }

    // Générer le contenu Markdown
    let markdown = `# 📊 Tableau de bord QA - Migration PHP vers Remix/NestJS\n\n`;

    // Date de génération
    markdown += `> Généré le ${new Date().toLocaleString()}\n\n`;

    // Section Résumé
    markdown += `## 🔍 Résumé\n\n`;
    markdown += `| Métrique | Valeur |\n`;
    markdown += `| --- | --- |\n`;
    markdown += `| Total des fichiers | ${dashboard.totalFiles} |\n`;
    markdown += `| ✅ Vérifiés | ${dashboard.verifiedCount} |\n`;
    markdown += `| ⚠️ Divergents | ${dashboard.divergentCount} |\n`;
    markdown += `| 🔴 Critiques | ${dashboard.criticalCount} |\n`;
    markdown += `| ⏳ En attente | ${dashboard.pendingCount} |\n`;
    markdown += `| 🔍 En revue | ${dashboard.inReviewCount} |\n`;
    markdown += `| ✓ Validés | ${dashboard.validatedCount} |\n`;

    // Calculer le pourcentage global
    const completionPercent =
      dashboard.totalFiles > 0
        ? Math.round(
            ((dashboard.verifiedCount + dashboard.validatedCount) / dashboard.totalFiles) * 100
          )
        : 0;

    markdown += `| **Progression globale** | **${completionPercent}%** |\n\n`;

    // Section graphique (représentation textuelle)
    markdown += `\`\`\`\n`;
    markdown += `Progression: [${'#'.repeat(Math.floor(completionPercent / 5))}${' '.repeat(
      20 - Math.floor(completionPercent / 5)
    )}] ${completionPercent}%\n`;
    markdown += `\`\`\`\n\n`;

    // Section Liste des fichiers
    markdown += `## 📁 Statut par fichier\n\n`;
    markdown += `| Fichier | Status | Score | Dernière mise à jour | Actions |\n`;
    markdown += `| --- | --- | --- | --- | --- |\n`;

    // Trier les résultats par statut puis par nom de fichier
    const sortedResults = [...results].sort((a, b) => {
      const statusPriority: { [key: string]: number } = {
        critical: 0,
        divergent: 1,
        'in-review': 2,
        pending: 3,
        verified: 4,
        validated: 5,
        error: 6,
      };

      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.file.localeCompare(b.file);
    });

    for (const result of sortedResults) {
      const statusEmoji =
        {
          verified: '✅',
          divergent: '⚠️',
          critical: '🔴',
          pending: '⏳',
          error: '❌',
          'in-review': '🔍',
          validated: '✓',
        }[result.status] || '❓';

      const score = '⭐'.repeat(result.migrationScore);
      const relativePath = path.relative(process.cwd(), result.markdownPath);
      const lastUpdate = result.lastVerification || result.lastAudit || 'N/A';

      markdown += `| ${result.file}.php | ${statusEmoji} ${result.status} | ${score} | ${lastUpdate} | [Voir fiche](${relativePath}) |\n`;
    }

    // Section Problèmes prioritaires
    const criticalResults = results.filter((r) => r.status === 'critical');
    if (criticalResults.length > 0) {
      markdown += `\n## 🚨 Problèmes prioritaires\n\n`;

      for (const result of criticalResults) {
        markdown += `### ${result.file}.php\n\n`;

        if (result.issues.length > 0) {
          for (const issue of result.issues) {
            markdown += `- ${issue}\n`;
          }
        } else {
          markdown += `- Problèmes critiques détectés, voir [la fiche complète](${path.relative(
            process.cwd(),
            result.markdownPath
          )})\n`;
        }

        markdown += `\n`;
      }
    }

    // Enregistrer le tableau de bord
    fs.writeFileSync(dashboardPath, markdown);
    fs.writeFileSync(dashboardJsonPath, JSON.stringify(dashboard, null, 2));

    logs.push(`📊 Tableau de bord QA généré: ${dashboardPath}`);
  },

  /**
   * Met à jour discovery_map.json avec l'état QA
   */
  updateDiscoveryMap(result: QaValidationResult, logs: string[]): void {
    const discoveryMapPath = path.resolve('reports', 'discovery_map.json');

    if (!fs.existsSync(discoveryMapPath)) {
      logs.push(
        `⚠️ Fichier discovery_map.json non trouvé, impossible de mettre à jour le statut QA`
      );
      return;
    }

    try {
      const discoveryMap = JSON.parse(fs.readFileSync(discoveryMapPath, 'utf-8'));

      // Chercher l'entrée correspondante dans le discovery_map
      const entries = discoveryMap.entries || [];
      const fileBase = path.basename(result.file, '.php');

      let updated = false;
      for (const entry of entries) {
        if (entry.filename === `${fileBase}.php` || entry.id === fileBase) {
          entry.qaStatus = result.status;
          entry.qaDate = new Date().toISOString();
          entry.migrationScore = result.migrationScore;
          updated = true;
          break;
        }
      }

      if (updated) {
        fs.writeFileSync(discoveryMapPath, JSON.stringify(discoveryMap, null, 2));
        logs.push(`✅ Statut QA mis à jour dans discovery_map.json pour ${fileBase}`);
      } else {
        logs.push(`⚠️ Entrée non trouvée dans discovery_map.json pour ${fileBase}`);
      }
    } catch (err: any) {
      logs.push(`❌ Erreur lors de la mise à jour du discovery_map.json: ${err.message}`);
    }
  },

  /**
   * Utilitaire pour capitaliser la première lettre d'une chaîne
   */
  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
};

// Si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  let contextArg = '{}';

  // Vérifier si un argument JSON est fourni
  if (args.length > 0 && (args[0].startsWith('{') || args[0].startsWith('{'))) {
    contextArg = args[0];
  } else {
    // Sinon, traiter les arguments de ligne de commande
    const context: QaConfirmerContext = {};

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--file' && i + 1 < args.length) {
        context.file = args[i + 1];
        i++;
      } else if (args[i] === '--dir' && i + 1 < args.length) {
        context.directory = args[i + 1];
        i++;
      } else if (args[i] === '--batch') {
        context.batchMode = true;
      } else if (args[i] === '--include-non-verified') {
        context.includeNonVerified = true;
      } else if (args[i] === '--dashboard') {
        context.generateDashboard = true;
      } else if (args[i] === '--update-discovery') {
        context.updateDiscoveryMap = true;
      } else if (args[i] === '--html') {
        context.includeHtml = true;
      }
    }

    contextArg = JSON.stringify(context);
  }

  try {
    const context = JSON.parse(contextArg);

    qaConfirmerAgent
      .run(context)
      .then((result) => {
        if (result.logs) {
          console.log(result.logs.join('\n'));
        }
        process.exit(result.status === 'success' ? 0 : 1);
      })
      .catch((error) => {
        console.error('Erreur:', error);
        process.exit(1);
      });
  } catch (err) {
    console.error('Erreur lors du parsing des arguments JSON:', err);
    process.exit(1);
  }
}
