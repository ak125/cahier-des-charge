import chalk from 'chalk';
import { readFileSync } from './fsstructure-agent';
import { basename, extname } from './pathstructure-agent';

interface VerificationResult {
  fileType: string;
  file: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

export class SyntaxVerifier {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async verify(
    mdFiles: string[],
    jsonFiles: string[],
    tsFiles: string[]
  ): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    // Vérifier la syntaxe Markdown
    results.push(...this.checkMarkdownSyntax(mdFiles));

    // Vérifier la syntaxe JSON
    results.push(...this.checkJsonSyntax(jsonFiles));

    // Vérifier la syntaxe TypeScript
    results.push(...this.checkTypeScriptSyntax(tsFiles));

    return results;
  }

  private checkMarkdownSyntax(mdFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];

    for (const mdFile of mdFiles) {
      const content = readFileSync(mdFile, 'utf-8');
      const lines = content.split('\n');

      // Vérifier les liens cassés (format incorrect)
      const brokenLinkLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Rechercher des motifs de liens incorrects
        if (line.includes('](') && !line.match(/\[.*\]\(.*\)/)) {
          brokenLinkLines.push(i + 1);
        }
      }

      if (brokenLinkLines.length > 0) {
        results.push({
          fileType: 'md',
          file: mdFile,
          status: 'warning',
          message: `${brokenLinkLines.length} liens malformés détectés`,
          details: [`Lignes: ${brokenLinkLines.join(', ')}`],
        });
      }

      // Vérifier les titres sans espace après #
      const badHeaderLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.match(/^#{1,6}[^\s]/)) {
          badHeaderLines.push(i + 1);
        }
      }

      if (badHeaderLines.length > 0) {
        results.push({
          fileType: 'md',
          file: mdFile,
          status: 'warning',
          message: `${badHeaderLines.length} titres mal formatés (espace manquant après #)`,
          details: [`Lignes: ${badHeaderLines.join(', ')}`],
        });
      }

      // Vérifier le code inline JavaScript si non autorisé
      if (!this.config.rules.allowInlineJS) {
        const inlineJsLines = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.includes('<script>') || line.includes('javascript:')) {
            inlineJsLines.push(i + 1);
          }
        }

        if (inlineJsLines.length > 0) {
          results.push({
            fileType: 'md',
            file: mdFile,
            status: 'warning',
            message: `${inlineJsLines.length} instances de JavaScript inline détectées`,
            details: [`Lignes: ${inlineJsLines.join(', ')}`],
          });
        }
      }

      // Succès si aucun problème n'a été trouvé
      if (!results.some((r) => r.file === mdFile)) {
        results.push({
          fileType: 'md',
          file: mdFile,
          status: 'success',
          message: 'Syntaxe Markdown valide',
        });
      }
    }

    return results;
  }

  private checkJsonSyntax(jsonFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];

    for (const jsonFile of jsonFiles) {
      try {
        const content = readFileSync(jsonFile, 'utf-8');

        // Vérifier si le JSON est valide
        JSON.parse(content);

        // Vérifier le formatage du JSON
        const formattingIssues = this.checkJsonFormatting(content);

        if (formattingIssues.length > 0) {
          results.push({
            fileType: 'json',
            file: jsonFile,
            status: 'warning',
            message: 'Problèmes de formatage JSON',
            details: formattingIssues,
          });
        } else {
          results.push({
            fileType: 'json',
            file: jsonFile,
            status: 'success',
            message: 'Syntaxe JSON valide',
          });
        }
      } catch (error) {
        results.push({
          fileType: 'json',
          file: jsonFile,
          status: 'error',
          message: 'Erreur de parsing JSON',
          details: [`${error.message}`],
        });
      }
    }

    return results;
  }

  private checkJsonFormatting(content: string): string[] {
    const issues = [];
    const lines = content.split('\n');

    // Vérifier l'indentation
    let expectedIndent = 0;
    let previousIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') continue;

      const currentIndent = lines[i].length - lines[i].trimLeft().length;

      // Mise à jour de l'indentation attendue
      if (line === '{' || line === '[') {
        previousIndent = expectedIndent;
        expectedIndent += 2;
      } else if (line === '}' || line === ']' || line.endsWith('}') || line.endsWith(']')) {
        expectedIndent = previousIndent;
      }

      // Vérifier si l'indentation est correcte (multiple de 2)
      if (currentIndent % 2 !== 0) {
        issues.push(`Ligne ${i + 1}: indentation irrégulière (${currentIndent} espaces)`);
      }
    }

    // Vérifier les virgules
    let inString = false;
    let currentLine = 1;

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '"' && (i === 0 || content[i - 1] !== '\\')) {
        inString = !inString;
      } else if (content[i] === '\n') {
        currentLine++;
      } else if (!inString) {
        if (content[i] === ',' && i < content.length - 1) {
          if (![' ', '\n', '\r'].includes(content[i + 1])) {
            issues.push(`Ligne ${currentLine}: pas d'espace après la virgule`);
          }
        }
      }
    }

    return issues;
  }

  private checkTypeScriptSyntax(tsFiles: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];

    for (const tsFile of tsFiles) {
      try {
        const content = readFileSync(tsFile, 'utf-8');
        const lines = content.split('\n');

        // Vérifications basiques de syntaxe (très simplifiées)
        const syntaxIssues = [];
        let braceBalance = 0;
        let parenBalance = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Compter les accolades
          for (const char of line) {
            if (char === '{') braceBalance++;
            if (char === '}') braceBalance--;
            if (char === '(') parenBalance++;
            if (char === ')') parenBalance--;
          }

          // Détecter les erreurs communes
          if (line.includes('import') && !line.includes('from') && !line.endsWith(';')) {
            syntaxIssues.push(`Ligne ${i + 1}: import incomplet ou sans point-virgule`);
          }

          if (line.includes('class') && !line.includes('{')) {
            syntaxIssues.push(`Ligne ${i + 1}: déclaration de classe sans bloc`);
          }

          if (line.includes('function') && !line.includes('{') && !line.endsWith(';')) {
            syntaxIssues.push(`Ligne ${i + 1}: déclaration de fonction sans bloc ni point-virgule`);
          }
        }

        // Vérifier les accolades et parenthèses non équilibrées
        if (braceBalance !== 0) {
          syntaxIssues.push(
            `Accolades non équilibrées (${braceBalance > 0 ? 'manque' : 'trop'} de })`
          );
        }

        if (parenBalance !== 0) {
          syntaxIssues.push(
            `Parenthèses non équilibrées (${parenBalance > 0 ? 'manque' : 'trop'} de ))`
          );
        }

        if (syntaxIssues.length > 0) {
          results.push({
            fileType: 'ts',
            file: tsFile,
            status: 'warning',
            message: `${syntaxIssues.length} problèmes de syntaxe potentiels`,
            details: syntaxIssues,
          });
        } else {
          results.push({
            fileType: 'ts',
            file: tsFile,
            status: 'success',
            message: 'Syntaxe TypeScript valide (vérification basique)',
          });
        }
      } catch (error) {
        results.push({
          fileType: 'ts',
          file: tsFile,
          status: 'error',
          message: `Erreur lors de l'analyse du fichier`,
          details: [`${error.message}`],
        });
      }
    }

    return results;
  }
}
