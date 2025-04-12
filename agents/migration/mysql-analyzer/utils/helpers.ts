/**
 * helpers.ts
 * 
 * Fonctions utilitaires pour l'analyseur MySQL
 */

import * as fs from 'fs';
import * as path from 'path';
import { MySQLSchema, TableInfo, TableType } from '../models/schema';

/**
 * Enregistre un objet au format JSON dans un fichier
 */
export function saveToJson(filePath: string, data: any): void {
  const dirPath = path.dirname(filePath);
  ensureDirectoryExists(dirPath);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Enregistre un contenu au format Markdown dans un fichier
 */
export function saveToMarkdown(filePath: string, content: string): void {
  const dirPath = path.dirname(filePath);
  ensureDirectoryExists(dirPath);
  
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * S'assure qu'un répertoire existe, le crée si nécessaire
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Valide un schéma MySQL pour détecter d'éventuelles incohérences
 */
export function validateSchema(schema: MySQLSchema): string[] {
  const errors: string[] = [];
  
  // Vérifier si le schéma est vide
  if (!schema.tables || Object.keys(schema.tables).length === 0) {
    errors.push('Le schéma ne contient aucune table.');
    return errors;
  }
  
  // Vérifier chaque table
  Object.entries(schema.tables).forEach(([tableName, table]) => {
    // Vérifier si la table a des colonnes
    if (!table.columns || Object.keys(table.columns).length === 0) {
      errors.push(`La table '${tableName}' ne contient aucune colonne.`);
    }
    
    // Vérifier les références des clés étrangères
    table.foreignKeys.forEach(fk => {
      if (!schema.tables[fk.referencedTable]) {
        errors.push(`La clé étrangère '${fk.name}' de la table '${tableName}' référence une table inexistante '${fk.referencedTable}'.`);
      } else {
        // Vérifier que les colonnes référencées existent
        fk.referencedColumns.forEach(column => {
          if (!schema.tables[fk.referencedTable].columns[column]) {
            errors.push(`La clé étrangère '${fk.name}' de la table '${tableName}' référence une colonne inexistante '${column}' dans la table '${fk.referencedTable}'.`);
          }
        });
      }
    });
  });
  
  return errors;
}

/**
 * Calcule un score de qualité pour une table
 */
export function calculateTableScore(table: TableInfo, issues: any[]): { score: number; details: string } {
  // Score initial (sur 5)
  let score = 5;
  let details = '';
  const tableIssues = issues.filter(issue => issue.tableName === table.name);
  
  // Pénalité pour l'absence de clé primaire (-2)
  if (!table.primaryKey) {
    score -= 2;
    details += 'Pas de clé primaire. ';
  }
  
  // Pénalité pour l'absence de commentaire (-0.5)
  if (!table.comment || table.comment.trim() === '') {
    score -= 0.5;
    details += 'Documentation manquante. ';
  }
  
  // Pénalité pour les problèmes high severity (-1 par problème)
  const highSeverityIssues = tableIssues.filter(i => i.severity === 'high');
  if (highSeverityIssues.length > 0) {
    score -= Math.min(2, highSeverityIssues.length);
    details += `${highSeverityIssues.length} problème(s) critiques. `;
  }
  
  // Pénalité pour les problèmes medium severity (-0.5 par problème)
  const mediumSeverityIssues = tableIssues.filter(i => i.severity === 'medium');
  if (mediumSeverityIssues.length > 0) {
    score -= Math.min(1.5, mediumSeverityIssues.length * 0.5);
    details += `${mediumSeverityIssues.length} problème(s) moyens. `;
  }
  
  // Bonus pour les bonnes pratiques
  // Colonnes d'audit (created_at, updated_at)
  const hasAuditColumns = Object.keys(table.columns).some(col => 
    ['created_at', 'updated_at', 'created_by', 'updated_by'].includes(col.toLowerCase())
  );
  if (hasAuditColumns) {
    score += 0.5;
    details += 'Colonnes d\'audit présentes. ';
  }
  
  // Index sur les clés étrangères
  const fkWithIndex = table.foreignKeys.filter(fk => 
    table.indexes.some(idx => 
      idx.columns.length === fk.columns.length && 
      fk.columns.every(col => idx.columns.includes(col))
    )
  );
  if (fkWithIndex.length > 0 && fkWithIndex.length === table.foreignKeys.length) {
    score += 0.5;
    details += 'Toutes les FK ont des index. ';
  }
  
  // Limiter le score entre 1 et 5
  score = Math.max(1, Math.min(5, score));
  
  // Si pas de détails, ajouter un message par défaut
  if (details === '') {
    if (score >= 4) {
      details = 'Bonne structure.';
    } else if (score >= 3) {
      details = 'Structure correcte avec quelques améliorations possibles.';
    } else {
      details = 'Structure à améliorer.';
    }
  } else if (details.endsWith('. ')) {
    details = details.slice(0, -1);
  }
  
  return { score, details };
}

/**
 * Affiche un message coloré dans la console
 */
export function printColoredMessage(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
  const colors = {
    info: '\x1b[36m%s\x1b[0m',     // Cyan
    success: '\x1b[32m%s\x1b[0m',  // Vert
    warning: '\x1b[33m%s\x1b[0m',  // Jaune
    error: '\x1b[31m%s\x1b[0m'     // Rouge
  };
  
  console.log(colors[type], message);
}