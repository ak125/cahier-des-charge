import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as glob from 'glob';

// Interface pour les options de remédiation
interface RemediatorOptions {
  file?: string; // Fichier spécifique à corriger
  directory?: string; // Répertoire contenant les fichiers à corriger
  batchMode?: boolean; // Mode batch pour corriger en masse
  verificationResultPath?: string; // Chemin vers un résultat de vérification spécifique
  dryRun?: boolean; // Mode simulation sans écriture de fichiers
  generateReport?: boolean; // Générer un rapport de remédiation
  maxConcurrent?: number; // Nombre maximum de corrections simultanées
  forceOverwrite?: boolean; // Forcer la réécriture même si le fichier existe déjà
}

// Interface pour le résultat de remédiation
interface RemediationResult {
  file: string;
  status: 'success' | 'partial' | 'failed' | 'skipped';
  originalVerificationResult?: any;
  changes: {
    type:
      | 'fields'
      | 'routes'
      | 'endpoints'
      | 'businessLogic'
      | 'accessControl'
      | 'sqlMapping'
      | 'dataTypes';
    target: string;
    status: 'applied' | 'failed' | 'skipped';
    details?: string;
  }[];
  remediedFile?: string;
  errorMessage?: string;
  timestamp: string;
}

// Interface pour le résultat global
interface RemediationSummary {
  status: 'success' | 'partial' | 'failed';
  logs: string[];
  error?: string;
  summary?: {
    total: number;
    success: number;
    partial: number;
    failed: number;
    skipped: number;
  };
  results: RemediationResult[];
}

// Type pour les modifications à appliquer
type CodeModification = {
  file: string;
  type: 'add' | 'update' | 'delete';
  pattern?: RegExp | string;
  replacement?: string;
  content?: string;
  position?: 'start' | 'end' | 'after' | 'before';
  marker?: string | RegExp;
};

/**
 * Agent de remédiation automatique des divergences détectées
 * Cet agent s'intègre avec DiffVerifier pour appliquer des corrections automatiques
 */
export const remediatorAgent = {
  name: 'remediator',
  description: 'Corrige automatiquement les divergences détectées par DiffVerifier',

  async run(options: RemediatorOptions): Promise<RemediationSummary> {
    const logs: string[] = [];
    const results: RemediationResult[] = [];

    try {
      logs.push(`🚀 Démarrage de l'agent de remédiation automatique`);

      // Déterminer quels fichiers corriger
      const filesToRemediate = await this.findFilesToRemediate(options, logs);

      if (filesToRemediate.length === 0) {
        logs.push(`✅ Aucun fichier à corriger`);
        return {
          status: 'success',
          logs,
          summary: { total: 0, success: 0, partial: 0, failed: 0, skipped: 0 },
          results,
        };
      }

      logs.push(`📋 ${filesToRemediate.length} fichiers à traiter pour remédiation`);

      // Limiter la concurrence si spécifié
      const maxConcurrent = options.maxConcurrent || 5;
      let currentBatch = 0;

      // Traiter par lots
      while (currentBatch * maxConcurrent < filesToRemediate.length) {
        const batchStart = currentBatch * maxConcurrent;
        const batchEnd = Math.min((currentBatch + 1) * maxConcurrent, filesToRemediate.length);
        const batch = filesToRemediate.slice(batchStart, batchEnd);

        logs.push(
          `🔄 Traitement du lot ${currentBatch + 1}: fichiers ${batchStart + 1} à ${batchEnd}`
        );

        // Traiter chaque fichier du lot en parallèle
        const batchPromises = batch.map((file) => this.processFile(file, options, logs));
        const batchResults = await Promise.all(batchPromises);

        results.push(...batchResults);
        currentBatch++;
      }

      // Calculer les statistiques
      const summary = {
        total: results.length,
        success: results.filter((r) => r.status === 'success').length,
        partial: results.filter((r) => r.status === 'partial').length,
        failed: results.filter((r) => r.status === 'failed').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
      };

      // Générer le rapport de remédiation si demandé
      if (options.generateReport) {
        this.generateRemediationReport(results, logs);
      }

      // Mettre à jour l'index de vérification si nécessaire
      await this.updateVerifierIndex(results, logs);

      // Déterminer le statut global
      const status = summary.failed > 0 ? 'partial' : 'success';

      logs.push(`\n📊 Résumé de la remédiation:`);
      logs.push(`   ✅ Réussis: ${summary.success}`);
      logs.push(`   ⚠️ Partiels: ${summary.partial}`);
      logs.push(`   ❌ Échecs: ${summary.failed}`);
      logs.push(`   ⏭️ Ignorés: ${summary.skipped}`);

      return {
        status,
        logs,
        summary,
        results,
      };
    } catch (err: any) {
      logs.push(`❌ Erreur générale: ${err.message}`);
      return { status: 'failed', logs, error: err.message, results };
    }
  },

  /**
   * Trouve les fichiers à corriger selon les options spécifiées
   */
  async findFilesToRemediate(options: RemediatorOptions, logs: string[]): Promise<string[]> {
    const filesToRemediate: string[] = [];

    // Cas 1: Résultat de vérification spécifique fourni
    if (options.verificationResultPath) {
      if (fs.existsSync(options.verificationResultPath)) {
        filesToRemediate.push(options.verificationResultPath);
        logs.push(
          `📄 Utilisation du résultat de vérification spécifié: ${options.verificationResultPath}`
        );
      } else {
        logs.push(`❌ Fichier de résultat non trouvé: ${options.verificationResultPath}`);
      }
    }
    // Cas 2: Fichier spécifique fourni
    else if (options.file) {
      const fileBase = path.basename(options.file, '.php');
      const reportPath = path.resolve('audit', `${fileBase}.verification_report.json`);

      if (fs.existsSync(reportPath)) {
        filesToRemediate.push(reportPath);
        logs.push(`📄 Fichier à corriger: ${fileBase}`);
      } else {
        logs.push(`❌ Rapport de vérification non trouvé pour: ${fileBase}`);
      }
    }
    // Cas 3: Répertoire fourni
    else if (options.directory) {
      const dirPath = path.resolve(options.directory);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const phpFiles = glob.sync(path.join(dirPath, '**/*.php'));

        for (const phpFile of phpFiles) {
          const fileBase = path.basename(phpFile, '.php');
          const reportPath = path.resolve('audit', `${fileBase}.verification_report.json`);

          if (fs.existsSync(reportPath)) {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
            if (report.status === 'divergent' || report.status === 'critical') {
              filesToRemediate.push(reportPath);
            }
          }
        }

        logs.push(
          `📁 Dossier à traiter: ${dirPath} (${filesToRemediate.length} fichiers à corriger)`
        );
      } else {
        logs.push(`❌ Dossier non trouvé: ${dirPath}`);
      }
    }
    // Cas 4: Mode batch
    else if (options.batchMode) {
      // Trouver tous les rapports de vérification avec divergences
      const indexPath = path.resolve('reports', 'verifier_index.json');
      if (fs.existsSync(indexPath)) {
        const verifierIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

        for (const [fileBase, fileInfo] of Object.entries(verifierIndex.files)) {
          if (fileInfo.status === 'divergent' || fileInfo.status === 'critical') {
            const reportPath = path.resolve('audit', `${fileBase}.verification_report.json`);
            if (fs.existsSync(reportPath)) {
              filesToRemediate.push(reportPath);
            }
          }
        }

        logs.push(`🔍 Mode batch: ${filesToRemediate.length} fichiers à corriger`);
      } else {
        logs.push(
          `⚠️ Index de vérification non trouvé, impossible de déterminer les fichiers à corriger`
        );
      }
    }

    return filesToRemediate;
  },

  /**
   * Traite un fichier pour appliquer les corrections nécessaires
   */
  async processFile(
    reportPath: string,
    options: RemediatorOptions,
    logs: string[]
  ): Promise<RemediationResult> {
    const fileBase = path.basename(reportPath, '.verification_report.json');
    logs.push(`\n🔍 Traitement du fichier: ${fileBase}`);

    // Créer une structure de résultat
    const result: RemediationResult = {
      file: fileBase,
      status: 'skipped',
      changes: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Lire le rapport de vérification
      const verificationResult = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      result.originalVerificationResult = verificationResult;

      // Si le fichier est déjà vérifié, l'ignorer
      if (verificationResult.status === 'verified') {
        logs.push(`✅ Fichier déjà vérifié, aucune correction nécessaire: ${fileBase}`);
        return result;
      }

      // Initialiser les compteurs
      let changesApplied = 0;
      let changesFailed = 0;
      const requiredChanges = this.countRequiredChanges(verificationResult);

      // Appliquer les corrections pour chaque type de problème

      // 1. Correction des champs manquants
      if (verificationResult.missingFields.length > 0) {
        const fieldsResult = await this.fixMissingFields(
          verificationResult,
          options.dryRun || false
        );

        result.changes.push(fieldsResult);
        if (fieldsResult.status === 'applied') changesApplied++;
        else if (fieldsResult.status === 'failed') changesFailed++;
      }

      // 2. Correction des routes manquantes
      if (verificationResult.missingRoutes.length > 0) {
        const routesResult = await this.fixMissingRoutes(
          verificationResult,
          options.dryRun || false
        );

        result.changes.push(routesResult);
        if (routesResult.status === 'applied') changesApplied++;
        else if (routesResult.status === 'failed') changesFailed++;
      }

      // 3. Correction des endpoints manquants
      if (verificationResult.missingEndpoints.length > 0) {
        const endpointsResult = await this.fixMissingEndpoints(
          verificationResult,
          options.dryRun || false
        );

        result.changes.push(endpointsResult);
        if (endpointsResult.status === 'applied') changesApplied++;
        else if (endpointsResult.status === 'failed') changesFailed++;
      }

      // 4. Correction des problèmes de contrôle d'accès
      if (verificationResult.accessControlIssues.length > 0) {
        const accessControlResult = await this.fixAccessControlIssues(
          verificationResult,
          options.dryRun || false
        );

        result.changes.push(accessControlResult);
        if (accessControlResult.status === 'applied') changesApplied++;
        else if (accessControlResult.status === 'failed') changesFailed++;
      }

      // 5. Correction des problèmes de mapping SQL
      if (verificationResult.sqlMappingIssues.length > 0) {
        const sqlMappingResult = await this.fixSqlMappingIssues(
          verificationResult,
          options.dryRun || false
        );

        result.changes.push(sqlMappingResult);
        if (sqlMappingResult.status === 'applied') changesApplied++;
        else if (sqlMappingResult.status === 'failed') changesFailed++;
      }

      // 6. Correction des problèmes de logique métier
      if (verificationResult.missingBusinessLogic.length > 0) {
        const businessLogicResult = await this.fixBusinessLogic(
          verificationResult,
          options.dryRun || false
        );

        result.changes.push(businessLogicResult);
        if (businessLogicResult.status === 'applied') changesApplied++;
        else if (businessLogicResult.status === 'failed') changesFailed++;
      }

      // Déterminer le statut global de la remédiation
      if (changesApplied === requiredChanges) {
        result.status = 'success';
        logs.push(`✅ Toutes les corrections appliquées avec succès: ${fileBase}`);
      } else if (changesApplied > 0) {
        result.status = 'partial';
        logs.push(
          `⚠️ Corrections partiellement appliquées: ${fileBase} (${changesApplied}/${requiredChanges})`
        );
      } else if (changesFailed > 0) {
        result.status = 'failed';
        logs.push(`❌ Échec des corrections: ${fileBase}`);
      }

      // Sauvegarder le résultat de la remédiation
      await this.saveRemediationResult(result);

      // En cas de succès ou de correction partielle, exécuter les tests
      if (result.status === 'success' || result.status === 'partial') {
        await this.runTests(fileBase, logs);
      }

      return result;
    } catch (err: any) {
      logs.push(`❌ Erreur lors du traitement de ${fileBase}: ${err.message}`);
      result.status = 'failed';
      result.errorMessage = err.message;
      return result;
    }
  },

  /**
   * Compte le nombre de changements requis
   */
  countRequiredChanges(verificationResult: any): number {
    let count = 0;
    if (verificationResult.missingFields.length > 0) count++;
    if (verificationResult.missingRoutes.length > 0) count++;
    if (verificationResult.missingEndpoints.length > 0) count++;
    if (verificationResult.accessControlIssues.length > 0) count++;
    if (verificationResult.sqlMappingIssues.length > 0) count++;
    if (verificationResult.missingBusinessLogic.length > 0) count++;
    return count;
  },

  /**
   * Correction des champs manquants
   */
  async fixMissingFields(verificationResult: any, dryRun: boolean): Promise<any> {
    const result = {
      type: 'fields' as const,
      target: verificationResult.file,
      status: 'skipped' as const,
      details: '',
    };

    try {
      // Si aucun fichier backend n'existe, impossible de corriger
      if (
        !verificationResult.migratedFiles.backend ||
        verificationResult.migratedFiles.backend.length === 0
      ) {
        result.details = 'Aucun fichier backend trouvé pour ajouter les champs';
        return result;
      }

      // Chercher les fichiers d'entité appropriés
      const entityFiles = verificationResult.migratedFiles.backend.filter(
        (f: string) => f.includes('.entity.ts') || f.includes('.dto.ts')
      );

      if (entityFiles.length === 0) {
        result.details = "Aucun fichier d'entité ou DTO trouvé";
        return result;
      }

      // Liste des modifications à appliquer
      const modifications: CodeModification[] = [];

      // Pour chaque champ manquant, créer une modification
      for (const entityFile of entityFiles) {
        const fileContent = fs.readFileSync(entityFile, 'utf-8');
        const isDto = entityFile.includes('.dto.ts');

        // Trouver la classe dans le fichier
        const classMatch = fileContent.match(/export\s+class\s+(\w+)/);
        if (!classMatch) continue;

        const className = classMatch[1];

        // Trouver où ajouter les champs (avant la fin de la classe)
        const classEndPosition = fileContent.lastIndexOf('}');
        if (classEndPosition === -1) continue;

        // Construire les définitions des champs manquants
        let fieldsToAdd = '';
        for (const field of verificationResult.missingFields) {
          const fieldDefinition = isDto
            ? `  @ApiProperty()\n  ${field}: string;\n\n`
            : `  @Column()\n  ${field}: string;\n\n`;

          fieldsToAdd += fieldDefinition;
        }

        // Créer la modification
        modifications.push({
          file: entityFile,
          type: 'update',
          pattern: /}$/,
          replacement: `\n${fieldsToAdd}}`,
        });

        // Ne prendre que le premier fichier d'entité trouvé
        break;
      }

      // Appliquer les modifications
      if (!dryRun && modifications.length > 0) {
        for (const mod of modifications) {
          this.applyModification(mod);
        }

        result.status = 'applied';
        result.details = `${verificationResult.missingFields.length} champs ajoutés`;
      } else if (dryRun) {
        result.status = 'skipped';
        result.details = 'Mode simulation activé, aucune modification effectuée';
      } else {
        result.details = 'Aucune modification à appliquer';
      }

      return result;
    } catch (err: any) {
      result.status = 'failed';
      result.details = `Erreur: ${err.message}`;
      return result;
    }
  },

  /**
   * Correction des routes manquantes
   */
  async fixMissingRoutes(verificationResult: any, dryRun: boolean): Promise<any> {
    const result = {
      type: 'routes' as const,
      target: verificationResult.file,
      status: 'skipped' as const,
      details: '',
    };

    try {
      // Vérifier si des fichiers frontend existent
      if (
        !verificationResult.migratedFiles.frontend ||
        verificationResult.migratedFiles.frontend.length === 0
      ) {
        // Créer de nouveaux fichiers de route Remix
        const routesDir = path.resolve('apps/frontend/app/routes');
        const missingRoutes = verificationResult.missingRoutes;

        // Créer les modifications
        const modifications: CodeModification[] = [];

        for (const route of missingRoutes) {
          const routeFilePath = path.join(routesDir, `${route}.tsx`);

          // Template pour un fichier de route Remix basique
          const routeTemplate = `import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  return json({
    message: "Route ${route}"
  });
}

export default function ${route.replace(/[^a-zA-Z0-9]/g, '')}Route() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>${route}</h1>
      <p>{data.message}</p>
    </div>
  );
}
`;

          // Ajouter la modification
          modifications.push({
            file: routeFilePath,
            type: 'add',
            content: routeTemplate,
          });
        }

        // Appliquer les modifications
        if (!dryRun && modifications.length > 0) {
          for (const mod of modifications) {
            this.applyModification(mod);
          }

          result.status = 'applied';
          result.details = `${verificationResult.missingRoutes.length} routes ajoutées`;
        } else if (dryRun) {
          result.status = 'skipped';
          result.details = 'Mode simulation activé, aucune modification effectuée';
        } else {
          result.details = 'Aucune modification à appliquer';
        }
      } else {
        // Mettre à jour les fichiers frontend existants
        const frontendFiles = verificationResult.migratedFiles.frontend;
        const missingRoutes = verificationResult.missingRoutes;

        // Créer les modifications
        const modifications: CodeModification[] = [];

        for (const file of frontendFiles) {
          const fileContent = fs.readFileSync(file, 'utf-8');

          // Rechercher les routes déjà existantes
          const routeMatches = fileContent.match(/path\s*:\s*['"]([^'"]+)['"]/g) || [];
          const existingRoutes = routeMatches.map((m) => m.match(/path\s*:\s*['"]([^'"]+)['"]/)[1]);

          // Trouver les routes manquantes qui ne sont pas déjà dans le fichier
          const routesToAdd = missingRoutes.filter((r) => !existingRoutes.includes(`/${r}`));

          if (routesToAdd.length > 0) {
            // Chercher où ajouter les routes (dans le tableau des routes)
            const routesArrayMatch = fileContent.match(/routes\s*:\s*\[([\s\S]*?)\]/);
            if (!routesArrayMatch) continue;

            // Construire les définitions des routes
            let routesDefinition = '';
            for (const route of routesToAdd) {
              routesDefinition += `    { path: "/${route}", element: <${route.replace(
                /[^a-zA-Z0-9]/g,
                ''
              )} /> },\n`;
            }

            // Créer la modification
            modifications.push({
              file,
              type: 'update',
              pattern: /routes\s*:\s*\[([\s\S]*?)\]/,
              replacement: `routes: [\n${routesArrayMatch[1]}\n${routesDefinition}]`,
            });
          }
        }

        // Appliquer les modifications
        if (!dryRun && modifications.length > 0) {
          for (const mod of modifications) {
            this.applyModification(mod);
          }

          result.status = 'applied';
          result.details = `${verificationResult.missingRoutes.length} routes ajoutées`;
        } else if (dryRun) {
          result.status = 'skipped';
          result.details = 'Mode simulation activé, aucune modification effectuée';
        } else {
          result.details = 'Aucune modification à appliquer';
        }
      }

      return result;
    } catch (err: any) {
      result.status = 'failed';
      result.details = `Erreur: ${err.message}`;
      return result;
    }
  },

  /**
   * Correction des endpoints manquants
   */
  async fixMissingEndpoints(verificationResult: any, dryRun: boolean): Promise<any> {
    const result = {
      type: 'endpoints' as const,
      target: verificationResult.file,
      status: 'skipped' as const,
      details: '',
    };

    try {
      // Chercher les fichiers contrôleur
      const controllerFiles =
        verificationResult.migratedFiles.backend?.filter((f: string) =>
          f.includes('.controller.ts')
        ) || [];

      if (controllerFiles.length === 0) {
        result.details = 'Aucun fichier contrôleur trouvé';
        return result;
      }

      // Utiliser le premier fichier contrôleur trouvé
      const controllerFile = controllerFiles[0];
      const fileContent = fs.readFileSync(controllerFile, 'utf-8');

      // Trouver la classe du contrôleur
      const classMatch = fileContent.match(/export\s+class\s+(\w+)/);
      if (!classMatch) {
        result.details = 'Classe du contrôleur non trouvée';
        return result;
      }

      const className = classMatch[1];

      // Liste des modifications à appliquer
      const modifications: CodeModification[] = [];

      // Position pour ajouter les endpoints (avant la fin de la classe)
      const classEndPosition = fileContent.lastIndexOf('}');
      if (classEndPosition === -1) {
        result.details = 'Fin de la classe du contrôleur non trouvée';
        return result;
      }

      // Construire les définitions des endpoints manquants
      let endpointsToAdd = '';
      for (const endpoint of verificationResult.missingEndpoints) {
        // Déduire le nom de méthode de l'endpoint
        const methodName = endpoint.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        // Template pour un endpoint basique
        const endpointTemplate = `
  @Get('${endpoint}')
  async ${methodName}() {
    return {
      message: '${endpoint} endpoint'
    };
  }
`;

        endpointsToAdd += endpointTemplate;
      }

      // Créer la modification
      modifications.push({
        file: controllerFile,
        type: 'update',
        pattern: /}$/,
        replacement: `${endpointsToAdd}}`,
      });

      // Appliquer les modifications
      if (!dryRun && modifications.length > 0) {
        for (const mod of modifications) {
          this.applyModification(mod);
        }

        result.status = 'applied';
        result.details = `${verificationResult.missingEndpoints.length} endpoints ajoutés`;
      } else if (dryRun) {
        result.status = 'skipped';
        result.details = 'Mode simulation activé, aucune modification effectuée';
      } else {
        result.details = 'Aucune modification à appliquer';
      }

      return result;
    } catch (err: any) {
      result.status = 'failed';
      result.details = `Erreur: ${err.message}`;
      return result;
    }
  },

  /**
   * Correction des problèmes de contrôle d'accès
   */
  async fixAccessControlIssues(verificationResult: any, dryRun: boolean): Promise<any> {
    const result = {
      type: 'accessControl' as const,
      target: verificationResult.file,
      status: 'skipped' as const,
      details: '',
    };

    try {
      // Chercher les fichiers contrôleur et les fichiers frontend
      const controllerFiles =
        verificationResult.migratedFiles.backend?.filter((f: string) =>
          f.includes('.controller.ts')
        ) || [];
      const frontendFiles = verificationResult.migratedFiles.frontend || [];

      const modifications: CodeModification[] = [];

      // Ajouter le contrôle d'accès aux contrôleurs backend
      for (const controllerFile of controllerFiles) {
        const fileContent = fs.readFileSync(controllerFile, 'utf-8');

        // Vérifier si les imports pour le contrôle d'accès sont présents
        const hasAuthImport =
          fileContent.includes('@nestjs/passport') ||
          fileContent.includes('AuthGuard') ||
          fileContent.includes('JwtAuthGuard');

        // Si les imports nécessaires ne sont pas présents, les ajouter
        if (!hasAuthImport) {
          modifications.push({
            file: controllerFile,
            type: 'update',
            pattern: /import.*?from.*?;(\s*)/,
            replacement: `import { UseGuards } from '@nestjs/common';\nimport { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';\n$1`,
          });
        }

        // Ajouter le décorateur UseGuards à la classe
        if (!fileContent.includes('@UseGuards')) {
          const classMatch = fileContent.match(/export\s+class\s+(\w+)/);
          if (classMatch) {
            const classDeclaration = classMatch[0];
            modifications.push({
              file: controllerFile,
              type: 'update',
              pattern: new RegExp(classDeclaration),
              replacement: `@UseGuards(JwtAuthGuard)\n${classDeclaration}`,
            });
          }
        }
      }

      // Ajouter le contrôle d'accès aux routes frontend
      for (const frontendFile of frontendFiles) {
        const fileContent = fs.readFileSync(frontendFile, 'utf-8');

        // Vérifier si le contrôle d'accès est déjà présent
        const hasAuthCheck =
          fileContent.includes('requireAuth') ||
          fileContent.includes('authenticated') ||
          fileContent.includes('isAuthenticated');

        if (!hasAuthCheck) {
          // Ajouter un loader qui vérifie l'authentification
          if (fileContent.includes('export async function loader')) {
            // Modifier le loader existant
            modifications.push({
              file: frontendFile,
              type: 'update',
              pattern: /export\s+async\s+function\s+loader\([^)]*\)\s*{/,
              replacement: `export async function loader({ request }) {
  // Vérifier l'authentification
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }
  
`,
            });

            // Ajouter l'import pour getSession et redirect
            modifications.push({
              file: frontendFile,
              type: 'update',
              pattern: /import.*?from.*?;(\s*)/,
              replacement: `import { getSession } from "~/utils/session.server";\nimport { redirect } from "@remix-run/node";\n$1`,
            });
          } else {
            // Ajouter un nouveau loader avec vérification d'authentification
            const importMatch = fileContent.match(/import.*?from.*?;(\s*)/);
            if (importMatch) {
              const imports = `import { getSession } from "~/utils/session.server";\nimport { redirect } from "@remix-run/node";\n`;

              const loaderFunction = `
export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/login");
  }
  return json({});
}
`;

              modifications.push({
                file: frontendFile,
                type: 'update',
                pattern: importMatch[0],
                replacement: `${importMatch[0]}${imports}${loaderFunction}`,
              });
            }
          }
        }
      }

      // Appliquer les modifications
      if (!dryRun && modifications.length > 0) {
        for (const mod of modifications) {
          this.applyModification(mod);
        }

        result.status = 'applied';
        result.details = `Contrôle d'accès ajouté à ${modifications.length} fichiers`;
      } else if (dryRun) {
        result.status = 'skipped';
        result.details = 'Mode simulation activé, aucune modification effectuée';
      } else {
        result.details = 'Aucune modification à appliquer';
      }

      return result;
    } catch (err: any) {
      result.status = 'failed';
      result.details = `Erreur: ${err.message}`;
      return result;
    }
  },

  /**
   * Correction des problèmes de mapping SQL
   */
  async fixSqlMappingIssues(verificationResult: any, dryRun: boolean): Promise<any> {
    const result = {
      type: 'sqlMapping' as const,
      target: verificationResult.file,
      status: 'skipped' as const,
      details: '',
    };

    try {
      // Extraire les tables et colonnes manquantes des issues
      const missingTables: string[] = [];
      const missingColumns: string[] = [];

      for (const issue of verificationResult.sqlMappingIssues) {
        if (issue.includes("Table '")) {
          const tableMatch = issue.match(/Table '([^']+)'/g);
          if (tableMatch) {
            for (const match of tableMatch) {
              const table = match.replace(/Table '|'/g, '');
              missingTables.push(table);
            }
          }
        }

        if (issue.includes("Colonne '")) {
          const columnMatch = issue.match(/Colonne '([^']+)'/g);
          if (columnMatch) {
            for (const match of columnMatch) {
              const column = match.replace(/Colonne '|'/g, '');
              missingColumns.push(column);
            }
          }
        }
      }

      // Chercher les fichiers d'entité
      const entityFiles =
        verificationResult.migratedFiles.backend?.filter((f: string) => f.includes('.entity.ts')) ||
        [];

      if (entityFiles.length === 0) {
        result.details = "Aucun fichier d'entité trouvé";
        return result;
      }

      const modifications: CodeModification[] = [];

      // Pour chaque entité, vérifier s'il faut ajouter des mappings
      for (const entityFile of entityFiles) {
        const fileContent = fs.readFileSync(entityFile, 'utf-8');

        // Vérifier si le fichier a une classe d'entité
        const classMatch = fileContent.match(/export\s+class\s+(\w+)/);
        if (!classMatch) continue;

        const className = classMatch[1];

        // Pour chaque table manquante, vérifier si elle doit être mappée dans cette entité
        for (const table of missingTables) {
          // Si le nom de la classe correspond à la table (en ignorant la casse)
          if (
            className.toLowerCase().includes(table.toLowerCase()) ||
            table.toLowerCase().includes(className.toLowerCase())
          ) {
            // Vérifier si la table est déjà mappée
            if (
              !fileContent.includes(`@Entity('${table}')`) &&
              !fileContent.includes(`@Entity("${table}")`) &&
              !fileContent.includes(`name: '${table}'`) &&
              !fileContent.includes(`name: "${table}"`)
            ) {
              // Ajouter le mapping de table
              modifications.push({
                file: entityFile,
                type: 'update',
                pattern: new RegExp(`export\\s+class\\s+${className}`),
                replacement: `@Entity('${table}')\nexport class ${className}`,
              });

              // Ajouter l'import si nécessaire
              if (!fileContent.includes('import { Entity')) {
                modifications.push({
                  file: entityFile,
                  type: 'update',
                  pattern: /import.*?from.*?;(\s*)/,
                  replacement: `import { Entity } from 'typeorm';\n$1`,
                });
              }
            }
          }
        }

        // Pour chaque colonne manquante, l'ajouter à l'entité
        for (const column of missingColumns) {
          // Vérifier si la colonne existe déjà
          const columnRegex = new RegExp(`@Column\\([^)]*\\)\\s*${column}\\s*:|${column}\\s*:\\s*`);
          if (!columnRegex.test(fileContent)) {
            // Fin de la classe
            const classEndPosition = fileContent.lastIndexOf('}');
            if (classEndPosition === -1) continue;

            // Ajouter la définition de colonne
            const columnDefinition = `  @Column()\n  ${column}: string;\n\n`;

            modifications.push({
              file: entityFile,
              type: 'update',
              pattern: /}$/,
              replacement: `\n${columnDefinition}}`,
            });

            // Ajouter l'import si nécessaire
            if (!fileContent.includes('import { Column')) {
              if (fileContent.includes('import { Entity')) {
                modifications.push({
                  file: entityFile,
                  type: 'update',
                  pattern: /import { Entity/,
                  replacement: `import { Entity, Column`,
                });
              } else {
                modifications.push({
                  file: entityFile,
                  type: 'update',
                  pattern: /import.*?from.*?;(\s*)/,
                  replacement: `import { Column } from 'typeorm';\n$1`,
                });
              }
            }
          }
        }
      }

      // S'il n'y a pas d'entité qui correspond à une table manquante, créer une nouvelle entité
      for (const table of missingTables) {
        const tableMatched = entityFiles.some((file) => {
          const className = path.basename(file, '.entity.ts');
          return (
            className.toLowerCase().includes(table.toLowerCase()) ||
            table.toLowerCase().includes(className.toLowerCase())
          );
        });

        if (!tableMatched) {
          // Créer une nouvelle entité
          const entityName = table.replace(/_/g, '');
          const entityClassName =
            entityName.charAt(0).toUpperCase() + entityName.slice(1) + 'Entity';
          const entityFilePath = path.join(
            path.dirname(entityFiles[0] || 'apps/backend/src/entities'),
            `${entityName}.entity.ts`
          );

          // Template de base pour l'entité
          const entityTemplate = `import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('${table}')
export class ${entityClassName} {
  @PrimaryGeneratedColumn()
  id: number;
  
${missingColumns.map((col) => `  @Column()\n  ${col}: string;\n`).join('\n')}
}
`;

          modifications.push({
            file: entityFilePath,
            type: 'add',
            content: entityTemplate,
          });
        }
      }

      // Mise à jour du schema.prisma si nécessaire
      const prismaSchemaPath = path.resolve('prisma/schema.prisma');
      if (fs.existsSync(prismaSchemaPath)) {
        const prismaSchema = fs.readFileSync(prismaSchemaPath, 'utf-8');

        for (const table of missingTables) {
          const tableInPrisma =
            prismaSchema.includes(`model ${table}`) ||
            prismaSchema.includes(`model ${table.charAt(0).toUpperCase() + table.slice(1)}`);

          if (!tableInPrisma) {
            // Ajouter le modèle au schema Prisma
            const modelDefinition = `
model ${table.charAt(0).toUpperCase() + table.slice(1)} {
  id Int @id @default(autoincrement())
${missingColumns.map((col) => `  ${col} String`).join('\n')}
}
`;

            modifications.push({
              file: prismaSchemaPath,
              type: 'update',
              pattern: /$/,
              replacement: `\n${modelDefinition}`,
            });
          }
        }
      }

      // Appliquer les modifications
      if (!dryRun && modifications.length > 0) {
        for (const mod of modifications) {
          this.applyModification(mod);
        }

        result.status = 'applied';
        result.details = `Mapping SQL ajouté pour ${missingTables.length} tables et ${missingColumns.length} colonnes`;
      } else if (dryRun) {
        result.status = 'skipped';
        result.details = 'Mode simulation activé, aucune modification effectuée';
      } else {
        result.details = 'Aucune modification à appliquer';
      }

      return result;
    } catch (err: any) {
      result.status = 'failed';
      result.details = `Erreur: ${err.message}`;
      return result;
    }
  },

  /**
   * Correction des problèmes de logique métier
   */
  async fixBusinessLogic(verificationResult: any, dryRun: boolean): Promise<any> {
    const result = {
      type: 'businessLogic' as const,
      target: verificationResult.file,
      status: 'skipped' as const,
      details: '',
    };

    try {
      // Chercher les fichiers de service
      const serviceFiles =
        verificationResult.migratedFiles.backend?.filter((f: string) =>
          f.includes('.service.ts')
        ) || [];

      if (serviceFiles.length === 0) {
        result.details = 'Aucun fichier service trouvé';
        return result;
      }

      // Utiliser le premier fichier service trouvé
      const serviceFile = serviceFiles[0];
      const fileContent = fs.readFileSync(serviceFile, 'utf-8');

      // Liste des modifications à appliquer
      const modifications: CodeModification[] = [];

      // Trouver la classe du service
      const classMatch = fileContent.match(/export\s+class\s+(\w+)/);
      if (!classMatch) {
        result.details = 'Classe du service non trouvée';
        return result;
      }

      const className = classMatch[1];
      const logicItems = verificationResult.missingBusinessLogic;

      // Position pour ajouter la logique métier (avant la fin de la classe)
      const classEndPosition = fileContent.lastIndexOf('}');
      if (classEndPosition === -1) {
        result.details = 'Fin de la classe du service non trouvée';
        return result;
      }

      // Implémenter la logique métier manquante
      let logicToAdd = '';

      for (const logic of logicItems) {
        // Essayer de déduire un nom de méthode et implémentation basée sur la description
        let methodName = 'process';
        let methodImpl = '';

        // Si c'est une condition, créer une méthode qui l'implémente
        if (logic.startsWith('Condition:')) {
          const condition = logic.replace('Condition:', '').trim();
          methodName = `check${condition.replace(/[^a-zA-Z0-9]/g, '')}`;

          methodImpl = `
  /**
   * Implémentation de la logique métier: ${logic}
   */
  ${methodName}(value: any): boolean {
    // TODO: Implémenter la condition correctement
    return ${condition};
  }
`;
        } else {
          // Pour les autres cas, créer une méthode générique
          methodName = `process${logic.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;

          methodImpl = `
  /**
   * Implémentation de la logique métier: ${logic}
   */
  async ${methodName}(data: any): Promise<any> {
    // TODO: Implémenter la logique métier correctement
    console.log('Exécution de la logique: ${logic}');
    
    // Voici une implémentation simplifiée
    // Remplacez-la par la véritable logique basée sur "${logic}"
    return {
      success: true,
      message: 'Logique métier appliquée',
      details: '${logic}'
    };
  }
`;
        }

        logicToAdd += methodImpl;
      }

      // Créer la modification
      if (logicToAdd) {
        modifications.push({
          file: serviceFile,
          type: 'update',
          pattern: /}$/,
          replacement: `${logicToAdd}}`,
        });
      }

      // Appliquer les modifications
      if (!dryRun && modifications.length > 0) {
        for (const mod of modifications) {
          this.applyModification(mod);
        }

        result.status = 'applied';
        result.details = `${verificationResult.missingBusinessLogic.length} éléments de logique métier ajoutés`;
      } else if (dryRun) {
        result.status = 'skipped';
        result.details = 'Mode simulation activé, aucune modification effectuée';
      } else {
        result.details = 'Aucune modification à appliquer';
      }

      return result;
    } catch (err: any) {
      result.status = 'failed';
      result.details = `Erreur: ${err.message}`;
      return result;
    }
  },

  /**
   * Applique une modification de code
   */
  applyModification(modification: CodeModification): void {
    // Création du dossier parent si nécessaire
    const dir = path.dirname(modification.file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    switch (modification.type) {
      case 'add':
        // Ajout d'un nouveau fichier
        fs.writeFileSync(modification.file, modification.content || '');
        break;

      case 'update':
        // Mise à jour d'un fichier existant
        if (fs.existsSync(modification.file)) {
          let content = fs.readFileSync(modification.file, 'utf-8');

          if (modification.pattern && modification.replacement) {
            content = content.replace(modification.pattern, modification.replacement);
          } else if (modification.position && modification.content) {
            switch (modification.position) {
              case 'start':
                content = modification.content + content;
                break;

              case 'end':
                content = content + modification.content;
                break;

              case 'after':
                if (modification.marker) {
                  const marker =
                    typeof modification.marker === 'string'
                      ? modification.marker
                      : content.match(modification.marker)?.[0] || '';

                  if (marker && content.includes(marker)) {
                    content = content.replace(marker, marker + modification.content);
                  }
                }
                break;

              case 'before':
                if (modification.marker) {
                  const marker =
                    typeof modification.marker === 'string'
                      ? modification.marker
                      : content.match(modification.marker)?.[0] || '';

                  if (marker && content.includes(marker)) {
                    content = content.replace(marker, modification.content + marker);
                  }
                }
                break;
            }
          }

          fs.writeFileSync(modification.file, content);
        } else {
          // Si le fichier n'existe pas, le créer
          fs.writeFileSync(modification.file, modification.replacement || '');
        }
        break;

      case 'delete':
        // Suppression d'un fichier
        if (fs.existsSync(modification.file)) {
          fs.unlinkSync(modification.file);
        }
        break;
    }
  },

  /**
   * Sauvegarde le résultat de remédiation
   */
  async saveRemediationResult(result: RemediationResult): Promise<void> {
    const reportDir = path.resolve('reports', 'remediation');
    const fileBase = result.file;
    const reportPath = path.join(reportDir, `${fileBase}.remediation_report.json`);

    // Créer le répertoire si nécessaire
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Écrire le rapport
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  },

  /**
   * Exécute les tests après remédiation
   */
  async runTests(fileBase: string, logs: string[]): Promise<void> {
    try {
      logs.push(`🧪 Exécution des tests pour ${fileBase}...`);

      // Construire la commande pour exécuter les tests
      const command = `pnpm tsx appsDoDotmcp-server/src/handleAgentRequest.ts TestWriter '{"moduleName":"${fileBase}","type":"both","executeTests":true}'`;

      // Exécuter la commande
      execSync(command, { stdio: 'pipe' });
      logs.push(`✅ Tests exécutés pour ${fileBase}`);
    } catch (err: any) {
      logs.push(`⚠️ Problème lors de l'exécution des tests: ${err.message}`);
    }
  },

  /**
   * Met à jour l'index de vérification
   */
  async updateVerifierIndex(results: RemediationResult[], logs: string[]): Promise<void> {
    const indexPath = path.resolve('reports', 'verifier_index.json');

    if (!fs.existsSync(indexPath)) {
      logs.push(`⚠️ Index de vérification non trouvé: ${indexPath}`);
      return;
    }

    try {
      // Lire l'index actuel
      const verifierIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      let updated = false;

      // Mettre à jour pour chaque résultat de remédiation réussi
      for (const result of results) {
        if (result.status === 'success') {
          const fileBase = result.file;

          if (verifierIndex.files[fileBase]) {
            verifierIndex.files[fileBase].status = 'verified';
            verifierIndex.files[fileBase].verifiedDate = result.timestamp;
            updated = true;
            logs.push(`✅ Status mis à jour pour ${fileBase} dans l'index de vérification`);
          }
        }
      }

      // Recalculer les totaux si des modifications ont été faites
      if (updated) {
        const statuses = Object.values(verifierIndex.files).map((f: any) => f.status);
        verifierIndex.totalFiles = Object.keys(verifierIndex.files).length;
        verifierIndex.verifiedCount = statuses.filter((s) => s === 'verified').length;
        verifierIndex.divergentCount = statuses.filter((s) => s === 'divergent').length;
        verifierIndex.criticalCount = statuses.filter((s) => s === 'critical').length;
        verifierIndex.pendingCount = statuses.filter((s) => s === 'pending').length;
        verifierIndex.errorCount = statuses.filter((s) => s === 'error').length;
        verifierIndex.lastUpdated = new Date().toISOString();

        // Sauvegarder l'index mis à jour
        fs.writeFileSync(indexPath, JSON.stringify(verifierIndex, null, 2));
        logs.push(`📊 Index de vérification mis à jour`);
      }
    } catch (err: any) {
      logs.push(`❌ Erreur lors de la mise à jour de l'index: ${err.message}`);
    }
  },

  /**
   * Génère un rapport HTML global pour tous les résultats
   */
  generateRemediationReport(results: RemediationResult[], logs: string[]): void {
    const reportDir = path.resolve('reports');
    const reportPath = path.resolve(reportDir, 'remediation_summary.html');

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Calculer les statistiques
    const summary = {
      total: results.length,
      success: results.filter((r) => r.status === 'success').length,
      partial: results.filter((r) => r.status === 'partial').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
    };

    // Créer un rapport HTML
    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de remédiation automatique</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .file-card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 15px; }
    .file-card h3 { margin-top: 0; color: #2c3e50; }
    .success { border-left: 5px solid #2ecc71; }
    .partial { border-left: 5px solid #f39c12; }
    .failed { border-left: 5px solid #e74c3c; }
    .skipped { border-left: 5px solid #7f8c8d; }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      font-weight: bold;
      color: white;
    }
    .status-success { background-color: #2ecc71; }
    .status-partial { background-color: #f39c12; }
    .status-failed { background-color: #e74c3c; }
    .status-skipped { background-color: #7f8c8d; }
    .change-list { margin-top: 10px; }
    .change-item { margin-bottom: 5px; }
    .change-type { font-weight: bold; margin-top: 10px; }
    .change-applied { color: #2ecc71; }
    .change-failed { color: #e74c3c; }
    .change-skipped { color: #7f8c8d; }
  </style>
</head>
<body>
  <h1>Rapport de remédiation automatique</h1>
  
  <div class="summary">
    <h2>Résumé</h2>
    <p>Date du rapport: ${new Date().toLocaleString()}</p>
    <p>Total de fichiers traités: ${summary.total}</p>
    <p>
      <span class="status-badge status-success">Réussis: ${summary.success}</span>
      <span class="status-badge status-partial">Partiels: ${summary.partial}</span>
      <span class="status-badge status-failed">Échecs: ${summary.failed}</span>
      <span class="status-badge status-skipped">Ignorés: ${summary.skipped}</span>
    </p>
  </div>
  
  <h2>Détails par fichier</h2>
`;

    // Ajouter les détails pour chaque fichier traité
    for (const result of results) {
      html += `
  <div class="file-card ${result.status}">
    <h3>${result.file} <span class="status-badge status-${result.status}">${result.status}</span></h3>
    <p>Date de la remédiation: ${new Date(result.timestamp).toLocaleString()}</p>
    
    <div class="change-list">
`;

      // Afficher les changements appliqués
      for (const change of result.changes) {
        html += `      <div class="change-type">Type: ${change.type} - <span class="change-${change.status}">${change.status}</span></div>\n`;
        html += `      <div class="change-item">Cible: ${change.target}</div>\n`;

        if (change.details) {
          html += `      <div class="change-item">Détails: ${change.details}</div>\n`;
        }
      }

      // Afficher les messages d'erreur
      if (result.errorMessage) {
        html += `      <div class="change-type change-failed">Erreur</div>\n`;
        html += `      <div class="change-item">${result.errorMessage}</div>\n`;
      }

      html += `    </div>
  </div>
`;
    }

    html += `
</body>
</html>
`;

    // Écrire le rapport HTML
    fs.writeFileSync(reportPath, html);
    logs.push(`📊 Rapport de remédiation HTML généré: ${reportPath}`);
  },
};

// Si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: RemediatorOptions = {};

  // Traiter les arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && i + 1 < args.length) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === '--dir' && i + 1 < args.length) {
      options.directory = args[i + 1];
      i++;
    } else if (args[i] === '--batch') {
      options.batchMode = true;
    } else if (args[i] === '--result' && i + 1 < args.length) {
      options.verificationResultPath = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--report') {
      options.generateReport = true;
    } else if (args[i] === '--max-concurrent' && i + 1 < args.length) {
      options.maxConcurrent = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--force') {
      options.forceOverwrite = true;
    }
  }

  remediatorAgent
    .run(options)
    .then((result) => {
      if (result.logs) {
        console.log(result.logs.join('\n'));
      }
      process.exit(result.status === 'success' ? 0 : 1);
    })
    .catch((error) => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}

import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';
