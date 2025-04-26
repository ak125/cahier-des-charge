/**
 * schema_diff_to_code_patch.ts
 * Utilitaire pour appliquer automatiquement les modifications du schéma Prisma aux DTOs et aux composants
 * Date: 2025-04-13
 */

import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';
import { execSync } from child_processstructure-agent';
import * as glob from globstructure-agent';

// Types pour le suivi des modifications
interface SchemaDiff {
  summary: {
    modelsAdded: string[];
    modelsRemoved: string[];
    fieldsAdded: Record<string, string[]>;
    fieldsRemoved: Record<string, string[]>;
    fieldsTypeChanged: Record<string, Record<string, { from: string; to: string }>>;
    relationsChanged: Record<string, Record<string, { from: string; to: string }>>;
  };
  details: any;
}

interface CodeUpdate {
  filePath: string;
  changes: {
    type: 'add' | 'remove' | 'modify';
    lineStart: number;
    lineEnd?: number;
    content?: string;
  }[];
}

// Configuration
const CONFIG = {
  schemaDiffPath: './packages/database/prisma/schema_migration_diff.json',
  nestjsServicesDir: './appsDoDotmcp-server-postgres/src/services',
  nestjsDtosDir: './appsDoDotmcp-server-postgres/src/dtos',
  remixRoutesDir: './apps/frontend/app/routes',
  backupSuffix: `.bak-${new Date().toISOString().replace(/:/g, '-')}`,
};

/**
 * Lit et analyse le fichier de différences de schéma
 */
function readSchemaDiff(): SchemaDiff {
  try {
    const diffContent = fs.readFileSync(CONFIG.schemaDiffPath, 'utf8');
    return JSON.parse(diffContent);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier de différences de schéma:', error);
    process.exit(1);
  }
}

/**
 * Trouve tous les fichiers DTO dans le projet
 */
function findDtoFiles(modelName: string): string[] {
  const pattern = `${CONFIG.nestjsDtosDir}/**/*${modelName}*.dto.ts`;
  return glob.sync(pattern);
}

/**
 * Trouve tous les fichiers de service dans le projet
 */
function findServiceFiles(modelName: string): string[] {
  const pattern = `${CONFIG.nestjsServicesDir}/**/*${modelName}*.service.ts`;
  return glob.sync(pattern);
}

/**
 * Trouve tous les fichiers loader/action de Remix associés à un modèle
 */
function findRemixFiles(modelName: string): string[] {
  const patterns = [
    `${CONFIG.remixRoutesDir}/**/*${modelName}*.tsx`,
    `${CONFIG.remixRoutesDir}/**/*${modelName}*/index.tsx`,
    `${CONFIG.remixRoutesDir}/**/*${modelName}*/loader.ts`,
    `${CONFIG.remixRoutesDir}/**/*${modelName}*/action.ts`,
  ];
  
  return patterns.flatMap(pattern => glob.sync(pattern));
}

/**
 * Met à jour un fichier DTO avec les nouveaux champs
 */
function updateDtoFile(filePath: string, fieldsAdded: string[], fieldsRemoved: string[], fieldsTypeChanged: Record<string, { from: string; to: string }>): CodeUpdate {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const changes: CodeUpdate['changes'] = [];

  // Analyser le fichier pour trouver la classe DTO
  let inClass = false;
  let classBraceCount = 0;
  let classStartLine = -1;
  let classEndLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter le début de la classe
    if (!inClass && line.includes('class') && line.includes('Dto')) {
      inClass = true;
      classStartLine = i;
      if (line.includes('{')) classBraceCount++;
    } 
    // Compter les accolades pour déterminer la fin de la classe
    else if (inClass) {
      if (line.includes('{')) classBraceCount++;
      if (line.includes('}')) classBraceCount--;
      
      if (classBraceCount === 0) {
        classEndLine = i;
        break;
      }
    }
  }

  if (classStartLine === -1) {
    console.warn(`Aucune classe DTO trouvée dans ${filePath}`);
    return { filePath, changes };
  }

  // Ajouter les nouveaux champs avant la fin de la classe
  if (fieldsAdded.length > 0) {
    let newFieldsContent = '\n';
    fieldsAdded.forEach(field => {
      let fieldType = 'string'; // Type par défaut
      
      // Déterminer le type à partir du nom du champ (heuristique simple)
      if (field.endsWith('Id')) fieldType = 'number';
      else if (field.endsWith('At')) fieldType = 'Date';
      else if (field.endsWith('Count') || field.endsWith('Total')) fieldType = 'number';
      else if (field.startsWith('is') || field.startsWith('has')) fieldType = 'boolean';
      
      newFieldsContent += `  @ApiProperty({ description: '${field}' })\n`;
      newFieldsContent += `  ${field}: ${fieldType};\n\n`;
    });
    
    changes.push({
      type: 'add',
      lineStart: classEndLine,
      content: newFieldsContent
    });
  }

  // Modifier les types de champs changés
  if (Object.keys(fieldsTypeChanged).length > 0) {
    const classContent = lines.slice(classStartLine, classEndLine + 1).join('\n');
    
    for (const [field, change] of Object.entries(fieldsTypeChanged)) {
      // Recherche basique du champ et de son type
      const fieldRegex = new RegExp(`(\\s+${field}\\s*:\\s*)${change.from}(\\s*;)`, 'g');
      if (fieldRegex.test(classContent)) {
        // Pour chaque ligne de la classe, vérifier si le champ s'y trouve
        for (let i = classStartLine; i <= classEndLine; i++) {
          if (lines[i].includes(`${field}:`) && lines[i].includes(change.from)) {
            changes.push({
              type: 'modify',
              lineStart: i,
              lineEnd: i,
              content: lines[i].replace(change.from, change.to)
            });
            break;
          }
        }
      }
    }
  }

  // Rechercher et marquer les champs à supprimer
  if (fieldsRemoved.length > 0) {
    for (let i = classStartLine; i <= classEndLine; i++) {
      for (const field of fieldsRemoved) {
        if (lines[i].includes(`${field}:`) || 
            (lines[i].includes(field) && lines[i-1]?.includes('@ApiProperty'))) {
          
          // Si c'est une ligne avec @ApiProperty, supprimer aussi cette ligne
          if (lines[i].includes(field) && lines[i-1]?.includes('@ApiProperty')) {
            changes.push({
              type: 'remove',
              lineStart: i-1,
              lineEnd: i
            });
          } else {
            changes.push({
              type: 'remove',
              lineStart: i,
              lineEnd: i
            });
          }
        }
      }
    }
  }

  return { filePath, changes };
}

/**
 * Met à jour un fichier service NestJS avec les changements de schéma
 */
function updateServiceFile(filePath: string, modelName: string, fieldsAdded: string[], fieldsRemoved: string[]): CodeUpdate {
  const content = fs.readFileSync(filePath, 'utf8');
  const changes: CodeUpdate['changes'] = [];

  // Rechercher les méthodes de recherche qui utilisent select
  const selectRegex = /select\s*:\s*{[^}]*}/g;
  const selectMatches = content.match(selectRegex);

  if (selectMatches) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('select:') && lines[i].includes('{')) {
        let braceCount = (lines[i].match(/{/g) || []).length - (lines[i].match(/}/g) || []).length;
        let selectStartLine = i;
        let j = i;
        
        // Trouver la fin du bloc select
        while (braceCount > 0 && j < lines.length - 1) {
          j++;
          braceCount += (lines[j].match(/{/g) || []).length;
          braceCount -= (lines[j].match(/}/g) || []).length;
        }
        
        let selectEndLine = j;
        
        // Ajouter les nouveaux champs au bloc select
        if (fieldsAdded.length > 0) {
          let addContent = '';
          fieldsAdded.forEach(field => {
            if (!lines.slice(selectStartLine, selectEndLine + 1).some(line => line.includes(`${field}:`))) {
              addContent += `      ${field}: true,\n`;
            }
          });
          
          if (addContent) {
            const insertLine = selectEndLine;
            changes.push({
              type: 'add',
              lineStart: insertLine,
              content: addContent
            });
          }
        }
        
        // Rechercher les champs à supprimer du bloc select
        for (const field of fieldsRemoved) {
          for (let k = selectStartLine; k <= selectEndLine; k++) {
            if (lines[k].includes(`${field}:`)) {
              changes.push({
                type: 'remove',
                lineStart: k,
                lineEnd: k
              });
            }
          }
        }
      }
    }
  }

  return { filePath, changes };
}

/**
 * Met à jour un fichier loader/action Remix avec les changements de schéma
 */
function updateRemixFile(filePath: string, modelName: string, fieldsAdded: string[], fieldsRemoved: string[]): CodeUpdate {
  const content = fs.readFileSync(filePath, 'utf8');
  const changes: CodeUpdate['changes'] = [];
  const lines = content.split('\n');

  // Rechercher les requêtes prisma dans les loaders ou actions
  for (let i = 0; i < lines.length; i++) {
    // Détecter le début d'une requête prisma pour ce modèle
    if ((lines[i].includes('prisma.') && 
         lines[i].toLowerCase().includes(modelName.toLowerCase())) ||
        (lines[i].includes('db.') && 
         lines[i].toLowerCase().includes(modelName.toLowerCase()))) {
      
      // Chercher des blocs select ou include
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        if ((lines[j].includes('select:') || lines[j].includes('include:')) && lines[j].includes('{')) {
          let braceCount = (lines[j].match(/{/g) || []).length - (lines[j].match(/}/g) || []).length;
          let blockStartLine = j;
          let k = j;
          
          // Trouver la fin du bloc
          while (braceCount > 0 && k < lines.length - 1) {
            k++;
            braceCount += (lines[k].match(/{/g) || []).length;
            braceCount -= (lines[k].match(/}/g) || []).length;
          }
          
          let blockEndLine = k;
          
          // Ajouter les nouveaux champs
          if (fieldsAdded.length > 0) {
            let addContent = '';
            fieldsAdded.forEach(field => {
              if (!lines.slice(blockStartLine, blockEndLine + 1).some(line => line.includes(`${field}:`))) {
                addContent += `      ${field}: true,\n`;
              }
            });
            
            if (addContent) {
              changes.push({
                type: 'add',
                lineStart: blockEndLine,
                content: addContent
              });
            }
          }
          
          // Supprimer les champs retirés
          for (const field of fieldsRemoved) {
            for (let m = blockStartLine; m <= blockEndLine; m++) {
              if (lines[m].includes(`${field}:`)) {
                changes.push({
                  type: 'remove',
                  lineStart: m,
                  lineEnd: m
                });
              }
            }
          }
          
          // Avancer j pour éviter de traiter deux fois le même bloc
          j = blockEndLine;
        }
      }
    }
  }

  return { filePath, changes };
}

/**
 * Applique les modifications au fichier
 */
function applyChanges(update: CodeUpdate): void {
  if (update.changes.length === 0) {
    console.log(`Aucune modification nécessaire pour ${update.filePath}`);
    return;
  }

  // Créer une sauvegarde du fichier original
  const backupPath = `${update.filePath}${CONFIG.backupSuffix}`;
  fs.copyFileSync(update.filePath, backupPath);
  console.log(`Sauvegarde créée: ${backupPath}`);

  // Lire le contenu du fichier
  const content = fs.readFileSync(update.filePath, 'utf8');
  const lines = content.split('\n');

  // Trier les modifications par ligne (en ordre décroissant pour éviter les décalages)
  const sortedChanges = [...update.changes].sort((a, b) => b.lineStart - a.lineStart);

  // Appliquer les modifications
  for (const change of sortedChanges) {
    switch (change.type) {
      case 'add':
        // Insérer du contenu à une ligne spécifique
        lines.splice(change.lineStart, 0, change.content || '');
        break;
      case 'remove':
        // Supprimer des lignes
        const endLine = change.lineEnd || change.lineStart;
        lines.splice(change.lineStart, endLine - change.lineStart + 1);
        break;
      case 'modify':
        // Remplacer une ligne par une autre
        lines[change.lineStart] = change.content || '';
        break;
    }
  }

  // Écrire le contenu modifié dans le fichier
  fs.writeFileSync(update.filePath, lines.join('\n'));
  console.log(`✅ ${update.filePath} mis à jour avec ${update.changes.length} modifications`);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔄 Démarrage de la synchronisation du schéma Prisma avec le code...');
  
  // Vérifier si le fichier de différences existe
  if (!fs.existsSync(CONFIG.schemaDiffPath)) {
    console.error(`❌ Fichier de différences non trouvé: ${CONFIG.schemaDiffPath}`);
    console.error('Exécutez d\'abord prisma-pg-sync.sh --analyze-only pour générer les différences');
    process.exit(1);
  }
  
  // Lire les différences de schéma
  const schemaDiff = readSchemaDiff();
  
  console.log('\n📊 Résumé des modifications à appliquer au code:');
  console.log(`- Modèles ajoutés: ${schemaDiff.summary.modelsAdded.length}`);
  console.log(`- Modèles supprimés: ${schemaDiff.summary.modelsRemoved.length}`);
  console.log(`- Modèles avec champs ajoutés: ${Object.keys(schemaDiff.summary.fieldsAdded).length}`);
  console.log(`- Modèles avec champs supprimés: ${Object.keys(schemaDiff.summary.fieldsRemoved).length}`);
  console.log(`- Modèles avec types de champs modifiés: ${Object.keys(schemaDiff.summary.fieldsTypeChanged).length}`);
  console.log(`- Relations modifiées: ${Object.keys(schemaDiff.summary.relationsChanged).length}`);
  
  // Suivre toutes les mises à jour
  const updates: CodeUpdate[] = [];
  
  // Traiter les modèles modifiés
  for (const modelName of [
    ...Object.keys(schemaDiff.summary.fieldsAdded),
    ...Object.keys(schemaDiff.summary.fieldsRemoved),
    ...Object.keys(schemaDiff.summary.fieldsTypeChanged)
  ]) {
    console.log(`\n🔍 Traitement du modèle: ${modelName}`);
    
    // Trouver les fichiers DTOs associés à ce modèle
    const dtoFiles = findDtoFiles(modelName);
    console.log(`- DTOs trouvés: ${dtoFiles.length}`);
    
    for (const dtoFile of dtoFiles) {
      const fieldsAdded = schemaDiff.summary.fieldsAdded[modelName] || [];
      const fieldsRemoved = schemaDiff.summary.fieldsRemoved[modelName] || [];
      const fieldsTypeChanged = schemaDiff.summary.fieldsTypeChanged[modelName] || {};
      
      const dtoUpdate = updateDtoFile(dtoFile, fieldsAdded, fieldsRemoved, fieldsTypeChanged);
      if (dtoUpdate.changes.length > 0) {
        updates.push(dtoUpdate);
      }
    }
    
    // Trouver les fichiers de services associés à ce modèle
    const serviceFiles = findServiceFiles(modelName);
    console.log(`- Services trouvés: ${serviceFiles.length}`);
    
    for (const serviceFile of serviceFiles) {
      const fieldsAdded = schemaDiff.summary.fieldsAdded[modelName] || [];
      const fieldsRemoved = schemaDiff.summary.fieldsRemoved[modelName] || [];
      
      const serviceUpdate = updateServiceFile(serviceFile, modelName, fieldsAdded, fieldsRemoved);
      if (serviceUpdate.changes.length > 0) {
        updates.push(serviceUpdate);
      }
    }
    
    // Trouver les fichiers Remix associés à ce modèle
    const remixFiles = findRemixFiles(modelName);
    console.log(`- Fichiers Remix trouvés: ${remixFiles.length}`);
    
    for (const remixFile of remixFiles) {
      const fieldsAdded = schemaDiff.summary.fieldsAdded[modelName] || [];
      const fieldsRemoved = schemaDiff.summary.fieldsRemoved[modelName] || [];
      
      const remixUpdate = updateRemixFile(remixFile, modelName, fieldsAdded, fieldsRemoved);
      if (remixUpdate.changes.length > 0) {
        updates.push(remixUpdate);
      }
    }
  }
  
  // Appliquer toutes les mises à jour
  console.log(`\n✏️ Application de ${updates.length} mises à jour au code...`);
  
  for (const update of updates) {
    applyChanges(update);
  }
  
  console.log('\n✅ Synchronisation du schéma Prisma avec le code terminée avec succès!');
  
  // Proposer des prochaines étapes
  console.log('\n📝 Prochaines étapes recommandées:');
  console.log('1. Vérifiez les modifications apportées aux fichiers');
  console.log('2. Exécutez les tests unitaires pour vérifier que tout fonctionne correctement');
  console.log('3. Si nécessaire, effectuez des ajustements manuels aux fichiers modifiés');
  console.log('4. Exécutez `npx prisma generate` pour mettre à jour le client Prisma');
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('❌ Erreur lors de la synchronisation:', error);
  process.exit(1);
});