/**
 * Contrôleur MCP standardisé pour NestJS
 * Suivant les standards définis dans le document de standardisation des technologies
 */
import {
    Controller,
    Post,
    Body,
    HttpException,
    HttpStatus,
    Get
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody
} from '@nestjs/swagger';
import { MCPNestService } from '../services/mcp-nest.service';
import { MCPContextDto } from '../dto/mcp-context.dto';
import { ValidationError } from '@model-context-protocol/core';

@ApiTags('mcp')
@Controller('mcp')
export class MCPController {
    constructor(private readonly mcpService: MCPNestService) { }

    @Post('process')
    @ApiOperation({ summary: 'Traiter une requête MCP' })
    @ApiBody({ type: MCPContextDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Requête traitée avec succès'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Contexte MCP invalide'
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Erreur lors du traitement'
    })
    async processRequest(@Body() rawContext: any) {
        try {
            // Utiliser le service MCP pour traiter la requête
            const result = await this.mcpService.processRequest(rawContext);

            // Gérer la réponse selon son statut
            if (result.status === 'error') {
                throw new HttpException(result,
                    result.error.code === 'VALIDATION_ERROR'
                        ? HttpStatus.BAD_REQUEST
                        : HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return result;
        } catch (error: any) {
            if (error instanceof HttpException) {
                throw error;
            }

            if (error instanceof ValidationError) {
                const errorResponse = {
                    requestId: rawContext?.requestId || 'unknown',
                    timestamp: new Date().toISOString(),
                    error: {
                        message: error.message,
                        code: 'VALIDATION_ERROR'
                    },
                    status: 'error'
                };

                throw new HttpException(errorResponse, HttpStatus.BAD_REQUEST);
            }

            // Autres erreurs
            const errorResponse = {
                requestId: rawContext?.requestId || 'unknown',
                timestamp: new Date().toISOString(),
                error: {
                    message: error.message || 'Erreur interne du serveur',
                    code: 'INTERNAL_SERVER_ERROR'
                },
                status: 'error'
            };

            throw new HttpException(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('health')
    @ApiOperation({ summary: 'Vérifier la santé du service MCP' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Service MCP opérationnel'
    })
    health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '2.0'
        };
    }
}