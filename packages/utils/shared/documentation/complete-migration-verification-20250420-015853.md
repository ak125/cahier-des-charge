# Rapport de vérification complète de la migration des agents

Date: 2025-04-20 01:58:53

## Structure actuelle des agents

### Statistiques des agents migrés

- **Total des agents dans la nouvelle structure** : 112
- **Analyzers** : 30
- **Validators** : 2
- **Generators** : 10
- **Orchestrators** : 6
- **Misc** : 64

## Agents potentiels non migrés

**⚠️ 1054 fichiers potentiels d'agents n'ont peut-être pas été migrés:**

| Fichier | Probabilité d'être un agent | Contenu |
|---------|---------------------------|---------|
| `agent-interface-validator.ts` | Très élevée | ` * Système avancé de validation qui vérifie la compatibilité des interfaces des agents export en...` |
| `custom-nodes/audit-validator/nodes/AuditValidator/AuditValidator.node.ts` | Élevée | `interface ValidationReport { interface RecheckReport { export class AuditValidator implements INodeT...` |
| `custom-nodes/mysql-mcp-node/MySqlMcpNode.ts` | Moyenne | `export class MySqlMcpNode implements INodeType { ...` |
| `utils/audit-report-generator.ts` | Moyenne | `interface AuditReportOptions { export async function generateAuditReport(       if (file.classes && ...` |
| `utils/audit-history-manager.ts` | Faible | `interface AuditHistory { interface FileMapping { export class AuditHistoryManager { export const aud...` |
| `utils/traceability/traceability-service.ts` | Faible | `export interface TraceabilityOptions { export interface TraceEvent { export class TraceabilityServic...` |
| `utils/supabaseClient.ts` | Faible | `// Créer et exporter le client Supabase typé export const supabase = createClient<Database>( expor...` |
| `utils/supabase-integration.ts` | Faible | `interface AnalysisResult { interface AuditFile { export async function storeAnalysisResult( export a...` |
| `utils/types.ts` | Faible | `export type Json = string \| number \| boolean \| null \| { [key: string]: Json \| undefined } \| Js...` |
| `utils/governance/governance-mesh.ts` | Faible | `export enum GovernanceEvent { export enum DecisionType { export enum DecisionSeverity { export inter...` |
| `utils/discord-notification.ts` | Faible | `interface DiscordNotificationOptions { interface DiscordEmbed { export enum DiscordColors { export a...` |
| `test-config.ts` | Faible | `export function configureAgentTest(agentName: string, agentPath: string) { export function runAgentT...` |
| `tests/agents/test-php-analyzer-v2.ts` | Moyenne | `// Test pour l'agent PHPAnalyzerV2 qui est exporté comme une instance par défaut   // On peut dire...` |
| `tests/agents/test-abstract-analyzer.ts` | Très élevée | `class TestAnalyzerAgent extends AbstractAnalyzerAgent {   // Ajout d'autres méthodes requises par l...` |
| `tests/agents/test-base-analyzer.ts` | Très élevée | `import { AgentContext, AgentResult } from '../../packages/mcp-agents/core/interfaces'; class TestBas...` |
| `adapt-agents.ts` | Très élevée | ` * les interfaces abstraites appropriées selon leur catégorie. interface AgentMapping {   classNam...` |
| `test-htaccess-router.ts` | Faible | `  // Trouver la classe de l'agent     // Chercher un constructeur ou une classe dans le module   con...` |
| `run-fixed-agent-tests.ts` | Élevée | `...` |
| `config/core/schemas/business-schema.ts` | Faible | `export const businessConfigSchema = z.object({ export type BusinessConfig = z.infer<typeof businessC...` |
| `config/core/schemas/agent-schema.ts` | Moyenne | `export const agentConfigSchema = z.object({ export type AgentConfig = z.infer<typeof agentConfigSche...` |
| `config/core/unified-config.ts` | Faible | `export type OrchestrationConfig = z.infer<typeof orchestrationConfigSchema>; export type AgentConfig...` |
| `config/config.ts` | Moyenne | `export const PATHS = { export const AGENTS = { export const DASHBOARD = { export const ORCHESTRATOR ...` |
| `agentRegistry.ts` | Très élevée | `import { BaseAgent } from './src/core/interfaces/base-agent'; import { OrchestratorAgent, SchedulerA...` |
| `examples/php-to-remix-migration-workflow.ts` | Faible | `export { runPhpToRemixMigration }; ...` |
| `examples/enhanced-orchestrator-example.ts` | Faible | `...` |
| `test-qa-analyzer-simple.ts` | Élevée | `export default function ExampleComponent() { export interface LoaderData { export const loader: Load...` |
| `migration-toolkit/templates/routes-legacy/fiche.$id/loader.ts` | Faible | `export interface FicheData { export async function loader({ params, request }: LoaderFunctionArgs) {...` |
| `test-qa-analyzer.ts` | Très élevée | ` * l'interface AbstractAnalyzerAgent. interface MinimalAgentContext {   await fs.writeFile(generated...` |
| `generate-agent-manifest.ts` | Très élevée | `interface GeneratorConfig {  * Les métadonnées qui peuvent être extraites d'une classe d'agent in...` |
| `legacy/migration-2025-04-18/agents/devops-preview.ts` | Élevée | `interface PreviewConfig { interface MigrationInfo { interface LighthouseResults { class PreviewAgent...` |
| `legacy/migration-2025-04-18/agents/auto-pr-agent.ts` | Très élevée | `export interface AutoPRConfig { export interface PRResult { export class AutoPRAgent { export functi...` |
| `legacy/migration-2025-04-18/agents/utils/caddy-generator.ts` | Moyenne | `export class CaddyGenerator { ...` |
| `legacy/migration-2025-04-18/agents/utils/nginx-config-parser.ts` | Faible | `export interface NginxServer { export interface NginxLocation { export interface NginxConfig { expor...` |
| `legacy/migration-2025-04-18/agents/utils/htaccess-parser.ts` | Faible | `export interface HtaccessRule { export interface HtaccessCondition { export interface HtaccessConfig...` |
| `legacy/migration-2025-04-18/agents/seo-audit-runner.ts` | Très élevée | `interface AuditOptions { interface AuditResult { interface SEOAuditConfig extends AgentConfig { expo...` |
| `legacy/migration-2025-04-18/agents/seo-mcp-controller.ts` | Faible | `interface SEOMCPControllerConfig { interface SEOProcessingResult { export class SEOMCPController { e...` |
| `legacy/migration-2025-04-18/agents/ci-tester.ts` | Faible | `interface CITest { interface PackageScripts { interface CIReport { export const ciTesterAgent = { ex...` |
| `legacy/migration-2025-04-18/agents/dev-integrator.ts` | Faible | `interface IntegratorContext { interface IntegrationResult { interface IntegratorIndex { export const...` |
| `legacy/migration-2025-04-18/agents/meta-generator.ts` | Moyenne | `interface MetaGeneratorConfig { interface MetaResult { interface ProcessingResult { export class Met...` |
| `legacy/migration-2025-04-18/agents/pipeline-strategy-auditor.ts` | Faible | `interface PipelineAudit { interface StrategyAudit { class PipelineStrategyAuditor { export { Pipelin...` |
| `legacy/migration-2025-04-18/agents/migration/prisma-smart-generator.ts` | Moyenne | ` * à partir des sorties des agents précédents, tout en anticipant les erreurs classiques de migra...` |
| `legacy/migration-2025-04-18/agents/migration/php-to-remix/remix-route-generator.ts` | Très élevée | `interface RouteMapping { interface RouteTemplates { export class RemixRouteGenerator implements MCPA...` |
| `legacy/migration-2025-04-18/agents/migration/php-to-remix/dev-generator.ts` | Très élevée | `interface IterationConfig { interface IterationTask { export class DevGenerator implements MCPAgent ...` |
| `legacy/migration-2025-04-18/agents/migration/php-to-remix/htaccess-route-analyzer.ts` | Très élevée | `interface RouteMapping { export class HtaccessRouteAnalyzer implements MCPAgent { export default new...` |
| `legacy/migration-2025-04-18/agents/migration/php-to-remix/php-router-audit.ts` | Très élevée | `interface PhpRouteAuditResult { export class PhpRouterAudit implements MCPAgent { export default new...` |
| `legacy/migration-2025-04-18/agents/migration/php-to-remix/seo-meta.generator.ts` | Moyenne | `interface SeoMetadata { interface SeoAnalysisOptions { export class SeoMetadataGenerator { export fu...` |
| `legacy/migration-2025-04-18/agents/migration/php-to-remix/seo-checker-canonical.ts` | Très élevée | `interface SeoCheckResult { export class SeoChecker implements MCPAgent {         const metaFunctionM...` |
| `legacy/migration-2025-04-18/agents/migration/data-verifier.ts` | Faible | `interface Config { interface TableVerificationResult { interface MismatchDetail { interface Verifica...` |
| `legacy/migration-2025-04-18/agents/migration/type-audit-agent.ts` | Moyenne | `interface MySQLSchema {   classificationStats?: Record<string, number>; interface TableInfo {   clas...` |
| `legacy/migration-2025-04-18/agents/migration/generate-migration-plan.ts` | Faible | `interface DependencyInfo { interface SecurityScore { interface AuditData { interface MigrationTask {...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-to-postgresql.ts` | Faible | `interface MigrationRule { interface MigrationConfig { interface MigrationStats { // Ces règles sont...` |
| `legacy/migration-2025-04-18/agents/migration/sql-prisma-migration-planner.ts` | Faible | `interface SchemaRaw { interface TableInfo { interface ViewInfo { interface ColumnInfo { interface In...` |
| `legacy/migration-2025-04-18/agents/migration/consolidator.ts` | Faible | `interface ConsolidatorContext {   exportHtml?: boolean;            // Générer également des versi...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer.ts` | Moyenne | `import { TableClassifier } from './mysql-analyzer/core/classifier'; // Modèles et interfaces     co...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/core/schema-analyzer.ts` | Moyenne | `export class SchemaAnalyzer { ...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/core/relation-analyzer.ts` | Moyenne | `export class RelationAnalyzer { ...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/core/debt-analyzer.ts` | Moyenne | `export class DebtAnalyzer { ...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/core/prisma-generator.ts` | Moyenne | `export class PrismaGenerator { ...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/mysql-analyzer.ts` | Moyenne | `import { TableClassifier } from './core/classifier'; // Configuration de l'interface en ligne de com...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/agents/type-converter.ts` | Faible | `interface TypeConversionMap { interface TypeConversionResult { export class TypeConverter { ...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/agents/prisma-generator.ts` | Moyenne | `interface PrismaModelField { interface PrismaModel { interface PrismaEnum { interface PrismaSchema {...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/agents/type-auditor.ts` | Faible | `export class TypeAuditor { ...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/agents/debt-detector.ts` | Faible | `export class DebtDetector { ...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer/agents/relational-normalizer.ts` | Faible | `interface RelationalNormalizerOptions { export class RelationalNormalizer { ...` |
| `legacy/migration-2025-04-18/agents/migration/prisma-migration-generator.ts` | Moyenne | `...` |
| `legacy/migration-2025-04-18/agents/migration/agent-business.ts` | Très élevée | `interface AuditSection { export class BusinessAgent {       } else if (content.match(/import\|export...` |
| `legacy/migration-2025-04-18/agents/migration/sql-analyzer+prisma-builder.ts` | Moyenne | `...` |
| `legacy/migration-2025-04-18/agents/migration/postgresql-validator.ts` | Moyenne | `class ValidationIssue { interface PrismaModel { interface PrismaField { interface PostgresTable { in...` |
| `legacy/migration-2025-04-18/agents/migration/component-generator.ts` | Moyenne | `interface ComponentDefinition { interface PropDefinition { interface ControllerDefinition { interfac...` |
| `legacy/migration-2025-04-18/agents/migration/qa-confirmer.ts` | Faible | `interface QaConfirmerContext { interface QaChecklistItem { interface QaValidationResult { interface ...` |
| `legacy/migration-2025-04-18/agents/migration/progressive-migration-agent.ts` | Très élevée | `interface ProxyConfig { export class ProgressiveMigrationAgent extends BaseAgent { ...` |
| `legacy/migration-2025-04-18/agents/migration/remediator.ts` | Faible | `interface RemediatorOptions { interface RemediationResult { interface RemediationSummary { export co...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-to-pg.ts` | Faible | `interface ColumnInfo { interface TableInfo { interface TypeMapping { interface SchemaMap { ...` |
| `legacy/migration-2025-04-18/agents/migration/mysql-analyzer+optimizer.ts` | Moyenne | `import { TableClassifier } from './mysql-analyzer/core/classifier'; // Modèles et interfaces     //...` |
| `legacy/migration-2025-04-18/agents/discovery/discovery-agent.ts` | Moyenne | `interface DiscoveryItem { interface KeywordDefinition {   { pattern: /class\s+\w+/g, score: 0.8, typ...` |
| `legacy/migration-2025-04-18/agents/quality/analyze-security-risks.ts` | Faible | `interface DynamicBehavior { interface ComplexityMetric { interface SecurityVulnerability { interface...` |
| `legacy/migration-2025-04-18/agents/quality/agent-quality.ts` | Très élevée | `interface AuditSection { export class QualityAgent {     const isOOP = content.includes('class '); ...` |
| `legacy/migration-2025-04-18/agents/quality/sql-debt-audit.ts` | Faible | `interface SQLDebtIssue { interface SQLDebtSummary { interface SQLDebtReport { export { ...` |
| `legacy/migration-2025-04-18/agents/seo-checker-agent.ts` | Très élevée | `interface SEOCheckerConfig extends AgentConfig { export interface SEOTraceEvent { export class SEOCh...` |
| `legacy/migration-2025-04-18/agents/tools/agent-version-auditor.ts` | Moyenne | `interface AgentInfo { interface AgentGroup { interface AuditResult { export { ...` |
| `legacy/migration-2025-04-18/agents/pr-creator.ts` | Faible | `interface PullRequestConfig { interface FileData { interface JobContext { export class PRCreator { e...` |
| `legacy/migration-2025-04-18/agents/diff-verifier.ts` | Faible | `interface DiffVerifierContext { interface VerificationResult { interface VerifierIndex { export cons...` |
| `legacy/migration-2025-04-18/agents/seo-redirect-mapper.ts` | Très élevée | `interface Redirection { interface RedirectMapperConfig extends AgentConfig { export class SEORedirec...` |
| `legacy/migration-2025-04-18/agents/analysis/agent-donnees.ts` | Moyenne | `interface DataSource { interface DataOutput { interface SqlQuery { interface DataAnalysisResult { cl...` |
| `legacy/migration-2025-04-18/agents/analysis/type-mapper.ts` | Faible | `interface Table { interface Column { interface ForeignKey { interface TypeMapping { interface TypeAn...` |
| `legacy/migration-2025-04-18/agents/analysis/htaccess-router-analyzer.ts` | Très élevée | `interface HtaccessRouterAnalyzerConfig { interface RouteAnalysisResult { export class HtaccessRouter...` |
| `legacy/migration-2025-04-18/agents/analysis/relation-analyzer.ts` | Moyenne | `interface Table { interface Column { interface ForeignKey { interface Relation { interface PrismaRel...` |
| `legacy/migration-2025-04-18/agents/analysis/config-parsers/nginx-config-parser.ts` | Très élevée | `interface NginxLocation { interface NginxServer { interface NginxConfig { export class NginxConfigPa...` |
| `legacy/migration-2025-04-18/agents/analysis/table-cartographer.ts` | Faible | `interface Table { interface Column { interface ForeignKey { interface TableClassification { interfac...` |
| `legacy/migration-2025-04-18/agents/analysis/generate_prisma_model.ts` | Faible | `interface TypeMapping { interface Table { interface Column { interface Relation { interface EnumSugg...` |
| `legacy/migration-2025-04-18/agents/analysis/semantic-table-mapper.ts` | Faible | `// Cet agent analyse et classifie les tables d'une base de données selon leur rôle fonctionnel int...` |
| `legacy/migration-2025-04-18/agents/analysis/agent-structure.ts` | Très élevée | `interface StructureAnalysisResult { export class StructureAgent {           utility: ["class", "func...` |
| `legacy/migration-2025-04-18/agents/seo-content-enhancer.ts` | Très élevée | `interface EnhancerTarget { interface ContentSuggestion { interface SEOContentEnhancerConfig extends ...` |
| `legacy/migration-2025-04-18/agents/dev-linter.ts` | Faible | `interface LintResult { interface TypeCheckResult { interface TailwindCheckResult { interface BiomeCh...` |
| `legacy/migration-2025-04-18/agents/dev-checker.ts` | Faible | `export const devCheckerAgent = { // Nouvelles interfaces pour le support d'auto-correction interface...` |
| `legacy/migration-2025-04-17/agents/optimization/agent8-optimizer.ts` | Très élevée | `export class Agent8SqlOptimizer implements INodeType { 				pg_class C 				pg_catalog.col_description...` |
| `legacy/migration-2025-04-17/agents/php-analyzer-agent.ts` | Élevée | `export { startRedisPhpAnalyzerAgent }; ...` |
| `legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | Moyenne | `interface DependencyMap { interface DiscoveryItem { interface StatusData { interface MigrationOrches...` |
| `legacy/migration-2025-04-17/agents/core/agent-orchestrator.ts` | Très élevée | `interface AgentResult { interface PipelineStatus { export class AgentOrchestrator { export default A...` |
| `legacy/migration-2025-04-17/agents/core/coordinator-agent.ts` | Très élevée | `interface CoordinatorConfig { interface InterAgentMessage { interface AgentExecutionResult { interfa...` |
| `legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | Moyenne | ` * Cette classe gère les différentes files d'attente et coordonne les agents export class BullMqOr...` |
| `legacy/migration-2025-04-17/agents/orchestrator.ts` | Moyenne | `interface OrchestratorContext { interface AgentResult { interface OrchestratorReport { interface Age...` |
| `legacy/migration-2025-04-17/agents/migration/sql-analysis-runner.ts` | Faible | `interface MigrationConfig { class CLI { ...` |
| `legacy/migration-2025-04-17/agents/status-writer.ts` | Moyenne | `interface StatusData { export class StatusWriterAgent { ...` |
| `legacy/migration-2025-04-17/agents/workers/mcp-verifier.worker.ts` | Faible | `export { startMcpVerifierWorker }; ...` |
| `legacy/migration-2025-04-17/agents/workers/php-analyzer.worker.ts` | Élevée | `export { startPhpAnalyzerWorker }; ...` |
| `legacy/migration-2025-04-17/agents/analysis/agent-audit.ts` | Moyenne | `export async function executeAudit(filePath: string): Promise<string> { // Rendre la fonction genera...` |
| `legacy/migration-2025-04-17/agents/monitoring-check.ts` | Élevée | `interface MonitoringConfig { interface RouteStatus { interface PerformanceComparison { interface Dom...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/validators/canonical-validator/canonical-validator/canonical-validator.ts` | Très élevée | `interface CanonicalValidatorConfig extends AgentConfig { interface CanonicalIssue { export class Can...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/validators/seo-checker/seo-checker-agent.ts` | Très élevée | `interface SEOCheckerConfig extends AgentConfig { export class SEOCheckerAgent implements MCPAgent<SE...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/validators/seo-checker/seo-checker-agent/seo-checker-agent.ts` | Très élevée | `interface SEOCheckerConfig extends AgentConfig { export class SEOCheckerAgent extends AbstractValida...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/remix-generator.ts` | Élevée | `interface GeneratedRemixComponent { interface RemixGeneratorOptions { export async function generate...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/core/interfaces/base-agent.ts` | Très élevée | `export enum AgentHealthState { export interface AgentStatus { export interface AgentResult { export ...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/shared/base-agent.ts` | Très élevée | `export abstract class BaseMcpAgent implements McpAgent { ...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/nestjs-generator.ts` | Élevée | `interface GeneratedNestJSComponent { interface NestJSGeneratorOptions { export async function genera...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/generators/remix-generator.ts` | Très élevée | `export class RemixGenerator extends AbstractGeneratorAgent<any, any> { export default RemixGenerator...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/generators/caddyfile-generator/caddyfile-generator/caddyfile-generator.ts` | Très élevée | `export interface ServerConfig { export interface RouteConfig { export interface TLSConfig { export i...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/generators/nestjs-generator.ts` | Élevée | `export class NestJSGenerator { export class ${entityName}Controller { export class ${entityName}Serv...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/analysis/php-analyzer.ts` | Élevée | `export async function analyzePhpFile(filePath: string): Promise<PhpAnalysisResult> {           class...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/adapters/temporal-adapter.ts` | Très élevée | `export class TemporalAdapter extends AbstractOrchestratorAgent<any, any> implements OrchestrationAda...` |
| `legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | Très élevée | `export interface OrchestratorBridgeConfig {  * Cette classe permet une communication bidirectionnell...` |
| `legacy/consolidation-2025-04-17/agents/migration/nginx-to-caddy/caddyfile-generator.ts` | Très élevée | `interface CaddyfileConfig { export class CaddyfileGenerator implements MCPAgent { export default new...` |
| `legacy/consolidation-2025-04-17/agents/migration/php-to-remix/htaccess-parser.ts` | Très élevée | ` * Extrait toutes les règles et les classe par type pour faciliter la migration vers Remix interfac...` |
| `legacy/consolidation-2025-04-17/agents/migration/caddyfile-generator.ts` | Très élevée | `export interface ServerConfig { export interface RouteConfig { export interface TLSConfig { export i...` |
| `legacy/consolidation-2025-04-17/agents/analysis/config-parsers/htaccess-parser.ts` | Très élevée | `interface HtaccessRule { interface HtaccessConfig { export class HtaccessParser implements MCPAgent ...` |
| `legacy/consolidation-2025-04-17/agents/analysis/php-analyzer.ts` | Moyenne | `interface PhpAnalysisOptions { interface PhpAnalysisResult {     classCount?: number;   classInfo?: ...` |
| `legacy/consolidation-2025-04-17/agents/canonical-validator.ts` | Moyenne | `interface CanonicalValidatorConfig { interface CanonicalIssue { interface ValidationResult { export ...` |
| `tools/agent-version-auditor.ts` | Moyenne | `interface AgentFile {     classDefinition?: string; interface AgentGroup { interface VersioningScore...` |
| `tools/project-indexer.ts` | Très élevée | `interface ProjectFile {   exports: string[]; interface StructureScore {     interfaceImplementation:...` |
| `tools/generate-layer-interfaces.ts` | Très élevée | ` * generate-layer-interfaces.ts  * Outil pour générer les interfaces TypeScript des trois couches ...` |
| `tools/structure-graph.ts` | Très élevée | `interface GraphNode { interface GraphEdge { interface StructureGraph { interface ProjectIndex {     ...` |
| `tools/type-mapper.ts` | Faible | `                   WHERE d.adrelid = format('%I.%I', table_schema, table_name)::regclass            ...` |
| `tools/consolidate-agents.ts` | Moyenne | `interface ConsolidationReport { interface ConsolidationPlan { interface AgentConsolidation { interfa...` |
| `tools/agent_orchestrator.ts` | Très élevée | `interface AuditConfig { class AgentOrchestrator { export { AgentOrchestrator }; ...` |
| `tools/scan-obsolete.ts` | Faible | `interface FileStatus { async function classifyFile(filePath: string): Promise<FileStatus> {   report...` |
| `tools/agent-migration-analyzer.ts` | Moyenne | `interface AgentFile {   exports: string[]; interface MigrationRecommendation {     // Extraire les e...` |
| `tmp/test-AbstractAnalyzerAgent-fixed.ts` | Très élevée | `import { AnalyzerConfig } from '../packages/mcp-agents/core/interfaces/analyzer-agent'; class TestAb...` |
| `tmp/fixed-test-AbstractAnalyzerAgent.ts` | Très élevée | `import { AnalyzerConfig } from '../packages/mcp-agents/core/interfaces/analyzer-agent'; class TestAb...` |
| `tmp/fixed-tests/test-AbstractAnalyzerAgent.ts` | Très élevée | `import { AnalyzerConfig } from '../../packages/mcp-agents/core/interfaces/analyzer-agent'; class Tes...` |
| `validate-interface-implementations.ts` | Très élevée | `const REPORT_FILE = path.join(REPORT_DIR, `interface-validation-${TIMESTAMP}.md`); // Structure des ...` |
| `cahier-des-charge/tools/project-structure-analyzer.ts` | Moyenne | `interface ProjectStructure { interface ModuleInfo {   // Collecter les classes avec décorateurs Nes...` |
| `cahier-des-charge/tools/generate-migration-patch.ts` | Faible | `interface FieldMapping { interface FileMigrationPatch { interface MigrationPatch { interface SchemaM...` |
| `cahier-des-charge/scripts/sync/sync-mapper.ts` | Faible | `interface SyncMapperConfig { interface TableMapping { interface FieldMapping { interface Relationshi...` |
| `cahier-des-charge/scripts/sync-migration-status.ts` | Faible | `interface SchemaMigrationDiff { interface AuditFile { interface BacklogFile { interface MigrationWar...` |
| `cahier-des-charge/scripts/analysis/legacy-discovery.ts` | Faible | `interface DiscoveryConfig { interface FileMetadata { class LegacyDiscovery { ...` |
| `cahier-des-charge/scripts/analysis/monorepo-analyzer.ts` | Moyenne | `interface CodeStyleProfile { interface MonorepoConfig { class MonorepoAnalyzer { ...` |
| `cahier-des-charge/src/validation/cascade-validation.service.ts` | Faible | `} from './interfaces'; export class CascadeValidationService { ...` |
| `cahier-des-charge/src/mismatch/mismatch-tracker.service.ts` | Faible | `} from './interfaces'; export class MismatchTrackerService { ...` |
| `cahier-des-charge/agents/php-sql-sync-mapper.ts` | Faible | `export async function mapPhpSqlSync( ...` |
| `cahier-des-charge/agents/htaccess-router-analyzer.ts` | Très élevée | ` * Agent export file // Définir l'interface AgentContext directement ici export interface AgentCont...` |
| `cahier-des-charge/agents/php-discovery-engine.ts` | Moyenne | `export interface FileAnalysisResult { export function analyzePhpFile(content: string, filePath: stri...` |
| `cahier-des-charge/agents/coordinator-agent.ts` | Faible | ` * Agent export file export { CoordinatorAgent }; export default CoordinatorAgent; ...` |
| `cahier-des-charge/agents/mysql-analyzer+optimizer.ts` | Moyenne | ` * Agent export file export { mysql }; export default mysql; ...` |
| `reports/fixed-agents-20250420-002520/agents-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/abstract-analyzer-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer/abstrac...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/htaccess-router/htaccess-router-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { inte...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/abstract-analyzer/abstract-analyzer-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/base/base-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/monitoring-check/monitoring-check.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-business/agent-business.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/status-writer/status-writer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-structure/agent-structure.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/table-cartographer/table-cartographer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/nginx-config-parser/nginx-config-parser.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/helpers/helpers.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/devops-preview/devops-preview.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/businessagent/businessagent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/mysql-to-postgresql/mysql-to-postgresql.ts` | Faible | `interface TypeMapping { interface TableDefinition { interface ColumnDefinition { interface ForeignKe...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/php-router-audit/php-router-audit.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-communication/agent-communication.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/pipeline-strategy-auditor/pipeline-strategy-auditor.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/adapt-agents/adapt-agents.ts` | Très élevée | ` * Ce script analyse les agents et les adapte pour qu'ils respectent l'interface McpAgent interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/nginx-config/nginx-config-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-controller/agent-controller.ts` | Moyenne | `export default router; ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/parser/parser.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/debt/debt-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/type-auditor/type-auditor.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/prisma/prisma-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/pr-creator/pr-creator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/schema/schema-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/schema/schema.ts` | Moyenne | ` * Définit les interfaces et types pour représenter un schéma MySQL export interface MySQLSchema ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/mysql/mysql-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/monorepo/monorepo-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/types/types.ts` | Moyenne | `export interface AgentContext { export interface AgentResult { export interface McpAgent { ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/analyzer/analyzer-agent.ts` | Très élevée | `export interface AnalyzerConfig { export interface AnalyzerFinding { export interface AnalysisStats ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/seo-mcp-controller/seo-mcp-controller.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/dependencyagent/dependencyagent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/dev-integrator/dev-integrator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/coordinator/coordinator-agent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/htaccess-route/htaccess-route-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/prisma-to-zod/prisma-to-zod.ts` | Très élevée | `import { BaseAgent } from './core/interfaces/base-agent'; import { BusinessAgent } from './core/inte...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/abstract-processor/abstract-processor-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/sql-prisma-migration-planner/sql-prisma-migration-planner.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/file-manager/file-manager.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/mcp-verifier/mcp-verifier.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/abstract/abstract-analyzer.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/abstract/abstract-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/abstract-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract/abstract-analyze...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/mysql-to-pg/mysql-to-pg.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-registry/agent-registry.ts` | Très élevée | `import { McpAgent, AgentMetadata, AgentType } from './interfaces'; class AgentRegistry implements Ba...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/layered-agent-auditor/layered-agent-auditor.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/sql-debt-audit/sql-debt-audit.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent8-optimizer/agent8-optimizer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/dev-linter/dev-linter.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/type-mapper/type-mapper.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/test-writer/test-writer.ts` | Faible | `interface TestWriterContext { interface TestCoverageMap { export const testWriterAgent = { ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/mcp/mcp-agent.ts` | Moyenne | `export interface AgentContext { export interface FileContent { export interface AgentResult { export...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/interfaces/interfaces.ts` | Très élevée | ` * Cette interface définit le contrat que tous les agents doivent respecter export type AgentType =...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/remediator/remediator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/auto-pr/auto-pr-agent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-version-auditor/agent-version-auditor.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/ci-tester/ci-tester.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-abstract-migration.test/agent-abstract-migration.test.ts` | Élevée | ` * Tests unitaires pour vérifier la migration des agents vers les classes abstraites  * les classes...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/discovery/discovery-agent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/baseagent/baseagent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/dataagent/dataagent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/debt-detector/debt-detector.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-agent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-v3.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/php-analyzer/php-analyzer-v4.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/mysql-analyzer+optimizer/mysql-analyzer+optimizer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/prisma-to-dto/prisma-to-dto.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/qa-confirmer/qa-confirmer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/sql-analysis-runner/sql-analysis-runner.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/data-verifier/data-verifier.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/seo-ci-tester/seo-ci-tester.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/php/php-analyzer.ts` | Élevée | `interface AbstractAnalyzerAgent<T, R> { interface AnalyzerConfig { interface AgentContext { interfac...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/image-optimizer/image-optimizer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/sql-analyzer+prisma-builder/sql-analyzer+prisma-builder.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-quality/agent-quality.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/register-agents/register-agents.ts` | Faible | `export async function registerAllAgents(): Promise<void> {       // Trouver l'agent par son ID dans ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/metrics-collector/metrics-collector.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/seo-redirect-mapper/seo-redirect-mapper.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/consolidator/consolidator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/diff-verifier/diff-verifier.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/logger/logger.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/validate-agents/validate-agents.ts` | Très élevée | ` * Ce script vérifie que tous les agents respectent l'interface McpAgent import { McpAgent, AgentMe...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/semantic-table-mapper/semantic-table-mapper.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-audit/agent-audit.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/php-analyzer.worker/php-analyzer.worker.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/qualityagent/qualityagent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/qa.schema/qa.schema.ts` | Faible | `export const FileFieldsDetailsSchema = z.object({ export const FileAnalysisResultSchema = z.object({...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/mcp-verifier.worker/mcp-verifier.worker.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/relational-normalizer/relational-normalizer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/progressive-migration/progressive-migration-agent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/type-converter/type-converter.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/migration-strategist/migration-strategist.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/system-integration-bridge/system-integration-bridge.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/db-connector/db-connector.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/seo-audit-runner/seo-audit-runner.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/type-audit/type-audit-agent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/structureagent/structureagent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/analyze-security-risks/analyze-security-risks.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/base-analyzer-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base-analyzer/base-analyz...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/base-analyzer/base-analyzer-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/relation/relation-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/mcp-manifest-manager/mcp-manifest-manager.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/htaccess-parser/htaccess-parser.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analyzers/agent-donnees/agent-donnees.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/prisma-to-zod.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/prisma-to-zod/prisma-to-z...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/monitors/monitoring-check/monitoring-check.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/monitoring-check/monitori...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/status-writer/status-writer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/status-writer/status-writ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/coordinator-agent/coordinator-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/coordinator/coordinator-a...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/php-analyzer-agent/php-analyzer-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/caddyfile-generator/caddyfile-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddyfile/caddyfile-gene...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/agent8-optimizer/agent8-optimizer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent8-optimizer/agent8-o...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/sql-analysis-runner/sql-analysis-runner.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/sql-analysis-runner/sql-a...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/agent-audit/agent-audit.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-audit/agent-audit.t...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/php-analyzer.worker/php-analyzer.worker.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer.worker/php-a...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/misc/mcp-verifier.worker/mcp-verifier.worker.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mcp-verifier.worker/mcp-v...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/orchestrators/orchestrator/orchestrator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestrator/orchestr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/orchestrators/migration-orchestrator/migration-orchestrator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/migration/migration-o...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/orchestrators/bullmq-orchestrator/bullmq-orchestrator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bullmq/bullmq-orchest...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestrator-bridge/o...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestration/orchestrators/agent-orchestrator/agent-orchestrator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/agent/agent-orchestra...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validate-agents.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/validate-agents/validate-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/utils/agent-communication.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-communication/agent...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/utils/file-manager.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/file-manager/file-manager...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/utils/logger.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/logger/logger.ts'; export...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/abstract-validator/abstract-validator-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/dev-checker/dev-checker/dev-checker.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/dev-checker/dev-checker....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/dev-checker/dev-checker.ts` | Faible | `export const devCheckerAgent = { // Nouvelles interfaces pour le support d'auto-correction interface...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/seo-checker-canonical/seo-checker-canonical.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/postgresql/postgresql-validator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/typescript-structure/typescript-structure-validator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/typescript-structure-validator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/typescript-structure/typ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/validator/validator-agent.ts` | Très élevée | `export interface ValidatorConfig { export interface ValidationRule { export interface ValidationViol...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/abstract/abstract-validator.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/migration/migration-validator.ts` | Élevée | `interface MappingDefinition { interface MySQLTable { interface MySQLColumn { interface MySQLForeignK...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/canonical/canonical-validator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/seo-checker-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker/seo-checker-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/base-validator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/base-validator/base-vali...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/canonical-validator/canonical-validator/canonical-validator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/canonical/canonical-vali...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/canonical-validator/canonical-validator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/canonical/canonical-vali...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/seo-checker/seo-checker.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/seo-checker/seo-checker-agent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/seo-checker/seo-checker-agent/seo-checker-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker/seo-checker-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/abstract-validator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract/abstract-valida...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/abstract-validator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract-validator/abstr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/validators/base-validator/base-validator-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/remix-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/remix/remix-generator.ts...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/test-writer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/test-writer/test-writer.t...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/tests/agent-abstract-migration.test.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-abstract-migration....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/prisma-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/prisma/prisma-analyzer.ts...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/adapt-agents.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/adapt-agents/adapt-agents...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/abstract-analyzer-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer/abstrac...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/metrics/metrics-collector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/metrics-collector/metrics...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/remix-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/remix/remix-generator.ts...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/abstract-generator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract-generator/abstr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/interfaces/generator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/generator/generator-agen...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/interfaces/analyzer-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/analyzer/analyzer-agent.t...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/interfaces/orchestrator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestrator/orchestr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/interfaces/base-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base/base-agent.ts'; expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/interfaces/validator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/validator/validator-agen...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/abstract-processor-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-processor/abstra...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/logging/logger.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/logger/logger.ts'; export...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/agent-registry.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-registry/agent-regi...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/mcp-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mcp/mcp-agent.ts'; export...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/base-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base/base-agent.ts'; expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/nestjs-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/nestjs/nestjs-generator....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/abstract-validator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/abstract-validator/abstr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/types.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/types/types.ts'; export {...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/abstract-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract/abstract-agent.t...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/seo/seo-checker.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker/seo-checker....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/abstract-orchestrator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/abstract-orchestrator...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/core/interfaces.ts` | Faible | ` * /workspaces/cahier-des-charge/packages/mcp-agents/analyzers/interfaces/interfaces.ts export * fro...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/examples/fiche/fiche.meta.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/fiche.meta/fiche.meta.ts'...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/register-agents.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/register-agents/register-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/shared/db-connector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/db-connector/db-connector...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/shared/base-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base/base-agent.ts'; expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/shared/types.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/types/types.ts'; export {...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/php-analyzer-v3/php-analyzer-v3.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/php-analyzer-v4/php-analyzer-v4.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-analyzer/php-analyzer...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/nginx-config-analyzer/nginx-config-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/nginx-config/nginx-config...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/htaccess-route-analyzer/htaccess-route-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/htaccess-route/htaccess-r...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/php-analyzer/php-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php/php-analyzer.ts'; exp...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/debt-analyzer/debt-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/debt/debt-analyzer.ts'; e...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/mysql-analyzer+optimizer/mysql-analyzer+optimizer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mysql-analyzer+optimizer/...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/htaccess-router-analyzer/htaccess-router-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/htaccess-router/htaccess-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/sql-analyzer+prisma-builder/sql-analyzer+prisma-builder.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/sql-analyzer+prisma-build...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/mysql-analyzer/mysql-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mysql/mysql-analyzer.ts';...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/schema-analyzer/schema-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/schema/schema-analyzer.ts...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/relation-analyzer/relation-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/relation/relation-analyze...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/analyzers/analyze-security-risks/analyze-security-risks.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/analyze-security-risks/an...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/parsers/nginx-config-parser/nginx-config-parser.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/nginx-config-parser/nginx...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/parsers/parser/parser.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/parser/parser.ts'; export...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/parsers/htaccess-parser/htaccess-parser.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/htaccess-parser/htaccess-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/validators/postgresql-validator/postgresql-validator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/postgresql/postgresql-va...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/validators/dev-checker/dev-checker.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/dev-checker/dev-checker....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/validators/seo-checker-canonical/seo-checker-canonical.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker-canonical/se...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/validators/canonical-validator/canonical-validator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/canonical/canonical-vali...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/validators/seo-checker-agent/seo-checker-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker/seo-checker-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/type-audit-agent/type-audit-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/type-audit/type-audit-age...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/agent-business/agent-business.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-business/agent-busi...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/agent-structure/agent-structure.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-structure/agent-str...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/table-cartographer/table-cartographer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/table-cartographer/table-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/helpers/helpers.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/helpers/helpers.ts'; expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/devops-preview/devops-preview.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/devops-preview/devops-pre...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/mysql-to-postgresql/mysql-to-postgresql.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mysql-to-postgresql/mysql...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/php-router-audit/php-router-audit.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php-router-audit/php-rout...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/pipeline-strategy-auditor/pipeline-strategy-auditor.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/pipeline-strategy-auditor...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/case_conflicts_backup_20250419_183942/qualityagent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qualityagent/qualityagent...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/type-auditor/type-auditor.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/type-auditor/type-auditor...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/BusinessAgent/businessagent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/businessagent/businessage...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/pr-creator/pr-creator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/pr-creator/pr-creator.ts'...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/seo-mcp-controller/seo-mcp-controller.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-mcp-controller/seo-mc...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/dependencyagent/dependencyagent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dependencyagent/dependenc...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/dev-integrator/dev-integrator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dev-integrator/dev-integr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/sql-prisma-migration-planner/sql-prisma-migration-planner.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/sql-prisma-migration-plan...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/QualityAgent/qualityagent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qualityagent/qualityagent...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/mcp-verifier/mcp-verifier.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mcp-verifier/mcp-verifier...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/progressive-migration-agent/progressive-migration-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/progressive-migration/pro...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/mysql-to-pg/mysql-to-pg.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mysql-to-pg/mysql-to-pg.t...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/sql-debt-audit/sql-debt-audit.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/sql-debt-audit/sql-debt-a...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/dev-linter/dev-linter.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dev-linter/dev-linter.ts'...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/type-mapper/type-mapper.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/type-mapper/type-mapper.t...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/remediator/remediator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/remediator/remediator.ts'...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/auto-pr-agent/auto-pr-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/auto-pr/auto-pr-agent.ts'...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/agent-version-auditor/agent-version-auditor.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-version-auditor/age...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/ci-tester/ci-tester.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/ci-tester/ci-tester.ts'; ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/baseagent/baseagent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/baseagent/baseagent.ts'; ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/dataagent/dataagent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/dataagent/dataagent.ts'; ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/debt-detector/debt-detector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/debt-detector/debt-detect...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/qa-confirmer/qa-confirmer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qa-confirmer/qa-confirmer...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/data-verifier/data-verifier.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/data-verifier/data-verifi...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/seo-content-enhancer/seo-content-enhancer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/seo-content-enhancer/seo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/agent-quality/agent-quality.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-quality/agent-quali...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/discovery-agent/discovery-agent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/discovery/discovery-agent...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/seo-redirect-mapper/seo-redirect-mapper.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-redirect-mapper/seo-r...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/consolidator/consolidator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/consolidator/consolidator...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/diff-verifier/diff-verifier.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/diff-verifier/diff-verifi...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/semantic-table-mapper/semantic-table-mapper.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/semantic-table-mapper/sem...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/relational-normalizer/relational-normalizer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/relational-normalizer/rel...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/type-converter/type-converter.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/type-converter/type-conve...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/migration-strategist/migration-strategist.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/migration-strategist/migr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/seo-audit-runner/seo-audit-runner.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-audit-runner/seo-audi...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/case_conflicts_backup_20250419_183941/businessagent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/businessagent/businessage...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/structureagent/structureagent.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/structureagent/structurea...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/mcp-manifest-manager/mcp-manifest-manager.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mcp-manifest-manager/mcp-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/misc/agent-donnees/agent-donnees.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-donnees/agent-donne...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/seo-meta.generator/seo-meta.generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/seo-meta.generator/seo-m...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/prisma-generator/prisma-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/prisma/prisma-generator....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/generate_prisma_model/generate_prisma_model.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/generate_prisma_model/ge...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/caddy-generator/caddy-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddy/caddy-generator.ts...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/remix-route-generator/remix-route-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/remix-route/remix-route-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/prisma-migration-generator/prisma-migration-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/prisma-migration/prisma-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/prisma-smart-generator/prisma-smart-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/prisma-smart/prisma-smar...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/generate-migration-plan/generate-migration-plan.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/generate-migration-plan/...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/meta-generator/meta-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/meta/meta-generator.ts';...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/component-generator/component-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/component/component-gene...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/business/generators/dev-generator/dev-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/dev/dev-generator.ts'; e...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/processors/image-optimizer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/image-optimizer/image-opt...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/php-analyzer.ts` | Élevée | `interface AbstractAnalyzerAgent<T, R> { interface AnalyzerConfig { interface AgentContext { interfac...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/mysql-to-postgresql.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mysql-to-postgresql/mysql...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/api/agent-controller.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/agent-controller/agent-co...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/api/server.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/server/server.ts'; ex...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/tools/layered-agent-auditor/layered-agent-auditor.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/layered-agent-auditor/lay...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/seo-checker/seo-checker.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/seo-checker/seo-checker....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/seo-checker/seo-ci-tester.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-ci-tester/seo-ci-test...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/seo-checker/seo-metadata-schema.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/seo-metadata-schema/seo-m...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/nestjs-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/nestjs/nestjs-generator....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/abstract-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract/abstract-genera...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/seo-meta.generator/seo-meta.generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/content-generator/seo-content-enhancer/seo-content-enhancer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/seo-content-enhancer/seo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/content-generator/seo-content-enhancer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/seo-content-enhancer/seo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/generate_prisma_model/generate_prisma_model.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/remix-route/remix-route-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/prisma-migration/prisma-migration-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/react-component/react-component-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/remix-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/remix/remix-generator.ts...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/nestjs/nestjs-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/abstract-generator/abstract-generator-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/meta/meta-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/prisma/prisma-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/react-component-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/react-component/react-co...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/abstract-generator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/abstract-generator/abstr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/migration-report/migration-report-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/generator/generator-agent.ts` | Très élevée | `export interface GeneratorWarning { export interface GenerationStats { export interface GenerationRe...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/abstract/abstract-generator.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/caddyfile-generator/caddyfile-generator/caddyfile-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddyfile/caddyfile-gene...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/caddyfile-generator/caddyfile-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/caddyfile/caddyfile-gene...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/caddy/caddy-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/base-generator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/base-generator/base-gene...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/component/component-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/dev/dev-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/seo-content-enhancer/seo-content-enhancer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/remix/remix-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/base-generator/base-generator-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/nestjs-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/nestjs/nestjs-generator....` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/prisma-smart/prisma-smart-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/generate-migration-plan/generate-migration-plan.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/generators/caddyfile/caddyfile-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/monorepo-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/monorepo/monorepo-analyze...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/qa-analyzer/qa.schema.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/qa.schema/qa.schema.ts'; ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/mcp-verifier.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/mcp-verifier/mcp-verifier...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/analysis/php-analyzer.ts` | Moyenne | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/php/php-analyzer.ts'; exp...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/coordination/bridges/system-integration-bridge/system-integration-bridge.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/system-integration-bridge...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/migration-validator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/validators/migration/migration-vali...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/base-orchestrator/base-orchestrator-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/three-layer/adapter-layer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/adapter-layer/adapter...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/three-layer/adapters/temporal-adapter.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-adapter/temp...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/three-layer/implementations/temporal-orchestration.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-orchestratio...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/three-layer/coordination-layer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/coordination-layer/co...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/three-layer/three-layer-architecture.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/three-layer-architect...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/three-layer/abstraction-layer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/abstraction-layer/abs...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/three-layer/business-layer.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/business-layer/busine...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/orchestrator/orchestrator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/orchestrator/orchestrator-agent.ts` | Très élevée | `export enum JobStatus { export interface OrchestratorConfig extends BaseAgentConfig { export interfa...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/n8n-connector/n8n-connector.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/temporal/temporal-retry-adapter.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-retry-adapte...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/temporal-adapter/temporal-adapter.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/temporal-retry-adapter/temporal-retry-adapter.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/prometheus-exporter/prometheus-exporter.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/adapters/temporal-recovery-adapter.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-recovery-ada...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/adapters/temporal-adapter.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-adapter/temp...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/adapters/enhanced-temporal-adapter.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/enhanced-temporal-ada...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/implementations/temporal-adapter.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-adapter/temp...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/system-monitor/system-monitor.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/TemporalConnector/TemporalConnector.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/recovery/workflow-recovery.service.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/workflow-recovery.ser...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bridges/temporal-connector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/temporal-connector/te...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bridges/OrchestrationConnector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/OrchestrationConnecto...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestrator-bridge/o...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bridges/bullmq-connector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/bullmq-connector/bull...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bridges/n8n-connector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/n8n-connector/n8n-con...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestrator-bridge/o...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bridges/TemporalConnector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/TemporalConnector/Tem...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bullmq-connector/bullmq-connector.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/monitoring/prometheus-exporter.ts` | Faible | ` * /workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/prometheus-exporter/prometheus-ex...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/monitoring/alert-notifier.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/alert-notifier/alert-...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/bullmq/bullmq-orchestrator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/database-service/database-service.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/abstract/abstract-orchestrator.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/interfaces/orchestration-connector.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/orchestration-connect...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/orchestration-connector/orchestration-connector.ts` | Faible | ` * Cette interface définit le contrat que tous les connecteurs d'orchestration export interface Orc...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/temporal-connector/temporal-connector.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/migration/migration-orchestrator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/abstract-orchestrator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/abstract/abstract-orc...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/priority-scheduler/priority-scheduler.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/migration-coordinator/migration-coordinator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/scheduler/priority-scheduler.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/priority-scheduler/pr...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/scheduler/system-monitor.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/system-monitor/system...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/enhanced-temporal-adapter/enhanced-temporal-adapter.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/abstract-orchestrator/abstract-orchestrator-agent.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/reporting/migration-report-generator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/generators/migration-report/migrati...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/base-orchestrator-agent.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/base-orchestrator/bas...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/server/server.ts` | Moyenne | ` * Serveur API pour l'interface de pilotage des agents       <div class="card">       <div class="ca...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/business-layer/business-layer.ts` | Moyenne | `export interface IBusinessService<T = any, R = any> { export interface BusinessServiceOptions { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/temporal-orchestration/temporal-orchestration.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/resilience/migration-coordinator.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/migration-coordinator...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/resilience/advanced-retry-strategy.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/advanced-retry-strate...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/checkpoint-manager/checkpoint-manager.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/persistence/checkpoint-manager.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/checkpoint-manager/ch...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/persistence/workflow-recovery-service.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/workflow-recovery-ser...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/persistence/database-service.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/orchestrators/database-service/data...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/persistence/types.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/types/types.ts'; export {...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/advanced-retry-strategy/advanced-retry-strategy.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/three-layer-architecture/three-layer-architecture.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/alert-notifier/alert-notifier.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/orchestrators/agent/agent-orchestrator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/migration-finalization-20250420-012655/backup/packages/mcp-agents/prisma-to-dto.ts` | Faible | `export * from '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/prisma-to-dto/prisma-to-d...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/agent-version-auditor.ts` | Moyenne | `interface AgentInfo { interface AgentGroup { interface AuditResult { export { ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/agent-audit.ts` | Moyenne | `export async function executeAudit(filePath: string): Promise<string> { // Rendre la fonction genera...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/devops-preview.ts` | Très élevée | `interface PreviewConfig { interface MigrationInfo { interface LighthouseResults { class PreviewAgent...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/php-analyzer-agent.ts` | Élevée | `export { startRedisPhpAnalyzerAgent }; ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/remix-route-generator.ts` | Très élevée | `import { GeneratorAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; interfa...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/auto-pr-agent.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; export interface AutoPRCon...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/metrics-service.ts` | Très élevée | `import { CoordinationAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/coordination'; ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/sql-analysis-runner.ts` | Très élevée | `interface MigrationConfig { class CLI implements BaseAgent, BusinessAgent { import { BaseAgent } fro...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/prisma-smart-generator.ts` | Élevée | ` * à partir des sorties des agents précédents, tout en anticipant les erreurs classiques de migra...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/schema-analyzer.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/dev-generator.ts` | Très élevée | `import { GeneratorAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; interfa...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/classifier.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';  * class...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/seo-audit-runner.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface AuditOptions { i...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/caddy-generator.ts` | Très élevée | `import { GeneratorAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/seo-mcp-controller.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface SEOMCPController...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | Très élevée | `import { BaseAgent, OrchestrationAgent } from '../core/interfaces/base-agent'; interface DependencyM...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/ci-tester.ts` | Faible | `interface CITest { interface PackageScripts { interface CIReport { export const ciTesterAgent = { ex...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/agent-donnees.ts` | Très élevée | `interface DataSource { interface DataOutput { interface SqlQuery { interface DataAnalysisResult { cl...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/type-mapper.ts` | Très élevée | `interface Table { interface Column { interface ForeignKey { interface TypeMapping { interface TypeAn...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/schema.ts` | Moyenne | ` * Définit les interfaces et types pour représenter un schéma MySQL export interface MySQLSchema ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/htaccess-router-analyzer.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; import { AnalyzerAgent } f...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/dev-integrator.ts` | Faible | `interface IntegratorContext { interface IntegrationResult { interface IntegratorIndex { export const...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/agent-orchestrator.ts` | Très élevée | `import { BaseAgent, OrchestrationAgent } from '../core/interfaces/base-agent'; import { Orchestrator...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/relation-analyzer.ts` | Très élevée | `interface Table { interface Column { interface ForeignKey { interface Relation { interface PrismaRel...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/table-classifier.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';  * table...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/agent8-optimizer.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; export class Agent8SqlOpti...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/notification-service.ts` | Très élevée | `import { CoordinationAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/coordination'; ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | Très élevée | `import { BaseAgent, OrchestrationAgent } from '../core/interfaces/base-agent';  * Cette classe gère...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator.ts` | Élevée | `interface OrchestratorContext { interface AgentResult { interface OrchestratorReport { interface Age...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/analyze-security-risks.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface DynamicBehavior ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/htaccess-route-analyzer.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface RouteMapping { e...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/php-router-audit.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface PhpRouteAuditRes...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/data-verifier.ts` | Faible | `interface Config { interface TableVerificationResult { interface MismatchDetail { interface Verifica...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/nginx-config-parser.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; import { AnalyzerAgent } f...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/type-audit-agent.ts` | Élevée | `interface MySQLSchema {   classificationStats?: Record<string, number>; interface TableInfo {   clas...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/generate-migration-plan.ts` | Très élevée | `interface DependencyInfo { interface SecurityScore { interface AuditData { interface MigrationTask {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/debt-analyzer.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/table-cartographer.ts` | Très élevée | `interface Table { interface Column { interface ForeignKey { interface TableClassification { interfac...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/generate_prisma_model.ts` | Très élevée | `interface TypeMapping { interface Table { interface Column { interface Relation { interface EnumSugg...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/semantic-table-mapper.ts` | Très élevée | `// Cet agent analyse et classifie les tables d'une base de données selon leur rôle fonctionnel imp...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/meta-generator.ts` | Très élevée | `interface MetaGeneratorConfig { interface MetaResult { interface ProcessingResult { export class Met...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/pipeline-strategy-auditor.ts` | Très élevée | `interface PipelineAudit { interface StrategyAudit { class PipelineStrategyAuditor implements BaseAge...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/agent-structure.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; import { AnalyzerAgent } f...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/php-analyzer.ts` | Élevée | `interface PHPAnalysisResult {   className?: string; interface MethodInfo { interface ParameterInfo {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/seo-meta.generator.ts` | Très élevée | `interface SeoMetadata { interface SeoAnalysisOptions { export class SeoMetadataGenerator implements ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/type-converter.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/mysql-to-postgresql.ts` | Moyenne | `interface MigrationRule { interface MigrationConfig { interface MigrationStats { // Ces règles sont...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/htaccess-parser.ts` | Très élevée | `import { AnalyzerAgent , ParserAgent} from '@workspaces/cahier-des-charge/src/core/interfaces/busine...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/sql-prisma-migration-planner.ts` | Très élevée | `interface SchemaRaw { interface TableInfo { interface ViewInfo { interface ColumnInfo { interface In...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/mcp-verifier.worker.ts` | Faible | `export { startMcpVerifierWorker }; ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/consolidator.ts` | Faible | `interface ConsolidatorContext {   exportHtml?: boolean;            // Générer également des versi...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/seo-checker-agent.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface SEOCheckerConfig...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/prisma-generator.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/discovery-agent.ts` | Élevée | `interface DiscoveryItem { interface KeywordDefinition {   { pattern: /class\s+\w+/g, score: 0.8, typ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/mysql-analyzer.ts` | Élevée | `import { TableClassifier } from './core/classifier'; // Configuration de l'interface en ligne de com...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/audit-selector.ts` | Faible | `interface DiscoveryItem { interface SelectedFile { export { ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/migration-strategist.ts` | Moyenne | `interface MigrationPlan { interface SchemaMap {   classificationStats?: Record<string, number>; inte...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/type-auditor.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/canonical-sync-agent.ts` | Très élevée | `import { BusinessAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | Très élevée | `import { CoordinationAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/coordination'; ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/prisma-migration-generator.ts` | Moyenne | `...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/notifier.ts` | Très élevée | `import { BaseAgent, OrchestrationAgent } from '../core/interfaces/base-agent'; export interface Noti...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/agent-quality.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface AuditSection { e...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/agent-business.ts` | Très élevée | `import { BaseAgent } from '../core/interfaces/base-agent'; interface AuditSection { export class Bus...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/sql-analyzer+prisma-builder.ts` | Moyenne | `...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/postgresql-validator.ts` | Très élevée | `class ValidationIssue implements BaseAgent, BusinessAgent, ValidatorAgent { interface PrismaModel { ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/pr-creator.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface PullRequestConfi...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/parser.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/status-writer.ts` | Très élevée | `import { BaseAgent, OrchestrationAgent } from '../core/interfaces/base-agent'; interface StatusData ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/mcp-manifest-manager.ts` | Très élevée | ` * Cette classe fournit des méthodes pour lire, manipuler et écrire dans le fichier import { BaseA...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/diff-verifier.ts` | Moyenne | `interface DiffVerifierContext { interface VerificationResult { interface VerifierIndex { export cons...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/seo-redirect-mapper.ts` | Très élevée | `interface Redirection { interface RedirectMapperConfig extends AgentConfig { export class SEORedirec...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/seo-checker-canonical.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface SeoCheckResult {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/mcp-verifier.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; export interface VerifierC...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/component-generator.ts` | Très élevée | `import { GeneratorAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/qa-confirmer.ts` | Faible | `interface QaConfirmerContext { interface QaChecklistItem { interface QaValidationResult { interface ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/seo-content-enhancer.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface EnhancerTarget {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/progressive-migration-agent.ts` | Très élevée | `import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/base-agent'; import { B...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/remediator.ts` | Moyenne | `interface RemediatorOptions { interface RemediationResult { interface RemediationSummary { export co...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/dev-linter.ts` | Moyenne | `interface LintResult { interface TypeCheckResult { interface TailwindCheckResult { interface BiomeCh...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/caddyfile-generator.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; export interface ServerCon...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/monitoring-check.ts` | Très élevée | `interface MonitoringConfig { interface RouteStatus { interface PerformanceComparison { interface Dom...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/dev-checker.ts` | Faible | `export const devCheckerAgent = { // Nouvelles interfaces pour le support d'auto-correction interface...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/debt-detector.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/mysql-to-pg.ts` | Faible | `interface ColumnInfo { interface TableInfo { interface TypeMapping { interface SchemaMap { ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/coordinator-agent.ts` | Très élevée | `import { OrchestrationAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/orchestration'...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/relational-normalizer.ts` | Très élevée | `import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business'; import {...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/sql-debt-audit.ts` | Faible | `interface SQLDebtIssue { interface SQLDebtSummary { interface SQLDebtReport { export { ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/php-analyzer.worker.ts` | Élevée | `export { startPhpAnalyzerWorker }; ...` |
| `reports/migration-finalization-20250420-012655/backup/docs/agents/canonical-validator.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface CanonicalValidat...` |
| `reports/ci-agents-20250419-083906/test-htaccess-router.ts` | Moyenne | `    console.log('Module importé, exports disponibles:', Object.keys(agentModule));     // Trouver l...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/nginx-config-analyzer.ts` | Moyenne | ` * Agent export file export { nginx }; export default nginx; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/agent-version-auditor.ts` | Faible | ` * Agent export file export { agent }; export default agent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/agent-audit.ts` | Faible | ` * Agent export file export { agent }; export default agent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/devops-preview.ts` | Faible | ` * Agent export file export { devops }; export default devops; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/php-analyzer-agent.ts` | Moyenne | ` * Agent export file export { php }; export default php; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/remix-route-generator.ts` | Faible | ` * Agent export file export { RemixRouteGenerator }; export default RemixRouteGenerator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/auto-pr-agent.ts` | Faible | ` * Agent export file export { AutoPRAgent }; export default AutoPRAgent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/sql-analysis-runner.ts` | Faible | ` * Agent export file export { sql }; export default sql; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/prisma-smart-generator.ts` | Faible | ` * Agent export file export { prisma }; export default prisma; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/schema-analyzer.ts` | Moyenne | ` * Agent export file export { SchemaAnalyzer }; export default SchemaAnalyzer; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/dev-generator.ts` | Faible | ` * Agent export file export { DevGenerator }; export default DevGenerator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/seo-audit-runner.ts` | Faible | ` * Agent export file export { SEOAuditRunner }; export default SEOAuditRunner; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/caddy-generator.ts` | Faible | ` * Agent export file export { CaddyGenerator }; export default CaddyGenerator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/seo-mcp-controller.ts` | Faible | ` * Agent export file export { SEOMCPController }; export default SEOMCPController; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/migration-orchestrator.ts` | Faible | ` * Agent export file export { MigrationOrchestrator }; export default MigrationOrchestrator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/ci-tester.ts` | Faible | ` * Agent export file export { ci }; export default ci; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/agent-donnees.ts` | Faible | ` * Agent export file export { agent }; export default agent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/type-mapper.ts` | Faible | ` * Agent export file export { type }; export default type; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/schema.ts` | Moyenne | ` * Définit les interfaces et types pour représenter un schéma MySQL export interface MySQLSchema ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/htaccess-router-analyzer.ts` | Très élevée | ` * Agent export file // Définir l'interface AgentContext directement ici export interface AgentCont...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/dev-integrator.ts` | Faible | ` * Agent export file export { dev }; export default dev; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/agent-orchestrator.ts` | Faible | ` * Agent export file export { AgentOrchestrator }; export default AgentOrchestrator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/relation-analyzer.ts` | Moyenne | ` * Agent export file export { relation }; export default relation; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/agent8-optimizer.ts` | Faible | ` * Agent export file export { Agent8SqlOptimizer }; export default Agent8SqlOptimizer; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/bullmq-orchestrator.ts` | Faible | ` * Agent export file export { BullMqOrchestrator }; export default BullMqOrchestrator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/orchestrator.ts` | Faible | ` * Agent export file export { orchestrator }; export default orchestrator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/analyze-security-risks.ts` | Faible | ` * Agent export file export { SecurityRiskAnalyzer }; export default SecurityRiskAnalyzer; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/htaccess-route-analyzer.ts` | Moyenne | ` * Agent export file export { HtaccessRouteAnalyzer }; export default HtaccessRouteAnalyzer; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/php-router-audit.ts` | Faible | ` * Agent export file export { PhpRouterAudit }; export default PhpRouterAudit; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/data-verifier.ts` | Faible | ` * Agent export file export { data }; export default data; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/nginx-config-parser.ts` | Faible | ` * Agent export file export { NginxConfigParser }; export default NginxConfigParser; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/type-audit-agent.ts` | Faible | ` * Agent export file export { type }; export default type; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/generate-migration-plan.ts` | Faible | ` * Agent export file export { generate }; export default generate; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/debt-analyzer.ts` | Moyenne | ` * Agent export file export { DebtAnalyzer }; export default DebtAnalyzer; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/table-cartographer.ts` | Faible | ` * Agent export file export { table }; export default table; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/generate_prisma_model.ts` | Faible | ` * Agent export file export { generate_prisma_model }; export default generate_prisma_model; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/semantic-table-mapper.ts` | Faible | ` * Agent export file export { SemanticMapper }; export default SemanticMapper; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/meta-generator.ts` | Faible | ` * Agent export file export { MetaGenerator }; export default MetaGenerator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/pipeline-strategy-auditor.ts` | Faible | ` * Agent export file export { pipeline }; export default pipeline; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/helpers.ts` | Faible | ` * Agent export file export { helpers }; export default helpers; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/agent-structure.ts` | Faible | ` * Agent export file export { StructureAgent }; export default StructureAgent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/seo-meta.generator.ts` | Faible | ` * Agent export file export { SeoMetadataGenerator }; export default SeoMetadataGenerator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/type-converter.ts` | Faible | ` * Agent export file export { TypeConverter }; export default TypeConverter; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/mysql-to-postgresql.ts` | Faible | ` * Agent export file export { mysql }; export default mysql; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/htaccess-parser.ts` | Faible | ` * Agent export file export { HtaccessParser }; export default HtaccessParser; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/sql-prisma-migration-planner.ts` | Faible | ` * Agent export file export { sql }; export default sql; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/mcp-verifier.worker.ts` | Faible | ` * Agent export file export { mcp }; export default mcp; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/consolidator.ts` | Faible | ` * Agent export file export { consolidator }; export default consolidator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/seo-checker-agent.ts` | Faible | ` * Agent export file export { SEOCheckerAgent }; export default SEOCheckerAgent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/prisma-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/discovery-agent.ts` | Faible | ` * Agent export file export { discovery }; export default discovery; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/mysql-analyzer.ts` | Moyenne | ` * Agent export file export { MySQLAnalyzer }; export default MySQLAnalyzer; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/migration-strategist.ts` | Faible | ` * Agent export file export { migration }; export default migration; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/type-auditor.ts` | Faible | ` * Agent export file export { TypeAuditor }; export default TypeAuditor; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/prisma-migration-generator.ts` | Faible | ` * Agent export file export { prisma }; export default prisma; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/php-analyzer-v3.ts` | Moyenne | ` * Agent export file export { php }; export default php; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/agent-quality.ts` | Faible | ` * Agent export file export { QualityAgent }; export default QualityAgent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/agent-business.ts` | Élevée | ` * Agent export file export { BusinessAgent }; export default BusinessAgent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/sql-analyzer+prisma-builder.ts` | Moyenne | ` * Agent export file export { sql }; export default sql; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/postgresql-validator.ts` | Faible | ` * Agent export file export { PostgresqlValidator }; export default PostgresqlValidator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/pr-creator.ts` | Faible | ` * Agent export file export { PRCreator }; export default PRCreator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/parser.ts` | Faible | ` * Agent export file export { SQLParser }; export default SQLParser; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/status-writer.ts` | Faible | ` * Agent export file export { StatusWriterAgent }; export default StatusWriterAgent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/mcp-manifest-manager.ts` | Faible | ` * Agent export file export { MCPManifestManager }; export default MCPManifestManager; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/diff-verifier.ts` | Faible | ` * Agent export file export { diff }; export default diff; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/seo-redirect-mapper.ts` | Faible | ` * Agent export file export { SEORedirectMapper }; export default SEORedirectMapper; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/seo-checker-canonical.ts` | Faible | ` * Agent export file export { SeoCheckerCanonical }; export default SeoCheckerCanonical; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/mcp-verifier.ts` | Faible | ` * Agent export file export { MCPVerifier }; export default MCPVerifier; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/component-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/qa-confirmer.ts` | Faible | ` * Agent export file export { qa }; export default qa; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/seo-content-enhancer.ts` | Faible | ` * Agent export file export { SEOContentEnhancer }; export default SEOContentEnhancer; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/progressive-migration-agent.ts` | Faible | ` * Agent export file export { ProgressiveMigrationAgent }; export default ProgressiveMigrationAgent;...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/remediator.ts` | Faible | ` * Agent export file export { remediator }; export default remediator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/dev-linter.ts` | Faible | ` * Agent export file export { dev }; export default dev; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/caddyfile-generator.ts` | Faible | ` * Agent export file export { CaddyfileGenerator }; export default CaddyfileGenerator; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/monitoring-check.ts` | Faible | ` * Agent export file export { monitoring }; export default monitoring; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/dev-checker.ts` | Faible | ` * Agent export file export { DevChecker }; export default DevChecker; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/debt-detector.ts` | Faible | ` * Agent export file export { DebtDetector }; export default DebtDetector; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/mysql-to-pg.ts` | Faible | ` * Agent export file export { mysql }; export default mysql; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/coordinator-agent.ts` | Faible | ` * Agent export file export { CoordinatorAgent }; export default CoordinatorAgent; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/mysql-analyzer+optimizer.ts` | Moyenne | ` * Agent export file export { mysql }; export default mysql; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/relational-normalizer.ts` | Faible | ` * Agent export file export { RelationalNormalizer }; export default RelationalNormalizer; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/sql-debt-audit.ts` | Faible | ` * Agent export file export { sql }; export default sql; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/php-analyzer.worker.ts` | Moyenne | ` * Agent export file export { php }; export default php; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/php-analyzer-v4.ts` | Moyenne | ` * Agent export file export { php }; export default php; ...` |
| `reports/lost-agents-recovery-20250420-015008/recovered_files/canonical-validator.ts` | Faible | ` * Agent export file export { CanonicalValidator }; export default CanonicalValidator; ...` |
| `reports/fixed-agents-20250419-142920/typescript-structure-validator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/php-analyzer-v3-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/generate-migration-plan-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/debt-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-ci-tester-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-meta.generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/schema-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/base-generator-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/coordinator-agent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/bullmq-orchestrator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/semantic-table-mapper-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/pipeline-strategy-auditor-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent-orchestrator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/base-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/sql-analyzer+prisma-builder-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/mcp-verifier.worker-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/type-mapper-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/layered-agent-auditor-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/php-analyzer.worker-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/dev-integrator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/base-validator-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/caddyfile-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/temporal-connector-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/prisma-smart-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/advanced-retry-strategy-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/DataAgent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-checker-agent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/nestjs-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/DependencyAgent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent-audit-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-validator-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/TemporalConnector-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent-version-auditor-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/dependencyagent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-generator-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/remediator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/status-writer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/progressive-migration-agent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/prisma-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/base-orchestrator-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/abstract-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/base-analyzer-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/db-connector-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-analyzer-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/system-monitor-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/StructureAgent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-content-enhancer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/helpers-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/migration-orchestrator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/monitoring-check-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/dev-linter-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-orchestrator-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/sql-prisma-migration-planner-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/monorepo-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/n8n-connector-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/nginx-config-parser-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/migration-strategist-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-mcp-controller-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/data-verifier-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-audit-runner-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/php-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/parser-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/mysql-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/dev-checker-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-checker-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/type-audit-agent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/ci-tester-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/enhanced-temporal-adapter-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/prisma-migration-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent-business-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/baseagent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/devops-preview-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-checker-canonical-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/mcp-verifier-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-orchestrator-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/bullmq-connector-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/migration-coordinator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/generate_prisma_model-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/data-analyzer-v2-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/qa-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/temporal-retry-adapter-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/dev-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/discovery-agent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/structure-analyzer-v2-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/type-converter-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/php-analyzer-v2-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/checkpoint-manager-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/migration-report-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/php-analyzer-v4-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/php-analyzer-agent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/temporal-adapter-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/businessagent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent-communication-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/component-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/caddy-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/three-layer-architecture-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/table-cartographer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/qualityagent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-processor-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/mysql-to-postgresql-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/remix-route-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/auto-pr-agent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/database-service-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/canonical-validator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/consolidator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent-quality-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-generator-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/system-integration-bridge-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/sql-analysis-runner-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/php-router-audit-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/qa-analyzer-v2-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/diff-verifier-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-analyzer-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/logger-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/meta-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent-structure-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/metrics-collector-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/dataagent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/index-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/postgresql-validator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/priority-scheduler-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/remix-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/debt-detector-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/prisma-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/nginx-config-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/sql-debt-audit-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/image-optimizer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent8-optimizer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/pr-creator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/abstract-validator-agent-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `reports/fixed-agents-20250419-142920/qa-confirmer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/alert-notifier-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/mysql-analyzer+optimizer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/prometheus-exporter-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/mcp-manifest-manager-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/agent-donnees-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/dependency-analyzer-v2-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/htaccess-route-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/temporal-orchestration-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/mysql-to-pg-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/file-manager-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/orchestrator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/structureagent-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/type-auditor-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/htaccess-parser-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/relation-analyzer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/react-component-generator-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/seo-redirect-mapper-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/prisma-to-dto-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/relational-normalizer-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/orchestrator-bridge-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/fixed-agents-20250419-142920/analyze-security-risks-fixed.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `reports/ci-agents-20250419-032523/test-htaccess-router.ts` | Faible | `...` |
| `reports/fixed-agents-20250419-144847/index-fixed.ts` | Très élevée | ` * Agent class interface AgentMetadata { interface AgentContext { interface AgentResult { interface ...` |
| `app/lib/migration/loadDebtReport.ts` | Faible | `interface DebtMetric { interface DebtData { export async function loadDebtReport(): Promise<Record<s...` |
| `app/lib/migration/sync_migration_status.ts` | Faible | `export default syncMigrationStatus; ...` |
| `app/lib/migration/loadSchemaMap.ts` | Faible | `interface Column { interface Table { interface SchemaMap { export async function loadSchemaMap(): Pr...` |
| `app/lib/migration/loadRelationGraph.ts` | Faible | `interface Relation { interface RelationGraph { export async function loadRelationGraph(): Promise<Re...` |
| `app/routes/api.legacy-routes.report.ts` | Faible | `export async function action({ request }: ActionFunctionArgs) { ...` |
| `scripts/cahier-des-charges-verifier.ts` | Faible | `interface DiscoveryMapItem { interface AuditSection { interface BacklogTask { interface BacklogFile ...` |
| `scripts/run-seo-mcp.ts` | Faible | `...` |
| `scripts/verify-cahier.ts` | Faible | `interface Config { interface VerificationResult { export default verifyCahier; ...` |
| `scripts/verify-migration.ts` | Très élevée | `interface VerificationResult {   interfaceImplementation: {     // Core interfaces     path.join(WOR...` |
| `scripts/manual-migration-templates.ts` | Très élevée | ` * d'agents en classes conformes à la nouvelle architecture abstraite.  * (export const myAgent = {...` |
| `scripts/monitoring/pipeline-activity-tracker.ts` | Faible | `interface PipelineStatus { interface AgentActivity { interface StatusFile { ...` |
| `scripts/update-cahier.ts` | Faible | `export default updateCahier; ...` |
| `scripts/migration/assembler-agent.ts` | Très élevée | `interface AuditSection { interface DiscoveryMapItem { interface SqlSchemaDiff { interface BacklogTas...` |
| `scripts/migration/remix-route-generator.ts` | Moyenne | `interface MigrationPlan { export const loader: LoaderFunction = async ({ request }) => { export cons...` |
| `scripts/migration/nestjs-module-generator.ts` | Moyenne | `interface MigrationPlan {   // Convertir en PascalCase pour les noms de classes export class ${contr...` |
| `scripts/migration/migration-orchestrator.ts` | Élevée | `  // Configuration de Commander pour l'interface en ligne de commande export { ...` |
| `scripts/migration/generate-migration-plan.ts` | Faible | ` * Usage: ts-node generate-migration-plan.ts <chemin-fichier.php> [--export-all]  *   --export-all: ...` |
| `scripts/migration/run-audit.ts` | Moyenne | `interface AuditOptions { ...` |
| `scripts/migration/enhanced-php-analyzer.ts` | Moyenne | `interface AnalysisResult {   const classCount = (fileContent.match(/class\s+\w+/g) \|\| []).length; ...` |
| `scripts/verifiers/verify-cahier.ts` | Faible | `interface Config { interface VerificationResult { export default verifyCahier; ...` |
| `scripts/migrate-agents.ts` | Très élevée | `const INTERFACES_DIR = path.join(WORKSPACE_ROOT, 'src', 'core', 'interfaces'); interface AgentAnalys...` |
| `scripts/validate-mcp-agents.ts` | Faible | `...` |
| `scripts/verify-mcp-imports.ts` | Faible | `...` |
| `scripts/generate_migration_plan.ts` | Faible | `...` |
| `scripts/implement-interfaces.ts` | Très élevée | ` * implement-interfaces.ts  * Script pour ajouter automatiquement les interfaces manquantes aux agen...` |
| `scripts/migrate-agents-to-abstracts.ts` | Élevée | ` * Script pour automatiser la migration des agents vers l'architecture à base de classes abstraites...` |
| `implement-interfaces.ts` | Très élevée | `console.log('Démarrage du script d\'implémentation des interfaces...'); interface AgentInfo {   //...` |
| `packages/mcp-core/types/business.d.ts` | Très élevée | `declare module '@workspaces/cahier-des-charge/src/core/interfaces/business' {   import { BaseAgent, ...` |
| `packages/mcp-core/types/abstract-analyzer-agent.d.ts` | Très élevée | `  import { AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';   impo...` |
| `packages/mcp-core/types/base-agent.d.ts` | Très élevée | `declare module '@workspaces/cahier-des-charge/src/core/interfaces/base-agent' {   export type AgentS...` |
| `packages/mcp-core/types/mcp-agent.d.ts` | Très élevée | `  import { BaseAgent, AgentMetadata, AgentStatus, AgentResult } from '@workspaces/cahier-des-charge/...` |
| `packages/mcp-core/supabaseClient.ts` | Faible | ` * Ce module fournit une interface commune pour interagir avec la base de données Supabase. export ...` |
| `packages/mcp-cli/src/commands/migrate.ts` | Faible | `interface BacklogItem { interface Backlog { export async function migrate(fileName: string): Promise...` |
| `packages/mcp-cli/src/commands/dryRun.ts` | Faible | `interface BacklogItem { interface Backlog { export async function dryRun(fileName: string): Promise<...` |
| `packages/shared/seo/seo-utils.ts` | Faible | `export interface SEOGeneratorOptions { export function generateSEOMetadata( export function generate...` |
| `packages/mcp-agents-ci-tester/src/bin/local-validator.ts` | Moyenne | ` * Exécute un test local en utilisant l'interface interactive export default async function runLoca...` |
| `packages/mcp-agents-ci-tester/src/bin/cli.ts` | Faible | `// Créer une interface en ligne de commande ...` |
| `packages/mcp-agents-ci-tester/src/api/server.ts` | Faible | `export default app; ...` |
| `packages/mcp-agents-ci-tester/src/types.ts` | Faible | `export interface CITesterOptions { export interface CITest { export interface PackageScripts { expor...` |
| `packages/mcp-agents-ci-tester/src/core.ts` | Faible | `export async function detectCITests( export function validateSetup( export function generateGitHubWo...` |
| `packages/mcp-orchestrator/agent-runner.ts` | Très élevée | `export type AgentType = 'php-analyzer' \| 'remix-generator' \| 'qa-analyzer' \| 'diff-verifier' \| '...` |
| `implement-interfaces-agent.ts` | Très élevée | `console.log('Démarrage du script d\'implémentation des interfaces pour les agents MCP...'); // Ens...` |
| `apps/backend/src/webhooks/webhooks.controller.ts` | Faible | `export class WebhooksController { ...` |
| `apps/mcp-server/tests/agents/component-generator.test.ts` | Faible | `    expect(result[1].content).toContain('export const loader');   test('devrait extraire correctemen...` |
| `apps/mcp-server/tests/agents/php-analyzer.test.ts` | Moyenne | `...` |
| `apps/mcp-server/dashboard/server.ts` | Faible | `...` |
| `apps/mcp-server/src/webhooks/webhooks.controller.ts` | Faible | `interface WebhookPayload { export class WebhooksController { ...` |
| `apps/mcp-server/src/bullmq/bullmq.module.ts` | Faible | `  exports: [ export class BullQueueModule {} ...` |
| `apps/mcp-server/src/bullmq/bullmq.service.ts` | Faible | `export interface McpJobOptions { export class BullQueueService { ...` |
| `apps/mcp-server/src/jobs/jobs.controller.ts` | Faible | `export class JobsController { ...` |
| `apps/mcp-server/src/controllers/agent.controller.ts` | Élevée | `interface AgentRequestDto { export class AgentController { ...` |
| `apps/mcp-server/src/agents/redis-php-analyzer.ts` | Élevée | `...` |
| `apps/mcp-server/agents/php-analyzer.ts` | Moyenne | `// Re-export de la version principale export * from '../../../packages/mcp-agents/analyzers/php/php-...` |
| `apps/mcp-server/agents/component-generator.ts` | Faible | `// Re-export de la version principale export * from '../../../packages/mcp-agents/generators/compone...` |
| `apps/frontend/app/lib/redis.server.ts` | Faible | `export type McpRedisEvent = { export type McpQueueName = 'mcp:php-analyzer' \| 'mcp:verification' \|...` |
| `apps/mcp-server-php/src/utils/phpParser.ts` | Faible | `interface PhpParserOptions { export interface ParsedPhpFile {   classes: PhpClassInfo[]; export inte...` |
| `apps/mcp-server-php/src/routes/phpAnalyzer.ts` | Moyenne | `export const phpAnalyzerRoute = router; ...` |
| `apps/mcp-server-mysql/src/services/schema-export-service.ts` | Faible | ` * Service d'exportation du schéma MySQL  * Fournit des fonctionnalités pour exporter le schéma d...` |
| `apps/admin-dashboard/app/types.ts` | Faible | `export interface MigrationStats { export interface QAScores { export type AgentStatus = 'ready' \| '...` |
| `apps/mcp-server-postgres/src/services/postgres-connection.ts` | Faible | `export class PostgresConnectionService {           JOIN pg_class i ON i.oid = ix.indexrelid         ...` |
| `apps/mcp-server-postgres/src/mcp-server.ts` | Faible | `class PostgresMCPServer {           { name: 'export_schema_map', description: 'Crée schema_map.json...` |
| `detect-agent-methods.ts` | Très élevée | ` * 1. Si la classe est abstraite  * 2. Si le module exporte une classe ou un objet interface AgentAn...` |
| `src/orchestration/orchestrators/temporal-adapter/temporal-adapter.ts` | Très élevée | `import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/base-agent'; export cla...` |
| `src/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` | Très élevée | `import { CoordinationAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/coordination'; ...` |
| `src/modules/seo/seo.service.ts` | Faible | `export class SeoService { ...` |
| `src/modules/seo/services/seo.service.ts` | Faible | `import { ISeoService } from '../interfaces/seo-service.interface'; import { ISeoRepository } from '....` |
| `src/modules/seo/strategies/meta-tags.strategy.ts` | Faible | `import { ISeoAnalysisStrategy } from '../interfaces/seo-strategy.interface'; export class MetaTagsSt...` |
| `src/modules/seo/strategies/links-analysis.strategy.ts` | Faible | `import { ISeoAnalysisStrategy } from '../interfaces/seo-strategy.interface'; export class LinksAnaly...` |
| `src/temporal/testing/workflow-tester.ts` | Moyenne | `export interface WorkflowTestConfig {  * Cette classe facilite l'écriture de tests pour les workflo...` |
| `src/common/middleware/legacyHtaccess.middleware.ts` | Faible | `interface RedirectMapping { interface RouteConfig { export class LegacyHtaccessMiddleware implements...` |
| `src/common/middleware/legacyPhpRedirect.middleware.ts` | Faible | `interface RouteMapping { export class LegacyPhpRedirectMiddleware implements NestMiddleware { ...` |
| `src/core/layered-agent-registry.ts` | Très élevée | `import { BaseAgent } from './interfaces/base-agent'; import { OrchestratorAgent, SchedulerAgent, Mon...` |
| `src/core/interfaces/orchestration/orchestrator/orchestrator-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface OrchestratorAgent ...` |
| `src/core/interfaces/orchestration/monitor/monitor-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface MonitorAgent exten...` |
| `src/core/interfaces/orchestration/scheduler/scheduler-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface SchedulerAgent ext...` |
| `src/core/interfaces/business.ts` | Très élevée | `export interface BusinessAgent extends BaseAgent { export interface AnalyzerAgent extends BusinessAg...` |
| `src/core/interfaces/business/parser/parser-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface ParserAgent extend...` |
| `src/core/interfaces/business/analyzer/analyzer-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface AnalyzerAgent exte...` |
| `src/core/interfaces/business/generator/generator-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface GeneratorAgent ext...` |
| `src/core/interfaces/business/validator/validator-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface ValidatorAgent ext...` |
| `src/core/interfaces/orchestration.ts` | Très élevée | `export interface OrchestrationAgent extends BaseAgent { export interface WorkflowManagerAgent extend...` |
| `src/core/interfaces/base-agent.ts` | Élevée | `export interface BaseAgent { export interface WorkflowDefinition { export interface WorkflowStatus {...` |
| `src/core/interfaces/coordination/bridge/bridge-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface BridgeAgent extend...` |
| `src/core/interfaces/coordination/adapter/adapter-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface AdapterAgent exten...` |
| `src/core/interfaces/coordination/mediator/mediator-agent.ts` | Très élevée | `import { BaseAgent } from '../../../core/interfaces/base-agent'; export interface MediatorAgent exte...` |
| `src/core/interfaces/coordination.ts` | Élevée | `export interface CoordinationAgent extends BaseAgent { export interface MessageBrokerAgent extends C...` |
| `src/business/analyzers/php-analyzer/php-analyzer.ts` | Moyenne | `// Re-export de la version principale export * from '../../../../packages/mcp-agents/analyzers/php/p...` |
| `src/business/parsers/htaccess-parser/htaccess-parser.ts` | Très élevée | `import { AnalyzerAgent , ParserAgent} from '@workspaces/cahier-des-charge/src/core/interfaces/busine...` |
| `src/business/validators/canonical-validator/canonical-validator.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; interface CanonicalValidat...` |
| `src/business/validators/seo-checker-agent/seo-checker-agent.ts` | Très élevée | `import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/base-agent'; import { A...` |
| `src/business/generators/nestjs-generator/nestjs-generator.ts` | Moyenne | `export class NestJSGenerator { export class ${entityName}Controller { export class ${entityName}Serv...` |
| `src/business/generators/caddyfile-generator/caddyfile-generator.ts` | Très élevée | `import { BaseAgent, BusinessAgent } from '../core/interfaces/base-agent'; export interface ServerCon...` |
| `src/business/generators/remix-generator/remix-generator.ts` | Moyenne | `export class RemixGenerator { export default function ${this.capitalize(analysisResult.fileName)}() ...` |
| `src/business/agents/base-agent/base-agent.ts` | Très élevée | `import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/base-agent'; export abs...` |
| `src/validation/cascade-validation.service.ts` | Faible | `} from './interfaces'; export class CascadeValidationService { ...` |
| `src/mismatch/mismatch-tracker.service.ts` | Faible | `} from './interfaces'; export class MismatchTrackerService { ...` |
| `mcp-routes.ts` | Élevée | `export interface MCPRequest<T = any> { export interface MCPResponse<T = any> {  * Génère une class...` |
| `agents/optimization/agent8-optimizer.ts` | Faible | ` * Agent export file export { Agent8SqlOptimizer }; export default Agent8SqlOptimizer; ...` |
| `agents/devops-preview.ts` | Faible | ` * Agent export file export { devops }; export default devops; ...` |
| `agents/php-analyzer-agent.ts` | Moyenne | ` * Agent export file export { php }; export default php; ...` |
| `agents/auto-pr-agent.ts` | Faible | ` * Agent export file export { AutoPRAgent }; export default AutoPRAgent; ...` |
| `agents/utils/caddy-generator.ts` | Faible | ` * Agent export file export { CaddyGenerator }; export default CaddyGenerator; ...` |
| `agents/utils/nginx-config-parser.ts` | Faible | ` * Agent export file export { NginxConfigParser }; export default NginxConfigParser; ...` |
| `agents/utils/htaccess-parser.ts` | Faible | ` * Agent export file export { HtaccessParser }; export default HtaccessParser; ...` |
| `agents/seo-audit-runner.ts` | Faible | ` * Agent export file export { SEOAuditRunner }; export default SEOAuditRunner; ...` |
| `agents/seo-mcp-controller.ts` | Faible | ` * Agent export file export { SEOMCPController }; export default SEOMCPController; ...` |
| `agents/migration-orchestrator.ts` | Faible | ` * Agent export file export { MigrationOrchestrator }; export default MigrationOrchestrator; ...` |
| `agents/ci-tester.ts` | Faible | ` * Agent export file export { ci }; export default ci; ...` |
| `agents/core/agent-orchestrator.ts` | Faible | ` * Agent export file export { AgentOrchestrator }; export default AgentOrchestrator; ...` |
| `agents/core/coordinator-agent.ts` | Faible | ` * Agent export file export { CoordinatorAgent }; export default CoordinatorAgent; ...` |
| `agents/integration/metrics-service.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/integration/notification-service.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/dev-integrator.ts` | Faible | ` * Agent export file export { dev }; export default dev; ...` |
| `agents/bullmq-orchestrator.ts` | Faible | ` * Agent export file export { BullMqOrchestrator }; export default BullMqOrchestrator; ...` |
| `agents/orchestrator.ts` | Faible | ` * Agent export file export { orchestrator }; export default orchestrator; ...` |
| `agents/meta-generator.ts` | Faible | ` * Agent export file export { MetaGenerator }; export default MetaGenerator; ...` |
| `agents/pipeline-strategy-auditor.ts` | Faible | ` * Agent export file export { pipeline }; export default pipeline; ...` |
| `agents/migration/nginx-config-analyzer.ts` | Moyenne | ` * Agent export file export { nginx }; export default nginx; ...` |
| `agents/migration/sql-analysis-runner.ts` | Faible | ` * Agent export file export { sql }; export default sql; ...` |
| `agents/migration/prisma-smart-generator.ts` | Faible | ` * Agent export file export { prisma }; export default prisma; ...` |
| `agents/migration/php-sql-sync-mapper.ts` | Faible | `export async function mapPhpSqlSync( ...` |
| `agents/migration/nginx-to-caddy/caddyfile-generator.ts` | Faible | ` * Agent export file export { CaddyfileGenerator }; export default CaddyfileGenerator; ...` |
| `agents/migration/php-to-remix/remix-route-generator.ts` | Faible | ` * Agent export file export { RemixRouteGenerator }; export default RemixRouteGenerator; ...` |
| `agents/migration/php-to-remix/dev-generator.ts` | Faible | ` * Agent export file export { DevGenerator }; export default DevGenerator; ...` |
| `agents/migration/php-to-remix/htaccess-route-analyzer.ts` | Moyenne | ` * Agent export file export { HtaccessRouteAnalyzer }; export default HtaccessRouteAnalyzer; ...` |
| `agents/migration/php-to-remix/php-router-audit.ts` | Faible | ` * Agent export file export { PhpRouterAudit }; export default PhpRouterAudit; ...` |
| `agents/migration/php-to-remix/seo-meta.generator.ts` | Faible | ` * Agent export file export { SeoMetadataGenerator }; export default SeoMetadataGenerator; ...` |
| `agents/migration/php-to-remix/canonical-sync-agent.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/migration/php-to-remix/seo-checker-canonical.ts` | Faible | ` * Agent export file export { SeoCheckerCanonical }; export default SeoCheckerCanonical; ...` |
| `agents/migration/htaccess-router-analyzer.ts` | Très élevée | ` * Agent export file // Définir l'interface AgentContext directement ici export interface AgentCont...` |
| `agents/migration/data-verifier.ts` | Faible | ` * Agent export file export { data }; export default data; ...` |
| `agents/migration/type-audit-agent.ts` | Faible | ` * Agent export file export { type }; export default type; ...` |
| `agents/migration/generate-migration-plan.ts` | Faible | ` * Agent export file export { generate }; export default generate; ...` |
| `agents/migration/mysql-to-postgresql.ts` | Faible | ` * Agent export file export { mysql }; export default mysql; ...` |
| `agents/migration/sql-prisma-migration-planner.ts` | Faible | ` * Agent export file export { sql }; export default sql; ...` |
| `agents/migration/consolidator.ts` | Faible | ` * Agent export file export { consolidator }; export default consolidator; ...` |
| `agents/migration/mysql-analyzer.ts` | Moyenne | ` * Agent export file export { MySQLAnalyzer }; export default MySQLAnalyzer; ...` |
| `agents/migration/mysql-analyzer/utils/helpers.ts` | Faible | ` * Agent export file export { helpers }; export default helpers; ...` |
| `agents/migration/mysql-analyzer/core/schema-analyzer.ts` | Moyenne | ` * Agent export file export { SchemaAnalyzer }; export default SchemaAnalyzer; ...` |
| `agents/migration/mysql-analyzer/core/classifier.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/migration/mysql-analyzer/core/relation-analyzer.ts` | Moyenne | ` * Agent export file export { relation }; export default relation; ...` |
| `agents/migration/mysql-analyzer/core/table-classifier.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/migration/mysql-analyzer/core/debt-analyzer.ts` | Moyenne | ` * Agent export file export { DebtAnalyzer }; export default DebtAnalyzer; ...` |
| `agents/migration/mysql-analyzer/core/type-converter.ts` | Faible | ` * Agent export file export { TypeConverter }; export default TypeConverter; ...` |
| `agents/migration/mysql-analyzer/core/prisma-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/migration/mysql-analyzer/core/parser.ts` | Faible | ` * Agent export file export { SQLParser }; export default SQLParser; ...` |
| `agents/migration/mysql-analyzer/mysql-analyzer.ts` | Moyenne | ` * Agent export file export { MySQLAnalyzer }; export default MySQLAnalyzer; ...` |
| `agents/migration/mysql-analyzer/models/schema.ts` | Moyenne | ` * Définit les interfaces et types pour représenter un schéma MySQL export interface MySQLSchema ...` |
| `agents/migration/mysql-analyzer/agents/type-converter.ts` | Faible | ` * Agent export file export { TypeConverter }; export default TypeConverter; ...` |
| `agents/migration/mysql-analyzer/agents/prisma-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/migration/mysql-analyzer/agents/migration-strategist.ts` | Faible | ` * Agent export file export { migration }; export default migration; ...` |
| `agents/migration/mysql-analyzer/agents/type-auditor.ts` | Faible | ` * Agent export file export { TypeAuditor }; export default TypeAuditor; ...` |
| `agents/migration/mysql-analyzer/agents/debt-detector.ts` | Faible | ` * Agent export file export { DebtDetector }; export default DebtDetector; ...` |
| `agents/migration/mysql-analyzer/agents/relational-normalizer.ts` | Faible | ` * Agent export file export { RelationalNormalizer }; export default RelationalNormalizer; ...` |
| `agents/migration/prisma-migration-generator.ts` | Faible | ` * Agent export file export { prisma }; export default prisma; ...` |
| `agents/migration/agent-business.ts` | Élevée | ` * Agent export file export { BusinessAgent }; export default BusinessAgent; ...` |
| `agents/migration/sql-analyzer+prisma-builder.ts` | Moyenne | ` * Agent export file export { sql }; export default sql; ...` |
| `agents/migration/postgresql-validator.ts` | Faible | ` * Agent export file export { PostgresqlValidator }; export default PostgresqlValidator; ...` |
| `agents/migration/component-generator.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/migration/qa-confirmer.ts` | Faible | ` * Agent export file export { qa }; export default qa; ...` |
| `agents/migration/progressive-migration-agent.ts` | Faible | ` * Agent export file export { ProgressiveMigrationAgent }; export default ProgressiveMigrationAgent;...` |
| `agents/migration/remediator.ts` | Faible | ` * Agent export file export { remediator }; export default remediator; ...` |
| `agents/migration/caddyfile-generator.ts` | Faible | ` * Agent export file export { CaddyfileGenerator }; export default CaddyfileGenerator; ...` |
| `agents/migration/mysql-to-pg.ts` | Faible | ` * Agent export file export { mysql }; export default mysql; ...` |
| `agents/migration/mysql-analyzer+optimizer.ts` | Moyenne | ` * Agent export file export { mysql }; export default mysql; ...` |
| `agents/discovery/discovery-agent.ts` | Faible | ` * Agent export file export { discovery }; export default discovery; ...` |
| `agents/discovery/audit-selector.ts` | Faible | `interface DiscoveryItem { interface SelectedFile { export { ...` |
| `agents/quality/analyze-security-risks.ts` | Faible | ` * Agent export file export { SecurityRiskAnalyzer }; export default SecurityRiskAnalyzer; ...` |
| `agents/quality/agent-quality.ts` | Faible | ` * Agent export file export { QualityAgent }; export default QualityAgent; ...` |
| `agents/quality/sql-debt-audit.ts` | Faible | ` * Agent export file export { sql }; export default sql; ...` |
| `agents/seo-checker-agent.ts` | Faible | ` * Agent export file export { SEOCheckerAgent }; export default SEOCheckerAgent; ...` |
| `agents/tools/agent-version-auditor.ts` | Faible | ` * Agent export file export { agent }; export default agent; ...` |
| `agents/notifier.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/pr-creator.ts` | Faible | ` * Agent export file export { PRCreator }; export default PRCreator; ...` |
| `agents/status-writer.ts` | Faible | ` * Agent export file export { StatusWriterAgent }; export default StatusWriterAgent; ...` |
| `agents/mcp-manifest-manager.ts` | Faible | ` * Agent export file export { MCPManifestManager }; export default MCPManifestManager; ...` |
| `agents/diff-verifier.ts` | Faible | ` * Agent export file export { diff }; export default diff; ...` |
| `agents/seo-redirect-mapper.ts` | Faible | ` * Agent export file export { SEORedirectMapper }; export default SEORedirectMapper; ...` |
| `agents/workers/mcp-verifier.worker.ts` | Faible | ` * Agent export file export { mcp }; export default mcp; ...` |
| `agents/workers/php-analyzer.worker.ts` | Moyenne | ` * Agent export file export { php }; export default php; ...` |
| `agents/mcp-verifier.ts` | Faible | ` * Agent export file export { MCPVerifier }; export default MCPVerifier; ...` |
| `agents/analysis/agent-audit.ts` | Faible | ` * Agent export file export { agent }; export default agent; ...` |
| `agents/analysis/agent-donnees.ts` | Faible | ` * Agent export file export { agent }; export default agent; ...` |
| `agents/analysis/type-mapper.ts` | Faible | ` * Agent export file export { type }; export default type; ...` |
| `agents/analysis/htaccess-router-analyzer.ts` | Très élevée | ` * Agent export file // Définir l'interface AgentContext directement ici export interface AgentCont...` |
| `agents/analysis/relation-analyzer.ts` | Moyenne | ` * Agent export file export { relation }; export default relation; ...` |
| `agents/analysis/config-parsers/nginx-config-parser.ts` | Faible | ` * Agent export file export { NginxConfigParser }; export default NginxConfigParser; ...` |
| `agents/analysis/table-cartographer.ts` | Faible | ` * Agent export file export { table }; export default table; ...` |
| `agents/analysis/generate_prisma_model.ts` | Faible | ` * Agent export file export { generate_prisma_model }; export default generate_prisma_model; ...` |
| `agents/analysis/semantic-table-mapper.ts` | Faible | ` * Agent export file export { SemanticMapper }; export default SemanticMapper; ...` |
| `agents/analysis/agent-structure.ts` | Faible | ` * Agent export file export { StructureAgent }; export default StructureAgent; ...` |
| `agents/analysis/php-analyzer.ts` | Très élevée | `interface AgentMetadata { interface AgentContext { interface AgentResult { interface McpAgent { expo...` |
| `agents/analysis/php-analyzer-v3.ts` | Moyenne | ` * Agent export file export { php }; export default php; ...` |
| `agents/analysis/php-discovery-engine.ts` | Moyenne | `export interface FileAnalysisResult { export function analyzePhpFile(content: string, filePath: stri...` |
| `agents/analysis/mysql-analyzer+optimizer.ts` | Moyenne | ` * Agent export file export { mysql }; export default mysql; ...` |
| `agents/analysis/php-analyzer-v4.ts` | Moyenne | ` * Agent export file export { php }; export default php; ...` |
| `agents/seo-content-enhancer.ts` | Faible | ` * Agent export file export { SEOContentEnhancer }; export default SEOContentEnhancer; ...` |
| `agents/dev-linter.ts` | Faible | ` * Agent export file export { dev }; export default dev; ...` |
| `agents/monitoring-check.ts` | Faible | ` * Agent export file export { monitoring }; export default monitoring; ...` |
| `agents/dev-checker.ts` | Faible | ` * Agent export file export { DevChecker }; export default DevChecker; ...` |
| `agents/canonical-validator.ts` | Faible | ` * Agent export file export { CanonicalValidator }; export default CanonicalValidator; ...` |

Pour plus de détails sur ces fichiers, consultez le répertoire: `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853`

## Vérification des interfaces

- Agents implémentant **BaseAgent** : 19 / 112 (16%)
- Agents implémentant **BusinessAgent** : 18 / 112 (16%)
- Agents implémentant **AnalyzerAgent** : 10 / 112 (8%)
- Agents implémentant **ValidatorAgent** : 0 / 112 (0%)
- Agents implémentant **GeneratorAgent** : 2 / 112 (1%)

**⚠️ 92 agents (82%) n'implémentent aucune interface standard:**

- `packages/mcp-agents/analyzers/SqlAnalyzer+prismaBuilderAgent/SqlAnalyzer+prismaBuilderAgent.ts`
- `packages/mcp-agents/analyzers/HtaccessRouteAnalyzerAgent/HtaccessRouteAnalyzerAgent.ts`
- `packages/mcp-agents/analyzers/MysqlAnalyzerAgent/MysqlAnalyzerAgent.ts`
- `packages/mcp-agents/analyzers/SqlAnalysisRunnerAgent/SqlAnalysisRunnerAgent.ts`
- `packages/mcp-agents/analyzers/DebtAnalyzerAgent/DebtAnalyzerAgent.ts`
- `packages/mcp-agents/analyzers/MysqlAnalyzer+optimizerAgent/MysqlAnalyzer+optimizerAgent.ts`
- `packages/mcp-agents/analyzers/AuditSelectorAgent/AuditSelectorAgent.ts`
- `packages/mcp-agents/analyzers/SchemaAnalyzerAgent/SchemaAnalyzerAgent.ts`
- `packages/mcp-agents/analyzers/PhpAnalyzerV4Agent/PhpAnalyzerV4Agent.ts`
- `packages/mcp-agents/analyzers/NginxConfigAnalyzerAgent/NginxConfigAnalyzerAgent.ts`
- `packages/mcp-agents/analyzers/PhpAnalyzer.workerAgent/PhpAnalyzer.workerAgent.ts`
- `packages/mcp-agents/analyzers/RelationAnalyzerAgent/RelationAnalyzerAgent.ts`
- `packages/mcp-agents/analyzers/PhpAnalyzerAgent/PhpAnalyzerAgent.ts`
- `packages/mcp-agents/analyzers/PhpAnalyzerV3Agent/PhpAnalyzerV3Agent.ts`
- `packages/mcp-agents/validators/CanonicalValidatorAgent/CanonicalValidatorAgent.ts`
- `packages/mcp-agents/validators/PostgresqlValidatorAgent/PostgresqlValidatorAgent.ts`
- `packages/mcp-agents/misc/DiscoveryAgent/DiscoveryAgent.ts`
- `packages/mcp-agents/misc/McpIntegratorAgent/McpIntegratorAgent.ts`
- `packages/mcp-agents/misc/TypeAuditorAgent/TypeAuditorAgent.ts`
- `packages/mcp-agents/misc/DevIntegratorAgent/DevIntegratorAgent.ts`
- `packages/mcp-agents/misc/PrCreatorAgent/PrCreatorAgent.ts`
- `packages/mcp-agents/misc/TypeAuditAgent/TypeAuditAgent.ts`
- `packages/mcp-agents/misc/Dynamic_sql_extractorAgent/Dynamic_sql_extractorAgent.ts`
- `packages/mcp-agents/misc/PhpSqlMapperAgent/PhpSqlMapperAgent.ts`
- `packages/mcp-agents/misc/MysqlToPgAgent/MysqlToPgAgent.ts`
- `packages/mcp-agents/misc/MonitoringCheckAgent/MonitoringCheckAgent.ts`
- `packages/mcp-agents/misc/PhpSqlSyncMapperAgent/PhpSqlSyncMapperAgent.ts`
- `packages/mcp-agents/misc/InjectToSupabaseAgent/InjectToSupabaseAgent.ts`
- `packages/mcp-agents/misc/AgentVersionAuditorAgent/AgentVersionAuditorAgent.ts`
- `packages/mcp-agents/misc/PipelineStrategyAuditorAgent/PipelineStrategyAuditorAgent.ts`
- `packages/mcp-agents/misc/DataVerifierAgent/DataVerifierAgent.ts`
- `packages/mcp-agents/misc/TypeConverterAgent/TypeConverterAgent.ts`
- `packages/mcp-agents/misc/SqlPrismaMigrationPlannerAgent/SqlPrismaMigrationPlannerAgent.ts`
- `packages/mcp-agents/misc/TypeMapperAgent/TypeMapperAgent.ts`
- `packages/mcp-agents/misc/DiffVerifierAgent/DiffVerifierAgent.ts`
- `packages/mcp-agents/misc/AgentDonneesAgent/AgentDonneesAgent.ts`
- `packages/mcp-agents/misc/MigrationStrategistAgent/MigrationStrategistAgent.ts`
- `packages/mcp-agents/misc/HelpersAgent/HelpersAgent.ts`
- `packages/mcp-agents/misc/SeoCheckerCanonicalAgent/SeoCheckerCanonicalAgent.ts`
- `packages/mcp-agents/misc/TableCartographerAgent/TableCartographerAgent.ts`
- `packages/mcp-agents/misc/AgentQualityAgent/AgentQualityAgent.ts`
- `packages/mcp-agents/misc/NginxConfigParserAgent/NginxConfigParserAgent.ts`
- `packages/mcp-agents/misc/RemediatorAgent/RemediatorAgent.ts`
- `packages/mcp-agents/misc/CoordinatorAgent/CoordinatorAgent.ts`
- `packages/mcp-agents/misc/ConsolidatorAgent/ConsolidatorAgent.ts`
- `packages/mcp-agents/misc/SeoMcpControllerAgent/SeoMcpControllerAgent.ts`
- `packages/mcp-agents/misc/PhpRouterAuditAgent/PhpRouterAuditAgent.ts`
- `packages/mcp-agents/misc/HtaccessParserAgent/HtaccessParserAgent.ts`
- `packages/mcp-agents/misc/SeoAuditRunnerAgent/SeoAuditRunnerAgent.ts`
- `packages/mcp-agents/misc/SeoContentEnhancerAgent/SeoContentEnhancerAgent.ts`
- `packages/mcp-agents/misc/DebtDetectorAgent/DebtDetectorAgent.ts`
- `packages/mcp-agents/misc/AgentAuditAgent/AgentAuditAgent.ts`
- `packages/mcp-agents/misc/DevLinterAgent/DevLinterAgent.ts`
- `packages/mcp-agents/misc/RelationalNormalizerAgent/RelationalNormalizerAgent.ts`
- `packages/mcp-agents/misc/CiTesterAgent/CiTesterAgent.ts`
- `packages/mcp-agents/misc/DataAgent/DataAgent.ts`
- `packages/mcp-agents/misc/DependencyAgent/DependencyAgent.ts`
- `packages/mcp-agents/misc/StatusWriterAgent/StatusWriterAgent.ts`
- `packages/mcp-agents/misc/PhpDiscoveryEngineAgent/PhpDiscoveryEngineAgent.ts`
- `packages/mcp-agents/misc/SeoCheckerAgent/SeoCheckerAgent.ts`
- `packages/mcp-agents/misc/SelectorAgent/SelectorAgent.ts`
- `packages/mcp-agents/misc/SqlDebtAuditAgent/SqlDebtAuditAgent.ts`
- `packages/mcp-agents/misc/McpVerifierAgent/McpVerifierAgent.ts`
- `packages/mcp-agents/misc/SemanticTableMapperAgent/SemanticTableMapperAgent.ts`
- `packages/mcp-agents/misc/Agent8OptimizerAgent/Agent8OptimizerAgent.ts`
- `packages/mcp-agents/misc/SeoRedirectMapperAgent/SeoRedirectMapperAgent.ts`
- `packages/mcp-agents/misc/DevCheckerAgent/DevCheckerAgent.ts`
- `packages/mcp-agents/misc/QaConfirmerAgent/QaConfirmerAgent.ts`
- `packages/mcp-agents/misc/AutoPrAgent/AutoPrAgent.ts`
- `packages/mcp-agents/misc/MysqlToPostgresqlAgent/MysqlToPostgresqlAgent.ts`
- `packages/mcp-agents/misc/McpManifestManagerAgent/McpManifestManagerAgent.ts`
- `packages/mcp-agents/misc/ParserAgent/ParserAgent.ts`
- `packages/mcp-agents/misc/AnalyzeSecurityRisksAgent/AnalyzeSecurityRisksAgent.ts`
- `packages/mcp-agents/misc/ProgressiveMigrationAgent/ProgressiveMigrationAgent.ts`
- `packages/mcp-agents/misc/AgentStructureAgent/AgentStructureAgent.ts`
- `packages/mcp-agents/misc/DevopsPreviewAgent/DevopsPreviewAgent.ts`
- `packages/mcp-agents/misc/StructureAgent/StructureAgent.ts`
- `packages/mcp-agents/generators/PrismaMigrationGeneratorAgent/PrismaMigrationGeneratorAgent.ts`
- `packages/mcp-agents/generators/SeoMeta.generatorAgent/SeoMeta.generatorAgent.ts`
- `packages/mcp-agents/generators/DevGeneratorAgent/DevGeneratorAgent.ts`
- `packages/mcp-agents/generators/PrismaSmartGeneratorAgent/PrismaSmartGeneratorAgent.ts`
- `packages/mcp-agents/generators/Generate_prisma_modelAgent/Generate_prisma_modelAgent.ts`
- `packages/mcp-agents/generators/GenerateMigrationPlanAgent/GenerateMigrationPlanAgent.ts`
- `packages/mcp-agents/generators/MetaGeneratorAgent/MetaGeneratorAgent.ts`
- `packages/mcp-agents/generators/RemixRouteGeneratorAgent/RemixRouteGeneratorAgent.ts`
- `packages/mcp-agents/generators/CaddyfileGeneratorAgent/CaddyfileGeneratorAgent.ts`
- `packages/mcp-agents/generators/CaddyGeneratorAgent/CaddyGeneratorAgent.ts`
- `packages/mcp-agents/orchestrators/AgentOrchestratorAgent/AgentOrchestratorAgent.ts`
- `packages/mcp-agents/orchestrators/McpVerifier.workerAgent/McpVerifier.workerAgent.ts`
- `packages/mcp-agents/orchestrators/OrchestratorAgent/OrchestratorAgent.ts`
- `packages/mcp-agents/orchestrators/MigrationOrchestratorAgent/MigrationOrchestratorAgent.ts`
- `packages/mcp-agents/orchestrators/BullmqOrchestratorAgent/BullmqOrchestratorAgent.ts`

## Vérification des anciens répertoires d'agents

**⚠️ Le répertoire ancien `agents` existe encore et contient 116 fichiers .ts**

## Conclusion et recommandations

⚠️ **Actions recommandées:**

1. **Examiner les 1054 fichiers potentiels d'agents** identifiés pour déterminer s'ils doivent être migrés
2. **Implémenter les interfaces standard** pour les 92 agents qui n'en ont pas
3. **Nettoyer les anciens répertoires d'agents** pour éviter toute confusion

La migration vers l'architecture à trois couches peut être considérée comme incomplète.
