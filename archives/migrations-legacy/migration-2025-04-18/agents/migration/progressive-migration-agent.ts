import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
// filepath: /workspaces/cahier-des-charge/agents/progressive-migration-agent.ts
import { BaseAgent } from '../core/base-agent';

interface ProxyConfig {
  phpEndpoint: string;
  nestjsEndpoint: string;
  routePattern: string;
  migrationStatus: 'not-started' | 'in-progress' | 'completed';
  fallbackToPhp: boolean;
  metrics: boolean;
}

export class ProgressiveMigrationAgent extends BaseAgent {
  private proxyConfigs: ProxyConfig[] = [];
  private proxyConfigPath: string;

  constructor(filePath: string) {
    super(filePath);
    const workspaceRoot = process.cwd();
    this.proxyConfigPath = path.join(workspaceRoot, 'config', 'proxy-migration.json');
  }

  /**
   * Analyse la structure du fichier PHP et génère une configuration
   * pour la migration progressive
   */
  public async analyze(): Promise<void> {
    await this.loadFile();

    // Charger les configurations existantes si elles existent
    await this.loadProxyConfigs();

    // Analyser les routes et points d'entrée
    const routePattern = this.detectRoutePattern();

    // Ajouter ou mettre à jour la configuration
    this.updateProxyConfig(routePattern);

    // Générer la section d'audit
    const migrationSection = this.generateProgressiveMigrationSection();

    // Ajouter la section au rapport
    this.addSection(
      'progressive-migration',
      'Migration Progressive',
      migrationSection,
      'technical'
    );

    // Sauvegarder les configurations mises à jour
    await this.saveProxyConfigs();
  }

  /**
   * Détecte le pattern de route à partir du fichier PHP
   */
  private detectRoutePattern(): string {
    const fileContent = this.fileContent;
    const fileName = path.basename(this.filePath, '.php');

    // Analyse du fichier pour détecter les patterns de routage
    // Détecter si c'est un point d'entrée direct, une API, etc.
    let routePattern = '';

    // Vérifier s'il y a une route explicite
    const routeMatch = fileContent.match(/['"]route['"]\s*=>?\s*['"]([^'"]+)['"]/i);
    if (routeMatch && routeMatch[1]) {
      routePattern = routeMatch[1];
    }
    // Vérifier s'il y a une définition de API
    else if (
      fileContent.includes('api') ||
      fileContent.includes('REST') ||
      fileContent.includes('json_encode')
    ) {
      routePattern = `/api/${fileName}`;
    }
    // Sinon, proposer une route basée sur le nom du fichier
    else {
      routePattern = `/${fileName}`;
    }

    return routePattern;
  }

  /**
   * Charge les configurations de proxy existantes
   */
  private async loadProxyConfigs(): Promise<void> {
    try {
      if (fs.existsSync(this.proxyConfigPath)) {
        const configData = await fsPromises.readFile(this.proxyConfigPath, 'utf8');
        this.proxyConfigs = JSON.parse(configData);
      }
    } catch (error: unknown) {
      console.warn(`Pas de configuration de proxy existante trouvée. Création d'une nouvelle.`);
      this.proxyConfigs = [];
    }
  }

  /**
   * Met à jour ou ajoute une configuration de proxy
   */
  private updateProxyConfig(routePattern: string): void {
    const fileName = path.basename(this.filePath, '.php');

    // Vérifier si la configuration existe déjà
    const existingConfigIndex = this.proxyConfigs.findIndex(
      (config) => config.routePattern === routePattern || config.phpEndpoint.includes(fileName)
    );

    // Config par défaut
    const newConfig: ProxyConfig = {
      phpEndpoint: `/legacy/${fileName}.php`,
      nestjsEndpoint: `/api/${fileName}`,
      routePattern,
      migrationStatus: 'not-started',
      fallbackToPhp: true,
      metrics: true,
    };

    // Mise à jour ou ajout
    if (existingConfigIndex !== -1) {
      this.proxyConfigs[existingConfigIndex] = {
        ...this.proxyConfigs[existingConfigIndex],
        routePattern,
      };
    } else {
      this.proxyConfigs.push(newConfig);
    }
  }

  /**
   * Sauvegarde les configurations de proxy
   */
  private async saveProxyConfigs(): Promise<void> {
    try {
      // Créer le répertoire s'il n'existe pas
      const configDir = path.dirname(this.proxyConfigPath);
      if (!fs.existsSync(configDir)) {
        await fsPromises.mkdir(configDir, { recursive: true });
      }

      // Sauvegarder le fichier de configuration
      await fsPromises.writeFile(
        this.proxyConfigPath,
        JSON.stringify(this.proxyConfigs, null, 2),
        'utf8'
      );

      console.log(
        `✅ Configuration de migration progressive sauvegardée dans ${this.proxyConfigPath}`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Erreur lors de la sauvegarde des configurations: ${errorMessage}`);
    }
  }

  /**
   * Génère la section d'audit pour la migration progressive
   */
  private generateProgressiveMigrationSection(): string {
    const fileName = path.basename(this.filePath, '.php');
    const config = this.proxyConfigs.find(
      (config) => config.phpEndpoint.includes(fileName) || config.routePattern.includes(fileName)
    );

    if (!config) {
      return 'Configuration de migration progressive non disponible.';
    }

    return `## Migration Progressive

### Configuration du proxy de migration

\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`

### Stratégie de migration progressive

1. **Phase initiale** : Toutes les requêtes sont dirigées vers le code PHP existant
2. **Phase intermédiaire** : Les requêtes sont dirigées vers le nouveau code NestJS avec fallback PHP
3. **Phase finale** : Toutes les requêtes sont dirigées vers le nouveau code NestJS

### Tests A/B pendant la migration

Pour effectuer des tests A/B avec les deux implémentations :

\`\`\`bash
# Activer le test A/B pour cette route
./scripts/enable-ab-testing.sh ${config.routePattern} --split=50
\`\`\`

### Suivi des métriques

Les métriques comparatives suivantes seront collectées :
- Temps de réponse
- Utilisation CPU/mémoire
- Taux d'erreur
- Satisfaction utilisateur

### Instructions pour la transition complète

Une fois la migration validée :

\`\`\`bash
# Marquer le composant comme complètement migré
./scripts/complete-migration.sh ${config.routePattern}
\`\`\`
`;
  }

  /**
   * Génère la configuration du proxy pour nginx/apache
   */
  public async generateProxyConfig(): Promise<string> {
    const config = this.proxyConfigs.find((config) =>
      config.phpEndpoint.includes(path.basename(this.filePath, '.php'))
    );

    if (!config) {
      throw new Error('Configuration non trouvée pour ce fichier');
    }

    // Générer la configuration pour nginx
    const nginxConfig = `
# Configuration Nginx pour la migration progressive de ${config.routePattern}
location ${config.routePattern} {
    # Tentative vers le nouveau backend NestJS
    proxy_pass http://nestjs_backend${config.nestjsEndpoint};
    proxy_intercept_errors on;
    
    # En cas d'erreur, fallback vers PHP si activé
    error_page 404 502 504 = @php_fallback_${config.routePattern.replace(/\//g, '_')};
    
    # Headers pour métriques
    add_header X-Migration-Status "${config.migrationStatus}";
    add_header X-Served-By "nestjs";
}

# Fallback location pour PHP
location @php_fallback_${config.routePattern.replace(/\//g, '_')} {
    proxy_pass http://php_backend${config.phpEndpoint};
    add_header X-Migration-Status "${config.migrationStatus}";
    add_header X-Served-By "php-fallback";
}
`;

    // Sauvegarder la configuration nginx
    const nginxConfigPath = path.join(
      process.cwd(),
      'config',
      'nginx',
      `${path.basename(this.filePath, '.php')}.conf`
    );

    // Créer le répertoire si nécessaire
    const nginxDir = path.dirname(nginxConfigPath);
    if (!fs.existsSync(nginxDir)) {
      await fsPromises.mkdir(nginxDir, { recursive: true });
    }

    // Écrire le fichier
    await fsPromises.writeFile(nginxConfigPath, nginxConfig, 'utf8');
    console.log(`✅ Configuration nginx générée: ${nginxConfigPath}`);

    return nginxConfigPath;
  }
}

// Point d'entrée si exécuté directement
if (require.main === module) {
  if (process.argv.length < 3) {
    console.error('Usage: node progressive-migration-agent.ts <file-path>');
    process.exit(1);
  }

  const filePath = process.argv[2];
  const agent = new ProgressiveMigrationAgent(filePath);

  agent
    .analyze()
    .then(() => agent.generateProxyConfig())
    .then((configPath) => {
      console.log(`✅ Agent de migration progressive exécuté avec succès pour ${filePath}`);
      console.log(`✅ Configuration générée: ${configPath}`);
    })
    .catch((error) => {
      console.error(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
