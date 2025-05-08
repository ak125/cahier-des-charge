# Architecture MCP 2.0 en Trois Parties

## Vue d'ensemble

Cette architecture implémente une approche modulaire et sécurisée pour les agents MCP (Model Context Protocol) avec trois composants essentiels :

1. **Isolation WASM** - Exécution des agents dans des environnements isolés via WebAssembly
2. **MCP 2.0 avec Zod** - Validation stricte des données et typage automatique
3. **Signatures SIGSTORE** - Auditabilité cryptographique des résultats

![Architecture MCP 2.0](./assets/mcp-architecture-diagram.png)

## Pourquoi cette architecture?

### Isolation WASM
- **Sécurité renforcée** - Chaque agent s'exécute dans son propre sandbox
- **Flexibilité des langages** - Écrivez des agents en TypeScript, Rust, Go, C++, etc.
- **Chargement dynamique** - Ajout et mise à jour d'agents sans redéploiement
- **Contrôle granulaire** des ressources et permissions

### Validation Zod (MCP 2.0)
- **Typage fort** et validation à l'exécution
- **Génération automatique** de schémas depuis Prisma
- **Documentation auto-générée** des interfaces
- **Compatibilité** avec l'écosystème frontend (Remix)

### Signatures SIGSTORE
- **Non-répudiation** des résultats d'agents
- **Auditabilité complète** de la chaîne de traitement
- **Vérification indépendante** des résultats
- **Intégration CI/CD** pour une validation continue

## Démarrage Rapide

### Prérequis
- Node.js 18+ 
- npm ou pnpm
- Pour la compilation WASM: compilateurs spécifiques aux langages cibles

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/your-org/mcp-architecture.git
cd mcp-architecture

# Installer les dépendances
npm install

# Compiler les modules
npm run build --workspace=packages/mcp-wasm-runtime
npm run build --workspace=packages/mcp-validation
npm run build --workspace=packages/mcp-sigstore
```

### Exemple Minimal

```typescript
import { WasmAgentLoader } from './packages/mcp-wasm-runtime';
import { McpValidator, z } from './packages/mcp-validation';
import { SigstoreSigner } from './packages/mcp-sigstore';

// 1. Définir un schéma de validation
const inputSchema = z.object({
  jobId: z.string().uuid(),
  inputs: z.object({ text: z.string() })
});

// 2. Charger un agent WASM isolé
const agent = new WasmAgentLoader('./agents/text-processor.wasm');
await agent.initialize();

// 3. Créer un validateur pour cet agent
const validator = McpValidator.createAgentValidator(inputSchema);

// 4. Valider et exécuter l'agent
const context = { jobId: 'job-123', inputs: { text: 'Texte à traiter' } };
const validation = validator.validateInput(context);

if (validation.valid) {
  const result = await agent.execute(validation.data);
  
  // 5. Signer le résultat pour l'audit
  const signer = new SigstoreSigner({ signaturesDir: './signatures' });
  await signer.signResult('text-processor', context.jobId, result);
  
  console.log('Traitement terminé avec succès et résultat signé!');
}
```

## Structure du Projet

```
packages/
├── mcp-wasm-runtime/    # Runtime d'isolation WASM
├── mcp-validation/      # Validation Zod pour MCP 2.0  
└── mcp-sigstore/        # Module de signature et vérification
examples/
└── mcp-agent-integration/    # Exemple complet d'intégration
    ├── agent-pipeline-example.ts
    └── github-actions-workflow.yml
```

## Modules Principaux

### 1. Module d'Isolation WASM

Ce module fournit l'infrastructure pour exécuter des agents dans des environnements WASM isolés.

```typescript
import { WasmAgentManager } from './packages/mcp-wasm-runtime';

const manager = new WasmAgentManager();

// Charger plusieurs agents
await manager.loadAgent('text-analyzer', './agents/text-analyzer.wasm');
await manager.loadAgent('code-generator', './agents/code-generator.wasm');

// Scanner un répertoire pour charger tous les agents
const agents = await manager.scanAndLoadAgents('./agents-directory');

// Exécuter un agent spécifique
const result = await manager.executeAgent('text-analyzer', {
  jobId: 'job-123',
  inputs: { text: 'Texte à analyser' }
});
```

### 2. Module de Validation MCP 2.0

Ce module utilise Zod pour la validation des données et la génération de schémas.

```typescript
import { McpValidator, z, SchemaGenerator } from './packages/mcp-validation';

// Définir un schéma personnalisé
const CodeGeneratorInputSchema = z.object({
  jobId: z.string().uuid(),
  inputs: z.object({
    language: z.enum(['typescript', 'javascript', 'python']),
    specification: z.string().min(10),
    options: z.object({
      framework: z.string().optional(),
      tests: z.boolean().default(true)
    }).optional()
  })
});

// Générer un fichier de schéma
const generator = new SchemaGenerator({
  outputDir: './schemas/generated'
});

generator.generateSchemaFile(
  'CodeGeneratorInput', 
  CodeGeneratorInputSchema,
  'Schéma pour les entrées du générateur de code'
);

// Valider des données avec le schéma
const validator = McpValidator.createAgentValidator(CodeGeneratorInputSchema);
const validation = validator.validateInput(inputData);
```

### 3. Module de Signature SIGSTORE

Ce module gère la signature et la vérification des résultats pour l'auditabilité.

```typescript
import { SigstoreSigner, SigstoreVerifier } from './packages/mcp-sigstore';

// Configuration
const config = {
  signaturesDir: './signatures',
  identityEmail: 'agent-authority@example.com'
};

// Signer un résultat
const signer = new SigstoreSigner(config);
const signatureInfo = await signer.signResult(
  'code-generator',
  'job-123',
  generatedCode
);

// Vérifier une signature ultérieurement
const verifier = new SigstoreVerifier(config);
const verification = await verifier.verifyResult(
  'code-generator',
  'job-123',
  JSON.stringify(resultToVerify)
);

if (verification.valid) {
  console.log('Résultat authentique et non modifié');
} else {
  console.error('ATTENTION: Signature invalide');
}
```

## Intégration CI/CD

Un exemple de workflow GitHub Actions est disponible pour intégrer la vérification des signatures dans votre pipeline CI/CD. Ce workflow:

1. Construit les modules nécessaires
2. Exécute les agents
3. Vérifie les signatures des résultats
4. Génère un rapport de sécurité

Pour plus de détails, consultez:
```
examples/mcp-agent-integration/github-actions-workflow.yml
```

## Guide de Migration

Pour migrer des agents existants vers cette nouvelle architecture:

### 1. Compiler des Agents en WASM:

```bash
# Exemple pour TypeScript/AssemblyScript
npm install -g assemblyscript
asc agent-source.ts -o agent.wasm --runtime full
```

### 2. Définir des Schémas Zod:

```typescript
// Avant: Types simples ou inexistants
type AgentInput = {
  text: string;
  options?: { optimize: boolean }
};

// Après: Schémas Zod avec validation
const AgentInputSchema = z.object({
  text: z.string().min(1).max(5000),
  options: z.object({
    optimize: z.boolean().default(false)
  }).optional()
});
```

### 3. Ajouter la Signature:

```typescript
// Avant: Résultats sans signature
return agentResult;

// Après: Résultats signés
const signatureInfo = await signer.signResult(agentId, jobId, agentResult);
return {
  ...agentResult,
  signatureInfo
};
```

## Documentation

Pour une documentation détaillée sur chaque module, consultez:

- [Guide du Runtime WASM](./packages/mcp-wasm-runtime/README.md)
- [Guide de Validation MCP 2.0](./packages/mcp-validation/README.md)
- [Guide de Signature SIGSTORE](./packages/mcp-sigstore/README.md)

## Exemples

Un exemple complet d'intégration des trois modules est disponible dans:
```
examples/mcp-agent-integration/agent-pipeline-example.ts
```

## Contribution

Les contributions sont les bienvenues! Veuillez consulter notre [guide de contribution](./CONTRIBUTING.md) pour plus d'informations.

## Licence

Cette architecture est distribuée sous licence MIT.

# Cahier des Charges - Projet Restructuré

## Structure du Projet

Ce projet a été réorganisé pour suivre une structure standard de monorepo, conforme aux meilleures pratiques de développement modernes et aux standards Nx.

### Organisation des Dossiers

```
/
├── apps/                    # Applications (standard Nx)
│   ├── api/                 # API NestJS
│   ├── frontend/            # UI Remix
│   ├── dashboard/           # Dashboard d'administration
│   └── mcp-server/          # Serveur MCP
├── packages/                # Bibliothèques partagées (standard Nx)
│   ├── agents/              # Agents MCP unifiés
│   │   ├── base/            # Classes de base et interfaces
│   │   ├── php-analyzer/    # Agent analyse PHP
│   │   ├── wasm/            # Implémentations WASM
│   │   └── seo/             # Agents SEO consolidés
│   ├── orchestration/       # Orchestrateurs consolidés
│   ├── business/            # Logique métier
│   ├── ui/                  # Composants UI partagés
│   └── utils/               # Utilitaires consolidés
├── tools/                   # Outils de développement
│   ├── generators/          # Générateurs Nx personnalisés
│   ├── executors/           # Executors Nx personnalisés
│   └── scripts/             # Scripts d'administration
├── prisma/                  # Modèles Prisma unifiés
│   └── schema.prisma        # Schéma DB principal
├── manifests/               # Manifestes MCP
├── migrations/              # Scripts de migration DB
├── docker/                  # Configuration Docker
├── docs/                    # Documentation projet
├── wasm-modules/            # Modules WASM compilés
├── nx.json                  # Configuration Nx
├── package.json             # Dépendances projet
├── pnpm-workspace.yaml      # Configuration pnpm
└── earthfile                # Configuration Earthfile
```

## Guide d'importation

Suite à la restructuration, les imports de code ont été mis à jour. Voici un guide pour l'importation des différents modules :

### Agents MCP

```typescript
// Anciennement
import { SomeAgent } from '../agents/some-agent';

// Nouvelle méthode
import { SomeAgent } from '@packages/agents';
// ou import spécifique
import { SomeAgent } from '@packages/agents/some-agent';
```

### Orchestrateurs

```typescript
// Anciennement
import { OrchestratorBridge } from '../agents/integration/orchestrator-bridge';

// Nouvelle méthode
import { OrchestratorBridge, standardizedOrchestrator } from '@packages/orchestration';
```

### Utilitaires

```typescript
// Anciennement
import { someUtil } from '../utils/some-util';

// Nouvelle méthode
import { someUtil } from '@packages/utils';
```

## CI/CD et Scripts

Les scripts CI/CD ont été mis à jour pour tenir compte de la nouvelle structure. Tous les scripts se trouvent maintenant dans le dossier `tools/scripts/`.

## Documentation

La documentation du projet est disponible dans le dossier `docs/`. Veuillez consulter ce dossier pour des guides plus détaillés sur chaque composant du projet.