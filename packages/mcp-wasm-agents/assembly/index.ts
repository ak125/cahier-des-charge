// Agent WASM de validation MCP 2.0
// Un exemple simple d'implémentation d'agent de validation en AssemblyScript

// Structure de données pour les entrées/sorties
class ValidationResult {
  isValid: boolean;
  errors: string[];

  constructor(isValid: boolean = true) {
    this.isValid = isValid;
    this.errors = new Array<string>();
  }

  addError(error: string): void {
    this.errors.push(error);
    this.isValid = false;
  }
}

// Interface d'agent de validation
export function validateInput(input: string): string {
  const result = new ValidationResult();

  // Validation simple: vérifie si l'entrée est au format JSON
  if (input.length < 2 || (input.charAt(0) !== '{' && input.charAt(0) !== '[')) {
    result.addError("L'entrée doit être au format JSON");
  } else {
    // Vérification basique de la structure sans utiliser try/catch
    let openBraces = 0;
    let openBrackets = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input.charAt(i);
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }

    if (openBraces !== 0) {
      result.addError("Le JSON contient des accolades non équilibrées");
    }

    if (openBrackets !== 0) {
      result.addError("Le JSON contient des crochets non équilibrés");
    }
  }

  // Convertit le résultat en chaîne JSON pour le retour
  let jsonResult = '{';
  jsonResult += '"isValid":' + (result.isValid ? 'true' : 'false') + ',';
  jsonResult += '"errors":[';

  for (let i = 0; i < result.errors.length; i++) {
    jsonResult += '"' + result.errors[i] + '"';
    if (i < result.errors.length - 1) {
      jsonResult += ',';
    }
  }

  jsonResult += ']}';
  return jsonResult;
}

// Fonction d'audit de sécurité
export function securityAudit(input: string): string {
  const result = new ValidationResult();

  // Recherche de motifs potentiellement dangereux
  if (input.includes("eval(") || input.includes("Function(")) {
    result.addError("Code potentiellement dangereux détecté: utilisation d'évaluation dynamique");
  }

  if (input.includes("<script>")) {
    result.addError("Code potentiellement dangereux détecté: balise script");
  }

  // Convertit le résultat en chaîne JSON pour le retour
  let jsonResult = '{';
  jsonResult += '"isSecure":' + (result.isValid ? 'true' : 'false') + ',';
  jsonResult += '"vulnerabilities":[';

  for (let i = 0; i < result.errors.length; i++) {
    jsonResult += '"' + result.errors[i] + '"';
    if (i < result.errors.length - 1) {
      jsonResult += ',';
    }
  }

  jsonResult += ']}';
  return jsonResult;
}
