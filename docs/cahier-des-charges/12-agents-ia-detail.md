# Structure et fonctionnement des agents IA

## 🤖 Vue d'ensemble de l'architecture des agents

L'architecture d'automatisation IA repose sur trois piliers principaux :
1. **Agents spécialisés** - Programmes TypeScript intégrant des LLMs pour des tâches spécifiques
2. **Orchestrateur n8n** - Gère les workflows et la coordination entre agents
3. **MCP (Master Control Program)** - Supervise l'ensemble des opérations et prend les décisions finales

```
                             ┌───────────────┐
                             │      MCP      │
                             │(Supervision & │
                             │  Décisions)   │
                             └───────┬───────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
         ┌───────▼──────┐    ┌───────▼──────┐    ┌───────▼──────┐
         │     n8n      │    │  Code Server │    │  Repository  │
         │(Orchestration)│    │  (Exécution) │    │   (GitHub)   │
         └───────┬──────┘    └───────┬──────┘    └───────┬──────┘
                 │                   │                   │
    ┌────────────┼───────────┬──────┴──────────┬────────┴────────┐
    │            │           │                 │                 │
┌───▼───┐    ┌───▼───┐   ┌───▼───┐        ┌────▼────┐      ┌─────▼────┐
│Dev Gen│    │Audit  │   │Route  │        │ Schema  │      │ Reports  │
│ Agent │    │Checker│   │Mapper │        │Generator│      │Generator │
└───────┘    └───────┘   └───────┘        └─────────┘      └──────────┘
```

## 📋 Détail des agents principaux

### 1. dev-generator

**Objectif** : Générer du code TypeScript pour les deux frameworks (NestJS et Remix)

**Fonctionnalités** :
- Génère des controllers NestJS à partir de PHP legacy
- Crée des composants Remix basés sur l'UI existante
- Convertit les modèles de données PHP en schémas Prisma

**Implémentation** :
```typescript
// Agent de génération de code
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { readFileSync, writeFileSync } from 'fs';

export class DevGeneratorAgent {
  private model: OpenAI;
  private promptTemplates: Map<string, PromptTemplate>;
  
  constructor(modelName = 'gpt-4-turbo') {
    this.model = new OpenAI({ 
      modelName,
      temperature: 0.1, // Génération précise et déterministe
    });
    
    // Initialisation des templates pour différents types de conversions
    this.promptTemplates = new Map();
    this.loadPromptTemplates();
  }
  
  async convertPhpControllerToNestJS(
    phpFilePath: string, 
    nestJsOutputPath: string
  ): Promise<string> {
    const phpCode = readFileSync(phpFilePath, 'utf-8');
    const prompt = this.promptTemplates.get('php-to-nestjs')!;
    
    // Analyse du fichier PHP
    // ...
    
    // Génération du code NestJS
    const nestJsCode = await this.model.generate(
      prompt.format({ phpCode, projectStandards: this.loadProjectStandards() })
    );
    
    // Vérification et formatage du code généré
    // ...
    
    // Sauvegarde
    writeFileSync(nestJsOutputPath, nestJsCode);
    return nestJsCode;
  }
  
  // Autres méthodes...
}
```

### 2. audit-checker

**Objectif** : Analyser la qualité et la sécurité du code existant et généré

**Fonctionnalités** :
- Analyse de complexité cyclomatique
- Détection de vulnérabilités
- Vérification de couverture des tests
- Comparaison avant/après migration

**Métriques surveillées** :
- Qualité structurelle (complexité, duplication)
- Sécurité (injections, XSS, CSRF)
- Performance (requêtes N+1, optimisations)
- Couverture fonctionnelle

### 3. route-mapper

**Objectif** : Assurer la compatibilité des URLs et optimiser le SEO

**Fonctionnalités** :
- Conversion des routes PHP/htaccess vers Remix
- Génération des redirections 301
- Préservation des métadonnées SEO

**Exemple de mapping** :
```json
{
  "routes": [
    {
      "legacy": "/produit/{id}/{slug}",
      "new": "/products/$id/$slug",
      "params": [
        { "name": "id", "type": "number" },
        { "name": "slug", "type": "string" }
      ],
      "metadata": {
        "title": "TITLE_PATTERN",
        "description": "DESC_PATTERN"
      },
      "status": 301
    },
    // ...autres routes
  ]
}
```

## 🔄 Workflows d'orchestration n8n

### Workflow : Migration-Controller

**Déclencheurs** :
- Manuellement via le dashboard
- Schedule hebdomadaire
- Sur push d'une nouvelle fonctionnalité PHP (via webhook)

**Étapes** :
1. Analyse d'un fichier PHP (Contrôleur)
2. Extraction de la logique métier
3. Demande de génération au dev-generator
4. Vérification par l'audit-checker
5. Création d'une Pull Request
6. Notification Slack/Teams

### Workflow : Suivi-Progression

**Exécution** : Quotidienne à 6h00

**Étapes** :
1. Analyse de l'état de migration (% convertis)
2. Vérification des performances des modules migrés
3. Génération d'un rapport HTML/PDF
4. Mise à jour du tableau Kanban/Jira
5. Détection des priorités pour le sprint suivant

## 🛠️ Infrastructure et dépendances

- **Serveur d'inférence** : Conteneur Docker avec modèles HF / DeepSeek
- **Stockage des contextes** : Redis pour caching des résultats d'analyses
- **Tracking des prompts** : LangSmith pour l'amélioration continue
- **Métriques et logs** : Prometheus / Grafana
