import * as fs from 'fs-extra';;
import * as path from 'path';
import { BaseAgent } from '../core/interfaces/BaseAgent';


/**
 * Interface pour une section d'audit
 */
interface AuditSection {
  id: string;
  title: string;
  content: string;
}

/**
 * Analyseur de la logique métier des fichiers PHP
 */
export class BusinessAgent implements BaseAgent, BusinessAgent {
  private filePath: string;
  private fileContent: string = '';
  private sections: AuditSection[] = [];

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Charge le contenu du fichier PHP
   */
  public async loadFile(): Promise<void> {
    try {
      this.fileContent = await fs.readFile(this.filePath, 'utf8');
    } catch (error) {
      throw new Error(`Erreur lors du chargement du fichier: ${error.message}`);
    }
  }

  /**
   * Analyse le rôle métier principal du fichier (section 1)
   */
  private analyzeBusinessRole(): string {
    const content = this.fileContent;
    let role = '';
    
    // Détection basée sur les mot-clés et patterns
    if (content.includes('panier') || content.includes('cart') || content.includes('basket')) {
      role = "Gestion du panier d'achat et manipulation des articles sélectionnés.";
    } else if (content.includes('produit') || content.includes('product') || content.includes('article')) {
      role = "Affichage et manipulation de fiches produit.";
    } else if (content.includes('utilisateur') || content.includes('user') || content.includes('client')) {
      role = "Gestion des comptes utilisateurs.";
    } else if (content.includes('commande') || content.includes('order')) {
      role = "Traitement des commandes et du processus d'achat.";
    } else if (content.includes('contact') || content.includes('message') || content.includes('mail(')) {
      role = "Formulaire de contact et envoi de messages.";
    } else if (content.includes('admin') || content.includes('dashboard')) {
      role = "Interface d'administration.";
    } else if (content.includes('login') || content.includes('connexion') || content.includes('authentification')) {
      role = "Authentification et gestion de sessions utilisateur.";
    } else {
      // Analyser les requêtes SQL pour déduire le rôle
      if (content.match(/SELECT.*FROM\s+produits/i) || content.match(/SELECT.*FROM\s+products/i)) {
        role = "Récupération et affichage de produits.";
      } else if (content.match(/SELECT.*FROM\s+utilisateurs/i) || content.match(/SELECT.*FROM\s+users/i)) {
        role = "Récupération de données utilisateurs.";
      } else if (content.match(/SELECT.*FROM\s+commandes/i) || content.match(/SELECT.*FROM\s+orders/i)) {
        role = "Consultation des commandes.";
      } else {
        role = "Le rôle métier n'a pas pu être clairement identifié.";
      }
    }
    
    // Raffiner la détection en fonction des verbes d'action
    if (content.includes('ajouter') || content.includes('add') || content.includes('INSERT INTO')) {
      role += " Permet l'ajout de nouvelles entrées.";
    }
    if (content.includes('modifier') || content.includes('update') || content.includes('edit') || content.includes('UPDATE')) {
      role += " Permet la modification d'informations existantes.";
    }
    if (content.includes('supprimer') || content.includes('delete') || content.includes('remove') || content.includes('DELETE FROM')) {
      role += " Permet la suppression d'éléments.";
    }
    if (content.includes('afficher') || content.includes('display') || content.includes('show')) {
      role += " Gère l'affichage des données.";
    }
    
    return role;
  }

  /**
   * Analyse les points d'entrée et de déclenchement (section 2)
   */
  private analyzeEntryPoints(): string {
    const content = this.fileContent;
    let entryPoints = '';
    
    // Détecter les méthodes HTTP
    const hasGet = content.includes('$_GET');
    const hasPost = content.includes('$_POST');
    
    if (hasGet && hasPost) {
      entryPoints += "Le fichier traite à la fois des requêtes GET et POST. ";
    } else if (hasGet) {
      entryPoints += "Le fichier traite des requêtes GET. ";
    } else if (hasPost) {
      entryPoints += "Le fichier traite des requêtes POST. ";
    }
    
    // Détecter les déclencheurs spécifiques
    if (content.includes('$_GET[\'id\'') || content.includes('$_GET["id"')) {
      entryPoints += "Accepte un paramètre GET 'id' pour identifier une ressource spécifique. ";
    }
    
    if (content.match(/require|include/)) {
      entryPoints += "Peut être inclus dans d'autres scripts. ";
    }
    
    if (content.includes('cron') || content.includes('automatique') || 
        !hasGet && !hasPost && content.includes('mysqli')) {
      entryPoints += "Pourrait être exécuté comme une tâche planifiée (CRON). ";
    }
    
    if (content.includes('ajax') || content.includes('XMLHttpRequest') || 
        content.includes('json_encode') || content.includes('application/json')) {
      entryPoints += "Répond à des requêtes AJAX. ";
    }
    
    if (content.includes('action=') || content.includes('&action=')) {
      const actionMatches = content.match(/[?&]action=(\w+)/g);
      if (actionMatches && actionMatches.length > 0) {
        entryPoints += `Utilise un paramètre 'action' pour déterminer le comportement (${actionMatches.length} actions différentes). `;
      }
    }
    
    // Si aucun point d'entrée n'a été détecté
    if (entryPoints === '') {
      entryPoints = "Les points d'entrée n'ont pas pu être clairement identifiés.";
    }
    
    return entryPoints;
  }

  /**
   * Analyse la zone fonctionnelle du fichier (section 3)
   */
  private analyzeFunctionalArea(): string {
    const content = this.fileContent;
    const fileName = path.basename(this.filePath, '.php');
    let area = '';
    
    // Détection basée sur le nom du fichier
    if (fileName.includes('panier') || fileName.includes('cart')) {
      area = "Panier";
    } else if (fileName.includes('produit') || fileName.includes('product')) {
      area = "Catalogue de produits";
    } else if (fileName.includes('user') || fileName.includes('utilisateur')) {
      area = "Compte utilisateur";
    } else if (fileName.includes('commande') || fileName.includes('order')) {
      area = "Gestion des commandes";
    } else if (fileName.includes('admin') || fileName.includes('dashboard')) {
      area = "Administration";
    } else if (fileName.includes('search') || fileName.includes('recherche')) {
      area = "Moteur de recherche";
    } else if (fileName.includes('contact') || fileName.includes('message')) {
      area = "Communication";
    } else if (fileName.includes('auth') || fileName.includes('login')) {
      area = "Authentification";
    } else {
      // Détection basée sur le contenu
      if (content.match(/SEO|meta|title|description|keywords/i)) {
        area = "SEO et métadonnées";
      } else if (content.match(/email|mail\(|newsletter|subscription/i)) {
        area = "Email et notifications";
      } else if (content.match(/import|export|csv|excel|xml/i)) {
        area = "Import/Export de données";
      } else if (content.match(/log|journal|history|historique/i)) {
        area = "Journalisation et suivi";
      } else if (content.match(/stat|analytics|rapport|report/i)) {
        area = "Statistiques et rapports";
      } else if (content.match(/config|settings|paramètres|preferences/i)) {
        area = "Configuration";
      } else {
        area = "Zone fonctionnelle non clairement identifiée";
      }
    }
    
    // Préciser la fonction spécifique
    if (content.includes('list') || content.includes('liste') || content.match(/SELECT.*FROM.*LIMIT/i)) {
      area += " - Affichage liste";
    } else if (content.includes('detail') || content.includes('fiche') || content.match(/SELECT.*FROM.*WHERE.*=/i)) {
      area += " - Affichage détail";
    } else if (content.includes('form') || content.includes('formulaire')) {
      area += " - Formulaire de saisie";
    } else if (content.includes('traitement') || content.includes('process')) {
      area += " - Traitement de données";
    }
    
    return area;
  }

  /**
   * Génère les sections d'audit pour le fichier PHP
   */
  public async analyze(): Promise<AuditSection[]> {
    try {
      // Analyser le rôle métier
      const businessRoleContent = this.analyzeBusinessRole();
      this.sections.push({
        id: 'role-metier',
        title: '1️⃣ Rôle métier principal',
        content: businessRoleContent
      });
      
      // Analyser les points d'entrée
      const entryPointsContent = this.analyzeEntryPoints();
      this.sections.push({
        id: 'points-entree',
        title: '2️⃣ Points d\'entrée / déclenchement',
        content: entryPointsContent
      });
      
      // Analyser la zone fonctionnelle
      const functionalAreaContent = this.analyzeFunctionalArea();
      this.sections.push({
        id: 'zone-fonctionnelle',
        title: '3️⃣ Zone fonctionnelle détectée',
        content: functionalAreaContent
      });
      
      return this.sections;
    } catch (error) {
      throw new Error(`Erreur lors de l'analyse: ${error.message}`);
    }
  }

  /**
   * Sauvegarde les sections d'audit dans un fichier
   */
  public async saveSections(outputPath?: string): Promise<void> {
    try {
      const fileName = path.basename(this.filePath);
      const outputFilePath = outputPath || path.join(path.dirname(this.filePath), `${fileName}.audit.md`);
      
      let content = '';
      this.sections.forEach(section => {
        content += `## ${section.title}\n\n${section.content}\n\n`;
      });
      
      await fs.writeFile(outputFilePath, content, 'utf8');
      console.log(`Sections d'audit sauvegardées dans ${outputFilePath}`);
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde des sections: ${error.message}`);
    }
  }

  /**
   * Exécute l'analyse complète et sauvegarde le résultat
   */
  public async process(outputPath?: string): Promise<void> {
    try {
      await this.loadFile();
      await this.analyze();
      await this.saveSections(outputPath);
    } catch (error) {
      console.error(`Erreur lors du traitement: ${error.message}`);
      throw error;
    }
  }

  id: string = '';
  type: string = '';
  version: string = '1.0.0';

  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(`[${this.name}] Initialisation...`);
  }

  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(`[${this.name}] Arrêt...`);
  }

  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Point d'entrée en ligne de commande
 */
async function main() {
  // Récupérer le chemin du fichier à partir des arguments de ligne de commande
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: ts-node agent-business.ts <path-to-php-file> [output-path]');
    process.exit(1);
  }

  const filePath = args[0];
  const outputPath = args.length > 1 ? args[1] : undefined;

  try {
    const agent = new BusinessAgent(filePath);
    await agent.process(outputPath);
    console.log('Analyse métier terminée avec succès');
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}
