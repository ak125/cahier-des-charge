/**
 * Index des activités Temporal pour le Pipeline de Migration IA
 * 
 * Ce fichier exporte toutes les activités des différents modules
 * pour faciliter leur importation dans le worker
 */

// Exporter les activités PHP Analyzer
export * from './php-analyzer-activities';

// Exporter les activités Code Generator
export * from './code-generator-activities';

// Exporter les activités Documentation Updater
export * from './docs-updater-activities';