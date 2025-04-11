import * as fs from 'fs';
import * as path from 'path';

interface StructureAnalysisResult {
  logicalStructure: {
    functions: Array<{
      name: string;
      role: string;
      lineCount: number;
      nestingDepth: number;
    }>;
    includes: Array<{
      path: string;
      isDuplicate: boolean;
    }>;
    maxNestingDepth: number;
    htmlBlocks: Array<{
      lines: [number, number];
      hasMixedLogic: boolean;
    }>;
    hasHybridStructure: boolean;
  };
  moduleType: {
    type: 'Page (vue)' | 'API handler' | 'Formulaire' | 'Tâche CRON' | 'Classe utilitaire' | 'Mixte';
    confidence: number;
    alerts: string[];
  };
  codeQuality: {
    duplication: {
      score: number;
      details: string;
    };
    inlineLogic: {
      score: number;
      details: string;
    };
    frontendBackendMix: {
      score: number;
      details: string;
    };
    lackOfFunctions: {
      score: number;
      details: string;
    };
    inlineJs: {
      score: number;
      details: string;
    };
    variableNaming: {
      score: number;
      details: string;
    };
    overallScore: number;
  };
}

export class StructureAgent {
  private phpCode: string;
  private filePath: string;
  private rules: any;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.phpCode = fs.readFileSync(filePath, 'utf8');
    this.loadRules();
  }

  private loadRules() {
    try {
      const rulesPath = path.join(__dirname, '..', '.rules', 'structure.rules.json');
      this.rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } catch (error) {
      console.warn('Rules file not found, using default rules');
      this.rules = {
        moduleTypeDetection: {
          page: ["echo", "print", "<html", "<body", "<div", "include"],
          api: ["header(", "json_encode", "api", "REST", "GET", "POST"],
          form: ["<form", "validate", "submit", "input", "POST"],
          cron: ["cron", "schedule", "task", "job", "sleep", "date"],
          utility: ["class", "function", "static", "public function"]
        },
        qualityThresholds: {
          good: 2.5,
          average: 1.5,
          poor: 0
        }
      };
    }
  }

  public async analyze(): Promise<StructureAnalysisResult> {
    // Structure logique du fichier
    const functions = this.analyzeFunctions();
    const includes = this.analyzeIncludes();
    const nestingDepth = this.analyzeNestingDepth();
    const htmlBlocks = this.analyzeHtmlBlocks();
    const hasHybridStructure = this.detectHybridStructure();

    // Type de module
    const moduleType = this.detectModuleType();

    // Qualité du code
    const codeQuality = this.analyzeCodeQuality(functions);

    return {
      logicalStructure: {
        functions,
        includes,
        maxNestingDepth: nestingDepth,
        htmlBlocks,
        hasHybridStructure
      },
      moduleType,
      codeQuality
    };
  }

  private analyzeFunctions(): Array<{name: string; role: string; lineCount: number; nestingDepth: number}> {
    const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*{/g;
    const functions: Array<{name: string; role: string; lineCount: number; nestingDepth: number}> = [];
    
    let match;
    while ((match = functionRegex.exec(this.phpCode)) !== null) {
      const name = match[1];
      const params = match[2];
      const startIndex = match.index;
      
      // Calculer la position de fermeture de l'accolade
      let openBraces = 1;
      let endIndex = startIndex + match[0].length;
      let nestingDepth = 1;
      let maxNestingDepth = 1;
      
      for (let i = endIndex; i < this.phpCode.length; i++) {
        if (this.phpCode[i] === '{') {
          openBraces++;
          nestingDepth++;
          maxNestingDepth = Math.max(maxNestingDepth, nestingDepth);
        } else if (this.phpCode[i] === '}') {
          openBraces--;
          nestingDepth--;
          if (openBraces === 0) {
            endIndex = i;
            break;
          }
        }
      }
      
      // Calculer le nombre de lignes
      const functionCode = this.phpCode.substring(startIndex, endIndex + 1);
      const lineCount = functionCode.split('\n').length;
      
      // Détecter le rôle de la fonction (heuristique simple)
      let role = "Indéterminé";
      if (name.startsWith('get') || name.startsWith('fetch') || name.includes('load')) {
        role = "Récupération de données";
      } else if (name.startsWith('save') || name.startsWith('update') || name.startsWith('insert')) {
        role = "Persistance de données";
      } else if (name.startsWith('check') || name.startsWith('validate') || name.startsWith('is')) {
        role = "Validation";
      } else if (name.startsWith('render') || name.startsWith('display') || name.startsWith('show')) {
        role = "Affichage";
      } else if (name.startsWith('process') || name.startsWith('handle')) {
        role = "Traitement";
      }
      
      functions.push({
        name,
        role,
        lineCount,
        nestingDepth: maxNestingDepth
      });
    }
    
    return functions;
  }

  private analyzeIncludes(): Array<{path: string; isDuplicate: boolean}> {
    const includeRegex = /(include|require|include_once|require_once)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const includes: Array<{path: string; isDuplicate: boolean}> = [];
    const paths = new Set<string>();
    
    let match;
    while ((match = includeRegex.exec(this.phpCode)) !== null) {
      const path = match[2];
      const isDuplicate = paths.has(path);
      paths.add(path);
      
      includes.push({
        path,
        isDuplicate
      });
    }
    
    return includes;
  }

  private analyzeNestingDepth(): number {
    const lines = this.phpCode.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const line of lines) {
      // Compter les ouvertures d'accolades
      const openCount = (line.match(/{/g) || []).length;
      // Compter les fermetures d'accolades
      const closeCount = (line.match(/}/g) || []).length;
      
      currentDepth += openCount - closeCount;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    
    return maxDepth;
  }

  private analyzeHtmlBlocks(): Array<{lines: [number, number]; hasMixedLogic: boolean}> {
    const lines = this.phpCode.split('\n');
    const htmlBlocks: Array<{lines: [number, number]; hasMixedLogic: boolean}> = [];
    
    let inHtmlBlock = false;
    let startLine = 0;
    let hasMixedLogic = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Détection simple de HTML (peut être améliorée)
      const hasHtml = /<\w+[^>]*>/.test(line);
      const hasPhpLogic = /\$\w+|if\s*\(|for\s*\(|while\s*\(|function\s+\w+/.test(line);
      
      if (hasHtml && !inHtmlBlock) {
        inHtmlBlock = true;
        startLine = i + 1; // 1-indexed for human readability
        hasMixedLogic = hasPhpLogic;
      } else if (inHtmlBlock) {
        if (hasPhpLogic) {
          hasMixedLogic = true;
        }
        
        if (!hasHtml && !/<\/\w+>/.test(line) && !line.trim()) {
          inHtmlBlock = false;
          htmlBlocks.push({
            lines: [startLine, i],
            hasMixedLogic
          });
          hasMixedLogic = false;
        }
      }
    }
    
    // Si on est encore dans un bloc HTML à la fin du fichier
    if (inHtmlBlock) {
      htmlBlocks.push({
        lines: [startLine, lines.length],
        hasMixedLogic
      });
    }
    
    return htmlBlocks;
  }

  private detectHybridStructure(): boolean {
    // Détecte si le fichier mélange PHP, HTML et JS
    const hasPhpLogic = /function\s+\w+|if\s*\(|for\s*\(|while\s*\(/.test(this.phpCode);
    const hasHtml = /<html|<body|<div|<p>/.test(this.phpCode);
    const hasJsInline = /<script>|onclick=|onload=/.test(this.phpCode);
    
    return hasPhpLogic && hasHtml && hasJsInline;
  }

  private detectModuleType(): {type: 'Page (vue)' | 'API handler' | 'Formulaire' | 'Tâche CRON' | 'Classe utilitaire' | 'Mixte'; confidence: number; alerts: string[]} {
    const typeScores = {
      'Page (vue)': 0,
      'API handler': 0,
      'Formulaire': 0,
      'Tâche CRON': 0,
      'Classe utilitaire': 0
    };
    
    const alerts: string[] = [];
    
    // Calculer les scores pour chaque type
    for (const [type, patterns] of Object.entries(this.rules.moduleTypeDetection)) {
      let score = 0;
      
      for (const pattern of patterns as string[]) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(this.phpCode)) {
          score++;
        }
      }
      
      switch (type) {
        case 'page':
          typeScores['Page (vue)'] = score;
          break;
        case 'api':
          typeScores['API handler'] = score;
          break;
        case 'form':
          typeScores['Formulaire'] = score;
          break;
        case 'cron':
          typeScores['Tâche CRON'] = score;
          break;
        case 'utility':
          typeScores['Classe utilitaire'] = score;
          break;
      }
    }
    
    // Trouver le type avec le score le plus élevé
    let maxScore = 0;
    let dominantType: 'Page (vue)' | 'API handler' | 'Formulaire' | 'Tâche CRON' | 'Classe utilitaire' | 'Mixte' = 'Mixte';
    
    for (const [type, score] of Object.entries(typeScores)) {
      if (score > maxScore) {
        maxScore = score as number;
        dominantType = type as any;
      }
    }
    
    // Calculer la confiance
    const totalScore = Object.values(typeScores).reduce((sum, score) => sum + (score as number), 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0;
    
    // Détecter si plusieurs types ont des scores élevés
    const highScoreTypes = Object.entries(typeScores)
      .filter(([, score]) => (score as number) >= maxScore * 0.7)
      .map(([type]) => type);
    
    if (highScoreTypes.length > 1) {
      dominantType = 'Mixte';
      alerts.push(`🔶 Mélange détecté de types: ${highScoreTypes.join(', ')}`);
    }
    
    if (this.detectHybridStructure()) {
      alerts.push('🔶 Mélange HTML + logique métier non encapsulée');
    }
    
    return {
      type: dominantType,
      confidence: confidence,
      alerts
    };
  }

  private analyzeCodeQuality(functions: any[]): {
    duplication: {score: number; details: string;};
    inlineLogic: {score: number; details: string;};
    frontendBackendMix: {score: number; details: string;};
    lackOfFunctions: {score: number; details: string;};
    inlineJs: {score: number; details: string;};
    variableNaming: {score: number; details: string;};
    overallScore: number;
  } {
    // Analyse de la duplication
    const duplicationScore = this.analyzeDuplication();
    
    // Analyse de la logique inline
    const inlineLogicScore = this.analyzeInlineLogic();
    
    // Analyse du mélange frontend/backend
    const frontendBackendMixScore = this.analyzeFrontendBackendMix();
    
    // Analyse de l'absence de fonctions
    const lackOfFunctionsScore = this.analyzeLackOfFunctions(functions);
    
    // Analyse du JavaScript inline
    const inlineJsScore = this.analyzeInlineJs();
    
    // Analyse du nommage des variables
    const variableNamingScore = this.analyzeVariableNaming();
    
    // Calculer le score global
    const scores = [
      duplicationScore.score,
      inlineLogicScore.score,
      frontendBackendMixScore.score,
      lackOfFunctionsScore.score,
      inlineJsScore.score,
      variableNamingScore.score
    ];
    
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      duplication: duplicationScore,
      inlineLogic: inlineLogicScore,
      frontendBackendMix: frontendBackendMixScore,
      lackOfFunctions: lackOfFunctionsScore,
      inlineJs: inlineJsScore,
      variableNaming: variableNamingScore,
      overallScore
    };
  }

  private analyzeDuplication(): {score: number; details: string} {
    // Analyse simple de duplication par détection de blocs similaires
    const lines = this.phpCode.split('\n');
    let duplicateBlocksCount = 0;
    
    // Diviser le code en blocs et comparer
    const blockSize = 5; // Taille minimale d'un bloc pour être considéré comme dupliqué
    const blocks: string[] = [];
    
    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines.slice(i, i + blockSize).join('\n');
      blocks.push(block);
    }
    
    // Compter les blocs similaires
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (this.calculateSimilarity(blocks[i], blocks[j]) > 0.8) {
          duplicateBlocksCount++;
          break; // Éviter de compter plusieurs fois le même bloc
        }
      }
    }
    
    // Calculer le score (0-3)
    let score = 3; // Score parfait par défaut
    
    if (duplicateBlocksCount > 0) {
      if (duplicateBlocksCount === 1) {
        score = 2; // Un seul bloc dupliqué
      } else if (duplicateBlocksCount <= 3) {
        score = 1; // Quelques blocs dupliqués
      } else {
        score = 0; // Beaucoup de duplication
      }
    }
    
    let details = "Pas de duplication détectée";
    
    if (duplicateBlocksCount === 1) {
      details = "Un bloc dupliqué détecté";
    } else if (duplicateBlocksCount > 1) {
      details = `${duplicateBlocksCount} blocs dupliqués détectés`;
    }
    
    return {
      score,
      details
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    // Algorithme simple de similarité en convertissant les chaînes en ensembles de caractères
    const set1 = new Set(str1);
    const set2 = new Set(str2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private analyzeInlineLogic(): {score: number; details: string} {
    // Détection de logique PHP embarquée dans le HTML
    const htmlWithPhpRegex = /<[^>]*\s*\?\s*php.*?>/g;
    const inlinePhpCount = (this.phpCode.match(htmlWithPhpRegex) || []).length;
    
    // Détection de conditions imbriquées dans le HTML
    const inlineConditionsRegex = /<[^>]*\s*<\?php\s*(if|for|while|foreach).*?>/g;
    const inlineConditionsCount = (this.phpCode.match(inlineConditionsRegex) || []).length;
    
    // Calculer le score (0-3)
    let score = 3; // Score parfait par défaut
    
    if (inlinePhpCount > 0 || inlineConditionsCount > 0) {
      if (inlinePhpCount <= 3 && inlineConditionsCount === 0) {
        score = 2; // Quelques expressions PHP simples
      } else if (inlinePhpCount <= 5 && inlineConditionsCount <= 2) {
        score = 1; // Plusieurs expressions PHP ou quelques conditions
      } else {
        score = 0; // Beaucoup de logique inline
      }
    }
    
    let details = "Pas de logique inline détectée";
    
    if (inlinePhpCount > 0 && inlineConditionsCount > 0) {
      details = `${inlinePhpCount} expressions PHP et ${inlineConditionsCount} conditions inline détectées`;
    } else if (inlinePhpCount > 0) {
      details = `${inlinePhpCount} expressions PHP inline détectées`;
    } else if (inlineConditionsCount > 0) {
      details = `${inlineConditionsCount} conditions inline détectées`;
    }
    
    return {
      score,
      details
    };
  }

  private analyzeFrontendBackendMix(): {score: number; details: string} {
    // Détection de mélange frontend/backend
    const hasHtml = /<html|<body|<div|<p>/.test(this.phpCode);
    const hasPhpLogic = /function\s+\w+|if\s*\(|for\s*\(|while\s*\(/.test(this.phpCode);
    const hasDbQueries = /mysql_|mysqli_|PDO|->query|SELECT|INSERT|UPDATE|DELETE FROM/.test(this.phpCode);
    
    // Calculer le score (0-3)
    let score = 3; // Score parfait par défaut
    
    if (hasHtml && hasPhpLogic) {
      score -= 1; // Mélange HTML et PHP
      
      if (hasDbQueries) {
        score -= 1; // Mélange HTML, PHP et requêtes DB
      }
      
      if (this.detectHybridStructure()) {
        score -= 1; // Mélange HTML, PHP et JS
      }
    }
    
    let details = "Bonne séparation frontend/backend";
    
    if (score === 2) {
      details = "Mélange HTML et PHP";
    } else if (score === 1) {
      details = "Mélange HTML, PHP et accès DB";
    } else if (score === 0) {
      details = "Mélange complet HTML, PHP, DB et JS";
    }
    
    return {
      score,
      details
    };
  }

  private analyzeLackOfFunctions(functions: any[]): {score: number; details: string} {
    const lineCount = this.phpCode.split('\n').length;
    const functionsCount = functions.length;
    
    // Calculer la couverture du code par des fonctions
    const functionsCoverage = functions.reduce((sum, func) => sum + func.lineCount, 0) / lineCount;
    
    // Calculer le score (0-3)
    let score = 3; // Score parfait par défaut
    
    if (functionsCount === 0) {
      score = 0; // Aucune fonction
    } else if (functionsCount < 2 && lineCount > 50) {
      score = 1; // Peu de fonctions pour un fichier long
    } else if (functionsCoverage < 0.6) {
      score = 2; // Couverture moyenne des fonctions
    }
    
    let details = "Bonne encapsulation du code en fonctions";
    
    if (score === 0) {
      details = "Aucune fonction définie";
    } else if (score === 1) {
      details = `Seulement ${functionsCount} fonction(s) pour ${lineCount} lignes`;
    } else if (score === 2) {
      details = `Seulement ${Math.round(functionsCoverage * 100)}% du code est encapsulé dans des fonctions`;
    }
    
    return {
      score,
      details
    };
  }

  private analyzeInlineJs(): {score: number; details: string} {
    // Détection de JS inline
    const onEventRegex = /on(click|load|change|submit|mouseover|mouseout|keyup|keydown|blur|focus)=["'][^"']+["']/g;
    const onEventCount = (this.phpCode.match(onEventRegex) || []).length;
    
    const inlineScriptRegex = /<script>[^<]*<\/script>/g;
    const inlineScriptCount = (this.phpCode.match(inlineScriptRegex) || []).length;
    
    // Calculer le score (0-3)
    let score = 3; // Score parfait par défaut
    
    if (onEventCount > 0 || inlineScriptCount > 0) {
      if (onEventCount <= 2 && inlineScriptCount === 0) {
        score = 2; // Quelques événements inline
      } else if (onEventCount <= 5 && inlineScriptCount <= 1) {
        score = 1; // Plusieurs événements inline ou un script
      } else {
        score = 0; // Beaucoup de JS inline
      }
    }
    
    let details = "Pas de JavaScript inline détecté";
    
    if (onEventCount > 0 && inlineScriptCount > 0) {
      details = `${onEventCount} événements et ${inlineScriptCount} scripts inline détectés`;
    } else if (onEventCount > 0) {
      details = `${onEventCount} événements inline détectés`;
    } else if (inlineScriptCount > 0) {
      details = `${inlineScriptCount} scripts inline détectés`;
    }
    
    return {
      score,
      details
    };
  }

  private analyzeVariableNaming(): {score: number; details: string} {
    // Détection de variables mal nommées
    const variableRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
    const variables = new Set<string>();
    
    let match;
    while ((match = variableRegex.exec(this.phpCode)) !== null) {
      variables.add(match[1]);
    }
    
    // Compter les variables mal nommées
    const badNamedCount = Array.from(variables).filter(name => 
      name.length < 2 || 
      ['a', 'b', 'c', 'd', 'e', 'i', 'j', 'k', 'x', 'y', 'z', 'tmp', 'temp', 'foo', 'bar'].includes(name)
    ).length;
    
    // Calculer le score (0-3)
    let score = 3; // Score parfait par défaut
    
    if (badNamedCount > 0) {
      const badRatio = badNamedCount / variables.size;
      
      if (badRatio < 0.1) {
        score = 2; // Quelques variables mal nommées
      } else if (badRatio < 0.3) {
        score = 1; // Plusieurs variables mal nommées
      } else {
        score = 0; // Beaucoup de variables mal nommées
      }
    }
    
    let details = "Bonnes pratiques de nommage des variables";
    
    if (badNamedCount > 0) {
      details = `${badNamedCount} variable(s) mal nommée(s) sur ${variables.size}`;
    }
    
    return {
      score,
      details
    };
  }

  /**
   * Génère une section formatée pour le fichier .audit.md
   */
  public async generateAuditSection(): Promise<string> {
    const analysis = await this.analyze();
    
    // Formater la structure logique
    let functionsText = '';
    if (analysis.logicalStructure.functions.length > 0) {
      functionsText = analysis.logicalStructure.functions
        .map(f => `\`${f.name}\` (${f.role}, ${f.lineCount} lignes, profondeur ${f.nestingDepth})`)
        .join(', ');
    } else {
      functionsText = 'Aucune fonction définie';
    }
    
    let includesText = '';
    if (analysis.logicalStructure.includes.length > 0) {
      includesText = analysis.logicalStructure.includes
        .map(i => `\`${i.path}\`${i.isDuplicate ? ' (dupliqué)' : ''}`)
        .join(', ');
    } else {
      includesText = 'Aucun fichier inclus';
    }
    
    const htmlBlocksText = analysis.logicalStructure.htmlBlocks.length > 0
      ? `✅ ${analysis.logicalStructure.htmlBlocks.length} bloc(s) détecté(s)${analysis.logicalStructure.htmlBlocks.some(b => b.hasMixedLogic) ? ' avec logique PHP mélangée' : ''}`
      : '❌ non';
    
    // Formater le module type
    const moduleTypeAlerts = analysis.moduleType.alerts.length > 0
      ? `\n- Alertes : ${analysis.moduleType.alerts.join(', ')}`
      : '';
    
    // Formater le tableau de qualité du code
    const qualityTable = `| Critère | Score | Commentaire |
|--------|-------|-------------|
| Duplication | ${analysis.codeQuality.duplication.score}/3 | ${analysis.codeQuality.duplication.details} |
| Logique inline | ${analysis.codeQuality.inlineLogic.score}/3 | ${analysis.codeQuality.inlineLogic.details} |
| Mix frontend/backend | ${analysis.codeQuality.frontendBackendMix.score}/3 | ${analysis.codeQuality.frontendBackendMix.details} |
| Absence de fonctions | ${analysis.codeQuality.lackOfFunctions.score}/3 | ${analysis.codeQuality.lackOfFunctions.details} |
| JS inline | ${analysis.codeQuality.inlineJs.score}/3 | ${analysis.codeQuality.inlineJs.details} |
| Nom des variables | ${analysis.codeQuality.variableNaming.score}/3 | ${analysis.codeQuality.variableNaming.details} |`;
    
    // Générer la section d'audit complète
    return `## 2. Structure

### 2.1. Structure logique du fichier
- Fonctions détectées : ${functionsText}
- Includes : ${includesText}
- Profondeur max de conditions imbriquées : ${analysis.logicalStructure.maxNestingDepth}
- Présence de blocs HTML avec logique backend imbriquée : ${htmlBlocksText}

### 2.2. Type de module
- Type dominant : \`${analysis.moduleType.type}\`${moduleTypeAlerts}

### 2.3. Qualité du code
${qualityTable}

> 🔧 Qualité structurelle estimée : **${analysis.codeQuality.overallScore.toFixed(1)} / 3**`;
  }

  /**
   * Met à jour le fichier backlog.json avec les résultats de l'analyse
   */
  public async updateBacklog(): Promise<void> {
    const analysis = await this.analyze();
    const baseFileName = path.basename(this.filePath);
    const backlogPath = path.join(path.dirname(this.filePath), `${baseFileName}.backlog.json`);
    
    let backlog: any = {
      file: baseFileName,
      priority: 5,
      status: "to-do",
      tasks: []
    };
    
    // Charger le backlog existant s'il existe
    try {
      if (fs.existsSync(backlogPath)) {
        backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du backlog: ${error}`);
    }
    
    // Mettre à jour le score de structure
    backlog.structure_score = analysis.codeQuality.overallScore;
    
    // Ajouter une tâche de refactoring si le score est trop bas
    if (analysis.codeQuality.overallScore < 1.5 && !backlog.tasks.some((t: any) => t.type === 'refactorStructure')) {
      backlog.tasks.push({
        type: "refactorStructure",
        target: "backend",
        status: "pending",
        description: `Refactoriser la structure du code (score: ${analysis.codeQuality.overallScore.toFixed(1)}/3)`
      });
    }
    
    // Ajouter le type de module détecté
    backlog.logic_type = analysis.moduleType.type;
    
    // Écrire le backlog mis à jour
    fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  }
}

// Point d'entrée du script si exécuté directement
if (require.main === module) {
  if (process.argv.length < 3) {
    console.error('Usage: node agent-structure.ts <file-path>');
    process.exit(1);
  }
  
  const filePath = process.argv[2];
  const agent = new StructureAgent(filePath);
  
  agent.generateAuditSection()
    .then(section => {
      console.log(section);
      return agent.updateBacklog();
    })
    .then(() => {
      console.log(`Backlog mis à jour pour ${filePath}`);
    })
    .catch(error => {
      console.error(`Erreur: ${error}`);
      process.exit(1);
    });
}
