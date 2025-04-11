import { BaseAgent } from '../core/BaseAgent';

export class QualityAgent extends BaseAgent {
  /**
   * Analyse la qualité, la complexité et la sécurité du code PHP
   */
  public async analyze(): Promise<void> {
    // Évaluer la complexité cyclomatique
    const complexity = this.evaluateComplexity();
    
    // Analyser les risques de sécurité
    const securityRisks = this.analyzeSecurityRisks();
    
    // Évaluer la qualité générale
    const overallQuality = this.evaluateOverallQuality();
    
    // Générer les sections d'audit
    this.addSection(
      'cyclomatic-complexity',
      'Complexité cyclomatique',
      complexity,
      'technical',
      this.determineComplexitySeverity(complexity)
    );
    
    this.addSection(
      'security-risks',
      'Risques de sécurité',
      securityRisks.content,
      'security',
      securityRisks.severity
    );
    
    this.addSection(
      'overall-quality',
      'Qualité générale',
      overallQuality.content,
      'technical',
      overallQuality.severity
    );
  }
  
  /**
   * Évalue la complexité cyclomatique du code
   */
  private evaluateComplexity(): string {
    const fileContent = this.fileContent;
    let complexity = '';
    
    // Compter les structures de contrôle de flux
    const ifCount = (fileContent.match(/if\s*\(/g) || []).length;
    const elseIfCount = (fileContent.match(/else\s*if\s*\(/g) || []).length;
    const switchCount = (fileContent.match(/switch\s*\(/g) || []).length;
    const caseCount = (fileContent.match(/case\s+/g) || []).length;
    const forCount = (fileContent.match(/for\s*\(/g) || []).length;
    const foreachCount = (fileContent.match(/foreach\s*\(/g) || []).length;
    const whileCount = (fileContent.match(/while\s*\(/g) || []).length;
    const doWhileCount = (fileContent.match(/do\s*{/g) || []).length;
    const ternaryCount = (fileContent.match(/\?.*:/g) || []).length;
    
    // Calcul approximatif de la complexité cyclomatique
    const flowControlCount = ifCount + elseIfCount + caseCount + forCount + 
                            foreachCount + whileCount + doWhileCount + ternaryCount;
    
    // Complexité = 1 + nombre de structures de contrôle
    const cyclomaticComplexity = 1 + flowControlCount;
    
    // Évaluer la complexité
    let complexityRating = '';
    if (cyclomaticComplexity <= 5) {
      complexityRating = 'Faible';
    } else if (cyclomaticComplexity <= 10) {
      complexityRating = 'Modérée';
    } else if (cyclomaticComplexity <= 20) {
      complexityRating = 'Élevée';
    } else {
      complexityRating = 'Très élevée';
    }
    
    // Calculer la profondeur maximale d'imbrication
    const lines = fileContent.split('\n');
    let maxNestingLevel = 0;
    let currentNestingLevel = 0;
    
    lines.forEach(line => {
      // Incrémenter le niveau d'imbrication pour les ouvertures de blocs
      if (line.includes('{')) {
        currentNestingLevel += (line.match(/{/g) || []).length;
      }
      
      // Mettre à jour le niveau maximal observé
      maxNestingLevel = Math.max(maxNestingLevel, currentNestingLevel);
      
      // Décrémenter le niveau d'imbrication pour les fermetures de blocs
      if (line.includes('}')) {
        currentNestingLevel -= (line.match(/}/g) || []).length;
      }
    });
    
    // Générer le rapport de complexité
    complexity = `Complexité cyclomatique estimée: ${cyclomaticComplexity} (${complexityRating})\n\n`;
    complexity += `Détail des structures de contrôle :\n`;
    complexity += `- ${ifCount} if, ${elseIfCount} else if\n`;
    complexity += `- ${switchCount} switch, ${caseCount} case\n`;
    complexity += `- ${forCount} for, ${foreachCount} foreach, ${whileCount} while, ${doWhileCount} do-while\n`;
    complexity += `- ${ternaryCount} opérateurs ternaires\n\n`;
    complexity += `Profondeur maximale d'imbrication: ${maxNestingLevel} niveau(x)`;
    
    return complexity;
  }
  
  /**
   * Détermine le niveau de sévérité basé sur la complexité
   */
  private determineComplexitySeverity(complexityText: string): 'info' | 'warning' | 'critical' {
    // Extraire la valeur numérique de la complexité
    const match = complexityText.match(/Complexité cyclomatique estimée: (\d+)/);
    if (!match) return 'info';
    
    const complexity = parseInt(match[1], 10);
    
    if (complexity <= 10) {
      return 'info';
    } else if (complexity <= 20) {
      return 'warning';
    } else {
      return 'critical';
    }
  }
  
  /**
   * Analyse les risques de sécurité dans le code
   */
  private analyzeSecurityRisks(): { content: string, severity: 'info' | 'warning' | 'critical' } {
    const fileContent = this.fileContent;
    let securityRisks = '';
    let severity: 'info' | 'warning' | 'critical' = 'info';
    
    // Tableau pour stocker les problèmes détectés
    const issues: { issue: string, severity: 'info' | 'warning' | 'critical' }[] = [];
    
    // Vérifier les injections SQL
    if (
      (fileContent.includes('mysql_query') || fileContent.includes('mysqli_query')) &&
      (fileContent.includes('$_GET') || fileContent.includes('$_POST') || fileContent.includes('$_REQUEST'))
    ) {
      if (!fileContent.includes('prepare') && !fileContent.includes('real_escape_string')) {
        issues.push({
          issue: "Risque d'injection SQL : utilisation de variables non échappées dans les requêtes",
          severity: 'critical'
        });
      }
    }
    
    // Vérifier les failles XSS
    if (
      (fileContent.includes('echo') || fileContent.includes('print')) &&
      (fileContent.includes('$_GET') || fileContent.includes('$_POST') || fileContent.includes('$_REQUEST'))
    ) {
      if (!fileContent.includes('htmlspecialchars') && !fileContent.includes('htmlentities')) {
        issues.push({
          issue: "Risque XSS : affichage de variables utilisateur non échappées",
          severity: 'critical'
        });
      }
    }
    
    // Vérifier l'inclusion de fichiers dynamique
    if (
      (fileContent.includes('include') || fileContent.includes('require')) &&
      (fileContent.includes('$_GET') || fileContent.includes('$_POST') || fileContent.includes('$_REQUEST'))
    ) {
      issues.push({
        issue: "Risque d'inclusion de fichier : inclusion basée sur des paramètres utilisateur",
        severity: 'critical'
      });
    }
    
    // Vérifier les variables non initialisées
    if (fileContent.match(/\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\s*[^=]/g)) {
      issues.push({
        issue: "Possibles variables non initialisées",
        severity: 'warning'
      });
    }
    
    // Vérifier les mauvaises pratiques de session
    if (fileContent.includes('$_SESSION') && !fileContent.includes('session_start')) {
      issues.push({
        issue: "Utilisation de session sans session_start()",
        severity: 'warning'
      });
    }
    
    // Vérifier l'utilisation de fonctions dépréciées
    const deprecatedFunctions = [
      'mysql_connect', 'mysql_query', 'mysql_fetch_array',
      'ereg', 'eregi', 'split',
      'create_function', 'mcrypt_encrypt'
    ];
    
    for (const func of deprecatedFunctions) {
      if (fileContent.includes(func)) {
        issues.push({
          issue: `Utilisation de la fonction dépréciée ${func}()`,
          severity: 'warning'
        });
      }
    }
    
    // Si des problèmes critiques ont été détectés, définir la sévérité à critical
    if (issues.some(issue => issue.severity === 'critical')) {
      severity = 'critical';
    } else if (issues.some(issue => issue.severity === 'warning')) {
      severity = 'warning';
    }
    
    // Générer le rapport de sécurité
    if (issues.length > 0) {
      for (const issue of issues) {
        const icon = issue.severity === 'critical' ? '⚠️' : '⚠';
        securityRisks += `${icon} ${issue.issue}\n`;
      }
    } else {
      securityRisks = "Aucun problème de sécurité majeur détecté.";
    }
    
    return { content: securityRisks, severity };
  }
  
  /**
   * Évalue la qualité générale du code
   */
  private evaluateOverallQuality(): { content: string, severity: 'info' | 'warning' | 'critical' } {
    const fileContent = this.fileContent;
    let overallQuality = '';
    let severity: 'info' | 'warning' | 'critical' = 'info';
    
    // Initialiser les scores
    let debtScore = 0; // 0-100, 100 étant la pire dette technique
    
    // Détecter les longs blocs de code
    const lines = fileContent.split('\n');
    if (lines.length > 500) {
      debtScore += 20;
      overallQuality += "- Fichier très long (> 500 lignes) : difficile à maintenir\n";
      severity = 'warning';
    } else if (lines.length > 200) {
      debtScore += 10;
      overallQuality += "- Fichier long (> 200 lignes) : pourrait être divisé\n";
    }
    
    // Détecter les longues fonctions
    const functionMatches = fileContent.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
    let longFunctionsCount = 0;
    
    functionMatches.forEach(functionCode => {
      const functionLines = functionCode.split('\n').length;
      if (functionLines > 50) {
        longFunctionsCount++;
      }
    });
    
    if (longFunctionsCount > 0) {
      debtScore += 15;
      overallQuality += `- ${longFunctionsCount} fonction(s) très longue(s) (> 50 lignes)\n`;
      severity = 'warning';
    }
    
    // Détecter l'absence de documentation
    if (!fileContent.includes('/**') && !fileContent.includes('/*')) {
      debtScore += 10;
      overallQuality += "- Absence de documentation ou commentaires\n";
    }
    
    // Détecter le code mort potentiel
    const commentedCodeBlocks = (fileContent.match(/\/\/.*\w+\s*\(/g) || []).length;
    if (commentedCodeBlocks > 5) {
      debtScore += 5;
      overallQuality += "- Présence de code commenté (possible code mort)\n";
    }
    
    // Détecter les variables globales
    const globalVars = (fileContent.match(/global\s+\$/g) || []).length;
    if (globalVars > 0) {
      debtScore += 10;
      overallQuality += `- Utilisation de ${globalVars} variable(s) globale(s)\n`;
    }
    
    // Détecter l'orientation objet
    const isOOP = fileContent.includes('class ') && fileContent.includes('function ');
    if (!isOOP) {
      debtScore += 15;
      overallQuality += "- Code non orienté objet, style procédural\n";
    }
    
    // Évaluer la lisibilité (indentation, formatage)
    const inconsistentIndentation = lines.some(line => 
      line.trim().length > 0 && line.length - line.trimLeft().length === 1
    );
    
    if (inconsistentIndentation) {
      debtScore += 5;
      overallQuality += "- Indentation inconsistante\n";
    }
    
    // Détecter les constantes magiques
    const magicNumbers = fileContent.match(/\W\d+\W/g) || [];
    if (magicNumbers.length > 10) {
      debtScore += 5;
      overallQuality += "- Nombreuses valeurs numériques codées en dur\n";
    }
    
    // Catégoriser la qualité générale selon le score de dette
    let qualityRating;
    if (debtScore < 20) {
      qualityRating = "Bonne";
    } else if (debtScore < 40) {
      qualityRating = "Moyenne";
      if (severity === 'info') severity = 'warning';
    } else if (debtScore < 60) {
      qualityRating = "Médiocre";
      severity = 'warning';
    } else {
      qualityRating = "Mauvaise";
      severity = 'critical';
    }
    
    // Ajouter le score et la conclusion
    const conclusion = `\nScore de dette technique: ${debtScore}/100\n` +
                      `Qualité générale: ${qualityRating}\n\n` +
                      `${this.generateQualityRecommendation(debtScore, qualityRating)}`;
    
    // Si aucun problème n'a été identifié
    if (overallQuality === '') {
      overallQuality = "Aucun problème de qualité majeur détecté.";
    }
    
    return { content: overallQuality + conclusion, severity };
  }
  
  /**
   * Génère une recommandation basée sur la qualité du code
   */
  private generateQualityRecommendation(debtScore: number, qualityRating: string): string {
    if (debtScore < 20) {
      return "Recommendation: Ce code est relativement propre et peut être facilement migré.";
    } else if (debtScore < 40) {
      return "Recommendation: Refactorisation légère recommandée avant migration.";
    } else if (debtScore < 60) {
      return "Recommendation: Refactorisation substantielle nécessaire, envisager une réécriture partielle.";
    } else {
      return "Recommendation: Réécriture complète recommandée plutôt que migration.";
    }
  }
}
