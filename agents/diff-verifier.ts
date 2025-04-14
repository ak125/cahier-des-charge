import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as glob from 'glob';

// Types pour l'agent
interface DiffVerifierContext {
  file?: string;
  directory?: string;
  batchMode?: boolean;
  autoRemediate?: boolean;
  updateDiscoveryMap?: boolean;
  generateReport?: boolean;
}

interface VerificationResult {
  file: string;
  status: 'verified' | 'divergent' | 'critical' | 'pending' | 'error';
  originalPhpFile: string;
  migratedFiles: {
    backend?: string[];
    frontend?: string[];
  };
  missingFields: string[];
  missingRoutes: string[];
  missingEndpoints: string[];
  missingBusinessLogic: string[];
  incorrectDataTypes: { field: string; expectedType: string; actualType: string }[];
  accessControlIssues: string[];
  sqlMappingIssues: string[];
  issues: string[];
  remediationSuggestions?: string[];
  verifiedDate: string;
}

interface VerifierIndex {
  lastUpdated: string;
  totalFiles: number;
  verifiedCount: number;
  divergentCount: number;
  criticalCount: number;
  pendingCount: number;
  errorCount: number;
  files: {
    [filename: string]: {
      status: 'verified' | 'divergent' | 'critical' | 'pending' | 'error';
      verifiedDate: string;
      reportPath: string;
    };
  };
}

export const diffVerifierAgent = {
  name: 'diff-verifier',
  description: 'Vérifie la parité entre legacy PHP et code migré (NestJS/Remix)',
  
  async run(context: DiffVerifierContext) {
    const logs: string[] = [];
    let filesToVerify: string[] = [];
    
    try {
      logs.push(`🚀 Démarrage de l'agent de vérification de différences`);
      
      // Déterminer quels fichiers vérifier
      if (context.file) {
        // Vérifier un fichier spécifique
        const fullPath = this.resolvePhpFilePath(context.file);
        if (fs.existsSync(fullPath)) {
          filesToVerify = [fullPath];
          logs.push(`📄 Fichier à vérifier: ${fullPath}`);
        } else {
          logs.push(`❌ Fichier non trouvé: ${fullPath}`);
          return { status: 'error', logs, error: `Fichier non trouvé: ${fullPath}` };
        }
      } else if (context.directory) {
        // Vérifier tous les fichiers dans un répertoire
        const dirPath = this.resolvePhpFilePath(context.directory);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          const phpFiles = glob.sync(path.join(dirPath, '**/*.php'));
          filesToVerify = phpFiles;
          logs.push(`📁 Dossier à vérifier: ${dirPath} (${phpFiles.length} fichiers PHP trouvés)`);
        } else {
          logs.push(`❌ Dossier non trouvé: ${dirPath}`);
          return { status: 'error', logs, error: `Dossier non trouvé: ${dirPath}` };
        }
      } else if (context.batchMode) {
        // Vérifier tous les fichiers ayant un audit mais pas encore vérifiés
        const auditFiles = glob.sync('audit/**/*.audit.md');
        const verifierIndex = this.loadVerifierIndex();
        
        // Sélectionner les fichiers avec audit mais sans vérification ou avec status != verified
        filesToVerify = auditFiles
          .map(auditPath => {
            const phpFileBase = path.basename(auditPath, '.audit.md');
            const originalPhpFile = this.findOriginalPhpFile(phpFileBase);
            if (originalPhpFile && 
               (!verifierIndex.files[phpFileBase] || 
                verifierIndex.files[phpFileBase].status !== 'verified')) {
              return originalPhpFile;
            }
            return null;
          })
          .filter(Boolean) as string[];
        
        logs.push(`🔍 Mode batch: ${filesToVerify.length} fichiers PHP à vérifier`);
      } else {
        logs.push(`❓ Aucun fichier ou dossier spécifié, veuillez fournir un fichier, un dossier ou activer le mode batch`);
        return { status: 'error', logs, error: 'Aucun fichier ou dossier spécifié' };
      }
      
      if (filesToVerify.length === 0) {
        logs.push(`✅ Aucun fichier à vérifier`);
        return { status: 'success', logs, message: 'Aucun fichier à vérifier' };
      }
      
      // Préparation pour stocker tous les résultats
      const results: VerificationResult[] = [];
      let verifiedCount = 0;
      let divergentCount = 0;
      let criticalCount = 0;
      let errorCount = 0;
      
      // Vérification de chaque fichier
      for (const phpFile of filesToVerify) {
        logs.push(`\n🔍 Vérification du fichier: ${phpFile}`);
        
        try {
          const result = await this.verifyFile(phpFile, logs);
          results.push(result);
          
          // Mise à jour des compteurs
          if (result.status === 'verified') verifiedCount++;
          else if (result.status === 'divergent') divergentCount++;
          else if (result.status === 'critical') criticalCount++;
          else if (result.status === 'error') errorCount++;
          
          // Écriture du rapport de vérification
          this.saveVerificationReport(result);
          logs.push(`💾 Rapport de vérification sauvegardé pour ${result.file}`);
          
          // Auto-remédiation si demandée et possible
          if (context.autoRemediate && result.status === 'divergent') {
            await this.attemptRemediation(result, logs);
          }
          
          // Mise à jour du discovery_map.json si demandé
          if (context.updateDiscoveryMap && result.status === 'verified') {
            this.updateDiscoveryMap(result, logs);
          }
        } catch (err: any) {
          logs.push(`❌ Erreur lors de la vérification de ${phpFile}: ${err.message}`);
          errorCount++;
        }
      }
      
      // Mise à jour de l'index de vérification
      this.updateVerifierIndex(results);
      logs.push(`\n📊 Résumé de la vérification:`);
      logs.push(`   ✅ Vérifiés: ${verifiedCount}`);
      logs.push(`   ⚠️ Divergents: ${divergentCount}`);
      logs.push(`   🔴 Critiques: ${criticalCount}`);
      logs.push(`   ❌ Erreurs: ${errorCount}`);
      
      // Générer un rapport global si demandé
      if (context.generateReport) {
        this.generateGlobalReport(results, logs);
      }
      
      return {
        status: 'success',
        logs,
        summary: {
          total: filesToVerify.length,
          verified: verifiedCount,
          divergent: divergentCount,
          critical: criticalCount,
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
  loadVerifierIndex(): VerifierIndex {
    const indexPath = path.resolve('reports', 'verifier_index.json');
    
    if (fs.existsSync(indexPath)) {
      try {
        return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      } catch (err) {
        // En cas d'erreur, créer un nouvel index
      }
    }
    
    // Créer un nouvel index vide
    return {
      lastUpdated: new Date().toISOString(),
      totalFiles: 0,
      verifiedCount: 0,
      divergentCount: 0,
      criticalCount: 0,
      pendingCount: 0,
      errorCount: 0,
      files: {}
    };
  },
  
  /**
   * Met à jour l'index des vérifications
   */
  updateVerifierIndex(results: VerificationResult[]): void {
    const indexPath = path.resolve('reports', 'verifier_index.json');
    const verifierIndex = this.loadVerifierIndex();
    
    // Mettre à jour pour chaque résultat
    for (const result of results) {
      const fileBase = path.basename(result.file, '.php');
      const reportPath = path.relative(
        process.cwd(),
        path.resolve('audit', `${fileBase}.verification_report.json`)
      );
      
      verifierIndex.files[fileBase] = {
        status: result.status,
        verifiedDate: result.verifiedDate,
        reportPath
      };
    }
    
    // Recalculer les totaux
    const statuses = Object.values(verifierIndex.files).map(f => f.status);
    verifierIndex.totalFiles = Object.keys(verifierIndex.files).length;
    verifierIndex.verifiedCount = statuses.filter(s => s === 'verified').length;
    verifierIndex.divergentCount = statuses.filter(s => s === 'divergent').length;
    verifierIndex.criticalCount = statuses.filter(s => s === 'critical').length;
    verifierIndex.pendingCount = statuses.filter(s => s === 'pending').length;
    verifierIndex.errorCount = statuses.filter(s => s === 'error').length;
    verifierIndex.lastUpdated = new Date().toISOString();
    
    // Sauvegarder l'index
    if (!fs.existsSync(path.dirname(indexPath))) {
      fs.mkdirSync(path.dirname(indexPath), { recursive: true });
    }
    
    fs.writeFileSync(indexPath, JSON.stringify(verifierIndex, null, 2));
  },
  
  /**
   * Vérification d'un fichier PHP
   */
  async verifyFile(phpFile: string, logs: string[]): Promise<VerificationResult> {
    const fileBase = path.basename(phpFile, '.php');
    
    // Créer la structure de résultat
    const result: VerificationResult = {
      file: fileBase,
      status: 'pending',
      originalPhpFile: phpFile,
      migratedFiles: {
        backend: [],
        frontend: []
      },
      missingFields: [],
      missingRoutes: [],
      missingEndpoints: [],
      missingBusinessLogic: [],
      incorrectDataTypes: [],
      accessControlIssues: [],
      sqlMappingIssues: [],
      issues: [],
      verifiedDate: new Date().toISOString()
    };
    
    try {
      // 1. Lecture des audits existants
      const auditPath = path.resolve('audit', `${fileBase}.audit.md`);
      
      if (!fs.existsSync(auditPath)) {
        logs.push(`❌ Fichier d'audit non trouvé: ${auditPath}`);
        result.status = 'error';
        result.issues.push('Fichier d\'audit non trouvé');
        return result;
      }
      
      logs.push(`📄 Fichier d'audit trouvé: ${auditPath}`);
      const auditContent = fs.readFileSync(auditPath, 'utf-8');
      
      // 2. Trouver les fichiers migrés correspondants
      const serviceFiles = glob.sync(`apps/backend/src/**/${fileBase}*.service.ts`);
      const controllerFiles = glob.sync(`apps/backend/src/**/${fileBase}*.controller.ts`);
      const dtoFiles = glob.sync(`apps/backend/src/**/${fileBase}*.dto.ts`);
      const entityFiles = glob.sync(`apps/backend/src/**/${fileBase}*.entity.ts`);
      const remixRouteFiles = glob.sync(`apps/frontend/app/routes/**/${fileBase}*.tsx`);
      
      // Stocker les chemins des fichiers migrés
      result.migratedFiles.backend = [
        ...serviceFiles,
        ...controllerFiles,
        ...dtoFiles,
        ...entityFiles
      ];
      
      result.migratedFiles.frontend = remixRouteFiles;
      
      if (result.migratedFiles.backend.length === 0 && result.migratedFiles.frontend.length === 0) {
        logs.push(`⚠️ Aucun fichier migré trouvé pour ${fileBase}`);
        result.status = 'pending';
        result.issues.push('Aucun fichier migré trouvé');
        return result;
      }
      
      logs.push(`📄 Fichiers backend trouvés: ${result.migratedFiles.backend.length}`);
      logs.push(`📄 Fichiers frontend trouvés: ${result.migratedFiles.frontend.length}`);
      
      // 3. Lire le contenu des fichiers migrés
      let backendCode = '';
      for (const file of result.migratedFiles.backend) {
        backendCode += fs.readFileSync(file, 'utf-8');
      }
      
      let frontendCode = '';
      for (const file of result.migratedFiles.frontend) {
        frontendCode += fs.readFileSync(file, 'utf-8');
      }
      
      // 4. Analyse du fichier d'audit pour extraire les informations attendues
      
      // a. Extraire les champs PHP attendus
      const expectedFields = this.extractExpectedFields(auditContent);
      logs.push(`🔍 Champs attendus: ${expectedFields.length}`);
      
      // b. Vérifier si les champs sont présents dans le code migré
      for (const field of expectedFields) {
        const fieldPattern = new RegExp(`['"]?${field}['"]?\\s*[:=]|${field}\\s*[:=]`);
        
        if (!fieldPattern.test(backendCode) && !fieldPattern.test(frontendCode)) {
          result.missingFields.push(field);
        }
      }
      
      logs.push(`⚠️ Champs manquants: ${result.missingFields.length}`);
      
      // c. Extraire les routes PHP attendues
      const expectedRoutes = this.extractExpectedRoutes(auditContent);
      logs.push(`🔍 Routes attendues: ${expectedRoutes.length}`);
      
      // d. Vérifier si les routes sont présentes dans le code migré
      for (const route of expectedRoutes) {
        const routePattern = new RegExp(`path\\s*:\\s*['"]/${route}['"]|path\\s*=\\s*['"]/${route}['"]`);
        
        if (!routePattern.test(frontendCode)) {
          result.missingRoutes.push(route);
        }
      }
      
      logs.push(`⚠️ Routes manquantes: ${result.missingRoutes.length}`);
      
      // e. Extraire les endpoints/méthodes API attendus
      const expectedEndpoints = this.extractExpectedEndpoints(auditContent);
      logs.push(`🔍 Endpoints attendus: ${expectedEndpoints.length}`);
      
      // f. Vérifier si les endpoints sont présents dans le code migré
      for (const endpoint of expectedEndpoints) {
        const endpointPattern = new RegExp(`@(Get|Post|Put|Delete|Patch)\\(['"]${endpoint}['"]\\)|@(Get|Post|Put|Delete|Patch)\\(\\)`);
        
        if (!endpointPattern.test(backendCode)) {
          result.missingEndpoints.push(endpoint);
        }
      }
      
      logs.push(`⚠️ Endpoints manquants: ${result.missingEndpoints.length}`);
      
      // g. Extraire la logique métier attendue
      const expectedBusinessLogic = this.extractBusinessLogic(auditContent);
      logs.push(`🔍 Éléments de logique métier attendus: ${expectedBusinessLogic.length}`);
      
      // h. Vérifier si la logique métier est présente dans le code migré
      for (const logic of expectedBusinessLogic) {
        // Recherche plus flexible pour la logique métier
        const logicKeys = logic.split(/\s+/).filter(Boolean);
        const allKeysPresent = logicKeys.every(key => {
          return backendCode.includes(key) || frontendCode.includes(key);
        });
        
        if (!allKeysPresent) {
          result.missingBusinessLogic.push(logic);
        }
      }
      
      logs.push(`⚠️ Éléments de logique métier manquants: ${result.missingBusinessLogic.length}`);
      
      // i. Extraire les requêtes SQL et vérifier leur correspondance
      const sqlStatements = this.extractSqlStatements(auditContent);
      logs.push(`🔍 Requêtes SQL attendues: ${sqlStatements.length}`);
      
      // j. Vérifier les problèmes de mapping SQL
      for (const sql of sqlStatements) {
        const tables = this.extractTablesFromSql(sql);
        const columns = this.extractColumnsFromSql(sql);
        
        // Vérifier si les tables et colonnes sont référencées dans le code migré
        const missingMappings = [];
        
        for (const table of tables) {
          if (!backendCode.includes(table)) {
            missingMappings.push(`Table '${table}'`);
          }
        }
        
        for (const column of columns) {
          if (!backendCode.includes(column) && !frontendCode.includes(column)) {
            missingMappings.push(`Colonne '${column}'`);
          }
        }
        
        if (missingMappings.length > 0) {
          result.sqlMappingIssues.push(
            `Éléments SQL non mappés: ${missingMappings.join(', ')}`
          );
        }
      }
      
      logs.push(`⚠️ Problèmes de mapping SQL: ${result.sqlMappingIssues.length}`);
      
      // k. Vérifier les problèmes de contrôle d'accès
      const accessControlPatterns = [
        'isAuthenticated',
        'hasRole',
        'canAccess',
        'permission',
        'authorize',
        'roleRequired',
        'accessControl'
      ];
      
      if (auditContent.includes('vérification de session') || 
          auditContent.includes('check auth') || 
          auditContent.includes('contrôle d\'accès')) {
        
        const hasAccessControl = accessControlPatterns.some(pattern => 
          backendCode.includes(pattern) || frontendCode.includes(pattern)
        );
        
        if (!hasAccessControl) {
          result.accessControlIssues.push('Contrôle d\'accès manquant ou insuffisant');
        }
      }
      
      logs.push(`⚠️ Problèmes de contrôle d'accès: ${result.accessControlIssues.length}`);
      
      // 5. Déterminer le statut global
      if (result.missingFields.length === 0 && 
          result.missingRoutes.length === 0 && 
          result.missingEndpoints.length === 0 &&
          result.missingBusinessLogic.length === 0 &&
          result.incorrectDataTypes.length === 0 &&
          result.accessControlIssues.length === 0 &&
          result.sqlMappingIssues.length === 0) {
        
        result.status = 'verified';
        logs.push(`✅ Vérification réussie pour ${fileBase}`);
      } else if (result.missingBusinessLogic.length > 3 || 
                 result.accessControlIssues.length > 0 ||
                 result.sqlMappingIssues.length > 2) {
        
        result.status = 'critical';
        logs.push(`🔴 Divergences critiques détectées pour ${fileBase}`);
      } else {
        result.status = 'divergent';
        logs.push(`⚠️ Divergences détectées pour ${fileBase}`);
      }
      
      // 6. Générer des suggestions de remédiation si nécessaire
      if (result.status !== 'verified') {
        result.remediationSuggestions = this.generateRemediationSuggestions(result);
      }
      
      return result;
    } catch (err: any) {
      logs.push(`❌ Erreur durant l'analyse : ${err.message}`);
      result.status = 'error';
      result.issues.push(`Erreur durant l'analyse : ${err.message}`);
      return result;
    }
  },
  
  /**
   * Sauvegarde le rapport de vérification
   */
  saveVerificationReport(result: VerificationResult): void {
    const reportDir = path.resolve('audit');
    const reportPath = path.resolve(reportDir, `${result.file}.verification_report.json`);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  },
  
  /**
   * Génère un rapport global HTML pour tous les résultats
   */
  generateGlobalReport(results: VerificationResult[], logs: string[]): void {
    const reportDir = path.resolve('reports');
    const reportPath = path.resolve(reportDir, 'verification_summary.html');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Créer un rapport HTML
    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de vérification de migration</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .file-card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 15px; }
    .file-card h3 { margin-top: 0; color: #2c3e50; }
    .verified { border-left: 5px solid #2ecc71; }
    .divergent { border-left: 5px solid #f39c12; }
    .critical { border-left: 5px solid #e74c3c; }
    .error { border-left: 5px solid #7f8c8d; }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      font-weight: bold;
      color: white;
    }
    .status-verified { background-color: #2ecc71; }
    .status-divergent { background-color: #f39c12; }
    .status-critical { background-color: #e74c3c; }
    .status-error { background-color: #7f8c8d; }
    .issue-list { margin-top: 10px; }
    .issue-item { margin-bottom: 5px; }
    .issue-category { font-weight: bold; margin-top: 10px; }
    .suggestion { background-color: #edf7f9; padding: 10px; border-left: 3px solid #3498db; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Rapport de vérification de migration</h1>
  
  <div class="summary">
    <h2>Résumé</h2>
    <p>Date du rapport: ${new Date().toLocaleString()}</p>
    <p>Total de fichiers vérifiés: ${results.length}</p>
    <p>
      <span class="status-badge status-verified">Vérifiés: ${results.filter(r => r.status === 'verified').length}</span>
      <span class="status-badge status-divergent">Divergents: ${results.filter(r => r.status === 'divergent').length}</span>
      <span class="status-badge status-critical">Critiques: ${results.filter(r => r.status === 'critical').length}</span>
      <span class="status-badge status-error">Erreurs: ${results.filter(r => r.status === 'error').length}</span>
    </p>
  </div>
  
  <h2>Détails par fichier</h2>
`;
    
    // Ajouter les détails pour chaque fichier vérifié
    for (const result of results) {
      html += `
  <div class="file-card ${result.status}">
    <h3>${result.file} <span class="status-badge status-${result.status}">${result.status}</span></h3>
    <p>Fichier PHP original: ${result.originalPhpFile}</p>
    <p>Date de vérification: ${new Date(result.verifiedDate).toLocaleString()}</p>
    
    <div class="issue-list">
`;
      
      // Afficher les fichiers migrés
      if (result.migratedFiles.backend?.length || result.migratedFiles.frontend?.length) {
        html += `      <div class="issue-category">Fichiers migrés:</div>\n`;
        
        if (result.migratedFiles.backend?.length) {
          html += `      <div class="issue-item">Backend: ${result.migratedFiles.backend.length} fichier(s)</div>\n`;
        }
        
        if (result.migratedFiles.frontend?.length) {
          html += `      <div class="issue-item">Frontend: ${result.migratedFiles.frontend.length} fichier(s)</div>\n`;
        }
      }
      
      // Afficher les problèmes identifiés
      if (result.missingFields.length > 0) {
        html += `      <div class="issue-category">Champs manquants (${result.missingFields.length}):</div>\n`;
        html += `      <div class="issue-item">${result.missingFields.join(', ')}</div>\n`;
      }
      
      if (result.missingRoutes.length > 0) {
        html += `      <div class="issue-category">Routes manquantes (${result.missingRoutes.length}):</div>\n`;
        html += `      <div class="issue-item">${result.missingRoutes.join(', ')}</div>\n`;
      }
      
      if (result.missingEndpoints.length > 0) {
        html += `      <div class="issue-category">Endpoints manquants (${result.missingEndpoints.length}):</div>\n`;
        html += `      <div class="issue-item">${result.missingEndpoints.join(', ')}</div>\n`;
      }
      
      if (result.missingBusinessLogic.length > 0) {
        html += `      <div class="issue-category">Logique métier manquante (${result.missingBusinessLogic.length}):</div>\n`;
        for (const logic of result.missingBusinessLogic) {
          html += `      <div class="issue-item">${logic}</div>\n`;
        }
      }
      
      if (result.accessControlIssues.length > 0) {
        html += `      <div class="issue-category">Problèmes de contrôle d'accès (${result.accessControlIssues.length}):</div>\n`;
        for (const issue of result.accessControlIssues) {
          html += `      <div class="issue-item">${issue}</div>\n`;
        }
      }
      
      if (result.sqlMappingIssues.length > 0) {
        html += `      <div class="issue-category">Problèmes de mapping SQL (${result.sqlMappingIssues.length}):</div>\n`;
        for (const issue of result.sqlMappingIssues) {
          html += `      <div class="issue-item">${issue}</div>\n`;
        }
      }
      
      if (result.incorrectDataTypes.length > 0) {
        html += `      <div class="issue-category">Types de données incorrects (${result.incorrectDataTypes.length}):</div>\n`;
        for (const type of result.incorrectDataTypes) {
          html += `      <div class="issue-item">Champ ${type.field}: attendu ${type.expectedType}, trouvé ${type.actualType}</div>\n`;
        }
      }
      
      if (result.issues.length > 0) {
        html += `      <div class="issue-category">Autres problèmes (${result.issues.length}):</div>\n`;
        for (const issue of result.issues) {
          html += `      <div class="issue-item">${issue}</div>\n`;
        }
      }
      
      // Afficher les suggestions de remédiation
      if (result.remediationSuggestions && result.remediationSuggestions.length > 0) {
        html += `      <div class="suggestion">
        <div class="issue-category">Suggestions de remédiation:</div>
`;
        
        for (const suggestion of result.remediationSuggestions) {
          html += `        <div class="issue-item">${suggestion}</div>\n`;
        }
        
        html += `      </div>\n`;
      }
      
      html += `    </div>
  </div>
`;
    }
    
    html += `
</body>
</html>
`;
    
    fs.writeFileSync(reportPath, html);
    logs.push(`📊 Rapport global HTML généré: ${reportPath}`);
  },
  
  /**
   * Met à jour le discovery_map.json avec le statut de vérification
   */
  updateDiscoveryMap(result: VerificationResult, logs: string[]): void {
    const discoveryMapPath = path.resolve('reports', 'discovery_map.json');
    
    if (!fs.existsSync(discoveryMapPath)) {
      logs.push(`⚠️ Fichier discovery_map.json non trouvé, impossible de mettre à jour le statut`);
      return;
    }
    
    try {
      const discoveryMap = JSON.parse(fs.readFileSync(discoveryMapPath, 'utf-8'));
      
      // Chercher l'entrée correspondante dans le discovery_map
      const entries = discoveryMap.entries || [];
      const fileBase = path.basename(result.file, '.php');
      
      let updated = false;
      for (const entry of entries) {
        if (entry.filename === `${fileBase}.php` || entry.id === fileBase) {
          entry.status = 'verified';
          entry.verificationDate = result.verifiedDate;
          updated = true;
          break;
        }
      }
      
      if (updated) {
        fs.writeFileSync(discoveryMapPath, JSON.stringify(discoveryMap, null, 2));
        logs.push(`✅ Statut mis à jour dans discovery_map.json pour ${fileBase}`);
      } else {
        logs.push(`⚠️ Entrée non trouvée dans discovery_map.json pour ${fileBase}`);
      }
    } catch (err: any) {
      logs.push(`❌ Erreur lors de la mise à jour du discovery_map.json: ${err.message}`);
    }
  },
  
  /**
   * Tente de remédier automatiquement aux divergences
   */
  async attemptRemediation(result: VerificationResult, logs: string[]): Promise<void> {
    logs.push(`🛠️ Tentative de remédiation pour ${result.file}...`);
    
    // Note: Une implémentation complète nécessiterait un processus de remédiation plus sophistiqué
    // Pour l'instant, nous créons simplement une tâche dans le fichier backlog.json
    
    const backlogPath = path.resolve('reports', 'analysis', `${result.file}.backlog.json`);
    let backlog: any = {
      file: result.file,
      tasks: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    // Charger le backlog existant s'il existe
    if (fs.existsSync(backlogPath)) {
      try {
        backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf-8'));
        backlog.updated = new Date().toISOString();
      } catch (err) {
        // Continuer avec un nouveau backlog en cas d'erreur
      }
    }
    
    // Ajouter des tâches pour les problèmes détectés
    const issues = [];
    
    if (result.missingFields.length > 0) {
      issues.push({
        type: 'fields',
        fields: result.missingFields,
        description: `Ajouter les champs manquants: ${result.missingFields.join(', ')}`
      });
    }
    
    if (result.missingRoutes.length > 0) {
      issues.push({
        type: 'routes',
        routes: result.missingRoutes,
        description: `Implémenter les routes manquantes: ${result.missingRoutes.join(', ')}`
      });
    }
    
    if (result.missingEndpoints.length > 0) {
      issues.push({
        type: 'endpoints',
        endpoints: result.missingEndpoints,
        description: `Ajouter les endpoints manquants: ${result.missingEndpoints.join(', ')}`
      });
    }
    
    if (result.missingBusinessLogic.length > 0) {
      issues.push({
        type: 'businessLogic',
        logic: result.missingBusinessLogic,
        description: `Implémenter la logique métier manquante`
      });
    }
    
    if (result.accessControlIssues.length > 0) {
      issues.push({
        type: 'accessControl',
        issues: result.accessControlIssues,
        description: `Corriger les problèmes de contrôle d'accès`
      });
    }
    
    if (result.sqlMappingIssues.length > 0) {
      issues.push({
        type: 'sqlMapping',
        issues: result.sqlMappingIssues,
        description: `Résoudre les problèmes de mapping SQL`
      });
    }
    
    if (result.incorrectDataTypes.length > 0) {
      issues.push({
        type: 'dataTypes',
        types: result.incorrectDataTypes,
        description: `Corriger les types de données incorrects`
      });
    }
    
    // Ajouter les tâches au backlog
    for (const issue of issues) {
      // Vérifier si une tâche similaire existe déjà
      const existingTask = backlog.tasks.find((task: any) => 
        task.type === issue.type && task.source === 'diff-verifier'
      );
      
      if (existingTask) {
        // Mettre à jour la tâche existante
        existingTask.updated = new Date().toISOString();
        existingTask.description = issue.description;
        existingTask.details = issue;
        existingTask.status = 'pending';
      } else {
        // Ajouter une nouvelle tâche
        backlog.tasks.push({
          id: `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          type: issue.type,
          source: 'diff-verifier',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          status: 'pending',
          priority: issue.type === 'accessControl' ? 'high' : 'medium',
          description: issue.description,
          details: issue
        });
      }
    }
    
    // Sauvegarder le backlog mis à jour
    if (!fs.existsSync(path.dirname(backlogPath))) {
      fs.mkdirSync(path.dirname(backlogPath), { recursive: true });
    }
    
    fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
    logs.push(`✅ Tâches de remédiation ajoutées au backlog: ${backlogPath}`);
    
    // En option: Régénérer les tests correspondants en appelant test-writer
    try {
      logs.push(`🧪 Tentative de régénération des tests...`);
      
      const moduleBase = result.file.replace(/\.php$/, '');
      const command = `pnpm tsx apps/mcp-server/src/handleAgentRequest.ts test-writer '{"moduleName":"${moduleBase}","type":"both","generateCoverage":true}'`;
      
      execSync(command, { stdio: 'pipe' });
      logs.push(`✅ Tests régénérés pour ${moduleBase}`);
    } catch (err: any) {
      logs.push(`⚠️ Échec de la régénération des tests: ${err.message}`);
    }
  },
  
  /**
   * Extrait les champs attendus du fichier d'audit
   */
  extractExpectedFields(auditContent: string): string[] {
    const fields = new Set<string>();
    
    // Recherche des motifs courants pour les champs PHP
    const patterns = [
      /\$row\['([^']+)'\]/g,
      /\$row\["([^"]+)"\]/g,
      /\$data\['([^']+)'\]/g,
      /\$data\["([^"]+)"\]/g,
      /\$result\['([^']+)'\]/g,
      /\$result\["([^"]+)"\]/g,
      /\$_POST\['([^']+)'\]/g,
      /\$_POST\["([^"]+)"\]/g,
      /\$_GET\['([^']+)'\]/g,
      /\$_GET\["([^"]+)"\]/g
    ];
    
    // Appliquer chaque motif
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(auditContent)) !== null) {
        fields.add(match[1]);
      }
    }
    
    // Rechercher également dans la section "Champs" si elle existe
    const fieldsSection = auditContent.match(/## Champs\s+([^#]*)/);
    if (fieldsSection) {
      const fieldLines = fieldsSection[1].split('\n');
      for (const line of fieldLines) {
        const fieldMatch = line.match(/[*-]\s+`([^`]+)`/);
        if (fieldMatch) {
          fields.add(fieldMatch[1]);
        }
      }
    }
    
    return Array.from(fields);
  },
  
  /**
   * Extrait les routes attendues du fichier d'audit
   */
  extractExpectedRoutes(auditContent: string): string[] {
    const routes = new Set<string>();
    
    // Rechercher dans la section "Routes" si elle existe
    const routesSection = auditContent.match(/## Routes\s+([^#]*)/);
    if (routesSection) {
      const routeLines = routesSection[1].split('\n');
      for (const line of routeLines) {
        const routeMatch = line.match(/[*-]\s+`([^`]+)`|[*-]\s+(\S+)/);
        if (routeMatch) {
          const route = (routeMatch[1] || routeMatch[2]);
          // Nettoyer la route (enlever les slashes au début/fin)
          routes.add(route.replace(/^\/|\/$/g, ''));
        }
      }
    }
    
    // Rechercher également les URL dans le contenu
    const urlMatches = auditContent.match(/href=['"]([^'"]+)['"]/g);
    if (urlMatches) {
      for (const urlMatch of urlMatches) {
        const url = urlMatch.match(/href=['"]([^'"]+)['"]/)[1];
        if (url.startsWith('/') && !url.startsWith('//')) {
          routes.add(url.replace(/^\/|\/$/g, ''));
        }
      }
    }
    
    return Array.from(routes);
  },
  
  /**
   * Extrait les endpoints attendus du fichier d'audit
   */
  extractExpectedEndpoints(auditContent: string): string[] {
    const endpoints = new Set<string>();
    
    // Rechercher dans la section "Endpoints" ou "API" si elle existe
    const endpointsSection = auditContent.match(/## (?:Endpoints|API)\s+([^#]*)/);
    if (endpointsSection) {
      const endpointLines = endpointsSection[1].split('\n');
      for (const line of endpointLines) {
        const endpointMatch = line.match(/[*-]\s+`([^`]+)`|[*-]\s+(\S+)/);
        if (endpointMatch) {
          const endpoint = (endpointMatch[1] || endpointMatch[2]);
          // Nettoyer l'endpoint (enlever les slashes au début/fin)
          endpoints.add(endpoint.replace(/^\/|\/$/g, ''));
        }
      }
    }
    
    // Rechercher également les endpoints définis explicitement
    const apiMatches = auditContent.match(/API: `([^`]+)`/g);
    if (apiMatches) {
      for (const apiMatch of apiMatches) {
        const api = apiMatch.match(/API: `([^`]+)`/)[1];
        endpoints.add(api.replace(/^\/|\/$/g, ''));
      }
    }
    
    return Array.from(endpoints);
  },
  
  /**
   * Extrait la logique métier attendue du fichier d'audit
   */
  extractBusinessLogic(auditContent: string): string[] {
    const logic = new Set<string>();
    
    // Rechercher dans la section "Logique métier" si elle existe
    const logicSection = auditContent.match(/## (?:Logique métier|Business Logic)\s+([^#]*)/);
    if (logicSection) {
      const logicLines = logicSection[1].split('\n');
      for (const line of logicLines) {
        const logicMatch = line.match(/[*-]\s+(.+)/);
        if (logicMatch && logicMatch[1].trim().length > 0) {
          logic.add(logicMatch[1].trim());
        }
      }
    }
    
    // Rechercher également les sections code importantes
    const codeBlocks = auditContent.match(/```php\s+([\s\S]*?)```/g);
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const code = block.match(/```php\s+([\s\S]*?)```/)[1];
        // Extraire les commentaires significatifs ou lignes importantes
        const commentLines = code.match(/\/\/\s*(.+)/g);
        if (commentLines) {
          for (const comment of commentLines) {
            const commentText = comment.match(/\/\/\s*(.+)/)[1];
            if (commentText.includes('important') || 
                commentText.includes('essentiel') || 
                commentText.includes('clé') ||
                commentText.includes('critique')) {
              logic.add(commentText);
            }
          }
        }
        
        // Extraire les conditions et calculs importants
        const ifStatements = code.match(/if\s*\(([^)]+)\)/g);
        if (ifStatements) {
          for (const statement of ifStatements) {
            const condition = statement.match(/if\s*\(([^)]+)\)/)[1];
            if (condition.includes('==') || 
                condition.includes('!=') || 
                condition.includes('>=') || 
                condition.includes('<=')) {
              logic.add(`Condition: ${condition.trim()}`);
            }
          }
        }
      }
    }
    
    return Array.from(logic);
  },
  
  /**
   * Extrait les requêtes SQL du fichier d'audit
   */
  extractSqlStatements(auditContent: string): string[] {
    const statements = new Set<string>();
    
    // Extraire les blocs de code SQL
    const sqlBlocks = auditContent.match(/```sql\s+([\s\S]*?)```/g);
    if (sqlBlocks) {
      for (const block of sqlBlocks) {
        const sql = block.match(/```sql\s+([\s\S]*?)```/)[1];
        statements.add(sql.trim());
      }
    }
    
    // Extraire aussi les requêtes dans le code PHP
    const phpBlocks = auditContent.match(/```php\s+([\s\S]*?)```/g);
    if (phpBlocks) {
      for (const block of phpBlocks) {
        const php = block.match(/```php\s+([\s\S]*?)```/)[1];
        const sqlStrings = php.match(/["'](?:SELECT|INSERT|UPDATE|DELETE)[\s\S]*?["']/gi);
        if (sqlStrings) {
          for (const sqlString of sqlStrings) {
            const cleanSql = sqlString.replace(/["']/g, '').trim();
            statements.add(cleanSql);
          }
        }
      }
    }
    
    return Array.from(statements);
  },
  
  /**
   * Extrait les noms de tables d'une requête SQL
   */
  extractTablesFromSql(sql: string): string[] {
    const tables = new Set<string>();
    
    // Motif pour FROM table1, table2
    const fromMatches = sql.match(/FROM\s+([a-zA-Z0-9_]+(?:\s*,\s*[a-zA-Z0-9_]+)*)/gi);
    if (fromMatches) {
      for (const match of fromMatches) {
        const tableList = match.replace(/FROM\s+/i, '').split(',');
        for (const table of tableList) {
          tables.add(table.trim());
        }
      }
    }
    
    // Motif pour JOIN table ON
    const joinMatches = sql.match(/JOIN\s+([a-zA-Z0-9_]+)/gi);
    if (joinMatches) {
      for (const match of joinMatches) {
        const table = match.replace(/JOIN\s+/i, '').trim();
        tables.add(table);
      }
    }
    
    // Motif pour UPDATE table SET
    const updateMatches = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)/gi);
    if (updateMatches) {
      for (const match of updateMatches) {
        const table = match.replace(/UPDATE\s+/i, '').trim();
        tables.add(table);
      }
    }
    
    // Motif pour INSERT INTO table
    const insertMatches = sql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/gi);
    if (insertMatches) {
      for (const match of insertMatches) {
        const table = match.replace(/INSERT\s+INTO\s+/i, '').trim();
        tables.add(table);
      }
    }
    
    // Motif pour DELETE FROM table
    const deleteMatches = sql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/gi);
    if (deleteMatches) {
      for (const match of deleteMatches) {
        const table = match.replace(/DELETE\s+FROM\s+/i, '').trim();
        tables.add(table);
      }
    }
    
    return Array.from(tables);
  },
  
  /**
   * Extrait les noms de colonnes d'une requête SQL
   */
  extractColumnsFromSql(sql: string): string[] {
    const columns = new Set<string>();
    
    // Motif pour SELECT col1, col2
    const selectMatches = sql.match(/SELECT\s+([\s\S]*?)FROM/gi);
    if (selectMatches) {
      for (const match of selectMatches) {
        const columnsStr = match.replace(/SELECT\s+/i, '').replace(/\s+FROM$/i, '');
        
        // Ignorer les cas SELECT *
        if (columnsStr.trim() === '*') {
          continue;
        }
        
        // Séparer les colonnes par virgules, mais gérer les fonctions comme COUNT(col)
        let inParentheses = 0;
        let currentColumn = '';
        
        for (let i = 0; i < columnsStr.length; i++) {
          const char = columnsStr[i];
          
          if (char === '(') {
            inParentheses++;
            currentColumn += char;
          } else if (char === ')') {
            inParentheses--;
            currentColumn += char;
          } else if (char === ',' && inParentheses === 0) {
            columns.add(this.extractColumnName(currentColumn.trim()));
            currentColumn = '';
          } else {
            currentColumn += char;
          }
        }
        
        if (currentColumn.trim()) {
          columns.add(this.extractColumnName(currentColumn.trim()));
        }
      }
    }
    
    // Motif pour WHERE col = val
    const whereColumnMatches = sql.match(/WHERE\s+([a-zA-Z0-9_]+)\s*=/gi) || [];
    for (const match of whereColumnMatches) {
      const column = match.replace(/WHERE\s+/i, '').replace(/\s*=$/i, '').trim();
      columns.add(column);
    }
    
    // Motif pour ORDER BY col
    const orderByMatches = sql.match(/ORDER\s+BY\s+([a-zA-Z0-9_]+)/gi) || [];
    for (const match of orderByMatches) {
      const column = match.replace(/ORDER\s+BY\s+/i, '').trim();
      columns.add(column);
    }
    
    // Motif pour GROUP BY col
    const groupByMatches = sql.match(/GROUP\s+BY\s+([a-zA-Z0-9_]+)/gi) || [];
    for (const match of groupByMatches) {
      const column = match.replace(/GROUP\s+BY\s+/i, '').trim();
      columns.add(column);
    }
    
    // Motif pour colonnes dans JOIN ... ON
    const joinOnMatches = sql.match(/ON\s+([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)\s*=/gi) || [];
    for (const match of joinOnMatches) {
      const fullColumn = match.replace(/ON\s+/i, '').replace(/\s*=$/i, '').trim();
      const column = fullColumn.split('.')[1];
      if (column) {
        columns.add(column);
      }
    }
    
    return Array.from(columns);
  },
  
  /**
   * Extrait le nom de colonne à partir d'une expression SQL
   */
  extractColumnName(columnExpression: string): string {
    // Gérer les alias "col AS alias"
    const asMatch = columnExpression.match(/^(.*?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
    if (asMatch) {
      columnExpression = asMatch[1];
    }
    
    // Gérer les préfixes de table "table.col"
    const dotMatch = columnExpression.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/);
    if (dotMatch) {
      return dotMatch[2];
    }
    
    // Gérer les fonctions "FUNCTION(col)"
    const funcMatch = columnExpression.match(/[a-zA-Z0-9_]+\(([a-zA-Z0-9_]+)\)/);
    if (funcMatch) {
      return funcMatch[1];
    }
    
    return columnExpression;
  },
  
  /**
   * Génère des suggestions de remédiation basées sur les problèmes détectés
   */
  generateRemediationSuggestions(result: VerificationResult): string[] {
    const suggestions: string[] = [];
    
    // Suggestions pour les champs manquants
    if (result.missingFields.length > 0) {
      suggestions.push(`Ajouter les champs manquants (${result.missingFields.length}): ${result.missingFields.join(', ')}`);
      
      if (result.migratedFiles.backend?.length > 0) {
        suggestions.push(`Dans le service ou le modèle backend, assurez-vous d'inclure ces champs dans les DTOs ou les entités.`);
      }
      
      if (result.migratedFiles.frontend?.length > 0) {
        suggestions.push(`Dans les composants frontend, ajoutez ces champs dans les formulaires et les affichages.`);
      }
    }
    
    // Suggestions pour les routes manquantes
    if (result.missingRoutes.length > 0) {
      suggestions.push(`Implémenter les routes manquantes (${result.missingRoutes.length}): ${result.missingRoutes.join(', ')}`);
      suggestions.push(`Créez des fichiers de route Remix correspondants dans apps/frontend/app/routes/`);
    }
    
    // Suggestions pour les endpoints manquants
    if (result.missingEndpoints.length > 0) {
      suggestions.push(`Ajouter les endpoints d'API manquants (${result.missingEndpoints.length}): ${result.missingEndpoints.join(', ')}`);
      suggestions.push(`Ajoutez ces endpoints dans le contrôleur NestJS avec les décorateurs @Get, @Post, etc.`);
    }
    
    // Suggestions pour la logique métier manquante
    if (result.missingBusinessLogic.length > 0) {
      suggestions.push(`Implémenter la logique métier manquante (${result.missingBusinessLogic.length} éléments)`);
      suggestions.push(`Consultez le fichier d'audit pour comprendre la logique métier à implémenter.`);
    }
    
    // Suggestions pour les problèmes de contrôle d'accès
    if (result.accessControlIssues.length > 0) {
      suggestions.push(`Corriger les problèmes de contrôle d'accès (${result.accessControlIssues.length}):`);
      suggestions.push(`Utilisez les guards NestJS et/ou le middleware d'authentification Remix pour sécuriser les routes.`);
    }
    
    // Suggestions pour les problèmes de mapping SQL
    if (result.sqlMappingIssues.length > 0) {
      suggestions.push(`Résoudre les problèmes de mapping SQL (${result.sqlMappingIssues.length}):`);
      suggestions.push(`Vérifiez que toutes les tables et colonnes SQL sont correctement mappées dans les entités Prisma.`);
    }
    
    return suggestions;
  }
};

// Si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  let context: DiffVerifierContext = {};
  
  // Traiter les arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && i + 1 < args.length) {
      context.file = args[i + 1];
      i++;
    } else if (args[i] === '--dir' && i + 1 < args.length) {
      context.directory = args[i + 1];
      i++;
    } else if (args[i] === '--batch') {
      context.batchMode = true;
    } else if (args[i] === '--auto-remediate') {
      context.autoRemediate = true;
    } else if (args[i] === '--update-discovery') {
      context.updateDiscoveryMap = true;
    } else if (args[i] === '--report') {
      context.generateReport = true;
    }
  }
  
  diffVerifierAgent.run(context)
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
}