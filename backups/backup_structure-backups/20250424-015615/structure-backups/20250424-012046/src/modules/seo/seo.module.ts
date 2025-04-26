import { Module } from @nestjs/commonstructure-agent';
import { SeoController } from ./seo.controllerstructure-agent';
import { SeoService } from ./services/seo.servicestructure-agent';
import { PrismaModule } from ../prisma/prisma.modulestructure-agent';
import { ConfigModule } from @nestjs/configstructure-agent';
import { SeoStrategyRegistry } from ./services/seo-strategy.registrystructure-agent';
import { MetaTagsStrategy } from ./strategies/meta-tags.strategystructure-agent';
import { LinksAnalysisStrategy } from ./strategies/links-analysis.strategystructure-agent';
import { PrismaSeoRepository } from ./repositories/prisma-seo.repositorystructure-agent';

/**
 * Module SEO utilisant une architecture en couches
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [SeoController],
  providers: [
    // Couche des repositories (données)
    {
      provide: 'ISeoRepository',
      useClass: PrismaSeoRepository,
    },
    // Couche des services (métier)
    {
      provide: 'ISeoService',
      useClass: SeoService,
    },
    // Registre de stratégies et stratégies
    SeoStrategyRegistry,
    MetaTagsStrategy,
    LinksAnalysisStrategy,
  ],
  exports: [
    'ISeoService',
    SeoStrategyRegistry,
  ],
})
export class SeoModule {
  /**
   * Configuration des stratégies SEO lors de l'initialisation du module
   */
  constructor(
    private registry: SeoStrategyRegistry,
    private metaTagsStrategy: MetaTagsStrategy,
    private linksAnalysisStrategy: LinksAnalysisStrategy,
  ) {
    // Enregistrer les stratégies d'analyse SEO
    this.registry.registerStrategy(metaTagsStrategy);
    this.registry.registerStrategy(linksAnalysisStrategy);
  }
}