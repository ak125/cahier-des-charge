# 🏭 Migration des Modules Métier (Génération Automatique et Adaptative)

## 🎯 Objectif

Cette phase applique le modèle IA sur les blocs PHP priorisés pour générer :
- les fichiers Remix (`.tsx`, `loader.ts`, `meta.ts`, etc.)
- les modules NestJS (`controller.ts`, `service.ts`, `dto.ts`, etc.)
- les patchs Prisma
- et les métadonnées SEO/Schema.org

Elle constitue le cœur du processus de migration, transformant les modules métier legacy en composants modernes et optimisés.

## 📊 Agents de génération

| Agent | Rôle | Sorties générées |
|-------|------|------------------|
| `dev-generator.ts` | Générer le code complet côté Remix (frontend) + NestJS (backend) | `*.controller.ts`, `*.service.ts`, `*.dto.ts`, `*.tsx`, etc. |
| `seo-meta-generator.ts` | Générer les balises SEO (`title`, `meta`, `schema.org`, canonical) | `seo_meta.json` |
| `remix-loader-builder.ts` | Générer les fichiers `loader.ts`, `action.ts`, `meta.ts` | `*.tsx`, `loader.ts`, `meta.ts` |
| `prisma-adapter.ts` | Générer le mapping et la conversion des modèles Prisma | `prisma.patch`, `migration.sql`, `schema-updates.prisma` |

## 🔄 Processus de génération adaptative

```mermaid
graph TD
    A[Code PHP Legacy] --> B[Analyse structurelle]
    B --> C{Type de module}
    
    C -->|Module UI| D[dev-generator.ts]
    C -->|Module API| E[dev-generator.ts]
    C -->|Module SEO| F[seo-meta-generator.ts]
    C -->|Module DB| G[prisma-adapter.ts]
    
    D --> H[Génération Frontend]
    E --> I[Génération Backend]
    F --> J[Métadonnées SEO]
    G --> K[Schéma Prisma]
    
    H --> L[remix-loader-builder.ts]
    
    L --> M[Composants TSX]
    L --> N[Loaders/Actions]
    I --> O[Contrôleurs/Services]
    J --> P[Fichiers Meta & SEO]
    K --> Q[Migrations Prisma]
    
    M & N & O & P & Q --> R[Tests automatisés]
    R --> S[Validation/Correction]
    S --> T[Intégration]
    
    style A fill:#f5f5f5,stroke:#666
    style R fill:#d5e8d4,stroke:#82b366
    style S fill:#d5e8d4,stroke:#82b366
    style T fill:#d5e8d4,stroke:#82b366
```

## 📑 Description détaillée des agents

### 1. Agent `dev-generator.ts`

#### Fonctionnalités
- Génération de code TypeScript/React à partir du code PHP legacy
- Transformation des modèles de données et de la logique métier
- Préservation des comportements spécifiques et cas particuliers
- Application des bonnes pratiques modernes (hooks, composants, etc.)

#### Configuration
```json
{
  "sourceFile": "./legacy/products.php",
  "targetDirectory": "./output/products",
  "generationOptions": {
    "framework": {
      "frontend": "remix",
      "backend": "nestjs"
    },
    "preserveComments": true,
    "generateTests": true,
    "splitComponents": true,
    "useHooks": true,
    "typescript": {
      "strict": true,
      "esModules": true
    }
  },
  "outputFormat": "directory"
}
```

#### Exemple de transformation

**PHP Input (legacy):**
```php
class ProductController {
  public function getProduct($id) {
    $db = new Database();
    $product = $db->query("SELECT * FROM products WHERE id = ?", [$id]);
    
    if (!$product) {
      header("HTTP/1.0 404 Not Found");
      echo "Product not found";
      exit;
    }
    
    // Format price with tax
    $product['price_with_tax'] = $product['price'] * 1.2;
    
    return $this->render('product_view.php', ['product' => $product]);
  }
}
```

**TypeScript Output (NestJS):**
```typescript
// product.controller.ts
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const product = await this.productService.findById(id);
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    return product;
  }
}
```

**TypeScript Output (Remix):**
```typescript
// routes/products.$id.tsx
export const loader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const product = await getProduct(params.id);
    return json({ product });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new Response("Product not found", { status: 404 });
    }
    throw error;
  }
};

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();
  
  return (
    <div className="product-page">
      <h1>{product.name}</h1>
      <div className="price">${product.price}</div>
      <div className="price-with-tax">
        With Tax: ${(product.price * 1.2).toFixed(2)}
      </div>
    </div>
  );
}
```

### 2. Agent `seo-meta-generator.ts`

#### Fonctionnalités
- Extraction des métadonnées SEO des fichiers PHP legacy
- Génération des balises title, meta description, robots, etc.
- Création de schémas Schema.org pour un meilleur référencement
- Préservation des URLs canoniques et redirections importantes

#### Configuration
```json
{
  "sourceDirectory": "./legacy",
  "outputFile": "./output/seo_meta.json",
  "preserveCanonicals": true,
  "generateSchemaOrg": true,
  "metaTypes": ["title", "description", "keywords", "robots"],
  "schemaTypes": ["Product", "Article", "Organization"],
  "defaultLanguage": "fr",
  "analyzeTags": true
}
```

#### Exemple de sortie
```json
{
  "routes": {
    "/products/:id": {
      "meta": {
        "title": "{product.name} - Notre boutique",
        "description": "Découvrez {product.name} à partir de {product.price}€. {product.shortDescription}",
        "robots": "index, follow"
      },
      "schemaOrg": {
        "@type": "Product",
        "name": "{product.name}",
        "description": "{product.description}",
        "image": "{product.imageUrl}",
        "offers": {
          "@type": "Offer",
          "price": "{product.price}",
          "priceCurrency": "EUR"
        }
      },
      "canonical": "/products/{product.id}/{product.slug}"
    }
  }
}
```

### 3. Agent `remix-loader-builder.ts`

#### Fonctionnalités
- Génération de loaders et actions Remix à partir de la logique PHP
- Transformation des requêtes SQL en appels d'API et requêtes Prisma
- Gestion des erreurs et validation des formulaires
- Intégration des méta-tags SEO dans la fonction meta

#### Configuration
```json
{
  "sourceFile": "./legacy/product_page.php",
  "targetDirectory": "./output/routes/products",
  "options": {
    "splitByFunction": true,
    "generateTypes": true,
    "errorBoundaries": true,
    "validateForms": true,
    "optimisticUI": true
  },
  "apiEndpoints": {
    "baseUrl": "/api",
    "version": "v1"
  }
}
```

#### Exemple de sortie
```typescript
// loader.ts
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { id } = params;
  
  try {
    // Transformation de requête SQL PHP en appel d'API
    const product = await getProductById(id);
    const relatedProducts = await getRelatedProducts(id, 5);
    
    return json({
      product,
      relatedProducts,
    });
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      throw new Response("Product not found", { status: 404 });
    }
    throw error;
  }
};

// action.ts
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params;
  const formData = await request.formData();
  
  // Validation similaire au PHP
  const quantity = Number(formData.get("quantity"));
  if (isNaN(quantity) || quantity < 1) {
    return json({ error: "Quantity must be at least 1" }, { status: 400 });
  }
  
  try {
    await addToCart(id, quantity);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
};

// meta.ts
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.product) {
    return [{ title: "Product not found" }];
  }
  
  return [
    { title: `${data.product.name} - Store` },
    { name: "description", content: data.product.shortDescription },
    { property: "og:title", content: data.product.name },
    { property: "og:image", content: data.product.imageUrl }
  ];
};
```

### 4. Agent `prisma-adapter.ts`

#### Fonctionnalités
- Génération de modèles Prisma à partir des tables SQL
- Création des migrations pour adapter la base de données
- Préservation des données existantes lors des migrations
- Optimisation du schéma pour les performances

#### Configuration
```json
{
  "sourceSQL": "./legacy/database/schema.sql",
  "targetPrismaSchema": "./prisma/schema.prisma",
  "options": {
    "preserveData": true,
    "generateIndexes": true,
    "optimizeRelations": true,
    "namingConvention": "camelCase",
    "migrationsOutput": "./prisma/migrations"
  },
  "connectionString": "postgresql://user:password@localhost:5432/mydatabase"
}
```

#### Exemple de sortie

**Schema.prisma:**
```prisma
// Patch généré pour schema.prisma
model Product {
  id        Int      @id @default(autoincrement())
  name      String
  slug      String   @unique
  price     Decimal  @db.Decimal(10, 2)
  stock     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  category   Category? @relation(fields: [categoryId], references: [id])
  categoryId Int?
  
  orderItems OrderItem[]
  
  @@index([categoryId])
  @@index([slug])
}
```

**Migration SQL:**
```sql
-- Migration SQL générée
CREATE TABLE "Product" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "price" DECIMAL(10, 2) NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "categoryId" INTEGER
);

-- Copie des données de l'ancienne table vers la nouvelle
INSERT INTO "Product" ("id", "name", "slug", "price", "stock", "createdAt", "updatedAt", "categoryId")
SELECT 
  "product_id", 
  "product_name", 
  "product_slug", 
  "product_price", 
  "product_quantity", 
  "date_added", 
  COALESCE("date_modified", "date_added"), 
  "category_id"
FROM "products";

-- Création des index
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_slug_idx" ON "Product"("slug");
```

## 🧪 Stratégies de test et validation

Pour garantir la fiabilité du code généré, plusieurs niveaux de validation sont appliqués:

### 1. Tests unitaires générés
- Génération automatique de tests pour les contrôleurs, services et composants
- Vérification des transformations de données et des cas limites
- Tests paramétriques pour les variations de comportement

### 2. Tests d'intégration
- Vérification des interactions entre composants frontend et backend
- Tests des flux complets (ex: ajout au panier, checkout)
- Validation des réponses API et rendering des composants

### 3. Tests de régression
- Comparaison des sorties du système legacy et du système migré
- Vérification que les transformations préservent les comportements existants
- Détection automatique des anomalies fonctionnelles

## 📈 Métriques de succès

| Métrique | Cible | Méthode de mesure |
|----------|-------|-------------------|
| Taux de génération réussie | > 95% | Nombre de fichiers générés sans erreur / Nombre total de fichiers |
| Couverture fonctionnelle | > 98% | Fonctionnalités migrées / Fonctionnalités initiales |
| Couverture de tests | > 85% | Lignes de code testées / Total des lignes de code |
| Performance | ≤ 120% du legacy | Temps de réponse comparé au système legacy |
| Précision SEO | 100% | Conservation des balises méta et canoniques |

## 🧑‍💻 Stratégie d'intervention humaine

Malgré l'automatisation poussée, l'intervention humaine reste nécessaire dans certains cas:

1. **Cas complexes**: Logique métier particulièrement intriquée nécessitant une expertise humaine
2. **Décisions d'architecture**: Choix structurels importants impactant la maintenabilité
3. **Optimisation fine**: Améliorations de performance sur les points critiques
4. **Validation finale**: Revue code et approbation avant intégration

Le processus prévoit des points de décision clairement identifiés où les développeurs sont sollicités pour valider ou ajuster le code généré.

Cette phase de migration des modules métier transforme progressivement l'application legacy en une architecture moderne, tout en préservant la logique métier et en améliorant la maintenabilité et les performances.
