import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from './bullmq/bull-board.module';
import { TemporalModule } from './temporal/temporal.module';
import { ModelsModule } from './models/models.module';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        // Configuration globale de l'application
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            expandVariables: true,
        }),

        // Configuration de BullMQ pour les files d'attente
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                redis: {
                    host: configService.get('REDIS_HOST', 'localhost'),
                    port: configService.get('REDIS_PORT', 6379),
                    password: configService.get('REDIS_PASSWORD', ''),
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 200,
                },
            }),
        }),

        // Module pour l'interface BullBoard
        BullBoardModule,

        // Module pour l'intégration avec Temporal
        TemporalModule,

        // Module pour la gestion des modèles
        ModelsModule,

        // Module pour la gestion des agents
        AgentsModule,

        // Module pour l'authentification
        AuthModule,

        // Module pour les endpoints de santé
        HealthModule,
    ],
})
export class AppModule { }