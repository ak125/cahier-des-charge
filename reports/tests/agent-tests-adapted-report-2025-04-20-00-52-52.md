# Rapport des tests adaptés d'agents MCP - Sun Apr 20 00:52:52 UTC 2025

## Résumé

### base-analyzer-agent.ts.bak-20250419-142920 (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base-analyzer-agent.ts.bak-20250419-142920)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-base-analyzer.ts(1,29): error TS2614: Module '"../../packages/mcp-agents/analyzers/base-analyzer-agent"' has no exported member 'AnalysisResult'. Did you mean to use 'import AnalysisResult from "../../packages/mcp-agents/analyzers/base-analyzer-agent"' instead?
tests/agents/test-base-analyzer.ts(1,45): error TS2614: Module '"../../packages/mcp-agents/analyzers/base-analyzer-agent"' has no exported member 'AnalyzerAgentConfig'. Did you mean to use 'import AnalyzerAgentConfig from "../../packages/mcp-agents/analyzers/base-analyzer-agent"' instead?
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
  diagnosticCodes: [
    2614, 2614, 2315,
    2339, 2339, 2353,
    2353, 2351
  ]
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
  diagnosticCodes: [ 2339, 2339, 2339, 1064, 2339 ]
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
tests/agents/test-php-analyzer-v2.ts(50,42): error TS2339: Property 'id' does not exist on type 'typeof php'.
tests/agents/test-php-analyzer-v2.ts(52,51): error TS2339: Property 'description' does not exist on type 'typeof php'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 18046, 2339, 2339 ]
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
  diagnosticCodes: [ 2339, 2339, 2339, 1064, 2339 ]
}
```

### HtaccessRouterAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/htaccess-router/htaccess-router-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessRouterAnalyzer'.
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'HtaccessRouterAnalyzer'. Did you mean 'validate'?
../../tmp/test-HtaccessRouterAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'HtaccessRouterAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### abstract-analyzer-agent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer/abstract-analyzer-agent.ts)

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
  diagnosticCodes: [ 2339, 2339, 2339, 1064, 2339 ]
}
```

### SharedBaseAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base/base-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SharedBaseAgent'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SharedBaseAgent'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SharedBaseAgent'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SharedBaseAgent'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SharedBaseAgent'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SharedBaseAgent'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SharedBaseAgent'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SharedBaseAgent'.
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SharedBaseAgent'. Did you mean 'validate'?
../../tmp/test-SharedBaseAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SharedBaseAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### monitoring (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/monitoring-check/monitoring-check.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'monitoring'.
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'monitoring'. Did you mean 'validate'?
../../tmp/test-monitoring-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'monitoring'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BusinessAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-business/agent-business.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BusinessAgent'. Did you mean 'validate'?
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BusinessAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### StatusWriterAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/status-writer/status-writer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StatusWriterAgent'.
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'StatusWriterAgent'. Did you mean 'validate'?
../../tmp/test-StatusWriterAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'StatusWriterAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-structure/agent-structure.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'StructureAgent'. Did you mean 'validate'?
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'StructureAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### table (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/table-cartographer/table-cartographer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-table-2025-04-20-00-52-52.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-table-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-table-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-table-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'table'.
../../tmp/test-table-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'table'.
../../tmp/test-table-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'table'.
../../tmp/test-table-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'table'.
../../tmp/test-table-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'table'.
../../tmp/test-table-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'table'.
../../tmp/test-table-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'table'.
../../tmp/test-table-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'table'.
../../tmp/test-table-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'table'. Did you mean 'validate'?
../../tmp/test-table-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'table'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### NginxConfigParser (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/nginx-config-parser/nginx-config-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NginxConfigParser'.
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'NginxConfigParser'. Did you mean 'validate'?
../../tmp/test-NginxConfigParser-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'NginxConfigParser'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### helpers (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/helpers/helpers.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-helpers-2025-04-20-00-52-52.ts(1,25): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'helpers'.
../../tmp/test-helpers-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'helpers'. Did you mean 'validate'?
../../tmp/test-helpers-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'helpers'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### devops (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/devops-preview/devops-preview.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-devops-2025-04-20-00-52-52.ts(1,24): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-devops-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'devops'.
../../tmp/test-devops-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'devops'. Did you mean 'validate'?
../../tmp/test-devops-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'devops'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BusinessAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/businessagent/businessagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BusinessAgent'. Did you mean 'validate'?
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BusinessAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DataAnalyzerAgent'.
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DataAnalyzerAgent'. Did you mean 'validate'?
../../tmp/test-DataAnalyzerAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DataAnalyzerAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PhpRouterAudit (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-router-audit/php-router-audit.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PhpRouterAudit'.
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PhpRouterAudit'. Did you mean 'validate'?
../../tmp/test-PhpRouterAudit-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PhpRouterAudit'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AgentCommunication (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-communication/agent-communication.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AgentCommunication'.
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AgentCommunication'. Did you mean 'validate'?
../../tmp/test-AgentCommunication-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AgentCommunication'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### pipeline (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/pipeline-strategy-auditor/pipeline-strategy-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(1,26): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'pipeline'.
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'pipeline'. Did you mean 'validate'?
../../tmp/test-pipeline-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'pipeline'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AgentAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/adapt-agents/adapt-agents.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(16,26): error TS2339: Property 'validate' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(17,50): error TS2339: Property 'validate' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(22,26): error TS2339: Property 'execute' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(23,49): error TS2339: Property 'execute' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'AgentAdapter'.
../../tmp/test-AgentAdapter-2025-04-20-00-52-52.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'AgentAdapter'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
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

### nginx (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/nginx-config/nginx-config-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-nginx-2025-04-20-00-52-52.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'nginx'.
../../tmp/test-nginx-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'nginx'. Did you mean 'validate'?
../../tmp/test-nginx-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'nginx'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SQLParser (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/parser/parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SQLParser'.
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SQLParser'. Did you mean 'validate'?
../../tmp/test-SQLParser-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SQLParser'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### DebtAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/debt/debt-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DebtAnalyzer'.
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DebtAnalyzer'. Did you mean 'validate'?
../../tmp/test-DebtAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DebtAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TypeAuditor (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/type-auditor/type-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeAuditor'.
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TypeAuditor'. Did you mean 'validate'?
../../tmp/test-TypeAuditor-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TypeAuditor'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PrismaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/prisma/prisma-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrismaAnalyzer'.
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PrismaAnalyzer'. Did you mean 'validate'?
../../tmp/test-PrismaAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PrismaAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PRCreator (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/pr-creator/pr-creator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PRCreator'.
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PRCreator'. Did you mean 'validate'?
../../tmp/test-PRCreator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PRCreator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SchemaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/schema/schema-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SchemaAnalyzer'.
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SchemaAnalyzer'. Did you mean 'validate'?
../../tmp/test-SchemaAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SchemaAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### MySQLAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mysql/mysql-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MySQLAnalyzer'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MySQLAnalyzer'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MySQLAnalyzer'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MySQLAnalyzer'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MySQLAnalyzer'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MySQLAnalyzer'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MySQLAnalyzer'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MySQLAnalyzer'.
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MySQLAnalyzer'. Did you mean 'validate'?
../../tmp/test-MySQLAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MySQLAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### MonorepoAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/monorepo/monorepo-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MonorepoAnalyzer'.
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MonorepoAnalyzer'. Did you mean 'validate'?
../../tmp/test-MonorepoAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MonorepoAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### QaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qa/qa-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QaAnalyzer'. Did you mean 'validate'?
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QaAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SEOMCPController (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-mcp-controller/seo-mcp-controller.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOMCPController'.
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SEOMCPController'. Did you mean 'validate'?
../../tmp/test-SEOMCPController-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SEOMCPController'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### DependencyAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dependencyagent/dependencyagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DependencyAgent'. Did you mean 'validate'?
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DependencyAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### dev (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dev-integrator/dev-integrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-dev-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-dev-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'dev'. Did you mean 'validate'?
../../tmp/test-dev-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'dev'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### CoordinatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/coordinator/coordinator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CoordinatorAgent'. Did you mean 'validate'?
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CoordinatorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### HtaccessRouteAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/htaccess-route/htaccess-route-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessRouteAnalyzer'.
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'HtaccessRouteAnalyzer'. Did you mean 'validate'?
../../tmp/test-HtaccessRouteAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'HtaccessRouteAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PrismaToZodGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/prisma-to-zod/prisma-to-zod.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(16,26): error TS2339: Property 'validate' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(17,50): error TS2339: Property 'validate' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(22,26): error TS2339: Property 'execute' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(23,49): error TS2339: Property 'execute' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(47,57): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'PrismaToZodGenerator'.
../../tmp/test-PrismaToZodGenerator-2025-04-20-00-52-52.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'PrismaToZodGenerator'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
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

### DependencyAnalyzerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dependency-analyzer/dependency-analyzer-v2.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DependencyAnalyzerAgent'.
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DependencyAnalyzerAgent'. Did you mean 'validate'?
../../tmp/test-DependencyAnalyzerAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DependencyAnalyzerAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AbstractProcessorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-processor/abstract-processor-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractProcessorAgent'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractProcessorAgent'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractProcessorAgent'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractProcessorAgent'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractProcessorAgent'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractProcessorAgent'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractProcessorAgent'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractProcessorAgent'.
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractProcessorAgent'. Did you mean 'validate'?
../../tmp/test-AbstractProcessorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractProcessorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### sql (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/sql-prisma-migration-planner/sql-prisma-migration-planner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-sql-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-sql-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'sql'. Did you mean 'validate'?
../../tmp/test-sql-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'sql'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### FileManager (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/file-manager/file-manager.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'FileManager'.
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'FileManager'. Did you mean 'validate'?
../../tmp/test-FileManager-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'FileManager'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### McpVerifierAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mcp-verifier/mcp-verifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'McpVerifierAgent'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'McpVerifierAgent'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'McpVerifierAgent'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'McpVerifierAgent'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'McpVerifierAgent'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'McpVerifierAgent'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'McpVerifierAgent'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'McpVerifierAgent'.
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'McpVerifierAgent'. Did you mean 'validate'?
../../tmp/test-McpVerifierAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'McpVerifierAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AbstractAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract/abstract-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractAnalyzer'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractAnalyzer'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractAnalyzer'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractAnalyzer'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractAnalyzer'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractAnalyzer'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractAnalyzer'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractAnalyzer'.
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractAnalyzer'. Did you mean 'validate'?
../../tmp/test-AbstractAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AbstractAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract/abstract-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractAgent'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractAgent'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractAgent'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractAgent'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractAgent'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractAgent'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractAgent'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractAgent'.
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractAgent'. Did you mean 'validate'?
../../tmp/test-AbstractAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### mysql (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mysql-to-pg/mysql-to-pg.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-mysql-2025-04-20-00-52-52.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'mysql'. Did you mean 'validate'?
../../tmp/test-mysql-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'mysql'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AgentRegistry (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-registry/agent-registry.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentRegistry-2025-04-20-00-52-52.ts(1,10): error TS2724: '"/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-registry/agent-registry.ts"' has no exported member named 'AgentRegistry'. Did you mean 'agentRegistry'?
../../tmp/test-AgentRegistry-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2724, 5097 ]
}
```

### LayeredAgentAuditor (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/layered-agent-auditor/layered-agent-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'LayeredAgentAuditor'.
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'LayeredAgentAuditor'. Did you mean 'validate'?
../../tmp/test-LayeredAgentAuditor-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'LayeredAgentAuditor'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### sql (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/sql-debt-audit/sql-debt-audit.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-sql-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-sql-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'sql'. Did you mean 'validate'?
../../tmp/test-sql-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'sql'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### Agent8SqlOptimizer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent8-optimizer/agent8-optimizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'Agent8SqlOptimizer'.
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'Agent8SqlOptimizer'. Did you mean 'validate'?
../../tmp/test-Agent8SqlOptimizer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'Agent8SqlOptimizer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### dev (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dev-linter/dev-linter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-dev-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-dev-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'dev'.
../../tmp/test-dev-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'dev'. Did you mean 'validate'?
../../tmp/test-dev-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'dev'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### type (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/type-mapper/type-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-type-2025-04-20-00-52-52.ts(1,22): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-type-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-type-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-type-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'type'. Did you mean 'validate'?
../../tmp/test-type-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'type'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BaseMcpAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/interfaces/interfaces.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseMcpAgent-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseMcpAgent-2025-04-20-00-52-52.ts(7,23): error TS2511: Cannot create an instance of an abstract class.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
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

### remediator (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/remediator/remediator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-remediator-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'remediator'.
../../tmp/test-remediator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'remediator'. Did you mean 'validate'?
../../tmp/test-remediator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'remediator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AutoPRAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/auto-pr/auto-pr-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AutoPRAgent'.
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AutoPRAgent'. Did you mean 'validate'?
../../tmp/test-AutoPRAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AutoPRAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### agent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-version-auditor/agent-version-auditor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-agent-2025-04-20-00-52-52.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-agent-2025-04-20-00-52-52.ts(7,15): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-20-00-52-52.ts(7,27): error TS2448: Block-scoped variable 'agent' used before its declaration.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
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

### ci (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/ci-tester/ci-tester.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ci-2025-04-20-00-52-52.ts(1,20): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ci-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ci'.
../../tmp/test-ci-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ci'. Did you mean 'validate'?
../../tmp/test-ci-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ci'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### discovery (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/discovery/discovery-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-discovery-2025-04-20-00-52-52.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'discovery'.
../../tmp/test-discovery-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'discovery'. Did you mean 'validate'?
../../tmp/test-discovery-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'discovery'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BaseAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/baseagent/baseagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BaseAgent'.
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BaseAgent'. Did you mean 'validate'?
../../tmp/test-BaseAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BaseAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### DataAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dataagent/dataagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DataAgent'. Did you mean 'validate'?
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DataAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### DebtDetector (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/debt-detector/debt-detector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DebtDetector'.
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DebtDetector'. Did you mean 'validate'?
../../tmp/test-DebtDetector-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DebtDetector'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### php (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-php-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-php-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-php-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'php'. Did you mean 'validate'?
../../tmp/test-php-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'php'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
tests/agents/test-php-analyzer-v2.ts(50,42): error TS2339: Property 'id' does not exist on type 'typeof php'.
tests/agents/test-php-analyzer-v2.ts(52,51): error TS2339: Property 'description' does not exist on type 'typeof php'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 18046, 2339, 2339 ]
}
```

### php (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-v3.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-php-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-php-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-php-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'php'. Did you mean 'validate'?
../../tmp/test-php-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'php'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
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
tests/agents/test-php-analyzer-v2.ts(50,42): error TS2339: Property 'id' does not exist on type 'typeof php'.
tests/agents/test-php-analyzer-v2.ts(52,51): error TS2339: Property 'description' does not exist on type 'typeof php'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 18046, 2339, 2339 ]
}
```

### php (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-v4.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-php-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-php-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-php-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'php'. Did you mean 'validate'?
../../tmp/test-php-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'php'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### mysql (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mysql-analyzer+optimizer/mysql-analyzer+optimizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-mysql-2025-04-20-00-52-52.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'mysql'.
../../tmp/test-mysql-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'mysql'. Did you mean 'validate'?
../../tmp/test-mysql-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'mysql'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PrismaToDto (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/prisma-to-dto/prisma-to-dto.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrismaToDto'.
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PrismaToDto'. Did you mean 'validate'?
../../tmp/test-PrismaToDto-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PrismaToDto'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### qa (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qa-confirmer/qa-confirmer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-qa-2025-04-20-00-52-52.ts(1,20): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-qa-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'qa'.
../../tmp/test-qa-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'qa'. Did you mean 'validate'?
../../tmp/test-qa-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'qa'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### sql (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/sql-analysis-runner/sql-analysis-runner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-sql-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-sql-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'sql'. Did you mean 'validate'?
../../tmp/test-sql-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'sql'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### data (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/data-verifier/data-verifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-data-2025-04-20-00-52-52.ts(1,22): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-data-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-data-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-data-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'data'.
../../tmp/test-data-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'data'.
../../tmp/test-data-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'data'.
../../tmp/test-data-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'data'.
../../tmp/test-data-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'data'.
../../tmp/test-data-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'data'.
../../tmp/test-data-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'data'.
../../tmp/test-data-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'data'.
../../tmp/test-data-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'data'. Did you mean 'validate'?
../../tmp/test-data-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'data'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SEOCITester (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-ci-tester/seo-ci-tester.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCITester'.
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SEOCITester'. Did you mean 'validate'?
../../tmp/test-SEOCITester-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SEOCITester'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAnalyzerAgent'.
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'StructureAnalyzerAgent'. Did you mean 'validate'?
../../tmp/test-StructureAnalyzerAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'StructureAnalyzerAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### DataAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/DataAgent/DataAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DataAgent'.
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DataAgent'. Did you mean 'validate'?
../../tmp/test-DataAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DataAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### DependencyAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/DependencyAgent/DependencyAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DependencyAgent'.
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DependencyAgent'. Did you mean 'validate'?
../../tmp/test-DependencyAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DependencyAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### ImageOptimizer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/image-optimizer/image-optimizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ImageOptimizer'.
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ImageOptimizer'. Did you mean 'validate'?
../../tmp/test-ImageOptimizer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ImageOptimizer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### sql (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/sql-analyzer+prisma-builder/sql-analyzer+prisma-builder.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-sql-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-sql-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'sql'.
../../tmp/test-sql-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'sql'. Did you mean 'validate'?
../../tmp/test-sql-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'sql'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### QualityAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-quality/agent-quality.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QualityAgent'. Did you mean 'validate'?
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QualityAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### McpMetricsCollector (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/metrics-collector/metrics-collector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'McpMetricsCollector'.
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'McpMetricsCollector'. Did you mean 'validate'?
../../tmp/test-McpMetricsCollector-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'McpMetricsCollector'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SEORedirectMapper (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-redirect-mapper/seo-redirect-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEORedirectMapper'.
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SEORedirectMapper'. Did you mean 'validate'?
../../tmp/test-SEORedirectMapper-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SEORedirectMapper'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### consolidator (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/consolidator/consolidator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'consolidator'.
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'consolidator'. Did you mean 'validate'?
../../tmp/test-consolidator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'consolidator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### diff (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/diff-verifier/diff-verifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-diff-2025-04-20-00-52-52.ts(1,22): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-diff-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'diff'.
../../tmp/test-diff-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'diff'. Did you mean 'validate'?
../../tmp/test-diff-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'diff'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### Logger (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/logger/logger.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-Logger-2025-04-20-00-52-52.ts(1,24): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'Logger'.
../../tmp/test-Logger-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'Logger'. Did you mean 'validate'?
../../tmp/test-Logger-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'Logger'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AgentValidator (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/validate-agents/validate-agents.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(16,26): error TS2339: Property 'validate' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(17,50): error TS2339: Property 'validate' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(22,26): error TS2339: Property 'execute' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(23,49): error TS2339: Property 'execute' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'AgentValidator'.
../../tmp/test-AgentValidator-2025-04-20-00-52-52.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'AgentValidator'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
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

### SemanticMapper (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/semantic-table-mapper/semantic-table-mapper.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SemanticMapper'.
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SemanticMapper'. Did you mean 'validate'?
../../tmp/test-SemanticMapper-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SemanticMapper'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzerV2'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzerV2'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QAAnalyzerV2'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QAAnalyzerV2'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzerV2'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzerV2'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzerV2'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzerV2'.
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzerV2'. Did you mean 'validate'?
../../tmp/test-QAAnalyzerV2-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzerV2'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### agent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-audit/agent-audit.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-agent-2025-04-20-00-52-52.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-agent-2025-04-20-00-52-52.ts(7,15): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-20-00-52-52.ts(7,27): error TS2448: Block-scoped variable 'agent' used before its declaration.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
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

### php (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer.worker/php-analyzer.worker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-php-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-php-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-php-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-php-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'php'.
../../tmp/test-php-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'php'. Did you mean 'validate'?
../../tmp/test-php-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'php'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### QualityAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qualityagent/qualityagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QualityAgent'. Did you mean 'validate'?
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QualityAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### mcp (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mcp-verifier.worker/mcp-verifier.worker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-mcp-2025-04-20-00-52-52.ts(1,21): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'mcp'.
../../tmp/test-mcp-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'mcp'. Did you mean 'validate'?
../../tmp/test-mcp-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'mcp'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### RelationalNormalizer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/relational-normalizer/relational-normalizer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RelationalNormalizer'.
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'RelationalNormalizer'. Did you mean 'validate'?
../../tmp/test-RelationalNormalizer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'RelationalNormalizer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### ProgressiveMigrationAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/progressive-migration/progressive-migration-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(1,43): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ProgressiveMigrationAgent'.
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ProgressiveMigrationAgent'. Did you mean 'validate'?
../../tmp/test-ProgressiveMigrationAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ProgressiveMigrationAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TypeConverter (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/type-converter/type-converter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeConverter'.
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TypeConverter'. Did you mean 'validate'?
../../tmp/test-TypeConverter-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TypeConverter'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### migration (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/migration-strategist/migration-strategist.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-migration-2025-04-20-00-52-52.ts(1,27): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-migration-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'migration'.
../../tmp/test-migration-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'migration'. Did you mean 'validate'?
../../tmp/test-migration-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'migration'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SystemIntegrationBridge (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/system-integration-bridge/system-integration-bridge.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SystemIntegrationBridge'.
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SystemIntegrationBridge'. Did you mean 'validate'?
../../tmp/test-SystemIntegrationBridge-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SystemIntegrationBridge'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### Database (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/db-connector/db-connector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-Database-2025-04-20-00-52-52.ts(1,26): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-Database-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'Database'.
../../tmp/test-Database-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'Database'. Did you mean 'validate'?
../../tmp/test-Database-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'Database'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SEOAuditRunner (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-audit-runner/seo-audit-runner.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOAuditRunner'.
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SEOAuditRunner'. Did you mean 'validate'?
../../tmp/test-SEOAuditRunner-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SEOAuditRunner'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### type (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/type-audit/type-audit-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-type-2025-04-20-00-52-52.ts(1,22): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-type-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-type-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-type-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'type'.
../../tmp/test-type-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'type'. Did you mean 'validate'?
../../tmp/test-type-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'type'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/structureagent/structureagent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'StructureAgent'. Did you mean 'validate'?
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'StructureAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SecurityRiskAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/analyze-security-risks/analyze-security-risks.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SecurityRiskAnalyzer'.
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SecurityRiskAnalyzer'. Did you mean 'validate'?
../../tmp/test-SecurityRiskAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SecurityRiskAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
tests/agents/test-base-analyzer.ts(1,29): error TS2614: Module '"../../packages/mcp-agents/analyzers/base-analyzer-agent"' has no exported member 'AnalysisResult'. Did you mean to use 'import AnalysisResult from "../../packages/mcp-agents/analyzers/base-analyzer-agent"' instead?
tests/agents/test-base-analyzer.ts(1,45): error TS2614: Module '"../../packages/mcp-agents/analyzers/base-analyzer-agent"' has no exported member 'AnalyzerAgentConfig'. Did you mean to use 'import AnalyzerAgentConfig from "../../packages/mcp-agents/analyzers/base-analyzer-agent"' instead?
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
  diagnosticCodes: [
    2614, 2614, 2315,
    2339, 2339, 2353,
    2353, 2351
  ]
}
```

### base-analyzer-agent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base-analyzer/base-analyzer-agent.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-base-analyzer.ts(1,29): error TS2614: Module '"../../packages/mcp-agents/analyzers/base-analyzer-agent"' has no exported member 'AnalysisResult'. Did you mean to use 'import AnalysisResult from "../../packages/mcp-agents/analyzers/base-analyzer-agent"' instead?
tests/agents/test-base-analyzer.ts(1,45): error TS2614: Module '"../../packages/mcp-agents/analyzers/base-analyzer-agent"' has no exported member 'AnalyzerAgentConfig'. Did you mean to use 'import AnalyzerAgentConfig from "../../packages/mcp-agents/analyzers/base-analyzer-agent"' instead?
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
  diagnosticCodes: [
    2614, 2614, 2315,
    2339, 2339, 2353,
    2353, 2351
  ]
}
```

### relation (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/relation/relation-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-relation-2025-04-20-00-52-52.ts(1,26): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-relation-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'relation'.
../../tmp/test-relation-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'relation'. Did you mean 'validate'?
../../tmp/test-relation-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'relation'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### MCPManifestManager (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mcp-manifest-manager/mcp-manifest-manager.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MCPManifestManager'.
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MCPManifestManager'. Did you mean 'validate'?
../../tmp/test-MCPManifestManager-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MCPManifestManager'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### HtaccessParser (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/htaccess-parser/htaccess-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'HtaccessParser'. Did you mean 'validate'?
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'HtaccessParser'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### QAAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agents/agents.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### agent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-donnees/agent-donnees.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-agent-2025-04-20-00-52-52.ts(1,23): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-agent-2025-04-20-00-52-52.ts(7,15): error TS7022: 'agent' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
../../tmp/test-agent-2025-04-20-00-52-52.ts(7,27): error TS2448: Block-scoped variable 'agent' used before its declaration.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
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

### StructureAgent (/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/StructureAgent/StructureAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'StructureAgent'.
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'StructureAgent'. Did you mean 'validate'?
../../tmp/test-StructureAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'StructureAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AbstractValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract-validator/abstract-validator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractValidatorAgent'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractValidatorAgent'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractValidatorAgent'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractValidatorAgent'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractValidatorAgent'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractValidatorAgent'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractValidatorAgent'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractValidatorAgent'.
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractValidatorAgent'. Did you mean 'validate'?
../../tmp/test-AbstractValidatorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractValidatorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SeoCheckerCanonical (/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker-canonical/seo-checker-canonical.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SeoCheckerCanonical'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SeoCheckerCanonical'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SeoCheckerCanonical'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SeoCheckerCanonical'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SeoCheckerCanonical'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SeoCheckerCanonical'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SeoCheckerCanonical'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SeoCheckerCanonical'.
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SeoCheckerCanonical'. Did you mean 'validate'?
../../tmp/test-SeoCheckerCanonical-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SeoCheckerCanonical'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PostgresqlValidator (/workspaces/cahier-des-charge/packages/mcp-agents/validators/postgresql/postgresql-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PostgresqlValidator'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PostgresqlValidator'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PostgresqlValidator'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PostgresqlValidator'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PostgresqlValidator'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PostgresqlValidator'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PostgresqlValidator'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PostgresqlValidator'.
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PostgresqlValidator'. Did you mean 'validate'?
../../tmp/test-PostgresqlValidator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PostgresqlValidator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TypeScriptStructureValidator (/workspaces/cahier-des-charge/packages/mcp-agents/validators/typescript-structure/typescript-structure-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(1,46): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TypeScriptStructureValidator'.
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TypeScriptStructureValidator'. Did you mean 'validate'?
../../tmp/test-TypeScriptStructureValidator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TypeScriptStructureValidator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### ValidatorsIndex (/workspaces/cahier-des-charge/packages/mcp-agents/validators/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ValidatorsIndex'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ValidatorsIndex'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ValidatorsIndex'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ValidatorsIndex'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ValidatorsIndex'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ValidatorsIndex'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ValidatorsIndex'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ValidatorsIndex'.
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ValidatorsIndex'. Did you mean 'validate'?
../../tmp/test-ValidatorsIndex-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ValidatorsIndex'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AbstractValidator (/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract/abstract-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractValidator'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractValidator'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractValidator'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractValidator'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractValidator'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractValidator'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractValidator'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractValidator'.
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractValidator'. Did you mean 'validate'?
../../tmp/test-AbstractValidator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractValidator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### CanonicalValidator (/workspaces/cahier-des-charge/packages/mcp-agents/validators/canonical/canonical-validator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CanonicalValidator'. Did you mean 'validate'?
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CanonicalValidator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SEOChecker (/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker/seo-checker.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOChecker'.
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SEOChecker'. Did you mean 'validate'?
../../tmp/test-SEOChecker-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SEOChecker'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SEOCheckerAgent'. Did you mean 'validate'?
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SEOCheckerAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BaseValidatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/validators/base-validator/base-validator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BaseValidatorAgent'.
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BaseValidatorAgent'. Did you mean 'validate'?
../../tmp/test-BaseValidatorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BaseValidatorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MigrationOrchestrator'. Did you mean 'validate'?
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MigrationOrchestrator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
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
  diagnosticCodes: [ 2339, 2339, 2339, 1064, 2339 ]
}
```

### CoreIndexAgent (/workspaces/cahier-des-charge/packages/mcp-agents/core/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CoreIndexAgent'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CoreIndexAgent'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CoreIndexAgent'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CoreIndexAgent'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CoreIndexAgent'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CoreIndexAgent'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CoreIndexAgent'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CoreIndexAgent'.
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CoreIndexAgent'. Did you mean 'validate'?
../../tmp/test-CoreIndexAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CoreIndexAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### CoreInterfacesIndex (/workspaces/cahier-des-charge/packages/mcp-agents/core/interfaces/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CoreInterfacesIndex'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CoreInterfacesIndex'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CoreInterfacesIndex'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CoreInterfacesIndex'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CoreInterfacesIndex'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CoreInterfacesIndex'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CoreInterfacesIndex'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CoreInterfacesIndex'.
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CoreInterfacesIndex'. Did you mean 'validate'?
../../tmp/test-CoreInterfacesIndex-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CoreInterfacesIndex'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### implementation (/workspaces/cahier-des-charge/packages/mcp-agents/shared/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-implementation-2025-04-20-00-52-52.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/packages/mcp-agents/shared/index.ts"' has no exported member 'implementation'. Did you mean to use 'import implementation from "/workspaces/cahier-des-charge/packages/mcp-agents/shared/index.ts"' instead?
../../tmp/test-implementation-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2614, 5097 ]
}
```

### SqlAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/sql-analyzer/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Type '{}' is missing the following properties from type 'AgentContext': jobId, timestamp
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Type '{}' is missing the following properties from type 'AgentContext': jobId, timestamp
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SqlAnalyzer'.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SqlAnalyzer'.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SqlAnalyzer'.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SqlAnalyzer'.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SqlAnalyzer'.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SqlAnalyzer'.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SqlAnalyzer'.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SqlAnalyzer'.
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SqlAnalyzer'. Did you mean 'validate'?
../../tmp/test-SqlAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SqlAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### QaAnalyzer (/workspaces/cahier-des-charge/packages/mcp-agents/business/analyzers/qa-analyzer/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QaAnalyzer'.
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QaAnalyzer'. Did you mean 'validate'?
../../tmp/test-QaAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QaAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
tests/agents/test-php-analyzer-v2.ts(50,42): error TS2339: Property 'id' does not exist on type 'typeof php'.
tests/agents/test-php-analyzer-v2.ts(52,51): error TS2339: Property 'description' does not exist on type 'typeof php'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 18046, 2339, 2339 ]
}
```

### CanonicalValidator (/workspaces/cahier-des-charge/packages/mcp-agents/business/validators/canonical-validator/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalValidator'.
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CanonicalValidator'. Did you mean 'validate'?
../../tmp/test-CanonicalValidator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CanonicalValidator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SEOCheckerAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/validators/seo-checker/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOCheckerAgent'.
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SEOCheckerAgent'. Did you mean 'validate'?
../../tmp/test-SEOCheckerAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SEOCheckerAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TableClassifier (/workspaces/cahier-des-charge/packages/mcp-agents/business/core/table-classifier/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TableClassifier'. Did you mean 'validate'?
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TableClassifier'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### implementation (/workspaces/cahier-des-charge/packages/mcp-agents/business/core/BaseAgent/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-implementation-2025-04-20-00-52-52.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/packages/mcp-agents/business/core/BaseAgent/index.ts"' has no exported member 'implementation'. Did you mean to use 'import implementation from "/workspaces/cahier-des-charge/packages/mcp-agents/business/core/BaseAgent/index.ts"' instead?
../../tmp/test-implementation-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2614, 5097 ]
}
```

### TableClassifier (/workspaces/cahier-des-charge/packages/mcp-agents/business/core/classifier/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TableClassifier'. Did you mean 'validate'?
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TableClassifier'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### MetricsService (/workspaces/cahier-des-charge/packages/mcp-agents/business/integrators/metrics-service/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MetricsService'. Did you mean 'validate'?
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MetricsService'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### NotificationService (/workspaces/cahier-des-charge/packages/mcp-agents/business/integrators/notification-service/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'NotificationService'. Did you mean 'validate'?
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'NotificationService'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### MCPNotifier (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/notifier/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MCPNotifier'. Did you mean 'validate'?
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MCPNotifier'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BusinessAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/BusinessAgent/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BusinessAgent'. Did you mean 'validate'?
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BusinessAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### CanonicalSyncAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/canonical-sync-agent/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CanonicalSyncAgent'. Did you mean 'validate'?
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CanonicalSyncAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SupabaseOptimizationTracker (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/SupabaseOptimizationTracker/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(1,45): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SupabaseOptimizationTracker'. Did you mean 'validate'?
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SupabaseOptimizationTracker'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### QualityAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/misc/QualityAgent/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QualityAgent'. Did you mean 'validate'?
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QualityAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PrismaGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/prisma-generator/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PrismaGenerator'. Did you mean 'validate'?
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PrismaGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### NestJSGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/nestjs-generator/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'NestJSGenerator'. Did you mean 'validate'?
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'NestJSGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### RemixGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/remix-generator/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'RemixGenerator'. Did you mean 'validate'?
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'RemixGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### ComponentGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/business/generators/component-generator/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ComponentGenerator'. Did you mean 'validate'?
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ComponentGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### CoordinatorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/business/orchestrators/coordinator-agent/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(1,34): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CoordinatorAgent'.
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CoordinatorAgent'. Did you mean 'validate'?
../../tmp/test-CoordinatorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CoordinatorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BullMqOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/business/orchestrators/bullmq-orchestrator/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BullMqOrchestrator'. Did you mean 'validate'?
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BullMqOrchestrator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixGeneratorAgent'.
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'RemixGeneratorAgent'. Did you mean 'validate'?
../../tmp/test-RemixGeneratorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'RemixGeneratorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SeoMetadataGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/seo-meta.generator/seo-meta.generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SeoMetadataGenerator'.
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SeoMetadataGenerator'. Did you mean 'validate'?
../../tmp/test-SeoMetadataGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SeoMetadataGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### generate_prisma_model (/workspaces/cahier-des-charge/packages/mcp-agents/generators/generate_prisma_model/generate_prisma_model.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'generate_prisma_model'.
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'generate_prisma_model'. Did you mean 'validate'?
../../tmp/test-generate_prisma_model-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'generate_prisma_model'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### RemixRouteGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/remix-route/remix-route-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixRouteGenerator'.
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'RemixRouteGenerator'. Did you mean 'validate'?
../../tmp/test-RemixRouteGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'RemixRouteGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### prisma (/workspaces/cahier-des-charge/packages/mcp-agents/generators/prisma-migration/prisma-migration-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-prisma-2025-04-20-00-52-52.ts(1,24): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'prisma'. Did you mean 'validate'?
../../tmp/test-prisma-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'prisma'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### ReactComponentGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/react-component/react-component-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ReactComponentGenerator'.
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ReactComponentGenerator'. Did you mean 'validate'?
../../tmp/test-ReactComponentGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ReactComponentGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### NestJSGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/nestjs/nestjs-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NestJSGenerator'.
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'NestJSGenerator'. Did you mean 'validate'?
../../tmp/test-NestJSGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'NestJSGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AbstractGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract-generator/abstract-generator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractGeneratorAgent'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractGeneratorAgent'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractGeneratorAgent'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractGeneratorAgent'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractGeneratorAgent'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractGeneratorAgent'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractGeneratorAgent'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractGeneratorAgent'.
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractGeneratorAgent'. Did you mean 'validate'?
../../tmp/test-AbstractGeneratorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractGeneratorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### MetaGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/meta/meta-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MetaGenerator'.
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MetaGenerator'. Did you mean 'validate'?
../../tmp/test-MetaGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MetaGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PrismaGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/prisma/prisma-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PrismaGenerator'. Did you mean 'validate'?
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PrismaGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### MigrationReportGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/migration-report/migration-report-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(1,42): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MigrationReportGenerator'.
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MigrationReportGenerator'. Did you mean 'validate'?
../../tmp/test-MigrationReportGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MigrationReportGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AbstractGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract/abstract-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractGenerator'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractGenerator'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractGenerator'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractGenerator'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractGenerator'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractGenerator'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractGenerator'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractGenerator'.
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractGenerator'. Did you mean 'validate'?
../../tmp/test-AbstractGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### CaddyGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddy/caddy-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CaddyGenerator'.
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CaddyGenerator'. Did you mean 'validate'?
../../tmp/test-CaddyGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CaddyGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### ComponentGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/component/component-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ComponentGenerator'. Did you mean 'validate'?
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ComponentGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### DevGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/dev/dev-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DevGenerator'.
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DevGenerator'. Did you mean 'validate'?
../../tmp/test-DevGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DevGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SEOContentEnhancer (/workspaces/cahier-des-charge/packages/mcp-agents/generators/seo-content-enhancer/seo-content-enhancer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SEOContentEnhancer'.
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SEOContentEnhancer'. Did you mean 'validate'?
../../tmp/test-SEOContentEnhancer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SEOContentEnhancer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### RemixGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/remix/remix-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'RemixGenerator'.
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'RemixGenerator'. Did you mean 'validate'?
../../tmp/test-RemixGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'RemixGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BaseGeneratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/generators/base-generator/base-generator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BaseGeneratorAgent'.
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BaseGeneratorAgent'. Did you mean 'validate'?
../../tmp/test-BaseGeneratorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BaseGeneratorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### prisma (/workspaces/cahier-des-charge/packages/mcp-agents/generators/prisma-smart/prisma-smart-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-prisma-2025-04-20-00-52-52.ts(1,24): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'prisma'.
../../tmp/test-prisma-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'prisma'. Did you mean 'validate'?
../../tmp/test-prisma-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'prisma'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### generate (/workspaces/cahier-des-charge/packages/mcp-agents/generators/generate-migration-plan/generate-migration-plan.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-generate-2025-04-20-00-52-52.ts(1,26): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-generate-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'generate'.
../../tmp/test-generate-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'generate'. Did you mean 'validate'?
../../tmp/test-generate-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'generate'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### CaddyfileGenerator (/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddyfile/caddyfile-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CaddyfileGenerator'.
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CaddyfileGenerator'. Did you mean 'validate'?
../../tmp/test-CaddyfileGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CaddyfileGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BaseOrchestratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/base-orchestrator/base-orchestrator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BaseOrchestratorAgent'.
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BaseOrchestratorAgent'. Did you mean 'validate'?
../../tmp/test-BaseOrchestratorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BaseOrchestratorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### orchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestrator/orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'orchestrator'.
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'orchestrator'. Did you mean 'validate'?
../../tmp/test-orchestrator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'orchestrator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### N8nConnector (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/n8n-connector/n8n-connector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'N8nConnector'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'N8nConnector'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'N8nConnector'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'N8nConnector'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'N8nConnector'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'N8nConnector'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'N8nConnector'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'N8nConnector'.
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'N8nConnector'. Did you mean 'validate'?
../../tmp/test-N8nConnector-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'N8nConnector'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TemporalAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-adapter/temporal-adapter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalAdapter'.
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TemporalAdapter'. Did you mean 'validate'?
../../tmp/test-TemporalAdapter-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TemporalAdapter'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TemporalRetryAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-retry-adapter/temporal-retry-adapter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalRetryAdapter'.
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TemporalRetryAdapter'. Did you mean 'validate'?
../../tmp/test-TemporalRetryAdapter-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TemporalRetryAdapter'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PrometheusExporter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/prometheus-exporter/prometheus-exporter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrometheusExporter'.
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PrometheusExporter'. Did you mean 'validate'?
../../tmp/test-PrometheusExporter-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PrometheusExporter'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### SystemMonitor (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/system-monitor/system-monitor.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SystemMonitor'.
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SystemMonitor'. Did you mean 'validate'?
../../tmp/test-SystemMonitor-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SystemMonitor'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TemporalConnector (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/TemporalConnector/TemporalConnector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TemporalConnector'. Did you mean 'validate'?
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TemporalConnector'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### OrchestratorBridge (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestrator-bridge/orchestrator-bridge.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'OrchestratorBridge'. Did you mean 'validate'?
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'OrchestratorBridge'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### BullMQConnector (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bullmq-connector/bullmq-connector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BullMQConnector'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BullMQConnector'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BullMQConnector'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BullMQConnector'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BullMQConnector'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BullMQConnector'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BullMQConnector'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BullMQConnector'.
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BullMQConnector'. Did you mean 'validate'?
../../tmp/test-BullMQConnector-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BullMQConnector'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BullMqOrchestrator'.
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BullMqOrchestrator'. Did you mean 'validate'?
../../tmp/test-BullMqOrchestrator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BullMqOrchestrator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### DatabaseService (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/database-service/database-service.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'DatabaseService'.
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'DatabaseService'. Did you mean 'validate'?
../../tmp/test-DatabaseService-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'DatabaseService'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### implementation (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/index.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-implementation-2025-04-20-00-52-52.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/index.ts"' has no exported member 'implementation'. Did you mean to use 'import implementation from "/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/index.ts"' instead?
../../tmp/test-implementation-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2614, 5097 ]
}
```

### AbstractOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/abstract/abstract-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractOrchestrator'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractOrchestrator'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractOrchestrator'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractOrchestrator'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractOrchestrator'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractOrchestrator'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractOrchestrator'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractOrchestrator'.
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractOrchestrator'. Did you mean 'validate'?
../../tmp/test-AbstractOrchestrator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractOrchestrator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TemporalConnector (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-connector/temporal-connector.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalConnector'.
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TemporalConnector'. Did you mean 'validate'?
../../tmp/test-TemporalConnector-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TemporalConnector'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### MigrationOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/migration/migration-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MigrationOrchestrator'.
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MigrationOrchestrator'. Did you mean 'validate'?
../../tmp/test-MigrationOrchestrator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MigrationOrchestrator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### PriorityScheduler (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/priority-scheduler/priority-scheduler.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PriorityScheduler'.
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PriorityScheduler'. Did you mean 'validate'?
../../tmp/test-PriorityScheduler-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PriorityScheduler'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### WorkflowPriorityQueue (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/migration-coordinator/migration-coordinator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'WorkflowPriorityQueue'.
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'WorkflowPriorityQueue'. Did you mean 'validate'?
../../tmp/test-WorkflowPriorityQueue-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'WorkflowPriorityQueue'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### EnhancedTemporalAdapter (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/enhanced-temporal-adapter/enhanced-temporal-adapter.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(1,41): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'EnhancedTemporalAdapter'.
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'EnhancedTemporalAdapter'. Did you mean 'validate'?
../../tmp/test-EnhancedTemporalAdapter-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'EnhancedTemporalAdapter'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AbstractOrchestratorAgent (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/abstract-orchestrator/abstract-orchestrator-agent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(1,43): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AbstractOrchestratorAgent'.
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AbstractOrchestratorAgent'. Did you mean 'validate'?
../../tmp/test-AbstractOrchestratorAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AbstractOrchestratorAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### TemporalOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-orchestration/temporal-orchestration.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(1,38): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TemporalOrchestrator'.
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TemporalOrchestrator'. Did you mean 'validate'?
../../tmp/test-TemporalOrchestrator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TemporalOrchestrator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### CheckpointManager (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/checkpoint-manager/checkpoint-manager.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CheckpointManager'.
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CheckpointManager'. Did you mean 'validate'?
../../tmp/test-CheckpointManager-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CheckpointManager'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AdvancedRetryStrategy (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/advanced-retry-strategy/advanced-retry-strategy.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(1,39): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AdvancedRetryStrategy'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AdvancedRetryStrategy'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AdvancedRetryStrategy'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AdvancedRetryStrategy'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AdvancedRetryStrategy'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AdvancedRetryStrategy'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AdvancedRetryStrategy'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AdvancedRetryStrategy'.
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AdvancedRetryStrategy'. Did you mean 'validate'?
../../tmp/test-AdvancedRetryStrategy-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AdvancedRetryStrategy'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### ThreeLayerArchitecture (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/three-layer-architecture/three-layer-architecture.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(1,40): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ThreeLayerArchitecture'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ThreeLayerArchitecture'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ThreeLayerArchitecture'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ThreeLayerArchitecture'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ThreeLayerArchitecture'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ThreeLayerArchitecture'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ThreeLayerArchitecture'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ThreeLayerArchitecture'.
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ThreeLayerArchitecture'. Did you mean 'validate'?
../../tmp/test-ThreeLayerArchitecture-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ThreeLayerArchitecture'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AlertNotifier (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/alert-notifier/alert-notifier.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AlertNotifier'.
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AlertNotifier'. Did you mean 'validate'?
../../tmp/test-AlertNotifier-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AlertNotifier'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### AgentOrchestrator (/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/agent/agent-orchestrator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(1,35): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'AgentOrchestrator'.
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'AgentOrchestrator'. Did you mean 'validate'?
../../tmp/test-AgentOrchestrator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'AgentOrchestrator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(1,45): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'SupabaseOptimizationTracker'.
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'SupabaseOptimizationTracker'. Did you mean 'validate'?
../../tmp/test-SupabaseOptimizationTracker-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'SupabaseOptimizationTracker'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### implementation (/workspaces/cahier-des-charge/agents/core/BaseAgent.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-implementation-2025-04-20-00-52-52.ts(1,10): error TS2614: Module '"/workspaces/cahier-des-charge/agents/core/BaseAgent.ts"' has no exported member 'implementation'. Did you mean to use 'import implementation from "/workspaces/cahier-des-charge/agents/core/BaseAgent.ts"' instead?
../../tmp/test-implementation-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 2614, 5097 ]
}
```

### MetricsService (/workspaces/cahier-des-charge/agents/integration/metrics-service.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MetricsService'.
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MetricsService'. Did you mean 'validate'?
../../tmp/test-MetricsService-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MetricsService'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(1,37): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'NotificationService'.
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'NotificationService'. Did you mean 'validate'?
../../tmp/test-NotificationService-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'NotificationService'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(7,23): error TS2554: Expected 1 arguments, but got 0.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(16,26): error TS2339: Property 'validate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(17,50): error TS2339: Property 'validate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(22,26): error TS2339: Property 'execute' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(23,49): error TS2339: Property 'execute' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'OrchestratorBridge'.
../../tmp/test-OrchestratorBridge-2025-04-20-00-52-52.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'OrchestratorBridge'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
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
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(7,23): error TS2554: Expected 2-3 arguments, but got 0.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(16,26): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(17,50): error TS2339: Property 'validate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(22,26): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(23,49): error TS2339: Property 'execute' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(35,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(41,55): error TS2554: Expected 0 arguments, but got 1.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'QAAnalyzer'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
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

### HtaccessParser (/workspaces/cahier-des-charge/agents/migration/php-to-remix/htaccess-parser.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
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
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'CanonicalSyncAgent'.
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'CanonicalSyncAgent'. Did you mean 'validate'?
../../tmp/test-CanonicalSyncAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'CanonicalSyncAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(1,31): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'BusinessAgent'.
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'BusinessAgent'. Did you mean 'validate'?
../../tmp/test-BusinessAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'BusinessAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TableClassifier'. Did you mean 'validate'?
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TableClassifier'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'TableClassifier'.
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'TableClassifier'. Did you mean 'validate'?
../../tmp/test-TableClassifier-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'TableClassifier'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PrismaGenerator'. Did you mean 'validate'?
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PrismaGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(1,33): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'PrismaGenerator'.
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'PrismaGenerator'. Did you mean 'validate'?
../../tmp/test-PrismaGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'PrismaGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

### ComponentGenerator (/workspaces/cahier-des-charge/agents/migration/component-generator.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(1,36): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'ComponentGenerator'.
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'ComponentGenerator'. Did you mean 'validate'?
../../tmp/test-ComponentGenerator-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'ComponentGenerator'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(1,30): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QualityAgent'.
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QualityAgent'. Did you mean 'validate'?
../../tmp/test-QualityAgent-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QualityAgent'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(1,29): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'MCPNotifier'.
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'MCPNotifier'. Did you mean 'validate'?
../../tmp/test-MCPNotifier-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'MCPNotifier'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
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
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(1,32): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(10,26): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(11,25): error TS2339: Property 'initialize' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(16,26): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(17,50): error TS2339: Property 'validate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(22,26): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(23,49): error TS2339: Property 'execute' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(52,26): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.
../../tmp/test-HtaccessParser-2025-04-20-00-52-52.ts(53,52): error TS2339: Property 'validateData' does not exist on type 'HtaccessParser'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
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

### php-analyzer-v2 (/workspaces/cahier-des-charge/agents/analysis/php-analyzer-v2.ts)

- ❌ Test adapté échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
tests/agents/test-php-analyzer-v2.ts(44,16): error TS18046: 'error' is of type 'unknown'.
tests/agents/test-php-analyzer-v2.ts(50,42): error TS2339: Property 'id' does not exist on type 'typeof php'.
tests/agents/test-php-analyzer-v2.ts(52,51): error TS2339: Property 'description' does not exist on type 'typeof php'.

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 18046, 2339, 2339 ]
}
```

### QAAnalyzer (/workspaces/cahier-des-charge/agents/analysis/php-analyzer.ts)

- ❌ Test échoué
```
/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(1,28): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(17,59): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(23,57): error TS2345: Argument of type '{}' is not assignable to parameter of type 'AgentContext'.
  Property 'jobId' is missing in type '{}' but required in type 'AgentContext'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(28,26): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(29,43): error TS2339: Property 'run' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(34,26): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(35,47): error TS2339: Property 'process' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(40,26): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(41,47): error TS2339: Property 'analyze' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(46,26): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(47,48): error TS2339: Property 'generate' does not exist on type 'QAAnalyzer'.
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(52,26): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?
../../tmp/test-QAAnalyzer-2025-04-20-00-52-52.ts(53,52): error TS2551: Property 'validateData' does not exist on type 'QAAnalyzer'. Did you mean 'validate'?

    at createTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1613:10)
    at Object.require.extensions.<computed> [as .ts] (/usr/local/share/nvm/versions/node/v20.19.0/lib/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1275:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1096:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [
    5097, 2345, 2345,
    2339, 2339, 2339,
    2339, 2339, 2339,
    2339, 2339, 2551,
    2551
  ]
}
```

- Total des tests: 3
- Tests réussis: 0
- Tests échoués: 3
- Tests ignorés: 0

