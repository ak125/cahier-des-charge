import { BaseAgent } from '../core/BaseAgent';

export class StructureAgent extends BaseAgent {
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
   * Analyse la structure technique du fichier PHP
   */
  public async analyze(): Promise<void> {
    // Extraire la structure du fichier
    const fileStructure = this.analyzeFileStructure();

    // Identifier les points d'entrée
    const entryPoints = this.identifyEntryPoints();

    // Analyser l'usage des templates
    const templates = this.analyzeTemplateUsage();

    // Générer les sections d'audit
    this.addSection('file-structure', 'Structure du fichier', fileStructure, 'technical');

    this.addSection('entry-points', "Points d'entrée", entryPoints, 'technical');

    this.addSection('templates', 'Templates HTML', templates, 'technical');
  }

  /**
   * Analyse la structure générale du fichier PHP
   */
  private analyzeFileStructure(): string {
    const fileContent = this.fileContent;
    let structure = '';

    // Détecter si le fichier est orienté objet
    const classCount = (fileContent.match(/class\s+\w+/g) || []).length;
    if (classCount > 0) {
      structure += `Fichier orienté objet avec ${classCount} classe(s). `;
    } else {
      structure += 'Fichier non orienté objet. ';
    }

    // Compter les fonctions
    const functionMatches = fileContent.match(/function\s+\w+\s*\(/g) || [];
    const functionCount = functionMatches.length;
    structure += `${functionCount} fonction(s) définies. `;

    // Détecter les boucles
    const forLoops = (fileContent.match(/for\s*\(/g) || []).length;
    const foreachLoops = (fileContent.match(/foreach\s*\(/g) || []).length;
    const whileLoops = (fileContent.match(/while\s*\(/g) || []).length;

    if (forLoops + foreachLoops + whileLoops > 0) {
      structure += `${
        forLoops + foreachLoops + whileLoops
      } boucle(s) (${forLoops} for, ${foreachLoops} foreach, ${whileLoops} while). `;
    }

    // Détecter les conditions if/else
    const ifStatements = (fileContent.match(/if\s*\(/g) || []).length;
    if (ifStatements > 0) {
      structure += `${ifStatements} structure(s) conditionnelle(s). `;
    }

    // Détecter la définition de constantes
    const defineStatements = (fileContent.match(/define\s*\(/g) || []).length;
    if (defineStatements > 0) {
      structure += `${defineStatements} constante(s) définie(s). `;
    }

    return structure;
  }

  /**
   * Identifie les points d'entrée du script PHP
   */
  private identifyEntryPoints(): string {
    const fileContent = this.fileContent;
    let entryPoints = '';

    // Détecter les accès aux variables superglobales
    const getAccess = fileContent.match(/\$_GET\[['"](\w+)['"]\]/g);
    const postAccess = fileContent.match(/\$_POST\[['"](\w+)['"]\]/g);
    const requestAccess = fileContent.match(/\$_REQUEST\[['"](\w+)['"]\]/g);

    if (getAccess && getAccess.length > 0) {
      entryPoints +=
        'Paramètres GET: ' +
        getAccess
          .map((match) => {
            const result = match.match(/\$_GET\[['"](\w+)['"]\]/);
            return result?.[1] || '';
          })
          .filter((param) => param !== '')
          .join(', ') +
        '. ';
    }

    if (postAccess && postAccess.length > 0) {
      entryPoints +=
        'Paramètres POST: ' +
        postAccess
          .map((match) => {
            const result = match.match(/\$_POST\[['"](\w+)['"]\]/);
            return result?.[1] || '';
          })
          .filter((param) => param !== '')
          .join(', ') +
        '. ';
    }

    if (requestAccess && requestAccess.length > 0) {
      entryPoints +=
        'Paramètres REQUEST: ' +
        requestAccess
          .map((match) => {
            const result = match.match(/\$_REQUEST\[['"](\w+)['"]\]/);
            return result?.[1] || '';
          })
          .filter((param) => param !== '')
          .join(', ') +
        '. ';
    }

    // Détecter les points d'entrée API
    if (
      fileContent.includes("header('Content-Type: application/json')") ||
      fileContent.includes('json_encode')
    ) {
      entryPoints += "Point d'entrée API JSON détecté. ";
    }

    // Détecter les points d'entrée d'authentification
    if (
      fileContent.includes("$_SESSION['user'") ||
      fileContent.includes("$_SESSION['auth'") ||
      fileContent.includes('isConnected') ||
      fileContent.includes('isLoggedIn')
    ) {
      entryPoints += "Vérification d'authentification utilisateur. ";
    }

    // Si aucun point d'entrée n'a été détecté
    if (entryPoints === '') {
      entryPoints = "Aucun point d'entrée clairement identifiable.";
    }

    return entryPoints;
  }

  /**
   * Analyse l'utilisation des templates dans le fichier PHP
   */
  private analyzeTemplateUsage(): string {
    const fileContent = this.fileContent;
    let templates = '';

    // Détecter les includes et requires
    const includeStatements = fileContent.match(/include(?:_once)?\s*\(['"](.*?)['"].*?\)/g);
    const requireStatements = fileContent.match(/require(?:_once)?\s*\(['"](.*?)['"].*?\)/g);

    // Déclaration explicite du type tableau de chaînes
    const templateFiles: string[] = [];

    if (includeStatements) {
      includeStatements.forEach((statement) => {
        const match = statement.match(/include(?:_once)?\s*\(['"](.*?)['"].*?\)/);
        if (
          match &&
          match[1] &&
          (match[1].includes('tpl') || match[1].includes('template') || match[1].includes('view'))
        ) {
          templateFiles.push(match[1]);
        }
      });
    }

    if (requireStatements) {
      requireStatements.forEach((statement) => {
        const match = statement.match(/require(?:_once)?\s*\(['"](.*?)['"].*?\)/);
        if (
          match &&
          match[1] &&
          (match[1].includes('tpl') || match[1].includes('template') || match[1].includes('view'))
        ) {
          templateFiles.push(match[1]);
        }
      });
    }

    if (templateFiles.length > 0) {
      templates += `Utilisation de ${
        templateFiles.length
      } fichier(s) template : ${templateFiles.join(', ')}. `;
    }

    // Détecter les outputs directs
    const echoStatements = (fileContent.match(/echo\s+/g) || []).length;
    const printStatements = (fileContent.match(/print\s+/g) || []).length;

    if (echoStatements + printStatements > 0) {
      templates += `${
        echoStatements + printStatements
      } instruction(s) d'affichage direct (${echoStatements} echo, ${printStatements} print). `;
    }

    // Détecter les blocs HTML inline
    const htmlBlocks = fileContent.match(/<[a-z][^>]*>/gi);
    if (htmlBlocks && htmlBlocks.length > 0) {
      templates += `${htmlBlocks.length} balises HTML inline détectées. `;
    }

    // Si aucun template n'a été détecté
    if (templates === '') {
      templates = 'Aucune utilisation de template détectée.';
    }

    return templates;
  }
}
