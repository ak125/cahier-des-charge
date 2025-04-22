# Rapport des tests adaptés d'agents MCP - Fri Apr 18 02:17:19 UTC 2025

## Résumé

### base-analyzer-agent.ts.backup (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base-analyzer-agent.ts.backup)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-base-analyzer.ts(5,32): error TS2315: Type 'BaseAnalyzerAgent' is not generic.
tests/agents/test-base-analyzer.ts(48,17): error TS2339: Property 'execute' does not exist on type 'TestBaseAnalyzer'.
tests/agents/test-base-analyzer.ts(52,17): error TS2339: Property 'execute' does not exist on type 'TestBaseAnalyzer'.
tests/agents/test-base-analyzer.ts(76,9): error TS2353: Object literal may only specify known properties, and 'executionTime' does not exist in type 'AgentResult<T>'.
tests/agents/test-base-analyzer.ts(83,9): error TS2353: Object literal may only specify known properties, and 'executionTime' does not exist in type 'AgentResult<T>'.
tests/agents/test-base-analyzer.ts(91,25): error TS2351: This expression is not constructable.
  Type 'typeof TestBaseAnalyzer' has no construct signatures.

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
  diagnosticCodes: [ 2315, 2339, 2339, 2353, 2353, 2351 ]
}
```

### abstract-analyzer-agent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer-agent.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-abstract-analyzer.ts(12,10): error TS2339: Property 'addSection' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(21,23): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(25,23): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(28,41): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
tests/agents/test-abstract-analyzer.ts(42,19): error TS2339: Property 'initialize' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(45,34): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.

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
  diagnosticCodes: [ 2339, 2339, 2339, 1064, 2339, 2339 ]
}
```

### php-analyzer-v2 (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-v2.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-php-analyzer-v2.ts(44,16): error TS18046: 'error' is of type 'unknown'.

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
  diagnosticCodes: [ 18046 ]
}
```

### abstract-analyzer-agent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer-agent.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-abstract-analyzer.ts(12,10): error TS2339: Property 'addSection' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(21,23): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(25,23): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(28,41): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
tests/agents/test-abstract-analyzer.ts(42,19): error TS2339: Property 'initialize' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(45,34): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.

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
  diagnosticCodes: [ 2339, 2339, 2339, 1064, 2339, 2339 ]
}
```

### DataAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/data-analyzer/DataAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DataAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
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
../../tmp/test-DataAnalyzerAgent-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAnalyzerAgent-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof DataAnalyzerAgent' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### DataAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/data-analyzer/DataAgent/DataAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DataAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
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
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DependencyAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
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
../../tmp/test-DependencyAnalyzerAgent-2025-04-18-02-17-19.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DependencyAnalyzerAgent-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof DependencyAnalyzerAgent' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### DependencyAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dependency-analyzer/DependencyAgent/DependencyAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DependencyAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### QAAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### AbstractAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractAnalyzerAgent-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractAnalyzerAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### PhpAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PhpAnalyzerAgent'.
../../tmp/test-PhpAnalyzerAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PhpAnalyzerAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### php-analyzer-v2 (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-v2.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-php-analyzer-v2.ts(44,16): error TS18046: 'error' is of type 'unknown'.

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
  diagnosticCodes: [ 18046 ]
}
```

### php-analyzer-v2 (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-v2/php-analyzer-v2.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-php-analyzer-v2.ts(44,16): error TS18046: 'error' is of type 'unknown'.

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
  diagnosticCodes: [ 18046 ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/structure-analyzer/StructureAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
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
../../tmp/test-StructureAnalyzerAgent-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAnalyzerAgent-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof StructureAnalyzerAgent' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/structure-analyzer/StructureAgent/StructureAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### QAAnalyzerV2 (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer-v2.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzerV2-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzerV2-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof QAAnalyzerV2' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### QaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer/qa-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(29,47): error TS2345: Argument of type '{}' is not assignable to parameter of type '{ target: string; options?: { recursive?: boolean | undefined; modelName?: string | undefined; generateTests?: boolean | undefined; } | undefined; }'.
  Property 'target' is missing in type '{}' but required in type '{ target: string; options?: { recursive?: boolean | undefined; modelName?: string | undefined; generateTests?: boolean | undefined; } | undefined; }'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.

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
    5097, 2339, 2339,
    2339, 2339, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### QaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(29,47): error TS2345: Argument of type '{}' is not assignable to parameter of type '{ target: string; options?: { recursive?: boolean | undefined; modelName?: string | undefined; generateTests?: boolean | undefined; } | undefined; }'.
  Property 'target' is missing in type '{}' but required in type '{ target: string; options?: { recursive?: boolean | undefined; modelName?: string | undefined; generateTests?: boolean | undefined; } | undefined; }'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.

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
    5097, 2339, 2339,
    2339, 2339, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### base-analyzer-agent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base-analyzer-agent.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-base-analyzer.ts(5,32): error TS2315: Type 'BaseAnalyzerAgent' is not generic.
tests/agents/test-base-analyzer.ts(48,17): error TS2339: Property 'execute' does not exist on type 'TestBaseAnalyzer'.
tests/agents/test-base-analyzer.ts(52,17): error TS2339: Property 'execute' does not exist on type 'TestBaseAnalyzer'.
tests/agents/test-base-analyzer.ts(76,9): error TS2353: Object literal may only specify known properties, and 'executionTime' does not exist in type 'AgentResult<T>'.
tests/agents/test-base-analyzer.ts(83,9): error TS2353: Object literal may only specify known properties, and 'executionTime' does not exist in type 'AgentResult<T>'.
tests/agents/test-base-analyzer.ts(91,25): error TS2351: This expression is not constructable.
  Type 'typeof TestBaseAnalyzer' has no construct signatures.

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
  diagnosticCodes: [ 2315, 2339, 2339, 2353, 2353, 2351 ]
}
```

### PrismaToZodGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/prisma-to-zod.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(47,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrismaToZodGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339
  ]
}
```

### monitoring (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/monitors/monitoring-check/monitoring-check.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'monitoring'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### StatusWriterAgent (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/status-writer/status-writer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'StatusWriterAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
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
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(23,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CoordinatorAgent'.

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
    5097, 2554, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
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
../../tmp/test-php-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'php'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### CaddyfileGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/caddyfile-generator/caddyfile-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(23,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.

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
    5097, 2554, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### Agent8SqlOptimizer (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/agent8-optimizer/agent8-optimizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(23,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'Agent8SqlOptimizer'.

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
    5097, 2554, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### sql (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/sql-analysis-runner/sql-analysis-runner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-sql-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-sql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'sql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
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
../../tmp/test-agent-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-agent-2025-04-18-02-17-19.ts(7,15): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-18-02-17-19.ts(7,27): error TS2448: Block-scoped variable 'agent' used before its declaration.

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
  diagnosticCodes: [ 5097, 7022, 2448 ]
}
```

### php (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/php-analyzer.worker/php-analyzer.worker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-php-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'php'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### mcp (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/misc/mcp-verifier.worker/mcp-verifier.worker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-mcp-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'mcp'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### orchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/orchestrators/orchestrator/orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'orchestrator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### MigrationOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/orchestrators/migration-orchestrator/migration-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MigrationOrchestrator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### BullMqOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/orchestrators/bullmq-orchestrator/bullmq-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'BullMqOrchestrator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### OrchestratorBridge (/workspaces/cahier-des-charge/packages/mcp-agents/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'OrchestratorBridge'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
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
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'AgentOrchestrator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
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
../../tmp/test-AgentCommunication-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AgentCommunication-2025-04-18-02-17-19.ts(7,23): error TS2673: Constructor of class 'AgentCommunication' is private and only accessible within the class declaration.

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
  diagnosticCodes: [ 5097, 2673 ]
}
```

### FileManager (/workspaces/cahier-des-charge/packages/mcp-agents/utils/file-manager.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'FileManager'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### Logger (/workspaces/cahier-des-charge/packages/mcp-agents/utils/logger.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-Logger-2025-04-18-02-17-19.ts(1,24): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1-2 arguments, but got 0.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'Logger'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### TypeScriptStructureValidator (/workspaces/cahier-des-charge/packages/mcp-agents/validators/typescript-structure-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(1,46): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TypeScriptStructureValidator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
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
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### BaseValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/base-validator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseValidatorAgent-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseValidatorAgent-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof BaseValidatorAgent' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### CanonicalValidator (/workspaces/cahier-des-charge/packages/mcp-agents/validators/canonical-validator/canonical-validator/canonical-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CanonicalValidator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### CanonicalValidator (/workspaces/cahier-des-charge/packages/mcp-agents/validators/canonical-validator/canonical-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CanonicalValidator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
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
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
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
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### AbstractValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractValidatorAgent-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractValidatorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### AbstractValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract-validator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractValidatorAgent-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractValidatorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### RemixGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/remix-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RemixGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### PrismaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/prisma-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrismaAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
  ]
}
```

### MigrationOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/migration-orchestrator/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MigrationOrchestrator'.

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
    5097, 2339, 2339,
    2339, 2339, 2554,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### QAAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/types/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### abstract-analyzer-agent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-analyzer-agent.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-abstract-analyzer.ts(12,10): error TS2339: Property 'addSection' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(21,23): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(25,23): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(28,41): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<boolean>'?
tests/agents/test-abstract-analyzer.ts(42,19): error TS2339: Property 'initialize' does not exist on type 'TestAnalyzerAgent'.
tests/agents/test-abstract-analyzer.ts(45,34): error TS2339: Property 'process' does not exist on type 'TestAnalyzerAgent'.

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
  diagnosticCodes: [ 2339, 2339, 2339, 1064, 2339, 2339 ]
}
```

### McpMetricsCollector (/workspaces/cahier-des-charge/packages/mcp-agents/core/metrics/metrics-collector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'McpMetricsCollector'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### RemixGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/core/remix-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RemixGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### AbstractGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-generator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractGeneratorAgent-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractGeneratorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### BaseMcpAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/interfaces/base-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseMcpAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseMcpAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### AbstractProcessorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-processor-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractProcessorAgent-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractProcessorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### ConsoleLogAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/core/logging/logger.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'ConsoleLogAdapter'.
../../tmp/test-ConsoleLogAdapter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'ConsoleLogAdapter'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### AgentRegistry (/workspaces/cahier-des-charge/packages/mcp-agents/core/agent-registry.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentRegistry-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AgentRegistry-2025-04-18-02-17-19.ts(7,23): error TS2673: Constructor of class 'AgentRegistry' is private and only accessible within the class declaration.

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
  diagnosticCodes: [ 5097, 2673 ]
}
```

### BaseMcpAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/base-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseMcpAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseMcpAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### NestJSGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/core/nestjs-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'NestJSGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### AbstractValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-validator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractValidatorAgent-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractValidatorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### AbstractAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractAgent-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### SEOChecker (/workspaces/cahier-des-charge/packages/mcp-agents/core/seo/seo-checker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOChecker'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### AbstractOrchestratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/abstract-orchestrator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractOrchestratorAgent-2025-04-18-02-17-19.ts(1,43): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractOrchestratorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### BaseMcpAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/interfaces.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseMcpAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseMcpAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### Database (/workspaces/cahier-des-charge/packages/mcp-agents/shared/db-connector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-Database-2025-04-18-02-17-19.ts(1,26): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-Database-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-Database-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'Database'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
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
../../tmp/test-BaseMcpAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseMcpAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### php (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/php-analyzer-v3/php-analyzer-v3.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-php-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'php'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### php (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/php-analyzer-v4/php-analyzer-v4.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-php-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'php'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### nginx (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/nginx-config-analyzer/nginx-config-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-nginx-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'nginx'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### HtaccessRouteAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/htaccess-route-analyzer/htaccess-route-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessRouteAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### php (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/php-analyzer/php-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-php-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'php'.
../../tmp/test-php-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'php'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### DebtAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/debt-analyzer/debt-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DebtAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### mysql (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/mysql-analyzer+optimizer/mysql-analyzer+optimizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-mysql-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'mysql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### HtaccessRouterAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/htaccess-router-analyzer/htaccess-router-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessRouterAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### sql (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/sql-analyzer+prisma-builder/sql-analyzer+prisma-builder.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-sql-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-sql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'sql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### QAAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/index/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.

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
    5097, 2554, 2339,
    2339, 2339, 2339,
    2339, 2339, 2554,
    2554, 2339, 2339,
    2339, 2339
  ]
}
```

### mysql (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/mysql-analyzer/mysql-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-mysql-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'mysql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SchemaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/schema-analyzer/schema-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SchemaAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### QaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/qa-analyzer/qa-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### php-analyzer-v2 (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/php-analyzer-v2/php-analyzer-v2.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-php-analyzer-v2.ts(44,16): error TS18046: 'error' is of type 'unknown'.

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
  diagnosticCodes: [ 18046 ]
}
```

### relation (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/relation-analyzer/relation-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-relation-2025-04-18-02-17-19.ts(1,26): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-relation-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'relation'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SecurityRiskAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/analyze-security-risks/analyze-security-risks.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SecurityRiskAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### NginxConfigParser (/workspaces/cahier-des-charge/packages/mcp-agents/business/parsers/nginx-config-parser/nginx-config-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'NginxConfigParser'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### SQLParser (/workspaces/cahier-des-charge/packages/mcp-agents/business/parsers/parser/parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SQLParser'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### HtaccessParser (/workspaces/cahier-des-charge/packages/mcp-agents/business/parsers/htaccess-parser/htaccess-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### postgresql (/workspaces/cahier-des-charge/packages/mcp-agents/business/validators/postgresql-validator/postgresql-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'postgresql'.
../../tmp/test-postgresql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'postgresql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### dev (/workspaces/cahier-des-charge/packages/mcp-agents/business/validators/dev-checker/dev-checker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-dev-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-dev-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'dev'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SeoChecker (/workspaces/cahier-des-charge/packages/mcp-agents/business/validators/seo-checker-canonical/seo-checker-canonical.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SeoChecker'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### CanonicalValidator (/workspaces/cahier-des-charge/packages/mcp-agents/business/validators/canonical-validator/canonical-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CanonicalValidator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### SEOCheckerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/validators/seo-checker-agent/seo-checker-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
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
../../tmp/test-type-2025-04-18-02-17-19.ts(1,22): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-type-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'type'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
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
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'BusinessAgent'.

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
    5097, 2554, 2339,
    2339, 2339, 2339,
    2339, 2339, 2554,
    2554, 2339, 2339,
    2339, 2339
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
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### table (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/table-cartographer/table-cartographer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-table-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-table-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'table'.
../../tmp/test-table-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'table'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### helpers (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/helpers/helpers.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-helpers-2025-04-18-02-17-19.ts(1,25): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'helpers'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### devops (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/devops-preview/devops-preview.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-devops-2025-04-18-02-17-19.ts(1,24): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-devops-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'devops'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
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
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'BusinessAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### mysql (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/mysql-to-postgresql/mysql-to-postgresql.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-mysql-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'mysql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### PhpRouterAudit (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/php-router-audit/php-router-audit.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PhpRouterAudit'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### pipeline (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/pipeline-strategy-auditor/pipeline-strategy-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(1,26): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'pipeline'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### TypeAuditor (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/type-auditor/type-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TypeAuditor'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### PRCreator (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/pr-creator/pr-creator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PRCreator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### SEOMCPController (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/seo-mcp-controller/seo-mcp-controller.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOMCPController'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
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
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DependencyAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### dev (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/dev-integrator/dev-integrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-dev-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-dev-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'dev'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### sql (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/sql-prisma-migration-planner/sql-prisma-migration-planner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-sql-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-sql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'sql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### MCPVerifier (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/mcp-verifier/mcp-verifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MCPVerifier'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### ProgressiveMigrationAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/progressive-migration-agent/progressive-migration-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(1,43): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'ProgressiveMigrationAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### mysql (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/mysql-to-pg/mysql-to-pg.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-mysql-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'mysql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### sql (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/sql-debt-audit/sql-debt-audit.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-sql-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-sql-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'sql'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### dev (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/dev-linter/dev-linter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-dev-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-dev-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'dev'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### type (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/type-mapper/type-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-type-2025-04-18-02-17-19.ts(1,22): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-type-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'type'.
../../tmp/test-type-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'type'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### remediator (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/remediator/remediator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-remediator-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'remediator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### AutoPRAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/auto-pr-agent/auto-pr-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'AutoPRAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
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
../../tmp/test-agent-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-agent-2025-04-18-02-17-19.ts(7,15): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-18-02-17-19.ts(7,27): error TS2448: Block-scoped variable 'agent' used before its declaration.

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
  diagnosticCodes: [ 5097, 7022, 2448 ]
}
```

### ci (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/ci-tester/ci-tester.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ci-2025-04-18-02-17-19.ts(1,20): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ci-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'ci'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
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
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'BaseAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
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
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DataAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### DebtDetector (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/debt-detector/debt-detector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DebtDetector'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### qa (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/qa-confirmer/qa-confirmer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-qa-2025-04-18-02-17-19.ts(1,20): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-qa-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'qa'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### data (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/data-verifier/data-verifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-data-2025-04-18-02-17-19.ts(1,22): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-data-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'data'.
../../tmp/test-data-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'data'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SEOContentEnhancer (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/seo-content-enhancer/seo-content-enhancer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOContentEnhancer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### QualityAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/agent-quality/agent-quality.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QualityAgent'.

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
    5097, 2554, 2339,
    2339, 2339, 2339,
    2339, 2339, 2554,
    2554, 2339, 2339,
    2339, 2339
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
../../tmp/test-discovery-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'discovery'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SEORedirectMapper (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/seo-redirect-mapper/seo-redirect-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEORedirectMapper'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### consolidator (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/consolidator/consolidator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'consolidator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### diff (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/diff-verifier/diff-verifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-diff-2025-04-18-02-17-19.ts(1,22): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-diff-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'diff'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SemanticMapper (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/semantic-table-mapper/semantic-table-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SemanticMapper'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
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
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QualityAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### RelationalNormalizer (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/relational-normalizer/relational-normalizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RelationalNormalizer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### TypeConverter (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/type-converter/type-converter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TypeConverter'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### migration (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/migration-strategist/migration-strategist.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-migration-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-migration-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'migration'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SEOAuditRunner (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/seo-audit-runner/seo-audit-runner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOAuditRunner'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
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
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### MCPManifestManager (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/mcp-manifest-manager/mcp-manifest-manager.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MCPManifestManager'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
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
../../tmp/test-agent-2025-04-18-02-17-19.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-agent-2025-04-18-02-17-19.ts(7,15): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-18-02-17-19.ts(7,27): error TS2448: Block-scoped variable 'agent' used before its declaration.

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
  diagnosticCodes: [ 5097, 7022, 2448 ]
}
```

### SeoMetadataGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/seo-meta.generator/seo-meta.generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SeoMetadataGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### PrismaGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/prisma-generator/prisma-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(47,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrismaGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339
  ]
}
```

### generate_prisma_model (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/generate_prisma_model/generate_prisma_model.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(47,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'generate_prisma_model'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339
  ]
}
```

### CaddyGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/caddy-generator/caddy-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(47,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CaddyGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339
  ]
}
```

### RemixRouteGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/remix-route-generator/remix-route-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RemixRouteGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### prisma (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/prisma-migration-generator/prisma-migration-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-prisma-2025-04-18-02-17-19.ts(1,24): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'prisma'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### prisma (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/prisma-smart-generator/prisma-smart-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-prisma-2025-04-18-02-17-19.ts(1,24): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'prisma'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### generate (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/generate-migration-plan/generate-migration-plan.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-generate-2025-04-18-02-17-19.ts(1,26): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-generate-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'generate'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### MetaGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/meta-generator/meta-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MetaGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### ComponentGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/component-generator/component-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'ComponentGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### DevGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/dev-generator/dev-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DevGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### ImageOptimizer (/workspaces/cahier-des-charge/packages/mcp-agents/processors/image-optimizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'ImageOptimizer'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### QAAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/php-analyzer/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### LayeredAgentAuditor (/workspaces/cahier-des-charge/packages/mcp-agents/tools/layered-agent-auditor/layered-agent-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'LayeredAgentAuditor'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SEOChecker (/workspaces/cahier-des-charge/packages/mcp-agents/seo-checker/seo-checker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOChecker'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### SEOCITester (/workspaces/cahier-des-charge/packages/mcp-agents/seo-checker/seo-ci-tester.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOCITester'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### NestJSGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/nestjs-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'NestJSGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
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
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'RemixGeneratorAgent'. Did you mean 'validate'?
../../tmp/test-RemixGeneratorAgent-2025-04-18-02-17-19.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'RemixGeneratorAgent'. Did you mean 'validate'?

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
    5097, 2339, 2339, 2345,
    2345, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2551, 2551
  ]
}
```

### AbstractGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractGeneratorAgent-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractGeneratorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### SEOContentEnhancer (/workspaces/cahier-des-charge/packages/mcp-agents/generators/content-generator/seo-content-enhancer/seo-content-enhancer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOContentEnhancer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### SEOContentEnhancer (/workspaces/cahier-des-charge/packages/mcp-agents/generators/content-generator/seo-content-enhancer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOContentEnhancer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### RemixGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/remix-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RemixGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### ReactComponentGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/react-component-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(46,26): error TS2445: Property 'generate' is protected and only accessible within class 'ReactComponentGenerator' and its subclasses.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(47,48): error TS2445: Property 'generate' is protected and only accessible within class 'ReactComponentGenerator' and its subclasses.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(47,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'ReactComponentGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2445, 2445,
    2554, 2339, 2339
  ]
}
```

### AbstractGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract-generator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractGeneratorAgent-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractGeneratorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### CaddyfileGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddyfile-generator/caddyfile-generator/caddyfile-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(11,25): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.

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
    5097, 2554, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### CaddyfileGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddyfile-generator/caddyfile-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(11,25): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.

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
    5097, 2554, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### BaseGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/generators/base-generator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseGeneratorAgent-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseGeneratorAgent-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof BaseGeneratorAgent' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### NestJSGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/nestjs-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'NestJSGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### MonorepoAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/monorepo-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MonorepoAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
  ]
}
```

### QAAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/qa-analyzer/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### QaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/qa-analyzer/qa-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(29,47): error TS2345: Argument of type '{}' is not assignable to parameter of type '{ target: string; options?: { recursive?: boolean | undefined; modelName?: string | undefined; generateTests?: boolean | undefined; } | undefined; }'.
  Property 'target' is missing in type '{}' but required in type '{ target: string; options?: { recursive?: boolean | undefined; modelName?: string | undefined; generateTests?: boolean | undefined; } | undefined; }'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.

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
    5097, 2339, 2339,
    2339, 2339, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### SystemIntegrationBridge (/workspaces/cahier-des-charge/packages/mcp-agents/coordination/bridges/system-integration-bridge/system-integration-bridge.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SystemIntegrationBridge'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### TemporalAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/three-layer/adapters/temporal-adapter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TemporalAdapter'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### TemporalOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/three-layer/implementations/temporal-orchestration.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TemporalOrchestrator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### TemporalRetryAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal/temporal-retry-adapter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TemporalRetryAdapter'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### TemporalAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/adapters/temporal-adapter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TemporalAdapter'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### EnhancedTemporalAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/adapters/enhanced-temporal-adapter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'EnhancedTemporalAdapter'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### TemporalAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/implementations/temporal-adapter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TemporalAdapter'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### TemporalConnector (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bridges/temporal-connector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TemporalConnector'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### OrchestratorBridge (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'OrchestratorBridge'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### BullMQConnector (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bridges/bullmq-connector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BullMQConnector-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BullMQConnector-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof BullMQConnector' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### N8nConnector (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bridges/n8n-connector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-N8nConnector-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-N8nConnector-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof N8nConnector' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### TemporalConnector (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bridges/TemporalConnector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalConnector-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof TemporalConnector' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### PrometheusExporter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/monitoring/prometheus-exporter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrometheusExporter'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### AlertNotifier (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/monitoring/alert-notifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'AlertNotifier'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### BullMqOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bullmq/bullmq-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'BullMqOrchestrator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
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
../../tmp/test-AbstractOrchestratorAgent-2025-04-18-02-17-19.ts(1,43): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractOrchestratorAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### PriorityScheduler (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/scheduler/priority-scheduler.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PriorityScheduler'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SystemMonitor (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/scheduler/system-monitor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SystemMonitor'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### MigrationReportGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/reporting/migration-report-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(1,42): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MigrationReportGenerator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
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
../../tmp/test-BaseOrchestratorAgent-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseOrchestratorAgent-2025-04-18-02-17-19.ts(7,27): error TS2351: This expression is not constructable.
  Type 'typeof BaseOrchestratorAgent' has no construct signatures.

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
  diagnosticCodes: [ 5097, 2351 ]
}
```

### WorkflowPriorityQueue (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/resilience/migration-coordinator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'WorkflowPriorityQueue'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### CheckpointManager (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/persistence/checkpoint-manager.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CheckpointManager'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### DatabaseService (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/persistence/database-service.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DatabaseService'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### PrismaToDto (/workspaces/cahier-des-charge/packages/mcp-agents/prisma-to-dto.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrismaToDto'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
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
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(23,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'Agent8SqlOptimizer'.

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
    5097, 2339, 2339,
    2554, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### SupabaseOptimizationTracker (/workspaces/cahier-des-charge/agents/optimization/SupabaseOptimizationTracker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(1,45): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SupabaseOptimizationTracker'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
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
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PreviewAgent'.
../../tmp/test-PreviewAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PreviewAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
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
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'AutoPRAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### CaddyGenerator (/workspaces/cahier-des-charge/agents/utils/caddy-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(47,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'ServerConfig[]'.
  Type '{}' is missing the following properties from type 'ServerConfig[]': length, pop, push, concat, and 29 more.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CaddyGenerator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2345, 2339, 2339
  ]
}
```

### NginxConfigParser (/workspaces/cahier-des-charge/agents/utils/nginx-config-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'NginxConfigParser'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### HtaccessParser (/workspaces/cahier-des-charge/agents/utils/htaccess-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### SEOAuditRunner (/workspaces/cahier-des-charge/agents/seo-audit-runner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOAuditRunner'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### SEOMCPController (/workspaces/cahier-des-charge/agents/seo-mcp-controller.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOMCPController'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### MigrationOrchestrator (/workspaces/cahier-des-charge/agents/migration-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MigrationOrchestrator'.

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
    5097, 2339, 2339,
    2339, 2339, 2554,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
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
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseAgent-2025-04-18-02-17-19.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

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
  diagnosticCodes: [ 5097, 2511 ]
}
```

### AgentOrchestrator (/workspaces/cahier-des-charge/agents/core/agent-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'AgentOrchestrator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
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
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(23,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CoordinatorAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### MetricsService (/workspaces/cahier-des-charge/agents/integration/metrics-service.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MetricsService'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### NotificationService (/workspaces/cahier-des-charge/agents/integration/notification-service.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'NotificationService'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### OrchestratorBridge (/workspaces/cahier-des-charge/agents/integration/orchestrator-bridge.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'OrchestratorBridge'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### QAAnalyzer (/workspaces/cahier-des-charge/agents/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### BullMqOrchestrator (/workspaces/cahier-des-charge/agents/bullmq-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'BullMqOrchestrator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### MetaGenerator (/workspaces/cahier-des-charge/agents/meta-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MetaGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### PipelineStrategyAuditor (/workspaces/cahier-des-charge/agents/pipeline-strategy-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PipelineStrategyAuditor'.
../../tmp/test-PipelineStrategyAuditor-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PipelineStrategyAuditor'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### CLI (/workspaces/cahier-des-charge/agents/migration/sql-analysis-runner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CLI-2025-04-18-02-17-19.ts(1,10): error TS2459: Module '"/workspaces/cahier-des-charge/agents/migration/sql-analysis-runner.ts"' declares 'CLI' locally, but it is not exported.
../../tmp/test-CLI-2025-04-18-02-17-19.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.

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
  diagnosticCodes: [ 2459, 5097 ]
}
```

### CaddyfileGenerator (/workspaces/cahier-des-charge/agents/migration/nginx-to-caddy/caddyfile-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(11,25): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.

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
    5097, 2554, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### RemixRouteGenerator (/workspaces/cahier-des-charge/agents/migration/php-to-remix/remix-route-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RemixRouteGenerator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### DevGenerator (/workspaces/cahier-des-charge/agents/migration/php-to-remix/dev-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DevGenerator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### HtaccessRouteAnalyzer (/workspaces/cahier-des-charge/agents/migration/php-to-remix/htaccess-route-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessRouteAnalyzer'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### PhpRouterAudit (/workspaces/cahier-des-charge/agents/migration/php-to-remix/php-router-audit.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PhpRouterAudit'.

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
    5097, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339
  ]
}
```

### SeoMetadataGenerator (/workspaces/cahier-des-charge/agents/migration/php-to-remix/seo-meta.generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SeoMetadataGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### HtaccessParser (/workspaces/cahier-des-charge/agents/migration/php-to-remix/htaccess-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
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
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CanonicalSyncAgent'.

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
    5097, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339
  ]
}
```

### SeoChecker (/workspaces/cahier-des-charge/agents/migration/php-to-remix/seo-checker-canonical.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SeoChecker'.
../../tmp/test-SeoChecker-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SeoChecker'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### MigrationPlanGenerator (/workspaces/cahier-des-charge/agents/migration/generate-migration-plan.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MigrationPlanGenerator'.
../../tmp/test-MigrationPlanGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MigrationPlanGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### SQLPrismaMigrationPlanner (/workspaces/cahier-des-charge/agents/migration/sql-prisma-migration-planner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(1,43): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 4 arguments, but got 0.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SQLPrismaMigrationPlanner'.
../../tmp/test-SQLPrismaMigrationPlanner-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SQLPrismaMigrationPlanner'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### SchemaAnalyzer (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/schema-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SchemaAnalyzer'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### TableClassifier (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/classifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TableClassifier'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### RelationAnalyzer (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/relation-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2554: Expected 2 arguments, but got 1.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RelationAnalyzer'.

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
    5097, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2554, 2339, 2339,
    2339, 2339
  ]
}
```

### TableClassifier (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/table-classifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TableClassifier'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### DebtAnalyzer (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/debt-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2345: Argument of type '{}' is not assignable to parameter of type 'MySQLSchema'.
  Type '{}' is missing the following properties from type 'MySQLSchema': name, tables
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DebtAnalyzer'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2345,
    2339, 2339, 2339, 2339
  ]
}
```

### TypeConverter (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/type-converter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TypeConverter'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### PrismaGenerator (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/prisma-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(47,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'MySQLSchema'.
  Type '{}' is missing the following properties from type 'MySQLSchema': name, tables
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrismaGenerator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2345, 2339, 2339
  ]
}
```

### SQLParser (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/core/parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SQLParser'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### TypeConverter (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/agents/type-converter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TypeConverter'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### PrismaGenerator (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/agents/prisma-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(47,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'MySQLSchema'.
  Type '{}' is missing the following properties from type 'MySQLSchema': name, tables
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrismaGenerator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2345, 2339, 2339
  ]
}
```

### TypeAuditor (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/agents/type-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(41,55): error TS2345: Argument of type '{}' is not assignable to parameter of type 'MySQLSchema'.
  Type '{}' is missing the following properties from type 'MySQLSchema': name, tables
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TypeAuditor'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2345,
    2339, 2339, 2339, 2339
  ]
}
```

### DebtDetector (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/agents/debt-detector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(41,55): error TS2345: Argument of type '{}' is not assignable to parameter of type 'MySQLSchema'.
  Type '{}' is missing the following properties from type 'MySQLSchema': name, tables
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DebtDetector'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2345,
    2339, 2339, 2339, 2339
  ]
}
```

### RelationalNormalizer (/workspaces/cahier-des-charge/agents/migration/mysql-analyzer/agents/relational-normalizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(41,47): error TS2554: Expected 2 arguments, but got 1.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RelationalNormalizer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
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
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(35,55): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'BusinessAgent'.

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
    5097, 2554, 2339,
    2339, 2339, 2339,
    2339, 2339, 2345,
    2554, 2339, 2339,
    2339, 2339
  ]
}
```

### ValidationIssue (/workspaces/cahier-des-charge/agents/migration/postgresql-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ValidationIssue-2025-04-18-02-17-19.ts(1,10): error TS2459: Module '"/workspaces/cahier-des-charge/agents/migration/postgresql-validator.ts"' declares 'ValidationIssue' locally, but it is not exported.
../../tmp/test-ValidationIssue-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.

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
  diagnosticCodes: [ 2459, 5097 ]
}
```

### ComponentGenerator (/workspaces/cahier-des-charge/agents/migration/component-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'ComponentGenerator'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
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
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(1,43): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'ProgressiveMigrationAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
  ]
}
```

### CaddyfileGenerator (/workspaces/cahier-des-charge/agents/migration/caddyfile-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(11,25): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CaddyfileGenerator'.

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
    5097, 2554, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
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
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QualityAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### SecurityRiskAnalyzer (/workspaces/cahier-des-charge/agents/quality/analyze-security-risks.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SecurityRiskAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
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
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(35,55): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QualityAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2345, 2554,
    2339, 2339, 2339, 2339
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
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOCheckerAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### MCPNotifier (/workspaces/cahier-des-charge/agents/notifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(10,26): error TS2341: Property 'initialize' is private and only accessible within class 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(11,25): error TS2341: Property 'initialize' is private and only accessible within class 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MCPNotifier'.

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
    5097, 2554, 2341, 2341,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
  ]
}
```

### PRCreator (/workspaces/cahier-des-charge/agents/pr-creator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PRCreator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
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
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'StatusWriterAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### MCPManifestManager (/workspaces/cahier-des-charge/agents/mcp-manifest-manager.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MCPManifestManager'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339
  ]
}
```

### SEORedirectMapper (/workspaces/cahier-des-charge/agents/seo-redirect-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEORedirectMapper'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### MCPVerifier (/workspaces/cahier-des-charge/agents/mcp-verifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MCPVerifier'.
../../tmp/test-MCPVerifier-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MCPVerifier'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339
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
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DependencyAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
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
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DataAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
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
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'DataAnalyzer'.
../../tmp/test-DataAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'DataAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
  ]
}
```

### TypeMapper (/workspaces/cahier-des-charge/agents/analysis/type-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TypeMapper'.
../../tmp/test-TypeMapper-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TypeMapper'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
  ]
}
```

### HtaccessRouterAnalyzer (/workspaces/cahier-des-charge/agents/analysis/htaccess-router-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessRouterAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
  ]
}
```

### RelationAnalyzer (/workspaces/cahier-des-charge/agents/analysis/relation-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'RelationAnalyzer'.
../../tmp/test-RelationAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'RelationAnalyzer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
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
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2554,
    2339, 2339, 2339, 2339
  ]
}
```

### NginxConfigParser (/workspaces/cahier-des-charge/agents/analysis/config-parsers/nginx-config-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'NginxConfigParser'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

### HtaccessParser (/workspaces/cahier-des-charge/agents/analysis/config-parsers/htaccess-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.

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
    5097, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### TableCartographer (/workspaces/cahier-des-charge/agents/analysis/table-cartographer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'TableCartographer'.
../../tmp/test-TableCartographer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'TableCartographer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
  ]
}
```

### PrismaModelGenerator (/workspaces/cahier-des-charge/agents/analysis/generate_prisma_model.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 3-4 arguments, but got 0.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(47,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrismaModelGenerator'.
../../tmp/test-PrismaModelGenerator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrismaModelGenerator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339
  ]
}
```

### SemanticMapper (/workspaces/cahier-des-charge/agents/analysis/semantic-table-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 3 arguments, but got 0.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SemanticMapper'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339
  ]
}
```

### php-analyzer-v2 (/workspaces/cahier-des-charge/agents/analysis/php-analyzer-v2.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-php-analyzer-v2.ts(44,16): error TS18046: 'error' is of type 'unknown'.

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
  diagnosticCodes: [ 18046 ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/agents/analysis/agent-structure.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'StructureAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339
  ]
}
```

### SEOContentEnhancer (/workspaces/cahier-des-charge/agents/seo-content-enhancer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'SEOContentEnhancer'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
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
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 1-2 arguments, but got 0.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'MonitoringAgent'.
../../tmp/test-MonitoringAgent-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'MonitoringAgent'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2339, 2339,
    2554, 2339, 2339, 2339,
    2339, 2339, 2339, 2339,
    2339
  ]
}
```

### QaAnalyzer (/workspaces/cahier-des-charge/agents/qa-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(29,47): error TS2345: Argument of type '{}' is not assignable to parameter of type '{ target: string; options?: { recursive?: boolean | undefined; modelName?: string | undefined; generateTests?: boolean | undefined; } | undefined; }'.
  Property 'target' is missing in type '{}' but required in type '{ target: string; options?: { recursive?: boolean | undefined; modelName?: string | undefined; generateTests?: boolean | undefined; } | undefined; }'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QaAnalyzer'.

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
    5097, 2339, 2339,
    2339, 2339, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339
  ]
}
```

### CanonicalValidator (/workspaces/cahier-des-charge/agents/canonical-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(7,23): error TS2554: Expected 2 arguments, but got 0.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(16,26): error TS2339: Property 'validate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(17,50): error TS2339: Property 'validate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(22,26): error TS2339: Property 'execute' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(23,49): error TS2339: Property 'execute' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(29,47): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(34,26): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(35,47): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-18-02-17-19.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'CanonicalValidator'.

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
    5097, 2554, 2339, 2339,
    2339, 2339, 2554, 2339,
    2339, 2339, 2339, 2339,
    2339, 2339, 2339
  ]
}
```

- Total des tests: 3
- Tests réussis: 0
- Tests échoués: 3
- Tests ignorés: 0

