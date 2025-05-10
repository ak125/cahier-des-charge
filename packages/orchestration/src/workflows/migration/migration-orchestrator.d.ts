#!/usr/bin/env node
/**
 * Script principal d'orchestration de la migration
 *
 * Ce script sert de point d'entrée principal pour le processus
 * complet de migration. Il intègre tous les agents et outils
 * en un seul workflow cohérent.
 */
/**
 * Charge la configuration depuis le fichier de config
 */
declare function loadConfig(configPath?: string): Record<string, any>;
/**
 * Analyse un fichier PHP et génère les rapports d'audit
 */
declare function auditPhpFile(filePath: string, options: any): Promise<void>;
/**
 * Analyse un dossier contenant des fichiers PHP
 */
declare function auditPhpDirectory(dirPath: string, options: any): Promise<void>;
/**
 * Trouve tous les fichiers PHP dans un dossier
 */
declare function findPhpFiles(dirPath: string, recursive?: boolean): Promise<string[]>;
/**
 * Affiche un résumé du cahier des charges
 */
declare function displayCahierDeCharges(options: any): void;
export { auditPhpFile, auditPhpDirectory, findPhpFiles, displayCahierDeCharges, loadConfig };
//# sourceMappingURL=migration-orchestrator.d.ts.map