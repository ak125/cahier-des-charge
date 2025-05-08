# Types Temporal

Ce répertoire contient les définitions TypeScript partagées pour les workflows et activités Temporal.

## Objectif

Fournir des types cohérents et réutilisables entre les workflows, activités et clients Temporal pour assurer la sécurité des types à travers l'orchestration.

## Conventions de nommage

- Les fichiers de types doivent suivre le format : `{domaine}-types.ts`
- Exemple : `workflow-types.ts`, `activity-types.ts`

## Exemple de structure

```typescript
// workflow-input-types.ts
export interface AnalysisInput {
  projectId: string;
  repositoryUrl: string;
  codeLanguage: string;
  analysisDepth: 'shallow' | 'deep';
  options?: {
    timeout?: number;
    includeTests?: boolean;
  };
}

// workflow-result-types.ts
export interface AnalysisResult {
  analysisId: string;
  status: 'success' | 'failure' | 'partial';
  metrics: {
    codeQuality: number;
    coverage: number;
    complexity: number;
  };
  findings: Finding[];
}

export interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: {
    file: string;
    line?: number;
  };
}
```

## Bonnes pratiques

- Définir clairement les types d'entrée et de sortie
- Utiliser des enums pour les valeurs constantes
- Exporter les types pour les rendre disponibles à travers les modules
- Documenter les propriétés non évidentes avec des commentaires JSDoc