import * as fs from 'fs-extra';;
import * as path from 'path';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


/**
 * Interface pour une section d'audit
 */
interface AuditSection {
  id: string;
  title: string;
  content: string;
  severity?: 'info' | 'warning' | 'critical';
}

/**
 * Analyseur de qualité et de sécurité des fichiers PHP
 */
export class QualityAgent implements BaseAgent, BusinessAgent, BaseAgent, BusinessAgent {
  private filePath: string;
  private fileContent = '';
  private sections: AuditSection[] = [];

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Charge le contenu du fichier PHP
   */
  public async loadFile(): Promise<void> {
    try {
      this.fileContent = await fs.readFile(this.filePath, 'utf8');
    } catch (error) {
      throw new Error(`Erreur lors du chargement du fichier: ${error.message}`);
    }
  }

  /**
   * Analyse la complexité cyclomatique du code (section 13)
   */
  private analyzeCyclomaticComplexity(): { content: string, severity: 'info' | 'warning' | 'critical' } {
    const content = this.fileContent;
    let complexity = '';
    let severity: 'info' | 'warning' | 'critical' = 'info';
    
    // Compter les structures de contrôle
    const ifCount = (content.match(/if\s*\(/g) || []).length;
    const elseIfCount = (content.match(/else\s+if\s*\(/g) || []).length;
    const switchCount = (content.match(/switch\s*\(/g) || []).length;
    const caseCount = (content.match(/case\s+\w+:/g) || []).length;
    const forCount = (content.match(/for\s*\(/g) || []).length;
    const foreachCount = (content.match(/foreach\s*\(/g) || []).length;
    const whileCount = (content.match(/while\s*\(/g) || []).length;
    const doWhileCount = (content.match(/do\s*\{/g) || []).length;
    const ternaryCount = (content.match(/\?.*:/g) || []).length;
    
    // Calculer la complexité cyclomatique approximative
    const cyclomaticComplexity = 1 + ifCount + elseIfCount + caseCount + forCount + foreachCount + whileCount + doWhileCount + ternaryCount;
    
    // Déterminer la sévérité en fonction de la complexité
    if (cyclomaticComplexity <= 10) {
      severity = 'info';
    } else if (cyclomaticComplexity <= 20) {
      severity = 'warning';
    } else {
      severity = 'critical';
    }
    
    // Analyser la profondeur d'imbrication
    const lines = content.split('\n');
    let maxNestingLevel = 0;
    let currentNestingLevel = 0;
    
    for (const line of lines) {
      // Incrémenter pour chaque accolade ouvrante
      const openBraces = (line.match(/{/g) || []).length;
      currentNestingLevel += openBraces;
      
      // Mettre à jour le niveau maximal
      maxNestingLevel = Math.max(maxNestingLevel, currentNestingLevel);
      
      // Décrémenter pour chaque accolade fermante
      const closeBraces = (line.match(/}/g) || []).length;
      currentNestingLevel -= closeBraces;
    }
    
    // Déterminer la sévérité en fonction de la profondeur d'imbrication
    if (maxNestingLevel > 5) {
      severity = 'critical';
    } else if (maxNestingLevel > 3 && severity !== 'critical') {
      severity = 'warning';
    }
    
    // Générer le rapport
    complexity = `Complexité cyclomatique: ${cyclomaticComplexity}\n\n`;
    complexity += `Détail des structures de contrôle:\n`;
    complexity += `- ${ifCount} if, ${elseIfCount} else if\n`;
    complexity += `- ${switchCount} switch, ${caseCount} case\n`;
    complexity += `- ${forCount} for, ${foreachCount} foreach\n`;
    complexity += `- ${whileCount} while, ${doWhileCount} do-while\n`;
    complexity += `- ${ternaryCount} opérateurs ternaires\n\n`;
    complexity += `Profondeur maximale d'imbrication: ${maxNestingLevel} niveau(s)\n\n`;
    
    // Ajouter une évaluation
    if (cyclomaticComplexity > 20 || maxNestingLevel > 5) {
      complexity += `⚠️ **ALERTE** : La complexité est très élevée. Le code est difficile à maintenir et à tester. Une refactorisation est fortement recommandée.`;
    } else if (cyclomaticComplexity > 10 || maxNestingLevel > 3) {
      complexity += `⚠️ **Attention** : La complexité est modérément élevée. Envisager de simplifier certaines parties du code.`;
    } else {
      complexity += `✅ La complexité est acceptable.`;
    }
    
    return { content: complexity, severity };
  }

  /**
   * Analyse l'endettement technique du code (section 14)
   */
  private analyzeTechnicalDebt(): { content: string, severity: 'info' | 'warning' | 'critical' } {
    const content = this.fileContent;
    let debt = '';
    let severity: 'info' | 'warning' | 'critical' = 'info';
    const issues: string[] = [];
    
    // Détecter la duplication de code
    const codeLines = content.split('\n');
    const duplicateLines = this.findDuplicateCodeBlocks(codeLines);
    if (duplicateLines > 0) {
      issues.push(`Duplication de code: ${duplicateLines} lignes potentiellement dupliquées`);
      severity = 'warning';
    }
    
    // Vérifier le manque de typage
    const variableAssignments = content.match(/\$\w+\s*=\s*[^;]+;/g) || [];
    const untypedVariables = variableAssignments.filter(a => !a.includes('(int)') && !a.includes('(string)') && !a.includes('(bool)' || !a.includes('(float)')));
    if (untypedVariables.length > 15) {
      issues.push(`Manque de typage: ${untypedVariables.length} variables non typées`);
      if (severity !== 'critical') severity = 'warning';
    }
    
    // Détecter le code mort potentiel
    const commentedCodeBlocks = content.match(/\/\/.*\w+\s*\(/g) || [];
    if (commentedCodeBlocks.length > 5) {
      issues.push(`Code mort potentiel: ${commentedCodeBlocks.length} blocs de code commentés`);
      if (severity !== 'critical') severity = 'warning';
    }
    
    // Vérifier les fonctions trop longues
    const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
    const longFunctions = functionMatches.filter(f => f.split('\n').length > 50);
    if (longFunctions.length > 0) {
      issues.push(`Fonctions trop longues: ${longFunctions.length} fonction(s) de plus de 50 lignes`);
      severity = 'critical';
    }
    
    // Détecter les variables globales
    const globalVars = content.match(/global\s+\$\w+/g) || [];
    if (globalVars.length > 0) {
      issues.push(`Utilisation de ${globalVars.length} variables globales`);
      if (severity !== 'critical') severity = 'warning';
    }
    
    // Vérifier la présence de nombres magiques
    const magicNumbers = (content.match(/\W\d+\W/g) || [])
      .filter(n => !n.match(/\W[01]\W/)) // Ignorer 0 et 1
      .filter(n => !n.includes('LIMIT 1')) // Ignorer les LIMIT 1 en SQL
      .length;
    
    if (magicNumbers > 15) {
      issues.push(`Nombres magiques: ${magicNumbers} valeurs numériques codées en dur`);
      if (severity !== 'critical') severity = 'warning';
    }
    
    // Vérifier si orienté objet ou procédural
    const isOOP = content.includes('class ');
    if (!isOOP && codeLines.length > 200) {
      issues.push("Code purement procédural de grande taille");
      severity = 'critical';
    }
    
    // Vérifier les longues chaînes d'indentation
    const heavyIndentedLines = codeLines.filter(line => line.match(/^\s{12,}/));
    if (heavyIndentedLines.length > 20) {
      issues.push(`Indentation excessive: ${heavyIndentedLines.length} lignes avec indentation profonde`);
      if (severity !== 'critical') severity = 'warning';
    }
    
    // Calculer un score de dette technique (0-100)
    let debtScore = 0;
    debtScore += Math.min(25, duplicateLines / 5);
    debtScore += Math.min(15, untypedVariables.length / 5);
    debtScore += Math.min(10, commentedCodeBlocks.length * 2);
    debtScore += Math.min(25, longFunctions.length * 10);
    debtScore += Math.min(15, globalVars.length * 5);
    debtScore += Math.min(10, magicNumbers / 5);
    
    // Formatter le rapport
    debt = `Score d'endettement technique: ${Math.round(debtScore)}/100\n\n`;
    
    if (issues.length > 0) {
      debt += "Problèmes détectés:\n";
      issues.forEach(issue => {
        debt += `- ${issue}\n`;
      });
      
      debt += "\n";
    }
    
    // Ajouter une évaluation globale
    if (debtScore > 60) {
      debt += "⚠️ **Dette technique élevée**: Ce code nécessite une refactorisation substantielle avant d'être migré.";
      severity = 'critical';
    } else if (debtScore > 30) {
      debt += "⚠️ **Dette technique modérée**: Des améliorations significatives sont recommandées pendant la migration.";
      if (severity !== 'critical') severity = 'warning';
    } else {
      debt += "✅ **Dette technique faible**: Le code est dans un état raisonnable pour la migration.";
    }
    
    return { content: debt, severity };

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  id: string = '';
  type: string = '';
  version: string = '1.0.0';
  }

  /**
   * Trouve les blocs de code dupliqués
   */
  private findDuplicateCodeBlocks(codeLines: string[]): number {
    let duplicateLines = 0;
    const windowSize = 5; // Taille minimale d'un bloc dupliqué
    const seenBlocks = new Set<string>();
    
    for (let i = 0; i <= codeLines.length - windowSize; i++) {
      const block = codeLines.slice(i, i + windowSize).join('\n');
      
      // Ignorer les blocs trop courts ou triviaux
      if (block.trim().length < 50 || block.includes('<?php') || block.includes('?>')) {
        continue;
      }
      
      if (seenBlocks.has(block)) {
        duplicateLines += windowSize;
      } else {
        seenBlocks.add(block);
      }
    }
    
    return duplicateLines;
  }

  /**
   * Analyse les failles potentielles de sécurité (section 15)
   */
  private analyzeSecurityVulnerabilities(): { content: string, severity: 'info' | 'warning' | 'critical' } {
    const content = this.fileContent;
    let security = '';
    let severity: 'info' | 'warning' | 'critical' = 'info';
    const vulnerabilities: { issue: string, description: string, severity: 'info' | 'warning' | 'critical' }[] = [];
    
    // Détecter les injections SQL
    if ((content.includes('mysql_query') || content.includes('mysqli_query')) &&
        (content.includes('$_GET') || content.includes('$_POST'))) {
      if (!content.includes('prepare') && !content.includes('real_escape_string')) {
        vulnerabilities.push({
          issue: "Injection SQL",
          description: "Utilisation de variables utilisateur non échappées dans les requêtes SQL",
          severity: 'critical'
        });
      }
    }
    
    // Détecter les XSS
    if ((content.includes('echo $') || content.includes('print $')) &&
        (content.includes('$_GET') || content.includes('$_POST'))) {
      if (!content.includes('htmlspecialchars') && !content.includes('htmlentities')) {
        vulnerabilities.push({
          issue: "Cross-Site Scripting (XSS)",
          description: "Affichage de données utilisateur non échappées dans le HTML",
          severity: 'critical'
        });
      }
    }
    
    // Détecter les failles d'inclusion de fichiers
    if ((content.includes('include') || content.includes('require')) &&
        (content.includes('$_GET') || content.includes('$_POST'))) {
      vulnerabilities.push({
        issue: "Inclusion de fichiers arbitraires",
        description: "Le chemin d'inclusion est contrôlé par l'utilisateur",
        severity: 'critical'
      });
    }
    
    // Détecter les CSRF
    if (content.includes('$_POST') && !content.includes('csrf_token') && !content.includes('_token')) {
      vulnerabilities.push({
        issue: "Cross-Site Request Forgery (CSRF)",
        description: "Pas de protection CSRF sur les formulaires",
        severity: 'warning'
      });
    }
    
    // Vérifier la validation des entrées
    if ((content.includes('$_GET') || content.includes('$_POST')) &&
        !content.includes('filter_var') && !content.includes('preg_match')) {
      vulnerabilities.push({
        issue: "Validation d'entrées insuffisante",
        description: "Les données utilisateur ne sont pas correctement validées",
        severity: 'warning'
      });
    }
    
    // Vérifier les problèmes d'authentification
    if (content.includes('$_SESSION') && content.includes('admin')) {
      if (!content.includes('password') || !content.includes('hash')) {
        vulnerabilities.push({
          issue: "Authentification faible",
          description: "Mécanisme d'authentification potentiellement insuffisant",
          severity: 'warning'
        });
      }
    }
    
    // Vérifier les informations sensibles
    if (content.includes('password') || content.includes('mot de passe')) {
      if (content.includes('md5(') && !content.includes('password_hash')) {
        vulnerabilities.push({
          issue: "Hachage faible",
          description: "Utilisation de MD5 pour les mots de passe (algorithme obsolète)",
          severity: 'critical'
        });
      }
    }
    
    // Déterminer la sévérité globale
    if (vulnerabilities.some(v => v.severity === 'critical')) {
      severity = 'critical';
    } else if (vulnerabilities.some(v => v.severity === 'warning')) {
      severity = 'warning';
    }
    
    // Générer le rapport
    if (vulnerabilities.length > 0) {
      security = `Failles de sécurité détectées (${vulnerabilities.length}):\n\n`;
      
      vulnerabilities.forEach(v => {
        const icon = v.severity === 'critical' ? '⚠️' : '⚠';
        security += `${icon} **${v.issue}** (${v.severity})\n`;
        security += `  ${v.description}\n\n`;
      });
      
      if (severity === 'critical') {
        security += "**RECOMMANDATION URGENTE**: Ces vulnérabilités doivent être corrigées avant la mise en production.";
      } else if (severity === 'warning') {
        security += "**RECOMMANDATION**: Ces problèmes devraient être adressés pendant la phase de migration.";
      }
    } else {
      security = "✅ Aucune faille de sécurité majeure détectée.";
    }
    
    return { content: security, severity };
  }

  /**
   * Génère les sections d'audit pour le fichier PHP
   */
  public async analyze(): Promise<AuditSection[]> {
    try {
      // Analyser la complexité cyclomatique
      const { content: complexityContent, severity: complexitySeverity } = this.analyzeCyclomaticComplexity();
      this.sections.push({
        id: 'cyclomatic-complexity',
        title: '1️⃣3️⃣ Complexité cyclomatique',
        content: complexityContent,
        severity: complexitySeverity
      });
      
      // Analyser l'endettement technique
      const { content: debtContent, severity: debtSeverity } = this.analyzeTechnicalDebt();
      this.sections.push({
        id: 'technical-debt',
        title: '1️⃣4️⃣ Endettement technique',
        content: debtContent,
        severity: debtSeverity
      });
      
      // Analyser les failles de sécurité
      const { content: securityContent, severity: securitySeverity } = this.analyzeSecurityVulnerabilities();
      this.sections.push({
        id: 'security-vulnerabilities',
        title: '1️⃣5️⃣ Failles potentielles',
        content: securityContent,
        severity: securitySeverity
      });
      
      return this.sections;
    } catch (error) {
      throw new Error(`Erreur lors de l'analyse: ${error.message}`);
    }
  }

  /**
   * Sauvegarde les sections d'audit dans un fichier
   */
  public async saveSections(outputPath?: string): Promise<void> {
    try {
      const fileName = path.basename(this.filePath);
      const outputFilePath = outputPath || path.join(path.dirname(this.filePath), `${fileName}.audit.md`);
      
      let content = '';
      this.sections.forEach(section => {
        const severityIcon = section.severity === 'critical' ? '🔴' : 
                            section.severity === 'warning' ? '🟠' : '🟢';
        
        content += `## ${section.title} ${severityIcon}\n\n${section.content}\n\n`;
      });
      
      await fs.writeFile(outputFilePath, content, 'utf8');
      console.log(`Sections d'audit sauvegardées dans ${outputFilePath}`);
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde des sections: ${error.message}`);
    }
  }

  /**
   * Exécute l'analyse complète et sauvegarde le résultat
   */
  public async process(outputPath?: string): Promise<void> {
    try {
      await this.loadFile();
      await this.analyze();
      await this.saveSections(outputPath);
    } catch (error) {
      console.error(`Erreur lors du traitement: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Point d'entrée en ligne de commande
 */
async function main() {
  // Récupérer le chemin du fichier à partir des arguments de ligne de commande
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: ts-node agent-quality.ts <path-to-php-file> [output-path]');
    process.exit(1);
  }

  const filePath = args[0];
  const outputPath = args.length > 1 ? args[1] : undefined;

  try {
    const agent = new QualityAgent(filePath);
    await agent.process(outputPath);
    console.log('Analyse de qualité terminée avec succès');
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}
