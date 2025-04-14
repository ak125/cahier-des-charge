#!/usr/bin/env ts-node
/**
 * 🧠 prisma-to-dto.ts — Intégration de Prisma avec n8n et MCP
 * 
 * Cet agent générera automatiquement:
 * 1. Des DTO NestJS et schémas Zod à partir du schéma Prisma
 * 2. Des composants Remix (route.tsx, loader.ts)
 * 3. Des composants NestJS (service.ts, controller.ts)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { PrismaAnalyzer } from './prisma-analyzer';

interface AgentOptions {
  schemaPath: string;
  outputDir: string;
  nestjsDir: string;
  remixDir: string;
  generateTypes: boolean;
  generateDtos: boolean;
  generateZod: boolean;
  generateMappers: boolean;
  generateServices: boolean; 
  generateControllers: boolean;
  generateRoutes: boolean;
  generateLoaders: boolean;
}

/**
 * Agent MCP pour l'intégration Prisma avec n8n
 */
class PrismaToDto {
  private logger: Console;

  constructor(private options: AgentOptions) {
    this.logger = console;
  }

  /**
   * Exécute l'agent et génère tous les fichiers nécessaires
   */
  public async run(): Promise<void> {
    try {
      this.logger.info('🚀 Démarrage de l\'agent prisma-to-dto...');
      
      // Vérifier si le schéma Prisma existe
      await this.checkPrismaSchema();
      
      // Créer les dossiers si nécessaire
      await this.createDirectories();
      
      // Générer les types, DTOs et schémas Zod
      await this.generateTypeDefinitions();
      
      // Générer les services et contrôleurs NestJS si demandé
      if (this.options.generateServices || this.options.generateControllers) {
        await this.generateNestJSComponents();
      }
      
      // Générer les routes et loaders Remix si demandé
      if (this.options.generateRoutes || this.options.generateLoaders) {
        await this.generateRemixComponents();
      }
      
      this.logger.info('✅ Agent prisma-to-dto terminé avec succès!');
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'exécution de l\'agent:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le schéma Prisma existe
   */
  private async checkPrismaSchema(): Promise<void> {
    try {
      await fs.access(this.options.schemaPath);
      this.logger.info(`📄 Schéma Prisma trouvé: ${this.options.schemaPath}`);
    } catch (error) {
      this.logger.error(`❌ Schéma Prisma non trouvé: ${this.options.schemaPath}`);
      throw new Error(`Le schéma Prisma n'existe pas à l'emplacement: ${this.options.schemaPath}`);
    }
  }

  /**
   * Crée les dossiers nécessaires
   */
  private async createDirectories(): Promise<void> {
    try {
      // Dossier de sortie principal
      if (this.options.outputDir) {
        await fs.mkdir(this.options.outputDir, { recursive: true });
      }
      
      // Dossier NestJS
      if (this.options.nestjsDir) {
        await fs.mkdir(this.options.nestjsDir, { recursive: true });
      }
      
      // Dossier Remix
      if (this.options.remixDir) {
        await fs.mkdir(this.options.remixDir, { recursive: true });
        
        // Sous-dossiers Remix
        if (this.options.generateRoutes) {
          await fs.mkdir(path.join(this.options.remixDir, 'routes'), { recursive: true });
        }
        
        if (this.options.generateLoaders) {
          await fs.mkdir(path.join(this.options.remixDir, 'loaders'), { recursive: true });
        }
        
        // Dossier pour les schémas Zod
        if (this.options.generateZod) {
          await fs.mkdir(path.join(this.options.remixDir, 'schemas'), { recursive: true });
        }
      }
      
      this.logger.info('📁 Dossiers créés avec succès');
    } catch (error) {
      this.logger.error('❌ Erreur lors de la création des dossiers:', error);
      throw error;
    }
  }

  /**
   * Génère les types, DTOs et schémas Zod via PrismaAnalyzer
   */
  private async generateTypeDefinitions(): Promise<void> {
    this.logger.info('🔍 Génération des types, DTOs et schémas Zod...');
    
    try {
      const prismaAnalyzer = new PrismaAnalyzer({
        schemaPath: this.options.schemaPath,
        outputDir: this.options.outputDir,
        nestjsDir: this.options.nestjsDir,
        remixDir: this.options.remixDir,
        generateTypes: this.options.generateTypes,
        generateDtos: this.options.generateDtos,
        generateZod: this.options.generateZod,
        generateMappers: this.options.generateMappers
      });
      
      await prismaAnalyzer.analyze();
      this.logger.info('✅ Types, DTOs et schémas Zod générés avec succès');
    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération des types:', error);
      throw error;
    }
  }

  /**
   * Génère les services et contrôleurs NestJS
   */
  private async generateNestJSComponents(): Promise<void> {
    if (!this.options.nestjsDir) {
      this.logger.warn('⚠️ Pas de dossier NestJS spécifié - génération ignorée');
      return;
    }
    
    this.logger.info('🔍 Génération des composants NestJS...');
    
    try {
      // Récupérer les modèles Prisma
      const prismaSchemaContent = await fs.readFile(this.options.schemaPath, 'utf8');
      const modelNames = this.extractModelNames(prismaSchemaContent);
      
      this.logger.info(`📋 Modèles trouvés: ${modelNames.join(', ')}`);
      
      // Générer les services et contrôleurs pour chaque modèle
      for (const modelName of modelNames) {
        if (this.options.generateServices) {
          await this.generateService(modelName);
        }
        
        if (this.options.generateControllers) {
          await this.generateController(modelName);
        }
      }
      
      this.logger.info('✅ Composants NestJS générés avec succès');
    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération des composants NestJS:', error);
      throw error;
    }
  }

  /**
   * Extrait les noms des modèles du schéma Prisma
   */
  private extractModelNames(schemaContent: string): string[] {
    const modelRegex = /model\s+(\w+)\s*{/g;
    const modelNames: string[] = [];
    let match;
    
    while ((match = modelRegex.exec(schemaContent)) !== null) {
      modelNames.push(match[1]);
    }
    
    return modelNames;
  }

  /**
   * Génère un service NestJS pour un modèle
   */
  private async generateService(modelName: string): Promise<void> {
    const modelDir = path.join(this.options.nestjsDir, this.kebabCase(modelName));
    await fs.mkdir(modelDir, { recursive: true });
    
    const servicePath = path.join(modelDir, `${this.kebabCase(modelName)}.service.ts`);
    
    const serviceContent = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ${modelName} } from '@prisma/client';
import { Create${modelName}Dto } from './dto/create-${this.kebabCase(modelName)}.dto';
import { Update${modelName}Dto } from './dto/update-${this.kebabCase(modelName)}.dto';
import { Find${modelName}Dto } from './dto/find-${this.kebabCase(modelName)}.dto';
import { ${modelName}Mapper } from './${this.kebabCase(modelName)}.mapper';

@Injectable()
export class ${modelName}Service {
  constructor(
    private prisma: PrismaService,
    private ${this.camelCase(modelName)}Mapper: ${modelName}Mapper
  ) {}

  /**
   * Crée un nouveau ${modelName}
   */
  async create(data: Create${modelName}Dto) {
    const ${this.camelCase(modelName)} = await this.prisma.${this.camelCase(modelName)}.create({
      data,
    });
    
    return this.${this.camelCase(modelName)}Mapper.toDto(${this.camelCase(modelName)});
  }

  /**
   * Récupère tous les ${modelName}s avec pagination et filtres
   */
  async findAll(params: Find${modelName}Dto) {
    const { page = 1, limit = 10, orderBy = 'createdAt', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    
    // Construire la requête de base
    const whereClause = this.buildWhereClause(params);
    
    // Compter le nombre total d'éléments
    const total = await this.prisma.${this.camelCase(modelName)}.count({
      where: whereClause,
    });
    
    // Récupérer les données avec pagination
    const ${this.camelCase(modelName)}s = await this.prisma.${this.camelCase(modelName)}.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
    });
    
    return {
      data: this.${this.camelCase(modelName)}Mapper.toDtoList(${this.camelCase(modelName)}s),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Construit la clause where pour Prisma
   */
  private buildWhereClause(params: Find${modelName}Dto) {
    const where: any = {};
    
    // Ajouter les filtres spécifiques
    Object.keys(params).forEach((key) => {
      // Ignorer les paramètres de pagination et de tri
      if (!['page', 'limit', 'orderBy', 'order', 'search'].includes(key)) {
        where[key] = params[key];
      }
    });
    
    // Ajouter la recherche si elle est définie
    if (params.search) {
      // Adapter cette clause selon les champs à rechercher dans votre modèle
      // Exemple pour un modèle avec des champs name et description
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        // Ajouter d'autres champs selon le modèle
      ];
    }
    
    return where;
  }

  /**
   * Récupère un ${modelName} par son ID
   */
  async findOne(id: string) {
    const ${this.camelCase(modelName)} = await this.prisma.${this.camelCase(modelName)}.findUnique({
      where: { id },
    });
    
    if (!${this.camelCase(modelName)}) {
      return null;
    }
    
    return this.${this.camelCase(modelName)}Mapper.toDto(${this.camelCase(modelName)});
  }

  /**
   * Met à jour un ${modelName}
   */
  async update(id: string, data: Update${modelName}Dto) {
    // Vérifier si l'entité existe
    const exists = await this.prisma.${this.camelCase(modelName)}.findUnique({
      where: { id },
    });
    
    if (!exists) {
      return null;
    }
    
    const updated${modelName} = await this.prisma.${this.camelCase(modelName)}.update({
      where: { id },
      data,
    });
    
    return this.${this.camelCase(modelName)}Mapper.toDto(updated${modelName});
  }

  /**
   * Supprime un ${modelName}
   */
  async remove(id: string) {
    // Vérifier si l'entité existe
    const exists = await this.prisma.${this.camelCase(modelName)}.findUnique({
      where: { id },
    });
    
    if (!exists) {
      return null;
    }
    
    await this.prisma.${this.camelCase(modelName)}.delete({
      where: { id },
    });
    
    return { id };
  }
}
`;
    
    await fs.writeFile(servicePath, serviceContent, 'utf8');
  }

  /**
   * Génère un contrôleur NestJS pour un modèle
   */
  private async generateController(modelName: string): Promise<void> {
    const modelDir = path.join(this.options.nestjsDir, this.kebabCase(modelName));
    await fs.mkdir(modelDir, { recursive: true });
    
    const controllerPath = path.join(modelDir, `${this.kebabCase(modelName)}.controller.ts`);
    
    const controllerContent = `import { Controller, Get, Post, Body, Patch, Param, Delete, Query, NotFoundException, HttpCode } from '@nestjs/common';
import { ${modelName}Service } from './${this.kebabCase(modelName)}.service';
import { Create${modelName}Dto } from './dto/create-${this.kebabCase(modelName)}.dto';
import { Update${modelName}Dto } from './dto/update-${this.kebabCase(modelName)}.dto';
import { Find${modelName}Dto } from './dto/find-${this.kebabCase(modelName)}.dto';
import { ${modelName}IdDto } from './dto/${this.kebabCase(modelName)}-id.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('${this.camelCase(modelName)}')
@Controller('${this.camelCase(modelName)}s')
export class ${modelName}Controller {
  constructor(private readonly ${this.camelCase(modelName)}Service: ${modelName}Service) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau ${modelName}' })
  @ApiBody({ type: Create${modelName}Dto })
  @ApiResponse({ status: 201, description: '${modelName} créé avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  create(@Body() create${modelName}Dto: Create${modelName}Dto) {
    return this.${this.camelCase(modelName)}Service.create(create${modelName}Dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les ${modelName}s' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Champ de tri' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Direction du tri' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Terme de recherche' })
  @ApiResponse({ status: 200, description: 'Liste des ${modelName}s récupérée avec succès' })
  findAll(@Query() query: Find${modelName}Dto) {
    return this.${this.camelCase(modelName)}Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un ${modelName} par son ID' })
  @ApiParam({ name: 'id', description: 'ID du ${modelName}' })
  @ApiResponse({ status: 200, description: '${modelName} récupéré avec succès' })
  @ApiResponse({ status: 404, description: '${modelName} non trouvé' })
  async findOne(@Param() params: ${modelName}IdDto) {
    const ${this.camelCase(modelName)} = await this.${this.camelCase(modelName)}Service.findOne(params.id);
    
    if (!${this.camelCase(modelName)}) {
      throw new NotFoundException('${modelName} non trouvé');
    }
    
    return ${this.camelCase(modelName)};
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un ${modelName}' })
  @ApiParam({ name: 'id', description: 'ID du ${modelName}' })
  @ApiBody({ type: Update${modelName}Dto })
  @ApiResponse({ status: 200, description: '${modelName} mis à jour avec succès' })
  @ApiResponse({ status: 404, description: '${modelName} non trouvé' })
  async update(@Param() params: ${modelName}IdDto, @Body() update${modelName}Dto: Update${modelName}Dto) {
    const updated${modelName} = await this.${this.camelCase(modelName)}Service.update(params.id, update${modelName}Dto);
    
    if (!updated${modelName}) {
      throw new NotFoundException('${modelName} non trouvé');
    }
    
    return updated${modelName};
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un ${modelName}' })
  @ApiParam({ name: 'id', description: 'ID du ${modelName}' })
  @ApiResponse({ status: 204, description: '${modelName} supprimé avec succès' })
  @ApiResponse({ status: 404, description: '${modelName} non trouvé' })
  async remove(@Param() params: ${modelName}IdDto) {
    const result = await this.${this.camelCase(modelName)}Service.remove(params.id);
    
    if (!result) {
      throw new NotFoundException('${modelName} non trouvé');
    }
    
    return null;
  }
}
`;
    
    await fs.writeFile(controllerPath, controllerContent, 'utf8');
  }

  /**
   * Génère les composants Remix
   */
  private async generateRemixComponents(): Promise<void> {
    if (!this.options.remixDir) {
      this.logger.warn('⚠️ Pas de dossier Remix spécifié - génération ignorée');
      return;
    }
    
    this.logger.info('🔍 Génération des composants Remix...');
    
    try {
      // Récupérer les modèles Prisma
      const prismaSchemaContent = await fs.readFile(this.options.schemaPath, 'utf8');
      const modelNames = this.extractModelNames(prismaSchemaContent);
      
      this.logger.info(`📋 Modèles trouvés: ${modelNames.join(', ')}`);
      
      // Générer les routes et loaders pour chaque modèle
      for (const modelName of modelNames) {
        // Ne pas générer de routes pour les modèles de jonction
        if (modelName.includes('To') || modelName.endsWith('Item')) {
          continue;
        }
        
        if (this.options.generateRoutes) {
          await this.generateRoute(modelName);
        }
        
        if (this.options.generateLoaders) {
          await this.generateLoader(modelName);
        }
      }
      
      this.logger.info('✅ Composants Remix générés avec succès');
    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération des composants Remix:', error);
      throw error;
    }
  }

  /**
   * Génère une route Remix pour un modèle
   */
  private async generateRoute(modelName: string): Promise<void> {
    const modelsDir = path.join(this.options.remixDir, 'routes', this.kebabCase(modelName) + 's');
    await fs.mkdir(modelsDir, { recursive: true });
    
    // Route pour la liste
    await this.generateListRoute(modelName, modelsDir);
    
    // Route pour le détail
    await this.generateDetailRoute(modelName, modelsDir);
    
    // Route pour la création
    await this.generateCreateRoute(modelName, modelsDir);
    
    // Route pour la mise à jour
    await this.generateEditRoute(modelName, modelsDir);
  }

  /**
   * Génère la route de liste pour un modèle
   */
  private async generateListRoute(modelName: string, modelsDir: string): Promise<void> {
    const routePath = path.join(modelsDir, 'index.tsx');
    
    const routeContent = `import { json, LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { ${modelName}Response } from '~/schemas/${this.kebabCase(modelName)}';
import { load${modelName}s } from '~/loaders/${this.kebabCase(modelName)}s.server';
import { ${modelName}List } from '~/components/${this.kebabCase(modelName)}/${this.kebabCase(modelName)}-list';
import { Pagination } from '~/components/ui/pagination';
import { SearchBar } from '~/components/ui/search-bar';
import { Button } from '~/components/ui/button';
import { PlusIcon } from '~/components/icons/plus-icon';

// Types pour le loader
interface LoaderData {
  ${this.camelCase(modelName)}s: ${modelName}Response[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Loader de la page
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search') || '';
  
  const result = await load${modelName}s({ page, limit, search });
  
  return json<LoaderData>(result);
};

// Composant de la page
export default function ${modelName}List() {
  const { ${this.camelCase(modelName)}s, meta } = useLoaderData<LoaderData>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Implémenter la recherche côté client ou rediriger avec le terme
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Liste des ${modelName}s</h1>
        <Button to="/admin/${this.kebabCase(modelName)}s/new" variant="primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nouveau ${modelName}
        </Button>
      </div>
      
      <SearchBar onSearch={handleSearch} placeholder="Rechercher un ${this.camelCase(modelName)}..." />
      
      <${modelName}List ${this.camelCase(modelName)}s={${this.camelCase(modelName)}s} />
      
      {meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          baseUrl="/admin/${this.kebabCase(modelName)}s"
        />
      )}
    </div>
  );
}
`;
    
    await fs.writeFile(routePath, routeContent, 'utf8');
  }

  /**
   * Génère la route de détail pour un modèle
   */
  private async generateDetailRoute(modelName: string, modelsDir: string): Promise<void> {
    const routeDir = path.join(modelsDir, '$id');
    await fs.mkdir(routeDir, { recursive: true });
    
    const routePath = path.join(routeDir, 'index.tsx');
    
    const routeContent = `import { json, LoaderFunction } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { load${modelName} } from '~/loaders/${this.kebabCase(modelName)}s.server';
import { ${modelName}Response } from '~/schemas/${this.kebabCase(modelName)}';
import { ${modelName}Detail } from '~/components/${this.kebabCase(modelName)}/${this.kebabCase(modelName)}-detail';
import { Button } from '~/components/ui/button';
import { ChevronLeftIcon, PencilIcon, TrashIcon } from '~/components/icons';

// Types pour le loader
interface LoaderData {
  ${this.camelCase(modelName)}: ${modelName}Response;
}

// Loader de la page
export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  
  if (!id) {
    throw new Response('Not Found', { status: 404 });
  }
  
  const ${this.camelCase(modelName)} = await load${modelName}(id);
  
  if (!${this.camelCase(modelName)}) {
    throw new Response('Not Found', { status: 404 });
  }
  
  return json<LoaderData>({ ${this.camelCase(modelName)} });
};

// Composant de la page
export default function ${modelName}DetailPage() {
  const { ${this.camelCase(modelName)} } = useLoaderData<LoaderData>();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/admin/${this.kebabCase(modelName)}s" className="inline-flex items-center">
            <ChevronLeftIcon className="w-5 h-5 mr-1" /> Retour à la liste
          </Link>
          <h1 className="text-2xl font-bold ml-4">${modelName}: {${this.camelCase(modelName)}.name || ${this.camelCase(modelName)}.id}</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button to={\`/admin/${this.kebabCase(modelName)}s/\${${this.camelCase(modelName)}.id}/edit\`} variant="secondary">
            <PencilIcon className="w-5 h-5 mr-2" />
            Modifier
          </Button>
          <Button to={\`/admin/${this.kebabCase(modelName)}s/\${${this.camelCase(modelName)}.id}/delete\`} variant="danger">
            <TrashIcon className="w-5 h-5 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
      
      <${modelName}Detail ${this.camelCase(modelName)}={${this.camelCase(modelName)}} />
    </div>
  );
}
`;
    
    await fs.writeFile(routePath, routeContent, 'utf8');
  }

  /**
   * Génère la route de création pour un modèle
   */
  private async generateCreateRoute(modelName: string, modelsDir: string): Promise<void> {
    const routePath = path.join(modelsDir, 'new.tsx');
    
    const routeContent = `import { json, redirect, ActionFunction } from '@remix-run/node';
import { useActionData, useSubmit, Form } from '@remix-run/react';
import { useState } from 'react';
import { create${modelName} } from '~/actions/${this.kebabCase(modelName)}s.server';
import { ${modelName}Create, ${this.camelCase(modelName)}CreateSchema } from '~/schemas/${this.kebabCase(modelName)}';
import { ${modelName}Form } from '~/components/${this.kebabCase(modelName)}/${this.kebabCase(modelName)}-form';
import { Button } from '~/components/ui/button';
import { Alert } from '~/components/ui/alert';
import { ChevronLeftIcon } from '~/components/icons';

// Types pour l'action
interface ActionData {
  success?: boolean;
  errors?: Record<string, string>;
  formErrors?: string[];
}

// Action de la page
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formJson = Object.fromEntries(formData);
  
  // Valider avec Zod
  const result = ${this.camelCase(modelName)}CreateSchema.safeParse(formJson);
  
  if (!result.success) {
    // Retourner les erreurs de validation
    return json<ActionData>({
      success: false,
      errors: result.error.formErrors.fieldErrors,
      formErrors: result.error.formErrors.formErrors,
    });
  }
  
  // Créer le ${modelName}
  try {
    const ${this.camelCase(modelName)} = await create${modelName}(result.data);
    return redirect(\`/admin/${this.kebabCase(modelName)}s/\${${this.camelCase(modelName)}.id}\`);
  } catch (error) {
    return json<ActionData>({
      success: false,
      formErrors: [error.message || 'Une erreur est survenue lors de la création.'],
    });
  }
};

// Composant de la page
export default function New${modelName}Page() {
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const [formData, setFormData] = useState<Partial<${modelName}Create>>({});
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button to="/admin/${this.kebabCase(modelName)}s" variant="ghost" className="inline-flex items-center">
          <ChevronLeftIcon className="w-5 h-5 mr-1" /> Retour à la liste
        </Button>
        <h1 className="text-2xl font-bold ml-4">Nouveau ${modelName}</h1>
      </div>
      
      {actionData?.formErrors && actionData.formErrors.length > 0 && (
        <Alert variant="error">
          <ul className="list-disc list-inside">
            {actionData.formErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}
      
      <Form method="post" onSubmit={handleSubmit}>
        <${modelName}Form
          data={formData}
          errors={actionData?.errors}
          onChange={handleChange}
        />
        
        <div className="mt-6 flex justify-end">
          <Button to="/admin/${this.kebabCase(modelName)}s" variant="outline" className="mr-2">
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            Créer ${modelName}
          </Button>
        </div>
      </Form>
    </div>
  );
}
`;
    
    await fs.writeFile(routePath, routeContent, 'utf8');
  }

  /**
   * Génère la route de mise à jour pour un modèle
   */
  private async generateEditRoute(modelName: string, modelsDir: string): Promise<void> {
    const routeDir = path.join(modelsDir, '$id');
    await fs.mkdir(routeDir, { recursive: true });
    
    const routePath = path.join(routeDir, 'edit.tsx');
    
    const routeContent = `import { json, redirect, ActionFunction, LoaderFunction } from '@remix-run/node';
import { useActionData, useLoaderData, useSubmit, Form } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { load${modelName}, update${modelName} } from '~/loaders/${this.kebabCase(modelName)}s.server';
import { ${modelName}Response, ${modelName}Update, ${this.camelCase(modelName)}UpdateSchema } from '~/schemas/${this.kebabCase(modelName)}';
import { ${modelName}Form } from '~/components/${this.kebabCase(modelName)}/${this.kebabCase(modelName)}-form';
import { Button } from '~/components/ui/button';
import { Alert } from '~/components/ui/alert';
import { ChevronLeftIcon } from '~/components/icons';

// Types pour l'action et le loader
interface ActionData {
  success?: boolean;
  errors?: Record<string, string>;
  formErrors?: string[];
}

interface LoaderData {
  ${this.camelCase(modelName)}: ${modelName}Response;
}

// Loader de la page
export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  
  if (!id) {
    throw new Response('Not Found', { status: 404 });
  }
  
  const ${this.camelCase(modelName)} = await load${modelName}(id);
  
  if (!${this.camelCase(modelName)}) {
    throw new Response('Not Found', { status: 404 });
  }
  
  return json<LoaderData>({ ${this.camelCase(modelName)} });
};

// Action de la page
export const action: ActionFunction = async ({ request, params }) => {
  const { id } = params;
  
  if (!id) {
    throw new Response('Not Found', { status: 404 });
  }
  
  const formData = await request.formData();
  const formJson = Object.fromEntries(formData);
  
  // Valider avec Zod
  const result = ${this.camelCase(modelName)}UpdateSchema.safeParse(formJson);
  
  if (!result.success) {
    // Retourner les erreurs de validation
    return json<ActionData>({
      success: false,
      errors: result.error.formErrors.fieldErrors,
      formErrors: result.error.formErrors.formErrors,
    });
  }
  
  // Mettre à jour le ${modelName}
  try {
    const ${this.camelCase(modelName)} = await update${modelName}(id, result.data);
    return redirect(\`/admin/${this.kebabCase(modelName)}s/\${${this.camelCase(modelName)}.id}\`);
  } catch (error) {
    return json<ActionData>({
      success: false,
      formErrors: [error.message || 'Une erreur est survenue lors de la mise à jour.'],
    });
  }
};

// Composant de la page
export default function Edit${modelName}Page() {
  const { ${this.camelCase(modelName)} } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const [formData, setFormData] = useState<Partial<${modelName}Update>>({});
  
  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    setFormData(${this.camelCase(modelName)});
  }, [${this.camelCase(modelName)}]);
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button to={\`/admin/${this.kebabCase(modelName)}s/\${${this.camelCase(modelName)}.id}\`} variant="ghost" className="inline-flex items-center">
          <ChevronLeftIcon className="w-5 h-5 mr-1" /> Retour au détail
        </Button>
        <h1 className="text-2xl font-bold ml-4">Modifier ${modelName}: {${this.camelCase(modelName)}.name || ${this.camelCase(modelName)}.id}</h1>
      </div>
      
      {actionData?.formErrors && actionData.formErrors.length > 0 && (
        <Alert variant="error">
          <ul className="list-disc list-inside">
            {actionData.formErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}
      
      <Form method="post" onSubmit={handleSubmit}>
        <${modelName}Form
          data={formData}
          errors={actionData?.errors}
          onChange={handleChange}
          isEdit
        />
        
        <div className="mt-6 flex justify-end">
          <Button to={\`/admin/${this.kebabCase(modelName)}s/\${${this.camelCase(modelName)}.id}\`} variant="outline" className="mr-2">
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            Mettre à jour
          </Button>
        </div>
      </Form>
    </div>
  );
}
`;
    
    await fs.writeFile(routePath, routeContent, 'utf8');
  }

  /**
   * Génère un loader Remix pour un modèle
   */
  private async generateLoader(modelName: string): Promise<void> {
    const loaderDir = path.join(this.options.remixDir, 'loaders');
    await fs.mkdir(loaderDir, { recursive: true });
    
    const loaderPath = path.join(loaderDir, `${this.kebabCase(modelName)}s.server.ts`);
    
    const loaderContent = `import { ${modelName}Create, ${modelName}Update } from '~/schemas/${this.kebabCase(modelName)}';

/**
 * Récupère tous les ${modelName}s avec pagination et filtres
 */
export async function load${modelName}s(options: {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}) {
  const { page = 1, limit = 10, search = '', orderBy = 'createdAt', order = 'desc' } = options;
  
  const response = await fetch(\`\${process.env.API_URL}/${this.camelCase(modelName)}s?page=\${page}&limit=\${limit}&search=\${search}&orderBy=\${orderBy}&order=\${order}\`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${process.env.API_TOKEN}\`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la récupération des ${modelName}s');
  }
  
  return response.json();
}

/**
 * Récupère un ${modelName} par son ID
 */
export async function load${modelName}(id: string) {
  const response = await fetch(\`\${process.env.API_URL}/${this.camelCase(modelName)}s/\${id}\`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${process.env.API_TOKEN}\`
    }
  });
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || \`Erreur lors de la récupération du ${modelName}\`);
  }
  
  return response.json();
}

/**
 * Crée un nouveau ${modelName}
 */
export async function create${modelName}(data: ${modelName}Create) {
  const response = await fetch(\`\${process.env.API_URL}/${this.camelCase(modelName)}s\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${process.env.API_TOKEN}\`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la création du ${modelName}');
  }
  
  return response.json();
}

/**
 * Met à jour un ${modelName}
 */
export async function update${modelName}(id: string, data: ${modelName}Update) {
  const response = await fetch(\`\${process.env.API_URL}/${this.camelCase(modelName)}s/\${id}\`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${process.env.API_TOKEN}\`
    },
    body: JSON.stringify(data)
  });
  
  if (response.status === 404) {
    throw new Error('${modelName} non trouvé');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la mise à jour du ${modelName}');
  }
  
  return response.json();
}

/**
 * Supprime un ${modelName}
 */
export async function delete${modelName}(id: string) {
  const response = await fetch(\`\${process.env.API_URL}/${this.camelCase(modelName)}s/\${id}\`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${process.env.API_TOKEN}\`
    }
  });
  
  if (response.status === 404) {
    throw new Error('${modelName} non trouvé');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la suppression du ${modelName}');
  }
  
  return { success: true };
}
`;
    
    await fs.writeFile(loaderPath, loaderContent, 'utf8');
  }

  /**
   * Convertit une chaîne en kebab-case (pour les noms de fichiers)
   */
  private kebabCase(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Convertit une chaîne en camelCase (pour les variables)
   */
  private camelCase(input: string): string {
    return input.charAt(0).toLowerCase() + input.slice(1);
  }
}

/**
 * Fonction principale
 */
async function main() {
  const options = {
    schemaPath: process.env.SCHEMA_PATH || './prisma/schema.prisma',
    outputDir: process.env.OUTPUT_DIR || './packages/prisma-output',
    nestjsDir: process.env.NESTJS_DIR || './packages/backend/src/modules',
    remixDir: process.env.REMIX_DIR || './packages/frontend/app',
    generateTypes: process.env.GENERATE_TYPES !== 'false',
    generateDtos: process.env.GENERATE_DTOS !== 'false',
    generateZod: process.env.GENERATE_ZOD !== 'false',
    generateMappers: process.env.GENERATE_MAPPERS !== 'false',
    generateServices: process.env.GENERATE_SERVICES !== 'false',
    generateControllers: process.env.GENERATE_CONTROLLERS !== 'false',
    generateRoutes: process.env.GENERATE_ROUTES !== 'false',
    generateLoaders: process.env.GENERATE_LOADERS !== 'false'
  };
  
  try {
    const agent = new PrismaToDto(options);
    await agent.run();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exporter la classe et la fonction principale
export { PrismaToDto, main };

// Exécuter la fonction principale si le script est appelé directement
if (require.main === module) {
  main();
}