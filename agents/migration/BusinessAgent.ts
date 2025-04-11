import { BaseAgent } from '../core/BaseAgent';

export class BusinessAgent extends BaseAgent {
  /**
   * Renvoie la version de l'agent
   */
  public getVersion(): string {
    return '1.1.0';
  }
  
  /**
   * Renvoie les agents dont celui-ci dépend
   */
  public getDependencies(): string[] {
    return []; // Pas de dépendances pour cet agent
  }

  /**
   * Analyse le rôle fonctionnel métier du fichier PHP
   */
  public async analyze(): Promise<void> {
    // Détecter le type de page/fonctionnalité
    const pageType = this.detectPageType();
    
    // Analyser la logique métier centrale
    const businessLogic = this.analyzeBusinessLogic();
    
    // Analyser les cas d'usage spécifiques
    const businessCases = this.analyzeBusinessCases();
    
    // Générer les sections d'audit
    this.addSection(
      'business-context',
      'Contexte métier',
      this.generateBusinessContextContent(pageType),
      'business'
    );
    
    this.addSection(
      'business-logic',
      'Logique métier',
      businessLogic,
      'business'
    );
    
    this.addSection(
      'business-cases',
      'Cas métier spécifiques',
      businessCases,
      'business'
    );
  }
  
  /**
   * Détecte le type de page (produit, panier, liste, etc.)
   */
  private detectPageType(): string {
    const fileContent = this.fileContent.toLowerCase();
    
    // Analyse basée sur des mots-clés
    if (fileContent.includes('panier') || fileContent.includes('cart')) {
      return 'panier';
    } else if (fileContent.includes('produit') || fileContent.includes('product') || fileContent.includes('fiche')) {
      return 'fiche produit';
    } else if (fileContent.includes('liste') || fileContent.includes('catalog')) {
      return 'catalogue';
    } else if (fileContent.includes('commande') || fileContent.includes('order')) {
      return 'commande';
    } else if (fileContent.includes('utilisateur') || fileContent.includes('user')) {
      return 'profil utilisateur';
    }
    
    // Analyse basée sur les tables SQL utilisées
    if (fileContent.includes('select') && fileContent.includes('from')) {
      if (fileContent.includes('pieces') || fileContent.includes('products')) {
        return 'fiche produit';
      } else if (fileContent.includes('users') || fileContent.includes('clients')) {
        return 'profil utilisateur';
      }
    }
    
    return 'indéterminé';
  }
  
  /**
   * Analyse la logique métier centrale du fichier
   */
  private analyzeBusinessLogic(): string {
    const fileContent = this.fileContent;
    let businessLogic = '';
    
    // Détecter les comportements conditionnels
    const conditionalLogic = fileContent.match(/if\s*\([^)]+\)\s*{[^}]*}/g);
    if (conditionalLogic && conditionalLogic.length > 0) {
      businessLogic += "Logique conditionnelle basée sur ";
      
      if (fileContent.includes('$_GET') || fileContent.includes('$_REQUEST')) {
        businessLogic += "paramètres GET";
      }
      
      if (fileContent.includes('$_SESSION')) {
        businessLogic += fileContent.includes('$_GET') ? " et état de session" : "état de session";
      }
      
      businessLogic += ". ";
    }
    
    // Détecter les calculs
    if (fileContent.includes('+') || fileContent.includes('-') || fileContent.includes('*') || fileContent.includes('/')) {
      if (fileContent.includes('prix') || fileContent.includes('price') || fileContent.includes('total')) {
        businessLogic += "Calculs de prix ou totaux. ";
      }
    }
    
    // Détecter l'affichage conditionnel
    if (fileContent.includes('echo') || fileContent.includes('print')) {
      businessLogic += "Affichage conditionnel de contenu. ";
    }
    
    // Si aucune logique n'a été détectée
    if (businessLogic === '') {
      businessLogic = "Logique métier non clairement identifiable.";
    }
    
    return businessLogic;
  }
  
  /**
   * Analyse les cas d'usage spécifiques
   */
  private analyzeBusinessCases(): string {
    const fileContent = this.fileContent;
    let businessCases = '';
    
    // Détecter le multi-langue
    if (fileContent.includes('lang') || fileContent.includes('locale') || 
        fileContent.includes('i18n') || fileContent.includes('translate')) {
      businessCases += "- Support multi-langues\n";
    }
    
    // Détecter gestion de variantes
    if ((fileContent.includes('variant') || fileContent.includes('variante')) && 
        (fileContent.includes('product') || fileContent.includes('produit'))) {
      businessCases += "- Gestion de variantes de produits\n";
    }
    
    // Détecter compatibilité
    if (fileContent.includes('compatible') || fileContent.includes('compatibility')) {
      businessCases += "- Vérification de compatibilité\n";
    }
    
    // Détecter promotion/réduction
    if (fileContent.includes('promo') || fileContent.includes('discount') || 
        fileContent.includes('reduction') || fileContent.includes('réduction')) {
      businessCases += "- Gestion de promotions ou réductions\n";
    }
    
    // Si aucun cas d'usage n'a été détecté
    if (businessCases === '') {
      businessCases = "Aucun cas métier spécifique identifié.";
    }
    
    return businessCases;
  }
  
  /**
   * Génère le contenu de la section contexte métier
   */
  private generateBusinessContextContent(pageType: string): string {
    switch (pageType) {
      case 'fiche produit':
        return "La fiche produit permet de consulter le détail d'un article automobile (références, caractéristiques, compatibilités, prix).";
      case 'panier':
        return "La page panier permet de visualiser et modifier les articles sélectionnés avant de passer à la commande.";
      case 'catalogue':
        return "La page catalogue présente une liste filtrée de produits avec des options de tri et de filtrage.";
      case 'commande':
        return "La page de commande gère le processus d'achat, de la validation du panier au paiement.";
      case 'profil utilisateur':
        return "La page profil permet aux utilisateurs de gérer leurs informations personnelles et de consulter leurs commandes.";
      default:
        return "Le rôle métier de cette page n'a pas pu être clairement identifié.";
    }
  }
}
