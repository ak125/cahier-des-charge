import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UseZodValidation, ZodValidationPipe, createZodDto } from '@nestjs/zod-validation';
import { 
  Product, 
  ProductCreate, 
  ProductCreateSchema, 
  ProductUpdate, 
  ProductUpdateSchema 
} from '@schemas/zod-schemas';
import { ProductService } from './product.service';

// Classes DTO pour Swagger (basées sur nos schémas Zod)
export class ProductCreateDto extends createZodDto(ProductCreateSchema) {}
export class ProductUpdateDto extends createZodDto(ProductUpdateSchema) {}

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  @ApiBody({ type: ProductCreateDto })
  @ApiResponse({ status: 201, description: 'Produit créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  // Méthode 1: Utilisation du pipe pour valider le corps de la requête
  createProduct(@Body(new ZodValidationPipe(ProductCreateSchema)) product: ProductCreate): Promise<Product> {
    return this.productService.create(product);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les produits' })
  @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès' })
  findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un produit par son ID' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Produit récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiBody({ type: ProductUpdateDto })
  @ApiResponse({ status: 200, description: 'Produit mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  // Méthode 2: Utilisation du décorateur pour valider le corps de la requête
  @UseZodValidation(ProductUpdateSchema)
  updateProduct(
    @Param('id') id: string,
    @Body() product: ProductUpdate
  ): Promise<Product> {
    return this.productService.update(id, product);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Produit supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  remove(@Param('id') id: string): Promise<void> {
    return this.productService.remove(id);
  }
}