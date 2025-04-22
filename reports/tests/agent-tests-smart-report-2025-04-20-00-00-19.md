# Rapport des tests intelligents d'agents MCP - Sun Apr 20 00:00:19 UTC 2025

## Résumé

Ce rapport utilise l'analyse: /workspaces/cahier-des-charge/reports/analysis/agent-methods-2025-04-18T08-31-11-812Z.json

### AbstractAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractAnalyzerAgent
Test terminé avec succès
```

### AbstractAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractAnalyzerAgent-2025-04-20-00-00-19.ts(1,10): error TS2724: '"/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer.ts"' has no exported member named 'AbstractAnalyzerAgent'. Did you mean 'AbstractAnalyzer'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2724 ]
}
```

### BaseAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base-analyzer-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite BaseAnalyzerAgent
Test terminé avec succès
```

### DataAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/data-analyzer/DataAgent/DataAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(11,45): error TS2339: Property 'version' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(12,49): error TS2339: Property 'description' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(15,22): error TS2339: Property 'getVersion' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(18,36): error TS2339: Property 'getVersion' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(21,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(24,22): error TS2339: Property 'getDependencies' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(27,36): error TS2339: Property 'getDependencies' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(30,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(33,22): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(36,36): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(39,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(42,22): error TS2339: Property 'analyzeUserInputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(45,36): error TS2339: Property 'analyzeUserInputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(48,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(51,22): error TS2339: Property 'extractSuperglobalVariables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(54,36): error TS2339: Property 'extractSuperglobalVariables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(57,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(60,22): error TS2339: Property 'analyzeSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(63,36): error TS2339: Property 'analyzeSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(66,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(69,22): error TS2339: Property 'extractSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(72,36): error TS2339: Property 'extractSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(75,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(78,22): error TS2339: Property 'extractSqlTables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(81,36): error TS2339: Property 'extractSqlTables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(84,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(87,22): error TS2339: Property 'extractSqlColumns' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(90,36): error TS2339: Property 'extractSqlColumns' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(93,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(96,22): error TS2339: Property 'analyzeOutputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(99,36): error TS2339: Property 'analyzeOutputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(102,53): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,
     2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046
  ]
}
```

### DataAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/data-analyzer/DataAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(12,22): error TS2339: Property 'getVersion' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(15,36): error TS2339: Property 'getVersion' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(18,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(21,22): error TS2339: Property 'getDependencies' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(24,36): error TS2339: Property 'getDependencies' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(27,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(30,22): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(33,36): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(36,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(39,22): error TS2339: Property 'analyzeUserInputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(42,36): error TS2339: Property 'analyzeUserInputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(45,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(48,22): error TS2339: Property 'extractSuperglobalVariables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(51,36): error TS2339: Property 'extractSuperglobalVariables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(54,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(57,22): error TS2339: Property 'analyzeSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(60,36): error TS2339: Property 'analyzeSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(63,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(66,22): error TS2339: Property 'extractSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(69,36): error TS2339: Property 'extractSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(72,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(75,22): error TS2339: Property 'extractSqlTables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(78,36): error TS2339: Property 'extractSqlTables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(81,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(84,22): error TS2339: Property 'extractSqlColumns' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(87,36): error TS2339: Property 'extractSqlColumns' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(90,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(93,22): error TS2339: Property 'analyzeOutputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(96,36): error TS2339: Property 'analyzeOutputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(99,53): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046
  ]
}
```

### DataAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/data-analyzer/data-analyzer-v2.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(11,49): error TS2339: Property 'description' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(13,46): error TS2339: Property 'filePath' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(14,49): error TS2339: Property 'fileContent' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(15,52): error TS2339: Property 'processedFiles' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(16,50): error TS2339: Property 'issuesByType' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(17,53): error TS2339: Property 'processingTimes' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(20,22): error TS2339: Property 'initializeInternal' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(23,36): error TS2339: Property 'initializeInternal' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(26,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(29,22): error TS2339: Property 'validateInput' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(32,36): error TS2339: Property 'validateInput' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(35,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(38,22): error TS2339: Property 'analyze' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(41,36): error TS2339: Property 'analyze' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(44,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(47,22): error TS2339: Property 'getAvailableRules' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(50,36): error TS2339: Property 'getAvailableRules' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(53,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(56,22): error TS2339: Property 'getAnalysisStats' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(59,36): error TS2339: Property 'getAnalysisStats' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(62,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(65,22): error TS2339: Property 'addInputFindings' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(68,36): error TS2339: Property 'addInputFindings' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(71,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(74,22): error TS2339: Property 'addSqlFindings' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(77,36): error TS2339: Property 'addSqlFindings' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(80,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(83,22): error TS2339: Property 'addOutputFindings' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(86,36): error TS2339: Property 'addOutputFindings' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(89,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(92,22): error TS2339: Property 'analyzeUserInputs' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(95,36): error TS2339: Property 'analyzeUserInputs' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(98,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(101,22): error TS2339: Property 'extractSuperglobalVariables' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(104,36): error TS2339: Property 'extractSuperglobalVariables' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(107,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(110,22): error TS2339: Property 'analyzeSqlQueries' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(113,36): error TS2339: Property 'analyzeSqlQueries' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(116,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(119,22): error TS2339: Property 'extractSqlQueries' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(122,36): error TS2339: Property 'extractSqlQueries' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(125,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(128,22): error TS2339: Property 'extractSqlTables' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(131,36): error TS2339: Property 'extractSqlTables' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(134,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(137,22): error TS2339: Property 'extractSqlColumns' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(140,36): error TS2339: Property 'extractSqlColumns' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(143,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(146,22): error TS2339: Property 'analyzeOutputs' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(149,36): error TS2339: Property 'analyzeOutputs' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(152,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(155,22): error TS2339: Property 'cleanupInternal' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(158,36): error TS2339: Property 'cleanupInternal' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-00-19.ts(161,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046
  ]
}
```

### DependencyAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dependency-analyzer/DependencyAgent/DependencyAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(11,45): error TS2339: Property 'version' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(12,49): error TS2339: Property 'description' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(13,49): error TS2339: Property 'impactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(16,22): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(19,36): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(22,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(25,22): error TS2339: Property 'identifyIncludedFiles' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(28,36): error TS2339: Property 'identifyIncludedFiles' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(31,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(34,22): error TS2339: Property 'analyzeCrossCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(37,36): error TS2339: Property 'analyzeCrossCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(40,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(43,22): error TS2339: Property 'extractGlobalVariables' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(46,36): error TS2339: Property 'extractGlobalVariables' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(49,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(52,22): error TS2339: Property 'extractExternalFunctionCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(55,36): error TS2339: Property 'extractExternalFunctionCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(58,67): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(61,22): error TS2339: Property 'analyzeSessionUsage' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(64,36): error TS2339: Property 'analyzeSessionUsage' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(67,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(70,22): error TS2339: Property 'extractSessionKeys' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(73,36): error TS2339: Property 'extractSessionKeys' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(76,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(79,22): error TS2339: Property 'generateImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(82,36): error TS2339: Property 'generateImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(85,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(88,22): error TS2339: Property 'extractIncludes' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(91,36): error TS2339: Property 'extractIncludes' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(94,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(97,22): error TS2339: Property 'saveImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(100,36): error TS2339: Property 'saveImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(103,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,
     2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046
  ]
}
```

### DependencyAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dependency-analyzer/DependencyAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(9,49): error TS2339: Property 'impactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(12,22): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(15,36): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(18,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(21,22): error TS2339: Property 'identifyIncludedFiles' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(24,36): error TS2339: Property 'identifyIncludedFiles' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(27,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(30,22): error TS2339: Property 'analyzeCrossCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(33,36): error TS2339: Property 'analyzeCrossCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(36,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(39,22): error TS2339: Property 'extractGlobalVariables' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(42,36): error TS2339: Property 'extractGlobalVariables' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(45,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(48,22): error TS2339: Property 'extractExternalFunctionCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(51,36): error TS2339: Property 'extractExternalFunctionCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(54,67): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(57,22): error TS2339: Property 'analyzeSessionUsage' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(60,36): error TS2339: Property 'analyzeSessionUsage' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(63,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(66,22): error TS2339: Property 'extractSessionKeys' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(69,36): error TS2339: Property 'extractSessionKeys' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(72,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(75,22): error TS2339: Property 'generateImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(78,36): error TS2339: Property 'generateImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(81,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(84,22): error TS2339: Property 'extractIncludes' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(87,36): error TS2339: Property 'extractIncludes' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(90,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(93,22): error TS2339: Property 'saveImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(96,36): error TS2339: Property 'saveImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(99,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339,
    18046
  ]
}
```

### DependencyAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dependency-analyzer/dependency-analyzer-v2.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(11,49): error TS2339: Property 'description' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(13,46): error TS2339: Property 'filePath' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(14,49): error TS2339: Property 'fileContent' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(15,49): error TS2339: Property 'impactGraph' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(16,52): error TS2339: Property 'processedFiles' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(17,50): error TS2339: Property 'issuesByType' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(18,53): error TS2339: Property 'processingTimes' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(21,22): error TS2339: Property 'initializeInternal' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(24,36): error TS2339: Property 'initializeInternal' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(27,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(30,22): error TS2339: Property 'validateInput' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(33,36): error TS2339: Property 'validateInput' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(36,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(39,22): error TS2339: Property 'analyze' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(42,36): error TS2339: Property 'analyze' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(45,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(48,22): error TS2339: Property 'addIncludesFindings' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(51,36): error TS2339: Property 'addIncludesFindings' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(54,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(57,22): error TS2339: Property 'detectDynamicIncludes' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(60,36): error TS2339: Property 'detectDynamicIncludes' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(63,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(66,22): error TS2339: Property 'addCrossCallsFindings' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(69,36): error TS2339: Property 'addCrossCallsFindings' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(72,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(75,22): error TS2339: Property 'addSessionUsageFindings' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(78,36): error TS2339: Property 'addSessionUsageFindings' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(81,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(84,22): error TS2339: Property 'extractIncludes' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(87,36): error TS2339: Property 'extractIncludes' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(90,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(93,22): error TS2339: Property 'extractGlobalVariables' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(96,36): error TS2339: Property 'extractGlobalVariables' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(99,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(102,22): error TS2339: Property 'extractExternalFunctionCalls' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(105,36): error TS2339: Property 'extractExternalFunctionCalls' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(108,67): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(111,22): error TS2339: Property 'extractSessionKeys' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(114,36): error TS2339: Property 'extractSessionKeys' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(117,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(120,22): error TS2339: Property 'generateImpactGraph' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(123,36): error TS2339: Property 'generateImpactGraph' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(126,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(129,22): error TS2339: Property 'saveImpactGraph' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(132,36): error TS2339: Property 'saveImpactGraph' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(135,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(138,22): error TS2339: Property 'getAvailableRules' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(141,36): error TS2339: Property 'getAvailableRules' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(144,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(147,22): error TS2339: Property 'getAnalysisStats' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(150,36): error TS2339: Property 'getAnalysisStats' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(153,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(156,22): error TS2339: Property 'cleanupInternal' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(159,36): error TS2339: Property 'cleanupInternal' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-00-19.ts(162,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046
  ]
}
```

### PhpAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PhpAnalyzerAgent-2025-04-20-00-00-19.ts(10,44): error TS2339: Property 'logger' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-20-00-00-19.ts(13,22): error TS2339: Property 'initializeInternal' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-20-00-00-19.ts(16,36): error TS2339: Property 'initializeInternal' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-20-00-00-19.ts(19,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-PhpAnalyzerAgent-2025-04-20-00-00-19.ts(22,22): error TS2339: Property 'cleanupInternal' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-20-00-00-19.ts(25,36): error TS2339: Property 'cleanupInternal' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-20-00-00-19.ts(28,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,
     2339, 18046,
     2339,  2339,
    18046
  ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/structure-analyzer/StructureAgent/StructureAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(11,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(12,49): error TS2339: Property 'description' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(15,22): error TS2339: Property 'getVersion' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(18,36): error TS2339: Property 'getVersion' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(21,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(24,22): error TS2339: Property 'getDependencies' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(27,36): error TS2339: Property 'getDependencies' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(30,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(33,22): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(36,36): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(39,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(42,22): error TS2339: Property 'analyzeFileStructure' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(45,36): error TS2339: Property 'analyzeFileStructure' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(48,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(51,22): error TS2339: Property 'identifyEntryPoints' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(54,36): error TS2339: Property 'identifyEntryPoints' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(57,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(60,22): error TS2339: Property 'analyzeTemplateUsage' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(63,36): error TS2339: Property 'analyzeTemplateUsage' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(66,59): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,
     2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,
     2339, 18046
  ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/structure-analyzer/StructureAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(12,22): error TS2339: Property 'getVersion' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(15,36): error TS2339: Property 'getVersion' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(18,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(21,22): error TS2339: Property 'getDependencies' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(24,36): error TS2339: Property 'getDependencies' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(27,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(30,22): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(33,36): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(36,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(39,22): error TS2339: Property 'analyzeFileStructure' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(42,36): error TS2339: Property 'analyzeFileStructure' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(45,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(48,22): error TS2339: Property 'identifyEntryPoints' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(51,36): error TS2339: Property 'identifyEntryPoints' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(54,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(57,22): error TS2339: Property 'analyzeTemplateUsage' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(60,36): error TS2339: Property 'analyzeTemplateUsage' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(63,59): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,
     2339, 18046
  ]
}
```

### StructureAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/structure-analyzer/structure-analyzer-v2.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(11,49): error TS2339: Property 'description' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(13,46): error TS2339: Property 'filePath' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(14,49): error TS2339: Property 'fileContent' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(15,52): error TS2339: Property 'processedFiles' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(16,50): error TS2339: Property 'issuesByType' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(17,53): error TS2339: Property 'processingTimes' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(20,22): error TS2339: Property 'initializeInternal' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(23,36): error TS2339: Property 'initializeInternal' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(26,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(29,22): error TS2339: Property 'validateInput' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(32,36): error TS2339: Property 'validateInput' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(35,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(38,22): error TS2339: Property 'analyze' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(41,36): error TS2339: Property 'analyze' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(44,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(47,22): error TS2339: Property 'addFileStructureFindings' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(50,36): error TS2339: Property 'addFileStructureFindings' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(53,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(56,22): error TS2339: Property 'addEntryPointsFindings' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(59,36): error TS2339: Property 'addEntryPointsFindings' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(62,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(65,22): error TS2339: Property 'addTemplateUsageFindings' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(68,36): error TS2339: Property 'addTemplateUsageFindings' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(71,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(74,22): error TS2339: Property 'addMetricsFindings' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(77,36): error TS2339: Property 'addMetricsFindings' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(80,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(83,22): error TS2339: Property 'analyzeFileStructure' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(86,36): error TS2339: Property 'analyzeFileStructure' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(89,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(92,22): error TS2339: Property 'analyzeEntryPoints' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(95,36): error TS2339: Property 'analyzeEntryPoints' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(98,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(101,22): error TS2339: Property 'analyzeTemplateUsage' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(104,36): error TS2339: Property 'analyzeTemplateUsage' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(107,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(110,22): error TS2339: Property 'analyzeClasses' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(113,36): error TS2339: Property 'analyzeClasses' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(116,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(119,22): error TS2339: Property 'calculateMetrics' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(122,36): error TS2339: Property 'calculateMetrics' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(125,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(128,22): error TS2339: Property 'getAvailableRules' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(131,36): error TS2339: Property 'getAvailableRules' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(134,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(137,22): error TS2339: Property 'getAnalysisStats' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(140,36): error TS2339: Property 'getAnalysisStats' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(143,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(146,22): error TS2339: Property 'cleanupInternal' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(149,36): error TS2339: Property 'cleanupInternal' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-00-19.ts(152,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046
  ]
}
```

### BusinessAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/agent-business/agent-business.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'BusinessAgent'. Did you mean 'metadata'?
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'BusinessAgent'. Did you mean 'metadata'?
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'loadFile' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'loadFile' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(69,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(78,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'analyzeBusinessRole' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'analyzeBusinessRole' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(87,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'analyzeEntryPoints' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'analyzeEntryPoints' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(96,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(132,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(141,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'analyzeFunctionalArea' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'analyzeFunctionalArea' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(150,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(159,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(168,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'saveSections' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'saveSections' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(177,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(186,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(195,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(204,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'main' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'main' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(213,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(222,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'catch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(231,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(240,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(243,22): error TS2551: Property 'getState' does not exist on type 'BusinessAgent'. Did you mean 'getStatus'?
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(246,36): error TS2551: Property 'getState' does not exist on type 'BusinessAgent'. Did you mean 'getStatus'?
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(249,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2554, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2551,  2551, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2551,
     2551, 18046
  ]
}
```

### agent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/agent-donnees/agent-donnees.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-agent-2025-04-20-00-00-19.ts(6,11): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-20-00-00-19.ts(6,23): error TS2448: Block-scoped variable 'agent' used before its declaration.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 7022, 2448 ]
}
```

### QualityAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/agent-quality/agent-quality.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'QualityAgent'. Did you mean 'metadata'?
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'QualityAgent'. Did you mean 'metadata'?
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'loadFile' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'loadFile' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(69,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(78,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'analyzeCyclomaticComplexity' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'analyzeCyclomaticComplexity' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(87,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(96,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'for' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'for' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(114,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(132,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(141,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(150,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'analyzeTechnicalDebt' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'analyzeTechnicalDebt' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(159,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(168,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(177,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(186,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(195,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(204,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(222,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(231,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(240,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(249,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(258,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'findDuplicateCodeBlocks' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'findDuplicateCodeBlocks' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(267,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'for' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'for' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(276,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'analyzeSecurityVulnerabilities' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'analyzeSecurityVulnerabilities' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(285,69): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(294,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'es' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'es' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(303,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(312,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(321,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(330,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(333,22): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(336,36): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(339,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(342,22): error TS2339: Property 'saveSections' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(345,36): error TS2339: Property 'saveSections' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(348,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(351,22): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(354,36): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(357,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(360,22): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(363,36): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(366,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(369,22): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(372,36): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(375,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(378,22): error TS2339: Property 'main' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(381,36): error TS2339: Property 'main' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(384,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(387,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(390,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(393,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(396,22): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(399,36): error TS2339: Property 'catch' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(402,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(405,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(408,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(411,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(414,22): error TS2551: Property 'getState' does not exist on type 'QualityAgent'. Did you mean 'getStatus'?
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(417,36): error TS2551: Property 'getState' does not exist on type 'QualityAgent'. Did you mean 'getStatus'?
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(420,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2554, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2551, 2551, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339,
    ... 47 more items
  ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/agent-structure/agent-structure.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'StructureAgent'. Did you mean 'metadata'?
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'StructureAgent'. Did you mean 'metadata'?
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'loadRules' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'loadRules' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(69,48): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'catch' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'catch' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(78,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'header' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'header' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(87,45): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'analyzeFunctions' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'analyzeFunctions' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(96,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(105,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(132,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'analyzeIncludes' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'analyzeIncludes' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(141,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'analyzeNestingDepth' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'analyzeNestingDepth' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(150,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(159,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'analyzeHtmlBlocks' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'analyzeHtmlBlocks' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(168,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(177,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(186,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(195,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(204,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'detectHybridStructure' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'detectHybridStructure' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(222,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'detectModuleType' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'detectModuleType' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(231,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(240,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'switch' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'switch' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(249,45): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(258,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(267,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'analyzeCodeQuality' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'analyzeCodeQuality' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(276,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'analyzeDuplication' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'analyzeDuplication' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(285,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(294,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(303,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'for' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(312,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(321,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(330,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(333,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(336,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(339,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(342,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(345,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(348,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(351,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(354,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(357,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(360,22): error TS2339: Property 'calculateSimilarity' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(363,36): error TS2339: Property 'calculateSimilarity' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(366,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(369,22): error TS2339: Property 'analyzeInlineLogic' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(372,36): error TS2339: Property 'analyzeInlineLogic' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(375,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(378,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(381,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(384,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(387,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(390,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(393,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(396,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(399,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(402,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(405,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(408,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(411,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(414,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(417,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(420,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(423,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(426,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(429,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(432,22): error TS2339: Property 'analyzeFrontendBackendMix' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(435,36): error TS2339: Property 'analyzeFrontendBackendMix' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(438,64): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(441,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(444,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(447,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(450,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(453,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(456,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(459,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(462,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(465,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(468,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(471,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(474,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(477,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(480,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(483,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(486,22): error TS2339: Property 'analyzeLackOfFunctions' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(489,36): error TS2339: Property 'analyzeLackOfFunctions' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(492,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(495,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(498,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(501,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(504,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(507,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(510,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(513,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(516,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(519,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(522,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(525,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(528,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(531,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(534,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(537,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(540,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(543,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(546,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(549,22): error TS2339: Property 'analyzeInlineJs' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(552,36): error TS2339: Property 'analyzeInlineJs' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(555,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(558,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(561,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(564,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(567,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(570,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(573,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(576,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(579,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(582,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(585,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(588,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(591,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(594,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(597,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(600,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(603,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(606,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(609,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(612,22): error TS2339: Property 'analyzeVariableNaming' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(615,36): error TS2339: Property 'analyzeVariableNaming' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(618,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(621,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(624,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(627,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(630,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(633,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(636,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(639,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(642,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(645,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(648,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(651,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(654,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(657,22): error TS2339: Property 'generateAuditSection' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(660,36): error TS2339: Property 'generateAuditSection' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(663,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(666,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(669,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(672,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(675,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(678,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(681,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(684,22): error TS2339: Property 'updateBacklog' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(687,36): error TS2339: Property 'updateBacklog' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(690,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(693,22): error TS2339: Property 'catch' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(696,36): error TS2339: Property 'catch' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(699,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(702,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(705,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(708,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(711,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(714,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(717,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(720,22): error TS2551: Property 'getState' does not exist on type 'StructureAgent'. Did you mean 'getStatus'?
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(723,36): error TS2551: Property 'getState' does not exist on type 'StructureAgent'. Did you mean 'getStatus'?
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(726,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2554, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2551, 2551, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339,
    ... 149 more items
  ]
}
```

### agent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/agent-version-auditor/agent-version-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-agent-2025-04-20-00-00-19.ts(6,11): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-20-00-00-19.ts(6,23): error TS2448: Block-scoped variable 'agent' used before its declaration.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 7022, 2448 ]
}
```

### AutoPRAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/auto-pr-agent/auto-pr-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'AutoPRAgent'. Did you mean 'metadata'?
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'AutoPRAgent'. Did you mean 'metadata'?
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(69,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(78,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'createPRForMigration' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'createPRForMigration' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(87,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(96,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(132,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'createBranch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'createBranch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(141,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(150,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'commitFiles' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'commitFiles' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(159,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'for' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'for' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(168,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(177,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'pushBranch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'pushBranch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(186,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(195,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'createPR' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'createPR' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(204,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(222,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(231,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(240,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(249,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'formatPRTemplate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'formatPRTemplate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(258,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'replace' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'replace' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(267,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'generateDefaultPRBody' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'generateDefaultPRBody' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(276,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'join' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'join' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(285,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(294,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(303,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(312,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(321,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'createAutoPRAgent' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'createAutoPRAgent' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(330,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(333,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(336,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(339,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(342,22): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(345,36): error TS2339: Property 'if' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(348,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(351,22): error TS2339: Property 'then' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(354,36): error TS2339: Property 'then' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(357,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(360,22): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(363,36): error TS2339: Property 'catch' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(366,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(369,22): error TS2551: Property 'getState' does not exist on type 'AutoPRAgent'. Did you mean 'getStatus'?
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(372,36): error TS2551: Property 'getState' does not exist on type 'AutoPRAgent'. Did you mean 'getStatus'?
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(375,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2554, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2551, 2551, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339,
    ... 32 more items
  ]
}
```

### BaseAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/baseagent/baseagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'BaseAgent'. Did you mean 'metadata'?
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'BaseAgent'. Did you mean 'metadata'?
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'getName' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'getName' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(69,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'getName' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'getName' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(78,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'getVersion' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'getVersion' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(87,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'getDependencies' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'getDependencies' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(96,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'loadFile' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'loadFile' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(105,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'catch' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'catch' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(114,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'saveSections' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'saveSections' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(123,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'catch' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'catch' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(132,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'for' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'for' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(141,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'if' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'if' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(150,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'catch' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'catch' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(159,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'addSection' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'addSection' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(168,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'addWarning' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'addWarning' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(177,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'analyze' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'analyze' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(186,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'catch' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'catch' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(195,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(198,22): error TS2551: Property 'getState' does not exist on type 'BaseAgent'. Did you mean 'getStatus'?
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(201,36): error TS2551: Property 'getState' does not exist on type 'BaseAgent'. Did you mean 'getStatus'?
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(204,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2554, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2551,  2551, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2551,  2551, 18046
  ]
}
```

### BusinessAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/businessagent/businessagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'BusinessAgent'. Did you mean 'metadata'?
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'BusinessAgent'. Did you mean 'metadata'?
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'getVersion' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'getVersion' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(69,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'getDependencies' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'getDependencies' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(78,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(87,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'detectPageType' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'detectPageType' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(96,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'analyzeBusinessLogic' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'analyzeBusinessLogic' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(105,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'analyzeBusinessCases' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'analyzeBusinessCases' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(132,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'if' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(141,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'generateBusinessContextContent' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'generateBusinessContextContent' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(150,69): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'switch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'switch' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(159,45): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(162,22): error TS2551: Property 'getState' does not exist on type 'BusinessAgent'. Did you mean 'getStatus'?
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(165,36): error TS2551: Property 'getState' does not exist on type 'BusinessAgent'. Did you mean 'getStatus'?
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(168,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2554, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2551,  2551, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2551,  2551, 18046
  ]
}
```

### DataAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/dataagent/dataagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'DataAgent'. Did you mean 'metadata'?
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'DataAgent'. Did you mean 'metadata'?
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'getVersion' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'getVersion' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(69,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'getDependencies' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'getDependencies' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(78,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(87,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'analyzeUserInputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'analyzeUserInputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(96,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(132,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(141,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(150,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'extractSuperglobalVariables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'extractSuperglobalVariables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(159,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'analyzeSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'analyzeSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(168,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(177,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(186,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(195,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(204,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(222,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'extractSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'extractSqlQueries' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(231,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(240,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(249,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'extractSqlTables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'extractSqlTables' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(258,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(267,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(276,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(285,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(294,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'extractSqlColumns' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'extractSqlColumns' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(303,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(312,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(321,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(330,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(333,22): error TS2339: Property 'analyzeOutputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(336,36): error TS2339: Property 'analyzeOutputs' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(339,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(342,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(345,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(348,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(351,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(354,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(357,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(360,22): error TS2339: Property 'template' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(363,36): error TS2339: Property 'template' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(366,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(369,22): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(372,36): error TS2339: Property 'if' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(375,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(378,22): error TS2551: Property 'getState' does not exist on type 'DataAgent'. Did you mean 'getStatus'?
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(381,36): error TS2551: Property 'getState' does not exist on type 'DataAgent'. Did you mean 'getStatus'?
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(384,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2554, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2551, 2551, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339,
    ... 35 more items
  ]
}
```

### DependencyAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/dependencyagent/dependencyagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'DependencyAgent'. Did you mean 'metadata'?
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'DependencyAgent'. Did you mean 'metadata'?
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(69,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'identifyIncludedFiles' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'identifyIncludedFiles' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(78,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(87,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(96,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(132,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(141,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'analyzeCrossCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'analyzeCrossCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(150,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(159,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(168,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(177,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(186,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'extractGlobalVariables' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'extractGlobalVariables' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(195,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(204,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(222,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(231,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'extractExternalFunctionCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'extractExternalFunctionCalls' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(240,67): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'analyzeSessionUsage' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'analyzeSessionUsage' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(249,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(258,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(267,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'extractSessionKeys' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'extractSessionKeys' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(276,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(285,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'if' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(294,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'generateImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'generateImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(303,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'extractIncludes' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'extractIncludes' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(312,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'saveImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'saveImpactGraph' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(321,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'catch' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'catch' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(330,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(333,22): error TS2551: Property 'getState' does not exist on type 'DependencyAgent'. Did you mean 'getStatus'?
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(336,36): error TS2551: Property 'getState' does not exist on type 'DependencyAgent'. Did you mean 'getStatus'?
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(339,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2554, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2551, 2551, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339,
    ... 20 more items
  ]
}
```

### discovery (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/discovery-agent/discovery-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
packages/mcp-agents/business/misc/discovery-agent/discovery-agent.ts(56,14): error TS2420: Class 'discovery' incorrectly implements interface 'BusinessAgent'.
  Type 'discovery' is missing the following properties from type 'BusinessAgent': domain, capabilities, getSummary

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Module.require (node:internal/modules/cjs/loader:1298:19) {
  diagnosticCodes: [ 2420 ]
}
```

### ProgressiveMigrationAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/progressive-migration-agent/progressive-migration-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'ProgressiveMigrationAgent'. Did you mean 'metadata'?
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'ProgressiveMigrationAgent'. Did you mean 'metadata'?
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'analyze' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'analyze' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(69,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'detectRoutePattern' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'detectRoutePattern' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(78,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(87,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'loadProxyConfigs' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'loadProxyConfigs' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(96,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'catch' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'catch' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(105,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'updateProxyConfig' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'updateProxyConfig' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(114,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'saveProxyConfigs' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'saveProxyConfigs' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(132,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'catch' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'catch' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(141,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'generateProgressiveMigrationSection' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'generateProgressiveMigrationSection' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(150,74): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(159,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'generateProxyConfig' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'generateProxyConfig' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(168,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(177,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(186,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'if' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(195,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(198,22): error TS2551: Property 'getState' does not exist on type 'ProgressiveMigrationAgent'. Did you mean 'getStatus'?
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(201,36): error TS2551: Property 'getState' does not exist on type 'ProgressiveMigrationAgent'. Did you mean 'getStatus'?
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(204,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2554, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2551,  2551, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2551,  2551, 18046
  ]
}
```

### QualityAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/qualityagent/qualityagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'QualityAgent'. Did you mean 'metadata'?
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'QualityAgent'. Did you mean 'metadata'?
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(69,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'evaluateComplexity' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'evaluateComplexity' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(78,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(87,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(96,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'determineComplexitySeverity' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'determineComplexitySeverity' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(114,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(132,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'analyzeSecurityRisks' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'analyzeSecurityRisks' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(141,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'for' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'for' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(150,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(159,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'for' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'for' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(168,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'evaluateOverallQuality' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'evaluateOverallQuality' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(177,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(186,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'long' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'long' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(195,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'long' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'long' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(204,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(222,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(231,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(240,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(249,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(258,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(267,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(276,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(285,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(294,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(303,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'generateQualityRecommendation' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'generateQualityRecommendation' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(312,68): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(321,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(330,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(333,22): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(336,36): error TS2339: Property 'if' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(339,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(342,22): error TS2551: Property 'getState' does not exist on type 'QualityAgent'. Did you mean 'getStatus'?
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(345,36): error TS2551: Property 'getState' does not exist on type 'QualityAgent'. Did you mean 'getStatus'?
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(348,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2554, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2551, 2551, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339,
    ... 23 more items
  ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/structureagent/structureagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'StructureAgent'. Did you mean 'metadata'?
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'StructureAgent'. Did you mean 'metadata'?
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'getVersion' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'getVersion' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(69,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'getDependencies' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'getDependencies' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(78,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(87,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'analyzeFileStructure' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'analyzeFileStructure' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(96,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(132,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'identifyEntryPoints' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'identifyEntryPoints' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(141,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(150,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(159,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(168,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(177,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'analyzeTemplateUsage' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'analyzeTemplateUsage' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(186,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(195,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(204,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(222,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(231,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'if' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(240,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(243,22): error TS2551: Property 'getState' does not exist on type 'StructureAgent'. Did you mean 'getStatus'?
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(246,36): error TS2551: Property 'getState' does not exist on type 'StructureAgent'. Did you mean 'getStatus'?
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(249,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2554, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2551,  2551, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2551,
     2551, 18046
  ]
}
```

### type (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/type-audit-agent/type-audit-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
packages/mcp-agents/business/misc/type-audit-agent/type-audit-agent.ts(56,14): error TS2420: Class 'type' incorrectly implements interface 'BusinessAgent'.
  Type 'type' is missing the following properties from type 'BusinessAgent': domain, capabilities, getSummary

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Module.require (node:internal/modules/cjs/loader:1298:19) {
  diagnosticCodes: [ 2420 ]
}
```

### SEOCheckerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/validators/seo-checker-agent/seo-checker-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'SEOCheckerAgent'. Did you mean 'metadata'?
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'SEOCheckerAgent'. Did you mean 'metadata'?
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(66,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(69,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(78,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(87,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(96,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(123,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'runAutoFix' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'runAutoFix' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(132,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(141,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'if' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(150,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(159,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'fixCanonicals' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'fixCanonicals' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(168,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(177,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'fixRedirects' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'fixRedirects' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(186,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(195,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'generateSEOReport' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'generateSEOReport' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(204,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'catch' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(213,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'logSEORouteTrace' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'logSEORouteTrace' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(222,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(225,22): error TS2551: Property 'getState' does not exist on type 'SEOCheckerAgent'. Did you mean 'getStatus'?
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(228,36): error TS2551: Property 'getState' does not exist on type 'SEOCheckerAgent'. Did you mean 'getStatus'?
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(231,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339,  2339,  2339,  2339,  2339,
     2554, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2551,  2551, 18046,  2554, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2551,  2551, 18046
  ]
}
```

### AbstractAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractAgent
Test terminé avec succès
```

### AbstractAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-analyzer-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractAnalyzerAgent
Test terminé avec succès
```

### AbstractGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-generator-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractGeneratorAgent
Test terminé avec succès
```

### AbstractOrchestratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-orchestrator-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractOrchestratorAgent
Test terminé avec succès
```

### AbstractProcessorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-processor-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractProcessorAgent
Test terminé avec succès
```

### AbstractValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-validator-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractValidatorAgent
Test terminé avec succès
```

### AgentRegistry (/workspaces/cahier-des-charge/packages/mcp-agents/core/agent-registry.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(1,10): error TS2724: '"/workspaces/cahier-des-charge/packages/mcp-agents/core/agent-registry.ts"' has no exported member named 'AgentRegistry'. Did you mean 'agentRegistry'?
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(22,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(31,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(40,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(49,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(58,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(67,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(76,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(85,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(94,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(103,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(112,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(121,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(130,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(139,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentRegistry-2025-04-20-00-00-19.ts(148,44): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2724, 18046, 18046,
    18046, 18046, 18046,
    18046, 18046, 18046,
    18046, 18046, 18046,
    18046, 18046, 18046,
    18046
  ]
}
```

### BaseMcpAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/base-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseMcpAgent-2025-04-20-00-00-19.ts(1,10): error TS2724: '"/workspaces/cahier-des-charge/packages/mcp-agents/core/base-agent.ts"' has no exported member named 'BaseMcpAgent'. Did you mean 'BaseAgent'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2724 ]
}
```

### BaseMcpAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/interfaces/base-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseMcpAgent-2025-04-20-00-00-19.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/packages/mcp-agents/core/interfaces/base-agent.ts"' has no exported member 'BaseMcpAgent'. Did you mean to use 'import BaseMcpAgent from "/workspaces/cahier-des-charge/packages/mcp-agents/core/interfaces/base-agent.ts"' instead?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2614 ]
}
```

### BaseMcpAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/interfaces.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseMcpAgent-2025-04-20-00-00-19.ts(4,7): error TS2654: Non-abstract class 'TestBaseMcpAgent' is missing implementations for the following members of 'BaseMcpAgent<any, AgentConfig>': 'metadata', 'execute'.
../../tmp/test-BaseMcpAgent-2025-04-20-00-00-19.ts(12,19): error TS2554: Expected 1 arguments, but got 0.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2654, 2554 ]
}
```

### AbstractGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract-generator-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractGeneratorAgent
Test terminé avec succès
```

### AbstractGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-00-19.ts(1,10): error TS2724: '"/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract-generator.ts"' has no exported member named 'AbstractGeneratorAgent'. Did you mean 'AbstractGenerator'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2724 ]
}
```

### BaseGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/generators/base-generator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(21,44): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(24,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(27,22): error TS2339: Property 'performGeneration' does not exist on type 'TestBaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(30,36): error TS2339: Property 'performGeneration' does not exist on type 'TestBaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(33,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'resolveOutputDirectory' does not exist on type 'TestBaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'resolveOutputDirectory' does not exist on type 'TestBaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(42,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'prepareEnvironment' does not exist on type 'TestBaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'prepareEnvironment' does not exist on type 'TestBaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(51,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(54,22): error TS2339: Property 'prettifyGeneratedFiles' does not exist on type 'TestBaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(57,36): error TS2339: Property 'prettifyGeneratedFiles' does not exist on type 'TestBaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-00-19.ts(60,61): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2345, 18046, 2339,
    2339, 18046, 2339,
    2339, 18046, 2339,
    2339, 18046, 2339,
    2339, 18046
  ]
}
```

### agent (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/agent-audit/agent-audit.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-agent-2025-04-20-00-00-19.ts(6,11): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-20-00-00-19.ts(6,23): error TS2448: Block-scoped variable 'agent' used before its declaration.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 7022, 2448 ]
}
```

### Agent8SqlOptimizer (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/agent8-optimizer/agent8-optimizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'Agent8SqlOptimizer'. Did you mean 'metadata'?
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'Agent8SqlOptimizer'. Did you mean 'metadata'?
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(66,44): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(69,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(78,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(87,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(96,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(105,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'catch' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'catch' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(132,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'analyzeIndexes' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'analyzeIndexes' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(141,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'generateIndexSuggestions' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'generateIndexSuggestions' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(150,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'for' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'for' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(159,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'for' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'for' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(168,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'analyzeTypeAlignment' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'analyzeTypeAlignment' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(177,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'analyzePartitioningOpportunities' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'analyzePartitioningOpportunities' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(186,71): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'generatePartitionPlan' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'generatePartitionPlan' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(195,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'for' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'for' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(204,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'analyzeUnusedColumns' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'analyzeUnusedColumns' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(222,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'col_description' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'col_description' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(231,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(240,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'generatePerformanceAudit' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'generatePerformanceAudit' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(249,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(258,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'for' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'for' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(267,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(276,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(285,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'generateSchemaOptimizationNotes' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'generateSchemaOptimizationNotes' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(294,70): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'sendToSupabase' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'sendToSupabase' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(303,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'summarizeResults' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'summarizeResults' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(312,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(321,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(330,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(333,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(336,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(339,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(342,22): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(345,36): error TS2339: Property 'if' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(348,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(351,22): error TS2339: Property 'getSystemState' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(354,36): error TS2339: Property 'getSystemState' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(357,53): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339,  2339,  2339, 2339,  2339,  2339, 2339,  2339,  2339,
    2339,  2339,  2339, 2339,  2339,  2339, 2339,  2554, 18046,
    2339,  2339, 18046, 2339,  2339, 18046, 2551,  2551, 18046,
    2345, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339,
    ... 25 more items
  ]
}
```

### CoordinatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/coordinator-agent/coordinator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'CoordinatorAgent'. Did you mean 'metadata'?
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'CoordinatorAgent'. Did you mean 'metadata'?
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(69,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(78,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'registerAgents' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'registerAgents' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(87,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(90,22): error TS2551: Property 'validateFile' does not exist on type 'CoordinatorAgent'. Did you mean 'validate'?
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(93,36): error TS2551: Property 'validateFile' does not exist on type 'CoordinatorAgent'. Did you mean 'validate'?
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(96,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(105,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'ensureOutputDirectory' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'ensureOutputDirectory' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(114,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(123,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'initializeAuditSections' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'initializeAuditSections' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(132,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(141,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(150,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'executeAgent' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'executeAgent' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(159,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(168,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(177,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(186,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(195,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(204,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(213,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(222,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(231,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(240,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'resolveDependencies' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'resolveDependencies' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(249,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(258,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'forEach' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'forEach' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(267,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'executeSerially' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'executeSerially' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(276,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(285,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(294,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'executeInParallel' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'executeInParallel' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(303,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'while' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'while' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(312,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(321,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(330,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(336,44): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(339,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(342,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(345,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(348,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(351,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(354,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(357,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(360,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(363,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(366,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(369,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(372,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(375,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(378,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(381,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(384,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(387,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(390,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(393,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(396,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(399,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(402,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(405,22): error TS2339: Property 'updateAgentProgress' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(408,36): error TS2339: Property 'updateAgentProgress' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(411,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(414,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(417,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(420,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(423,22): error TS2339: Property 'updateDashboard' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(426,36): error TS2339: Property 'updateDashboard' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(429,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(432,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(435,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(438,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(441,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(444,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(447,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(450,22): error TS2339: Property 'sendMessage' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(453,36): error TS2339: Property 'sendMessage' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(456,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(459,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(462,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(465,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(468,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(471,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(474,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(477,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(480,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(483,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(486,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(489,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(492,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(495,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(498,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(501,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(504,22): error TS2339: Property 'sendInterAgentMessage' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(507,36): error TS2339: Property 'sendInterAgentMessage' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(510,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(513,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(516,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(519,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(522,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(525,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(528,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(531,22): error TS2339: Property 'getMessagesForAgent' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(534,36): error TS2339: Property 'getMessagesForAgent' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(537,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(540,22): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(543,36): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(546,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(549,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(552,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(555,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(558,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(561,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(564,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(567,22): error TS2339: Property 'markMessageAsProcessed' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(570,36): error TS2339: Property 'markMessageAsProcessed' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(573,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(576,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(579,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(582,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(585,22): error TS2339: Property 'generateDashboardReport' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(588,36): error TS2339: Property 'generateDashboardReport' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(591,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(594,22): error TS2339: Property 'media' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(597,36): error TS2339: Property 'media' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(600,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(603,22): error TS2339: Property 'join' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(606,36): error TS2339: Property 'join' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(609,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(612,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(615,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(618,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(621,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(624,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(627,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(630,22): error TS2339: Property 'generateExecutionReport' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(633,36): error TS2339: Property 'generateExecutionReport' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(636,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(639,22): error TS2339: Property 'forEach' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(642,36): error TS2339: Property 'forEach' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(645,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(648,22): error TS2339: Property 'saveExecutionReport' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(651,36): error TS2339: Property 'saveExecutionReport' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(654,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(657,22): error TS2339: Property 'getVersion' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(660,36): error TS2339: Property 'getVersion' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(663,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(666,22): error TS2339: Property 'initRealTimeDashboard' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(669,36): error TS2339: Property 'initRealTimeDashboard' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(672,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(675,22): error TS2339: Property 'updateDashboard' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(678,36): error TS2339: Property 'updateDashboard' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(681,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(684,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(687,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(690,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(693,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(696,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(699,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(702,22): error TS2339: Property 'calculateMetrics' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(705,36): error TS2339: Property 'calculateMetrics' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(708,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(711,22): error TS2339: Property 'calculateProgress' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(714,36): error TS2339: Property 'calculateProgress' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(717,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(720,22): error TS2339: Property 'calculateOverallStatus' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(723,36): error TS2339: Property 'calculateOverallStatus' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(726,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(729,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(732,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(735,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(738,22): error TS2339: Property 'sendMessage' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(741,36): error TS2339: Property 'sendMessage' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(744,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(747,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(750,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(753,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(756,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(759,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(762,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(765,22): error TS2339: Property 'processMessage' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(768,36): error TS2339: Property 'processMessage' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(771,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(774,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(777,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(780,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(783,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(786,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(789,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(792,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(795,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(798,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(801,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(804,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(807,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(810,22): error TS2339: Property 'createCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(813,36): error TS2339: Property 'createCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(816,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(819,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(822,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(825,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(828,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(831,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(834,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(837,22): error TS2339: Property 'restoreFromCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(840,36): error TS2339: Property 'restoreFromCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(843,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(846,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(849,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(852,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(855,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(858,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(861,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(864,22): error TS2339: Property 'saveCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(867,36): error TS2339: Property 'saveCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(870,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(873,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(876,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(879,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(882,22): error TS2339: Property 'loadCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(885,36): error TS2339: Property 'loadCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(888,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(891,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(894,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(897,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(900,22): error TS2339: Property 'clearCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(903,36): error TS2339: Property 'clearCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(906,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(909,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(912,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(915,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(918,22): error TS2339: Property 'calculateProgress' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(921,36): error TS2339: Property 'calculateProgress' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(924,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(927,22): error TS2339: Property 'loadCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(930,36): error TS2339: Property 'loadCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(933,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(936,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(939,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(942,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(945,22): error TS2339: Property 'saveCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(948,36): error TS2339: Property 'saveCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(951,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(954,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(957,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(960,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(963,22): error TS2339: Property 'addCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(966,36): error TS2339: Property 'addCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(969,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(972,22): error TS2339: Property 'hasCompletedCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(975,36): error TS2339: Property 'hasCompletedCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(978,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(981,22): error TS2339: Property 'updateCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(984,36): error TS2339: Property 'updateCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(987,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(990,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(993,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(996,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(999,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1002,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1005,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1008,22): error TS2339: Property 'saveCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1011,36): error TS2339: Property 'saveCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1014,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1017,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1020,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1023,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1026,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1029,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1032,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1035,22): error TS2339: Property 'loadCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1038,36): error TS2339: Property 'loadCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1041,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1044,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1047,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1050,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1053,22): error TS2339: Property 'hasCompletedCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1056,36): error TS2339: Property 'hasCompletedCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1059,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1062,22): error TS2339: Property 'getPreviousAgentResult' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1065,36): error TS2339: Property 'getPreviousAgentResult' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1068,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1071,22): error TS2339: Property 'cleanupCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1074,36): error TS2339: Property 'cleanupCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1077,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1080,22): error TS2339: Property 'listCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1083,36): error TS2339: Property 'listCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1086,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1089,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1092,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1095,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1098,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1101,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1104,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1107,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1110,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1113,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1116,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1119,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1122,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1125,22): error TS2339: Property 'restoreFromLastCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1128,36): error TS2339: Property 'restoreFromLastCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1131,64): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1134,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1137,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1140,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1143,22): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1146,36): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1149,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1152,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1155,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1158,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1161,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1164,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1167,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1170,22): error TS2339: Property 'executeAgent' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1173,36): error TS2339: Property 'executeAgent' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1176,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1179,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1182,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1185,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1188,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1191,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1194,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1197,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1200,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1203,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1206,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1209,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1212,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1215,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1218,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1221,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1224,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1227,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1230,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1233,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1236,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1239,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1242,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1245,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1248,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1251,22): error TS2339: Property 'handleRetry' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1254,36): error TS2339: Property 'handleRetry' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1257,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1260,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1263,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1266,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1269,22): error TS2339: Property 'getRetryCount' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1272,36): error TS2339: Property 'getRetryCount' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1275,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1278,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1281,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1284,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1287,22): error TS2339: Property 'incrementRetryCount' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1290,36): error TS2339: Property 'incrementRetryCount' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1293,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1296,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1299,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1302,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1305,22): error TS2339: Property 'calculateRetryDelay' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1308,36): error TS2339: Property 'calculateRetryDelay' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1311,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1314,22): error TS2339: Property 'saveCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1317,36): error TS2339: Property 'saveCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1320,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1323,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1326,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1329,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1332,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1335,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1338,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1341,22): error TS2339: Property 'updateCheckpointIndex' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1344,36): error TS2339: Property 'updateCheckpointIndex' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1347,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1350,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1353,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1356,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1359,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1362,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1365,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1368,22): error TS2339: Property 'hasCompletedCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1371,36): error TS2339: Property 'hasCompletedCheckpoint' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1374,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1377,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1380,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1383,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1386,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1389,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1392,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1395,22): error TS2339: Property 'getPreviousAgentResult' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1398,36): error TS2339: Property 'getPreviousAgentResult' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1401,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1404,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1407,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1410,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1413,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1416,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1419,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1422,22): error TS2339: Property 'cleanupCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1425,36): error TS2339: Property 'cleanupCheckpoints' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1428,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1431,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1434,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1437,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1440,22): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1443,36): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1446,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1449,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1452,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1455,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1458,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1461,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1464,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1467,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1470,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1473,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1476,22): error TS2339: Property 'rebuildCheckpointIndex' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1479,36): error TS2339: Property 'rebuildCheckpointIndex' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1482,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1485,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1488,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1491,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1494,22): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1497,36): error TS2339: Property 'for' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1500,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1503,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1506,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1509,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1512,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1515,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1518,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1521,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1524,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1527,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1530,22): error TS2339: Property 'main' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1533,36): error TS2339: Property 'main' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1536,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1539,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1542,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1545,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1548,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1551,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1554,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1557,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1560,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1563,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1566,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1569,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1572,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1575,22): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1578,36): error TS2339: Property 'catch' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1581,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1584,22): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1587,36): error TS2339: Property 'if' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1590,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1593,22): error TS2339: Property 'getSystemState' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1596,36): error TS2339: Property 'getSystemState' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(1599,53): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2554, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2551, 2551, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2551, 2551, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339,
    ... 439 more items
  ]
}
```

### php (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/php-analyzer-agent/php-analyzer-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
packages/mcp-agents/orchestration/misc/php-analyzer-agent/php-analyzer-agent.ts(161,36): error TS2307: Cannot find module '@workspaces/cahier-des-charge/src/core/interfaces/orchestration' or its corresponding type declarations.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Module.require (node:internal/modules/cjs/loader:1298:19) {
  diagnosticCodes: [ 2307 ]
}
```

### StatusWriterAgent (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/status-writer/status-writer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'StatusWriterAgent'. Did you mean 'metadata'?
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'StatusWriterAgent'. Did you mean 'metadata'?
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(69,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(75,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(78,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(87,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'loadStatusFile' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'loadStatusFile' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(96,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(105,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'saveStatusFile' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'saveStatusFile' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(123,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(132,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'updateSummary' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'updateSummary' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(141,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'setupEventListeners' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'setupEventListeners' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(150,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'updateJobStatus' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'updateJobStatus' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(159,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'logError' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'logError' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(168,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(177,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'syncWithSupabase' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'syncWithSupabase' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(186,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(195,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(204,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(213,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'syncJobsWithRedis' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'syncJobsWithRedis' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(222,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(231,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'for' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'for' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(240,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(249,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'for' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'for' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(258,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(267,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(276,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'getRedisJobs' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'getRedisJobs' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(285,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'switch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'switch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(294,45): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(303,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'start' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'start' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(312,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(318,41): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(321,43): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'catch' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(330,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(333,22): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(336,36): error TS2339: Property 'if' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(339,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(342,22): error TS2339: Property 'getSystemState' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(345,36): error TS2339: Property 'getSystemState' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(348,53): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339,  2339,  2339, 2339,  2339,  2339, 2339,  2339,  2339,
    2339,  2339,  2339, 2339,  2339,  2339, 2339,  2554, 18046,
    2339,  2339, 18046, 2339,  2339, 18046, 2551,  2551, 18046,
    2339,  2339, 18046, 2554, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339, 18046,  2339, 2339, 18046,  2339, 2339, 18046,  2339,
    2339,
    ... 21 more items
  ]
}
```

### AgentOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/orchestrators/agent-orchestrator/agent-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(9,40): error TS2339: Property 'id' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(10,42): error TS2339: Property 'name' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(11,42): error TS2339: Property 'type' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(12,45): error TS2339: Property 'version' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(13,40): error TS2339: Property 'id' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(14,42): error TS2339: Property 'name' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(15,42): error TS2339: Property 'type' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(17,40): error TS2339: Property 'id' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(18,42): error TS2339: Property 'name' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(19,42): error TS2339: Property 'type' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(20,45): error TS2339: Property 'version' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(21,40): error TS2339: Property 'id' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(22,42): error TS2339: Property 'name' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(23,42): error TS2339: Property 'type' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(24,45): error TS2339: Property 'version' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(30,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(33,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'isReady' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'isReady' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(42,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'shutdown' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'shutdown' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(51,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(54,22): error TS2551: Property 'getMetadata' does not exist on type 'AgentOrchestrator'. Did you mean 'metadata'?
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(57,36): error TS2551: Property 'getMetadata' does not exist on type 'AgentOrchestrator'. Did you mean 'metadata'?
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(60,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(63,22): error TS2339: Property 'initializePipelineStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(66,36): error TS2339: Property 'initializePipelineStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(69,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(72,22): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(75,36): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(78,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(81,22): error TS2339: Property 'createDefaultPipelineStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(84,36): error TS2339: Property 'createDefaultPipelineStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(87,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(90,22): error TS2339: Property 'runPipeline' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(93,36): error TS2339: Property 'runPipeline' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(96,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(99,22): error TS2339: Property 'for' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(102,36): error TS2339: Property 'for' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(105,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(108,22): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(111,36): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(114,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(117,22): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(120,36): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(123,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(126,22): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(129,36): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(132,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(135,22): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(138,36): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(141,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(144,22): error TS2339: Property 'runAgent' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(147,36): error TS2339: Property 'runAgent' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(150,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(153,22): error TS2339: Property 'switch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(156,36): error TS2339: Property 'switch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(159,45): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(162,22): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(165,36): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(168,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(171,22): error TS2339: Property 'updateAgentStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(174,36): error TS2339: Property 'updateAgentStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(177,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(180,22): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(183,36): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(186,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(189,22): error TS2339: Property 'updateIssuesSummary' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(192,36): error TS2339: Property 'updateIssuesSummary' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(195,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(198,22): error TS2339: Property 'writeAgentLogs' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(201,36): error TS2339: Property 'writeAgentLogs' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(204,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(207,22): error TS2339: Property 'updateOverallStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(210,36): error TS2339: Property 'updateOverallStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(213,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(216,22): error TS2339: Property 'updateProgressData' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(219,36): error TS2339: Property 'updateProgressData' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(222,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(225,22): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(228,36): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(231,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(234,22): error TS2339: Property 'runPerformanceBenchmarks' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(237,36): error TS2339: Property 'runPerformanceBenchmarks' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(240,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(243,22): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(246,36): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(249,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(252,22): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(255,36): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(258,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(261,22): error TS2339: Property 'generateFinalReports' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(264,36): error TS2339: Property 'generateFinalReports' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(267,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(270,22): error TS2339: Property 'saveDashboardData' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(273,36): error TS2339: Property 'saveDashboardData' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(276,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(279,22): error TS2339: Property 'generateMarkdownReport' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(282,36): error TS2339: Property 'generateMarkdownReport' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(285,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(288,22): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(291,36): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(294,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(297,22): error TS2339: Property 'savePipelineStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(300,36): error TS2339: Property 'savePipelineStatus' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(303,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(306,22): error TS2339: Property 'ensureDirectoriesExist' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(309,36): error TS2339: Property 'ensureDirectoriesExist' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(312,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(315,22): error TS2339: Property 'getStatusEmoji' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(318,36): error TS2339: Property 'getStatusEmoji' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(321,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(324,22): error TS2339: Property 'switch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(327,36): error TS2339: Property 'switch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(330,45): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(333,22): error TS2339: Property 'countFiles' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(336,36): error TS2339: Property 'countFiles' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(339,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(342,22): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(345,36): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(348,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(351,22): error TS2339: Property 'countFilesWithCondition' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(354,36): error TS2339: Property 'countFilesWithCondition' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(357,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(360,22): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(363,36): error TS2339: Property 'catch' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(366,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(369,22): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(372,36): error TS2339: Property 'if' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(375,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(378,22): error TS2339: Property 'split' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(381,36): error TS2339: Property 'split' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(384,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(387,22): error TS2339: Property 'getSystemState' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(390,36): error TS2339: Property 'getSystemState' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(393,53): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339,  2339, 2339, 2339,  2339, 2339, 2554, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2551, 2551, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046, 2339, 2339, 18046,
    2339,
    ... 38 more items
  ]
}
```

### AbstractOrchestratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/abstract-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(1,10): error TS2724: '"/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/abstract-orchestrator.ts"' has no exported member named 'AbstractOrchestratorAgent'. Did you mean 'AbstractOrchestrator'?
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(15,40): error TS2339: Property 'id' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(16,45): error TS2339: Property 'version' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(17,42): error TS2339: Property 'name' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(18,49): error TS2339: Property 'description' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(19,44): error TS2339: Property 'config' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(20,45): error TS2339: Property '_status' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(23,22): error TS2339: Property 'initialize' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(26,36): error TS2339: Property 'initialize' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(29,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(32,22): error TS2339: Property 'initializeInternal' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(35,36): error TS2339: Property 'initializeInternal' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(38,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(41,22): error TS2339: Property 'run' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(44,36): error TS2339: Property 'run' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(47,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(50,22): error TS2339: Property 'deployWorkflow' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(53,36): error TS2339: Property 'deployWorkflow' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(56,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(59,22): error TS2339: Property 'executeWorkflow' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(62,36): error TS2339: Property 'executeWorkflow' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(65,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(68,22): error TS2339: Property 'getExecutionState' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(71,36): error TS2339: Property 'getExecutionState' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(74,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(77,22): error TS2339: Property 'cancelExecution' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(80,36): error TS2339: Property 'cancelExecution' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(83,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(86,22): error TS2339: Property 'getExecutionHistory' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(89,36): error TS2339: Property 'getExecutionHistory' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(92,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(95,22): error TS2339: Property 'scheduleWorkflow' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(98,36): error TS2339: Property 'scheduleWorkflow' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(101,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(104,22): error TS2339: Property 'listWorkflows' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(107,36): error TS2339: Property 'listWorkflows' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(110,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(113,22): error TS2339: Property 'listExecutions' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(116,36): error TS2339: Property 'listExecutions' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(119,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(122,22): error TS2339: Property 'signalWorkflow' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(125,36): error TS2339: Property 'signalWorkflow' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(128,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(131,22): error TS2339: Property 'getStatus' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(134,36): error TS2339: Property 'getStatus' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(137,48): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(140,22): error TS2339: Property 'getOrchestratorStats' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(143,36): error TS2339: Property 'getOrchestratorStats' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(146,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(149,22): error TS2339: Property 'cleanup' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(152,36): error TS2339: Property 'cleanup' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(155,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(158,22): error TS2339: Property 'cleanupInternal' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(161,36): error TS2339: Property 'cleanupInternal' does not exist on type 'TestAbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-00-19.ts(164,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2724,  2339,  2339,  2339,  2339,  2339,  2339,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,  2339, 18046
  ]
}
```

### BaseOrchestratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/base-orchestrator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(15,52): error TS2339: Property 'workflowEvents' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(16,51): error TS2339: Property 'workflowState' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(22,44): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(25,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(28,22): error TS2339: Property 'prepareExecutionPlan' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(31,36): error TS2339: Property 'prepareExecutionPlan' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(34,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(37,22): error TS2339: Property 'executeWorkflow' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(40,36): error TS2339: Property 'executeWorkflow' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(43,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(46,22): error TS2339: Property 'executeAgent' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(49,36): error TS2339: Property 'executeAgent' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(52,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(55,22): error TS2339: Property 'updateStepStatus' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(58,36): error TS2339: Property 'updateStepStatus' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(61,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(64,22): error TS2339: Property 'callWebhook' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(67,36): error TS2339: Property 'callWebhook' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(70,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(73,22): error TS2339: Property 'updateStatusFile' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(76,36): error TS2339: Property 'updateStatusFile' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(79,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(82,22): error TS2339: Property 'onWorkflowEvent' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(85,36): error TS2339: Property 'onWorkflowEvent' does not exist on type 'TestBaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-00-19.ts(88,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2345, 18046,
     2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339,
    18046
  ]
}
```

### RemixGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/remix-generator/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(9,42): error TS2339: Property 'name' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(10,45): error TS2339: Property 'version' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(11,49): error TS2339: Property 'description' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(17,44): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(20,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(26,45): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(29,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(32,22): error TS2339: Property 'generateRemixCode' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(35,36): error TS2339: Property 'generateRemixCode' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(38,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(41,22): error TS2339: Property 'generateLoaderCode' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(44,36): error TS2339: Property 'generateLoaderCode' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(47,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(50,22): error TS2339: Property 'generateMetaCode' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(53,36): error TS2339: Property 'generateMetaCode' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(56,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(59,22): error TS2339: Property 'generateSchemaCode' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(62,36): error TS2339: Property 'generateSchemaCode' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(65,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(68,22): error TS2339: Property 'generateAction' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(71,36): error TS2339: Property 'generateAction' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(74,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(77,22): error TS2339: Property 'generateContentSection' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(80,36): error TS2339: Property 'generateContentSection' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(83,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(86,22): error TS2339: Property 'generatePagination' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(89,36): error TS2339: Property 'generatePagination' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(92,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(95,22): error TS2339: Property 'generateForm' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(98,36): error TS2339: Property 'generateForm' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(101,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(104,22): error TS2339: Property 'generateLoaderLogic' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(107,36): error TS2339: Property 'generateLoaderLogic' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(110,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(113,22): error TS2339: Property 'detectFormFields' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(116,36): error TS2339: Property 'detectFormFields' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(119,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(122,22): error TS2339: Property 'generateFormField' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(125,36): error TS2339: Property 'generateFormField' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(128,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(131,22): error TS2339: Property 'generateZodValidator' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(134,36): error TS2339: Property 'generateZodValidator' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(137,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(140,22): error TS2339: Property 'pascalCase' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(143,36): error TS2339: Property 'pascalCase' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(146,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(149,22): error TS2339: Property 'titleCase' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(152,36): error TS2339: Property 'titleCase' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-00-19.ts(155,48): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339, 2339, 2339,  2345, 18046, 2345,
    18046, 2339, 2339, 18046,  2339, 2339,
    18046, 2339, 2339, 18046,  2339, 2339,
    18046, 2339, 2339, 18046,  2339, 2339,
    18046, 2339, 2339, 18046,  2339, 2339,
    18046, 2339, 2339, 18046,  2339, 2339,
    18046, 2339, 2339, 18046,  2339, 2339,
    18046, 2339, 2339, 18046,  2339, 2339,
    18046
  ]
}
```

### BaseMcpAgent (/workspaces/cahier-des-charge/packages/mcp-agents/shared/base-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseMcpAgent-2025-04-20-00-00-19.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/packages/mcp-agents/shared/base-agent.ts"' has no exported member 'BaseMcpAgent'. Did you mean to use 'import BaseMcpAgent from "/workspaces/cahier-des-charge/packages/mcp-agents/shared/base-agent.ts"' instead?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2614 ]
}
```

### LayeredAgentAuditor (/workspaces/cahier-des-charge/packages/mcp-agents/tools/layered-agent-auditor/layered-agent-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(9,45): error TS2339: Property 'baseDir' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(10,49): error TS2339: Property 'packagesDir' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(13,22): error TS2339: Property 'audit' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(16,36): error TS2339: Property 'audit' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(19,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(22,22): error TS2339: Property 'extractAgentInfo' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(25,36): error TS2339: Property 'extractAgentInfo' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(28,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(31,22): error TS2339: Property 'inferTypeFromDirectory' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(34,36): error TS2339: Property 'inferTypeFromDirectory' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(37,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(40,22): error TS2339: Property 'scanLegacyAgents' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(43,36): error TS2339: Property 'scanLegacyAgents' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(46,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(49,22): error TS2339: Property 'generateMarkdownReport' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(52,36): error TS2339: Property 'generateMarkdownReport' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(55,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(58,22): error TS2339: Property 'auditAndGenerateReport' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(61,36): error TS2339: Property 'auditAndGenerateReport' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-00-19.ts(64,61): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,  2339,  2339,
    18046,  2339,  2339, 18046,
     2339,  2339, 18046,  2339,
     2339, 18046,  2339,  2339,
    18046,  2339,  2339, 18046
  ]
}
```

### AgentCommunication (/workspaces/cahier-des-charge/packages/mcp-agents/utils/agent-communication.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(9,46): error TS2339: Property 'instance' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(10,50): error TS2339: Property 'eventEmitter' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(11,54): error TS2339: Property 'registeredAgents' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(12,53): error TS2339: Property 'messageHandlers' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(13,53): error TS2339: Property 'pendingRequests' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(14,44): error TS2339: Property 'config' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(17,22): error TS2339: Property 'getInstance' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(20,36): error TS2339: Property 'getInstance' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(23,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(26,22): error TS2339: Property 'configure' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(29,36): error TS2339: Property 'configure' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(32,48): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(35,22): error TS2339: Property 'registerAgent' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(38,36): error TS2339: Property 'registerAgent' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(41,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(44,22): error TS2339: Property 'unregisterAgent' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(47,36): error TS2339: Property 'unregisterAgent' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(50,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(53,22): error TS2339: Property 'sendMessage' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(56,36): error TS2339: Property 'sendMessage' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(59,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(62,22): error TS2339: Property 'sendRequest' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(65,36): error TS2339: Property 'sendRequest' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(68,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(71,22): error TS2339: Property 'on' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(74,36): error TS2339: Property 'on' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(77,41): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(80,22): error TS2339: Property 'off' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(83,36): error TS2339: Property 'off' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(86,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(89,22): error TS2339: Property 'removeAllHandlers' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(92,36): error TS2339: Property 'removeAllHandlers' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(95,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(98,22): error TS2339: Property 'generateMessageId' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(101,36): error TS2339: Property 'generateMessageId' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(104,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(107,22): error TS2339: Property 'generateCorrelationId' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(110,36): error TS2339: Property 'generateCorrelationId' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(113,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(116,22): error TS2339: Property 'executeAgent' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(119,36): error TS2339: Property 'executeAgent' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(122,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(125,22): error TS2339: Property 'executeAgentChain' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(128,36): error TS2339: Property 'executeAgentChain' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-00-19.ts(131,56): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2339, 2339,  2339, 2339, 2339,  2339,
    2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046, 2339, 2339, 18046,
    2339, 2339, 18046
  ]
}
```

### AbstractValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract-validator-agent.ts)

- ✅ Test réussi
```
Test de la classe abstraite AbstractValidatorAgent
Test terminé avec succès
```

### AbstractValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-00-19.ts(1,10): error TS2724: '"/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract-validator.ts"' has no exported member named 'AbstractValidatorAgent'. Did you mean 'AbstractValidator'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2724 ]
}
```

### BaseValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/base-validator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(21,44): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(24,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(27,22): error TS2339: Property 'performValidation' does not exist on type 'TestBaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(30,36): error TS2339: Property 'performValidation' does not exist on type 'TestBaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(33,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(36,22): error TS2339: Property 'applyAutofixes' does not exist on type 'TestBaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(39,36): error TS2339: Property 'applyAutofixes' does not exist on type 'TestBaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(42,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(45,22): error TS2339: Property 'calculateScore' does not exist on type 'TestBaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(48,36): error TS2339: Property 'calculateScore' does not exist on type 'TestBaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(51,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(54,22): error TS2339: Property 'loadRules' does not exist on type 'TestBaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(57,36): error TS2339: Property 'loadRules' does not exist on type 'TestBaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-00-19.ts(60,48): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2345, 18046, 2339,
    2339, 18046, 2339,
    2339, 18046, 2339,
    2339, 18046, 2339,
    2339, 18046
  ]
}
```

### SEOCheckerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker/seo-checker-agent/seo-checker-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(9,48): error TS2339: Property 'seoChecker' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(13,22): error TS2339: Property 'initializeInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(16,36): error TS2339: Property 'initializeInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(19,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(22,22): error TS2339: Property 'cleanupInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(25,36): error TS2339: Property 'cleanupInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(28,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,
     2339, 18046,
     2339,  2339,
    18046
  ]
}
```

### SEOCheckerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker/seo-checker-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(9,48): error TS2339: Property 'seoChecker' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(13,22): error TS2339: Property 'initializeInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(16,36): error TS2339: Property 'initializeInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(19,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(22,22): error TS2339: Property 'cleanupInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(25,36): error TS2339: Property 'cleanupInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(28,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,
     2339, 18046,
     2339,  2339,
    18046
  ]
}
```

### SEOCheckerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(9,48): error TS2339: Property 'seoChecker' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(13,22): error TS2339: Property 'initializeInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(16,36): error TS2339: Property 'initializeInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(19,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(22,22): error TS2339: Property 'cleanupInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(25,36): error TS2339: Property 'cleanupInternal' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(28,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2339,  2339,
     2339, 18046,
     2339,  2339,
    18046
  ]
}
```

### DataAgent (/workspaces/cahier-des-charge/agents/analysis/DataAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(15,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(18,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(24,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(27,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(33,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(36,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(42,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(45,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(51,36): error TS2554: Expected 2 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(54,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(60,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(63,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(69,54): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(72,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(78,53): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string[]'.
  Type '{}' is missing the following properties from type 'string[]': length, pop, push, concat, and 29 more.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(81,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(87,54): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string[]'.
  Type '{}' is missing the following properties from type 'string[]': length, pop, push, concat, and 29 more.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(90,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(96,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-20-00-00-19.ts(99,53): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554, 2554, 18046, 2554,
    18046, 2554, 18046, 2554,
    18046, 2554, 18046, 2554,
    18046, 2345, 18046, 2345,
    18046, 2345, 18046, 2554,
    18046
  ]
}
```

### DependencyAgent (/workspaces/cahier-des-charge/agents/analysis/DependencyAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(9,49): error TS2341: Property 'impactGraph' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(15,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(18,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(21,22): error TS2341: Property 'identifyIncludedFiles' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(24,36): error TS2341: Property 'identifyIncludedFiles' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(24,58): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(27,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(30,22): error TS2341: Property 'analyzeCrossCalls' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(33,36): error TS2341: Property 'analyzeCrossCalls' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(33,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(36,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(39,22): error TS2341: Property 'extractGlobalVariables' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(42,36): error TS2341: Property 'extractGlobalVariables' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(42,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(45,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(48,22): error TS2341: Property 'extractExternalFunctionCalls' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(51,36): error TS2341: Property 'extractExternalFunctionCalls' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(51,65): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(54,67): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(57,22): error TS2341: Property 'analyzeSessionUsage' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(60,36): error TS2341: Property 'analyzeSessionUsage' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(60,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(63,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(66,22): error TS2341: Property 'extractSessionKeys' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(69,36): error TS2341: Property 'extractSessionKeys' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(69,55): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(72,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(75,22): error TS2341: Property 'generateImpactGraph' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(78,36): error TS2341: Property 'generateImpactGraph' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(78,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(81,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(84,22): error TS2341: Property 'extractIncludes' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(87,36): error TS2341: Property 'extractIncludes' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(87,52): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(90,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(93,22): error TS2341: Property 'saveImpactGraph' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(96,36): error TS2341: Property 'saveImpactGraph' is private and only accessible within class 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(96,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-20-00-00-19.ts(99,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2554,  2341, 2554, 18046, 2341,  2341,
    2554, 18046, 2341,  2341, 2554, 18046,
    2341,  2341, 2345, 18046, 2341,  2341,
    2345, 18046, 2341,  2341, 2554, 18046,
    2341,  2341, 2345, 18046, 2341,  2341,
    2554, 18046, 2341,  2341, 2345, 18046,
    2341,  2341, 2554, 18046
  ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/agents/analysis/StructureAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(15,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(18,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(24,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(27,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(33,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(36,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(39,22): error TS2341: Property 'analyzeFileStructure' is private and only accessible within class 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(42,36): error TS2341: Property 'analyzeFileStructure' is private and only accessible within class 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(42,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(45,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(48,22): error TS2341: Property 'identifyEntryPoints' is private and only accessible within class 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(51,36): error TS2341: Property 'identifyEntryPoints' is private and only accessible within class 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(51,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(54,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(57,22): error TS2341: Property 'analyzeTemplateUsage' is private and only accessible within class 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(60,36): error TS2341: Property 'analyzeTemplateUsage' is private and only accessible within class 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(60,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(63,59): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554, 2554, 18046, 2554,
    18046, 2554, 18046, 2341,
     2341, 2554, 18046, 2341,
     2341, 2554, 18046, 2341,
     2341, 2554, 18046
  ]
}
```

### DataAnalyzer (/workspaces/cahier-des-charge/agents/analysis/agent-donnees.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/agents/analysis/agent-donnees.ts"' has no exported member 'DataAnalyzer'. Did you mean to use 'import DataAnalyzer from "/workspaces/cahier-des-charge/agents/analysis/agent-donnees.ts"' instead?
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(20,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(29,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(38,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(47,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(56,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(65,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(74,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(83,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-DataAnalyzer-2025-04-20-00-00-19.ts(92,61): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2614, 18046, 18046,
    18046, 18046, 18046,
    18046, 18046, 18046,
    18046
  ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/agents/analysis/agent-structure.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(9,45): error TS2339: Property 'phpCode' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(10,46): error TS2339: Property 'filePath' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(11,43): error TS2339: Property 'rules' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(17,46): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(20,48): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(23,22): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(26,36): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(29,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(35,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(38,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(44,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(47,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(53,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(56,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(62,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(65,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(71,58): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(74,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(80,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(83,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(89,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(92,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(98,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(101,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(107,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(110,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(116,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(119,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(125,62): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(128,64): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(134,59): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(137,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(143,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(146,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(152,58): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(155,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(161,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(164,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(170,50): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-20-00-00-19.ts(173,52): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554, 2339,  2339, 2339,  2554, 18046,
     2339, 2339, 18046, 2554, 18046,  2554,
    18046, 2554, 18046, 2554, 18046,  2554,
    18046, 2554, 18046, 2554, 18046,  2554,
    18046, 2554, 18046, 2554, 18046,  2554,
    18046, 2554, 18046, 2554, 18046,  2554,
    18046, 2554, 18046, 2554, 18046
  ]
}
```

### AutoPRAgent (/workspaces/cahier-des-charge/agents/auto-pr-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(9,44): error TS2339: Property 'logger' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(10,45): error TS2339: Property 'octokit' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(11,44): error TS2341: Property 'config' is private and only accessible within class 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(12,53): error TS2339: Property 'manifestManager' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(13,46): error TS2339: Property 'notifier' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(19,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(22,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(28,49): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(31,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(37,48): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(40,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(46,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(49,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(55,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(58,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(64,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(67,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(73,58): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(76,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(79,22): error TS2339: Property 'checkExistingPR' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(82,36): error TS2339: Property 'checkExistingPR' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-00-19.ts(85,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2554,  2339,  2339,  2341,
    2339,  2339,  2554, 18046,
    2554, 18046,  2554, 18046,
    2554, 18046,  2554, 18046,
    2554, 18046,  2554, 18046,
    2339,  2339, 18046
  ]
}
```

### BaseAgent (/workspaces/cahier-des-charge/agents/core/BaseAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(4,7): error TS2515: Non-abstract class 'TestBaseAgent' does not implement inherited abstract member analyze from class 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(12,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(15,46): error TS2445: Property 'filePath' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(16,49): error TS2445: Property 'fileContent' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(17,46): error TS2445: Property 'sections' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(18,47): error TS2445: Property 'startTime' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(19,44): error TS2445: Property 'errors' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(20,46): error TS2445: Property 'warnings' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(21,47): error TS2445: Property 'artifacts' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(27,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(30,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(36,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(39,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(45,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(48,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(54,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(57,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(63,49): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(66,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(69,22): error TS2445: Property 'addSection' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(72,36): error TS2445: Property 'addSection' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(72,36): error TS2554: Expected 4-6 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(75,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(78,22): error TS2445: Property 'addWarning' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(81,36): error TS2445: Property 'addWarning' is protected and only accessible within class 'BaseAgent' and its subclasses.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(81,47): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(84,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(90,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(93,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(99,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-20-00-00-19.ts(102,46): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2515,  2554,  2445,  2445,  2445,
     2445,  2445,  2445,  2445,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046,  2554, 18046,  2445,
     2445,  2554, 18046,  2445,  2445,
     2345, 18046,  2554, 18046,  2554,
    18046
  ]
}
```

### AgentOrchestrator (/workspaces/cahier-des-charge/agents/core/agent-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(9,52): error TS2551: Property 'pipelineStatus' does not exist on type 'AgentOrchestrator'. Did you mean 'savePipelineStatus'?
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(10,43): error TS2339: Property 'runId' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(16,61): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(19,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(25,64): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(28,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(34,48): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(37,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(43,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(46,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(52,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(55,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(61,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(64,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(70,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(73,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(79,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(82,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(88,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(91,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(97,61): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(100,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(106,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(109,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(115,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(118,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(124,59): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(127,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(133,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(136,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(142,59): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(145,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(151,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(154,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(160,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(163,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(169,60): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-AgentOrchestrator-2025-04-20-00-00-19.ts(172,62): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554,  2551,  2339,  2554, 18046,
     2554, 18046,  2554, 18046,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046,  2554, 18046,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046,  2554, 18046,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046,  2554, 18046
  ]
}
```

### CoordinatorAgent (/workspaces/cahier-des-charge/agents/core/coordinator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(9,44): error TS2341: Property 'config' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(10,45): error TS2341: Property 'results' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(11,47): error TS2341: Property 'startTime' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(12,51): error TS2341: Property 'agentRegistry' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(13,47): error TS2341: Property 'artifacts' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(14,50): error TS2341: Property 'messageQueue' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(15,58): error TS2341: Property 'dashboardUpdateTimer' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(16,49): error TS2341: Property 'checkpoints' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(17,52): error TS2341: Property 'checkpointFile' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(20,22): error TS2341: Property 'registerAgents' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(23,36): error TS2341: Property 'registerAgents' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(23,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(26,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(29,22): error TS2341: Property 'validateFile' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(32,36): error TS2341: Property 'validateFile' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(32,49): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(35,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(38,22): error TS2341: Property 'ensureOutputDirectory' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(41,36): error TS2341: Property 'ensureOutputDirectory' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(41,58): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(44,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(47,22): error TS2341: Property 'initializeAuditSections' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(50,36): error TS2341: Property 'initializeAuditSections' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(50,60): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(53,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(56,22): error TS2341: Property 'executeAgent' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(59,36): error TS2341: Property 'executeAgent' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(59,49): error TS2769: No overload matches this call.
  Overload 1 of 2, '(agentName: string): Promise<AgentExecutionResult>', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 2 of 2, '(agentName: string, args?: any): Promise<AgentExecutionResult>', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(62,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(65,22): error TS2341: Property 'resolveDependencies' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(68,36): error TS2341: Property 'resolveDependencies' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(68,56): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string[]'.
  Type '{}' is missing the following properties from type 'string[]': length, pop, push, concat, and 29 more.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(71,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(74,22): error TS2341: Property 'executeSerially' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(77,36): error TS2341: Property 'executeSerially' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(77,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(80,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(83,22): error TS2341: Property 'executeInParallel' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(86,36): error TS2341: Property 'executeInParallel' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(86,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(89,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(95,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(98,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(101,22): error TS2341: Property 'updateAgentProgress' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(104,36): error TS2341: Property 'updateAgentProgress' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(104,36): error TS2554: Expected 2-3 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(107,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(110,22): error TS2341: Property 'updateDashboard' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(113,36): error TS2341: Property 'updateDashboard' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(113,36): error TS2575: No overload expects 1 arguments, but overloads do exist that expect either 0 or 2 arguments.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(116,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(122,48): error TS2769: No overload matches this call.
  Overload 1 of 2, '(message: Omit<InterAgentMessage, "timestamp">): void', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'Omit<InterAgentMessage, "timestamp">'.
      Type '{}' is missing the following properties from type 'Omit<InterAgentMessage, "timestamp">': from, to, type, priority, content
  Overload 2 of 2, '(message: Omit<InterAgentMessage, "timestamp">): void', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'Omit<InterAgentMessage, "timestamp">'.
      Type '{}' is missing the following properties from type 'Omit<InterAgentMessage, "timestamp">': from, to, type, priority, content
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(125,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(128,22): error TS2341: Property 'sendInterAgentMessage' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(131,36): error TS2341: Property 'sendInterAgentMessage' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(131,36): error TS2554: Expected 4 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(134,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(140,56): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(143,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(149,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(152,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(155,22): error TS2341: Property 'generateDashboardReport' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(158,36): error TS2341: Property 'generateDashboardReport' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(158,60): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(161,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(167,60): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(170,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(176,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(179,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(185,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(188,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(191,22): error TS2341: Property 'initRealTimeDashboard' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(194,36): error TS2341: Property 'initRealTimeDashboard' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(194,58): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(197,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(200,22): error TS2341: Property 'updateDashboard' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(203,36): error TS2341: Property 'updateDashboard' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(203,36): error TS2575: No overload expects 1 arguments, but overloads do exist that expect either 0 or 2 arguments.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(206,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(209,22): error TS2341: Property 'calculateMetrics' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(212,36): error TS2341: Property 'calculateMetrics' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(212,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(215,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(218,22): error TS2341: Property 'calculateProgress' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(221,36): error TS2341: Property 'calculateProgress' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(221,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(224,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(227,22): error TS2341: Property 'calculateOverallStatus' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(230,36): error TS2341: Property 'calculateOverallStatus' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(230,59): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(233,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(239,48): error TS2769: No overload matches this call.
  Overload 1 of 2, '(message: Omit<InterAgentMessage, "timestamp">): void', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'Omit<InterAgentMessage, "timestamp">'.
      Type '{}' is missing the following properties from type 'Omit<InterAgentMessage, "timestamp">': from, to, type, priority, content
  Overload 2 of 2, '(message: Omit<InterAgentMessage, "timestamp">): void', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'Omit<InterAgentMessage, "timestamp">'.
      Type '{}' is missing the following properties from type 'Omit<InterAgentMessage, "timestamp">': from, to, type, priority, content
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(242,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(245,22): error TS2341: Property 'processMessage' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(248,36): error TS2341: Property 'processMessage' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(248,51): error TS2345: Argument of type '{}' is not assignable to parameter of type 'InterAgentMessage'.
  Type '{}' is missing the following properties from type 'InterAgentMessage': from, to, type, priority, and 2 more.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(251,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(254,22): error TS2341: Property 'createCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(257,36): error TS2341: Property 'createCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(257,36): error TS2554: Expected 2 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(260,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(263,22): error TS2341: Property 'restoreFromCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(266,36): error TS2341: Property 'restoreFromCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(266,58): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(269,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(272,22): error TS2341: Property 'saveCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(275,36): error TS2341: Property 'saveCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(275,36): error TS2554: Expected 2-5 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(278,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(281,22): error TS2341: Property 'loadCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(284,36): error TS2341: Property 'loadCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(284,51): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(287,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(290,22): error TS2341: Property 'clearCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(293,36): error TS2341: Property 'clearCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(293,52): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(296,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(299,22): error TS2341: Property 'calculateProgress' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(302,36): error TS2341: Property 'calculateProgress' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(302,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(305,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(308,22): error TS2341: Property 'loadCheckpoints' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(311,36): error TS2341: Property 'loadCheckpoints' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(311,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(314,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(317,22): error TS2341: Property 'saveCheckpoints' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(320,36): error TS2341: Property 'saveCheckpoints' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(320,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(323,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(326,22): error TS2341: Property 'addCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(329,36): error TS2341: Property 'addCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(329,36): error TS2554: Expected 3-4 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(332,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(335,22): error TS2341: Property 'hasCompletedCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(338,36): error TS2341: Property 'hasCompletedCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(338,59): error TS2769: No overload matches this call.
  Overload 1 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 2 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 3 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(341,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(344,22): error TS2341: Property 'updateCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(347,36): error TS2341: Property 'updateCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(347,36): error TS2554: Expected 2-3 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(350,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(353,22): error TS2341: Property 'saveCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(356,36): error TS2341: Property 'saveCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(356,36): error TS2554: Expected 2-5 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(359,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(362,22): error TS2341: Property 'loadCheckpoints' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(365,36): error TS2341: Property 'loadCheckpoints' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(365,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(368,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(371,22): error TS2341: Property 'hasCompletedCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(374,36): error TS2341: Property 'hasCompletedCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(374,59): error TS2769: No overload matches this call.
  Overload 1 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 2 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 3 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(377,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(383,59): error TS2769: No overload matches this call.
  Overload 1 of 2, '(agentName: string): AgentExecutionResult | null', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 2 of 2, '(agentName: string): AgentExecutionResult | null', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(386,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(392,55): error TS2769: No overload matches this call.
  Overload 1 of 2, '(maxAge?: number): void', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'number'.
  Overload 2 of 2, '(maxAge?: number): void', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'number'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(395,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(404,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(410,62): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(413,64): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(416,22): error TS2341: Property 'executeAgent' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(419,36): error TS2341: Property 'executeAgent' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(419,49): error TS2769: No overload matches this call.
  Overload 1 of 2, '(agentName: string): Promise<AgentExecutionResult>', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 2 of 2, '(agentName: string, args?: any): Promise<AgentExecutionResult>', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(422,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(425,22): error TS2341: Property 'handleRetry' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(428,36): error TS2341: Property 'handleRetry' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(428,36): error TS2554: Expected 3 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(431,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(434,22): error TS2341: Property 'getRetryCount' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(437,36): error TS2341: Property 'getRetryCount' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(437,50): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(440,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(443,22): error TS2341: Property 'incrementRetryCount' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(446,36): error TS2341: Property 'incrementRetryCount' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(446,56): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(449,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(452,22): error TS2341: Property 'calculateRetryDelay' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(455,36): error TS2341: Property 'calculateRetryDelay' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(455,56): error TS2345: Argument of type '{}' is not assignable to parameter of type 'number'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(458,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(461,22): error TS2341: Property 'saveCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(464,36): error TS2341: Property 'saveCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(464,36): error TS2554: Expected 2-5 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(467,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(470,22): error TS2341: Property 'updateCheckpointIndex' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(473,36): error TS2341: Property 'updateCheckpointIndex' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(473,36): error TS2554: Expected 2 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(476,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(479,22): error TS2341: Property 'hasCompletedCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(482,36): error TS2341: Property 'hasCompletedCheckpoint' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(482,59): error TS2769: No overload matches this call.
  Overload 1 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 2 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 3 of 3, '(agentName: string): boolean', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(485,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(491,59): error TS2769: No overload matches this call.
  Overload 1 of 2, '(agentName: string): AgentExecutionResult | null', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
  Overload 2 of 2, '(agentName: string): AgentExecutionResult | null', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(494,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(500,55): error TS2769: No overload matches this call.
  Overload 1 of 2, '(maxAge?: number): void', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'number'.
  Overload 2 of 2, '(maxAge?: number): void', gave the following error.
    Argument of type '{}' is not assignable to parameter of type 'number'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(503,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(506,22): error TS2341: Property 'rebuildCheckpointIndex' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(509,36): error TS2341: Property 'rebuildCheckpointIndex' is private and only accessible within class 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(509,59): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-20-00-00-19.ts(512,61): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2554,  2341,  2341,  2341,  2341,  2341,  2341,  2341,  2341,
    2341,  2341,  2341,  2554, 18046,  2341,  2341,  2554, 18046,
    2341,  2341,  2554, 18046,  2341,  2341,  2554, 18046,  2341,
    2341,  2769, 18046,  2341,  2341,  2345, 18046,  2341,  2341,
    2554, 18046,  2341,  2341,  2554, 18046,  2554, 18046,  2341,
    2341,  2554, 18046,  2341,  2341,  2575, 18046,  2769, 18046,
    2341,  2341,  2554, 18046,  2345, 18046,  2345, 18046,  2341,
    2341,  2554, 18046,  2554, 18046,  2554, 18046,  2554, 18046,
    2341,  2341,  2554, 18046,  2341,  2341,  2575, 18046,  2341,
    2341,  2554, 18046,  2341,  2341,  2554, 18046,  2341,  2341,
    2554, 18046,  2769, 18046,  2341,  2341,  2345, 18046,  2341,
    2341,
    ... 101 more items
  ]
}
```

### PreviewAgent (/workspaces/cahier-des-charge/agents/devops-preview.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/agents/devops-preview.ts"' has no exported member 'PreviewAgent'. Did you mean to use 'import PreviewAgent from "/workspaces/cahier-des-charge/agents/devops-preview.ts"' instead?
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(21,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(30,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(39,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(48,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(57,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(66,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(75,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-PreviewAgent-2025-04-20-00-00-19.ts(84,50): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2614, 18046,
    18046, 18046,
    18046, 18046,
    18046, 18046,
    18046
  ]
}
```

### BusinessAgent (/workspaces/cahier-des-charge/agents/migration/BusinessAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(15,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(18,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(24,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(27,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(33,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(36,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(39,22): error TS2341: Property 'detectPageType' is private and only accessible within class 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(42,36): error TS2341: Property 'detectPageType' is private and only accessible within class 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(42,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(45,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(48,22): error TS2341: Property 'analyzeBusinessLogic' is private and only accessible within class 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(51,36): error TS2341: Property 'analyzeBusinessLogic' is private and only accessible within class 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(51,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(54,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(57,22): error TS2341: Property 'analyzeBusinessCases' is private and only accessible within class 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(60,36): error TS2341: Property 'analyzeBusinessCases' is private and only accessible within class 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(60,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(63,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(66,22): error TS2341: Property 'generateBusinessContextContent' is private and only accessible within class 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(69,36): error TS2341: Property 'generateBusinessContextContent' is private and only accessible within class 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(69,67): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(72,69): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554, 2554, 18046, 2554,
    18046, 2554, 18046, 2341,
     2341, 2554, 18046, 2341,
     2341, 2554, 18046, 2341,
     2341, 2554, 18046, 2341,
     2341, 2345, 18046
  ]
}
```

### BusinessAgent (/workspaces/cahier-des-charge/agents/migration/agent-business.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(9,46): error TS2339: Property 'filePath' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(10,49): error TS2339: Property 'fileContent' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(11,46): error TS2339: Property 'sections' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(20,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(23,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(29,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(32,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(38,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(41,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(47,58): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(50,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(56,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(59,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(65,49): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(68,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(74,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(77,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(86,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(92,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(95,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(101,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(104,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(110,48): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(113,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(119,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-20-00-00-19.ts(122,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554,  2339,  2339,  2339,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046,  2554, 18046,  2554,
    18046,  2554, 18046, 18046,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046
  ]
}
```

### CanonicalSyncAgent (/workspaces/cahier-des-charge/agents/migration/php-to-remix/canonical-sync-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(23,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(32,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(38,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(41,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(47,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(50,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(56,48): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(59,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(65,52): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-00-19.ts(68,54): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    18046, 18046,  2554,
    18046,  2554, 18046,
     2554, 18046,  2345,
    18046
  ]
}
```

### ProgressiveMigrationAgent (/workspaces/cahier-des-charge/agents/migration/progressive-migration-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(9,50): error TS2551: Property 'proxyConfigs' does not exist on type 'ProgressiveMigrationAgent'. Did you mean 'loadProxyConfigs'?
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(10,53): error TS2339: Property 'proxyConfigPath' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(16,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(19,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(25,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(28,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(34,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(37,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(43,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(46,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(52,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(55,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(61,72): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(64,74): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(70,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-00-19.ts(73,58): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554, 2551,  2339, 2554,
    18046, 2554, 18046, 2554,
    18046, 2554, 18046, 2554,
    18046, 2554, 18046, 2554,
    18046
  ]
}
```

### TypeAuditor (/workspaces/cahier-des-charge/agents/migration/type-audit-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/agents/migration/type-audit-agent.ts"' has no exported member 'TypeAuditor'. Did you mean to use 'import TypeAuditor from "/workspaces/cahier-des-charge/agents/migration/type-audit-agent.ts"' instead?
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(20,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(29,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(38,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(47,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(56,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(65,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(74,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(83,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(92,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(101,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-TypeAuditor-2025-04-20-00-00-19.ts(110,50): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2614, 18046, 18046,
    18046, 18046, 18046,
    18046, 18046, 18046,
    18046, 18046, 18046
  ]
}
```

### MonitoringAgent (/workspaces/cahier-des-charge/agents/monitoring-check.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(1,10): error TS2724: '"/workspaces/cahier-des-charge/agents/monitoring-check.ts"' has no exported member named 'MonitoringAgent'. Did you mean 'monitoring'?
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(21,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(30,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(39,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(48,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(57,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(66,68): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(75,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(84,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(93,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(102,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(111,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-MonitoringAgent-2025-04-20-00-00-19.ts(120,42): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2724, 18046, 18046,
    18046, 18046, 18046,
    18046, 18046, 18046,
    18046, 18046, 18046,
    18046
  ]
}
```

### Agent8SqlOptimizer (/workspaces/cahier-des-charge/agents/optimization/agent8-optimizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(9,49): error TS2339: Property 'description' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(19,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(22,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(28,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(31,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(37,61): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(40,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(46,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(49,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(55,69): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(58,71): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(64,58): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(67,60): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(73,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(76,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(79,22): error TS2339: Property 'analyzeSlowQueries' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(82,36): error TS2339: Property 'analyzeSlowQueries' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(85,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(91,61): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(94,63): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(100,68): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(103,70): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(109,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(112,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(118,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(121,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(130,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(136,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(139,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(145,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(148,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(154,48): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(157,50): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(160,22): error TS2339: Property 'getState' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(163,36): error TS2339: Property 'getState' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-00-19.ts(166,47): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554,  2339,  2554, 18046,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046,  2554, 18046,  2554,
    18046,  2339,  2339, 18046,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046, 18046,  2554, 18046,
     2554, 18046,  2554, 18046,  2339,
     2339, 18046
  ]
}
```

### QualityAgent (/workspaces/cahier-des-charge/agents/quality/QualityAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(15,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(18,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(21,22): error TS2341: Property 'evaluateComplexity' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(24,36): error TS2341: Property 'evaluateComplexity' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(24,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(27,57): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(30,22): error TS2341: Property 'determineComplexitySeverity' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(33,36): error TS2341: Property 'determineComplexitySeverity' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(33,64): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(36,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(39,22): error TS2341: Property 'analyzeSecurityRisks' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(42,36): error TS2341: Property 'analyzeSecurityRisks' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(42,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(45,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(48,22): error TS2341: Property 'evaluateOverallQuality' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(51,36): error TS2341: Property 'evaluateOverallQuality' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(51,59): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(54,61): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(57,22): error TS2341: Property 'generateQualityRecommendation' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(60,36): error TS2341: Property 'generateQualityRecommendation' is private and only accessible within class 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(60,36): error TS2554: Expected 2 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(63,68): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2554, 18046, 2341, 2341,
    2554, 18046, 2341, 2341,
    2345, 18046, 2341, 2341,
    2554, 18046, 2341, 2341,
    2554, 18046, 2341, 2341,
    2554, 18046
  ]
}
```

### QualityAgent (/workspaces/cahier-des-charge/agents/quality/agent-quality.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(9,46): error TS2339: Property 'filePath' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(10,49): error TS2339: Property 'fileContent' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(11,46): error TS2339: Property 'sections' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(17,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(20,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(26,64): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(29,66): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(35,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(38,59): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(44,60): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(47,62): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(53,67): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(56,69): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(62,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(65,46): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(71,49): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(74,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(80,44): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-20-00-00-19.ts(83,46): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    2554,  2339, 2339,  2339,
    2554, 18046, 2554, 18046,
    2554, 18046, 2554, 18046,
    2554, 18046, 2554, 18046,
    2554, 18046, 2554, 18046
  ]
}
```

### SEOCheckerAgent (/workspaces/cahier-des-charge/agents/seo-checker-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(11,49): error TS2339: Property 'description' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(13,48): error TS2339: Property 'seoChecker' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(14,50): error TS2339: Property 'traceService' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(23,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(29,40): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(32,42): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(38,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(41,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(47,50): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(50,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(56,49): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(59,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(65,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(68,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(74,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-00-19.ts(77,55): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554, 2339,  2339, 2339,
    18046, 2554, 18046, 2554,
    18046, 2554, 18046, 2554,
    18046, 2554, 18046, 2554,
    18046
  ]
}
```

### StatusWriterAgent (/workspaces/cahier-des-charge/agents/status-writer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(6,19): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(9,44): error TS2339: Property 'logger' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(10,48): error TS2339: Property 'statusPath' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(11,45): error TS2339: Property 'logPath' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(12,51): error TS2339: Property 'redisJobsPath' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(13,49): error TS2339: Property 'redisClient' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(14,52): error TS2339: Property 'supabaseClient' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(15,50): error TS2339: Property 'eventEmitter' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(16,48): error TS2339: Property 'statusData' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(25,49): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(31,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(34,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(40,51): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(43,53): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(49,50): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(52,52): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(58,56): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(61,58): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(67,52): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(70,54): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(76,45): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(79,47): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(85,53): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(88,55): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(94,54): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(97,56): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(103,49): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(106,51): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(112,42): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(115,44): error TS18046: 'error' is of type 'unknown'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(121,41): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StatusWriterAgent-2025-04-20-00-00-19.ts(124,43): error TS18046: 'error' is of type 'unknown'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
     2554,  2339,  2339,  2339,  2339,
     2339,  2339,  2339,  2339, 18046,
     2554, 18046,  2554, 18046,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046,  2554, 18046,  2554,
    18046,  2554, 18046,  2554, 18046,
     2554, 18046
  ]
}
```

- Total des tests: 0
- Tests réussis: 0
- Tests échoués: 0
- Tests ignorés: 0

