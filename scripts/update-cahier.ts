import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

// Charger la configuration
async function getConfig() {
  const configPath = path.resolve('./cahier_check.config.json');
  const configData = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(configData);
}

// Exécute la mise à jour du cahier des charges
async function updateCahier(): Promise<void> {
  console.log(chalk.blue('🔄 Démarrage de la mise à jour du cahier des charges...'));
  
  try {
    const config = await getConfig();
    const cahierPath = path.resolve(config.paths.cahier);
    
    // 1. Mettre à jour le discovery_map.json si présent
    const discoveryMapPath = path.join(cahierPath, 'discovery_map.json');
    
    try {
      console.log(chalk.blue('📊 Mise à jour de la discovery map...'));
      await updateDiscoveryMap(discoveryMapPath);
      console.log(chalk.green('✅ Discovery map mise à jour avec succès'));
    } catch (error) {
      console.error(chalk.yellow(`⚠️ Erreur lors de la mise à jour de discovery_map.json: ${error.message}`));
    }
    
    // 2. Synchroniser les fichiers d'audit
    console.log(chalk.blue('📝 Synchronisation des fichiers d\'audit...'));
    await synchronizeAuditFiles(cahierPath);
    
    // 3. Mettre à jour les backlogs basés sur les audits
    console.log(chalk.blue('📋 Mise à jour des backlogs...'));
    await updateBacklogs(cahierPath);
    
    // 4. Regénérer les graphes d'impact manquants
    console.log(chalk.blue('📊 Vérification des graphes d\'impact...'));
    await updateImpactGraphs(cahierPath);
    
    // 5. Mettre à jour le fichier de sommaire
    console.log(chalk.blue('📚 Mise à jour du sommaire...'));
    await updateSummary(cahierPath);
    
    console.log(chalk.green('✅ Mise à jour du cahier des charges terminée avec succès!'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la mise à jour du cahier: ${error.message}`));
    process.exit(1);
  }
}

// Met à jour le fichier discovery_map.json
async function updateDiscoveryMap(discoveryMapPath: string): Promise<void> {
  if (!fs.access(discoveryMapPath).catch(() => false)) {
    console.log(chalk.yellow('⚠️ Fichier discovery_map.json non trouvé, création...'));
    
    // Créer un fichier vide
    await fs.writeFile(discoveryMapPath, '[]', 'utf-8');
  }
  
  // Charger le fichier existant
  const mapData = JSON.parse(await fs.readFile(discoveryMapPath, 'utf-8'));
  
  // Mettre à jour les statuts basés sur les fichiers existants
  const cahierDir = path.dirname(discoveryMapPath);
  
  for (const item of mapData) {
    // Vérifier si l'audit existe
    const auditPath = path.join(cahierDir, `${item.id}.audit.md`);
    const backlogPath = path.join(cahierDir, `${item.id}.backlog.json`);
    const impactGraphPath = path.join(cahierDir, `${item.id}.impact_graph.json`);
    
    const hasAudit = await fs.access(auditPath).then(() => true).catch(() => false);
    const hasBacklog = await fs.access(backlogPath).then(() => true).catch(() => false);
    const hasImpactGraph = await fs.access(impactGraphPath).then(() => true).catch(() => false);
    
    // Mettre à jour le statut
    if (hasAudit && hasBacklog && hasImpactGraph) {
      if (item.status === 'discovered') {
        item.status = 'audited';
      }
    } else if (item.status === 'audited') {
      // Rétrograder si des fichiers sont manquants
      item.status = 'discovered';
    }
  }
  
  // Écrire le fichier mis à jour
  await fs.writeFile(discoveryMapPath, JSON.stringify(mapData, null, 2), 'utf-8');
}

// Synchronise les fichiers d'audit
async function synchronizeAuditFiles(cahierPath: string): Promise<void> {
  try {
    // Rechercher tous les fichiers d'audit
    const files = await fs.readdir(cahierPath);
    const auditFiles = files.filter(file => file.endsWith('.audit.md'));
    
    console.log(`📄 Trouvé ${auditFiles.length} fichiers d'audit à synchroniser`);
    
    if (auditFiles.length === 0) {
      console.log('Aucun fichier d\'audit trouvé. Création d\'un exemple...');
      
      // Créer un fichier d'audit d'exemple
      const exampleContent = `# Exemple de fichier d'audit

## 1️⃣ Rôle métier principal

Ce fichier sert d'exemple pour la structure d'un fichier d'audit.

## 2️⃣ Points d'entrée / déclenchement

Fichier accessible via un appel direct.

## 3️⃣ Zone fonctionnelle détectée

Documentation / Exemples`;
      
      await fs.writeFile(path.join(cahierPath, 'exemple.php.audit.md'), exampleContent, 'utf8');
      console.log('✅ Fichier d\'exemple créé');
    }
    
    for (const auditFile of auditFiles) {
      const filePath = path.join(cahierPath, auditFile);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Vérifier si le contenu est complet (a toutes les sections requises)
      const requiredSections = [
        /#+\s+.*[Rr]ôle.*métier/,
        /#+\s+.*[Ss]tructure/,
        /#+\s+.*[Zz]one.*fonctionnelle/
      ];
      
      const missingSections = requiredSections.filter(regex => !regex.test(content));
      
      if (missingSections.length > 0) {
        console.log(chalk.yellow(`⚠️ Sections manquantes dans ${auditFile}, tentative de complétion...`));
        
        try {
          // Exécuter l'agent d'audit pour compléter le fichier
          execSync(`ts-node scripts/full-audit.ts --file="${filePath}" --sections-only`);
          console.log(chalk.green(`✅ ${auditFile} complété avec succès`));
        } catch (error) {
          console.error(chalk.yellow(`⚠️ Impossible de compléter ${auditFile}: ${error.message}`));
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la synchronisation des fichiers d'audit: ${error.message}`);
  }
}

// Met à jour les backlogs basés sur les audits
async function updateBacklogs(cahierPath: string): Promise<void> {
  // Rechercher tous les fichiers d'audit
  const auditFiles = await fs.readdir(cahierPath)
    .then(files => files.filter(file => file.endsWith('.audit.md')));
  
  for (const auditFile of auditFiles) {
    const baseFileName = auditFile.replace('.audit.md', '');
    const backlogPath = path.join(cahierPath, `${baseFileName}.backlog.json`);
    
    // Vérifier si le backlog existe
    const backlogExists = await fs.access(backlogPath).then(() => true).catch(() => false);
    
    if (!backlogExists) {
      console.log(chalk.yellow(`⚠️ Backlog manquant pour ${auditFile}, création...`));
      
      try {
        // Exécuter l'agent de backlog pour créer le fichier
        execSync(`ts-node scripts/full-audit.ts --file="${path.join(cahierPath, auditFile)}" --backlog-only`);
        console.log(chalk.green(`✅ Backlog créé pour ${auditFile}`));
      } catch (error) {
        console.error(chalk.yellow(`⚠️ Impossible de créer le backlog pour ${auditFile}: ${error.message}`));
      }
    } else {
      // Mise à jour du backlog existant si nécessaire
      const auditContent = await fs.readFile(path.join(cahierPath, auditFile), 'utf-8');
      const backlogContent = await fs.readFile(backlogPath, 'utf-8');
      
      try {
        const backlog = JSON.parse(backlogContent);
        
        // Vérifier si des tâches sont manquantes
        if (backlog.tasks.length < 3) {
          console.log(chalk.yellow(`⚠️ Peu de tâches dans le backlog pour ${auditFile}, mise à jour...`));
          
          try {
            // Exécuter l'agent de backlog pour mettre à jour le fichier
            execSync(`ts-node scripts/full-audit.ts --file="${path.join(cahierPath, auditFile)}" --update-backlog`);
            console.log(chalk.green(`✅ Backlog mis à jour pour ${auditFile}`));
          } catch (error) {
            console.error(chalk.yellow(`⚠️ Impossible de mettre à jour le backlog pour ${auditFile}: ${error.message}`));
          }
        }
      } catch (error) {
        console.error(chalk.yellow(`⚠️ Erreur de parsing JSON pour ${backlogPath}: ${error.message}`));
      }
    }
  }
}

// Met à jour les graphes d'impact
async function updateImpactGraphs(cahierPath: string): Promise<void> {
  // Rechercher tous les fichiers d'audit
  const auditFiles = await fs.readdir(cahierPath)
    .then(files => files.filter(file => file.endsWith('.audit.md')));
  
  for (const auditFile of auditFiles) {
    const baseFileName = auditFile.replace('.audit.md', '');
    const impactGraphPath = path.join(cahierPath, `${baseFileName}.impact_graph.json`);
    
    // Vérifier si le graphe d'impact existe
    const graphExists = await fs.access(impactGraphPath).then(() => true).catch(() => false);
    
    if (!graphExists) {
      console.log(chalk.yellow(`⚠️ Graphe d'impact manquant pour ${auditFile}, création...`));
      
      try {
        // Exécuter l'agent d'impact pour créer le fichier
        execSync(`ts-node scripts/full-audit.ts --file="${path.join(cahierPath, auditFile)}" --impact-only`);
        console.log(chalk.green(`✅ Graphe d'impact créé pour ${auditFile}`));
      } catch (error) {
        console.error(chalk.yellow(`⚠️ Impossible de créer le graphe d'impact pour ${auditFile}: ${error.message}`));
      }
    }
  }
}

// Met à jour le fichier de sommaire
async function updateSummary(cahierPath: string): Promise<void> {
  // Rechercher le fichier de sommaire
  const summaryFile = await fs.readdir(cahierPath)
    .then(files => files.find(file => 
      file === '00-sommaire.md' || 
      file === 'README.md' || 
      file === 'sommaire.md'
    ));
  
  if (!summaryFile) {
    console.log(chalk.yellow('⚠️ Fichier de sommaire non trouvé, création...'));
    
    try {
      // Créer un fichier de sommaire basique
      const summaryContent = await generateSummary(cahierPath);
      await fs.writeFile(path.join(cahierPath, '00-sommaire.md'), summaryContent, 'utf-8');
      console.log(chalk.green('✅ Fichier de sommaire créé avec succès'));
    } catch (error) {
      console.error(chalk.yellow(`⚠️ Impossible de créer le fichier de sommaire: ${error.message}`));
    }
  } else {
    // Mettre à jour le sommaire existant
    const summaryPath = path.join(cahierPath, summaryFile);
    let summaryContent = await fs.readFile(summaryPath, 'utf-8');
    
    // Lister tous les fichiers .md (hors .audit.md)
    const mdFiles = await fs.readdir(cahierPath)
      .then(files => files.filter(file => 
        file.endsWith('.md') && 
        !file.includes('.audit.md') && 
        file !== summaryFile
      ));
    
    // Vérifier quels fichiers ne sont pas référencés
    const missingFiles = [];
    
    for (const mdFile of mdFiles) {
      if (!summaryContent.includes(mdFile)) {
        missingFiles.push(mdFile);
      }
    }
    
    if (missingFiles.length > 0) {
      console.log(chalk.yellow(`⚠️ ${missingFiles.length} fichiers non référencés dans le sommaire, mise à jour...`));
      
      // Ajouter les fichiers manquants à la fin du sommaire
      summaryContent += '\n\n## Fichiers supplémentaires\n\n';
      
      for (const file of missingFiles) {
        summaryContent += `- [${file.replace('.md', '')}](./${file})\n`;
      }
      
      await fs.writeFile(summaryPath, summaryContent, 'utf-8');
      console.log(chalk.green('✅ Sommaire mis à jour avec succès'));
    }
  }
}

// Génère un fichier de sommaire basique
async function generateSummary(cahierPath: string): Promise<string> {
  // Lister tous les fichiers .md (hors .audit.md)
  const mdFiles = await fs.readdir(cahierPath)
    .then(files => files.filter(file => 
      file.endsWith('.md') && 
      !file.includes('.audit.md')
    ).sort());
  
  let summaryContent = `# 📚 Sommaire du Cahier des Charges\n\n`;
  summaryContent += `## Vue d'ensemble du projet\n\n`;
  summaryContent += `Ce cahier des charges présente l'ensemble du processus de migration automatisée assistée par IA.\n\n`;
  summaryContent += `## Structure des chapitres\n\n`;
  
  // Regrouper les fichiers par préfixe numérique
  const groupedFiles = {};
  
  for (const file of mdFiles) {
    const match = file.match(/^(\d+)-/);
    const group = match ? match[1] : 'autres';
    
    if (!groupedFiles[group]) {
      groupedFiles[group] = [];
    }
    
    groupedFiles[group].push(file);
  }
  
  // Ajouter les fichiers par groupe
  for (const [group, files] of Object.entries(groupedFiles)) {
    if (group !== 'autres') {
      summaryContent += `### ${group}. ${group === '0' ? 'Introduction' : `Chapitre ${group}`}\n\n`;
      
      for (const file of files) {
        const title = file.replace(/^\d+-/, '').replace('.md', '');
        summaryContent += `- [${title}](./${file})\n`;
      }
      
      summaryContent += '\n';
    }
  }
  
  // Ajouter les autres fichiers
  if (groupedFiles['autres'] && groupedFiles['autres'].length > 0) {
    summaryContent += `### Autres documents\n\n`;
    
    for (const file of groupedFiles['autres']) {
      const title = file.replace('.md', '');
      summaryContent += `- [${title}](./${file})\n`;
    }
  }
  
  return summaryContent;
}

export default updateCahier;

// Exécuter si appelé directement
if (require.main === module) {
  updateCahier().catch(error => {
    console.error(`Erreur lors de la mise à jour: ${error.message}`);
    process.exit(1);
  });
}
