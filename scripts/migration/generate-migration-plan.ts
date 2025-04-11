/**
 * generate-migration-plan.ts
 * 
 * Script pour générer automatiquement des plans de migration structurés
 * pour les fichiers PHP audités, avec une stratégie claire, un scoring
 * et des recommandations exploitables.
 * 
 * Usage: ts-node generate-migration-plan.ts <chemin-fichier.php> [--export-all]
 * Options:
 *   --export-all: Génère tous les formats de sortie (.migration_plan.md, .backlog.json)
 *   --inject-supabase: Injecte directement le backlog dans Supabase via n8n
 *   --advanced-analysis: Utilise les outils d'analyse statique PHP avancés
 * 
 * Date: 11 avril 2025
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import { analyzeWithAdvancedTools } from './enhanced-php-analyzer';

// Types
interface MigrationScore {
  couplageInterne: number;
  complexiteMetier: number;
  qualiteTechnique: number;
  dependancesExternes: number;
  volumeLignes: number;
}

interface RefactoringTask {
  description: string;
  possible: boolean;
  priority: number; // 1 (haute) à 5 (basse)
}

interface MigrationTargetNestJS {
  elementPhp: string;
  cibleNestJS: string;
}

interface MigrationTargetRemix {
  elementPhp: string;
  cibleRemix: string;
}

interface MigrationPlan {
  filePath: string;
  fileName: string;
  category: string;
  impact: {
    isShared: boolean;
    callersCount: number;
    centralityDegree: number;
    type: string;
    requiresDedicatedWave: boolean;
  };
  scoring: MigrationScore;
  globalScore: number; // 1 à 5
  difficulty: string;
  refactoringPHP: RefactoringTask[];
  difficulties: string[];
  migrationPlanNestJS: MigrationTargetNestJS[];
  migrationPlanRemix: MigrationTargetRemix[];
  specializationBackendFrontend: {
    nestjs: string[];
    remix: string[];
  };
  tasks: string[];
  recommendations: string[];
  outputs: {
    audit: string;
    plan: string;
    backlog: string;
    generatedModule: string;
    analysisReport?: string | null;
  };
  migrationWave: number;
  advancedMetrics?: {
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    typeCoverage: number;
    codeSmells: number;
    securityIssues: number;
  } | null;
}

// Configuration
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/migration-plan';
const SUPABASE_WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 'http://localhost:5678/webhook/backlog-inject';

/**
 * Analyse un fichier PHP pour générer un plan de migration
 */
async function analyzePHPFile(filePath: string, useAdvancedAnalysis = false): Promise<MigrationPlan> {
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Analyse avancée si demandée
  let advancedAnalysis = null;
  if (useAdvancedAnalysis) {
    try {
      console.log('📊 Exécution de l\'analyse statique avancée...');
      advancedAnalysis = await analyzeWithAdvancedTools(filePath);
      console.log('✅ Analyse statique avancée terminée');
    } catch (error) {
      console.error('⚠️ Impossible d\'exécuter l\'analyse avancée:', error);
      console.log('⚠️ Retour à l\'analyse standard');
    }
  }
  
  // En environnement réel, cette analyse serait basée sur des règles plus complexes
  // Pour ce prototype, nous utilisons quelques heuristiques simples
  
  // Simuler l'analyse de complexité
  const lineCount = fileContent.split('\n').length;
  const sqlCount = (fileContent.match(/SELECT|INSERT|UPDATE|DELETE/gi) || []).length;
  const includeCount = (fileContent.match(/include|require/gi) || []).length;
  const sessionUsage = fileContent.includes('$_SESSION');
  const formHandling = fileContent.includes('$_POST') || fileContent.includes('$_GET');
  const htmlMixing = (fileContent.match(/<div|<span|<table/gi) || []).length > 0;
  
  // Déterminer le score de migration en utilisant l'analyse avancée si disponible
  const score: MigrationScore = {
    couplageInterne: advancedAnalysis ? 
      Math.min(Math.ceil(advancedAnalysis.metrics.dependencies.length), 5) : 
      Math.min(includeCount, 5),
      
    complexiteMetier: advancedAnalysis ? 
      Math.min(Math.ceil(advancedAnalysis.metrics.cyclomaticComplexity / 5), 5) : 
      Math.min(Math.floor(sqlCount / 2), 5),
      
    qualiteTechnique: advancedAnalysis ? 
      Math.min(Math.ceil((100 - advancedAnalysis.metrics.maintainabilityIndex) / 20), 5) : 
      htmlMixing ? 2 : 4,
      
    dependancesExternes: advancedAnalysis ? 
      Math.min(advancedAnalysis.metrics.securityIssues.length + 2, 5) : 
      sessionUsage ? 3 : 2,
      
    volumeLignes: Math.min(Math.floor(lineCount / 100), 5)
  };
  
  // Calculer le score global
  const globalScore = Math.ceil(
    (score.couplageInterne + score.complexiteMetier + score.qualiteTechnique + 
     score.dependancesExternes + score.volumeLignes) / 5
  );
  
  // Déterminer le type de fichier
  const isCart = fileName.includes('panier') || fileName.includes('cart');
  const isAuth = fileName.includes('auth') || fileName.includes('login');
  const isProductPage = fileName.includes('produit') || fileName.includes('product');
  
  let fileType = 'Page standard';
  if (isCart) fileType = 'Service critique partagé (cart / session)';
  else if (isAuth) fileType = 'Service critique partagé (authentification)';
  else if (isProductPage) fileType = 'Page produit (fiche)';
  
  // Générer des tâches de refactoring basées sur l'analyse avancée si disponible
  const refactoringTasks: RefactoringTask[] = [];
  
  if (advancedAnalysis) {
    // Ajouter des tâches basées sur les problèmes trouvés par PHPStan
    if (advancedAnalysis.phpStan.errors.length > 0) {
      refactoringTasks.push({
        description: 'Corriger les erreurs de typage et les problèmes PHPStan',
        possible: true,
        priority: 1
      });
    }
    
    // Ajouter des tâches basées sur les problèmes trouvés par PHPMD
    if (advancedAnalysis.phpMd.violations.length > 0) {
      refactoringTasks.push({
        description: 'Refactorer le code pour résoudre les problèmes de design détectés par PHPMD',
        possible: true,
        priority: 2
      });
    }
    
    // Ajouter des tâches basées sur les problèmes trouvés par PHP_CodeSniffer
    if (advancedAnalysis.codeSniffer.errors > 0) {
      refactoringTasks.push({
        description: 'Standardiser le code selon PSR-12',
        possible: true,
        priority: 3
      });
    }
    
    // Ajouter des tâches pour les fonctions à risque
    if (advancedAnalysis.riskyFunctions.length > 0) {
      refactoringTasks.push({
        description: `Remplacer les fonctions risquées (${advancedAnalysis.riskyFunctions.join(', ')})`,
        possible: true,
        priority: 1
      });
    }
    
    // Ajouter des tâches pour le code obsolète
    if (advancedAnalysis.legacyCode.deprecatedFunctions.length > 0) {
      refactoringTasks.push({
        description: `Remplacer les fonctions obsolètes (${advancedAnalysis.legacyCode.deprecatedFunctions.join(', ')})`,
        possible: true,
        priority: 2
      });
    }
  } else {
    // Tâches standard si l'analyse avancée n'est pas disponible
    if (sqlCount > 0) {
      refactoringTasks.push({
        description: 'Extraire les appels SQL en fonctions séparées',
        possible: true,
        priority: 1
      });
    }
    
    if (htmlMixing) {
      refactoringTasks.push({
        description: 'Supprimer le HTML inline et le déplacer vers un template.php partiel',
        possible: true,
        priority: 2
      });
    }
    
    if (sessionUsage) {
      refactoringTasks.push({
        description: 'Ajouter une couche d\'abstraction pour la logique de session',
        possible: true,
        priority: 2
      });
    }
    
    refactoringTasks.push({
      description: 'Isoler les blocs métiers dans des fonctions nommées',
      possible: true,
      priority: 3
    });
  }
  
  // Identifier les difficultés potentielles
  const difficulties: string[] = [];
  
  if (advancedAnalysis) {
    // Difficultés basées sur l'analyse avancée
    if (advancedAnalysis.metrics.cyclomaticComplexity > 20) {
      difficulties.push(`Complexité cyclomatique élevée (${advancedAnalysis.metrics.cyclomaticComplexity})`);
    }
    
    if (advancedAnalysis.metrics.maintainabilityIndex < 50) {
      difficulties.push(`Faible indice de maintenabilité (${advancedAnalysis.metrics.maintainabilityIndex.toFixed(2)}/100)`);
    }
    
    if (advancedAnalysis.legacyCode.unsafeConstructs.length > 0) {
      difficulties.push(`Constructions non sécurisées (${advancedAnalysis.legacyCode.unsafeConstructs.join(', ')})`);
    }
    
    if (advancedAnalysis.metrics.codeSmells > 10) {
      difficulties.push(`Nombre élevé de "code smells" (${advancedAnalysis.metrics.codeSmells})`);
    }
    
    if (advancedAnalysis.typeCoverage < 50) {
      difficulties.push(`Faible couverture de type (${advancedAnalysis.typeCoverage.toFixed(2)}%)`);
    }
  } else {
    // Difficultés standard
    if (fileContent.includes('switch') && (fileContent.includes('$_GET[\'page\']') || fileContent.includes('$_GET["page"]'))) {
      difficulties.push('include() dynamiques dans un switch selon $_GET[\'page\']');
    }
    
    if (htmlMixing) {
      difficulties.push('Mélange fort entre rendu HTML et logique métier');
    }
    
    if (fileContent.includes('header(\'Location:') || fileContent.includes('header("Location:')) {
      difficulties.push('Redirections et headers HTTP imbriqués dans la logique produit');
    }
    
    if (includeCount > 3) {
      difficulties.push(`Couplage fort avec ${includeCount} fichiers inclus`);
    }
  }
  
  // Plan de migration NestJS
  const migrationPlanNestJS: MigrationTargetNestJS[] = [
    { elementPhp: 'Requêtes SQL', cibleNestJS: `Prisma dans ${fileName.replace('.php', '')}.service.ts` },
    { elementPhp: `Blocs métier (${isCart ? 'panier' : isAuth ? 'auth' : 'page'})`, cibleNestJS: `${fileName.replace('.php', '')}Service + ${fileName.replace('.php', '')}Controller` },
    { elementPhp: 'Fichier d\'inclusion config', cibleNestJS: '@nestjs/config avec validation' }
  ];
  
  if (sessionUsage) {
    migrationPlanNestJS.push({ elementPhp: 'Auth via session', cibleNestJS: 'Passport + RedisSessionStore' });
  }
  
  // Plan de migration Remix
  const migrationPlanRemix: MigrationTargetRemix[] = [
    { elementPhp: 'Formulaires POST', cibleRemix: 'Remix <Form method="post">' },
    { elementPhp: 'Chargement produit', cibleRemix: 'loader.ts' },
    { elementPhp: 'Meta dynamiques', cibleRemix: 'meta.ts + canonical()' },
    { elementPhp: 'Fichier HTML', cibleRemix: `app/routes/${fileName.replace('.php', '')}.tsx` }
  ];
  
  if (sessionUsage) {
    migrationPlanRemix.push({ elementPhp: 'États de session', cibleRemix: 'useFetcher() ou sessionStorage' });
  }
  
  // Spécialisation backend / frontend
  const specializationBackendFrontend = {
    nestjs: [
      'Accès DB, logique métier',
      'Auth / Session',
      'Validation Zod côté API'
    ],
    remix: [
      'UI, interactivité, routing',
      'Formulaires, rendering',
      'conform + zod côté form'
    ]
  };
  
  // Liste de tâches techniques avec prise en compte de l'analyse avancée
  let tasks = [
    `Extraire les fonctions SQL dans un fichier séparé`,
    `Créer ${fileName.replace('.php', '')}Service.ts avec méthodes appropriées`,
    `Créer route Remix \`/${fileName.replace('.php', '')}\` avec loader, meta, canonical`,
    `Créer DTOs pour les actions côté NestJS`,
    `Créer test unitaire \`${fileName.replace('.php', '')}.service.spec.ts\``,
    'Sécuriser les inputs avec Zod côté frontend',
    'Créer session avec Passport & Redis'
  ];
  
  if (advancedAnalysis) {
    // Ajouter des tâches spécifiques basées sur l'analyse avancée
    if (advancedAnalysis.phpStan.errors.length > 0) {
      tasks.push('Ajouter des types TypeScript stricts correspondant aux erreurs PHPStan');
    }
    
    if (advancedAnalysis.metrics.cyclomaticComplexity > 15) {
      tasks.push('Décomposer les méthodes complexes en sous-fonctions plus petites');
    }
    
    if (advancedAnalysis.legacyCode.deprecatedFunctions.length > 0) {
      tasks.push(`Remplacer les fonctions obsolètes par leurs équivalents modernes`);
    }
    
    if (advancedAnalysis.legacyCode.unsafeConstructs.length > 0) {
      tasks.push('Implémenter des middlewares de sécurité pour valider les entrées utilisateur');
    }
  }
  
  // Recommandations IA
  let recommendations = [
    '⚠️ Migrer en 2 étapes : découplage d\'abord, migration ensuite',
    `✅ Créer module ${fileName.replace('.php', '')} complet dans @fafa/backend/${fileName.replace('.php', '')}`,
    `🧩 Générer automatiquement :\n\n${fileName.replace('.php', '')}.controller.ts, ${fileName.replace('.php', '')}.service.ts, ${fileName.replace('.php', '')}.dto.ts\n\n${fileName.replace('.php', '')}.tsx, loader.ts, meta.ts`
  ];
  
  if (advancedAnalysis) {
    // Ajouter des recommandations spécifiques basées sur l'analyse avancée
    if (advancedAnalysis.metrics.maintainabilityIndex < 60) {
      recommendations.push('⚠️ Effectuer un refactoring préalable pour améliorer la maintenabilité avant migration');
    }
    
    if (advancedAnalysis.typeCoverage < 50) {
      recommendations.push('⚠️ Créer des interfaces TypeScript bien définies pour compenser la faible couverture de type');
    }
    
    if (advancedAnalysis.codeSniffer.errors > 20) {
      recommendations.push('⚠️ Standardiser le code PHP avant migration pour faciliter l\'analyse');
    }
  }
  
  // Outputs possibles
  const outputs = {
    audit: `${fileName}.audit.md`,
    plan: `${fileName}.migration_plan.md`,
    backlog: `${fileName}.backlog.json`,
    generatedModule: `${fileName.replace('.php', '')}.module.ts`,
    analysisReport: advancedAnalysis ? `${fileName}.analysis.json` : null
  };
  
  // Déterminer la vague de migration
  let migrationWave = 1;
  if (advancedAnalysis) {
    if (advancedAnalysis.metrics.maintainabilityIndex < 40 || advancedAnalysis.legacyCode.unsafeConstructs.length > 0) {
      migrationWave = 3; // Les fichiers très problématiques en dernière vague
    } else if (advancedAnalysis.metrics.cyclomaticComplexity > 20 || advancedAnalysis.metrics.codeSmells > 15) {
      migrationWave = 2; // Les fichiers complexes en vague intermédiaire
    }
  } else {
    // Logic standard pour la vague
    if (isCart || isAuth) migrationWave = 2; // Services critiques en vague 2
    if (globalScore >= 4) migrationWave = 3; // Fichiers complexes en vague 3
  }
  
  // Créer et retourner le plan complet
  return {
    filePath,
    fileName,
    category: '🚧 Catégorie 6 — Stratégie de migration',
    impact: {
      isShared: advancedAnalysis ? 
        advancedAnalysis.metrics.dependencies.length > 2 : 
        sessionUsage || includeCount > 3,
      callersCount: Math.floor(Math.random() * 15) + 1, // Simulation pour le prototype
      centralityDegree: parseFloat((Math.random() * 0.5 + 0.3).toFixed(2)), // Simulation
      type: fileType,
      requiresDedicatedWave: advancedAnalysis ? 
        (advancedAnalysis.metrics.cyclomaticComplexity > 15 || advancedAnalysis.metrics.maintainabilityIndex < 50) :
        (isCart || isAuth || globalScore >= 4)
    },
    scoring: score,
    globalScore,
    advancedMetrics: advancedAnalysis ? {
      cyclomaticComplexity: advancedAnalysis.metrics.cyclomaticComplexity,
      maintainabilityIndex: advancedAnalysis.metrics.maintainabilityIndex,
      typeCoverage: advancedAnalysis.typeCoverage,
      codeSmells: advancedAnalysis.metrics.codeSmells,
      securityIssues: advancedAnalysis.metrics.securityIssues.length
    } : null,
    difficulty: globalScore >= 4 ? '📌 Difficulté élevée, nécessite phase intermédiaire de découplage.' : 
               globalScore >= 3 ? '📌 Difficulté moyenne, refactoring préalable recommandé.' : 
                                 '📌 Difficulté faible, migration directe possible.',
    refactoringPHP: refactoringTasks,
    difficulties,
    migrationPlanNestJS,
    migrationPlanRemix,
    specializationBackendFrontend,
    tasks,
    recommendations,
    outputs,
    migrationWave
  };
}

/**
 * Génère un fichier de plan de migration au format Markdown
 */
function generateMigrationPlanMarkdown(plan: MigrationPlan): string {
  // Calculer les étoiles pour le scoring
  const getStars = (score: number): string => {
    return '🌟'.repeat(score);
  };
  
  // Formater les tâches de refactoring
  const formatRefactoringTasks = (): string => {
    return plan.refactoringPHP
      .map(task => `${task.description} ${task.possible ? '✅' : '❌'}`)
      .join('\n\n');
  };
  
  // Formater les plans de migration NestJS et Remix sous forme de tableaux
  const formatNestJSPlan = (): string => {
    let table = 'Élément PHP | Cible NestJS\n';
    table += '------------|-------------\n';
    plan.migrationPlanNestJS.forEach(item => {
      table += `${item.elementPhp} | ${item.cibleNestJS}\n`;
    });
    return table;
  };
  
  const formatRemixPlan = (): string => {
    let table = 'Élément PHP | Cible Remix\n';
    table += '------------|-------------\n';
    plan.migrationPlanRemix.forEach(item => {
      table += `${item.elementPhp} | ${item.cibleRemix}\n`;
    });
    return table;
  };
  
  // Formater la spécialisation backend/frontend
  const formatSpecialization = (): string => {
    let table = 'Côté NestJS | Côté Remix\n';
    table += '------------|-------------\n';
    
    const maxLength = Math.max(
      plan.specializationBackendFrontend.nestjs.length,
      plan.specializationBackendFrontend.remix.length
    );
    
    for (let i = 0; i < maxLength; i++) {
      const nestJS = plan.specializationBackendFrontend.nestjs[i] || '';
      const remix = plan.specializationBackendFrontend.remix[i] || '';
      table += `${nestJS} | ${remix}\n`;
    }
    
    return table;
  };
  
  // Formater les tâches en JSON
  const formatTasksJSON = (): string => {
    return JSON.stringify(plan.tasks, null, 2);
  };
  
  // Formater les métriques avancées si disponibles
  const formatAdvancedMetrics = (): string => {
    if (!plan.advancedMetrics) {
      return '';
    }
    
    return `\n## 📊 Métriques d'analyse avancée
| Métrique | Valeur | Interprétation |
|----------|--------|----------------|
| Complexité cyclomatique | ${plan.advancedMetrics.cyclomaticComplexity} | ${plan.advancedMetrics.cyclomaticComplexity > 20 ? '⚠️ Élevée' : plan.advancedMetrics.cyclomaticComplexity > 10 ? '⚠️ Moyenne' : '✅ Bonne'} |
| Indice de maintenabilité | ${plan.advancedMetrics.maintainabilityIndex.toFixed(2)}/100 | ${plan.advancedMetrics.maintainabilityIndex < 40 ? '⚠️ Faible' : plan.advancedMetrics.maintainabilityIndex < 60 ? '⚠️ Moyenne' : '✅ Bonne'} |
| Couverture de type | ${plan.advancedMetrics.typeCoverage.toFixed(2)}% | ${plan.advancedMetrics.typeCoverage < 50 ? '⚠️ Faible' : plan.advancedMetrics.typeCoverage < 70 ? '⚠️ Moyenne' : '✅ Bonne'} |
| Code smells | ${plan.advancedMetrics.codeSmells} | ${plan.advancedMetrics.codeSmells > 15 ? '⚠️ Nombreux' : plan.advancedMetrics.codeSmells > 7 ? '⚠️ Quelques-uns' : '✅ Peu'} |
| Problèmes de sécurité | ${plan.advancedMetrics.securityIssues} | ${plan.advancedMetrics.securityIssues > 0 ? '⚠️ À corriger' : '✅ Aucun'} |`;
  };
  
  // Générer le markdown
  return `# 🚧 Plan de Migration : ${plan.fileName}

## 🔗 Impact transverse
Utilisation partagée détectée : ${plan.impact.isShared ? '✅ Oui' : '❌ Non'}

Nombre de fichiers appelants : ${plan.impact.callersCount}

Centralité (graph degree) : ${plan.impact.centralityDegree}

Type : ${plan.impact.type}
${plan.impact.requiresDedicatedWave ? '✅ Doit être migré dans une vague dédiée, avec contrôle d\'intégrité.' : '✅ Peut être migré dans une vague standard.'}

## ⭐ Scoring de migration
Critère | Score (0-5)
--------|------------
Couplage interne | ${plan.scoring.couplageInterne}
Complexité métier | ${plan.scoring.complexiteMetier}
Qualité technique | ${plan.scoring.qualiteTechnique}
Dépendances externes | ${plan.scoring.dependancesExternes}
Volume (lignes) | ${plan.scoring.volumeLignes}
🧮 Score global migration : ${getStars(plan.globalScore)}
${plan.difficulty}${formatAdvancedMetrics()}

## 🛠️ Refactoring PHP immédiat possible
${formatRefactoringTasks()}

➡️ Refactoring recommandé avant migration vers NestJS/Remix.

## ⚠️ Difficultés anticipées
${plan.difficulties.join('\n\n')}

## 🧱 Plan de migration NestJS
${formatNestJSPlan()}

## 🎨 Plan de migration Remix
${formatRemixPlan()}

## 🪓 Spécialisation backend / frontend
${formatSpecialization()}

## ✅ Liste de tâches techniques (à injecter dans .backlog.json)
\`\`\`json
${formatTasksJSON()}
\`\`\`

## 🧠 Recommandations IA prioritaires
${plan.recommendations.join('\n\n')}

⏳ Inclure ce fichier dans la Vague ${plan.migrationWave} du plan de migration

## 📦 Sorties possibles
${plan.outputs.audit} → résumé stratégique complet

${plan.outputs.plan} → détaillé pour PR GitHub

${plan.outputs.backlog} → pour intégration dans le dashboard Supabase

${plan.outputs.generatedModule} → généré via component-generator MCP
${plan.outputs.analysisReport ? `\n${plan.outputs.analysisReport} → rapport d'analyse statique détaillé` : ''}
`;
}

/**
 * Génère un backlog JSON pour l'intégration avec Supabase
 */
function generateBacklogJSON(plan: MigrationPlan): string {
  const backlog = {
    fileName: plan.fileName,
    filePath: plan.filePath,
    tasks: plan.tasks,
    migrationWave: plan.migrationWave,
    priority: plan.globalScore >= 4 ? 'high' : plan.globalScore >= 3 ? 'medium' : 'low',
    difficulty: plan.globalScore,
    type: plan.impact.type,
    requiresDedicatedWave: plan.impact.requiresDedicatedWave,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return JSON.stringify(backlog, null, 2);
}

/**
 * Injecte le backlog dans Supabase via un webhook n8n
 */
async function injectBacklogToSupabase(backlogJSON: string): Promise<void> {
  try {
    const response = await axios.post(SUPABASE_WEBHOOK_URL, JSON.parse(backlogJSON), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Backlog injecté avec succès dans Supabase');
    } else {
      console.error(`❌ Erreur lors de l'injection dans Supabase: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel au webhook Supabase:', error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  // Récupérer les arguments de la ligne de commande
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
    Usage: ts-node generate-migration-plan.ts <chemin-fichier.php> [--export-all] [--inject-supabase] [--advanced-analysis]
    Options:
      --export-all: Génère tous les formats de sortie (.migration_plan.md, .backlog.json)
      --inject-supabase: Injecte directement le backlog dans Supabase via n8n
      --advanced-analysis: Utilise les outils d'analyse statique PHP avancés
    `);
    process.exit(0);
  }
  
  const filePath = args[0];
  const exportAll = args.includes('--export-all');
  const injectSupabase = args.includes('--inject-supabase');
  const advancedAnalysis = args.includes('--advanced-analysis');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Le fichier ${filePath} n'existe pas`);
    process.exit(1);
  }
  
  // Analyser le fichier PHP
  console.log(`📊 Analyse du fichier ${filePath}...`);
  const plan = await analyzePHPFile(filePath, advancedAnalysis);
  
  // Générer le plan de migration au format Markdown
  const outputDir = path.dirname(filePath);
  const baseName = path.basename(filePath, '.php');
  
  // Générer et sauvegarder le markdown
  const markdownContent = generateMigrationPlanMarkdown(plan);
  const markdownPath = path.join(outputDir, `${baseName}.migration_plan.md`);
  fs.writeFileSync(markdownPath, markdownContent, 'utf8');
  console.log(`✅ Plan de migration généré: ${markdownPath}`);
  
  // Si --export-all, générer aussi le backlog JSON
  if (exportAll) {
    const backlogJSON = generateBacklogJSON(plan);
    const backlogPath = path.join(outputDir, `${baseName}.backlog.json`);
    fs.writeFileSync(backlogPath, backlogJSON, 'utf8');
    console.log(`✅ Backlog JSON généré: ${backlogPath}`);
  }
  
  // Si --inject-supabase, envoyer le backlog à Supabase via n8n
  if (injectSupabase) {
    console.log('📤 Injection du backlog dans Supabase...');
    const backlogJSON = generateBacklogJSON(plan);
    await injectBacklogToSupabase(backlogJSON);
  }
  
  console.log('🚀 Traitement terminé avec succès!');
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});