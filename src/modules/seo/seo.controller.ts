import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SeoService } from './seo.service';

@Controller('api/seo')
export class SeoController {
  private readonly logger = new Logger(SeoController.name);
  
  constructor(private readonly seoService: SeoService) {}

  @Get('pages')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async getSeoPages(
    @Query('status') status?: string,
    @Query('score') score?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.seoService.getAllSeoPages({
        status,
        score,
        sort,
        dir,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des pages SEO: ${error.message}`, error.stack);
      throw new HttpException('Erreur lors de la récupération des pages SEO', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('page')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async getSeoPageDetails(@Query('url') url: string) {
    try {
      if (!url) {
        throw new HttpException('URL requise', HttpStatus.BAD_REQUEST);
      }
      
      const page = await this.seoService.getSeoPageDetails(url);
      
      if (!page) {
        throw new HttpException('Page non trouvée', HttpStatus.NOT_FOUND);
      }
      
      return page;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des détails de la page SEO: ${error.message}`, error.stack);
      throw error instanceof HttpException 
        ? error
        : new HttpException('Erreur lors de la récupération des détails de la page SEO', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async getSeoStats() {
    try {
      return await this.seoService.getSeoStats();
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des statistiques SEO: ${error.message}`, error.stack);
      throw new HttpException('Erreur lors de la récupération des statistiques SEO', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('audit/start')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async startSeoAudit() {
    try {
      return await this.seoService.runSeoAudit();
    } catch (error) {
      this.logger.error(`Erreur lors du démarrage de l'audit SEO: ${error.message}`, error.stack);
      throw new HttpException(`Erreur lors du démarrage de l'audit SEO: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('audit/page')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async auditSinglePage(@Body() body: { url: string }) {
    try {
      if (!body.url) {
        throw new HttpException('URL requise', HttpStatus.BAD_REQUEST);
      }
      
      return await this.seoService.auditSinglePage(body.url);
    } catch (error) {
      this.logger.error(`Erreur lors de l'audit de la page: ${error.message}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException(`Erreur lors de l'audit de la page: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('issues')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async getSeoIssues(
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.seoService.getAllSeoIssues({
        severity,
        type,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des problèmes SEO: ${error.message}`, error.stack);
      throw new HttpException('Erreur lors de la récupération des problèmes SEO', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('issue/fix/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async fixIssue(@Param('id') id: string) {
    try {
      const issueId = parseInt(id, 10);
      
      if (Number.isNaN(issueId)) {
        throw new HttpException('ID de problème invalide', HttpStatus.BAD_REQUEST);
      }
      
      return await this.seoService.fixIssue(issueId);
    } catch (error) {
      this.logger.error(`Erreur lors de la résolution du problème SEO: ${error.message}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Erreur lors de la résolution du problème SEO', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('report')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async generateSeoReport() {
    try {
      return await this.seoService.generateSeoReport();
    } catch (error) {
      this.logger.error(`Erreur lors de la génération du rapport SEO: ${error.message}`, error.stack);
      throw new HttpException('Erreur lors de la génération du rapport SEO', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('redirects')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async getRedirects(@Query('active') active?: string) {
    try {
      const isActive = active === undefined ? undefined : active === 'true';
      return await this.seoService.getRedirects(isActive);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des redirections: ${error.message}`, error.stack);
      throw new HttpException('Erreur lors de la récupération des redirections', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('redirect')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async addRedirect(
    @Body() data: { source: string; destination: string; statusCode?: number }
  ) {
    try {
      if (!data.source || !data.destination) {
        throw new HttpException('Source et destination requises', HttpStatus.BAD_REQUEST);
      }
      
      return await this.seoService.addRedirect(data);
    } catch (error) {
      this.logger.error(`Erreur lors de l'ajout d'une redirection: ${error.message}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Erreur lors de l\'ajout d\'une redirection', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('import-htaccess')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async importHtaccess(@Body() data: { content: string }) {
    try {
      if (!data.content) {
        throw new HttpException('Contenu htaccess requis', HttpStatus.BAD_REQUEST);
      }
      
      return await this.seoService.importRedirectsFromHtaccess(data.content);
    } catch (error) {
      this.logger.error(`Erreur lors de l'import des redirections depuis htaccess: ${error.message}`, error.stack);
      throw new HttpException('Erreur lors de l\'import des redirections depuis htaccess', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  @Get('history')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async getSeoHistory(@Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : undefined;
      return await this.seoService.getSeoHistory(limitNum);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération de l'historique SEO: ${error.message}`, error.stack);
      throw new HttpException('Erreur lors de la récupération de l\'historique SEO', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}