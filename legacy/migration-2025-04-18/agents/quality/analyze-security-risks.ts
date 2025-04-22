import * as fs from 'fs';
import * as path from 'path';

// Types pour les résultats d'analyse
interface DynamicBehavior {
  type: 'session' | 'get' | 'post' | 'cookie' | 'switch' | 'multilingual';
  condition: string;
  line: number;
  recommendation: string;
}

interface ComplexityMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'ok' | 'warning' | 'critical';
}

interface SecurityVulnerability {
  type: string;
  lines: number[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  code: string;
  recommendation: string;
}

interface QualityAnalysisResult {
  dynamicBehaviors: DynamicBehavior[];
  complexityMetrics: ComplexityMetric[];
  securityVulnerabilities: SecurityVulnerability[];
  securityScore: number;
  qualityScore: number;
  overallRiskScore: number;
}

export class SecurityRiskAnalyzer {
  private phpContent: string;
  private filePath: string;
  private fileName: string;
  private lines: string[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.fileName = path.basename(filePath);
    this.phpContent = fs.readFileSync(filePath, 'utf8');
    this.lines = this.phpContent.split('\n');
  }

  /**
   * Exécute l'analyse complète de sécurité et qualité
   */
  public async analyze(): Promise<QualityAnalysisResult> {
    // Détection des comportements dynamiques
    const dynamicBehaviors = this.detectDynamicBehaviors();
    
    // Analyse de la complexité
    const complexityMetrics = this.analyzeComplexity();
    
    // Détection des vulnérabilités
    const securityVulnerabilities = this.detectSecurityVulnerabilities();
    
    // Calcul des scores
    const securityScore = this.calculateSecurityScore(securityVulnerabilities);
    const qualityScore = this.calculateQualityScore(complexityMetrics, dynamicBehaviors);
    const overallRiskScore = this.calculateOverallRiskScore(securityScore, qualityScore);
    
    return {
      dynamicBehaviors,
      complexityMetrics,
      securityVulnerabilities,
      securityScore,
      qualityScore,
      overallRiskScore
    };
  }

  /**
   * Détecte les comportements dynamiques dans le code
   */
  private detectDynamicBehaviors(): DynamicBehavior[] {
    const behaviors: DynamicBehavior[] = [];
    
    // Patterns pour différents types de comportements dynamiques
    const patterns = [
      {
        regex: /if\s*\(\s*\$_SESSION\[['"]?(\w+)['"]?\](?:\[['"]?(\w+)['"]?\])?\s*[=!><]=+\s*['"]?([^'")\s]+)['"]?\s*\)/g,
        type: 'session'
      },
      {
        regex: /if\s*\(\s*\$_GET\[['"]?(\w+)['"]?\]\s*[=!><]=+\s*['"]?([^'")\s]+)['"]?\s*\)/g,
        type: 'get'
      },
      {
        regex: /if\s*\(\s*\$_POST\[['"]?(\w+)['"]?\]\s*[=!><]=+\s*['"]?([^'")\s]+)['"]?\s*\)/g,
        type: 'post'
      },
      {
        regex: /if\s*\(\s*\$_COOKIE\[['"]?(\w+)['"]?\]\s*[=!><]=+\s*['"]?([^'")\s]+)['"]?\s*\)/g,
        type: 'cookie'
      },
      {
        regex: /switch\s*\(\s*\$_(?:GET|POST|REQUEST|SESSION)\[['"]?(\w+)['"]?\]\s*\)/g,
        type: 'switch'
      },
      {
        regex: /['"]?lang['"]?\s*[=!><]=+\s*['"]?([a-z]{2})['"]?/gi,
        type: 'multilingual'
      }
    ];
    
    // Parcourir chaque ligne pour détecter les comportements
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of patterns) {
        const matches = Array.from(line.matchAll(pattern.regex));
        
        for (const match of matches) {
          // Déterminer le type et la recommandation
          let type = pattern.type as DynamicBehavior['type'];
          let recommendation = '';
          
          switch (type) {
            case 'session':
              recommendation = 'Extraire la logique de vérification dans un Guard NestJS';
              break;
            case 'get':
            case 'post':
              recommendation = 'Utiliser la validation de paramètres via class-validator';
              break;
            case 'multilingual':
              recommendation = 'Centraliser les traductions dans un système i18n';
              break;
            case 'switch':
              recommendation = 'Remplacer par un pattern Strategy ou une Factory';
              break;
            case 'cookie':
              recommendation = 'Utiliser le système de session sécurisé de NestJS';
              break;
          }
          
          behaviors.push({
            type,
            condition: match[0],
            line: i + 1,
            recommendation
          });
        }
      }
    }
    
    return behaviors;
  }

  /**
   * Analyse la complexité du code
   */
  private analyzeComplexity(): ComplexityMetric[] {
    const metrics: ComplexityMetric[] = [];
    
    // 1. Profondeur des conditions imbriquées
    const maxNestingDepth = this.calculateNestingDepth();
    metrics.push({
      name: 'Profondeur max if',
      value: maxNestingDepth,
      threshold: 3,
      status: maxNestingDepth <= 2 ? 'ok' : maxNestingDepth <= 3 ? 'warning' : 'critical'
    });
    
    // 2. Fonctions imbriquées
    const nestedFunctions = this.countNestedFunctions();
    metrics.push({
      name: 'Fonctions imbriquées',
      value: nestedFunctions,
      threshold: 2,
      status: nestedFunctions <= 1 ? 'ok' : nestedFunctions <= 2 ? 'warning' : 'critical'
    });
    
    // 3. Lignes de code dans la racine (hors fonctions)
    const rootInstructions = this.countRootInstructions();
    metrics.push({
      name: 'Instructions dans la racine',
      value: rootInstructions,
      threshold: 30,
      status: rootInstructions <= 20 ? 'ok' : rootInstructions <= 30 ? 'warning' : 'critical'
    });
    
    // 4. Duplication de code
    const { count, blocks } = this.detectDuplicateBlocks();
    metrics.push({
      name: 'Duplication détectée',
      value: count,
      threshold: 1,
      status: count === 0 ? 'ok' : count <= 1 ? 'warning' : 'critical'
    });
    
    return metrics;
  }

  /**
   * Calcule la profondeur maximale des conditions imbriquées
   */
  private calculateNestingDepth(): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const line of this.lines) {
      // Augmenter la profondeur à chaque ouverture de bloc
      if (line.match(/if\s*\([^{]*\)\s*{|else\s*{|foreach\s*\([^{]*\)\s*{|while\s*\([^{]*\)\s*{|for\s*\([^{]*\)\s*{|switch\s*\([^{]*\)\s*{/)) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
      
      // Diminuer la profondeur à chaque fermeture de bloc
      if (line.match(/^\s*}\s*$/)) {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }

  /**
   * Compte le nombre de fonctions imbriquées
   */
  private countNestedFunctions(): number {
    let maxNested = 0;
    let currentNest = 0;
    
    for (const line of this.lines) {
      // Augmenter le nesting à chaque définition de fonction
      if (line.match(/function\s+\w+\s*\([^)]*\)\s*{/)) {
        currentNest++;
        maxNested = Math.max(maxNested, currentNest);
      }
      
      // Diminuer le nesting à chaque fin de fonction
      if (line.match(/^\s*}\s*$/) && currentNest > 0) {
        currentNest--;
      }
    }
    
    return maxNested;
  }

  /**
   * Compte le nombre d'instructions dans la racine (hors fonctions/classes)
   */
  private countRootInstructions(): number {
    let inFunction = false;
    let inClass = false;
    let rootLines = 0;
    
    for (const line of this.lines) {
      // Ignorer les lignes vides et commentaires
      if (line.trim() === '' || line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        continue;
      }
      
      // Détecter début/fin de fonction
      if (line.match(/function\s+\w+\s*\([^)]*\)\s*{/)) {
        inFunction = true;
      }
      if (line.match(/^\s*}\s*$/) && inFunction) {
        inFunction = false;
      }
      
      // Détecter début/fin de classe
      if (line.match(/class\s+\w+/)) {
        inClass = true;
      }
      if (line.match(/^\s*}\s*$/) && inClass) {
        inClass = false;
      }
      
      // Compter si on est à la racine
      if (!inFunction && !inClass) {
        rootLines++;
      }
    }
    
    return rootLines;
  }

  /**
   * Détecte les blocs de code dupliqués
   */
  private detectDuplicateBlocks(): { count: number; blocks: string[] } {
    const blocks: string[] = [];
    const minBlockSize = 4; // Taille minimum d'un bloc dupliqué
    
    // Générer tous les blocs possibles
    for (let i = 0; i <= this.lines.length - minBlockSize; i++) {
      for (let size = minBlockSize; i + size <= this.lines.length; size++) {
        const block = this.lines.slice(i, i + size).join('\n');
        if (block.trim().length > 30) { // Ignorer les blocs trop petits
          blocks.push(block);
        }
      }
    }
    
    // Détecter les duplications
    const duplicateBlocks = new Set<string>();
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[i] === blocks[j]) {
          duplicateBlocks.add(blocks[i]);
        }
      }
    }
    
    return {
      count: duplicateBlocks.size,
      blocks: Array.from(duplicateBlocks)
    };
  }

  /**
   * Détecte les vulnérabilités de sécurité
   */
  private detectSecurityVulnerabilities(): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Vulnérabilité : SQL Injection
    this.detectSqlInjection(vulnerabilities);
    
    // Vulnérabilité : XSS
    this.detectXss(vulnerabilities);
    
    // Vulnérabilité : Header Injection
    this.detectHeaderInjection(vulnerabilities);
    
    // Vulnérabilité : File Inclusion
    this.detectFileInclusion(vulnerabilities);
    
    // Autres vulnérabilités
    this.detectOtherVulnerabilities(vulnerabilities);
    
    return vulnerabilities;
  }

  /**
   * Détecte les injections SQL
   */
  private detectSqlInjection(vulnerabilities: SecurityVulnerability[]): void {
    const sqlInjectionPatterns = [
      /\$\w+\s*=\s*mysqli_query\([^,]+,\s*['"]?([^'"]*[\$][^'"]*)['"]?\)/g,
      /\$\w+\s*=\s*mysql_query\(["']?([^'"]*[\$][^'"]*)["']?\)/g,
      /->query\(["']?([^'"]*[\$][^'"]*)["']?\)/g,
      /exec\(["']?([^'"]*[\$][^'"]*)["']?\)/g,
      /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*=\s*[\$_]/gi,
      /INSERT\s+INTO\s+.*\s+VALUES\s*\([^\)]*\$[^\)]*\)/gi,
      /UPDATE\s+.*\s+SET\s+.*=.*\$[^;]*/gi,
      /DELETE\s+FROM\s+.*\s+WHERE\s+.*=\s*[\$_]/gi
    ];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of sqlInjectionPatterns) {
        const matches = line.match(pattern);
        
        if (matches) {
          // Vérifier s'il y a une préparation préalable (prepared statements)
          const isPrepared = line.includes('prepare(') || 
                           this.phpContent.includes('bind_param') || 
                           this.phpContent.includes('PDO::prepare');
          
          if (!isPrepared) {
            vulnerabilities.push({
              type: 'SQL Injection',
              lines: [i + 1],
              description: `Requête SQL non préparée avec des variables utilisateur: ${matches[0]}`,
              severity: 'critical',
              code: line.trim(),
              recommendation: 'Utiliser des requêtes préparées ou Prisma pour toutes les opérations de base de données'
            });
          }
        }
      }
    }
  }

  /**
   * Détecte les vulnérabilités XSS
   */
  private detectXss(vulnerabilities: SecurityVulnerability[]): void {
    const xssPatterns = [
      /echo\s+[\$][^;]*;/g,
      /print\s+[\$][^;]*;/g,
      /\?>[^<]*<\?php/g,
      /<\?=\s*\$[^>]*\?>/g
    ];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of xssPatterns) {
        const matches = line.match(pattern);
        
        if (matches) {
          // Vérifier s'il y a un échappement (htmlspecialchars, htmlentities, etc.)
          const isEscaped = line.includes('htmlspecialchars') || 
                          line.includes('htmlentities') || 
                          line.includes('strip_tags');
          
          if (!isEscaped) {
            vulnerabilities.push({
              type: 'Cross-Site Scripting (XSS)',
              lines: [i + 1],
              description: 'Sortie de données utilisateur sans échappement',
              severity: 'critical',
              code: line.trim(),
              recommendation: 'Utiliser htmlspecialchars() ou les échappements automatiques de Remix'
            });
          }
        }
      }
    }
  }

  /**
   * Détecte les injections de header
   */
  private detectHeaderInjection(vulnerabilities: SecurityVulnerability[]): void {
    const headerPatterns = [
      /header\(["']?([^'"]*[\$][^'"]*)["']?\)/g,
      /header\s*\(\s*['"]Location:\s*['"]\s*\.\s*\$/g
    ];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of headerPatterns) {
        const matches = line.match(pattern);
        
        if (matches) {
          vulnerabilities.push({
            type: 'Header Injection',
            lines: [i + 1],
            description: 'En-tête HTTP construit avec des données utilisateur',
            severity: 'medium',
            code: line.trim(),
            recommendation: 'Valider strictement les entrées utilisateur avant de les utiliser dans les en-têtes HTTP'
          });
        }
      }
    }
  }

  /**
   * Détecte les inclusions de fichiers non sécurisées
   */
  private detectFileInclusion(vulnerabilities: SecurityVulnerability[]): void {
    const inclusionPatterns = [
      /(include|require|include_once|require_once)\s*\(\s*[\$][^)]*\)/g
    ];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of inclusionPatterns) {
        const matches = line.match(pattern);
        
        if (matches) {
          vulnerabilities.push({
            type: 'File Inclusion',
            lines: [i + 1],
            description: 'Inclusion de fichier dynamique avec données utilisateur',
            severity: 'critical',
            code: line.trim(),
            recommendation: 'Remplacer par un système de routage sécurisé ou une liste blanche stricte de fichiers'
          });
        }
      }
    }
  }

  /**
   * Détecte d'autres types de vulnérabilités
   */
  private detectOtherVulnerabilities(vulnerabilities: SecurityVulnerability[]): void {
    // Recherche de code d'évaluation dynamique
    const evalPatterns = [
      /eval\s*\(\s*[\$][^)]*\)/g,
      /\$\w+\s*\(\s*[\$][^)]*\)/g, // Variable functions
      /create_function\s*\(\s*[^)]*\)/g
    ];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of evalPatterns) {
        const matches = line.match(pattern);
        
        if (matches) {
          vulnerabilities.push({
            type: 'Code Injection',
            lines: [i + 1],
            description: 'Exécution dynamique de code avec données potentiellement non fiables',
            severity: 'critical',
            code: line.trim(),
            recommendation: 'Remplacer par des mécanismes plus sûrs comme une liste définie de fonctions ou expressions'
          });
        }
      }
    }
    
    // Problèmes CSRF
    if (this.phpContent.includes('$_POST') && !this.phpContent.includes('csrf') && !this.phpContent.includes('token')) {
      vulnerabilities.push({
        type: 'CSRF',
        lines: [],
        description: 'Formulaire sans protection CSRF détecté',
        severity: 'medium',
        code: 'N/A',
        recommendation: 'Implémenter des jetons CSRF dans tous les formulaires'
      });
    }
  }

  /**
   * Calcule le score de sécurité (0-10)
   */
  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
    let score = 10.0;
    
    // Appliquer des pénalités en fonction des vulnérabilités
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical':
          score -= 2.5;
          break;
        case 'high':
          score -= 1.5;
          break;
        case 'medium':
          score -= 0.8;
          break;
        case 'low':
          score -= 0.3;
          break;
      }
    }
    
    // Garantir que le score est entre 0 et 10
    return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
  }

  /**
   * Calcule le score de qualité (0-10)
   */
  private calculateQualityScore(metrics: ComplexityMetric[], behaviors: DynamicBehavior[]): number {
    let score = 10.0;
    
    // Pénalités basées sur les métriques de complexité
    for (const metric of metrics) {
      if (metric.status === 'warning') {
        score -= 0.7;
      } else if (metric.status === 'critical') {
        score -= 1.5;
      }
    }
    
    // Pénalités pour les comportements dynamiques
    score -= behaviors.length * 0.4;
    
    // Garantir que le score est entre 0 et 10
    return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
  }

  /**
   * Calcule le score global de risque (0-10)
   */
  private calculateOverallRiskScore(securityScore: number, qualityScore: number): number {
    // Pondération: 60% sécurité, 40% qualité
    const weightedScore = (securityScore * 0.6) + (qualityScore * 0.4);
    return Math.round(weightedScore * 10) / 10;
  }

  /**
   * Génère la section Qualité & Risques pour le fichier audit.md
   */
  public async generateAuditSection(): Promise<string> {
    const analysis = await this.analyze();
    
    // Formater les comportements dynamiques
    let dynamicBehaviorsText = '';
    if (analysis.dynamicBehaviors.length > 0) {
      dynamicBehaviorsText = "Conditions spécifiques :\n\n";
      
      // Prendre jusqu'à 3 exemples
      for (let i = 0; i < Math.min(3, analysis.dynamicBehaviors.length); i++) {
        dynamicBehaviorsText += `\`\`\`php\n${analysis.dynamicBehaviors[i].condition}\n\`\`\`\n\n`;
      }
      
      dynamicBehaviorsText += "Détection IA :\n\n";
      
      if (analysis.dynamicBehaviors.some(b => b.condition.includes('if') && b.condition.includes('{'))) {
        dynamicBehaviorsText += "🔁 Logique métier cachée dans des if imbriqués\n\n";
      }
      
      if (analysis.dynamicBehaviors.some(b => b.type === 'multilingual')) {
        dynamicBehaviorsText += "🌍 Présence de logique multilingue hardcodée\n\n";
      }
      
      if (analysis.dynamicBehaviors.some(b => b.type === 'session' || b.type === 'cookie')) {
        dynamicBehaviorsText += "🎭 Changements de comportement selon les sessions ou cookies (difficile à tester/migrer)\n\n";
      }
      
      dynamicBehaviorsText += "Recommandation :\n\n";
      
      // Agréger les recommandations uniques
      const uniqueRecommendations = [...new Set(analysis.dynamicBehaviors.map(b => b.recommendation))];
      for (const rec of uniqueRecommendations) {
        dynamicBehaviorsText += `- ${rec}\n`;
      }
    } else {
      dynamicBehaviorsText = "Aucun comportement dynamique complexe détecté.\n\n";
    }
    
    // Formater les métriques de complexité
    let complexityText = "| Critère | Valeur détectée | Seuil critique | État |\n";
    complexityText += "|---------|----------------|---------------|-------|\n";
    
    for (const metric of analysis.complexityMetrics) {
      const statusIcon = metric.status === 'ok' ? '✅' : 
                        metric.status === 'warning' ? '⚠️' : '🔴';
      
      complexityText += `| ${metric.name} | ${metric.value} ${metric.name === 'Duplication détectée' && metric.value > 0 ? 'blocs' : ''} | > ${metric.threshold} | ${statusIcon} |\n`;
    }
    
    // Formater les vulnérabilités de sécurité
    let securityText = '';
    if (analysis.securityVulnerabilities.length > 0) {
      securityText = "| Type de faille | Ligne(s) | Description rapide | Gravité |\n";
      securityText += "|--------------|---------|-------------------|--------|\n";
      
      for (const vuln of analysis.securityVulnerabilities) {
        const severityIcon = vuln.severity === 'critical' ? '🔴 Critique' : 
                            vuln.severity === 'high' ? '🔴 Haute' :
                            vuln.severity === 'medium' ? '⚠️ Moyen' : '⚡ Faible';
        
        securityText += `| ${vuln.type} | ${vuln.lines.join(', ')} | \`${vuln.code.length > 30 ? vuln.code.substring(0, 30) + '...' : vuln.code}\` | ${severityIcon} |\n`;
      }
    } else {
      securityText = "Aucune vulnérabilité de sécurité critique détectée.\n\n";
    }
    
    // Assembler la section complète
    return `## 5. Qualité & Risques

### 5.1. Comportements dynamiques
${dynamicBehaviorsText}

### 5.2. Complexité estimée
${complexityText}

Outil IA utilisé : \`complexity-score.ts\` (score McCabe + duplication + inline density)

### 5.3. Risques de sécurité détectés
${securityText}

Score de sécurité IA (0 à 10) : ${analysis.securityScore} ${analysis.securityScore < 5 ? '❗' : analysis.securityScore < 7 ? '⚠️' : '✅'}

### 5.4. Recommandations de sécurité

${analysis.securityVulnerabilities.length > 0 ? 
  analysis.securityVulnerabilities.map(v => `- ${v.recommendation}`).filter((v, i, a) => a.indexOf(v) === i).join('\n') : 
  '- Maintenir le niveau de sécurité actuel lors de la migration'
}

### 5.5. Score global de risque

Qualité technique : ${analysis.qualityScore}/10
Sécurité : ${analysis.securityScore}/10
**Score global : ${analysis.overallRiskScore}/10** ${analysis.overallRiskScore < 5 ? '🚨 Migration prioritaire' : analysis.overallRiskScore < 7 ? '⚠️ À surveiller' : '✅ Standard'}`;
  }

  /**
   * Génère un fichier risk_score.json
   */
  public async generateRiskScoreJson(): Promise<void> {
    const analysis = await this.analyze();
    const outputPath = this.filePath.replace('.php', '.risk_score.json');
    
    const riskScore = {
      file: this.fileName,
      timestamp: new Date().toISOString(),
      scores: {
        security: analysis.securityScore,
        quality: analysis.qualityScore,
        overall: analysis.overallRiskScore
      },
      metrics: {
        securityVulnerabilities: analysis.securityVulnerabilities.length,
        dynamicBehaviors: analysis.dynamicBehaviors.length,
        complexityIssues: analysis.complexityMetrics.filter(m => m.status !== 'ok').length
      },
      migrationPriority: analysis.overallRiskScore < 5 ? 'high' : analysis.overallRiskScore < 7 ? 'medium' : 'low'
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(riskScore, null, 2));
  }

  /**
   * Génère un fichier security_patch_plan.md
   */
  public async generateSecurityPatchPlan(): Promise<void> {
    const analysis = await this.analyze();
    const outputPath = this.filePath.replace('.php', '.security_patch_plan.md');
    
    if (analysis.securityVulnerabilities.length === 0) {
      const content = `# Plan de sécurité pour ${this.fileName}

## Résumé

Aucune vulnérabilité de sécurité critique détectée.

## Recommandations générales

- Maintenir le niveau de sécurité actuel lors de la migration
- Appliquer les bonnes pratiques de Remix/NestJS pour la validation des entrées

## Score de sécurité

${analysis.securityScore}/10 ✅
`;
      fs.writeFileSync(outputPath, content);
      return;
    }
    
    // Générer le plan de correction pour chaque vulnérabilité
    let vulnerabilitiesSection = '';
    
    for (const vuln of analysis.securityVulnerabilities) {
      vulnerabilitiesSection += `### ${vuln.type} (${vuln.severity})

- **Localisation**: Ligne(s) ${vuln.lines.join(', ')}
- **Description**: ${vuln.description}
- **Code vulnérable**:
\`\`\`php
${vuln.code}
\`\`\`

#### Plan de correction

1. ${vuln.recommendation}
${this.generateCorrectionExample(vuln)}

`;
    }
    
    const content = `# Plan de sécurité pour ${this.fileName}

## Résumé

Ce fichier présente ${analysis.securityVulnerabilities.length} vulnérabilité(s) de sécurité qui doivent être corrigées lors de la migration.

- Score de sécurité actuel: ${analysis.securityScore}/10 ${analysis.securityScore < 5 ? '❗' : '⚠️'}
- Niveau de priorité: ${analysis.overallRiskScore < 5 ? 'HAUTE' : analysis.overallRiskScore < 7 ? 'MOYENNE' : 'BASSE'}

## Vulnérabilités détectées et plan de correction

${vulnerabilitiesSection}

## Migration vers NestJS/Remix

### NestJS (Backend)

- Utiliser les DTO avec class-validator pour valider toutes les entrées
- Remplacer les requêtes SQL par des modèles Prisma
- Utiliser des Guards pour la gestion des autorisations
- Centraliser la logique métier dans des Services

### Remix (Frontend)

- Utiliser l'échappement automatique de JSX pour éviter les XSS
- Centraliser la gestion des formulaires avec des validations
- Implémenter des tokens CSRF pour tous les formulaires
- Utiliser les Actions et Loaders pour séparer clairement les logiques

## Planning de correction

1. Créer les modèles Prisma correspondants
2. Implémenter les DTO de validation
3. Développer les contrôleurs NestJS sécurisés
4. Mettre en place les routes Remix avec validation

## Validation

- Prévoir des tests de sécurité automatisés
- Envisager un scan de vulnérabilité sur l'application migrée
`;

    fs.writeFileSync(outputPath, content);
  }

  /**
   * Génère un exemple de correction pour une vulnérabilité
   */
  private generateCorrectionExample(vulnerability: SecurityVulnerability): string {
    let example = '';
    
    switch (vulnerability.type) {
      case 'SQL Injection':
        example = `2. Remplacer par une requête Prisma:
\`\`\`typescript
// NestJS avec Prisma
const user = await this.prisma.user.findUnique({
  where: {
    id: parseInt(id)
  }
});
\`\`\``;
        break;
        
      case 'Cross-Site Scripting (XSS)':
        example = `2. Utiliser l'échappement approprié:
\`\`\`php
// PHP: Utiliser htmlspecialchars
echo htmlspecialchars($_GET['msg']);

// Remix: JSX échappe automatiquement
<div>{data.message}</div>
\`\`\``;
        break;
        
      case 'Header Injection':
        example = `2. Valider strictement les entrées:
\`\`\`typescript
// NestJS
@Get('redirect')
redirect(@Query('url', new ParseUrlPipe()) url: string) {
  return { url };
}
\`\`\``;
        break;
        
      case 'File Inclusion':
        example = `2. Utiliser un mécanisme sécurisé:
\`\`\`typescript
// Approche Remix
const ALLOWED_PAGES = ['about', 'contact', 'home'];

export async function loader({ params }) {
  if (!ALLOWED_PAGES.includes(params.page)) {
    throw new Response('Not Found', { status: 404 });
  }
  return { page: params.page };
}
\`\`\``;
        break;
        
      case 'CSRF':
        example = `2. Implémenter la protection CSRF:
\`\`\`typescript
// Remix avec protection CSRF
export const action = async ({ request }) => {
  const formData = await request.formData();
  const token = formData.get('csrf');
  
  if (!validateCsrfToken(token)) {
    throw new Response('Invalid CSRF token', { status: 403 });
  }
  
  // Traitement du formulaire...
};
\`\`\``;
        break;
        
      default:
        example = `2. Remplacer par une implémentation sécurisée conforme aux standards NestJS/Remix`;
    }
    
    return example;
  }
}

// Point d'entrée du script si exécuté directement
if (require.main === module) {
  if (process.argv.length < 3) {
    console.error('Usage: node analyze-security-risks.ts <file-path>');
    process.exit(1);
  }
  
  const filePath = process.argv[2];
  const analyzer = new SecurityRiskAnalyzer(filePath);
  
  analyzer.generateAuditSection()
    .then(section => {
      console.log(section);
      return analyzer.generateRiskScoreJson();
    })
    .then(() => {
      return analyzer.generateSecurityPatchPlan();
    })
    .then(() => {
      console.log(`Analyse de sécurité terminée pour ${filePath}`);
      console.log(`Fichiers générés: ${filePath.replace('.php', '.risk_score.json')} et ${filePath.replace('.php', '.security_patch_plan.md')}`);
    })
    .catch(error => {
      console.error(`Erreur: ${error}`);
      process.exit(1);
    });
}
