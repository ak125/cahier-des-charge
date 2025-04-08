# Suivi automatisé par agents IA & orchestration documentaire

## 🔄 Orchestration distribuée via n8n

- Chaque phase du projet (analyse, génération, QA, intégration, déploiement) est orchestrée par des workflows n8n interconnectés.
- Les agents spécialisés (ex. `php-analyzer`, `sql-mapper`, `dev-generator`, `seo-rewriter`) sont appelés automatiquement avec les bons paramètres.
- Chaque action déclenche :
  - Une mise à jour du backlog (`migration_backlog.json`)
  - Un log dans le système de suivi (`execution_log.json`)
  - Un push GitHub si besoin (via MCP)

### Architecture des workflows

```
n8n-workflows/
├── 01-analyse/
│   ├── php-code-analyzer.json
│   ├── sql-schema-analyzer.json
│   └── seo-routes-analyzer.json
├── 02-generation/
│   ├── nestjs-module-generator.json
│   ├── remix-route-generator.json
│   └── prisma-schema-generator.json
├── 03-validation/
│   ├── code-quality-checker.json
│   ├── test-generator.json
│   └── seo-validator.json
└── 04-documentation/
    ├── docs-updater.json
    ├── changelog-generator.json
    └── dashboard-updater.json
```

### Exemple de workflow : Module Migration

1. **Déclencheur** : Upload d'un fichier PHP ou ajout à la file d'attente
2. **Analyse** : Extraction de la logique métier et dépendances
3. **Préparation** : Vérification des fichiers connexes et dépendances
4. **Génération** : Création des fichiers NestJS et Remix correspondants
5. **Tests** : Génération automatique des tests unitaires
6. **Validation** : Vérification de cohérence et qualité du code
7. **Documentation** : Mise à jour du cahier des charges et Google Docs
8. **Notification** : Alerte dans Slack/Teams avec résumé des changements

## 📝 Synchronisation dynamique du cahier des charges

- Un agent `docs-writer.ts` surveille les mises à jour du backlog et des fichiers générés.
- Il met automatiquement à jour les sections suivantes du cahier des charges (Google Docs) :
  - Feuille de route
  - Liste des modules migrés
  - Journal des modifications (changelog)
  - État d'avancement
- Les mises à jour suivent un format horodaté et traçable (markdown + versioning)

### Implémentation

```typescript
// Structure de l'agent docs-writer.ts
interface DocsUpdatePayload {
  section: string;        // Identifiant de la section à mettre à jour
  content: string;        // Contenu Markdown à insérer
  mode: 'append'|'replace'|'update'; // Mode de mise à jour
  metadata: {
    author: string;       // Agent source ou utilisateur
    timestamp: Date;      // Horodatage
    related_files?: string[]; // Fichiers concernés
  }
}

class DocsWriterAgent {
  private googleDocsClient: GoogleDocsClient;
  private githubClient: GithubClient;
  
  constructor() {
    // Initialisation des clients API
  }
  
  async updateSection(payload: DocsUpdatePayload): Promise<boolean> {
    // Logique de mise à jour du document
    // ...
    
    // Journalisation de la modification
    await this.logChange(payload);
    
    return true;
  }
  
  private async logChange(payload: DocsUpdatePayload): Promise<void> {
    // Ajouter l'entrée au journal des modifications
    // ...
  }
}
```

### Sections automatiquement maintenues

| Section | Source de données | Fréquence | Format |
|---------|-------------------|-----------|--------|
| Modules migrés | GitHub + n8n | Temps réel | Tableau + métriques |
| Changelog | Git commits + agents | Quotidien | Liste chronologique |
| Backlog | n8n + MCP | Temps réel | Kanban (ToDo/In Progress/Done) |
| Bugs & Blockers | n8n + GitHub Issues | Temps réel | Liste priorisée |
| Métriques | CI/CD + Monitoring | Quotidien | Graphes et KPIs |

## 🔐 Sécurité et contrôle des modifications

- Toutes les modifications générées par des IA sont validées par un agent `change-verifier.ts`
- L'historique est conservé en double :
  - Google Docs (journal en clair)
  - GitHub (`cahier-des-charges.changelog.md`)
- En cas de divergence, une alerte est envoyée dans un canal de validation (mail, webhook ou n8n UI)

### Stratégie de validation

```typescript
// Agent change-verifier.ts
interface ChangeVerificationPayload {
  changeType: 'code' | 'docs' | 'schema',
  generatedBy: string,          // ID de l'agent
  content: {
    before?: string,            // Contenu avant modification
    after: string,              // Contenu après modification
    diff?: string               // Diff calculé
  },
  metadata: {
    timestamp: Date,
    relatedModule: string,
    impact: 'low' | 'medium' | 'high'
  }
}

class ChangeVerifierAgent {
  async verifyChange(payload: ChangeVerificationPayload): Promise<ValidationResult> {
    // 1. Vérification syntaxique
    // 2. Vérification sémantique
    // 3. Vérification de conformité avec le cahier des charges
    // 4. Génération du rapport de validation
    
    return {
      isValid: boolean,
      warnings: string[],
      suggestions: string[],
      requiresHumanReview: boolean
    };
  }
}
```

## 📚 Journal automatique des évolutions

- Chaque action IA (analyse, génération, test, insertion) crée une ligne dans un tableau de suivi :
  - Type d'action (analyse/génération/migration)
  - Fichier ou module concerné
  - Agent déclencheur
  - Résultat (succès/échec)
  - Timestamp horodaté

### Exemple de journal

| Date       | Action         | Module            | Agent           | Résultat  |
|------------|----------------|-------------------|------------------|-----------|
| 2025-04-06 | Génération     | Shopping_Cart     | dev-generator.ts | Succès    |
| 2025-04-06 | Analyse SQL    | AUTO_MARQUE       | sql-analyzer     | Succès    |
| 2025-04-06 | Relecture SEO  | fiche.php         | seo-verifier     | À valider |

### Structure du journal

```json
{
  "timestamp": "2023-08-01T14:32:45Z",
  "agent": "dev-generator",
  "action": "generate_controller",
  "input": {
    "php_file": "admin/products.php",
    "module": "ProductsModule"
  },
  "output": {
    "files_created": [
      "apps/api/src/products/products.controller.ts",
      "apps/api/src/products/products.service.ts",
      "apps/api/src/products/dto/product.dto.ts"
    ],
    "status": "success",
    "warnings": []
  },
  "metadata": {
    "execution_time": 3.2,
    "tokens_used": 1250,
    "model": "gpt-4"
  }
}
```

### Exploitation du journal

Les données du journal alimentent:

1. **Tableaux de bord temps réel**
   - Progression de la migration
   - Efficacité des agents IA
   - Points bloquants

2. **Rapports périodiques**
   - Synthèse hebdomadaire avec métriques clés
   - Historique de conversion par module

3. **Analyse prédictive**
   - Estimation du temps restant
   - Identification des modules à risque
   - Suggestions d'optimisation

4. **Audit et traçabilité**
   - Historique complet des modifications
   - Attribution précise des changements
   - Conformité avec les exigences documentaires
