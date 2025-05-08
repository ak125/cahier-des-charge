/**
 * Exemple d'utilisation du module MCP dans une application NestJS
 * Suivant les standards définis dans le document de standardisation des technologies
 */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    // Création de l'application NestJS
    const app = await NestFactory.create(AppModule);

    // Configuration du pipe de validation global
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));

    // Configuration de Swagger pour la documentation de l'API
    const config = new DocumentBuilder()
        .setTitle('API Model Context Protocol')
        .setDescription('API standardisée pour le Model Context Protocol (MCP)')
        .setVersion('2.0')
        .addTag('mcp')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Démarrage du serveur sur le port 3000
    await app.listen(3000);
    console.log(`L'application MCP est démarrée sur: http://localhost:3000`);
    console.log(`Documentation Swagger disponible sur: http://localhost:3000/api/docs`);
}

bootstrap();