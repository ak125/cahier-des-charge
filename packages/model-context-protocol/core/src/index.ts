/**
 * Model Context Protocol Core
 * Implémentation standardisée suivant le document de standardisation des technologies
 */

// Re-export des schémas
export * from './schemas/mcp-context.schema';

// Re-export des services
export * from './services/mcp.service';

// Re-export de la télémétrie
export * from './telemetry/telemetry.service';

// Fonction d'initialisation principale
import { MCPService, MCPAgentConfig } from './services/mcp.service';
import { OpenTelemetry, TelemetryConfig } from './telemetry/telemetry.service';

/**
 * Crée et initialise un service MCP standardisé
 */
export function createMCPService(
  agentConfig: MCPAgentConfig,
  telemetryConfig: TelemetryConfig
): MCPService {
  const telemetry = new OpenTelemetry(telemetryConfig);
  return new MCPService(agentConfig, telemetry);
}
