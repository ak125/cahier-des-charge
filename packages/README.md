# Architecture MCP 2.0 en Trois Parties

Cette architecture implémente une approche modulaire pour les agents MCP (Model Context Protocol) avec trois composants essentiels :

1. **Isolation WASM** - Exécution sécurisée des agents dans des environnements isolés
2. **Validation Zod** - Typage fort et validation des données d'entrée/sortie
3. **Signatures SIGSTORE** - Auditabilité et non-répudiation des résultats d'agents

## Structure du Projet

```
packages/
├── mcp-wasm-runtime/    # Isolation d'agents via WebAssembly
├── mcp-validation/      # Validation par Zod pour MCP 2.0
└── mcp-sigstore/        # Signature des résultats avec SIGSTORE
```

## 1. Module d'Isolation WASM

Ce module utilise WebAssembly pour isoler les agents et leur exécution, offrant :

- Isolation mémoire complète
- Sécurité renforcée
- Possibilité d'écriture d'agents en différents langages
- Chargement et déploiement dynamiques

### Utilisation

```typescript
import { WasmAgentLoader, WasmAgentManager } from '../packages/mcp-wasm-runtime';

// Charger un agent WASM isolé
const wasmLoader = new WasmAgentLoader('/path/to/agent.wasm');
await wasmLoader.initialize();

// Exécuter un agent avec un contexte
const result = await wasmLoader.execute({
  jobId: 'job-123',
  inputs: { /* données d'entrée */ }
});

// Utiliser le gestionnaire pour des agents multiples
const manager = new WasmAgentManager();
await manager.loadAgent('text-processor', '/path/to/text-processor.wasm');
await manager.executeAgent('text-processor', context);
```

## 2. Module de Validation MCP 2.0

Ce module utilise Zod pour implémenter une validation stricte des données et un typage fort, offrant :

- Validation stricte des entrées/sorties
- Génération automatique de schémas depuis Prisma
- Types TypeScript automatiquement générés
- Documentation auto-générée des schémas

### Utilisation

```typescript
import { McpValidator, z } from '../packages/mcp-validation';

// Définir un schéma de validation personnalisé
const InputSchema = z.object({
  jobId: z.string().uuid(),
  inputs: z.object({
    text: z.string(),
    options: z.object({
      optimize: z.boolean().default(false)
    }).optional()
  })
});

// Créer un validateur avec des schémas personnalisés
const validator = McpValidator.createAgentValidator(InputSchema);

// Valider un contexte
const validation = validator.validateInput(context);
if (validation.valid) {
  // Contexte valide, traiter avec le contexte validé
  const validContext = validation.data;
} else {
  // Gérer l'erreur de validation
  console.error(validation.errors);
}
```

## 3. Module de Signature SIGSTORE

Ce module permet de signer et de vérifier les résultats d'agents avec SIGSTORE, offrant :

- Auditabilité des résultats d'agents
- Non-répudiation cryptographique
- Intégrité des données vérifiable
- Intégration avec les pipelines CI/CD

### Utilisation

```typescript
import { SigstoreSigner, SigstoreVerifier } from '../packages/mcp-sigstore';

// Configurer le signataire
const signer = new SigstoreSigner({
  signaturesDir: './signatures'
});

// Signer un résultat d'agent
const signatureInfo = await signer.signResult(
  'text-processor',
  'run-123',
  agentResult
);

// Vérifier une signature
const verifier = new SigstoreVerifier({
  signaturesDir: './signatures'
});

const verificationResult = await verifier.verifyResult(
  'text-processor',
  'run-123',
  JSON.stringify(agentResult)
);

if (verificationResult.valid) {
  console.log('Signature valide!');
} else {
  console.error('Signature invalide:', verificationResult.error);
}
```

## Exemple d'Utilisation Complète

Un exemple complet d'intégration des trois modules est disponible dans :

```
examples/mcp-agent-integration/agent-pipeline-example.ts
```

Ce fichier montre comment utiliser les trois composants ensemble pour créer un pipeline sécurisé, typé et auditable.

## Intégration CI/CD

Un exemple d'intégration dans GitHub Actions est fourni dans :

```
examples/mcp-agent-integration/github-actions-workflow.yml
```

Ce workflow montre comment vérifier les signatures des résultats d'agents dans un pipeline CI/CD.

## Guide de Migration

Pour migrer des agents existants vers cette nouvelle architecture :

1. **Étape 1** : Compiler vos agents en WASM ou utiliser les adaptateurs fournis
2. **Étape 2** : Définir des schémas Zod pour les entrées/sorties de vos agents
3. **Étape 3** : Ajouter la signature des résultats à votre pipeline
4. **Étape 4** : Mettre à jour les pipelines CI/CD pour inclure la vérification

## Documentation

Pour plus de détails sur chaque module, consultez la documentation spécifique :

- [Documentation du Runtime WASM](./mcp-wasm-runtime/README.md)
- [Documentation du Module de Validation](./mcp-validation/README.md)
- [Documentation du Module de Signature](./mcp-sigstore/README.md)