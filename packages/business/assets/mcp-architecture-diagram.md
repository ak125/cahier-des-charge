# Architecture MCP 2.0 en Trois Parties

## Diagramme d'interaction entre les composants

```mermaid
flowchart TD
    subgraph "Système MCP 2.0"
        subgraph "1. Isolation WASM"
            WL[WasmAgentLoader] --> |Charge| WM[Module WASM]
            WM --> |S'exécute dans| IS[Sandbox Isolé]
            WL --> |Récupère métadonnées| MD[Métadonnées Agent]
            AM[WasmAgentManager] --> |Gère| WL
            IS --> |Retourne Résultat| AR[Résultat Agent]
        end

        subgraph "2. Validation MCP avec Zod"
            ZS[Schémas Zod] --> |Définissent| ZI[Validateur Input]
            ZS --> |Définissent| ZO[Validateur Output]
            PG[Prisma Generator] --> |Génère| ZS
            MV[McpValidator] --> |Utilise| ZI
            MV --> |Utilise| ZO
            CI[Contexte Input] --> |Validé par| ZI
            AR --> |Validé par| ZO
        end

        subgraph "3. Signature SIGSTORE"
            AR --> |Signé par| SS[SigstoreSigner]
            SS --> |Génère| SB[Bundle Signature]
            SB --> |Stocké dans| SR[Registre Signatures]
            SV[SigstoreVerifier] --> |Vérifie| SB
            SR --> |Fournit| SB
        end

        CI --> |Envoyé à| WL
    end

    subgraph "Environnement Externe"
        DEV[Développeur] --> |Crée| AG[Agent]
        AG --> |Compilé en| WM
        CICD[Pipeline CI/CD] --> |Utilise| SV
        CICD --> |Déploie| AM
        DEV --> |Définit| ZS
    end

    style "1. Isolation WASM" fill:#e6f7ff,stroke:#0099cc,stroke-width:2px
    style "2. Validation MCP avec Zod" fill:#e6ffe6,stroke:#00cc66,stroke-width:2px
    style "3. Signature SIGSTORE" fill:#fff0e6,stroke:#cc6600,stroke-width:2px
```

## Légende

### 1. Isolation WASM (bleu)
- **WasmAgentLoader**: Charge des agents WASM individuels
- **WasmAgentManager**: Gère plusieurs agents WASM
- **Module WASM**: Code compilé de l'agent
- **Sandbox Isolé**: Environnement d'exécution sécurisé
- **Métadonnées Agent**: Informations sur l'agent (id, version, etc.)
- **Résultat Agent**: Résultat produit par l'exécution de l'agent

### 2. Validation MCP avec Zod (vert)
- **Schémas Zod**: Définitions de validation
- **Validateur Input**: Valide les entrées des agents
- **Validateur Output**: Valide les sorties des agents
- **Prisma Generator**: Génère des schémas Zod à partir des modèles Prisma
- **McpValidator**: Orchestrateur de validation
- **Contexte Input**: Données en entrée à valider

### 3. Signature SIGSTORE (orange)
- **SigstoreSigner**: Signe les résultats d'agents
- **Bundle Signature**: Paquet contenant signature et métadonnées
- **Registre Signatures**: Stockage des signatures
- **SigstoreVerifier**: Vérifie l'authenticité des résultats

### Environnement Externe
- **Développeur**: Crée et maintient les agents
- **Agent**: Code source de l'agent avant compilation
- **Pipeline CI/CD**: Processus d'intégration et déploiement