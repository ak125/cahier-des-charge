import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as glob from 'glob';

// Types pour l'agent
interface ConsolidatorContext {
  file?: string;                   // Fichier spécifique à traiter
  directory?: string;              // Répertoire contenant les fichiers à traiter
  batchMode?: boolean;             // Mode batch pour traiter tous les fichiers vérifiés
  outputDir?: string;              // Répertoire de sortie (par défaut: migrations/finales/)
  commitToGit?: boolean;           // Soumettre les rapports finaux à Git
  createPullRequest?: boolean;     // Créer une Pull Request sur GitHub
  exportHtml?: boolean;            // Générer également des versions HTML
  exportToDashboard?: boolean;     // Exporter les données vers le dashboard
}

interface ConsolidationResult {
  file: string;
  originalPhpFile: string;
  finalReportPath: string;
  htmlReportPath?: string;
  status: 'success' | 'incomplete' | 'error';
  validationLevel: 'full' | 'partial' | 'minimal' | 'none';
  missingDocuments: string[];
  technicalSummary: {
    remixLoader: boolean;
    nestjsService: boolean;
    prismaModel: boolean;
    apiRoutes: boolean;
    testsExist: boolean;
    seoMeta: boolean;
  };
  tasksSummary: {
    total: number;
    completed: number;
    pending: number;
  };
  qaStatus: string;
  migrationScore: number;
  signedBy?: string;
  commitSha?: string;
}

/**
 * Agent de consolidation finale des rapports de migration
 * Fusionne les données d'analyse, QA, backlog et impact pour produire un document final
 */
export const consolidatorAgent = {
  name: 'consolidator',
  description: 'Générateur de rapport de migration final',
  
  async run(context: ConsolidatorContext) {
    const logs: string[] = [];
    let filesToProcess: string[] = [];
    
    try {
      logs.push(`🚀 Démarrage de l'agent de consolidation de rapports de migration`);
      
      // Déterminer le répertoire de sortie
      const outputDir = context.outputDir || path.resolve('migrations', 'finales');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        logs.push(`📁 Création du répertoire de sortie: ${outputDir}`);
      }
      
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
        // Traiter tous les fichiers vérifiés
        const verifierIndex = this.loadVerifierIndex();
        const fileEntries = Object.entries(verifierIndex.files);
        
        // Ne prendre que les fichiers vérifiés ou validés
        filesToProcess = fileEntries
          .filter(([_, fileInfo]) => fileInfo.status === 'verified')
          .map(([fileBase, _]) => {
            const originalPhpFile = this.findOriginalPhpFile(fileBase);
            return originalPhpFile as string;
          })
          .filter(Boolean) as string[];
        
        logs.push(`🔍 Mode batch: ${filesToProcess.length} fichiers PHP vérifiés à traiter`);
      } else {
        logs.push(`❓ Aucun fichier ou dossier spécifié, veuillez fournir un fichier, un dossier ou activer le mode batch`);
        return { status: 'error', logs, error: 'Aucun fichier ou dossier spécifié' };
      }
      
      if (filesToProcess.length === 0) {
        logs.push(`✅ Aucun fichier à traiter`);
        return { status: 'success', logs, message: 'Aucun fichier à traiter' };
      }
      
      // Préparation pour stocker tous les résultats
      const results: ConsolidationResult[] = [];
      let successCount = 0;
      let incompleteCount = 0;
      let errorCount = 0;
      
      // Traitement de chaque fichier
      for (const phpFile of filesToProcess) {
        logs.push(`\n🔄 Génération du rapport final pour: ${phpFile}`);
        
        try {
          const result = await this.consolidateReports(phpFile, outputDir, logs);
          results.push(result);
          
          // Mise à jour des compteurs
          if (result.status === 'success') successCount++;
          else if (result.status === 'incomplete') incompleteCount++;
          else if (result.status === 'error') errorCount++;
          
          // Générer version HTML si demandé
          if (context.exportHtml) {
            const htmlPath = await this.generateHtmlReport(result, outputDir, logs);
            if (htmlPath) {
              result.htmlReportPath = htmlPath;
              logs.push(`📄 Rapport HTML généré: ${htmlPath}`);
            }
          }
          
          // Soumettre à Git si demandé
          if (context.commitToGit) {
            await this.commitToGit(result, logs);
          }
          
          // Exporter vers le dashboard si demandé
          if (context.exportToDashboard) {
            await this.exportToDashboard(result, logs);
          }
          
          // Créer une Pull Request si demandé
          if (context.createPullRequest && context.commitToGit) {
            await this.createPullRequest(result, logs);
          }
        } catch (err: any) {
          logs.push(`❌ Erreur lors de la consolidation pour ${phpFile}: ${err.message}`);
          errorCount++;
        }
      }
      
      logs.push(`\n📊 Résumé de la consolidation des rapports:`);
      logs.push(`   ✅ Complétés avec succès: ${successCount}`);
      logs.push(`   ⚠️ Incomplets (manque des données): ${incompleteCount}`);
      logs.push(`   ❌ Erreurs: ${errorCount}`);
      
      return {
        status: 'success',
        logs,
        summary: {
          total: filesToProcess.length,
          success: successCount,
          incomplete: incompleteCount,
          error: errorCount
        },
        results
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
        path.resolve('app/legacy', filePath)
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
      path.resolve('app/legacy', `${fileBase}.php`)
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
   * Consolide tous les rapports pour un fichier PHP
   */
  async consolidateReports(phpFile: string, outputDir: string, logs: string[]): Promise<ConsolidationResult> {
    const fileBase = path.basename(phpFile, '.php');
    
    // Créer la structure de résultat
    const result: ConsolidationResult = {
      file: fileBase,
      originalPhpFile: phpFile,
      finalReportPath: path.resolve(outputDir, `${fileBase}.final.md`),
      status: 'incomplete',
      validationLevel: 'none',
      missingDocuments: [],
      technicalSummary: {
        remixLoader: false,
        nestjsService: false,
        prismaModel: false,
        apiRoutes: false,
        testsExist: false,
        seoMeta: false
      },
      tasksSummary: {
        total: 0,
        completed: 0,
        pending: 0
      },
      qaStatus: 'pending',
      migrationScore: 0
    };
    
    // 1. Collecter tous les rapports et documents disponibles
    const auditPath = path.resolve('audit', `${fileBase}.audit.md`);
    const verificationReportPath = path.resolve('audit', `${fileBase}.verification_report.json`);
    const backlogPath = path.resolve('reports', 'analysis', `${fileBase}.backlog.json`);
    const qaPath = path.resolve('reports', 'qa', `${fileBase}.qa.md`);
    const qaJsonPath = path.resolve('reports', 'qa', `${fileBase}.qa.json`);
    const impactGraphPath = path.resolve('reports', 'analysis', `${fileBase}.impact_graph.json`);
    
    // Vérifier quels documents existent
    if (!fs.existsSync(auditPath)) {
      result.missingDocuments.push('audit.md');
      logs.push(`⚠️ Fichier d'audit non trouvé: ${auditPath}`);
    }
    
    if (!fs.existsSync(verificationReportPath)) {
      result.missingDocuments.push('verification_report.json');
      logs.push(`⚠️ Rapport de vérification non trouvé: ${verificationReportPath}`);
    }
    
    if (!fs.existsSync(qaPath) && !fs.existsSync(qaJsonPath)) {
      result.missingDocuments.push('qa.md/json');
      logs.push(`⚠️ Fiche QA non trouvée: ${qaPath}`);
    }
    
    if (!fs.existsSync(backlogPath)) {
      logs.push(`ℹ️ Fichier backlog non trouvé: ${backlogPath}`);
    }
    
    if (!fs.existsSync(impactGraphPath)) {
      logs.push(`ℹ️ Graphe d'impact non trouvé: ${impactGraphPath}`);
    }
    
    // Si nous n'avons pas au moins l'audit ou le rapport de vérification, impossible de continuer
    if (!fs.existsSync(auditPath) && !fs.existsSync(verificationReportPath)) {
      logs.push(`❌ Documents essentiels manquants pour ${fileBase}, impossible de générer le rapport final`);
      result.status = 'error';
      return result;
    }
    
    // 2. Extraire les informations pertinentes des rapports disponibles
    let auditContent = '';
    let verificationData: any = null;
    let qaData: any = null;
    let backlogData: any = null;
    let impactGraphData: any = null;
    
    // Lecture du fichier d'audit
    if (fs.existsSync(auditPath)) {
      auditContent = fs.readFileSync(auditPath, 'utf-8');
      logs.push(`📄 Fichier d'audit chargé: ${auditPath}`);
    }
    
    // Lecture du rapport de vérification
    if (fs.existsSync(verificationReportPath)) {
      verificationData = JSON.parse(fs.readFileSync(verificationReportPath, 'utf-8'));
      logs.push(`📄 Rapport de vérification chargé: ${verificationReportPath}`);
      
      // Mettre à jour les informations techniques
      if (verificationData.migratedFiles?.frontend?.length > 0) {
        // Vérifier si le loader Remix est implémenté
        const frontendFiles = verificationData.migratedFiles.frontend;
        for (const frontendFile of frontendFiles) {
          if (fs.existsSync(frontendFile)) {
            const content = fs.readFileSync(frontendFile, 'utf-8');
            if (content.includes('useLoaderData') || content.includes('loader')) {
              result.technicalSummary.remixLoader = true;
              break;
            }
          }
        }
      }
      
      if (verificationData.migratedFiles?.backend?.length > 0) {
        // Vérifier si le service NestJS est implémenté
        result.technicalSummary.nestjsService = verificationData.migratedFiles.backend.some((f: string) => 
          f.includes('.service.ts')
        );
        
        // Vérifier si les routes d'API sont implémentées
        result.technicalSummary.apiRoutes = verificationData.migratedFiles.backend.some((f: string) => 
          f.includes('.controller.ts')
        );
        
        // Vérifier si les modèles Prisma sont utilisés
        const backendFiles = verificationData.migratedFiles.backend;
        for (const backendFile of backendFiles) {
          if (fs.existsSync(backendFile)) {
            const content = fs.readFileSync(backendFile, 'utf-8');
            if (content.includes('prisma') || content.includes('PrismaClient')) {
              result.technicalSummary.prismaModel = true;
              break;
            }
          }
        }
      }
    }
    
    // Lecture de la fiche QA
    if (fs.existsSync(qaJsonPath)) {
      qaData = JSON.parse(fs.readFileSync(qaJsonPath, 'utf-8'));
      logs.push(`📄 Fiche QA (JSON) chargée: ${qaJsonPath}`);
      
      result.qaStatus = qaData.status;
      result.migrationScore = qaData.migrationScore;
      
      // Vérifier si les tests existent
      result.technicalSummary.testsExist = Object.entries(qaData.checklist || {}).some(
        ([key, val]) => (key.includes('test') || key.includes('e2e')) && (val as boolean)
      );
      
      // Vérifier si les métadonnées SEO sont présentes
      result.technicalSummary.seoMeta = Object.entries(qaData.checklist || {}).some(
        ([key, val]) => (key.includes('seo') || key.includes('meta')) && (val as boolean)
      );
    } else if (fs.existsSync(qaPath)) {
      const qaContent = fs.readFileSync(qaPath, 'utf-8');
      logs.push(`📄 Fiche QA (MD) chargée: ${qaPath}`);
      
      // Extraire le statut
      const statusMatch = qaContent.match(/Status de vérification : ([^\n]+)/);
      if (statusMatch) {
        result.qaStatus = statusMatch[1].includes('Vérifié') ? 'verified' : 
                          statusMatch[1].includes('Divergent') ? 'divergent' :
                          statusMatch[1].includes('Critique') ? 'critical' :
                          statusMatch[1].includes('En revue') ? 'in-review' :
                          statusMatch[1].includes('Validé') ? 'validated' : 'pending';
      }
      
      // Extraire le score
      const scoreMatch = qaContent.match(/Score de migration : ([⭐☆]+)/);
      if (scoreMatch) {
        result.migrationScore = (scoreMatch[1].match(/⭐/g) || []).length;
      }
      
      // Vérifier si les tests existent
      result.technicalSummary.testsExist = qaContent.includes('[x] Tests unitaires') || 
                                          qaContent.includes('[x] Tests end-to-end');
      
      // Vérifier si les métadonnées SEO sont présentes
      result.technicalSummary.seoMeta = qaContent.includes('[x] `<title>` dynamique') || 
                                       qaContent.includes('[x] `<meta name="description">`');
    }
    
    // Lecture du backlog
    if (fs.existsSync(backlogPath)) {
      backlogData = JSON.parse(fs.readFileSync(backlogPath, 'utf-8'));
      logs.push(`📄 Backlog chargé: ${backlogPath}`);
      
      // Analyser les tâches
      if (backlogData.tasks) {
        result.tasksSummary.total = backlogData.tasks.length;
        result.tasksSummary.completed = backlogData.tasks.filter((t: any) => t.status === 'completed').length;
        result.tasksSummary.pending = backlogData.tasks.filter((t: any) => t.status === 'pending').length;
      }
    }
    
    // Lecture du graphe d'impact
    if (fs.existsSync(impactGraphPath)) {
      impactGraphData = JSON.parse(fs.readFileSync(impactGraphPath, 'utf-8'));
      logs.push(`📄 Graphe d'impact chargé: ${impactGraphPath}`);
    }
    
    // 3. Déterminer le niveau de validation
    if (result.qaStatus === 'verified' || result.qaStatus === 'validated') {
      if (result.tasksSummary.total > 0 && result.tasksSummary.completed === result.tasksSummary.total) {
        result.validationLevel = 'full';
      } else {
        result.validationLevel = 'partial';
      }
    } else if (verificationData && verificationData.status === 'verified') {
      result.validationLevel = 'partial';
    } else if (verificationData) {
      result.validationLevel = 'minimal';
    } else {
      result.validationLevel = 'none';
    }
    
    // 4. Récupérer les informations Git si disponibles
    try {
      // Récupérer le hash du dernier commit
      constDoDoDoDotgitSha = execSync(DoDoDoDotgit rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
      result.commitSha =DoDoDoDotgitSha;
      
      // Récupérer l'utilisateur Git
      constDoDoDoDotgitUser = execSync(DoDoDoDotgit config user.name', { encoding: 'utf-8' }).trim();
      result.signedBy =DoDoDoDotgitUser;
    } catch (err) {
      logs.push(`ℹ️ Informations Git non disponibles`);
    }
    
    // 5. Générer le rapport final
    const finalReportContent = this.generateFinalReport(result, {
      auditContent,
      verificationData,
      qaData,
      backlogData,
      impactGraphData
    });
    
    // Sauvegarder le rapport final
    fs.writeFileSync(result.finalReportPath, finalReportContent);
    logs.push(`✅ Rapport final généré: ${result.finalReportPath}`);
    
    result.status = result.missingDocuments.length > 0 ? 'incomplete' : 'success';
    return result;
  },
  
  /**
   * Génère le contenu du rapport final en Markdown
   */
  generateFinalReport(result: ConsolidationResult, data: any): string {
    const { auditContent, verificationData, qaData, backlogData, impactGraphData } = data;
    
    // Extraire le rôle métier depuis l'audit
    let roleBusiness = '';
    if (auditContent) {
      const roleMatch = auditContent.match(/## Rôle\s+([^\n#]+)/);
      if (roleMatch) {
        roleBusiness = roleMatch[1].trim();
      }
    }
    
    // Extraire le module cible depuis l'audit ou les fichiers migrés
    let moduleTarget = '';
    if (verificationData && verificationData.migratedFiles?.frontend?.length > 0) {
      const frontendFile = verificationData.migratedFiles.frontend[0];
      const moduleMatch = frontendFile.match(/routes\/([^/]+)/);
      if (moduleMatch) {
        moduleTarget = moduleMatch[1];
      }
    }
    
    // Générer le rapport Markdown
    let markdown = `# ✅ Rapport de Migration – \`${result.file}.php\`\n\n`;
    
    // Informations de base
    markdown += `- 📁 Fichier d'origine : \`${result.originalPhpFile}\`\n`;
    if (roleBusiness) {
      markdown += `- 🧠 Rôle métier : ${roleBusiness}\n`;
    }
    if (moduleTarget) {
      markdown += `- 🗂️ Module cible : \`${moduleTarget}\`\n`;
    }
    markdown += `- 🕒 Date de génération : ${new Date().toISOString().split('T')[0]}\n`;
    if (result.signedBy) {
      markdown += `- 👤 Responsable migration : ${result.signedBy}\n`;
    }
    if (result.commitSha) {
      markdown += `- 🔐 Commit Git : ${result.commitSha}\n`;
    }
    
    markdown += `\n---\n\n`;
    
    // Résumé technique
    markdown += `## 🔍 Résumé Technique\n\n`;
    markdown += `| Élément | Statut |\n`;
    markdown += `|--------|--------|\n`;
    markdown += `| ${result.technicalSummary.remixLoader ? '✅' : '❌'} Loader Remix | ${result.technicalSummary.remixLoader ? 'OK' : 'Non implémenté'} |\n`;
    
    // Nom du service NestJS
    const serviceName = `${this.capitalizeFirstLetter(result.file)}Service`;
    markdown += `| ${result.technicalSummary.nestjsService ? '✅' : '❌'} Service NestJS | ${result.technicalSummary.nestjsService ? `\`${serviceName}\` implémenté` : 'Non implémenté'} |\n`;
    
    markdown += `| ${result.technicalSummary.apiRoutes ? '✅' : '❌'} DTOs & Routes API | ${result.technicalSummary.apiRoutes ? 'Générés' : 'Non implémentés'} |\n`;
    
    // Modèle Prisma (extraire noms des modèles si possible)
    let modelNames = '';
    if (verificationData && verificationData.migratedFiles?.backend) {
      for (const file of verificationData.migratedFiles.backend) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf-8');
          const modelMatches = content.match(/prisma\.([a-zA-Z0-9_]+)\./g);
          if (modelMatches) {
            const models = modelMatches.map(m => m.replace('prisma.', '').replace('.', ''));
            modelNames = [...new Set(models)].map(m => `\`${m}\``).join(', ');
          }
        }
      }
    }
    
    markdown += `| ${result.technicalSummary.prismaModel ? '✅' : '❌'} Modèle Prisma | ${result.technicalSummary.prismaModel ? (modelNames || 'Aligné') : 'Non implémenté'} |\n`;
    markdown += `| ${result.technicalSummary.seoMeta ? '✅' : '❓'} SEO | ${result.technicalSummary.seoMeta ? 'Métadonnées + Canonical présents' : 'À vérifier'} |\n`;
    markdown += `| ${result.technicalSummary.testsExist ? '✅' : '❓'} Tests | ${result.technicalSummary.testsExist ? '`unitaires + e2e` générés' : 'À implémenter'} |\n`;
    
    markdown += `\n---\n\n`;
    
    // Tâches réalisées (backlog)
    markdown += `## 📋 Tâches réalisées (`.backlog.json\`)\n\n`;
    
    if (backlogData && backlogData.tasks && backlogData.tasks.length > 0) {
      for (const task of backlogData.tasks) {
        const isCompleted = task.status === 'completed';
        markdown += `- [${isCompleted ? 'x' : ' '}] ${task.description}\n`;
      }
    } else {
      markdown += `_Aucune tâche trouvée ou définie dans le backlog_\n`;
    }
    
    markdown += `\n---\n\n`;
    
    // Graphe d'impact
    markdown += `## 📊 Graphe d'impact (`.impact_graph.json\`)\n\n`;
    
    if (impactGraphData && impactGraphData.dependencies) {
      // Représentation simplifiée des dépendances
      const deps = impactGraphData.dependencies.map((d: any) => d.target);
      if (deps.length > 0) {
        markdown += `\`${result.file}.php\` `;
        for (let i = 0; i < deps.length; i++) {
          const isLast = i === deps.length - 1;
          markdown += i === 0 ? `├──> ${deps[i]}` : `${isLast ? '└──>' : '├──>'} ${deps[i]}`;
          markdown += isLast ? '' : '\n';
        }
      } else {
        markdown += `_Aucune dépendance identifiée_\n`;
      }
    } else {
      markdown += `_Graphe d'impact non disponible_\n`;
    }
    
    markdown += `\n---\n\n`;
    
    // QA Manuelle
    markdown += `## ✅ QA Manuelle\n\n`;
    
    if (qaData) {
      const qaCompletedBy = qaData.qaCompletedBy || 'Agent IA';
      markdown += `- [${qaData.status === 'verified' || qaData.status === 'validated' ? 'x' : ' '}] Vérifié par QA : ${qaCompletedBy}\n`;
      
      // Vérification des champs
      const missingFieldsCount = (qaData.missingFields || []).length;
      markdown += `- [${missingFieldsCount === 0 ? 'x' : ' '}] Correspondance des champs (DiffVerifier)\n`;
      
      // Lighthouse score (toujours à faire manuellement)
      markdown += `- [ ] Score Lighthouse > 90% SEO\n`;
    } else {
      markdown += `_QA non effectuée ou données non disponibles_\n`;
    }
    
    markdown += `\n---\n\n`;
    
    // Conclusion
    markdown += `## 📘 Conclusion\n\n`;
    
    if (result.validationLevel === 'full') {
      markdown += `✔️ Ce fichier peut être marqué comme migré avec succès.\n`;
    } else if (result.validationLevel === 'partial') {
      markdown += `⚠️ Ce fichier est partiellement migré mais nécessite encore des vérifications.\n`;
      
      if (qaData && qaData.missingFields && qaData.missingFields.length > 0) {
        markdown += `🔍 Champs manquants: ${qaData.missingFields.join(', ')}\n`;
      }
      
      if (result.tasksSummary.pending > 0) {
        markdown += `📝 ${result.tasksSummary.pending} tâche(s) encore en attente dans le backlog.\n`;
      }
    } else {
      markdown += `❌ Ce fichier n'est pas prêt pour la migration finale. Veuillez compléter les étapes manquantes.\n`;
    }
    
    markdown += `\n---\n\n`;
    
    // Signature
    markdown += `## 🔏 Signature\n\n`;
    markdown += `\`\`\`yaml\nsignature:\n  agent: consolidator\n  sha: ${result.commitSha || 'N/A'}\n  date: ${new Date().toISOString().split('T')[0]}\n  user: ${result.signedBy || 'Agent IA'}\n\`\`\`\n\n`;
    
    markdown += `---\n\n`;
    
    // Fichiers fusionnés
    markdown += `## 🗂️ Fichiers Fusionnés\n\n`;
    markdown += `| Fichier | Source |\n`;
    markdown += `|--------|--------|\n`;
    
    if (!result.missingDocuments.includes('audit.md')) {
      markdown += `| \`${result.file}.audit.md\` | \`audit/\` |\n`;
    }
    
    if (!result.missingDocuments.includes('verification_report.json')) {
      markdown += `| \`${result.file}.verification_report.json\` | \`audit/\` |\n`;
    }
    
    if (!result.missingDocuments.includes('qa.md/json')) {
      markdown += `| \`${result.file}.qa.md\` | \`reports/qa/\` |\n`;
    }
    
    if (backlogData) {
      markdown += `| \`${result.file}.backlog.json\` | \`reports/analysis/\` |\n`;
    }
    
    if (impactGraphData) {
      markdown += `| \`${result.file}.impact_graph.json\` | \`reports/analysis/\` |\n`;
    }
    
    if (result.missingDocuments.length > 0) {
      markdown += `\n**Documents manquants:** ${result.missingDocuments.join(', ')}\n`;
    }
    
    return markdown;
  },
  
  /**
   * Génère une version HTML du rapport final
   */
  async generateHtmlReport(result: ConsolidationResult, outputDir: string, logs: string[]): Promise<string | null> {
    try {
      const htmlPath = path.resolve(outputDir, `${result.file}.final.html`);
      
      // Vérifier si le fichier Markdown existe
      if (!fs.existsSync(result.finalReportPath)) {
        logs.push(`❌ Impossible de générer le HTML: le fichier Markdown n'existe pas`);
        return null;
      }
      
      // Lire le contenu Markdown
      const markdownContent = fs.readFileSync(result.finalReportPath, 'utf-8');
      
      // Convertir le Markdown en HTML (implémentation simple)
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Migration - ${result.file}.php</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; max-width: 900px; margin: 0 auto; }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; }
    table, th, td { border: 1px solid #ddd; }
    th, td { padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    code { background-color: #f8f9fa; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
    pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: monospace; }
    hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
    .success { color: #2ecc71; }
    .warning { color: #f39c12; }
    .error { color: #e74c3c; }
    .missing { color: #95a5a6; }
  </style>
</head>
<body>
  ${this.convertMarkdownToHtml(markdownContent)}
  
  <footer>
    <hr>
    <p><small>Généré par l'agent <code>consolidator</code> le ${new Date().toLocaleString()}</small></p>
  </footer>
</body>
</html>
      `;
      
      fs.writeFileSync(htmlPath, htmlContent);
      return htmlPath;
    } catch (err: any) {
      logs.push(`❌ Erreur lors de la génération du HTML: ${err.message}`);
      return null;
    }
  },
  
  /**
   * Convertit le Markdown en HTML (implémentation basique)
   */
  convertMarkdownToHtml(markdown: string): string {
    let html = markdown;
    
    // Convertir les titres
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    
    // Convertir les listes à puces
    html = html.replace(/^- \[(x| )\] (.+)$/gm, (match, checked, text) => 
      `<p><input type="checkbox" ${checked === 'x' ? 'checked' : ''} disabled> ${text}</p>`
    );
    html = html.replace(/^- (.+)$/gm, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/g, '');
    
    // Convertir le code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/```([^`]+)```/g, '<pre>$1</pre>');
    
    // Convertir les tableaux
    html = html.replace(/^\|(.+)\|$/gm, '<tr>$1</tr>');
    html = html.replace(/\|([^|]+)\|/g, '<td>$1</td>');
    html = html.replace(/<tr>(.+)<\/tr>/g, '<tr>$1</tr>');
    
    // Entourer les tableaux avec <table>
    const tableRegex = /<tr>(.+)<\/tr>\n<tr>(.+)<\/tr>/g;
    if (tableRegex.test(html)) {
      html = html.replace(/<tr>(.+)<\/tr>\n<tr>(.+)<\/tr>/g, '<table><tr>$1</tr>\n<tr>$2</tr></table>');
    }
    
    // Convertir les lignes horizontales
    html = html.replace(/---/g, '<hr>');
    
    // Convertir les sauts de ligne
    html = html.replace(/\n\n/g, '</p><p>');
    
    return `<p>${html}</p>`;
  },
  
  /**
   * Soumet le rapport final à Git
   */
  async commitToGit(result: ConsolidationResult, logs: string[]): Promise<boolean> {
    try {
      // Ajouter le fichier
      execSync(DoDoDoDotgit add "${result.finalReportPath}"`, { stdio: 'pipe' });
      
      // Créer le commit
      const commitMessage = `✅ Rapport de migration final pour ${result.file}.php`;
      execSync(DoDoDoDotgit commit -m "${commitMessage}"`, { stdio: 'pipe' });
      
      logs.push(`✅ Rapport final commité dans Git`);
      return true;
    } catch (err: any) {
      logs.push(`❌ Erreur lors du commit Git: ${err.message}`);
      return false;
    }
  },
  
  /**
   * Crée une Pull Request sur GitHub
   */
  async createPullRequest(result: ConsolidationResult, logs: string[]): Promise<boolean> {
    try {
      // Vérifier si la commande gh est disponible
      try {
        execSync('gh --version', { stdio: 'pipe' });
      } catch (err) {
        logs.push(`❌ La commande GitHub CLI (gh) n'est pas disponible, impossible de créer une PR`);
        return false;
      }
      
      // Créer une nouvelle branche
      const branchName = `migration-${result.file}-${Date.now()}`;
      execSync(DoDoDoDotgit checkout -b ${branchName}`, { stdio: 'pipe' });
      
      // Pousser la branche
      execSync(DoDoDoDotgit push -u origin ${branchName}`, { stdio: 'pipe' });
      
      // Créer la PR
      const prTitle = `✅ Migration terminée: ${result.file}.php`;
      const prBody = `## Migration terminée pour \`${result.file}.php\`
      
Ce rapport de migration a été généré automatiquement par l'agent \`consolidator\`.

- Niveau de validation: ${result.validationLevel}
- Score de migration: ${result.migrationScore}/5
- Statut QA: ${result.qaStatus}

> Ce rapport est destiné à être validé par l'équipe de développement.`;
      
      const prCommand = `gh pr create --title "${prTitle}" --body "${prBody}" --base main`;
      execSync(prCommand, { stdio: 'pipe' });
      
      logs.push(`✅ Pull Request créée pour la migration de ${result.file}.php`);
      
      // Revenir à la branche principale
      execSync(DoDoDoDotgit checkout main', { stdio: 'pipe' });
      
      return true;
    } catch (err: any) {
      logs.push(`❌ Erreur lors de la création de la PR: ${err.message}`);
      return false;
    }
  },
  
  /**
   * Exporte les données vers le dashboard
   */
  async exportToDashboard(result: ConsolidationResult, logs: string[]): Promise<boolean> {
    try {
      // Définir le chemin du fichier d'exportation
      const dashboardDataDir = path.resolve('dashboard', 'data', 'migrations');
      const exportPath = path.resolve(dashboardDataDir, `${result.file}.json`);
      
      // Créer le répertoire si nécessaire
      if (!fs.existsSync(dashboardDataDir)) {
        fs.mkdirSync(dashboardDataDir, { recursive: true });
      }
      
      // Préparer les données pour le dashboard
      const dashboardData = {
        file: result.file,
        originalPhpFile: result.originalPhpFile,
        status: result.status,
        validationLevel: result.validationLevel,
        qaStatus: result.qaStatus,
        migrationScore: result.migrationScore,
        technicalSummary: result.technicalSummary,
        tasksSummary: result.tasksSummary,
        reportPath: path.relative(process.cwd(), result.finalReportPath),
        htmlReportPath: result.htmlReportPath ? path.relative(process.cwd(), result.htmlReportPath) : null,
        lastUpdated: new Date().toISOString(),
        signedBy: result.signedBy,
        commitSha: result.commitSha
      };
      
      // Écrire le fichier
      fs.writeFileSync(exportPath, JSON.stringify(dashboardData, null, 2));
      logs.push(`📊 Données exportées vers le dashboard: ${exportPath}`);
      
      return true;
    } catch (err: any) {
      logs.push(`❌ Erreur lors de l'exportation vers le dashboard: ${err.message}`);
      return false;
    }
  },
  
  /**
   * Utilitaire pour capitaliser la première lettre d'une chaîne
   */
  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
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
    const context: ConsolidatorContext = {};
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--file' && i + 1 < args.length) {
        context.file = args[i + 1];
        i++;
      } else if (args[i] === '--dir' && i + 1 < args.length) {
        context.directory = args[i + 1];
        i++;
      } else if (args[i] === '--batch') {
        context.batchMode = true;
      } else if (args[i] === '--output-dir' && i + 1 < args.length) {
        context.outputDir = args[i + 1];
        i++;
      } else if (args[i] === '--commit-toDoDoDoDotgit') {
        context.commitToGit = true;
      } else if (args[i] === '--create-pr') {
        context.createPullRequest = true;
      } else if (args[i] === '--html') {
        context.exportHtml = true;
      } else if (args[i] === '--dashboard') {
        context.exportToDashboard = true;
      }
    }
    
    contextArg = JSON.stringify(context);
  }
  
  try {
    const context = JSON.parse(contextArg);
    
    consolidatorAgent.run(context)
      .then(result => {
        if (result.logs) {
          console.log(result.logs.join('\n'));
        }
        process.exit(result.status === 'success' ? 0 : 1);
      })
      .catch(error => {
        console.error('Erreur:', error);
        process.exit(1);
      });
  } catch (err) {
    console.error('Erreur lors du parsing des arguments JSON:', err);
    process.exit(1);
  }
}