/**
 * Interfaces pour la Couche business - Logique métier spécifique et traitement des données
 */

import { AnalyzerAgent, AnalyzerOptions, AnalyzerResult } from ./analyzer/analyzer-agentstructure-agent';
import { GeneratorAgent, GeneratorOptions, GeneratorResult } from ./generator/generator-agentstructure-agent';
import { ValidatorAgent, ValidatorOptions, ValidatorResult } from ./validator/validator-agentstructure-agent';
import { ParserAgent, ParserOptions, ParserResult } from ./parser/parser-agentstructure-agent';

export {
  AnalyzerAgent,
  AnalyzerOptions,
  AnalyzerResult,
  GeneratorAgent,
  GeneratorOptions,
  GeneratorResult,
  ValidatorAgent,
  ValidatorOptions,
  ValidatorResult,
  ParserAgent,
  ParserOptions,
  ParserResult
};
