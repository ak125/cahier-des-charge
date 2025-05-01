import fs from 'fs';
import path from 'path';
import { MCPAgent, MCPContext } from '../../coreDoDotmcp-agent';

interface HtaccessRule {
  type:
    | 'redirect'
    | 'rewrite'
    | 'header'
    | 'condition'
    | 'proxy'
    | 'auth'
    | 'errorDocument'
    | 'other';
  original: string;
  pattern?: string;
  target?: string;
  flags?: string[];
  code?: number;
  header?: string;
  value?: string;
  condition?: string;
}

interface HtaccessConfig {
  rules: HtaccessRule[];
  conditions: string[];
  directories: { [path: string]: HtaccessRule[] };
}

export class HtaccessParser implements MCPAgent {
  name = 'HtaccessRouterAnalyzer';
  description = 'Analyse les fichiers .htaccess pour préparer la migration vers Caddy';

  async process(context: MCPContext): Promise<any> {
    const { configPath } = context.inputs;

    if (!configPath || !fs.existsSync(configPath)) {
      return {
        success: false,
        error: `Le fichier .htaccess n'existe pas: ${configPath}`,
      };
    }

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = this.parseHtaccessFile(content);

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur lors de l'analyse du fichier .htaccess: ${error.message}`,
      };
    }
  }

  private parseHtaccessFile(content: string): HtaccessConfig {
    const result: HtaccessConfig = {
      rules: [],
      conditions: [],
      directories: {},
    };

    // Supprimer les commentaires et les lignes vides
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    let currentDirectory: string | null = null;
    let currentConditions: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Début d'un bloc <Directory>
      if (line.match(/<Directory\s+([^>]+)>/i)) {
        const match = line.match(/<Directory\s+([^>]+)>/i);
        currentDirectory = match ? match[1] : null;
        if (currentDirectory && !result.directories[currentDirectory]) {
          result.directories[currentDirectory] = [];
        }
        continue;
      }

      // Fin d'un bloc Directory
      if (line.match(/<\/Directory>/i)) {
        currentDirectory = null;
        continue;
      }

      // Règles de redirection
      if (line.startsWith('Redirect') || line.startsWith('RedirectMatch')) {
        const rule = this.parseRedirectRule(line);
        if (currentDirectory && rule) {
          result.directories[currentDirectory].push(rule);
        } else if (rule) {
          result.rules.push(rule);
        }
        continue;
      }

      // Règles de réécriture
      if (line.startsWith('RewriteRule')) {
        const rule = this.parseRewriteRule(line, currentConditions);
        if (currentDirectory && rule) {
          result.directories[currentDirectory].push(rule);
        } else if (rule) {
          result.rules.push(rule);
        }
        currentConditions = []; // Réinitialiser après utilisation
        continue;
      }

      // Conditions de réécriture
      if (line.startsWith('RewriteCond')) {
        const condition = this.parseRewriteCondition(line);
        if (condition) {
          currentConditions.push(condition);
          result.conditions.push(condition);
        }
        continue;
      }

      // Activation du moteur de réécriture
      if (line === 'RewriteEngine On' || line === 'RewriteEngine on') {
        continue;
      }

      // Règles d'en-tête
      if (line.startsWith('Header ')) {
        const rule = this.parseHeaderRule(line);
        if (currentDirectory && rule) {
          result.directories[currentDirectory].push(rule);
        } else if (rule) {
          result.rules.push(rule);
        }
        continue;
      }

      // Documents d'erreur
      if (line.startsWith('ErrorDocument ')) {
        const rule = this.parseErrorDocument(line);
        if (currentDirectory && rule) {
          result.directories[currentDirectory].push(rule);
        } else if (rule) {
          result.rules.push(rule);
        }
        continue;
      }

      // Règles d'authentification
      if (
        line.startsWith('AuthType ') ||
        line.startsWith('AuthName ') ||
        line.startsWith('AuthUserFile ') ||
        line.startsWith('Require ')
      ) {
        const rule: HtaccessRule = {
          type: 'auth',
          original: line,
        };
        if (currentDirectory) {
          result.directories[currentDirectory].push(rule);
        } else {
          result.rules.push(rule);
        }
        continue;
      }

      // Autres règles
      const otherRule: HtaccessRule = {
        type: 'other',
        original: line,
      };

      if (currentDirectory) {
        result.directories[currentDirectory].push(otherRule);
      } else {
        result.rules.push(otherRule);
      }
    }

    return result;
  }

  private parseRedirectRule(line: string): HtaccessRule | null {
    // Redirect [status] URL-path URL
    // RedirectMatch [status] regex URL
    const match = line.match(/^Redirect(Match)?\s+(?:(\d+)\s+)?([^\s]+)\s+([^\s]+)$/i);

    if (!match) return null;

    return {
      type: 'redirect',
      original: line,
      pattern: match[3],
      target: match[4],
      code: match[2] ? parseInt(match[2]) : 302,
      flags: [],
    };
  }

  private parseRewriteRule(line: string, conditions: string[]): HtaccessRule | null {
    // RewriteRule pattern target [flags]
    const match = line.match(/^RewriteRule\s+([^\s]+)\s+([^\s]+)(?:\s+\[([^\]]+)\])?$/i);

    if (!match) return null;

    return {
      type: 'rewrite',
      original: line,
      pattern: match[1],
      target: match[2],
      flags: match[3] ? match[3].split(',').map((f) => f.trim()) : [],
      condition: conditions.length > 0 ? conditions.join(' && ') : undefined,
    };
  }

  private parseRewriteCondition(line: string): string | null {
    // RewriteCond TestString CondPattern [flags]
    const match = line.match(/^RewriteCond\s+([^\s]+)\s+([^\s]+)(?:\s+\[([^\]]+)\])?$/i);

    if (!match) return null;

    return `${match[1]} ${match[2]} ${match[3] || ''}`.trim();
  }

  private parseHeaderRule(line: string): HtaccessRule | null {
    // Header [condition] action header value
    const match = line.match(/^Header\s+(?:\[([^\]]+)\]\s+)?(\w+)\s+([^\s]+)\s+(.+)$/i);

    if (!match) return null;

    return {
      type: 'header',
      original: line,
      condition: match[1],
      value: match[2], // action (set, add, append, etc.)
      header: match[3],
      target: match[4].replace(/^"(.*)"$/, '$1'),
    };
  }

  private parseErrorDocument(line: string): HtaccessRule | null {
    // ErrorDocument error-code document
    const match = line.match(/^ErrorDocument\s+(\d+)\s+(.+)$/i);

    if (!match) return null;

    return {
      type: 'errorDocument',
      original: line,
      code: parseInt(match[1]),
      target: match[2],
    };
  }
}

export default new HtaccessParser();
