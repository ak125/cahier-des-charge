# 🧪 Tests unitaires et d'intégration

Les tests permettent de garantir que chaque **composant NestJS et Remix** fonctionne correctement de manière isolée (tests unitaires) et que l'ensemble du système fonctionne en coordination (tests d'intégration / E2E).

## 📝 Vue d'ensemble

Dans le contexte de migration de PHP vers NestJS/Remix, les tests sont particulièrement critiques pour:
- Vérifier que la logique métier a été correctement transposée
- S'assurer que les nouvelles implémentations respectent les spécifications fonctionnelles
- Identifier les régressions potentielles
- Faciliter les futures évolutions du code

Cette stratégie de test s'appuie sur plusieurs niveaux de validation, de l'unité individuelle à l'application complète.

## 🔍 1. Tests unitaires

- Cible : **Services NestJS, Loaders Remix, Fonctions utilitaires**
- Outils : `Jest`, `vitest`, `supertest` pour les routes HTTP
- Générés automatiquement par `test-writer.ts`

### Agents et génération automatique

| Agent | Rôle | Fichiers générés |
|-------|------|------------------|
| `test-writer.ts` | Générer tests unitaires pour chaque module | `*.spec.ts`, `*.e2e.ts` |
| `diff-validator.ts` | Vérifie que la logique migrée reste fidèle | `verification_report.json` |
| `qa-checklist.ts` | Génère checklist de QA automatique & manuelle | `fiche.qa.md` |
| `migration-confirm.ts` | Valide les tests avant de merger | `confirmed_files.json` |

### Processus de génération des tests

```mermaid
graph TD
    A[Code source PHP] --> B[Code migré NestJS/Remix]
    B --> C[test-writer.ts]
    C --> D[Analyse du code]
    D --> E[Identification des cas de test]
    E --> F[Génération des tests unitaires]
    F --> G[*.spec.ts]
    B --> H[diff-validator.ts]
    H --> I[Comparaison avec PHP]
    I --> J[Vérification de logique]
    J --> K[verification_report.json]
```

### Tests unitaires pour les services NestJS

```typescript
// Exemple de test unitaire généré pour un service NestJS
// /src/products/products.service.spec.ts

import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get<ProductsService>(ProductsService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('findById', () => {
    it('should return a product when valid id is provided', async () => {
      // Données de test
      const testProduct = { id: 1, name: 'Test Product', price: 99.99 };
      
      // Configuration du mock
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(testProduct);

      // Exécution du test
      const result = await service.findById('1');

      // Assertions
      expect(result).toEqual(testProduct);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      // Configuration du mock pour simuler un produit non trouvé
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      // Assertion que l'appel à la méthode lève une exception
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  // Autres tests pour create, update, delete, etc.
});
```

### Tests unitaires pour les loaders Remix

```typescript
// Exemple de test unitaire pour un loader Remix
// /app/routes/products.$id.test.ts

import { loader } from './products.$id';
import { createRemixStub } from '@remix-run/testing';
import { json } from '@remix-run/node';

// Mock des dépendances
jest.mock('~/utils/api.server', () => ({
  get: jest.fn(),
}));

import { get } from '~/utils/api.server';

describe('Product loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load product data correctly', async () => {
    // Données de test
    const testProduct = { id: '1', name: 'Test Product', price: 99.99 };
    
    // Configuration du mock
    (get as jest.Mock).mockResolvedValue(testProduct);

    // Création d'un stub Remix pour tester le loader
    const remix = createRemixStub([
      {
        path: '/products/:id',
        loader,
      },
    ]);

    // Exécution du test
    const response = await remix.loader({ params: { id: '1' } });
    const data = await response.json();

    // Assertions
    expect(get).toHaveBeenCalledWith('/products/1');
    expect(data).toEqual({ product: testProduct });
  });

  it('should handle errors when product not found', async () => {
    // Configuration du mock pour simuler une erreur
    (get as jest.Mock).mockRejectedValue(
      json({ message: 'Product not found' }, { status: 404 })
    );

    // Création d'un stub Remix
    const remix = createRemixStub([
      {
        path: '/products/:id',
        loader,
      },
    ]);

    // Assertion que le loader propage l'erreur
    await expect(
      remix.loader({ params: { id: '999' } })
    ).rejects.toEqual(
      expect.objectContaining({
        status: 404,
        data: expect.objectContaining({ message: 'Product not found' }),
      })
    );
  });
});
```

### Tests unitaires pour les composants Remix

```typescript
// Exemple de test unitaire pour un composant Remix
// /app/components/ProductCard.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    imageUrl: '/images/test.jpg',
    description: 'A test product'
  };

  it('renders product information correctly', () => {
    // Rendu du composant avec le routeur pour gérer les liens
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    // Vérification que les informations du produit sont affichées
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toHaveAttribute('src', '/images/test.jpg');
  });

  it('navigates to product details on click', async () => {
    const user = userEvent.setup();
    
    // Rendu du composant
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    // Récupération du lien et simulation d'un clic
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/1');
    
    // Vérification que l'événement a été déclenché
    await user.click(link);
  });
});
```

## 🔄 2. Tests d'intégration

Les tests d'intégration vérifient que les différents composants du système fonctionnent correctement ensemble.

### Tests d'intégration pour NestJS

```typescript
// Exemple de test d'intégration pour un contrôleur NestJS
// /src/products/products.controller.spec.ts

import { Test } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get<ProductsController>(ProductsController);
    service = moduleRef.get<ProductsService>(ProductsService);
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const products = [
        { id: 1, name: 'Product 1', price: 10 },
        { id: 2, name: 'Product 2', price: 20 },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(products);

      expect(await controller.findAll()).toBe(products);
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      const product = { id: 1, name: 'Product 1', price: 10 };
      jest.spyOn(service, 'findById').mockResolvedValue(product);

      expect(await controller.findOne('1')).toBe(product);
      expect(service.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when product not found', async () => {
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createDto: CreateProductDto = { name: 'New Product', price: 30 };
      const newProduct = { id: 3, ...createDto };
      
      jest.spyOn(service, 'create').mockResolvedValue(newProduct);

      expect(await controller.create(createDto)).toBe(newProduct);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });
});
```

### Tests API NestJS avec SuperTest

```typescript
// Exemple de test API pour NestJS avec SuperTest
// /test/products.e2e-spec.ts

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  
  // Configuration de l'application de test
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    
    prismaService = app.get<PrismaService>(PrismaService);
    
    // Nettoyer la base de test avant de commencer
    await prismaService.product.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /products', () => {
    beforeEach(async () => {
      // Créer des produits de test
      await prismaService.product.createMany({
        data: [
          { name: 'Product 1', price: 10 },
          { name: 'Product 2', price: 20 },
        ],
      });
    });

    afterEach(async () => {
      // Nettoyer après chaque test
      await prismaService.product.deleteMany();
    });

    it('should return all products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('price');
        });
    });
  });

  describe('GET /products/:id', () => {
    let testProductId: number;

    beforeEach(async () => {
      // Créer un produit de test
      const product = await prismaService.product.create({
        data: { name: 'Test Product', price: 99.99 },
      });
      testProductId = product.id;
    });

    afterEach(async () => {
      await prismaService.product.deleteMany();
    });

    it('should return a product by id', () => {
      return request(app.getHttpServer())
        .get(`/products/${testProductId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Test Product');
          expect(res.body.price).toBe(99.99);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/999')
        .expect(404);
    });
  });

  describe('POST /products', () => {
    it('should create a new product', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({ name: 'New Product', price: 49.99 })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('New Product');
          expect(res.body.price).toBe(49.99);
          expect(res.body).toHaveProperty('id');
        });
    });

    it('should validate input data', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({ name: '', price: -10 })
        .expect(400);
    });
  });
});
```

## 🌐 3. Tests End-to-End (E2E)

Les tests E2E simulent l'interaction utilisateur avec l'application complète.

### Tests E2E avec Playwright

```typescript
// Exemple de test E2E avec Playwright
// /tests/e2e/product-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Product workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Vérifier que l'utilisateur est connecté
    await expect(page.locator('.user-profile')).toBeVisible();
  });

  test('user can browse products and add to cart', async ({ page }) => {
    // Aller à la page des produits
    await page.goto('/products');
    
    // Vérifier que la liste des produits est chargée
    await expect(page.locator('.product-card')).toHaveCount(10, { timeout: 5000 });
    
    // Cliquer sur un produit
    await page.click('.product-card:first-child a');
    
    // Vérifier que la page de détail du produit est chargée
    await expect(page.locator('h1.product-title')).toBeVisible();
    
    // Ajouter au panier
    await page.fill('input[name="quantity"]', '2');
    await page.click('button.add-to-cart');
    
    // Vérifier la notification de confirmation
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Produit ajouté au panier');
    
    // Vérifier que le compteur du panier a été mis à jour
    await expect(page.locator('.cart-counter')).toContainText('2');
    
    // Aller au panier
    await page.click('.cart-icon');
    
    // Vérifier que le produit est dans le panier
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item-quantity')).toContainText('2');
  });

  test('user can search for products', async ({ page }) => {
    await page.goto('/');
    
    // Rechercher un produit
    await page.fill('input[name="search"]', 'chaise');
    await page.press('input[name="search"]', 'Enter');
    
    // Vérifier les résultats de recherche
    await expect(page.url()).toContain('/search?q=chaise');
    await expect(page.locator('.search-results')).toBeVisible();
    await expect(page.locator('.product-card')).toHaveCount(3, { timeout: 5000 });
    
    // Vérifier que les résultats contiennent le terme recherché
    const titles = await page.locator('.product-card h2').allTextContents();
    expect(titles.some(title => title.toLowerCase().includes('chaise'))).toBeTruthy();
  });

  test('checkout process works correctly', async ({ page }) => {
    // Ajouter un produit au panier
    await page.goto('/products/1');
    await page.click('button.add-to-cart');
    
    // Aller au panier
    await page.click('.cart-icon');
    
    // Vérifier que le produit est dans le panier
    await expect(page.locator('.cart-item')).toHaveCount(1);
    
    // Procéder au paiement
    await page.click('button.checkout');
    
    // Remplir le formulaire d'adresse
    await page.fill('input[name="address.street"]', '123 Test Street');
    await page.fill('input[name="address.city"]', 'Test City');
    await page.fill('input[name="address.zip"]', '12345');
    await page.click('button.next-step');
    
    // Choisir la méthode de paiement
    await page.click('input[name="paymentMethod"][value="card"]');
    await page.click('button.next-step');
    
    // Remplir les informations de carte (dans un environnement de test)
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="cardExpiry"]', '12/25');
    await page.fill('input[name="cardCvc"]', '123');
    
    // Finaliser la commande
    await page.click('button.place-order');
    
    // Vérifier la confirmation de commande
    await expect(page.locator('.order-confirmation')).toBeVisible();
    await expect(page.locator('.order-confirmation')).toContainText('Commande confirmée');
    
    // Vérifier que le panier est vide
    await expect(page.locator('.cart-counter')).toContainText('0');
  });
});
```

## 🤖 4. Automatisation des tests

### Configuration CI/CD

```yaml
# /.github/workflows/test.yml

name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate Prisma client
        run: npx prisma generate
        
      - name: Setup test database
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          
      - name: Lint
        run: npm run lint
        
      - name: Unit Tests
        run: npm run test
        
      - name: Integration Tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          
      - name: E2E Tests
        run: npm run test:playwright
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
```

### Rapport de validation de diff

L'agent `diff-validator.ts` génère un rapport détaillé comparant la logique PHP d'origine avec la nouvelle implémentation:

```json
// Exemple de rapport verification_report.json
{
  "summary": {
    "originalFile": "product.php",
    "migratedFile": "product.service.ts",
    "logicalEquivalence": 94.5,
    "dataHandlingEquivalence": 97.2,
    "securityEquivalence": 100.0,
    "overallStatus": "SUCCESS_WITH_WARNINGS"
  },
  "details": {
    "logicDifferences": [
      {
        "location": "getProductById",
        "originalCode": "if (!$result || mysqli_num_rows($result) === 0) { return null; }",
        "migratedCode": "if (!product) { throw new NotFoundException(); }",
        "impact": "BEHAVIOR_CHANGE",
        "explanation": "L'original renvoie null, la version migrée lance une exception",
        "recommendation": "Acceptable - l'exception est gérée par le contrôleur"
      }
    ],
    "dataHandling": [
      {
        "location": "createProduct",
        "originalCode": "$stmt->bind_param(\"ssd\", $name, $description, $price);",
        "migratedCode": "data: { name, description, price }",
        "impact": "NONE",
        "explanation": "Prisma gère automatiquement les types et l'échappement"
      }
    ],
    "security": [
      {
        "location": "password handling",
        "originalCode": "password_hash($password, PASSWORD_DEFAULT)",
        "migratedCode": "await bcrypt.hash(password, 10)",
        "impact": "NONE",
        "explanation": "Les deux méthodes sont sécurisées"
      }
    ]
  },
  "testCoverage": {
    "originalFunctions": 8,
    "migratedFunctions": 8,
    "coveredByTests": 8,
    "coverage": 100.0
  },
  "recommendations": [
    "Revoir la gestion des erreurs pour FindById pour garantir la cohérence"
  ]
}
```

### Fiche QA générée

L'agent `qa-checklist.ts` génère une checklist pour la validation manuelle:

```markdown
# Fiche QA - Module Produits

## Informations
- **Module**: Produits
- **Date de migration**: 2023-12-14
- **Dev responsable**: Jean Dupont
- **QA assigné**: Marie Martin

## Tests automatisés
- [x] Tests unitaires (34/34 - 100%)
- [x] Tests d'intégration (12/12 - 100%)
- [x] Tests E2E (5/5 - 100%)

## Tests fonctionnels à vérifier manuellement
- [ ] **Liste des produits**
  - [ ] Pagination fonctionne comme en PHP
  - [ ] Filtres produisent les mêmes résultats
  - [ ] Tri fonctionne identiquement
  - [ ] La vue responsive est correcte

- [ ] **Détail produit**
  - [ ] Toutes les informations sont affichées
  - [ ] Les images sont correctement chargées
  - [ ] Les informations de prix s'affichent correctement
  - [ ] Les produits liés sont identiques à la version PHP

- [ ] **Recherche**
  - [ ] Résultats identiques à la version PHP
  - [ ] Suggestions fonctionnent correctement
  - [ ] Recherche avancée donne les mêmes résultats

## Points d'attention particuliers
- Vérifier comportement sur Safari (différence identifiée entre PHP et Remix)
- Tester le comportement des réductions automatiques
- Valider les performances sur mobile

## Résultat des tests
- [ ] **Succès**: Aucun problème identifié
- [ ] **Succès avec réserves**: Problèmes mineurs identifiés
- [ ] **Échec**: Problèmes majeurs identifiés

## Commentaires

_Ajouter vos observations ici_

## Validation
Date: ________________
Signature: ________________
```

## 📈 5. Suivi et reporting

### Tableau de bord de test

Un tableau de bord intégré permet de suivre l'évolution de la couverture des tests:

- **Couverture globale**: Pourcentage de code couvert par les tests
- **Tests en échec**: Liste des tests qui échouent actuellement
- **Tendance**: Évolution de la couverture et des échecs au fil du temps
- **Modules critiques**: Focus sur les modules à haut risque

### Intégration continue

Les tests sont automatiquement exécutés:
- À chaque Pull Request
- À chaque merge dans les branches principales
- Selon un planning nocturne pour les tests complets E2E

Cette stratégie de test complète garantit que la migration de PHP vers NestJS et Remix préserve l'intégrité fonctionnelle de l'application tout en facilitant la détection précoce des problèmes potentiels.
