// Agent WASM de validation MCP 2.0
// Implémentation optimisée pour AssemblyScript

/**
 * Structure de données pour les résultats de validation
 */
class ValidationResult {
  isValid: boolean;
  errors: Array<string>;

  constructor() {
    this.isValid = true;
    this.errors = new Array<string>();
  }

  addError(error: string): void {
    this.errors.push(error);
    this.isValid = false;
  }

  toJSON(): string {
    let result = "{\"isValid\":" + (this.isValid ? "true" : "false") + ",\"errors\":[";

    for (let i = 0; i < this.errors.length; i++) {
      result += "\"" + this.errors[i] + "\"";
      if (i < this.errors.length - 1) {
        result += ",";
      }
    }

    result += "]}";
    return result;
  }
}

/**
 * Vérifie si une chaîne contient un sous-texte
 */
function stringContains(text: string, search: string): boolean {
  return text.indexOf(search) >= 0;
}

/**
 * Valide que l'entrée est au format JSON bien formé
 * @param input - La chaîne JSON à valider
 * @returns Un résultat JSON avec isValid et les erreurs éventuelles
 */
export function validateJson(input: string): string {
  const result = new ValidationResult();

  // Vérification de base pour s'assurer que c'est un JSON
  if (input.length < 2) {
    result.addError("L'entrée est trop courte pour être un JSON valide");
    return result.toJSON();
  }

  const firstChar = input.charAt(0);
  const lastChar = input.charAt(input.length - 1);

  // Vérification des caractères d'ouverture/fermeture
  if ((firstChar !== '{' && firstChar !== '[') ||
    (lastChar !== '}' && lastChar !== ']')) {
    result.addError("L'entrée n'a pas les délimiteurs JSON requis");
    return result.toJSON();
  }

  // Vérification de l'équilibre des accolades et crochets
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input.charAt(i);

    // Gestion des chaînes de caractères
    if (char === '"' && !escaped) {
      inString = !inString;
    } else if (char === '\\' && !escaped) {
      escaped = true;
      continue;
    } else if (escaped) {
      escaped = false;
      continue;
    }

    // Ignorer les caractères à l'intérieur des chaînes
    if (inString) continue;

    // Comptage des délimiteurs
    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;
    else if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;

    // Détection des déséquilibres immédiats
    if (braceCount < 0 || bracketCount < 0) {
      result.addError("Fermeture inattendue d'un délimiteur JSON");
      return result.toJSON();
    }
  }

  // Vérification finale de l'équilibre
  if (braceCount !== 0) {
    result.addError("Accolades déséquilibrées: " + braceCount.toString());
  }

  if (bracketCount !== 0) {
    result.addError("Crochets déséquilibrés: " + bracketCount.toString());
  }

  if (inString) {
    result.addError("Chaîne de caractères non fermée");
  }

  return result.toJSON();
}

/**
 * Effectue un audit de sécurité sur l'entrée
 * @param input - La chaîne à vérifier pour des problèmes de sécurité
 * @returns Un objet JSON avec le statut de sécurité et les vulnérabilités détectées
 */
export function securityAudit(input: string): string {
  const result = new ValidationResult();

  // Recherche de modèles potentiellement dangereux
  if (stringContains(input, "eval(")) {
    result.addError("Code potentiellement dangereux: utilisation d'eval()");
  }

  if (stringContains(input, "Function(")) {
    result.addError("Code potentiellement dangereux: constructeur Function");
  }

  if (stringContains(input, "<script>")) {
    result.addError("Code potentiellement dangereux: balise script");
  }

  if (stringContains(input, "document.write")) {
    result.addError("Code potentiellement dangereux: document.write");
  }

  if (stringContains(input, "innerHTML") || stringContains(input, "outerHTML")) {
    result.addError("Utilisation potentiellement dangereuse de innerHTML/outerHTML");
  }

  // Formatage du résultat pour le retour
  const jsonResult = "{\"isSecure\":" + (result.isValid ? "true" : "false") +
    ",\"vulnerabilities\":[" +
    result.errors.map<string>((error: string): string => "\"" + error + "\"").join(",") +
    "]}";

  return jsonResult;
}

/**
 * Valide un objet MCP en vérifiant sa structure
 * @param input - La chaîne JSON représentant un objet MCP
 * @returns Un objet JSON avec le statut de validation et les erreurs
 */
export function validateMcpObject(input: string): string {
  const result = new ValidationResult();

  // D'abord valider que c'est un JSON valide
  const jsonValidation = validateJson(input);
  if (stringContains(jsonValidation, "\"isValid\":false")) {
    result.addError("JSON invalide");
    return result.toJSON();
  }

  // Vérifications de base pour un objet MCP
  if (!stringContains(input, "\"type\":")) {
    result.addError("L'objet MCP doit avoir un champ 'type'");
  }

  if (!stringContains(input, "\"version\":")) {
    result.addError("L'objet MCP doit avoir un champ 'version'");
  }

  if (!stringContains(input, "\"data\":")) {
    result.addError("L'objet MCP doit avoir un champ 'data'");
  }

  return result.toJSON();
}

/**
 * Structure pour représenter un schéma MCP
 */
class McpSchema {
  type: string;
  properties: Map<string, string>;
  required: Array<string>;

  constructor(type: string) {
    this.type = type;
    this.properties = new Map<string, string>();
    this.required = new Array<string>();
  }
}

/**
 * Valide un objet MCP par rapport à un schéma spécifique
 * @param input - La chaîne JSON représentant un objet MCP
 * @param schemaType - Le type de schéma à utiliser pour la validation
 * @returns Un objet JSON avec le statut de validation et les erreurs
 */
export function validateMcpSchema(input: string, schemaType: string): string {
  const result = new ValidationResult();

  // D'abord valider que c'est un objet MCP valide
  const mcpValidation = validateMcpObject(input);
  if (stringContains(mcpValidation, "\"isValid\":false")) {
    result.addError("Objet MCP invalide");
    return result.toJSON();
  }

  // Définir les schémas disponibles
  const schemas = new Map<string, McpSchema>();

  // Schéma pour "agent"
  const agentSchema = new McpSchema("agent");
  agentSchema.properties.set("id", "string");
  agentSchema.properties.set("name", "string");
  agentSchema.properties.set("capabilities", "array");
  agentSchema.required.push("id");
  agentSchema.required.push("name");
  schemas.set("agent", agentSchema);

  // Schéma pour "workflow"
  const workflowSchema = new McpSchema("workflow");
  workflowSchema.properties.set("id", "string");
  workflowSchema.properties.set("steps", "array");
  workflowSchema.required.push("id");
  workflowSchema.required.push("steps");
  schemas.set("workflow", workflowSchema);

  // Récupérer le schéma demandé
  const schema = schemas.get(schemaType);
  if (!schema) {
    result.addError("Type de schéma inconnu: " + schemaType);
    return result.toJSON();
  }

  // Vérifier que l'objet MCP a le bon type
  if (!stringContains(input, "\"type\":\"" + schemaType + "\"")) {
    result.addError("L'objet MCP n'a pas le type requis: " + schemaType);
  }

  // Vérifier la présence des champs requis
  for (let i = 0; i < schema.required.length; i++) {
    const field = schema.required[i];
    if (!stringContains(input, "\"" + field + "\":")) {
      result.addError("Champ requis manquant: " + field);
    }
  }

  return result.toJSON();
}

/**
 * Optimise un objet MCP en supprimant les champs redondants ou inutiles
 * @param input - La chaîne JSON représentant un objet MCP
 * @returns L'objet MCP optimisé sous forme de chaîne JSON
 */
export function optimizeMcpObject(input: string): string {
  const result = new ValidationResult();

  // Vérifier que c'est un objet MCP valide
  const mcpValidation = validateMcpObject(input);
  if (stringContains(mcpValidation, "\"isValid\":false")) {
    result.addError("Impossible d'optimiser un objet MCP invalide");
    return result.toJSON();
  }

  // Dans une implémentation réelle, cette fonction analyserait la structure JSON 
  // et supprimerait les champs redondants ou inutiles.
  // Pour l'instant, cela renvoie simplement une indication que l'optimisation est possible.

  result.addError("Fonction d'optimisation à implémenter");
  return "{ \"original\": " + input + ", \"optimized\": " + input + ", \"savings\": 0 }";
}
