import { readFileSync } from 'fs';
import { basename } from 'path';
import chalk from 'chalk';

interface VerificationResult {
  fileType: string;
  file: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

export class LogicVerifier {
  private config: any;
  
  constructor(config: any) {
    this.config = config;
  }
  
  async verify(mdFiles: string[], jsonFiles: string[], tsFiles: string[]): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    
    // Vérifier la cohérence métier entre les fichiers audit et backlog
    results.push(...this.checkAuditBacklogConsistency(mdFiles, jsonFiles));
    
    // Vérifier la cohérence des schémas Prisma suggérés
    results.push(...this.checkPrismaSchemaSuggestions(mdFiles, jsonFiles));
    
    // Vérifier la cohérence des plans de migration
    results.push(...this.checkMigrationPlans(mdFiles));
    
    return results;
  }
  
  private checkAuditBacklogConsistency(mdFiles: string[], jsonFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];
    const auditFiles = mdFiles.filter(file => basename(file).includes('.audit.md'));
    
    for (const auditFile of auditFiles) {
      const baseName = basename(auditFile, '.audit.md');
      const backlogFile = jsonFiles.find(file => basename(file) === `${baseName}.backlog.json`);
      
      if (!backlogFile) continue; // Déjà traité dans ConsistencyVerifier
      
      const auditContent = readFileSync(auditFile, 'utf-8');
      let backlogContent;
      
      try {
        backlogContent = JSON.parse(readFileSync(backlogFile, 'utf-8'));
      } catch (error) {
        continue; // Déjà traité dans SyntaxVerifier
      }
      
      // Vérifier que les problèmes mentionnés dans l'audit ont des tâches correspondantes
      
      // 1. Extraire des mentions de DTO manquants
      if (auditContent.match(/DTO.*manquant|manque.*DTO|créer.*DTO/i) && 
          !backlogContent.tasks.some(task => task.type.includes('dto') || task.description?.includes('DTO'))) {
        results.push({
          fileType: 'json',
          file: backlogFile,
          status: 'warning',
          message: 'DTO mentionné dans l\'audit mais aucune tâche correspondante dans le backlog',
          details: ['Ajouter une tâche de type "generate.dto" au backlog']
        });
      }
      
      // 2. Extraire des mentions de controller à créer
      if (auditContent.match(/controller.*manquant|manque.*controller|créer.*controller/i) && 
          !backlogContent.tasks.some(task => task.type.includes('controller') || task.description?.includes('Controller'))) {
        results.push({
          fileType: 'json',
          file: backlogFile,
          status: 'warning',
          message: 'Controller mentionné dans l\'audit mais aucune tâche correspondante dans le backlog',
          details: ['Ajouter une tâche de type "generate.controller" au backlog']
        });
      }
      
      // 3. Vérifier cohérence des priorités
      const auditPriorityMatch = auditContent.match(/priorit[ée].*:\s*(\d+)/i);
      
      if (auditPriorityMatch && backlogContent.priority !== parseInt(auditPriorityMatch[1], 10)) {
        results.push({
          fileType: 'json',
          file: backlogFile,
          status: 'warning',
          message: `Incohérence de priorité: ${backlogContent.priority} dans le backlog, ${auditPriorityMatch[1]} dans l'audit`,
          details: ['Harmoniser les valeurs de priorité entre l\'audit et le backlog']
        });
      }
      
      // 4. Vérifier que le backlog a au moins une tâche pour chaque section de migration de l'audit
      const migrationSectionMatch = auditContent.match(/#+\s+[0-9️⃣]+\s+Migration\s+(\w+)/gi);
      
      if (migrationSectionMatch) {
        for (const match of migrationSectionMatch) {
          const technology = match.match(/Migration\s+(\w+)/i)[1].toLowerCase();
          
          if (!backlogContent.tasks.some(task => 
              task.target?.toLowerCase().includes(technology) || 
              task.description?.toLowerCase().includes(technology))) {
            results.push({
              fileType: 'json',
              file: backlogFile,
              status: 'warning',
              message: `Migration ${technology} mentionnée dans l'audit mais aucune tâche correspondante`,
              details: [`Ajouter une tâche ciblant ${technology} au backlog`]
            });
          }
        }
      }
    }
    
    return results;
  }
  
  private checkPrismaSchemaSuggestions(mdFiles: string[], jsonFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];
    const auditFiles = mdFiles.filter(file => basename(file).includes('.audit.md'));
    
    // Rechercher les suggestions de schéma Prisma dans les audits
    for (const auditFile of auditFiles) {
      const content = readFileSync(auditFile, 'utf-8');
      
      // Trouver les sections de modèle Prisma
      const prismaModelMatch = content.match(/```prisma\s+([\s\S]*?)```/g);
      
      if (prismaModelMatch) {
        for (const match of prismaModelMatch) {
          const modelContent = match.replace(/```prisma\s+/, '').replace(/```$/, '');
          
          // Vérifications basiques de syntaxe Prisma
          const modelErrors = this.checkPrismaModelSyntax(modelContent);
          
          if (modelErrors.length > 0) {
            results.push({
              fileType: 'md',
              file: auditFile,
              status: 'warning',
              message: 'Problèmes dans le modèle Prisma suggéré',
              details: modelErrors
            });
          }
        }
      }
    }
    
    return results;
  }
  
  private checkPrismaModelSyntax(modelContent: string): string[] {
    const errors = [];
    const lines = modelContent.split('\n');
    
    let currentModel = '';
    let hasIdField = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Détecter le début d'un modèle
      if (line.startsWith('model ')) {
        currentModel = line.match(/model\s+(\w+)/)[1];
        hasIdField = false;
      }
      
      // Vérifier si le modèle a un champ ID
      if (currentModel && line.match(/^\s*id\s+/)) {
        hasIdField = true;
      }
      
      // Vérifier la fin d'un modèle
      if (currentModel && line === '}') {
        if (!hasIdField) {
          errors.push(`Le modèle ${currentModel} n'a pas de champ id`);
        }
        currentModel = '';
      }
      
      // Vérifier les relations invalides
      if (line.includes('@relation') && !line.includes('fields:') && !line.includes('references:')) {
        errors.push(`Relation incomplète à la ligne ${i+1}: manque fields: ou references:`);
      }
    }
    
    return errors;
  }
  
  private checkMigrationPlans(mdFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];
    const migrationPlanFiles = mdFiles.filter(file => 
      basename(file).includes('.migration_plan.md') || basename(file).includes('migration-plan')
    );
    
    for (const planFile of migrationPlanFiles) {
      const content = readFileSync(planFile, 'utf-8');
      
      // Vérifier que le plan a des sections pour les différentes étapes
      const hasPreparationSection = /#+\s+.*[Pp]r[ée]paration/.test(content);
      const hasMigrationSection = /#+\s+.*[Mm]igration/.test(content);
      const hasValidationSection = /#+\s+.*[Vv]alidation|[Tt]est/.test(content);
      const hasDeploymentSection = /#+\s+.*[Dd][ée]ploiement/.test(content);
      
      const missingSections = [];
      
      if (!hasPreparationSection) missingSections.push('Préparation');
      if (!hasMigrationSection) missingSections.push('Migration');
      if (!hasValidationSection) missingSections.push('Validation/Tests');
      if (!hasDeploymentSection) missingSections.push('Déploiement');
      
      if (missingSections.length > 0) {
        results.push({
          fileType: 'md',
          file: planFile,
          status: 'warning',
          message: 'Sections manquantes dans le plan de migration',
          details: [`Sections manquantes: ${missingSections.join(', ')}`]
        });
      }
      
      // Vérifier la présence de tâches avec liste à cocher
      const checklistItems = (content.match(/- \[ \]/g) || []).length;
      
      if (checklistItems < 5) {
        results.push({
          fileType: 'md',
          file: planFile,
          status: 'warning',
          message: 'Peu de tâches définies dans le plan de migration',
          details: [`Seulement ${checklistItems} tâches avec liste à cocher trouvées`]
        });
      } else {
        results.push({
          fileType: 'md',
          file: planFile,
          status: 'success',
          message: `Plan de migration avec ${checklistItems} tâches définies`
        });
      }
    }
    
    return results;
  }
}
