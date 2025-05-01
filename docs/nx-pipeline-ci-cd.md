# Guide d'utilisation de NX dans les pipelines CI/CD

Ce document explique comment configurer et utiliser NX dans vos pipelines d'intégration continue et de déploiement continu (CI/CD).

## Introduction

Depuis la migration de Taskfile vers NX, tous les pipelines CI/CD doivent utiliser NX pour exécuter les tâches d'automatisation. Ce guide vous explique comment mettre à jour ou créer des pipelines CI/CD avec NX.

## Exemples de configurations CI/CD avec NX

### GitHub Actions

```yaml
name: CI avec NX

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Important pour NX pour comprendre quels fichiers ont changé
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: NX Lint affected
        run: npx nx affected --target=lint --parallel=3
      
      - name: NX Test affected
        run: npx nx affected --target=test --parallel=2 --ci
      
      - name: NX Build affected
        run: npx nx affected --target=build

      # Migration spécifique
      - name: Migration Test Batch
        run: npx nx run migrate:batch -- --count=5
      
      # Audit
      - name: Code Audit
        run: npx nx run audit:code
      
      # Docker operations
      - name: Docker Check
        run: npx nx run docker:up
```

### Gitlab CI

```yaml
stages:
  - install
  - lint
  - test
  - build
  - deploy

variables:
  NX_BRANCH: $CI_COMMIT_REF_NAME

# Installation des dépendances
install:
  stage: install
  script:
    - npm ci
  cache:
    paths:
      - node_modules/
  artifacts:
    paths:
      - node_modules/

# Linting
lint:
  stage: lint
  script:
    - npx nx affected:lint --parallel=3
  dependencies:
    - install

# Tests
test:
  stage: test
  script:
    - npx nx affected:test --parallel=2 --ci
  dependencies:
    - install

# Build
build:
  stage: build
  script:
    - npx nx affected:build
  dependencies:
    - install
  artifacts:
    paths:
      - dist/

# Audit
audit:
  stage: test
  script:
    - npx nx run audit:code
    - npx nx run audit:seo
  dependencies:
    - install
  allow_failure: true

# Déploiement
deploy:
  stage: deploy
  script:
    - npx nx run ci:deploy
  dependencies:
    - build
  only:
    - main
```

### Jenkins Pipeline

```groovy
pipeline {
    agent {
        docker {
            image 'node:18'
        }
    }
    
    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npx nx run lint'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npx nx run test'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npx nx run build'
            }
        }
        
        stage('Audit') {
            steps {
                sh 'npx nx run audit:code'
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'npx nx run ci:check'
            }
        }
    }
    
    post {
        always {
            junit 'reports/**/*.xml'
        }
    }
}
```

## Avantages de NX dans le CI/CD

### 1. Construction affectée

NX permet de ne construire que les projets qui ont été affectés par les changements :

```bash
npx nx affected --target=build
```

Cela accélère considérablement les builds CI en ne construisant que ce qui est nécessaire.

### 2. Tests affectés

De même, vous pouvez exécuter uniquement les tests pour les projets affectés :

```bash
npx nx affected --target=test
```

### 3. Exécution en parallèle

NX peut exécuter des tâches en parallèle pour augmenter la vitesse :

```bash
npx nx affected --target=test --parallel=3
```

### 4. Mise en cache

NX met en cache les résultats des builds précédents, ce qui accélère considérablement les builds ultérieurs. Pour activer le cache distant dans CI :

```bash
npx nx connect-to-nx-cloud
```

## Migration des pipelines existants

Pour migrer un pipeline existant :

1. Remplacez toutes les commandes `task` par `npx nx run` avec le nom de la tâche correspondante
2. Utilisez `npx nx affected` lorsque c'est possible pour n'exécuter que les tâches nécessaires
3. Assurez-vous d'utiliser la bonne syntaxe pour les paramètres (`--` pour séparer les arguments)

### Exemple de migration

**Avant (Taskfile) :**
```yaml
- run: task migrate -- controllers/UserController.php
- run: task docker:up
- run: task audit:code
```

**Après (NX) :**
```yaml
- run: npx nx run migrate -- --path=controllers/UserController.php
- run: npx nx run docker:up
- run: npx nx run audit:code
```

## Utilisation de l'orchestrateur standardisé dans les pipelines

Si vous avez besoin d'utiliser notre nouvel orchestrateur standardisé dans un pipeline CI/CD, vous pouvez créer un script Node.js qui utilise l'API comme suit :

```javascript
// ci-workflow.js
const { standardizedOrchestrator, TaskType } = require('./src/orchestration/standardized-orchestrator');

async function runCIWorkflow() {
  try {
    // Planifier une tâche d'analyse
    const analysisTaskId = await standardizedOrchestrator.scheduleTask(
      'code-analysis',
      {
        repository: process.env.CI_REPOSITORY_URL,
        branch: process.env.CI_COMMIT_REF_NAME,
        commit: process.env.CI_COMMIT_SHA
      },
      {
        taskType: TaskType.SIMPLE,
        priority: 1
      }
    );
    
    console.log(`Tâche d'analyse planifiée: ${analysisTaskId}`);
    
    // Attendre que la tâche soit terminée
    let status = await standardizedOrchestrator.getTaskStatus(analysisTaskId);
    while (status.status !== 'COMPLETED' && status.status !== 'FAILED') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      status = await standardizedOrchestrator.getTaskStatus(analysisTaskId);
    }
    
    if (status.status === 'FAILED') {
      throw new Error(`La tâche d'analyse a échoué: ${status.error}`);
    }
    
    console.log('Analyse terminée avec succès');
    
  } catch (error) {
    console.error('Erreur dans le workflow CI:', error);
    process.exit(1);
  }
}

runCIWorkflow();
```

Puis utilisez-le dans votre pipeline :

```yaml
- name: Run CI Workflow
  run: node ci-workflow.js
```

## Bonnes pratiques

1. **Utilisez le cache NX** pour accélérer les builds
2. **Parallélisez les tâches** quand c'est possible
3. **Limitez le scope** avec `affected` pour ne construire que ce qui est nécessaire
4. **Extrayez vos scripts CI complexes** dans des fichiers JS/TS et appelez-les avec `npx nx run`
5. **Configurez des alertes** en cas d'échec de la CI

## Ressources supplémentaires

- [Documentation NX sur le CI](https://nx.dev/ci/intro/ci-setup)
- [Optimisation des pipelines CI avec NX](https://nx.dev/ci/recipes)
- [Guide d'utilisation de NX](docs/nx-usage-guide.md)