/**
 * DTOs pour le Model Context Protocol
 * Ces classes sont utilisées pour la validation des entrées dans les contrôleurs NestJS
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsDateString, IsOptional, IsObject, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour l'outil MCP
 */
export class MCPToolDto {
    @ApiProperty({ description: 'Nom de l\'outil' })
    @IsString()
    name!: string;

    @ApiPropertyOptional({ description: 'Description de l\'outil' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Paramètres de l\'outil' })
    @IsObject()
    @IsOptional()
    parameters?: any;

    @ApiPropertyOptional({ description: 'Type de retour de l\'outil' })
    @IsObject()
    @IsOptional()
    returns?: any;
}

/**
 * DTO pour l'agent MCP
 */
export class MCPAgentDto {
    @ApiProperty({ description: 'ID de l\'agent' })
    @IsString()
    id!: string;

    @ApiProperty({ description: 'Nom de l\'agent' })
    @IsString()
    name!: string;

    @ApiPropertyOptional({ description: 'Capacités de l\'agent' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    capabilities?: string[];

    @ApiPropertyOptional({ description: 'Version de l\'agent' })
    @IsString()
    @IsOptional()
    version?: string;
}

/**
 * DTO pour la session MCP
 */
export class MCPSessionDto {
    @ApiProperty({ description: 'ID de la session' })
    @IsUUID()
    id!: string;

    @ApiPropertyOptional({ description: 'Historique de la session' })
    @IsArray()
    @IsOptional()
    history?: any[];

    @ApiPropertyOptional({ description: 'Métadonnées de la session' })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

/**
 * DTO pour l'entrée MCP
 */
export class MCPInputDto {
    @ApiProperty({ description: 'Requête à exécuter' })
    @IsString()
    query!: string;

    @ApiPropertyOptional({ description: 'Paramètres supplémentaires' })
    @IsObject()
    @IsOptional()
    parameters?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Format de sortie souhaité',
        enum: ['text', 'json', 'markdown', 'html'],
        default: 'text'
    })
    @IsEnum(['text', 'json', 'markdown', 'html'])
    @IsOptional()
    format?: 'text' | 'json' | 'markdown' | 'html' = 'text';
}

/**
 * DTO pour la sécurité MCP
 */
export class MCPSecurityDto {
    @ApiPropertyOptional({ description: 'Token d\'accès' })
    @IsString()
    @IsOptional()
    accessToken?: string;

    @ApiPropertyOptional({ description: 'Permissions' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    permissions?: string[];
}

/**
 * DTO pour le traçage MCP
 */
export class MCPTracingDto {
    @ApiPropertyOptional({ description: 'ID de trace' })
    @IsString()
    @IsOptional()
    traceId?: string;

    @ApiPropertyOptional({ description: 'ID de span' })
    @IsString()
    @IsOptional()
    spanId?: string;

    @ApiPropertyOptional({ description: 'ID parent' })
    @IsString()
    @IsOptional()
    parentId?: string;

    @ApiPropertyOptional({ description: 'Échantillonnage activé', default: true })
    @IsBoolean()
    @IsOptional()
    sampled?: boolean = true;
}

/**
 * DTO principal pour le contexte MCP
 */
export class MCPContextDto {
    @ApiProperty({ description: 'ID unique de la requête' })
    @IsUUID()
    requestId!: string;

    @ApiProperty({ description: 'Timestamp de la requête' })
    @IsDateString()
    timestamp!: string;

    @ApiProperty({ description: 'Version du protocole', default: '2.0' })
    @IsString()
    version: string = '2.0';

    @ApiProperty({ description: 'Informations sur l\'agent' })
    @Type(() => MCPAgentDto)
    agent!: MCPAgentDto;

    @ApiProperty({ description: 'Informations sur la session' })
    @Type(() => MCPSessionDto)
    session!: MCPSessionDto;

    @ApiProperty({ description: 'Données d\'entrée' })
    @Type(() => MCPInputDto)
    input!: MCPInputDto;

    @ApiPropertyOptional({ description: 'Outils disponibles', type: [MCPToolDto] })
    @IsArray()
    @Type(() => MCPToolDto)
    @IsOptional()
    tools?: MCPToolDto[];

    @ApiPropertyOptional({ description: 'Données de contexte supplémentaires' })
    @IsObject()
    @IsOptional()
    contextData?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Informations de sécurité' })
    @Type(() => MCPSecurityDto)
    @IsOptional()
    security?: MCPSecurityDto;

    @ApiPropertyOptional({ description: 'Informations de traçage' })
    @Type(() => MCPTracingDto)
    @IsOptional()
    tracing?: MCPTracingDto;
}