import { Module, MiddlewareConsumer, RequestMethod } from @nestjs/commonstructure-agent';
import { LegacyPhpRedirectMiddleware } from ./common/middleware/legacyPhpRedirect.middlewarestructure-agent';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Appliquer le middleware à toutes les routes
    consumer
      .apply(LegacyPhpRedirectMiddleware)
      .forRoutes('*');
  }
}