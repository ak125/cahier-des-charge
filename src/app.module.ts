import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { LegacyPhpRedirectMiddleware } from './common/middleware/legacyPhpRedirect.middleware';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Appliquer le middleware à toutes les routes
    consumer.apply(LegacyPhpRedirectMiddleware).forRoutes('*');
  }
}
