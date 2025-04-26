import { Controller, Post, Body, Get, Param, Logger } from @nestjs/commonstructure-agent';
import { 
  ValidationRequest, 
  ValidationLevel,
  ValidationHistoryItem 
} from ./interfacesstructure-agent';
import { CascadeValidationService } from ./cascade-validation.servicestructure-agent';

@Controller('validation')
export class CascadeValidationController {
  private readonly logger = new Logger(CascadeValidationController.name);
  private validationHistory: ValidationHistoryItem[] = [];
  
  constructor(private readonly validationService: CascadeValidationService) {}
  
  @Post('cascade')
  async validateCascade(@Body() request: ValidationRequest) {
    this.logger.log(`Requête de validation reçue pour ${request.files.length} fichiers`);
    
    const result = await this.validationService.validateCascade(request);
    
    // Enregistrer dans l'historique
    this.validationHistory.push({
      id: request.id || `val-${Date.now()}`,
      timestamp: new Date(),
      request,
      result: {
        valid: result.valid,
        level: result.level,
        violationCount: result.violations.length
      }
    });
    
    // Limiter la taille de l'historique
    if (this.validationHistory.length > 100) {
      this.validationHistory.shift();
    }
    
    return {
      valid: result.valid,
      level: result.level,
      violations: result.violations,
      summary: {
        total: result.violations.length,
        errors: result.violations.filter(v => v.severity === 'error').length,
        warnings: result.violations.filter(v => v.severity === 'warning').length
      }
    };
  }
  
  @Post('level/:level')
  async validateLevel(
    @Body() request: ValidationRequest,
    @Param('level') levelParam: string
  ) {
    const level = parseInt(levelParam, 10) as ValidationLevel;
    
    if (isNaN(level) || level < 1 || level > 5) {
      return { error: 'Niveau de validation invalide. Utilisez 1-5.' };
    }
    
    const result = await this.validationService.validateSingleLevel(request, level);
    
    return {
      valid: result.valid,
      level,
      violations: result.violations,
      summary: {
        total: result.violations.length,
        errors: result.violations.filter(v => v.severity === 'error').length,
        warnings: result.violations.filter(v => v.severity === 'warning').length
      }
    };
  }
  
  @Get('history')
  getValidationHistory() {
    return {
      count: this.validationHistory.length,
      items: this.validationHistory
    };
  }
  
  @Get('history/:id')
  async getValidationDetail(@Param('id') id: string) {
    const historyItem = this.validationHistory.find(item => item.id === id);
    
    if (!historyItem) {
      return { error: 'Validation non trouvée' };
    }
    
    // Réexécuter la validation pour obtenir les détails complets
    const result = await this.validationService.validateCascade(historyItem.request);
    
    return {
      id: historyItem.id,
      timestamp: historyItem.timestamp,
      request: historyItem.request,
      result
    };
  }
}
