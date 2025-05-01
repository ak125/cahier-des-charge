import * as fs from 'fs/promisesstructure-agent';
import * as path from 'pathstructure-agent';
import { exec } from './child_processstructure-agent';
import { promisify } from './utilstructure-agent';

const _execAsync = promisify(exec);

/**
 * Interface pour la carte de découverte
 */
interface DiscoveryMapItem {
  id: string;
  path: string;
  priority: number;
  type: string;
  status: string;
  dependencies?: string[];
}

/**
 * Interface pour une section d'audit
 */
interface AuditSection {
  id: string;
  title: string;
  content: string;
  type?: string;
  severity?: 'info' | 'warning' | 'critical';
}

/**
 * Interface pour une tâche de backlog
 */
interface BacklogTask {
  type: string;
  target: string;
  status: string;
  description?: string;
  priority?: number;
}

/**
 * Interface pour un fichier backlog
 */
interface BacklogFile {
  file: string;
  priority: number;
  status: string;
  tasks: BacklogTask[];
}

/**
 * Interface pour le graphe d'impact
 */
interface ImpactGraph {
  nodes: string[];
  edges: [string, string][];
}

/**
 * Interface pour un problème détecté
 */
interface Issue {
  type: 'duplicate' | 'orphan' | 'incomplete' | 'inconsistent' | 'obsolete';
  severity: 'info' | 'warning' | 'critical';
  file: string;
  description: string;
  suggestedAction?: string;
}

/**
 * Interface pour une suggestion de fusion
 */
interface MergeSuggestion {
  files: string[];
  similarity: number;
  reason: string;
}

/**
 * Interface pour un fichier à supprimer
 */
interface FileToDelete {
  file: string;
  reason: string;
}

/**
 * Résultat de la vérification
 */
interface VerificationResult {
  scannedFiles: {
    auditFiles: string[];
    backlogFiles: string[];
    impactGraphFiles: string[];
    phpFiles: string[];
  };
  issues: Issue[];
  mergeSuggestions: MergeSuggestion[];
  filesToDelete: FileToDelete[];
  completeFiles: string[];
  missingFiles: {
    phpFile: string;
    missingAudit: boolean;
    missingBacklog: boolean;
    missingImpactGraph: boolean;
  }[];
  summary: {
    totalFiles: number;
    completeFiles: number;
    issuesCount: number;
    mergeSuggestionsCount: number;
    filesToDeleteCount: number;
  };
}

/**
 * Vérificateur du cahier des charges
 */
class CahierDesChargesVerifier {
  private legacyDir: string;
  private cahierDir: string;
  private discoveryMapPath: string;
  private result: VerificationResult;
  private discoveryMap: DiscoveryMapItem[] = [];

  constructor(
    legacyDir = '/workspaces/cahier-des-charge/legacy',
    cahierDir = '/workspaces/cahier-des-charge',
    discoveryMapPath = '/workspaces/cahier-des-charge/discovery_map.json'
  ) {
    this.legacyDir = legacyDir;
    this.cahierDir = cahierDir;
    this.discoveryMapPath = discoveryMapPath;
    this.result = {
      scannedFiles: {
        auditFiles: [],
        backlogFiles: [],
        impactGraphFiles: [],
        phpFiles: [],
      },
      issues: [],
      mergeSuggestions: [],
      filesToDelete: [],
      completeFiles: [],
      missingFiles: [],
      summary: {
        totalFiles: 0,
        completeFiles: 0,
        issuesCount: 0,
        mergeSuggestionsCount: 0,
        filesToDeleteCount: 0,
      },
    };
  }

  /**
   * Exécute la vérification complète
   */
  public async verify(): Promise<VerificationResult> {
    console.log('🔍 Démarrage de la vérification du cahier des charges...');

    // Étape 1: Charger la discovery map
    await this.loadDiscoveryMap();

    // Étape 2: Scanner les fichiers
    await this.scanFiles();

    // Étape 3: Vérifier les audits
    await this.verifyAudits();

    // Étape 4: Vérifier les backlogs
    await this.verifyBacklogs();

    // Étape 5: Vérifier les graphes d'impact
    await this.verifyImpactGraphs();

    // Étape 6: Détecter les doublons
    await this.detectDuplicates();

    // Étape 7: Détecter les fichiers orphelins
    await this.detectOrphans();

    // Étape 8: Suggérer des fusions
    await this.suggestMerges();

    // Étape 9: Identifier les fichiers obsolètes
    await this.identifyObsoleteFiles();

    // Étape 10: Mettre à jour le résumé
    this.updateSummary();

    console.log('✅ Vérification terminée');

    return this.result;
  }

  /**
   * Charge la carte de découverte
   */
  private async loadDiscoveryMap(): Promise<void> {
    try {
      console.log(`📂 Chargement de la discovery map: ${this.discoveryMapPath}`);
      const data = await fs.readFile(this.discoveryMapPath, 'utf8');
      this.discoveryMap = JSON.parse(data);
      console.log(`✅ Discovery map chargée avec ${this.discoveryMap.length} entrées`);
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de la discovery map: ${error.message}`);
      this.discoveryMap = [];
    }
  }

  /**
   * Scanne les fichiers disponibles
   */
  private async scanFiles(): Promise<void> {
    try {
      // Scanner les fichiers PHP
      try {
        const phpFiles = await this.findFilesByExtension(this.legacyDir, '.php');
        this.result.scannedFiles.phpFiles = phpFiles;
        console.log(`📂 ${phpFiles.length} fichiers PHP trouvés`);
      } catch (error) {
        console.warn(`⚠️ Impossible de scanner les fichiers PHP: ${error.message}`);
        this.result.scannedFiles.phpFiles = [];
      }

      // Scanner les fichiers d'audit
      const auditFiles = await this.findFilesByPattern(this.cahierDir, '.audit.md');
      this.result.scannedFiles.auditFiles = auditFiles;
      console.log(`📂 ${auditFiles.length} fichiers d'audit trouvés`);

      // Scanner les fichiers de backlog
      const backlogFiles = await this.findFilesByPattern(this.cahierDir, '.backlog.json');
      this.result.scannedFiles.backlogFiles = backlogFiles;
      console.log(`📂 ${backlogFiles.length} fichiers de backlog trouvés`);

      // Scanner les fichiers de graphe d'impact
      const impactGraphFiles = await this.findFilesByPattern(this.cahierDir, '.impact_graph.json');
      this.result.scannedFiles.impactGraphFiles = impactGraphFiles;
      console.log(`📂 ${impactGraphFiles.length} fichiers de graphe d'impact trouvés`);
    } catch (error) {
      console.error(`❌ Erreur lors du scan des fichiers: ${error.message}`);
    }
  }

  /**
   * Trouve les fichiers par extension
   */
  private async findFilesByExtension(dir: string, extension: string): Promise<string[]> {
    try {
      const result: string[] = [];

      async function scanDir(currentDir: string) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(extension)) {
            result.push(fullPath);
          }
        }
      }

      await scanDir(dir);
      return result;
    } catch (error) {
      console.error(`❌ Erreur lors de la recherche des fichiers ${extension}: ${error.message}`);
      return [];
    }
  }

  /**
   * Trouve les fichiers par pattern dans le nom
   */
  private async findFilesByPattern(dir: string, pattern: string): Promise<string[]> {
    try {
      const result: string[] = [];

      async function scanDir(currentDir: string) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.includes(pattern)) {
            result.push(fullPath);
          }
        }
      }

      await scanDir(dir);
      return result;
    } catch (error) {
      console.error(`❌ Erreur lors de la recherche des fichiers ${pattern}: ${error.message}`);
      return [];
    }
  }

  /**
   * Vérifie la complétude des audits
   */
  private async verifyAudits(): Promise<void> {
    console.log('🔍 Vérification des audits...');

    for (const auditPath of this.result.scannedFiles.auditFiles) {
      try {
        const content = await fs.readFile(auditPath, 'utf8');
        const fileName = path.basename(auditPath);
        const baseFileName = fileName.replace('.audit.md', '');

        // Vérifier la présence de toutes les sections (1 à 24)
        const sectionHeaders = this.extractSectionHeaders(content);

        if (sectionHeaders.length < 20) {
          this.result.issues.push({
            type: 'incomplete',
            severity: 'warning',
            file: auditPath,
            description: `L'audit contient seulement ${sectionHeaders.length}/24 sections`,
            suggestedAction: 'Compléter les sections manquantes',
          });
        } else {
          this.result.completeFiles.push(auditPath);
        }

        // Vérifier la cohérence avec discovery_map
        const inDiscoveryMap = this.discoveryMap.some(
          (item) => item.id === baseFileName || item.path.includes(baseFileName)
        );

        if (!inDiscoveryMap) {
          this.result.issues.push({
            type: 'orphan',
            severity: 'info',
            file: auditPath,
            description: `Fichier d'audit non référencé dans discovery_map.json`,
            suggestedAction: 'Ajouter à discovery_map.json ou supprimer',
          });
        }
      } catch (error) {
        console.error(
          `❌ Erreur lors de la vérification de l'audit ${auditPath}: ${error.message}`
        );
      }
    }
  }

  /**
   * Extrait les en-têtes de section d'un fichier audit
   */
  private extractSectionHeaders(content: string): string[] {
    const sectionRegex = /##\s+([0-9️⃣]+)\s+(.+)/g;
    const headers: string[] = [];
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      headers.push(match[0]);
    }

    return headers;
  }

  /**
   * Vérifie la cohérence des backlogs
   */
  private async verifyBacklogs(): Promise<void> {
    console.log('🔍 Vérification des backlogs...');

    for (const backlogPath of this.result.scannedFiles.backlogFiles) {
      try {
        const content = await fs.readFile(backlogPath, 'utf8');
        const fileName = path.basename(backlogPath);
        const baseFileName = fileName.replace('.backlog.json', '');

        // Vérifier la structure JSON
        try {
          const backlog: BacklogFile = JSON.parse(content);

          // Vérifier si le fichier associé existe dans discovery_map
          const inDiscoveryMap = this.discoveryMap.some(
            (item) => item.id === baseFileName || item.path.includes(baseFileName)
          );

          if (!inDiscoveryMap) {
            this.result.issues.push({
              type: 'orphan',
              severity: 'info',
              file: backlogPath,
              description: 'Fichier backlog non référencé dans discovery_map.json',
              suggestedAction: 'Ajouter à discovery_map.json ou supprimer',
            });
          }

          // Vérifier les tâches obsolètes
          const obsoleteTasks = backlog.tasks.filter(
            (task) => task.status === 'completed' || task.status === 'cancelled'
          );
          if (obsoleteTasks.length > 0 && obsoleteTasks.length === backlog.tasks.length) {
            this.result.issues.push({
              type: 'obsolete',
              severity: 'info',
              file: backlogPath,
              description: 'Toutes les tâches sont terminées ou annulées',
              suggestedAction: 'Marquer comme "migrated" dans discovery_map.json',
            });
          }
        } catch (error) {
          this.result.issues.push({
            type: 'inconsistent',
            severity: 'critical',
            file: backlogPath,
            description: `Structure JSON invalide: ${error.message}`,
            suggestedAction: 'Corriger le format JSON',
          });
        }
      } catch (error) {
        console.error(
          `❌ Erreur lors de la vérification du backlog ${backlogPath}: ${error.message}`
        );
      }
    }
  }

  /**
   * Vérifie les graphes d'impact
   */
  private async verifyImpactGraphs(): Promise<void> {
    console.log("🔍 Vérification des graphes d'impact...");

    for (const graphPath of this.result.scannedFiles.impactGraphFiles) {
      try {
        const content = await fs.readFile(graphPath, 'utf8');
        const fileName = path.basename(graphPath);
        const baseFileName = fileName.replace('.impact_graph.json', '');

        // Vérifier la structure JSON
        try {
          const graph: ImpactGraph = JSON.parse(content);

          // Vérifier si le fichier associé existe dans discovery_map
          const inDiscoveryMap = this.discoveryMap.some(
            (item) => item.id === baseFileName || item.path.includes(baseFileName)
          );

          if (!inDiscoveryMap) {
            this.result.issues.push({
              type: 'orphan',
              severity: 'info',
              file: graphPath,
              description: `Graphe d'impact non référencé dans discovery_map.json`,
              suggestedAction: 'Ajouter à discovery_map.json ou supprimer',
            });
          }

          // Vérifier la cohérence du graphe
          if (graph.nodes.length === 0 || graph.edges.length === 0) {
            this.result.issues.push({
              type: 'incomplete',
              severity: 'warning',
              file: graphPath,
              description: `Graphe d'impact vide ou incomplet`,
              suggestedAction: "Régénérer le graphe d'impact",
            });
          }
        } catch (error) {
          this.result.issues.push({
            type: 'inconsistent',
            severity: 'critical',
            file: graphPath,
            description: `Structure JSON invalide: ${error.message}`,
            suggestedAction: 'Corriger le format JSON',
          });
        }
      } catch (error) {
        console.error(
          `❌ Erreur lors de la vérification du graphe d'impact ${graphPath}: ${error.message}`
        );
      }
    }
  }

  /**
   * Détecte les fichiers en double
   */
  private async detectDuplicates(): Promise<void> {
    console.log('🔍 Détection des doublons...');

    // Regrouper les fichiers par nom de base (sans version)
    const auditGroups = this.groupFilesByBaseName(this.result.scannedFiles.auditFiles, '.audit.md');
    const backlogGroups = this.groupFilesByBaseName(
      this.result.scannedFiles.backlogFiles,
      '.backlog.json'
    );
    const graphGroups = this.groupFilesByBaseName(
      this.result.scannedFiles.impactGraphFiles,
      '.impact_graph.json'
    );

    // Vérifier les doublons d'audit
    for (const [baseName, files] of Object.entries(auditGroups)) {
      if (files.length > 1) {
        this.result.issues.push({
          type: 'duplicate',
          severity: 'warning',
          file: files.join(', '),
          description: `${files.length} audits en double pour ${baseName}`,
          suggestedAction: 'Fusionner les audits',
        });

        this.result.mergeSuggestions.push({
          files,
          similarity: 0.8,
          reason: `Audits multiples pour le même fichier ${baseName}`,
        });
      }
    }

    // Vérifier les doublons de backlog
    for (const [baseName, files] of Object.entries(backlogGroups)) {
      if (files.length > 1) {
        this.result.issues.push({
          type: 'duplicate',
          severity: 'warning',
          file: files.join(', '),
          description: `${files.length} backlogs en double pour ${baseName}`,
          suggestedAction: 'Conserver uniquement le plus récent',
        });
      }
    }

    // Vérifier les doublons de graphe d'impact
    for (const [baseName, files] of Object.entries(graphGroups)) {
      if (files.length > 1) {
        this.result.issues.push({
          type: 'duplicate',
          severity: 'warning',
          file: files.join(', '),
          description: `${files.length} graphes d'impact en double pour ${baseName}`,
          suggestedAction: 'Conserver uniquement le plus récent',
        });
      }
    }
  }

  /**
   * Regroupe les fichiers par nom de base (sans version)
   */
  private groupFilesByBaseName(files: string[], _suffix: string): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const file of files) {
      const fileName = path.basename(file);
      // Extraire le nom de base sans numéro de version (ex: fiche.v1.php -> fiche.php)
      const baseNameMatch = fileName.match(/^(.+?)(\.v\d+)?(\.php.+)$/);
      const baseName = baseNameMatch ? `${baseNameMatch[1]}.php${baseNameMatch[3]}` : fileName;

      if (!groups[baseName]) {
        groups[baseName] = [];
      }

      groups[baseName].push(file);
    }

    return groups;
  }

  /**
   * Détecte les fichiers orphelins
   */
  private async detectOrphans(): Promise<void> {
    console.log('🔍 Détection des fichiers orphelins...');

    // Vérifier les fichiers PHP qui n'ont pas d'audit, backlog ou graphe d'impact
    for (const item of this.discoveryMap) {
      const baseFileName = item.id;

      const hasAudit = this.result.scannedFiles.auditFiles.some((file) =>
        path.basename(file).startsWith(`${baseFileName}.audit`)
      );

      const hasBacklog = this.result.scannedFiles.backlogFiles.some((file) =>
        path.basename(file).startsWith(`${baseFileName}.backlog`)
      );

      const hasImpactGraph = this.result.scannedFiles.impactGraphFiles.some((file) =>
        path.basename(file).startsWith(`${baseFileName}.impact_graph`)
      );

      if (!hasAudit || !hasBacklog || !hasImpactGraph) {
        this.result.missingFiles.push({
          phpFile: baseFileName,
          missingAudit: !hasAudit,
          missingBacklog: !hasBacklog,
          missingImpactGraph: !hasImpactGraph,
        });
      }
    }
  }

  /**
   * Suggère des fusions basées sur la similarité
   */
  private async suggestMerges(): Promise<void> {
    console.log('🔍 Recherche de fusions possibles...');

    // Analyser les graphes d'impact pour trouver des modules avec des dépendances similaires
    const impactGraphs: Record<string, ImpactGraph> = {};

    for (const graphPath of this.result.scannedFiles.impactGraphFiles) {
      try {
        const content = await fs.readFile(graphPath, 'utf8');
        const fileName = path.basename(graphPath);
        const baseFileName = fileName.replace('.impact_graph.json', '');

        const graph: ImpactGraph = JSON.parse(content);
        impactGraphs[baseFileName] = graph;
      } catch (_error) {
        // Ignorer les erreurs
      }
    }

    // Comparer les graphes pour trouver des similarités
    const processed = new Set<string>();

    for (const [file1, graph1] of Object.entries(impactGraphs)) {
      processed.add(file1);

      for (const [file2, graph2] of Object.entries(impactGraphs)) {
        if (processed.has(file2)) continue;

        // Calculer la similarité des dépendances
        const similarity = this.calculateGraphSimilarity(graph1, graph2);

        if (similarity > 0.7) {
          this.result.mergeSuggestions.push({
            files: [file1, file2],
            similarity,
            reason: `Les fichiers partagent ${(similarity * 100).toFixed(
              0
            )}% de dépendances communes`,
          });
        }
      }
    }
  }

  /**
   * Calcule la similarité entre deux graphes d'impact
   */
  private calculateGraphSimilarity(graph1: ImpactGraph, graph2: ImpactGraph): number {
    if (!graph1.nodes.length || !graph2.nodes.length) return 0;

    // Comparer les nœuds
    const nodes1Set = new Set(graph1.nodes);
    const nodes2Set = new Set(graph2.nodes);

    const commonNodes = new Set([...nodes1Set].filter((node) => nodes2Set.has(node)));

    // Calculer le coefficient de Jaccard
    const similarity = commonNodes.size / (nodes1Set.size + nodes2Set.size - commonNodes.size);

    return similarity;
  }

  /**
   * Identifie les fichiers obsolètes
   */
  private async identifyObsoleteFiles(): Promise<void> {
    console.log('🔍 Identification des fichiers obsolètes...');

    // Vérifier les fichiers d'audit vides ou presque vides
    for (const auditPath of this.result.scannedFiles.auditFiles) {
      try {
        const content = await fs.readFile(auditPath, 'utf8');

        if (content.trim().length < 100) {
          this.result.filesToDelete.push({
            file: auditPath,
            reason: 'Audit vide ou presque vide',
          });
        }
      } catch (_error) {
        // Ignorer les erreurs
      }
    }

    // Vérifier les backlogs dont toutes les tâches sont terminées
    for (const backlogPath of this.result.scannedFiles.backlogFiles) {
      try {
        const content = await fs.readFile(backlogPath, 'utf8');
        const backlog: BacklogFile = JSON.parse(content);

        const allTasksCompleted = backlog.tasks.every(
          (task) => task.status === 'completed' || task.status === 'cancelled'
        );

        if (allTasksCompleted && backlog.tasks.length > 0) {
          this.result.filesToDelete.push({
            file: backlogPath,
            reason: 'Toutes les tâches sont terminées',
          });
        }
      } catch (_error) {
        // Ignorer les erreurs
      }
    }

    // Vérifier les fichiers dans discovery_map marqués comme migrés
    for (const item of this.discoveryMap) {
      if (item.status === 'migrated') {
        const baseFileName = item.id;

        // Chercher les fichiers associés
        const auditFile = this.result.scannedFiles.auditFiles.find((file) =>
          path.basename(file).startsWith(`${baseFileName}.audit`)
        );

        const backlogFile = this.result.scannedFiles.backlogFiles.find((file) =>
          path.basename(file).startsWith(`${baseFileName}.backlog`)
        );

        const impactGraphFile = this.result.scannedFiles.impactGraphFiles.find((file) =>
          path.basename(file).startsWith(`${baseFileName}.impact_graph`)
        );

        // Suggérer de les supprimer car le fichier est déjà migré
        if (auditFile) {
          this.result.filesToDelete.push({
            file: auditFile,
            reason: 'Fichier migré dans discovery_map.json',
          });
        }

        if (backlogFile) {
          this.result.filesToDelete.push({
            file: backlogFile,
            reason: 'Fichier migré dans discovery_map.json',
          });
        }

        if (impactGraphFile) {
          this.result.filesToDelete.push({
            file: impactGraphFile,
            reason: 'Fichier migré dans discovery_map.json',
          });
        }
      }
    }
  }

  /**
   * Met à jour le résumé des résultats
   */
  private updateSummary(): void {
    this.result.summary.totalFiles =
      this.result.scannedFiles.auditFiles.length +
      this.result.scannedFiles.backlogFiles.length +
      this.result.scannedFiles.impactGraphFiles.length;

    this.result.summary.completeFiles = this.result.completeFiles.length;
    this.result.summary.issuesCount = this.result.issues.length;
    this.result.summary.mergeSuggestionsCount = this.result.mergeSuggestions.length;
    this.result.summary.filesToDeleteCount = this.result.filesToDelete.length;
  }

  /**
   * Génère un rapport de contrôle qualité au format Markdown
   */
  public generateQualityReport(): string {
    let report = '# 🔎 Rapport de Contrôle Qualité du Cahier des Charges\n\n';

    // Statistiques générales
    report += '## 📊 Statistiques\n\n';
    report += `- **Total des fichiers analysés** : ${this.result.summary.totalFiles}\n`;
    report += `- **Fichiers complets** : ${this.result.summary.completeFiles}\n`;
    report += `- **Problèmes détectés** : ${this.result.summary.issuesCount}\n`;
    report += `- **Fusions suggérées** : ${this.result.summary.mergeSuggestionsCount}\n`;
    report += `- **Fichiers à supprimer** : ${this.result.summary.filesToDeleteCount}\n\n`;

    // Fichiers en double
    const duplicateIssues = this.result.issues.filter((issue) => issue.type === 'duplicate');
    if (duplicateIssues.length > 0) {
      report += '## 🔁 Fichiers en doublon détectés\n\n';

      for (const issue of duplicateIssues) {
        report += `- ${issue.file} → ${issue.suggestedAction}\n`;
      }

      report += '\n';
    }

    // Fichiers orphelins
    const orphanIssues = this.result.issues.filter((issue) => issue.type === 'orphan');
    if (orphanIssues.length > 0) {
      report += '## ❌ Fichiers orphelins (non référencés)\n\n';

      for (const issue of orphanIssues) {
        report += `- \`${path.basename(issue.file)}\` (${issue.description})\n`;
      }

      report += '\n';
    }

    // Fichiers manquants
    if (this.result.missingFiles.length > 0) {
      report += '## ⚠️ Fichiers manquants\n\n';

      for (const missing of this.result.missingFiles) {
        const missingItems = [];
        if (missing.missingAudit) missingItems.push('audit');
        if (missing.missingBacklog) missingItems.push('backlog');
        if (missing.missingImpactGraph) missingItems.push('impact_graph');

        report += `- \`${missing.phpFile}\` : ${missingItems.join(', ')} manquant(s)\n`;
      }

      report += '\n';
    }

    // Fichiers complets et cohérents
    if (this.result.completeFiles.length > 0) {
      report += '## ✅ Fichiers complets et cohérents\n\n';

      for (const file of this.result.completeFiles.slice(0, 10)) {
        // Limiter à 10 pour la lisibilité
        report += `- \`${path.basename(file)}\` ✔️\n`;
      }

      if (this.result.completeFiles.length > 10) {
        report += `- ... et ${this.result.completeFiles.length - 10} autres fichiers\n`;
      }

      report += '\n';
    }

    // Fusions suggérées
    if (this.result.mergeSuggestions.length > 0) {
      report += '## 🔄 Fusions suggérées\n\n';

      for (const suggestion of this.result.mergeSuggestions) {
        const files = suggestion.files.map((file) => path.basename(file));
        report += `- ${files.join(' + ')} → ${suggestion.reason}\n`;
      }

      report += '\n';
    }

    // Fichiers à supprimer
    if (this.result.filesToDelete.length > 0) {
      report += '## 📁 Fichiers à supprimer (obsolètes ou vides)\n\n';

      for (const fileToDelete of this.result.filesToDelete) {
        report += `- \`${path.basename(fileToDelete.file)}\` (${fileToDelete.reason})\n`;
      }

      report += '\n';
    }

    // Recommandations
    report += '## 🔧 Recommandations\n\n';

    if (this.result.mergeSuggestions.length > 0) {
      report += '### Fusions\n\n';
      report += 'Exécutez le script de fusion pour combiner les fichiers similaires :\n\n';
      report += '```bash\n';
      report += 'npx ts-node scripts/merge-similar-files.ts\n';
      report += '```\n\n';
    }

    if (this.result.filesToDelete.length > 0) {
      report += '### Nettoyage\n\n';
      report += 'Exécutez le script de nettoyage pour supprimer les fichiers obsolètes :\n\n';
      report += '```bash\n';
      report += 'npx ts-node scripts/cleanup-obsolete-files.ts\n';
      report += '```\n\n';
    }

    if (orphanIssues.length > 0) {
      report += '### Mise à jour de discovery_map.json\n\n';
      report += 'Générez une version mise à jour de discovery_map.json :\n\n';
      report += '```bash\n';
      report += 'npx ts-node scripts/update-discovery-map.ts\n';
      report += '```\n\n';
    }

    // Conclusion
    report += '## 📝 Conclusion\n\n';

    if (this.result.issues.length === 0 && this.result.missingFiles.length === 0) {
      report += '✅ Le cahier des charges est complet et cohérent. Aucune action nécessaire.\n';
    } else {
      report +=
        '⚠️ Le cahier des charges présente quelques problèmes qui devraient être résolus :\n\n';
      report += `1. ${this.result.issues.length} problèmes à corriger\n`;
      report += `2. ${this.result.missingFiles.length} fichiers manquants à générer\n`;
      report += `3. ${this.result.mergeSuggestions.length} opportunités de fusion\n`;
      report += `4. ${this.result.filesToDelete.length} fichiers à supprimer\n\n`;
      report += 'Utilisez les commandes recommandées ci-dessus pour résoudre ces problèmes.\n';
    }

    return report;
  }

  /**
   * Génère une version nettoyée de discovery_map.json
   */
  public generateCleanedDiscoveryMap(): any {
    const cleanedMap = [...this.discoveryMap];

    // Retirer les doublons
    const seen = new Set<string>();
    const uniqueMap = cleanedMap.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });

    // Mettre à jour les statuts
    for (const item of uniqueMap) {
      // Vérifier si tous les fichiers nécessaires existent
      const baseFileName = item.id;

      const hasAudit = this.result.scannedFiles.auditFiles.some((file) =>
        path.basename(file).startsWith(`${baseFileName}.audit`)
      );

      const hasBacklog = this.result.scannedFiles.backlogFiles.some((file) =>
        path.basename(file).startsWith(`${baseFileName}.backlog`)
      );

      const hasImpactGraph = this.result.scannedFiles.impactGraphFiles.some((file) =>
        path.basename(file).startsWith(`${baseFileName}.impact_graph`)
      );

      if (hasAudit && hasBacklog && hasImpactGraph) {
        // Tous les fichiers existent, vérifier s'ils sont complets
        const auditFile = this.result.scannedFiles.auditFiles.find((file) =>
          path.basename(file).startsWith(`${baseFileName}.audit`)
        );

        const isAuditComplete = this.result.completeFiles.includes(auditFile);

        if (isAuditComplete && item.status === 'discovered') {
          item.status = 'audited';
        }
      } else if (item.status === 'audited') {
        // Fichiers manquants mais statut audité
        item.status = 'discovered';
      }
    }

    return uniqueMap;
  }

  /**
   * Génère un plan de fusion
   */
  public generateMergePlan(): string {
    let plan = '# 🔄 Plan de fusion des fichiers similaires\n\n';

    if (this.result.mergeSuggestions.length === 0) {
      plan += '✅ Aucune fusion suggérée.\n';
      return plan;
    }

    plan += `Ce document présente un plan pour fusionner les fichiers similaires détectés lors de l'analyse du cahier des charges.\n\n`;

    // Plan de fusion par type de fichier
    plan += `## Fichiers d'audit\n\n`;

    const auditMerges = this.result.mergeSuggestions.filter((suggestion) =>
      suggestion.files.some((file) => file.includes('.audit.md'))
    );

    if (auditMerges.length > 0) {
      for (const merge of auditMerges) {
        const files = merge.files.map((file) => path.basename(file));
        plan += `### Fusion : ${files.join(' + ')}\n\n`;
        plan += `- **Similarité** : ${(merge.similarity * 100).toFixed(0)}%\n`;
        plan += `- **Raison** : ${merge.reason}\n`;
        plan +=
          '- **Stratégie** : Combiner les sections uniques, conserver les plus complètes pour les sections communes\n\n';

        plan += '**Commande** :\n';
        plan += '```bash\n';
        plan += `npx ts-node scripts/merge-files.ts ${merge.files.join(
          ' '
        )} --output=${path.dirname(merge.files[0])}/${path
          .basename(merge.files[0])
          .replace('.v1', '')}\n`;
        plan += '```\n\n';
      }
    } else {
      plan += `✅ Aucune fusion d'audit suggérée.\n\n`;
    }

    plan += '## Fichiers de backlog\n\n';

    const backlogMerges = this.result.mergeSuggestions.filter((suggestion) =>
      suggestion.files.some((file) => file.includes('.backlog.json'))
    );

    if (backlogMerges.length > 0) {
      for (const merge of backlogMerges) {
        const files = merge.files.map((file) => path.basename(file));
        plan += `### Fusion : ${files.join(' + ')}\n\n`;
        plan += `- **Similarité** : ${(merge.similarity * 100).toFixed(0)}%\n`;
        plan += `- **Raison** : ${merge.reason}\n`;
        plan += '- **Stratégie** : Combiner les tâches uniques, éviter les doublons\n\n';

        plan += '**Commande** :\n';
        plan += '```bash\n';
        plan += `npx ts-node scripts/merge-backlogs.ts ${merge.files.join(
          ' '
        )} --output=${path.dirname(merge.files[0])}/${path
          .basename(merge.files[0])
          .replace('.v1', '')}\n`;
        plan += '```\n\n';
      }
    } else {
      plan += '✅ Aucune fusion de backlog suggérée.\n\n';
    }

    // Plan de suppression
    plan += '## Plan de suppression après fusion\n\n';
    plan += 'Une fois les fusions effectuées, les fichiers originaux peuvent être supprimés :\n\n';

    for (const suggestion of this.result.mergeSuggestions) {
      // Conserver le premier fichier (destination de la fusion)
      const filesToDelete = suggestion.files.slice(1);

      for (const file of filesToDelete) {
        plan += `- \`${path.basename(file)}\`\n`;
      }
    }

    return plan;
  }

  /**
   * Génère un plan de suppression
   */
  public generateDeletionPlan(): string {
    let plan = '# 🗑️ Plan de suppression des fichiers obsolètes\n\n';

    if (this.result.filesToDelete.length === 0) {
      plan += '✅ Aucun fichier à supprimer.\n';
      return plan;
    }

    plan +=
      'Ce document présente un plan pour nettoyer les fichiers obsolètes du cahier des charges.\n\n';

    // Regrouper par raison de suppression
    const byReason: Record<string, string[]> = {};

    for (const item of this.result.filesToDelete) {
      if (!byReason[item.reason]) {
        byReason[item.reason] = [];
      }

      byReason[item.reason].push(item.file);
    }

    // Générer le plan par raison
    for (const [reason, files] of Object.entries(byReason)) {
      plan += `## ${reason}\n\n`;

      for (const file of files) {
        plan += `- \`${path.basename(file)}\`\n`;
      }

      plan += '\n**Commande** :\n';
      plan += '```bash\n';
      plan += `rm ${files.map((f) => `"${f}"`).join(' ')}\n`;
      plan += '```\n\n';
    }

    return plan;
  }

  /**
   * Sauvegarde les rapports générés
   */
  public async saveReports(): Promise<void> {
    console.log('💾 Sauvegarde des rapports...');

    try {
      // Créer le répertoire de rapports
      const reportsDir = path.join(this.cahierDir, 'reports');
      await fs.mkdir(reportsDir, { recursive: true });

      // Générer et sauvegarder le rapport de qualité
      const qualityReport = this.generateQualityReport();
      await fs.writeFile(path.join(reportsDir, 'controle_qualite_cahier.md'), qualityReport);
      console.log('✅ Rapport de qualité sauvegardé');

      // Générer et sauvegarder le discovery map nettoyé
      const cleanedMap = this.generateCleanedDiscoveryMap();
      await fs.writeFile(
        path.join(reportsDir, 'discovery_map.cleaned.json'),
        JSON.stringify(cleanedMap, null, 2)
      );
      console.log('✅ Discovery map nettoyé sauvegardé');

      // Générer et sauvegarder le plan de fusion
      const mergePlan = this.generateMergePlan();
      await fs.writeFile(path.join(reportsDir, 'cahier_fusion_plan.md'), mergePlan);
      console.log('✅ Plan de fusion sauvegardé');

      // Générer et sauvegarder le plan de suppression
      const deletionPlan = this.generateDeletionPlan();
      await fs.writeFile(path.join(reportsDir, 'cahier_suppression_plan.md'), deletionPlan);
      console.log('✅ Plan de suppression sauvegardé');

      // Sauvegarder les résultats complets au format JSON
      await fs.writeFile(
        path.join(reportsDir, 'verification_results.json'),
        JSON.stringify(this.result, null, 2)
      );
      console.log('✅ Résultats complets sauvegardés');

      console.log(`📁 Tous les rapports ont été sauvegardés dans ${reportsDir}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde des rapports: ${error.message}`);
    }
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    console.log('🚀 Démarrage de la vérification du cahier des charges...');

    // Récupérer les arguments
    const args = process.argv.slice(2);
    let legacyDir = '/workspaces/cahier-des-charge/legacy';
    let cahierDir = '/workspaces/cahier-des-charge';
    let discoveryMapPath = '/workspaces/cahier-des-charge/discovery_map.json';

    // Traiter les arguments
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--legacy-dir' && i + 1 < args.length) {
        legacyDir = args[i + 1];
        i++;
      } else if (args[i] === '--cahier-dir' && i + 1 < args.length) {
        cahierDir = args[i + 1];
        i++;
      } else if (args[i] === '--discovery-map' && i + 1 < args.length) {
        discoveryMapPath = args[i + 1];
        i++;
      }
    }

    // Créer et exécuter le vérificateur
    const verifier = new CahierDesChargesVerifier(legacyDir, cahierDir, discoveryMapPath);
    await verifier.verify();

    // Sauvegarder les rapports
    await verifier.saveReports();

    console.log('✅ Vérification terminée avec succès');
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { CahierDesChargesVerifier };
