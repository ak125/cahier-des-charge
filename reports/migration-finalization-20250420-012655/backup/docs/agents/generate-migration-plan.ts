import * as fs from 'fs';
import * as path from 'path';

interface DependencyInfo {
  usedBy: string[];
  uses: string[];
  module?: string;
  impact_level: 'faible' | 'moyen' | 'élevé';
}

interface SecurityScore {
  security: number;
  quality: number;
  overall: number;
}

interface AuditData {
  fileName: string;
  role?: string;
  structure?: {
    score?: number;
    type?: string;
  };
  data?: {
    sql_score?: number;
    data_sources?: string[];
    output_types?: string[];
  };
  dependencies?: DependencyInfo;
  security?: SecurityScore;
}

interface MigrationTask {
  id: string;
  description: string;
  type: 'refactor' | 'create' | 'migrate' | 'test';
  target: 'backend' | 'frontend' | 'data' | 'shared';
  priority: number;
  dependencies?: string[];
}

interface MigrationPlan {
  file: string;
  difficulty: 'faible' | 'moyenne' | 'élevée' | 'critique';
  impactScore: number;
  complexity: number;
  qualityIssues: boolean;
  securityIssues: boolean;
  migrationScore: number;
  migrationWave: number;
  needsRefactoringFirst: boolean;
  backendTarget: string[];
  frontendTarget: string[];
  tasks: MigrationTask[];
  immediateTasks: string[];
  anticipatedIssues: string[];
}

class MigrationPlanGenerator implements BaseAgent, BusinessAgent {
  private filePath: string;
  private fileName: string;
  private audit: AuditData;
  private backlog: any;
  private riskScore: any;
  private impactGraph: any;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.fileName = path.basename(filePath);
    this.audit = { fileName: this.fileName };
    this.loadData();
  }

  private loadData(): void {
    // Load audit data if it exists
    const auditPath = this.filePath.replace('.php', '.audit.md');
    if (fs.existsSync(auditPath)) {
      const auditContent = fs.readFileSync(auditPath, 'utf8');
      this.extractDataFromAudit(auditContent);
    }

    // Load backlog if it exists
    const backlogPath = this.filePath.replace('.php', '.backlog.json');
    if (fs.existsSync(backlogPath)) {
      this.backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
    } else {
      this.backlog = { file: this.fileName, tasks: [] };
    }

    // Load risk score if it exists
    const riskScorePath = this.filePath.replace('.php', '.risk_score.json');
    if (fs.existsSync(riskScorePath)) {
      this.riskScore = JSON.parse(fs.readFileSync(riskScorePath, 'utf8'));
    }

    // Load impact graph if it exists
    const impactGraphPath = this.filePath.replace('.php', '.impact_graph.json');
    if (fs.existsSync(impactGraphPath)) {
      this.impactGraph = JSON.parse(fs.readFileSync(impactGraphPath, 'utf8'));
    }
  }

  private extractDataFromAudit(auditContent: string): void {
    // Extract role
    const roleMatch = auditContent.match(/## 1️⃣ Rôle métier principal\s*\n\s*(.*?)(?:\n\s*\n|\n\s*##)/s);
    if (roleMatch) {
      this.audit.role = roleMatch[1].trim();
    }

    // Extract structure info
    const structureScoreMatch = auditContent.match(/Qualité structurelle estimée\s*:\s*\*\*([0-9.]+)\s*\/\s*3\*\*/);
    const structureTypeMatch = auditContent.match(/Type dominant\s*:\s*`([^`]+)`/);
    
    this.audit.structure = {
      score: structureScoreMatch ? parseFloat(structureScoreMatch[1]) : undefined,
      type: structureTypeMatch ? structureTypeMatch[1] : undefined
    };

    // Extract data info
    const sqlScoreMatch = auditContent.match(/Analyse SQL brute\s*:\s*\*\*([0-9.]+)\s*\/\s*3\*\*/);
    this.audit.data = {
      sql_score: sqlScoreMatch ? parseFloat(sqlScoreMatch[1]) : undefined,
      data_sources: [],
      output_types: []
    };

    // Extract security scores if available
    const securityScoreMatch = auditContent.match(/Score de sécurité IA \(0 à 10\)\s*:\s*([0-9.]+)/);
    const qualityScoreMatch = auditContent.match(/Qualité technique\s*:\s*([0-9.]+)\/10/);
    const overallScoreMatch = auditContent.match(/Score global\s*:\s*([0-9.]+)\/10/);
    
    if (securityScoreMatch || qualityScoreMatch || overallScoreMatch) {
      this.audit.security = {
        security: securityScoreMatch ? parseFloat(securityScoreMatch[1]) : 5,
        quality: qualityScoreMatch ? parseFloat(qualityScoreMatch[1]) : 5,
        overall: overallScoreMatch ? parseFloat(overallScoreMatch[1]) : 5
      };
    }
  }

  public generateMigrationPlan(): MigrationPlan {
    // Calculate impact score
    const impactScore = this.calculateImpactScore();
    
    // Calculate complexity
    const complexity = this.calculateComplexity();
    
    // Determine difficulty
    const difficulty = this.determineDifficulty(impactScore, complexity);
    
    // Calculate migration score (0-5 scale)
    const migrationScore = this.calculateMigrationScore();
    
    // Determine migration wave
    const wave = this.determineMigrationWave(migrationScore, impactScore);
    
    // Check if refactoring is needed first
    const needsRefactoringFirst = this.needsRefactoringFirst();
    
    // Identify target components in NestJS/Remix
    const backendTarget = this.identifyBackendTargets();
    const frontendTarget = this.identifyFrontendTargets();
    
    // Generate migration tasks
    const tasks = this.generateMigrationTasks();
    
    // Generate immediate refactoring tasks
    const immediateTasks = this.generateImmediateRefactoringTasks();
    
    // Identify anticipated issues
    const anticipatedIssues = this.identifyAnticipatedIssues();
    
    return {
      file: this.fileName,
      difficulty,
      impactScore,
      complexity,
      qualityIssues: this.hasQualityIssues(),
      securityIssues: this.hasSecurityIssues(),
      migrationScore,
      migrationWave: wave,
      needsRefactoringFirst,
      backendTarget,
      frontendTarget,
      tasks,
      immediateTasks,
      anticipatedIssues
    };
  }

  private calculateImpactScore(): number {
    let score = 0;
    
    // If we have impact graph data
    if (this.impactGraph) {
      // Count files that use this file
      const usedByCount = this.impactGraph && this.impactGraph.usedBy ? this.impactGraph && this.impactGraph.usedBy.length : 0;
      
      // Add points based on how many files use this one
      if (usedByCount > 10) score += 5;
      else if (usedByCount > 5) score += 3;
      else if (usedByCount > 0) score += 1;
      
      // Add points based on impact level
      if (this.impactGraph.impact_level === 'élevé') score += 5;
      else if (this.impactGraph.impact_level === 'moyen') score += 3;
      else score += 1;
    }
    
    // Cap at 10
    return Math.min(score, 10);
  }

  private calculateComplexity(): number {
    let score = 0;
    
    // Base complexity from structure score
    if (this.audit.structure && this.audit.structure.score !== undefined) {
      // Invert the score since lower structure quality means higher complexity
      score += Math.max(0, 3 - this.audit.structure.score) * 2;
    }
    
    // Add complexity from SQL if available
    if (this.audit.data && this.audit.data.sql_score !== undefined) {
      // Invert the score since lower SQL quality means higher complexity
      score += Math.max(0, 3 - this.audit.data.sql_score) * 1.5;
    }
    
    // Add complexity from security issues
    if (this.riskScore) {
      // Lower security score means higher complexity
      score += Math.max(0, 10 - this.riskScore.scores.security) / 2;
    }
    
    // Cap at 10
    return Math.min(Math.round(score), 10);
  }

  private determineDifficulty(impactScore: number, complexity: number): 'faible' | 'moyenne' | 'élevée' | 'critique' {
    const totalScore = (impactScore + complexity) / 2;
    
    if (totalScore >= 8) return 'critique';
    if (totalScore >= 6) return 'élevée';
    if (totalScore >= 4) return 'moyenne';
    return 'faible';
  }

  private calculateMigrationScore(): number {
    // Calculate migration score on a 0-5 scale
    let couplageScore = this.impactGraph ? (this.impactGraph && this.impactGraph.usedBy.length / 3) : 0;
    couplageScore = Math.min(couplageScore, 5);
    
    let complexiteMetier = this.audit.role ? 
      (this.audit.role.includes('critique') || this.audit.role.includes('important') ? 4 : 
       this.audit.role.includes('secondaire') ? 2 : 3) : 3;
    
    let qualiteTechnique = this.audit.structure && this.audit.structure.score !== undefined ? 
      Math.max(0, 3 - this.audit.structure.score) * 1.67 : 2;
    
    let dependancesScore = this.impactGraph ? 
      (this.impactGraph.uses ? this.impactGraph.uses.length / 2 : 0) : 0;
    dependancesScore = Math.min(dependancesScore, 5);
    
    // Calculate volume score based on file size
    let volumeScore = 3; // Default
    try {
      const stats = fs.statSync(this.filePath);
      const sizeInKB = stats.size / 1024;
      if (sizeInKB > 100) volumeScore = 5;
      else if (sizeInKB > 50) volumeScore = 4;
      else if (sizeInKB > 20) volumeScore = 3;
      else if (sizeInKB > 10) volumeScore = 2;
      else volumeScore = 1;
    } catch (error) {
      // Just use default if there's an error
    }
    
    // Average all scores and round
    const scores = [
      couplageScore,
      complexiteMetier,
      qualiteTechnique,
      dependancesScore,
      volumeScore
    ];
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(avgScore);
  }

  private determineMigrationWave(migrationScore: number, impactScore: number): number {
    // Wave 1: Critical files with low complexity
    if (impactScore >= 7 && migrationScore <= 3) return 1;
    
    // Wave 2: Critical files with high complexity or high impact with medium complexity
    if (impactScore >= 7 || (impactScore >= 5 && migrationScore <= 4)) return 2;
    
    // Wave 3: Medium impact files
    if (impactScore >= 3) return 3;
    
    // Wave 4: Everything else
    return 4;
  }

  private needsRefactoringFirst(): boolean {
    // Check if file needs refactoring before migration
    
    // If structure score is very low
    if (this.audit.structure && this.audit.structure.score !== undefined && this.audit.structure.score < 1.5) {
      return true;
    }
    
    // If security score is very low
    if (this.riskScore && this.riskScore.scores.security < 4) {
      return true;
    }
    
    // If SQL score is very low
    if (this.audit.data && this.audit.data.sql_score !== undefined && this.audit.data.sql_score < 1.5) {
      return true;
    }
    
    // If it has high impact but poor quality
    if (this.impactGraph && this.impactGraph.impact_level === 'élevé' && 
        this.audit.structure && this.audit.structure.score !== undefined && 
        this.audit.structure.score < 2) {
      return true;
    }
    
    return false;
  }

  private identifyBackendTargets(): string[] {
    const targets: string[] = [];
    
    // Extract module name from file name (e.g., panier.php -> CartModule)
    const baseName = path.basename(this.fileName, '.php');
    const moduleName = this.toPascalCase(baseName) + 'Module';
    targets.push(moduleName);
    
    // Add controller and service
    targets.push(this.toPascalCase(baseName) + 'Controller');
    targets.push(this.toPascalCase(baseName) + 'Service');
    
    // Add DTO if needed
    if (this.backlog && this.backlog.tasks.some((t: any) => t.type === 'createDTO')) {
      targets.push(this.toPascalCase(baseName) + 'Dto');
    }
    
    return targets;
  }

  private identifyFrontendTargets(): string[] {
    const targets: string[] = [];
    
    // Extract route name from file name (e.g., panier.php -> /panier)
    const baseName = path.basename(this.fileName, '.php');
    targets.push(`/routes/${baseName.toLowerCase()}.tsx`);
    
    // Add loader and action if needed
    if (this.audit.data && this.audit.data.data_sources && this.audit.data.data_sources.length > 0) {
      targets.push(`/routes/${baseName.toLowerCase()}.loader.ts`);
    }
    
    if (this.backlog && this.backlog.tasks.some((t: any) => t.type === 'createForm')) {
      targets.push(`/routes/${baseName.toLowerCase()}.action.ts`);
    }
    
    return targets;
  }

  private generateMigrationTasks(): MigrationTask[] {
    const tasks: MigrationTask[] = [];
    const baseName = path.basename(this.fileName, '.php');
    
    // Common backend tasks
    tasks.push({
      id: `${baseName}-backend-module`,
      description: `Créer le module NestJS ${this.toPascalCase(baseName)}Module`,
      type: 'create',
      target: 'backend',
      priority: 1
    });
    
    tasks.push({
      id: `${baseName}-backend-controller`,
      description: `Créer le contrôleur ${this.toPascalCase(baseName)}Controller`,
      type: 'create',
      target: 'backend',
      priority: 2,
      dependencies: [`${baseName}-backend-module`]
    });
    
    tasks.push({
      id: `${baseName}-backend-service`,
      description: `Créer le service ${this.toPascalCase(baseName)}Service`,
      type: 'create',
      target: 'backend',
      priority: 2,
      dependencies: [`${baseName}-backend-module`]
    });
    
    // Add DTO if needed
    if (this.backlog && this.backlog.tasks.some((t: any) => t.type === 'createDTO')) {
      tasks.push({
        id: `${baseName}-backend-dto`,
        description: `Créer les DTOs pour ${this.toPascalCase(baseName)}`,
        type: 'create',
        target: 'backend',
        priority: 1
      });
    }
    
    // Common frontend tasks
    tasks.push({
      id: `${baseName}-frontend-route`,
      description: `Créer la route Remix ${baseName.toLowerCase()}`,
      type: 'create',
      target: 'frontend',
      priority: 3
    });
    
    // Add loader if needed
    if (this.audit.data && this.audit.data.data_sources && this.audit.data.data_sources.length > 0) {
      tasks.push({
        id: `${baseName}-frontend-loader`,
        description: `Créer le loader pour la route ${baseName.toLowerCase()}`,
        type: 'create',
        target: 'frontend',
        priority: 3,
        dependencies: [`${baseName}-frontend-route`]
      });
    }
    
    // Add action if needed
    if (this.backlog && this.backlog.tasks.some((t: any) => t.type === 'createForm')) {
      tasks.push({
        id: `${baseName}-frontend-action`,
        description: `Créer l'action pour la route ${baseName.toLowerCase()}`,
        type: 'create',
        target: 'frontend',
        priority: 3,
        dependencies: [`${baseName}-frontend-route`]
      });
    }
    
    // Database tasks if SQL is detected
    if (this.audit.data && this.audit.data.sql_score !== undefined) {
      tasks.push({
        id: `${baseName}-prisma-model`,
        description: `Créer le modèle Prisma pour ${this.toPascalCase(baseName)}`,
        type: 'create',
        target: 'data',
        priority: 1
      });
    }
    
    // Testing tasks
    tasks.push({
      id: `${baseName}-backend-test`,
      description: `Créer des tests unitaires pour ${this.toPascalCase(baseName)}Service`,
      type: 'test',
      target: 'backend',
      priority: 4,
      dependencies: [`${baseName}-backend-service`]
    });
    
    tasks.push({
      id: `${baseName}-frontend-test`,
      description: `Créer des tests pour la route ${baseName.toLowerCase()}`,
      type: 'test',
      target: 'frontend',
      priority: 4,
      dependencies: [`${baseName}-frontend-route`]
    });
    
    // Add tasks from existing backlog if available
    if (this.backlog && this.backlog.tasks) {
      for (const task of this.backlog.tasks) {
        if (task.type && task.description) {
          const existingTaskId = this.generateTaskId(task);
          
          // Only add if not already in our list
          if (!tasks.some(t => t.id === existingTaskId)) {
            tasks.push({
              id: existingTaskId,
              description: task.description,
              type: this.mapTaskType(task.type),
              target: task.target || 'shared',
              priority: this.mapTaskPriority(task)
            });
          }
        }
      }
    }
    
    return tasks;
  }

  private generateTaskId(task: any): string {
    const baseName = path.basename(this.fileName, '.php');
    const taskType = task.type.replace(/[^a-zA-Z0-9]/g, '-');
    return `${baseName}-${task.target || 'shared'}-${taskType}`;
  }

  private mapTaskType(type: string): 'refactor' | 'create' | 'migrate' | 'test' {
    if (type.startsWith('create') || type.includes('generate')) return 'create';
    if (type.includes('test') || type.includes('spec')) return 'test';
    if (type.includes('refactor') || type.includes('extract') || type.includes('simplify')) return 'refactor';
    return 'migrate';
  }

  private mapTaskPriority(task: any): number {
    if (task.priority) return task.priority;
    
    // Set priority based on task type
    if (task.type.includes('refactor') || task.type.includes('security')) return 1;
    if (task.type.includes('create') || task.type.includes('generate')) return 2;
    if (task.type.includes('migrate')) return 3;
    if (task.type.includes('test')) return 4;
    return 3;
  }

  private generateImmediateRefactoringTasks(): string[] {
    const tasks: string[] = [];
    
    // If structure score is low, suggest refactoring
    if (this.audit.structure && this.audit.structure.score !== undefined && this.audit.structure.score < 2) {
      tasks.push("Extraire les blocs métiers dans des fonctions nommées");
    }
    
    // If SQL score is low
    if (this.audit.data && this.audit.data.sql_score !== undefined && this.audit.data.sql_score < 2) {
      tasks.push("Extraire les appels SQL en fonctions séparées");
    }
    
    // If it outputs HTML
    if (this.audit.data && this.audit.data.output_types && 
        this.audit.data.output_types.includes('HTML')) {
      tasks.push("Supprimer le HTML inline et le déplacer vers un template.php partiel");
    }
    
    // If it uses sessions
    if (this.audit.data && this.audit.data.data_sources && 
        this.audit.data.data_sources.includes('SESSION')) {
      tasks.push("Ajouter une couche d'abstraction pour la logique de session");
    }
    
    return tasks;
  }

  private identifyAnticipatedIssues(): string[] {
    const issues: string[] = [];
    
    // Check for dynamic includes
    if (this.impactGraph && this.impactGraph.uses && 
        this.impactGraph.uses.some((u: string) => u.includes('?') || u.includes('$'))) {
      issues.push("include() dynamiques dans un switch selon $_GET['page']");
    }
    
    // Check for mixed HTML and logic
    if (this.audit.data && this.audit.data.output_types && 
        this.audit.data.output_types.includes('HTML') && 
        this.audit.structure && this.audit.structure.score !== undefined && 
        this.audit.structure.score < 2) {
      issues.push("Mélange fort entre rendu HTML et logique métier");
    }
    
    // Check for HTTP headers in business logic
    if (this.audit.data && this.audit.data.output_types && 
        this.audit.data.output_types.includes('Headers HTTP')) {
      issues.push("Redirections et headers HTTP imbriqués dans la logique produit");
    }
    
    // Check for strong coupling
    if (this.impactGraph && this.impactGraph.uses && this.impactGraph.uses.length > 3) {
      const dependencies = this.impactGraph.uses.map((u: string) => path.basename(u)).join(', ');
      issues.push(`Couplage fort avec ${dependencies}`);
    }
    
    return issues;
  }

  private hasQualityIssues(): boolean {
    return (this.audit.structure !== undefined && 
            this.audit.structure.score !== undefined && 
            this.audit.structure.score < 2) || 
           (this.riskScore !== undefined && 
            this.riskScore.scores.quality !== undefined && 
            this.riskScore.scores.quality < 5);
  }

  private hasSecurityIssues(): boolean {
    return this.riskScore !== undefined && 
           this.riskScore.scores.security !== undefined && 
           this.riskScore.scores.security < 6;
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  public generateMigrationPlanMd(): string {
    const plan = this.generateMigrationPlan();
    
    // Convert migration score to stars
    const stars = '🌟'.repeat(plan.migrationScore);
    
    // Format the markdown
    let markdown = `# Plan de migration pour ${plan.file}\n\n`;
    
    // Summary section
    markdown += `## Résumé\n\n`;
    markdown += `- **Difficulté**: ${this.formatDifficulty(plan.difficulty)}\n`;
    markdown += `- **Impact transverse**: ${plan.impactScore}/10\n`;
    markdown += `- **Complexité**: ${plan.complexity}/10\n`;
    markdown += `- **Score de migration**: ${stars} (${plan.migrationScore}/5)\n`;
    markdown += `- **Vague de migration**: ${plan.migrationWave}\n`;
    markdown += `- **Refactoring préalable nécessaire**: ${plan.needsRefactoringFirst ? 'Oui' : 'Non'}\n\n`;
    
    // Impact section
    markdown += `## 🔗 Impact transverse\n\n`;
    if (this.impactGraph) {
      markdown += `- **Utilisation partagée détectée**: ✅ Oui\n`;
      markdown += `- **Nombre de fichiers appelants**: ${this.impactGraph && this.impactGraph.usedBy.length}\n`;
      
      // Calculate centrality if we have both uses and usedBy
      if (this.impactGraph.uses && this.impactGraph && this.impactGraph.usedBy) {
        const totalRelations = this.impactGraph.uses.length + this.impactGraph && this.impactGraph.usedBy.length;
        const centrality = (totalRelations > 0) ? 
          (Math.min(totalRelations / 15, 1)).toFixed(2) : "0.00";
        markdown += `- **Centralité (graph degree)**: ${centrality}\n`;
      }
      
      // Determine module type
      const moduleType = this.determineModuleType();
      markdown += `- **Type**: ${moduleType}\n`;
      
      // Add recommendation based on impact
      if (this.impactGraph.impact_level === 'élevé') {
        markdown += `- ✅ Doit être migré dans une vague dédiée, avec contrôle d'intégrité.\n`;
      } else if (this.impactGraph.impact_level === 'moyen') {
        markdown += `- ⚠️ Migration nécessitant une attention particulière aux dépendances.\n`;
      } else {
        markdown += `- ✓ Peut être migré normalement selon le plan établi.\n`;
      }
    } else {
      markdown += `- **Utilisation partagée détectée**: ❌ Non\n`;
      markdown += `- **Impact**: Localisé, migration standard possible\n`;
    }
    markdown += `\n`;
    
    // Migration score section
    markdown += `## ⭐ Scoring de migration\n\n`;
    markdown += `| Critère | Score (0-5) |\n`;
    markdown += `|---------|------------|\n`;
    
    // Calculate individual scores again
    let couplageScore = this.impactGraph ? (this.impactGraph && this.impactGraph.usedBy.length / 3) : 0;
    couplageScore = Math.min(Math.round(couplageScore), 5);
    
    let complexiteMetier = this.audit.role ? 
      (this.audit.role.includes('critique') || this.audit.role.includes('important') ? 4 : 
       this.audit.role.includes('secondaire') ? 2 : 3) : 3;
    
    let qualiteTechnique = this.audit.structure && this.audit.structure.score !== undefined ? 
      Math.round(Math.max(0, 3 - this.audit.structure.score) * 1.67) : 2;
    
    let dependancesScore = this.impactGraph ? 
      Math.min(Math.round(this.impactGraph.uses ? this.impactGraph.uses.length / 2 : 0), 5) : 0;
    
    // Calculate volume score based on file size
    let volumeScore = 3; // Default
    try {
      const stats = fs.statSync(this.filePath);
      const sizeInKB = stats.size / 1024;
      if (sizeInKB > 100) volumeScore = 5;
      else if (sizeInKB > 50) volumeScore = 4;
      else if (sizeInKB > 20) volumeScore = 3;
      else if (sizeInKB > 10) volumeScore = 2;
      else volumeScore = 1;
    } catch (error) {
      // Just use default if there's an error
    }
    
    markdown += `| Couplage interne | ${couplageScore} |\n`;
    markdown += `| Complexité métier | ${complexiteMetier} |\n`;
    markdown += `| Qualité technique | ${qualiteTechnique} |\n`;
    markdown += `| Dépendances externes | ${dependancesScore} |\n`;
    markdown += `| Volume (lignes) | ${volumeScore} |\n`;
    
    markdown += `\n🧮 Score global migration : ${stars}\n`;
    
    if (plan.migrationScore >= 4) {
      markdown += `📌 Difficulté élevée, nécessite phase intermédiaire de découplage.\n\n`;
    } else if (plan.migrationScore >= 3) {
      markdown += `📌 Difficulté moyenne, migration directe possible avec attention.\n\n`;
    } else {
      markdown += `📌 Difficulté modérée, bonne candidate pour migration directe.\n\n`;
    }
    
    // Refactoring section
    if (plan.immediateTasks.length > 0) {
      markdown += `## 🛠️ Refactoring PHP immédiat possible\n\n`;
      for (const task of plan.immediateTasks) {
        markdown += `- ${task}\n`;
      }
      markdown += `\n➡️ Refactoring recommandé avant migration vers NestJS/Remix.\n\n`;
    }
    
    // Anticipated issues
    if (plan.anticipatedIssues.length > 0) {
      markdown += `## ⚠️ Difficultés anticipées\n\n`;
      for (const issue of plan.anticipatedIssues) {
        markdown += `- ${issue}\n`;
      }
      markdown += `\n`;
    }
    
    // Backend migration plan
    markdown += `## 🧱 Plan de migration NestJS\n\n`;
    markdown += `| Élément PHP | Cible NestJS |\n`;
    markdown += `|-------------|-------------|\n`;
    
    // Add specific mappings based on file analysis
    const backendMappings = this.generateBackendMappings();
    for (const mapping of backendMappings) {
      markdown += `| ${mapping.source} | ${mapping.target} |\n`;
    }
    markdown += `\n`;
    
    // Frontend migration plan
    markdown += `## 🎨 Plan de migration Remix\n\n`;
    markdown += `| Élément PHP | Cible Remix |\n`;
    markdown += `|-------------|------------|\n`;
    
    // Add specific mappings based on file analysis
    const frontendMappings = this.generateFrontendMappings();
    for (const mapping of frontendMappings) {
      markdown += `| ${mapping.source} | ${mapping.target} |\n`;
    }
    markdown += `\n`;
    
    // Backend/Frontend specialization
    markdown += `## 🪓 Spécialisation backend / frontend\n\n`;
    markdown += `| Côté NestJS | Côté Remix |\n`;
    markdown += `|------------|------------|\n`;
    markdown += `| Accès DB, logique métier | UI, interactivité, routing |\n`;
    markdown += `| Auth / Session | Formulaires, rendering |\n`;
    markdown += `| Validation Zod côté API | conform + zod côté form |\n\n`;
    
    // Tasks list
    markdown += `## ✅ Liste de tâches techniques\n\n`;
    markdown += `\`\`\`json\n[\n`;
    for (let i = 0; i < plan.tasks.length; i++) {
      const task = plan.tasks[i];
      markdown += `  "${task.description}"${i < plan.tasks.length - 1 ? ',' : ''}\n`;
    }
    markdown += `]\n\`\`\`\n\n`;
    
    // Recommendations
    markdown += `## 🧠 Recommandations IA prioritaires\n\n`;
    
    if (plan.needsRefactoringFirst) {
      markdown += `⚠️ Migrer en 2 étapes : découplage d'abord, migration ensuite\n\n`;
    }
    
    const moduleType = this.toPascalCase(path.basename(this.fileName, '.php'));
    markdown += `✅ Créer module ${moduleType.toLowerCase()} complet dans @app/backend/${moduleType.toLowerCase()}\n\n`;
    
    markdown += `🧩 Générer automatiquement :\n\n`;
    markdown += `${moduleType.toLowerCase()}.controller.ts, ${moduleType.toLowerCase()}.service.ts, ${moduleType.toLowerCase()}.dto.ts\n\n`;
    markdown += `${path.basename(this.fileName, '.php')}.tsx, loader.ts, meta.ts\n\n`;
    
    markdown += `⏳ Inclure ce fichier dans la Vague ${plan.migrationWave} du plan de migration\n\n`;
    
    return markdown;
  }

  private formatDifficulty(difficulty: string): string {
    switch (difficulty) {
      case 'critique':
        return '🔴 Critique';
      case 'élevée':
        return '🟠 Élevée';
      case 'moyenne':
        return '🟡 Moyenne';
      case 'faible':
        return '🟢 Faible';
      default:
        return difficulty;
    }
  }

  private determineModuleType(): string {
    // Try to determine the module type from filename and role
    const fileName = path.basename(this.fileName, '.php').toLowerCase();
    
    if (fileName.includes('panier') || fileName.includes('cart')) {
      return 'Service critique partagé (cart / session)';
    }
    
    if (fileName.includes('user') || fileName.includes('auth') || 
        fileName.includes('login') || fileName.includes('account')) {
      return 'Service critique partagé (auth / user)';
    }
    
    if (fileName.includes('produit') || fileName.includes('product') || 
        fileName.includes('item') || fileName.includes('article')) {
      return 'Composant métier (produit / catalogue)';
    }
    
    if (fileName.includes('commande') || fileName.includes('order') || 
        fileName.includes('checkout')) {
      return 'Composant métier (commande / checkout)';
    }
    
    if (fileName.includes('page') || fileName.includes('template') || 
        fileName.includes('view') || fileName.includes('layout')) {
      return 'Composant visuel (page / template)';
    }
    
    if (fileName.includes('api') || fileName.includes('service') || 
        fileName.includes('handler')) {
      return 'Service API';
    }
    
    if (this.audit.structure && this.audit.structure.type) {
      return `Module de type "${this.audit.structure.type}"`;
    }
    
    return 'Module général';
  }

  private generateBackendMappings(): Array<{source: string, target: string}> {
    const mappings: Array<{source: string, target: string}> = [];
    const baseName = this.toCamelCase(path.basename(this.fileName, '.php'));
    
    // SQL mappings
    if (this.audit.data && this.audit.data.sql_score !== undefined) {
      mappings.push({
        source: 'Requêtes SQL',
        target: `Prisma dans ${baseName}.service.ts`
      });
    }
    
    // Business logic mappings
    mappings.push({
      source: `Blocs métier (${baseName})`,
      target: `${this.toPascalCase(baseName)}Service + ${this.toPascalCase(baseName)}Controller`
    });
    
    // Config mappings
    if (this.impactGraph && this.impactGraph.uses && 
        this.impactGraph.uses.some((u: string) => u.includes('config'))) {
      mappings.push({
        source: "Fichier d'inclusion config",
        target: "@nestjs/config avec validation"
      });
    }
    
    // Auth mappings
    if (this.audit.data && this.audit.data.data_sources && 
        this.audit.data.data_sources.includes('SESSION')) {
      mappings.push({
        source: "Auth via session",
        target: "Passport + RedisSessionStore"
      });
    }
    
    return mappings;
  }

  private generateFrontendMappings(): Array<{source: string, target: string}> {
    const mappings: Array<{source: string, target: string}> = [];
    const baseName = path.basename(this.fileName, '.php').toLowerCase();
    
    // Form mappings
    if (this.audit.data && this.audit.data.data_sources && 
        this.audit.data.data_sources.includes('POST')) {
      mappings.push({
        source: "Formulaires POST",
        target: "Remix <Form method=\"post\">"
      });
    }
    
    // Data loading mappings
    if (this.audit.data && this.audit.data.data_sources) {
      mappings.push({
        source: "Chargement produit",
        target: "loader.ts"
      });
    }
    
    // Meta tags
    mappings.push({
      source: "Meta dynamiques",
      target: "meta.ts + canonical()"
    });
    
    // HTML rendering
    if (this.audit.data && this.audit.data.output_types && 
        this.audit.data.output_types.includes('HTML')) {
      mappings.push({
        source: "Fichier HTML",
        target: `app/routes/${baseName}.tsx`
      });
    }
    
    // Session state
    if (this.audit.data && this.audit.data.data_sources && 
        this.audit.data.data_sources.includes('SESSION')) {
      mappings.push({
        source: "États de session",
        target: "useFetcher() ou sessionStorage"
      });
    }
    
    return mappings;
  }

  public updateBacklogJson(): void {
    if (!this.backlog) {
      this.backlog = {
        file: this.fileName,
        priority: 5,
        status: "to-do",
        tasks: []
      };
    }
    
    const plan = this.generateMigrationPlan();
    
    // Update priority based on migration wave
    this.backlog.priority = 10 - plan.migrationWave * 2; // Wave 1 = 8, Wave 2 = 6, etc.
    
    // Set status to "to-refactor" if refactoring is needed first
    if (plan.needsRefactoringFirst) {
      this.backlog.status = "to-refactor";
    }
    
    // Add migration metadata
    this.backlog.migration = {
      wave: plan.migrationWave,
      difficulty: plan.difficulty,
      score: plan.migrationScore,
      impactScore: plan.impactScore,
      needsRefactoringFirst: plan.needsRefactoringFirst
    };
    
    // Add new tasks if they don't exist
    for (const task of plan.tasks) {
      // Check if task already exists
      const exists = this.backlog.tasks.some((t: any) => 
        t.description === task.description || 
        (t.type === task.type && t.target === task.target));
      
      if (!exists) {
        this.backlog.tasks.push({
          type: task.type,
          target: task.target,
          status: "pending",
          description: task.description,
          priority: task.priority
        });
      }
    }
    
    // Write updated backlog
    const backlogPath = this.filePath.replace('.php', '.backlog.json');
    fs.writeFileSync(backlogPath, JSON.stringify(this.backlog, null, 2));
  }

  public saveFiles(): void {
    // Generate and save migration plan markdown
    const migrationPlanMd = this.generateMigrationPlanMd();
    const migrationPlanPath = this.filePath.replace('.php', '.migration_plan.md');
    fs.writeFileSync(migrationPlanPath, migrationPlanMd);
    
    // Update backlog JSON
    this.updateBacklogJson();
  }
}

// Main function
function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node generate-migration-plan.ts <file-path>');
    process.exit(1);
  }
  
  const filePath = process.argv[2];
  
  try {
    const generator = new MigrationPlanGenerator(filePath);
    generator.saveFiles();
    console.log(`Generated migration plan for ${filePath}`);
    console.log(`- ${filePath.replace('.php', '.migration_plan.md')}`);
    console.log(`- Updated ${filePath.replace('.php', '.backlog.json')}`);
  } catch (error: unknown) {
    // Gestion sécurisée de l'erreur avec vérification du type
    if (error instanceof Error) {
      console.error(`Error generating migration plan: ${error.message}`);
    } else {
      console.error(`Error generating migration plan: ${String(error)}`);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { MigrationPlanGenerator };

import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































