import fs from fsstructure-agent';
import path from pathstructure-agent';
import { auditHistoryManager } from ./audit-history-managerstructure-agent';

/**
 * Interface pour les options de création de lien
 */
interface SourceTargetLinkOptions {
  // Métadonnées pour enrichir le lien
  metadata?: {
    componentType?: 'controller' | 'service' | 'entity' | 'component' | 'route' | 'other';
    complexity?: number;
    author?: string;
    completionDate?: Date;
    description?: string;
    tags?: string[];
  };
  
  // Indique si le lien doit être ajouté aux fichiers générés comme commentaire
  addCommentToTargetFile?: boolean;
  
  // Format du commentaire à ajouter (utilise ${sourceFile} et ${targetFile} comme variables)
  commentTemplate?: string;
}

/**
 * Interface pour une carte de migration
 */
interface MigrationMap {
  auditId: string;
  sourceDirectory: string;
  targetDirectory: string;
  mappings: {
    id: string;
    sourceFile: string;
    targetFile: string;
    componentType: string;
    migrationStatus: string;
    metadata?: Record<string, any>;
  }[];
  generated: string; // Date ISO
}

/**
 * Classe pour gérer les liens entre fichiers sources PHP et composants générés
 */
export class SourceTargetLinker {
  private readonly DEFAULT_COMMENT_TEMPLATE = `/**
 * Généré à partir du fichier source: \${sourceFile}
 * Date de génération: \${date}
 * NE PAS MODIFIER DIRECTEMENT - Utiliser les outils de migration
 */`;

  /**
   * Établit un lien entre un fichier source PHP et un composant généré
   */
  async createSourceTargetLink(
    auditId: string,
    sourceFile: string,
    targetFile: string,
    options: SourceTargetLinkOptions = {}
  ): Promise<string | null> {
    try {
      // Vérifier que les fichiers existent
      if (!fs.existsSync(sourceFile)) {
        throw new Error(`Le fichier source n'existe pas: ${sourceFile}`);
      }

      const componentType = options.metadata?.componentType || this.inferComponentType(targetFile);
      
      // Enregistrer le mapping dans Supabase
      const mappingId = await auditHistoryManager.saveFileMapping(
        auditId,
        sourceFile,
        targetFile,
        componentType,
        'pending'
      );

      if (!mappingId) {
        throw new Error('Échec de l\'enregistrement du mapping dans Supabase');
      }

      // Si le fichier cible existe et que l'option est activée, ajouter un commentaire
      if (options.addCommentToTargetFile !== false && fs.existsSync(targetFile)) {
        await this.addCommentToFile(sourceFile, targetFile, options.commentTemplate);
      }

      console.log(`✅ Lien créé entre ${path.basename(sourceFile)} → ${path.basename(targetFile)}`);
      return mappingId;
    } catch (err) {
      console.error('❌ Erreur lors de la création du lien source-cible:', err);
      return null;
    }
  }

  /**
   * Ajoute un commentaire au début du fichier cible pour référencer le fichier source
   */
  private async addCommentToFile(
    sourceFile: string,
    targetFile: string,
    commentTemplate?: string
  ): Promise<void> {
    try {
      // Obtenir le contenu du fichier
      const content = fs.readFileSync(targetFile, 'utf-8');
      
      // Générer le commentaire
      const date = new Date().toISOString();
      const comment = (commentTemplate || this.DEFAULT_COMMENT_TEMPLATE)
        .replace(/\${sourceFile}/g, path.relative(path.dirname(targetFile), sourceFile))
        .replace(/\${date}/g, date);

      // Vérifier si le commentaire existe déjà
      if (content.includes('Généré à partir du fichier source:')) {
        // Le fichier contient déjà un commentaire de génération, ne pas modifier
        return;
      }

      // Préparer le nouveau contenu avec le commentaire
      let newContent = '';
      
      // Ajouter le commentaire selon le type de fichier
      const ext = path.extname(targetFile).toLowerCase();
      
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        // Fichiers JavaScript/TypeScript
        newContent = `${comment}\n\n${content}`;
      } else if (['.php'].includes(ext)) {
        // Fichiers PHP
        if (content.startsWith('<?php')) {
          // Insérer après la balise PHP
          newContent = `<?php\n${comment}\n\n${content.substring(5)}`;
        } else {
          newContent = `${comment}\n\n${content}`;
        }
      } else if (['.html', '.vue'].includes(ext)) {
        // Fichiers HTML/Vue
        newContent = `<!-- ${comment.replace(/\*\//g, '').replace(/\/\*\*/g, '')} -->\n\n${content}`;
      } else {
        // Autres types de fichiers
        newContent = `${comment}\n\n${content}`;
      }

      // Écrire le contenu mis à jour
      fs.writeFileSync(targetFile, newContent);
    } catch (err) {
      console.error(`❌ Erreur lors de l'ajout du commentaire à ${targetFile}:`, err);
      throw err;
    }
  }

  /**
   * Infère le type de composant à partir du nom de fichier et de son contenu
   */
  private inferComponentType(
    targetFile: string
  ): 'controller' | 'service' | 'entity' | 'component' | 'route' | 'other' {
    try {
      const fileName = path.basename(targetFile).toLowerCase();
      const ext = path.extname(targetFile).toLowerCase();
      
      // Si le fichier existe, analyser son contenu
      if (fs.existsSync(targetFile)) {
        const content = fs.readFileSync(targetFile, 'utf-8');
        
        // Vérifier les patterns de code spécifiques
        if (content.includes('@Controller') || fileName.includes('controller')) {
          return 'controller';
        }
        
        if (content.includes('@Injectable') || fileName.includes('service')) {
          return 'service';
        }
        
        if (content.includes('@Entity') || fileName.includes('entity')) {
          return 'entity';
        }
        
        if (content.includes('React.') || content.includes('function') && content.includes('return')) {
          return 'component';
        }
        
        if (content.includes('export const loader') || fileName.includes('route')) {
          return 'route';
        }
      }
      
      // Sinon, déduire à partir du nom de fichier
      if (fileName.includes('controller')) {
        return 'controller';
      }
      
      if (fileName.includes('service')) {
        return 'service';
      }
      
      if (fileName.includes('entity')) {
        return 'entity';
      }
      
      if (fileName.includes('component') || ext === '.tsx' || ext === '.jsx') {
        return 'component';
      }
      
      if (fileName.includes('route') || fileName.includes('loader')) {
        return 'route';
      }
      
      return 'other';
    } catch (err) {
      console.warn(`⚠️ Impossible d'inférer le type de composant pour ${targetFile}:`, err);
      return 'other';
    }
  }

  /**
   * Génère une carte de migration pour visualiser les liens entre fichiers
   */
  async generateMigrationMap(
    auditId: string,
    outputPath?: string
  ): Promise<MigrationMap | null> {
    try {
      // Récupérer l'audit
      const audit = await auditHistoryManager.getAuditReport(auditId);
      if (!audit) {
        throw new Error(`Audit non trouvé avec l'ID: ${auditId}`);
      }

      // Récupérer les mappings pour cet audit
      const mappings = await auditHistoryManager.getFileMappings(auditId);
      if (!mappings || mappings.length === 0) {
        console.warn(`⚠️ Aucun mapping trouvé pour l'audit ${auditId}`);
      }

      // Créer la carte de migration
      const migrationMap: MigrationMap = {
        auditId,
        sourceDirectory: audit.source_dir,
        targetDirectory: this.inferTargetDirectory(mappings),
        mappings: mappings.map(mapping => ({
          id: mapping.id,
          sourceFile: mapping.source_file,
          targetFile: mapping.target_file,
          componentType: mapping.component_type,
          migrationStatus: mapping.migration_status,
          metadata: {} // À enrichir si nécessaire
        })),
        generated: new Date().toISOString()
      };

      // Écrire dans un fichier si demandé
      if (outputPath) {
        fs.writeFileSync(
          outputPath,
          JSON.stringify(migrationMap, null, 2),
          'utf-8'
        );
        console.log(`✅ Carte de migration générée: ${outputPath}`);
      }

      return migrationMap;
    } catch (err) {
      console.error('❌ Erreur lors de la génération de la carte de migration:', err);
      return null;
    }
  }

  /**
   * Infère le répertoire cible à partir des mappings
   */
  private inferTargetDirectory(mappings: any[]): string {
    if (!mappings || mappings.length === 0) {
      return 'Non déterminé';
    }

    // Trouver le chemin commun le plus long
    const targetPaths = mappings
      .map(mapping => mapping.target_file)
      .filter(Boolean)
      .map(file => path.dirname(file));

    if (targetPaths.length === 0) {
      return 'Non déterminé';
    }

    let commonPath = targetPaths[0];
    for (let i = 1; i < targetPaths.length; i++) {
      commonPath = this.findCommonPath(commonPath, targetPaths[i]);
    }

    return commonPath || 'Non déterminé';
  }

  /**
   * Trouve le chemin commun entre deux chemins
   */
  private findCommonPath(path1: string, path2: string): string {
    const parts1 = path1.split(path.sep);
    const parts2 = path2.split(path.sep);
    const commonParts = [];

    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
      if (parts1[i] === parts2[i]) {
        commonParts.push(parts1[i]);
      } else {
        break;
      }
    }

    return commonParts.join(path.sep);
  }

  /**
   * Génère un composant React/Remix pour visualiser les mappings
   */
  async generateMappingVisualization(
    auditId: string,
    outputPath: string
  ): Promise<string | null> {
    try {
      // Générer la carte de migration
      const migrationMap = await this.generateMigrationMap(auditId);
      if (!migrationMap) {
        throw new Error('Échec de la génération de la carte de migration');
      }

      // Créer le contenu du fichier TSX
      const content = `/**
 * MigrationMapView.tsx
 * Visualisation des mappings de fichiers pour l'audit ${auditId}
 * Généré automatiquement le ${new Date().toISOString()}
 */
import React, { useState, useEffect } from reactstructure-agent';
import { json, LoaderFunction } from @remix-run/nodestructure-agent';
import { useLoaderData } from @remix-run/reactstructure-agent';
import { motion } from framer-motionstructure-agent';

// Types pour la carte de migration
interface MigrationMap {
  auditId: string;
  sourceDirectory: string;
  targetDirectory: string;
  mappings: {
    id: string;
    sourceFile: string;
    targetFile: string;
    componentType: string;
    migrationStatus: string;
    metadata?: Record<string, any>;
  }[];
  generated: string;
}

// Fonction loader pour charger les données
export const loader: LoaderFunction = async () => {
  // En production, vous feriez un appel API à Supabase ici
  // Pour cette version générée, on utilise les données intégrées
  const migrationMap: MigrationMap = ${JSON.stringify(migrationMap, null, 2)};
  
  return json({ migrationMap });
};

// Composant principal
export default function MigrationMapView() {
  const { migrationMap } = useLoaderData<{ migrationMap: MigrationMap }>();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrer les mappings en fonction des critères
  const filteredMappings = migrationMap.mappings.filter(mapping => {
    // Filtrer par statut
    if (filter !== 'all' && mapping.migrationStatus !== filter) {
      return false;
    }
    
    // Filtrer par terme de recherche
    if (searchTerm && !mapping.sourceFile.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !mapping.targetFile.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Compter les statuts
  const statusCounts = {
    pending: migrationMap.mappings.filter(m => m.migrationStatus === 'pending').length,
    in_progress: migrationMap.mappings.filter(m => m.migrationStatus === 'in_progress').length,
    completed: migrationMap.mappings.filter(m => m.migrationStatus === 'completed').length,
    failed: migrationMap.mappings.filter(m => m.migrationStatus === 'failed').length,
  };
  
  // Fonction pour formater les noms de fichiers
  const formatFileName = (filePath: string) => {
    const fileName = filePath.split('/').pop() || filePath;
    return fileName;
  };
  
  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'var(--color-warning)';
      case 'in_progress': return 'var(--color-info)';
      case 'completed': return 'var(--color-success)';
      case 'failed': return 'var(--color-error)';
      default: return 'var(--color-text)';
    }
  };
  
  // Fonction pour obtenir l'icône du type de composant
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'controller': return '🎮';
      case 'service': return '⚙️';
      case 'entity': return '📋';
      case 'component': return '🧩';
      case 'route': return '🔀';
      default: return '📄';
    }
  };
  
  return (
    <div className="migration-map-view">
      <header>
        <h1>Carte de Migration</h1>
        <div className="metadata">
          <div className="metadata-item">
            <span className="label">Audit ID:</span>
            <span className="value">{migrationMap.auditId}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Généré le:</span>
            <span className="value">{new Date(migrationMap.generated).toLocaleString('fr-FR')}</span>
          </div>
        </div>
      </header>
      
      <div className="directories">
        <div className="directory-item">
          <span className="label">Répertoire source:</span>
          <span className="value">{migrationMap.sourceDirectory}</span>
        </div>
        <div className="directory-item">
          <span className="label">Répertoire cible:</span>
          <span className="value">{migrationMap.targetDirectory}</span>
        </div>
      </div>
      
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un fichier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="status-filters">
          <button
            className={\`status-btn \${filter === 'all' ? 'active' : ''}\`}
            onClick={() => setFilter('all')}
          >
            Tous ({migrationMap.mappings.length})
          </button>
          <button
            className={\`status-btn \${filter === 'pending' ? 'active' : ''}\`}
            onClick={() => setFilter('pending')}
          >
            En attente ({statusCounts.pending})
          </button>
          <button
            className={\`status-btn \${filter === 'in_progress' ? 'active' : ''}\`}
            onClick={() => setFilter('in_progress')}
          >
            En cours ({statusCounts.in_progress})
          </button>
          <button
            className={\`status-btn \${filter === 'completed' ? 'active' : ''}\`}
            onClick={() => setFilter('completed')}
          >
            Terminés ({statusCounts.completed})
          </button>
          <button
            className={\`status-btn \${filter === 'failed' ? 'active' : ''}\`}
            onClick={() => setFilter('failed')}
          >
            Échecs ({statusCounts.failed})
          </button>
        </div>
      </div>
      
      <div className="mappings-container">
        {filteredMappings.length > 0 ? (
          <motion.div 
            className="mappings-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredMappings.map((mapping) => (
              <motion.div
                key={mapping.id}
                className="mapping-item"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mapping-header">
                  <div 
                    className="status-indicator" 
                    style={{ backgroundColor: getStatusColor(mapping.migrationStatus) }}
                  />
                  <div className="component-type">
                    {getComponentIcon(mapping.componentType)} {mapping.componentType}
                  </div>
                </div>
                
                <div className="mapping-files">
                  <div className="source-file">
                    <div className="file-label">Source PHP:</div>
                    <div className="file-path">{formatFileName(mapping.sourceFile)}</div>
                  </div>
                  
                  <div className="arrow">→</div>
                  
                  <div className="target-file">
                    <div className="file-label">Cible générée:</div>
                    <div className="file-path">{formatFileName(mapping.targetFile)}</div>
                  </div>
                </div>
                
                <div className="mapping-actions">
                  <button className="btn view-btn">Voir le code</button>
                  <button className="btn diff-btn">Comparer</button>
                  <button className="btn status-btn">Changer le statut</button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="no-mappings">
            <p>Aucun mapping ne correspond aux critères de filtrage.</p>
          </div>
        )}
      </div>
      
      <style jsx>{/* CSS styles here */}</style>
    </div>
  );
}

// Styles CSS pour le composant
export function links() {
  return [
    {
      rel: "stylesheet",
      href: "/styles/migration-map.css"
    }
  ];
}
`;

      // Écrire le fichier
      fs.writeFileSync(outputPath, content, 'utf-8');

      // Générer aussi la feuille de style CSS
      const cssPath = path.join(path.dirname(outputPath), '../public/styles/migration-map.css');
      const cssDir = path.dirname(cssPath);
      
      if (!fs.existsSync(cssDir)) {
        fs.mkdirSync(cssDir, { recursive: true });
      }
      
      const cssContent = `/* 
 * migration-map.css
 * Styles pour la visualisation de la carte de migration
 */

:root {
  --color-primary: #3498db;
  --color-secondary: #2c3e50;
  --color-background: #f8f9fa;
  --color-card: #ffffff;
  --color-text: #333333;
  --color-border: #e0e0e0;
  --color-success: #27ae60;
  --color-warning: #f39c12;
  --color-error: #e74c3c;
  --color-info: #3498db;
  --shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  --border-radius: 5px;
}

.migration-map-view {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--color-background);
  color: var(--color-text);
}

header {
  margin-bottom: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-secondary);
}

.metadata {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.metadata-item, .directory-item {
  display: flex;
  gap: 0.5rem;
}

.label {
  font-weight: 600;
  color: var(--color-secondary);
}

.directories {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--color-card);
  border-radius: var(--border-radius);
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-box input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 1rem;
}

.status-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-btn {
  padding: 0.5rem 1rem;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s;
}

.status-btn.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.mappings-container {
  margin-bottom: 2rem;
}

.mappings-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.mapping-item {
  background-color: var(--color-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.mapping-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.mapping-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background-color: #f5f7f9;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.75rem;
}

.component-type {
  font-weight: 600;
  font-size: 1.1rem;
}

.mapping-files {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.source-file, .target-file {
  flex: 1;
  min-width: 0;
}

.file-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.file-path {
  word-break: break-word;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9rem;
  padding: 0.25rem;
  background-color: #f5f7f9;
  border-radius: 3px;
}

.arrow {
  color: var(--color-primary);
  font-weight: bold;
  padding: 0 0.5rem;
}

.mapping-actions {
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid var(--color-border);
  background-color: #f5f7f9;
}

.btn {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.view-btn {
  background-color: var(--color-info);
  color: white;
}

.diff-btn {
  background-color: var(--color-warning);
  color: white;
}

.status-btn {
  background-color: var(--color-secondary);
  color: white;
}

.no-mappings {
  text-align: center;
  padding: 2rem;
  background-color: var(--color-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

@media (max-width: 768px) {
  .migration-map-view {
    padding: 1rem;
  }
  
  .mappings-list {
    grid-template-columns: 1fr;
  }
  
  .metadata {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .status-filters {
    justify-content: center;
  }
}
`;
      
      fs.writeFileSync(cssPath, cssContent, 'utf-8');
      
      console.log(`✅ Composant de visualisation généré: ${outputPath}`);
      console.log(`✅ Styles CSS générés: ${cssPath}`);
      
      return outputPath;
    } catch (err) {
      console.error('❌ Erreur lors de la génération du composant de visualisation:', err);
      return null;
    }
  }
}

// Exporter une instance singleton pour une utilisation facile
export const sourceTargetLinker = new SourceTargetLinker();

// Si ce script est exécuté directement, afficher l'aide
if (require.main === module) {
  console.log(`
SourceTargetLinker - Outil de liaison entre fichiers PHP sources et composants générés
------------------------------------------------------------------------------------

Cet outil permet de maintenir une traçabilité entre les fichiers PHP d'origine et les 
composants NestJS/Remix générés dans le processus de migration.

Utilisez l'importation suivante dans vos scripts:
  import { sourceTargetLinker } from ./utils/source-target-linkerstructure-agent';

Exemples d'utilisation:

1. Créer un lien entre un fichier source et un composant généré:
   await sourceTargetLinker.createSourceTargetLink(
     'audit-123',  // ID de l'audit
     '/path/to/source.php',  // Fichier PHP source
     '/path/to/target.tsx',  // Composant généré
     {
       metadata: {
         componentType: 'component',
         author: 'Migration Pipeline'
       },
       addCommentToTargetFile: true
     }
   );

2. Générer une carte de migration:
   await sourceTargetLinker.generateMigrationMap(
     'audit-123',  // ID de l'audit
     '/path/to/output/migration-map.json'  // Fichier de sortie
   );

3. Générer un composant de visualisation:
   await sourceTargetLinker.generateMappingVisualization(
     'audit-123',  // ID de l'audit
     '/path/to/output/MigrationMapView.tsx'  // Composant de sortie
   );
`);
}