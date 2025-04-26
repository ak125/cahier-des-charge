import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from @nestjs/commonstructure-agent';
import { AuthGuard } from @nestjs/passportstructure-agent';
import { DesyncAlertService } from ./desync-alert.servicestructure-agent';
import { ResolveAlertDto } from ./dto/resolve-alert.dtostructure-agent';

@Controller('alerts')
@UseGuards(AuthGuard('jwt'))
export class DesyncAlertController {
  constructor(private readonly desyncAlertService: DesyncAlertService) {}

  @Get()
  async getAlerts(@Query() query) {
    // Construire les filtres basés sur les paramètres de requête
    const filter: any = {};
    
    // Filtre sur le statut
    if (query.status) {
      filter.status = query.status;
    } else {
      // Par défaut, exclure les alertes résolues
      filter.status = { $ne: 'resolved' };
    }
    
    // Filtre sur la priorité
    if (query.priority) {
      filter.priority = query.priority;
    }
    
    // Filtre sur le composant
    if (query.component) {
      filter.component = query.component;
    }
    
    // Filtre sur le type
    if (query.type) {
      filter.type = query.type;
    }
    
    return this.desyncAlertService.getAlerts(filter);
  }

  @Get(':id')
  async getAlert(@Param('id') id: string) {
    return this.desyncAlertService.getAlertById(id);
  }

  @Patch(':id/resolve')
  async resolveAlert(
    @Param('id') id: string,
    @Body() resolveDto: ResolveAlertDto
  ) {
    return this.desyncAlertService.resolveAlert(id, resolveDto);
  }

  @Post(':id/assign')
  async assignAlert(
    @Param('id') id: string,
    @Body('assignee') assignee: string
  ) {
    return this.desyncAlertService.assignAlert(id, assignee);
  }

  @Get('stats/summary')
  async getAlertStats() {
    return this.desyncAlertService.getAlertStatistics();
  }

  @Get('stats/by-component')
  async getAlertsByComponent() {
    return this.desyncAlertService.getAlertsByComponent();
  }

  @Get('stats/trends')
  async getAlertTrends(@Query('period') period: string) {
    return this.desyncAlertService.getAlertTrends(period || 'week');
  }
}
