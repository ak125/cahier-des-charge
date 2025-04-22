import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { table } from 'table';

interface BacklogItem {
  priority: number;
  status: 'pending' | 'done' | 'invalid' | 'in-progress';
  path: string;
  dependencies: string[];
  metadata: {
    routeType: string;
    isCritical: boolean;
    hasDatabase: boolean;
    hasAuthentication: boolean;
  };
}

interface Backlog {
  [key: string]: BacklogItem;
}

export async function audit(statusFilter?: string): Promise<void> {
  try {
    // Vérifier si le fichier backlogDoDotmcp.json existe
    const backlogPath = path.resolve(process.cwd(), 'backlogDoDotmcp.json');
    
    if (!await fs.pathExists(backlogPath)) {
      console.error(chalk.red(`❌ Fichier backlogDoDotmcp.json introuvable. Exécutez d'abord la commande de génération de backlog.`));
      return;
    }
    
    const backlogData = await fs.readFile(backlogPath, 'utf8');
    const backlog: Backlog = JSON.parse(backlogData);
    
    // Filtrage selon le statut si spécifié
    const filteredFiles = Object.entries(backlog).filter(([_, item]) => {
      if (!statusFilter) return true;
      return item.status === statusFilter;
    });
    
    if (filteredFiles.length === 0) {
      console.log(chalk.yellow(`ℹ️ Aucun fichier trouvé ${statusFilter ? `avec le statut '${statusFilter}'` : ''}.`));
      return;
    }
    
    // Tri par priorité (décroissante)
    filteredFiles.sort(([_, a], [__, b]) => b.priority - a.priority);
    
    // Préparation du tableau pour l'affichage
    const tableData = [
      ['Fichier', 'Priorité', 'Statut', 'Type', 'Critique', 'Dépendances'].map(header => chalk.bold(header))
    ];
    
    filteredFiles.forEach(([fileName, item]) => {
      const statusColor = {
        'pending': chalk.yellow,
        'done': chalk.green,
        'invalid': chalk.red,
        'in-progress': chalk.blue
      }[item.status] || chalk.white;
      
      tableData.push([
        fileName,
        item.priority.toString(),
        statusColor(item.status),
        item.metadata.routeType,
        item.metadata.isCritical ? '✓' : '✗',
        item.dependencies.join(', ') || 'aucune'
      ]);
    });
    
    // Affichage du tableau
    console.log(chalk.blue(`📋 Liste des fichiers ${statusFilter ? `avec le statut '${statusFilter}'` : ''} (triés par priorité):`));
    console.log(table(tableData));
    
    // Affichage des statistiques
    const stats = {
      total: Object.keys(backlog).length,
      done: Object.values(backlog).filter(item => item.status === 'done').length,
      pending: Object.values(backlog).filter(item => item.status === 'pending').length,
      invalid: Object.values(backlog).filter(item => item.status === 'invalid').length,
      inProgress: Object.values(backlog).filter(item => item.status === 'in-progress').length
    };
    
    console.log(chalk.blue('📊 Statistiques de migration:'));
    console.log(`📁 Total: ${stats.total} fichiers`);
    console.log(`✅ Terminés: ${stats.done} (${Math.round(stats.done / stats.total * 100)}%)`);
    console.log(`⏳ En attente: ${stats.pending} (${Math.round(stats.pending / stats.total * 100)}%)`);
    console.log(`🔄 En cours: ${stats.inProgress} (${Math.round(stats.inProgress / stats.total * 100)}%)`);
    console.log(`❌ Invalides: ${stats.invalid} (${Math.round(stats.invalid / stats.total * 100)}%)`);
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur:`, error));
  }
}