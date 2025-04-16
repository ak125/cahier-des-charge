import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}