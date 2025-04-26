import { readFileSync } from fsstructure-agent';
import { basename } from pathstructure-agent';
import chalk from chalkstructure-agent';

interface VerificationResult {
  fileType: string;
  file: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

export class StructureVerifier {
  private config: any;
  
  constructor(config: any) {
    this.config = config;
  }
  
  async verify(mdFiles: string[], jsonFiles: string[], tsFiles: string[]): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    
    // Vérifier la structure des fichiers .audit.md
    results.push(...this.checkAuditStructure(mdFiles));
    
    // Vérifier la structure des fichiers .backlog.json
    results.push(...this.checkBacklogStructure(jsonFiles));
    
    // Vérifier la structure des fichiers .impact_graph.json
    results.push(...this.checkImpactGraphStructure(jsonFiles));
    
    // Vérifier la présence et la structure du sommaire
    results.push(...this.checkSummaryStructure(mdFiles));
    
    return results;
  }
  
  private checkAuditStructure(mdFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];
    const auditFiles = mdFiles.filter(file => basename(file).includes('.audit.md'));
    
    for (const auditFile of auditFiles) {
      const content = readFileSync(auditFile, 'utf-8');
      
      // Vérifier la présence des sections obligatoires
      const requiredSections = [
        /#+\s+.*[Rr]ôle.*métier/,
        /#+\s+.*[Ss]tructure/,
        /#+\s+.*[Zz]one.*fonctionnelle/,
        /#+\s+.*[Cc]omplexité/,
        /#+\s+.*[Mm]igration/
      ];
      
      const missingSections = requiredSections.filter(regex => !regex.test(content));
      
      if (missingSections.length > 0) {
        results.push({
          fileType: 'md',
          file: auditFile,
          status: missingSections.length > 2 ? 'error' : 'warning',
          message: `${missingSections.length} section(s) obligatoire(s) manquante(s)`,
          details: ['Sections manquantes : rôle métier, structure, complexité ou migration']
        });
      }
      
      // Vérifier la structure des sections numérotées
      const sectionHeaders = content.match(/#+\s+[0-9️⃣]+\s+.*/g) || [];
      
      if (sectionHeaders.length < 10) {
        results.push({
          fileType: 'md',
          file: auditFile,
          status: 'warning',
          message: `Moins de 10 sections numérotées trouvées (${sectionHeaders.length})`,
          details: ['Le format standard recommande 24 sections (1-24)']
        });
      }
      
      // Vérifier si le fichier est vide ou presque vide
      if (content.trim().length < 200) {
        results.push({
          fileType: 'md',
          file: auditFile,
          status: 'error',
          message: 'Fichier audit pratiquement vide',
          details: ['Moins de 200 caractères de contenu']
        });
      } else {
        // Compter les sections avec du contenu substantiel
        let emptyContentSections = 0;
        const sectionRegex = /#+\s+[0-9️⃣]+\s+.*\n+([^#]*)/g;
        let match;
        
        while ((match = sectionRegex.exec(content)) !== null) {
          const sectionContent = match[1].trim();
          if (sectionContent.length < 20) {
            emptyContentSections++;
          }
        }
        
        if (emptyContentSections > 3) {
          results.push({
            fileType: 'md',
            file: auditFile,
            status: 'warning',
            message: `${emptyContentSections} sections avec contenu insuffisant`,
            details: ['Plusieurs sections ont moins de 20 caractères de contenu']
          });
        }
      }
      
      // Succès si aucune erreur n'a été trouvée
      if (!results.some(r => r.file === auditFile)) {
        results.push({
          fileType: 'md',
          file: auditFile,
          status: 'success',
          message: 'Structure du fichier audit valide'
        });
      }
    }
    
    return results;
  }
  
  private checkBacklogStructure(jsonFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];
    const backlogFiles = jsonFiles.filter(file => basename(file).includes('.backlog.json'));
    
    for (const backlogFile of backlogFiles) {
      try {
        const content = readFileSync(backlogFile, 'utf-8');
        const backlog = JSON.parse(content);
        
        // Vérifier la présence des champs obligatoires
        if (!backlog.file) {
          results.push({
            fileType: 'json',
            file: backlogFile,
            status: 'error',
            message: 'Champ "file" manquant dans le backlog',
            details: ['Le backlog doit contenir un champ "file" indiquant le fichier source']
          });
        }
        
        if (!backlog.priority && backlog.priority !== 0) {
          results.push({
            fileType: 'json',
            file: backlogFile,
            status: 'warning',
            message: 'Champ "priority" manquant dans le backlog',
            details: ['Le backlog devrait contenir un champ "priority" pour la priorisation']
          });
        }
        
        if (!backlog.status) {
          results.push({
            fileType: 'json',
            file: backlogFile,
            status: 'warning',
            message: 'Champ "status" manquant dans le backlog',
            details: ['Le backlog devrait contenir un champ "status" pour le suivi']
          });
        }
        
        // Vérifier la structure des tâches
        if (!Array.isArray(backlog.tasks) || backlog.tasks.length === 0) {
          results.push({
            fileType: 'json',
            file: backlogFile,
            status: 'error',
            message: 'Aucune tâche définie dans le backlog',
            details: ['Le backlog doit contenir un tableau "tasks" avec au moins une tâche']
          });
        } else {
          // Vérifier que chaque tâche a les champs requis
          for (let i = 0; i < backlog.tasks.length; i++) {
            const task = backlog.tasks[i];
            
            if (!task.type) {
              results.push({
                fileType: 'json',
                file: backlogFile,
                status: 'error',
                message: `Tâche ${i+1} sans type défini`,
                details: ['Chaque tâche doit avoir un champ "type"']
              });
            }
            
            if (!task.target) {
              results.push({
                fileType: 'json',
                file: backlogFile,
                status: 'warning',
                message: `Tâche ${i+1} sans cible définie`,
                details: ['Chaque tâche devrait avoir un champ "target"']
              });
            }
            
            if (!task.status) {
              results.push({
                fileType: 'json',
                file: backlogFile,
                status: 'warning',
                message: `Tâche ${i+1} sans statut défini`,
                details: ['Chaque tâche devrait avoir un champ "status"']
              });
            }
          }
        }
        
        // Succès si aucune erreur n'a été trouvée
        if (!results.some(r => r.file === backlogFile && r.status === 'error')) {
          results.push({
            fileType: 'json',
            file: backlogFile,
            status: 'success',
            message: 'Structure du fichier backlog valide'
          });
        }
      } catch (error) {
        results.push({
          fileType: 'json',
          file: backlogFile,
          status: 'error',
          message: 'Erreur de parsing JSON',
          details: [`${error.message}`]
        });
      }
    }
    
    return results;
  }
  
  private checkImpactGraphStructure(jsonFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];
    const graphFiles = jsonFiles.filter(file => basename(file).includes('.impact_graph.json'));
    
    for (const graphFile of graphFiles) {
      try {
        const content = readFileSync(graphFile, 'utf-8');
        const graph = JSON.parse(content);
        
        // Vérifier la présence des champs obligatoires
        if (!Array.isArray(graph.nodes)) {
          results.push({
            fileType: 'json',
            file: graphFile,
            status: 'error',
            message: 'Champ "nodes" manquant ou non valide',
            details: ['Le graphe d\'impact doit contenir un tableau "nodes"']
          });
        } else if (graph.nodes.length === 0) {
          results.push({
            fileType: 'json',
            file: graphFile,
            status: 'warning',
            message: 'Graphe d\'impact sans nœuds',
            details: ['Le graphe d\'impact ne contient aucun nœud']
          });
        }
        
        if (!Array.isArray(graph.edges)) {
          results.push({
            fileType: 'json',
            file: graphFile,
            status: 'error',
            message: 'Champ "edges" manquant ou non valide',
            details: ['Le graphe d\'impact doit contenir un tableau "edges"']
          });
        }
        
        // Succès si aucune erreur n'a été trouvée
        if (!results.some(r => r.file === graphFile && r.status === 'error')) {
          results.push({
            fileType: 'json',
            file: graphFile,
            status: 'success',
            message: 'Structure du fichier impact_graph valide'
          });
        }
      } catch (error) {
        results.push({
          fileType: 'json',
          file: graphFile,
          status: 'error',
          message: 'Erreur de parsing JSON',
          details: [`${error.message}`]
        });
      }
    }
    
    return results;
  }
  
  private checkSummaryStructure(mdFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];
    
    // Rechercher le fichier de sommaire (00-sommaire.md, README.md, etc.)
    const summaryFile = mdFiles.find(file => {
      const name = basename(file).toLowerCase();
      return name === '00-sommaire.md' || name === 'readme.md' || name === 'sommaire.md';
    });
    
    if (!summaryFile) {
      results.push({
        fileType: 'md',
        file: 'N/A',
        status: 'warning',
        message: 'Fichier de sommaire non trouvé',
        details: ['Créez un fichier 00-sommaire.md ou README.md']
      });
      return results;
    }
    
    // Vérifier la structure du sommaire
    const content = readFileSync(summaryFile, 'utf-8');
    
    // Vérifier les liens vers d'autres fichiers
    const linkPattern = /\[.*\]\((.*\.md)\)/g;
    const links = [];
    let match;
    
    while ((match = linkPattern.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    // Compter les fichiers référencés dans le sommaire
    const referencedFiles = links.map(link => {
      // Obtenir seulement le nom du fichier sans le chemin
      return link.split('/').pop();
    });
    
    // Trouver les fichiers MD qui ne sont pas référencés dans le sommaire
    const nonAuditMdFiles = mdFiles.filter(file => !basename(file).includes('.audit.md'));
    const nonReferencedFiles = nonAuditMdFiles.filter(file => {
      const fileName = basename(file);
      return fileName !== basename(summaryFile) && !referencedFiles.includes(fileName);
    });
    
    if (nonReferencedFiles.length > 0) {
      results.push({
        fileType: 'md',
        file: summaryFile,
        status: 'warning',
        message: `${nonReferencedFiles.length} fichiers MD non référencés dans le sommaire`,
        details: nonReferencedFiles.map(file => basename(file))
      });
    }
    
    // Succès si le sommaire contient des liens
    if (links.length > 0) {
      results.push({
        fileType: 'md',
        file: summaryFile,
        status: 'success',
        message: `Sommaire valide avec ${links.length} liens`
      });
    }
    
    return results;
  }
}
