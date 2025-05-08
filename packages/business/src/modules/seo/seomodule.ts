import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaSeoRepository } from './repositories/prisma-seo.repository';
import { SeoController } from './seo.controller';
import { SeoStrategyRegistry } from './services/seo-strategy.registry';
import { SeoService } from './services/seo.service';
import { LinksAnalysisStrategy } from './strategies/links-analysis.strategy';
import { MetaTagsStrategy } from './strategies/meta-tags.strategy';

/**
 * Module SEO utilisant une architecture en couches
 */
@Module({
  imports: [PrismaModule, ConfigModule],
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
  exports: ['ISeoService', SeoStrategyRegistry],
})
export class SeoModule {
  /**
   * Configuration des stratégies SEO lors de l'initialisation du module
   */
  constructor(
    private registry: SeoStrategyRegistry,
    private metaTagsStrategy: MetaTagsStrategy,
    private linksAnalysisStrategy: LinksAnalysisStrategy
  ) {
    // Enregistrer les stratégies d'analyse SEO
    this.registry.registerStrategy(metaTagsStrategy);
    this.registry.registerStrategy(linksAnalysisStrategy);
  }
}
