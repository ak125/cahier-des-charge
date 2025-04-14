import { generateGitHubWorkflow, validateSetup, detectCITests, analyzePackageScripts, generateCIReport } from './core';
import { CIReport, CITesterOptions } from './types';
/**
 * Point d'entrée principal de l'agent CI-Tester
 */
export declare function runCITester(options?: CITesterOptions): Promise<CIReport>;
export * from './types';
export { analyzePackageScripts, detectCITests, validateSetup, generateGitHubWorkflow, generateCIReport };
