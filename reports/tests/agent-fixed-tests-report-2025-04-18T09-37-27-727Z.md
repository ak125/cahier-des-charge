# Rapport des tests d'agents MCP corrigés - 4/18/2025, 9:37:27 AM

## Résumé

### DataAgent (./packages/mcp-agents/analyzers/data-analyzer/DataAgent)

- ❌ Erreur lors de l'exécution du test : Cannot find module 'jest'
Require stack:
- /workspaces/cahier-des-charge/test-config.ts
- /workspaces/cahier-des-charge/run-fixed-agent-tests.ts
```
Error: Cannot find module 'jest'
Require stack:
- /workspaces/cahier-des-charge/test-config.ts
- /workspaces/cahier-des-charge/run-fixed-agent-tests.ts
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1212:15)
    at Function.Module._resolveFilename.sharedData.moduleResolveFilenameHook.installedValue [as _resolveFilename] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/node_modules/@cspotcode/source-map-support/source-map-support.js:811:30)
    at Function.Module._load (node:internal/modules/cjs/loader:1043:27)
    at Module.require (node:internal/modules/cjs/loader:1298:19)
    at require (node:internal/modules/helpers:182:18)
    at runAgentTest (/workspaces/cahier-des-charge/test-config.ts:76:16)
    at runTests (/workspaces/cahier-des-charge/run-fixed-agent-tests.ts:53:41)
    at Object.<anonymous> (/workspaces/cahier-des-charge/run-fixed-agent-tests.ts:87:1)
    at Module._compile (node:internal/modules/cjs/loader:1529:14)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1618:23)
```

### AbstractAnalyzer (./packages/mcp-agents/analyzers/abstract-analyzer)

- ❌ Erreur lors de l'exécution du test : Cannot find module 'jest'
Require stack:
- /workspaces/cahier-des-charge/test-config.ts
- /workspaces/cahier-des-charge/run-fixed-agent-tests.ts
```
Error: Cannot find module 'jest'
Require stack:
- /workspaces/cahier-des-charge/test-config.ts
- /workspaces/cahier-des-charge/run-fixed-agent-tests.ts
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1212:15)
    at Function.Module._resolveFilename.sharedData.moduleResolveFilenameHook.installedValue [as _resolveFilename] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/node_modules/@cspotcode/source-map-support/source-map-support.js:811:30)
    at Function.Module._load (node:internal/modules/cjs/loader:1043:27)
    at Module.require (node:internal/modules/cjs/loader:1298:19)
    at require (node:internal/modules/helpers:182:18)
    at runAgentTest (/workspaces/cahier-des-charge/test-config.ts:76:16)
    at runTests (/workspaces/cahier-des-charge/run-fixed-agent-tests.ts:53:41)
    at Object.<anonymous> (/workspaces/cahier-des-charge/run-fixed-agent-tests.ts:87:1)
    at Module._compile (node:internal/modules/cjs/loader:1529:14)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1618:23)
```

### BaseAnalyzerAgent (./packages/mcp-agents/analyzers/base-analyzer-agent)

- ❌ Erreur lors de l'exécution du test : Cannot find module 'jest'
Require stack:
- /workspaces/cahier-des-charge/test-config.ts
- /workspaces/cahier-des-charge/run-fixed-agent-tests.ts
```
Error: Cannot find module 'jest'
Require stack:
- /workspaces/cahier-des-charge/test-config.ts
- /workspaces/cahier-des-charge/run-fixed-agent-tests.ts
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1212:15)
    at Function.Module._resolveFilename.sharedData.moduleResolveFilenameHook.installedValue [as _resolveFilename] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/node_modules/@cspotcode/source-map-support/source-map-support.js:811:30)
    at Function.Module._load (node:internal/modules/cjs/loader:1043:27)
    at Module.require (node:internal/modules/cjs/loader:1298:19)
    at require (node:internal/modules/helpers:182:18)
    at runAgentTest (/workspaces/cahier-des-charge/test-config.ts:76:16)
    at runTests (/workspaces/cahier-des-charge/run-fixed-agent-tests.ts:53:41)
    at Object.<anonymous> (/workspaces/cahier-des-charge/run-fixed-agent-tests.ts:87:1)
    at Module._compile (node:internal/modules/cjs/loader:1529:14)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1618:23)
```

## Statistiques

- Tests réussis : 0
- Tests échoués : 3
- Total : 3
