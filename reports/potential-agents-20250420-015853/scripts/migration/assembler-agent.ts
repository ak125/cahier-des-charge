import * as path from 'path';
import * as fs from 'fs/promises';

// Interfaces pour les données d'entrée
interface AuditSection {
  id: string;
  title: string;
  content: string;
  type: 'business' | 'technical' | 'sql' | 'security' | 'seo' | 'routing' | 'dependencies';
  severity?: 'info' | 'warning' | 'critical';
  source?: string;
}

interface DiscoveryMapItem {
  id: string;
  priority: number;
  dependencies?: string[];
}

interface SqlSchemaDiff {
  table: string;
  oldColumnName: string;
  newColumnName: string;
  type?: string;
}

// Interfaces pour les données de sortie
interface BacklogTask {
  type: string;
  target: string;
  status: string;
  description?: string;
  priority?: number;
}

interface BacklogOutput {
  file: string;
  priority: number;
  status: string;
  tasks: BacklogTask[];
}

interface ImpactNode {
  id: string;
  type: string;
  priority?: number;
}

interface ImpactGraph {
  nodes: string[];
  edges: [string, string][];
}

interface MigrationStep {
  id: number;
  status: string;
  title: string;
  description: string;
  tasks?: string[];
  dependencies?: number[];
}

class AssemblerAgent {
  private filePath: string;
  private auditSections: AuditSection[] = [];
  private discoveryMap: DiscoveryMapItem[] = [];
  private sqlDiffs: SqlSchemaDiff[] = [];
  private feedback = '';

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Charge tous les fichiers d'entrée nécessaires
   */
  public async loadInputs(): Promise<void> {
    const baseFilename = path.basename(this.filePath);
    const dirPath = path.dirname(this.filePath);

    try {
      // Charger les sections d'audit
      const auditSectionsPath = path.join(dirPath, `${baseFilename}.audit.sections.json`);
      const auditSectionsData = await fs.readFile(auditSectionsPath, 'utf8');
      this.auditSections = JSON.parse(auditSectionsData);

      // Charger la discovery map si disponible
      try {
        const discoveryMapPath = path.join(dirPath, 'discovery_map.json');
        const discoveryMapData = await fs.readFile(discoveryMapPath, 'utf8');
        this.discoveryMap = JSON.parse(discoveryMapData);
      } catch (error) {
        console.log('Discovery map non disponible, utilisation des priorités par défaut');
      }

      // Charger les différences de schéma SQL si disponibles
      try {
        const sqlDiffPath = path.join(dirPath, 'schema_migration_diff.json');
        const sqlDiffData = await fs.readFile(sqlDiffPath, 'utf8');
        this.sqlDiffs = JSON.parse(sqlDiffData);
      } catch (error) {
        console.log('Différences de schéma SQL non disponibles');
      }

      // Charger les feedbacks manuels si disponibles
      try {
        const feedbackPath = path.join(dirPath, `${baseFilename}.feedback.md`);
        this.feedback = await fs.readFile(feedbackPath, 'utf8');
      } catch (error) {
        this.feedback = '';
      }
    } catch (error) {
      throw new Error(`Erreur lors du chargement des fichiers d'entrée: ${error.message}`);
    }
  }

  /**
   * Génère le fichier d'audit markdown
   */
  public generateAuditMarkdown(): string {
    const baseFilename = path.basename(this.filePath);
    let markdown = `## 🧩 Audit IA - ${baseFilename}\n\n`;

    // Regrouper les sections par type
    const sectionsByType = this.auditSections.reduce(
      (acc, section) => {
        if (!acc[section.type]) {
          acc[section.type] = [];
        }
        acc[section.type].push(section);
        return acc;
      },
      {} as Record<string, AuditSection[]>
    );

    // Générer les sections dans un ordre spécifique
    const typeOrder = [
      'business',
      'technical',
      'sql',
      'security',
      'seo',
      'routing',
      'dependencies',
    ];
    const typeEmojis = {
      business: '🔍',
      technical: '🧱',
      sql: '🧮',
      security: '🔐',
      seo: '🌐',
      routing: '🧭',
      dependencies: '🔗',
    };

    const typeTitles = {
      business: 'Fonction métier',
      technical: 'Structure technique',
      sql: 'SQL détecté',
      security: 'Sécurité',
      seo: 'SEO',
      routing: 'Routing',
      dependencies: 'Dépendances',
    };

    typeOrder.forEach((type) => {
      if (sectionsByType[type]?.length) {
        markdown += `### ${typeEmojis[type]} ${typeTitles[type]}\n`;

        sectionsByType[type].forEach((section) => {
          markdown += section.content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .join('\n');
          markdown += '\n\n';
        });
      }
    });

    // Ajouter des commentaires de feedback si disponibles
    if (this.feedback) {
      markdown += `### 💬 Feedback manuel\n${this.feedback}\n\n`;
    }

    // Ajouter des informations sur les différences de schéma SQL
    if (this.sqlDiffs.length > 0) {
      markdown += `### 🔄 Changements de schéma SQL détectés\n`;
      this.sqlDiffs.forEach((diff) => {
        markdown += `- Table \`${diff.table}\`: \`${diff.oldColumnName}\` renommé en \`${diff.newColumnName}\`\n`;
      });
      markdown += '\n';
    }

    return markdown.trim();
  }

  /**
   * Génère le fichier de backlog JSON
   */
  public generateBacklogJson(): BacklogOutput {
    const baseFilename = path.basename(this.filePath);

    // Déterminer la priorité du fichier
    const fileEntry = this.discoveryMap.find((item) => item.id === baseFilename);
    const priority = fileEntry?.priority || 5;

    // Déduire les tâches nécessaires à partir des sections d'audit
    const tasks: BacklogTask[] = [];

    // Vérifier si une section SQL existe pour générer des tâches de DTO
    if (this.auditSections.some((section) => section.type === 'sql')) {
      tasks.push({
        type: 'generate.dto',
        target: 'backend',
        status: 'pending',
      });
      tasks.push({
        type: 'validate.sql',
        target: 'prisma',
        status: 'pending',
      });
    }

    // Vérifier si des sections métier existent pour générer des contrôleurs
    if (this.auditSections.some((section) => section.type === 'business')) {
      tasks.push({
        type: 'generate.controller',
        target: 'backend',
        status: 'pending',
      });
    }

    // Ajouter les tâches frontend par défaut
    tasks.push({
      type: 'generate.loader',
      target: 'frontend',
      status: 'pending',
    });
    tasks.push({
      type: 'generate.tsx',
      target: 'frontend',
      status: 'pending',
    });

    // Ajouter des tâches de sécurité si des problèmes ont été détectés
    const securitySections = this.auditSections.filter(
      (section) => section.type === 'security' && section.severity === 'critical'
    );

    if (securitySections.length > 0) {
      tasks.push({
        type: 'fix.security',
        target: 'backend',
        status: 'urgent',
        description: `Corriger ${securitySections.length} failles de sécurité critiques`,
      });
    }

    return {
      file: baseFilename,
      priority,
      status: 'audited',
      tasks,
    };
  }

  /**
   * Génère le graphe d'impact JSON
   */
  public generateImpactGraph(): ImpactGraph {
    const baseFilename = path.basename(this.filePath);
    const nodes: string[] = [baseFilename];
    const edges: [string, string][] = [];

    // Extraire les dépendances à partir des sections d'audit
    const dependencySections = this.auditSections.filter(
      (section) => section.type === 'dependencies'
    );

    // Analyser le contenu pour trouver des références à d'autres fichiers
    dependencySections.forEach((section) => {
      const content = section.content;
      // Rechercher des patterns comme "inclut file.php", "dépend de file.php", etc.
      const dependencyRegex =
        /(?:inclut|dépend de|référence|importe|utilise|require|include)\s+([a-zA-Z0-9_\-.\/]+\.(?:php|js|ts|jsx|tsx))/g;
      let match;

      while ((match = dependencyRegex.exec(content)) !== null) {
        const dependency = match[1];
        if (!nodes.includes(dependency)) {
          nodes.push(dependency);
        }
        edges.push([baseFilename, dependency]);
      }
    });

    // Ajouter des dépendances depuis la discovery map
    const fileEntry = this.discoveryMap.find((item) => item.id === baseFilename);
    if (fileEntry?.dependencies) {
      fileEntry.dependencies.forEach((dependency) => {
        if (!nodes.includes(dependency)) {
          nodes.push(dependency);
        }
        edges.push([baseFilename, dependency]);
      });
    }

    // Déduire la structure MVC/controller potentielle
    const controllerName = baseFilename.replace('.php', 'Controller');
    const potentialController = `controller/${controllerName}`;
    nodes.push(potentialController);
    edges.push([baseFilename, potentialController]);

    return { nodes, edges };
  }

  /**
   * Génère le plan de migration markdown
   */
  public generateMigrationPlan(): string {
    const baseFilename = path.basename(this.filePath);
    let markdown = `## 📦 Plan de migration ${baseFilename}\n\n`;

    // Étapes de base du plan de migration
    const steps = [{ status: '✅', title: 'Audit multi-agent terminé' }];

    // Ajouter des étapes en fonction des différences SQL
    if (this.sqlDiffs.length > 0) {
      const diffExamples = this.sqlDiffs
        .slice(0, 2)
        .map((diff) => `${diff.oldColumnName} ≠ ${diff.newColumnName}`)
        .join(', ');

      steps.push({
        status: '🔄',
        title: `Synchronisation avec Prisma (${diffExamples}${
          this.sqlDiffs.length > 2 ? ', ...' : ''
        })`,
      });
    }

    // Générer les étapes de la phase de construction
    steps.push({ status: '🛠', title: 'Génération :' });

    // Déduire les sous-tâches de génération à partir du backlog
    const backlog = this.generateBacklogJson();
    const generationTasks = backlog.tasks
      .filter((task) => task.type.startsWith('generate.'))
      .map((task) => {
        const entityType = task.type.split('.')[1];
        switch (entityType) {
          case 'dto':
            return `DTO : ${baseFilename.replace('.php', 'Dto')}`;
          case 'controller':
            return `Controller NestJS : ${baseFilename.replace('.php', '.controller.ts')}`;
          case 'tsx':
            return `Route Remix : app/routes/${baseFilename.replace('.php', '.$slug.tsx')}`;
          case 'loader':
            return 'Loader + Meta';
          default:
            return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
        }
      });

    // Ajouter les sous-tâches de génération avec une indentation
    generationTasks.forEach((task) => {
      markdown += `   - ${task}\n`;
    });

    // Ajouter l'étape de tests
    markdown += '4. 🧪 Tests\n';
    markdown += '   - Unitaires NestJS (Jest)\n';
    markdown += `   - E2E avec Mock ${baseFilename.replace('.php', '')}\n`;

    // Ajouter l'étape de PR
    markdown += "5. 🚀 PR : `migration/${baseFilename.replace('.php', '')}`\n";
    markdown += '   - Base : `dev`\n';
    markdown += '   - Assigné : `@dev-fafa`\n';

    return markdown;
  }

  /**
   * Génère tous les fichiers de sortie et les écrit sur le disque
   */
  public async generateOutputs(): Promise<void> {
    const baseFilename = path.basename(this.filePath);
    const dirPath = path.dirname(this.filePath);

    try {
      // Générer et écrire le fichier d'audit markdown
      const auditContent = this.generateAuditMarkdown();
      await fs.writeFile(path.join(dirPath, `${baseFilename}.audit.md`), auditContent, 'utf8');

      // Générer et écrire le fichier de backlog JSON
      const backlogContent = this.generateBacklogJson();
      await fs.writeFile(
        path.join(dirPath, `${baseFilename}.backlog.json`),
        JSON.stringify(backlogContent, null, 2),
        'utf8'
      );

      // Générer et écrire le fichier de graphe d'impact JSON
      const impactGraph = this.generateImpactGraph();
      await fs.writeFile(
        path.join(dirPath, `${baseFilename}.impact_graph.json`),
        JSON.stringify(impactGraph, null, 2),
        'utf8'
      );

      // Générer et écrire le fichier de plan de migration markdown
      const migrationPlan = this.generateMigrationPlan();
      await fs.writeFile(
        path.join(dirPath, `${baseFilename}.migration_plan.md`),
        migrationPlan,
        'utf8'
      );

      console.log(`✅ Tous les fichiers de sortie ont été générés pour ${baseFilename}`);
    } catch (error) {
      throw new Error(`Erreur lors de la génération des fichiers de sortie: ${error.message}`);
    }
  }

  /**
   * Exécute le processus complet d'assemblage
   */
  public async process(): Promise<void> {
    try {
      await this.loadInputs();
      await this.generateOutputs();
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${this.filePath}: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Point d'entrée principal de l'agent assembleur
 */
async function main(): Promise<void> {
  // Récupérer le chemin du fichier à partir des arguments de ligne de commande
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('❌ Veuillez spécifier le chemin du fichier PHP à analyser');
    process.exit(1);
  }

  const filePath = args[0];
  try {
    const assembler = new AssemblerAgent(filePath);
    await assembler.process();
    console.log(`✅ Traitement terminé pour ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors du traitement: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter l'agent si le script est appelé directement
if (require.main === module) {
  main();
}

export { AssemblerAgent };
