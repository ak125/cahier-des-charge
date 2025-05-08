import * as fs from 'fs';
import * as path from 'path';

interface DataSource {
  type: string;
  description: string;
  location: string;
  line?: number;
}

interface DataOutput {
  type: string;
  details: string;
  lineRange?: [number, number] | string;
}

interface SqlQuery {
  query: string;
  type: string;
  tables: string[];
  complexity: 'simple' | 'moyenne' | 'complexe';
  line: number;
  warning?: boolean;
}

interface DataAnalysisResult {
  sources: DataSource[];
  outputs: DataOutput[];
  sqlQueries: SqlQuery[];
  sqlScore: number;
  mixedOutput: boolean;
}

class DataAnalyzer {
  private phpContent: string;
  private filePath: string;
  private fileBaseName: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.fileBaseName = path.basename(filePath);
    this.phpContent = fs.readFileSync(filePath, 'utf8');
  }

  public async analyze(): Promise<DataAnalysisResult> {
    const sources = this.analyzeSources();
    const outputs = this.analyzeOutputs();
    const sqlQueries = this.analyzeSqlQueries();
    const sqlScore = this.calculateSqlScore(sqlQueries);

    // Détecter si le fichier a des sorties mixtes (HTML + JSON par exemple)
    const mixedOutput = this.detectMixedOutput(outputs);

    return {
      sources,
      outputs,
      sqlQueries,
      sqlScore,
      mixedOutput,
    };
  }

  private analyzeSources(): DataSource[] {
    const sources: DataSource[] = [];
    const lines = this.phpContent.split('\n');

    // Définir les motifs de recherche pour chaque type de source
    const patterns = [
      { regex: /\$_GET\['([^']+)'\]/, type: '$_GET', description: "Données passées par l'URL" },
      { regex: /\$_POST\['([^']+)'\]/, type: '$_POST', description: 'Formulaire POST' },
      { regex: /\$_SESSION\['([^']+)'\]/, type: '$_SESSION', description: 'Session utilisateur' },
      { regex: /\$_FILES\['([^']+)'\]/, type: '$_FILES', description: 'Upload de fichier' },
      {
        regex: /\$_COOKIE\['([^']+)'\]/,
        type: '$_COOKIE',
        description: 'Données persistantes navigateur',
      },
      { regex: /setcookie\(/, type: '$_COOKIE', description: 'Manipulation de cookie' },
    ];

    // Parcourir chaque ligne pour détecter les sources
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of patterns) {
        const matches = line.match(pattern.regex);
        if (matches) {
          // Vérifier si cette source existe déjà avec le même nom de variable
          const param = matches[1] ? matches[1] : '';
          const locationText = `ligne ${i + 1}${
            param ? ' : ' + pattern.type + "['" + param + "']" : ''
          }`;

          const existingSource = sources.find(
            (source) => source.type === pattern.type && source.location.includes(param)
          );

          if (!existingSource) {
            sources.push({
              type: pattern.type,
              description: pattern.description,
              location: locationText,
              line: i + 1,
            });
          }
        }
      }
    }

    return sources;
  }

  private analyzeOutputs(): DataOutput[] {
    const outputs: DataOutput[] = [];
    const lines = this.phpContent.split('\n');

    // Détecter les blocs HTML
    let inHtmlBlock = false;
    let htmlBlockStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Détecter les sorties JSON
      if (line.match(/json_encode\(/)) {
        outputs.push({
          type: 'JSON',
          details: 'Via json_encode',
          lineRange: `ligne ${i + 1} : echo json_encode(...)`,
        });
      }

      // Détecter les redirections
      if (line.match(/header\(['"']Location:/)) {
        outputs.push({
          type: 'Redirection',
          details: "header('Location: ...')",
          lineRange: `ligne ${i + 1}`,
        });
      }

      // Détecter les headers HTTP
      if (line.match(/header\(/) && !line.match(/header\(['"']Location:/)) {
        outputs.push({
          type: 'Headers HTTP',
          details: 'Content-Type, Set-Cookie, etc.',
          lineRange: `ligne ${i + 1}`,
        });
      }

      // Détection des blocs HTML
      const isStartHtml = line.match(/<html|<body|<div|<p|<table/) && !inHtmlBlock;
      if (isStartHtml) {
        inHtmlBlock = true;
        htmlBlockStart = i + 1;
      }

      const isEndHtml = line.match(/<\/html|<\/body|<\/div>$|<\/p>$|<\/table>$/) && inHtmlBlock;
      if (isEndHtml || (inHtmlBlock && i === lines.length - 1)) {
        outputs.push({
          type: 'HTML',
          details: 'Blocs HTML intégrés dans le script',
          lineRange: `lignes ${htmlBlockStart} à ${i + 1}`,
        });
        inHtmlBlock = false;
      }
    }

    // Vérifier si le fichier retourne des fichiers
    const hasFileOutput = this.phpContent.match(
      /readfile\(|fpassthru\(|header\(['"]Content-Disposition: attachment/
    );
    if (hasFileOutput) {
      outputs.push({
        type: 'Fichiers',
        details: 'Fichiers retournés via readfile/fpassthru',
        lineRange: 'diverses',
      });
    }

    return outputs;
  }

  private analyzeSqlQueries(): SqlQuery[] {
    const sqlQueries: SqlQuery[] = [];
    const lines = this.phpContent.split('\n');

    // Expressions régulières pour différents types de requêtes SQL
    const selectRegex = /SELECT\s+.+?\s+FROM\s+(\w+)(\s+JOIN\s+(\w+))?/i;
    const insertRegex = /INSERT\s+INTO\s+(\w+)/i;
    const updateRegex = /UPDATE\s+(\w+)\s+SET/i;
    const deleteRegex = /DELETE\s+FROM\s+(\w+)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extraire les requêtes SQL du code
      let match;
      let type = '';
      const tables: string[] = [];
      let complexity: 'simple' | 'moyenne' | 'complexe' = 'simple';
      let warning = false;

      if ((match = line.match(selectRegex))) {
        type = 'Read';
        tables.push(match[1]); // Table principale

        // Vérifier s'il y a des JOIN
        if (match[3]) {
          tables.push(match[3]); // Table jointe
          complexity = 'complexe';
          warning = true;
        }

        // Vérifier la complexité
        if (line.includes('WHERE') && line.includes('ORDER BY')) {
          complexity = 'moyenne';
        }
      } else if ((match = line.match(insertRegex))) {
        type = 'Create';
        tables.push(match[1]);
        complexity = 'moyenne';
      } else if ((match = line.match(updateRegex))) {
        type = 'Update';
        tables.push(match[1]);
        complexity = 'moyenne';
      } else if ((match = line.match(deleteRegex))) {
        type = 'Delete';
        tables.push(match[1]);
        complexity = 'moyenne';
      }

      // Si une requête a été détectée
      if (type && tables.length > 0) {
        // Extraire une partie de la requête pour l'affichage
        const query = line.trim().substring(0, 40) + (line.length > 40 ? '...' : '');

        sqlQueries.push({
          query,
          type,
          tables,
          complexity,
          line: i + 1,
          warning,
        });
      }
    }

    return sqlQueries;
  }

  private calculateSqlScore(queries: SqlQuery[]): number {
    if (queries.length === 0) return 3; // Score parfait s'il n'y a pas de requêtes SQL

    let score = 3.0;

    // Pénalités pour différents problèmes
    const usesRawQueries = queries.length > 0;
    const hasComplexJoins = queries.some((q) => q.complexity === 'complexe');
    const hasPotentialInjection = this.phpContent.match(/\$_GET|\$_POST.*[^?]"/);
    const usesWildcardSelect = queries.some((q) => q.query.match(/SELECT\s+\*/i));

    if (usesRawQueries) score -= 0.3;
    if (hasComplexJoins) score -= 0.3;
    if (hasPotentialInjection) score -= 0.8;
    if (usesWildcardSelect) score -= 0.3;

    // Pénalité supplémentaire pour de nombreuses requêtes
    if (queries.length > 5) score -= 0.2;

    // Arrondir à une décimale et s'assurer que le score est entre 0 et 3
    score = Math.round(score * 10) / 10;
    score = Math.max(0, Math.min(3, score));

    return score;
  }

  private detectMixedOutput(outputs: DataOutput[]): boolean {
    const hasHtml = outputs.some((o) => o.type === 'HTML');
    const hasJson = outputs.some((o) => o.type === 'JSON');

    return hasHtml && hasJson;
  }

  /**
   * Générer la section Données pour le fichier audit.md
   */
  public async generateAuditSection(): Promise<string> {
    const analysis = await this.analyze();

    // Formater les sources de données
    let sourcesText = '';
    if (analysis.sources.length > 0) {
      sourcesText = analysis.sources
        .map(
          (source) =>
            `- ${source.type}${source.location.includes(':') ? source.location.split(':')[1] : ''}`
        )
        .join('\n');
    } else {
      sourcesText = '- Aucune entrée de données détectée';
    }

    // Formater les sorties
    let outputsText = '';
    if (analysis.outputs.length > 0) {
      outputsText = analysis.outputs
        .map((output) => `- ${output.type} (${output.details})`)
        .join('\n');
    } else {
      outputsText = '- Aucune sortie détectée';
    }

    // Formater les requêtes SQL
    let sqlText = '';
    if (analysis.sqlQueries.length > 0) {
      sqlText =
        '| Requête | Type | Tables | Complexité |\n|--------|------|--------|------------|\n';
      sqlText += analysis.sqlQueries
        .map(
          (query) =>
            `| \`${query.query}\` | ${query.type} | ${query.tables.join(', ')} | ${
              query.warning ? '⚠️ ' : ''
            }${query.complexity} |`
        )
        .join('\n');
    } else {
      sqlText = 'Aucune requête SQL détectée';
    }

    // Générer la section complète
    return `## 3. Données

### 3.1. Sources d'entrée
${sourcesText}
${
  analysis.sources.length > 0
    ? `> Fichier lit des données${
        analysis.sources.some((s) => s.type === '$_SESSION')
          ? " d'authentification via SESSION"
          : ''
      }${
        analysis.sources.some((s) => s.type === '$_GET' || s.type === '$_POST')
          ? ' et gère des paramètres URL/POST'
          : ''
      }.`
    : ''
}

### 3.2. Sorties produites
${outputsText}
${
  analysis.mixedOutput
    ? '\n> ⚠️ Sortie mixte HTML + JSON → séparation à prévoir dans la migration'
    : ''
}

### 3.3. Requêtes SQL
${sqlText}

> 🔍 Analyse SQL brute : **${analysis.sqlScore.toFixed(1)} / 3**${
      analysis.sqlScore < 2.0
        ? ' — optimisations nécessaires via Prisma'
        : analysis.sqlScore < 3.0
          ? ' — optimisations possibles via Prisma'
          : " — pas d'optimisation nécessaire"
    }`;
  }

  /**
   * Mettre à jour le fichier backlog.json avec les résultats de l'analyse
   */
  public async updateBacklog(): Promise<void> {
    const analysis = await this.analyze();
    const backlogPath = this.filePath.replace('.php', '.backlog.json');

    let backlog: any = {
      file: this.fileBaseName,
      priority: 5,
      status: 'to-do',
      tasks: [],
    };

    // Charger le backlog existant s'il existe
    try {
      if (fs.existsSync(backlogPath)) {
        backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du backlog: ${error}`);
    }

    // Ajouter les tâches en fonction de l'analyse
    const existingTasks = backlog.tasks.map((t: any) => t.type);

    // Tâche pour les sources d'entrée
    if (analysis.sources.length > 0 && !existingTasks.includes('refactorEntrypoints')) {
      backlog.tasks.push({
        type: 'refactorEntrypoints',
        target: 'backend',
        status: 'pending',
        description: `Refactoriser les entrées de données (${analysis.sources
          .map((s) => s.type)
          .join(', ')})`,
      });
    }

    // Tâche pour la session
    if (
      analysis.sources.some((s) => s.type === '$_SESSION') &&
      !existingTasks.includes('sanitizeSessionAccess')
    ) {
      backlog.tasks.push({
        type: 'sanitizeSessionAccess',
        target: 'backend',
        status: 'pending',
        description: "Sécuriser l'accès aux données de session",
      });
    }

    // Tâche pour les requêtes SQL
    if (analysis.sqlQueries.length > 0 && !existingTasks.includes('migrateSQLtoPrisma')) {
      backlog.tasks.push({
        type: 'migrateSQLtoPrisma',
        target: 'backend',
        status: 'pending',
        description: `Migrer les requêtes SQL vers Prisma (${analysis.sqlQueries.length} requêtes)`,
      });
    }

    // Tâche pour la sortie mixte
    if (analysis.mixedOutput && !existingTasks.includes('separateOutputs')) {
      backlog.tasks.push({
        type: 'separateOutputs',
        target: 'frontend',
        status: 'pending',
        description: 'Séparer les sorties HTML et API (actuellement mixtes)',
      });
    }

    // Ajouter des métadonnées d'analyse
    backlog.data_analysis = {
      input_sources: analysis.sources.length,
      output_types: analysis.outputs.map((o) => o.type),
      sql_queries: analysis.sqlQueries.length,
      sql_score: analysis.sqlScore,
      mixed_output: analysis.mixedOutput,
    };

    // Écrire le backlog mis à jour
    fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  }

  /**
   * Générer un graphe d'impact SQL
   */
  public async generateSqlImpactGraph(): Promise<void> {
    const analysis = await this.analyze();

    // Ne créer le graphe que s'il y a des requêtes SQL
    if (analysis.sqlQueries.length === 0) return;

    const impactGraphPath = this.filePath.replace('.php', '.sql_access_map.json');

    // Collecter toutes les tables utilisées
    const tables = new Set<string>();
    analysis.sqlQueries.forEach((query) => {
      query.tables.forEach((table) => tables.add(table));
    });

    // Créer le graphe d'impact
    const impactGraph = {
      file: this.fileBaseName,
      tables: Array.from(tables),
      access_patterns: analysis.sqlQueries.map((query) => ({
        type: query.type,
        tables: query.tables,
        complexity: query.complexity,
      })),
    };

    // Écrire le graphe d'impact
    fs.writeFileSync(impactGraphPath, JSON.stringify(impactGraph, null, 2));
  }
}

// Point d'entrée du script si exécuté directement
if (require.main === module) {
  if (process.argv.length < 3) {
    console.error('Usage: node agent-donnees.ts <file-path>');
    process.exit(1);
  }

  const filePath = process.argv[2];
  const analyzer = new DataAnalyzer(filePath);

  analyzer
    .generateAuditSection()
    .then((section) => {
      console.log(section);
      return analyzer.updateBacklog();
    })
    .then(() => {
      return analyzer.generateSqlImpactGraph();
    })
    .then(() => {
      console.log(`Analyse des données terminée pour ${filePath}`);
    })
    .catch((error) => {
      console.error(`Erreur: ${error}`);
      process.exit(1);
    });
}

export { DataAnalyzer };
