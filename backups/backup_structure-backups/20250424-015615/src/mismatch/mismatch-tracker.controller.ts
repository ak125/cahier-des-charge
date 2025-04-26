import { Controller, Get, Post, Body, Param, Query, UseGuards } from @nestjs/commonstructure-agent';
import { AuthGuard } from @nestjs/passportstructure-agent';
import { MismatchTrackerService } from ./mismatch-tracker.servicestructure-agent';
import { MismatchResolutionDto } from ./dto/mismatch-resolution.dtostructure-agent';

@Controller('mismatches')
@UseGuards(AuthGuard('jwt'))
export class MismatchTrackerController {
  constructor(private readonly mismatchTrackerService: MismatchTrackerService) {}

  @Get()
  async getMismatches(@Query() query) {
    // Convertir les paramètres de requête en filtres
    const filter = {};
    
    if (query.severity) {
      filter['severity'] = query.severity;
    }
    
    if (query.type) {
      filter['type'] = query.type;
    }
    
    if (query.team) {
      // Filtrage plus complexe par équipe, implémentation simplifiée
      filter['details.codePath'] = { $regex: new RegExp(`/${query.team}/`, 'i') };
    }
    
    return this.mismatchTrackerService.getOpenMismatches(filter);
  }

  @Post('detect')
  async detectMismatches() {
    return this.mismatchTrackerService.detectMismatches();
  }

  @Post(':id/resolve')
  async resolveMismatch(
    @Param('id') id: string,
    @Body() resolutionDto: MismatchResolutionDto
  ) {
    return this.mismatchTrackerService.resolveMismatch(id, {
      resolvedBy: resolutionDto.resolvedBy,
      resolution: resolutionDto.resolution,
      comment: resolutionDto.comment
    });
  }

  @Get('stats')
  async getMismatchStats() {
    const mismatches = await this.mismatchTrackerService.getOpenMismatches();
    
    // Calculer les statistiques
    const bySeverity = {
      critical: mismatches.filter(m => m.severity === 'critical').length,
      high: mismatches.filter(m => m.severity === 'high').length,
      medium: mismatches.filter(m => m.severity === 'medium').length,
      low: mismatches.filter(m => m.severity === 'low').length
    };
    
    const byType = mismatches.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {});
    
    // Calculer l'âge moyen des incohérences (en jours)
    const avgAge = mismatches.reduce((sum, m) => {
      const age = (new Date()).getTime() - new Date(m.detectedAt).getTime();
      return sum + (age / (1000 * 60 * 60 * 24));
    }, 0) / (mismatches.length || 1);
    
    return {
      total: mismatches.length,
      bySeverity,
      byType,
      avgAgeDays: Math.round(avgAge * 10) / 10
    };
  }
}
