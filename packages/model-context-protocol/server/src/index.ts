/**
 * Model Context Protocol Server pour NestJS
 * Implémentation standardisée suivant le document de standardisation des technologies
 */

// Re-export du module principal
export * from './mcp.module';

// Re-export des services
export * from './services/mcp-nest.service';

// Re-export des DTOs
export * from './dto/mcp-context.dto';

// Re-export des contrôleurs
export * from './controllers/mcp.controller';

// Re-export des types depuis le package core
export {
  MCPContext,
  MCPResponse,
  MCPErrorResponse,
  ValidationError
} from '@model-context-protocol/core';
