# Documentation des Workflows

Document généré le Thu Apr 24 23:49:29 UTC 2025

## GitHub Actions Workflows

### audit-validation.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/audit-validation.yml.disabled`

**Description:**
run: |

**Déclencheurs:**
on:
  pull_request:
    paths:
      - 'reports/audits/**'
      - 'reports/backlogs/**'
      - 'reports/impact_graphs/**'

**Jobs:**
- pull_request
- workflow_dispatch
- validate-audits

### block-merge-on-seo-fail.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/block-merge-on-seo-fail.yml.disabled`

**Description:**
if: steps.seo-analysis.outputs.has_seo_issues == true

**Déclencheurs:**
on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'app/routes/**/*.tsx'
      - 'app/routes/**/*.jsx'

**Jobs:**
- pull_request
- seo-check

### ci-mcp-migration.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/ci-mcp-migration.yml.disabled`

**Description:**
uses: actions/github-script@v6

**Déclencheurs:**
on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'app/routes/**'
      - 'docs/**'

**Jobs:**
- pull_request
- verify-migration

### ci-migration.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/ci-migration.yml.disabled`

**Description:**
*(Pas de description)*

**Déclencheurs:**

**Jobs:**
*(Pas de jobs détectés)*

### dev-check.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/dev-check.yml.disabled`

**Description:**
path: |

**Déclencheurs:**
on:
  push:
    branches: [main, dev]
  workflow_dispatch:

jobs:

**Jobs:**
- push
- workflow_dispatch
- run-dev-checker

### mcp-pipeline-audit.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/mcp-pipeline-audit.yml.disabled`

**Description:**
path: |

**Déclencheurs:**
on:
  # Exécution automatique chaque jour à minuit
  schedule:
    - cron: '0 0 * * *'
  
  # Exécution automatique lors d'un changement sur les fichiers MCPManifest.json

**Jobs:**
- schedule
- push
- workflow_dispatch
- run-pipeline-audit

### mcp-pipeline.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/mcp-pipeline.yml.disabled`

**Description:**
uses: actions/deploy-pages@v2

**Déclencheurs:**
on:
  push:
    branches: [ main, master, dev ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

**Jobs:**
- push
- pull_request
- workflow_dispatch
- analyze-php
- deploy-pages

### mcp-verify.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/mcp-verify.yml.disabled`

**Description:**
run: |

**Déclencheurs:**
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:

**Jobs:**
- push
- pull_request
- workflow_dispatch
- generate-and-verify

### migration-pipeline.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/migration-pipeline.yml.disabled`

**Description:**
if: ${{ github.event.inputs.notify_discord == true && env.DISCORD_WEBHOOK !=  }}

**Déclencheurs:**
on:
  push:
    branches: [ main, master, develop ]
    paths:
      - 'agents/**'
      - 'apps/mcp-server/**'

**Jobs:**
- push
- pull_request
- workflow_dispatch
- schedule
- migration-pipeline

### monitoring.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/monitoring.yml.disabled`

**Description:**
if: ${{ env.PR_NUMBER !=  }}

**Déclencheurs:**
on:
  # Déclenchement automatique après les déploiements de preview
  workflow_run:
    workflows: ["Prévisualisation automatique des PRs"]
    types:
      - completed

**Jobs:**
- workflow_run
- workflow_dispatch
- monitoring

### pipeline-mcp-audit.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/pipeline-mcp-audit.yml.disabled`

**Description:**
path: |

**Déclencheurs:**
on:
  # Exécution automatique chaque jour à minuit
  schedule:
    - cron: '0 0 * * *'
  
  # Exécution automatique lors d'un changement sur les fichiers MCPManifest.json

**Jobs:**
- schedule
- push
- workflow_dispatch
- run-pipeline-audit

### preview.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/preview.yml.disabled`

**Description:**
path: |

**Déclencheurs:**
on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'app/**'
      - 'apps/**'

**Jobs:**
- pull_request
- deploy-preview

### security-checks.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/security-checks.yml.disabled`

**Description:**
if: ${{ env.average_score >= 5.0 }}

**Déclencheurs:**
on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'cahier-des-charges/**'
      - '**/*.php'

**Jobs:**
- pull_request
- analyze-risks

### validate-agents.yml.disabled (**DÉSACTIVÉ**)

**Chemin:** `/workspaces/cahier-des-charge/.github/workflows/validate-agents.yml.disabled`

**Description:**
commit_user_email: mcp-bot@example.com

**Déclencheurs:**
on:
  push:
    paths:
      - 'packages/mcp-agents/**/*.ts'
      - 'agents/**/*.ts'
      - 'apps/mcp-server*/**/*.ts'

**Jobs:**
- push
- pull_request
- validate

## Orchestration Docker

### docker-compose.bullmq.yml

**Chemin:** `/workspaces/cahier-des-charge/orchestration/docker/docker-compose.bullmq.yml`

**Services:**
- redis
- mcp-server
- php-worker
- js-worker
- orchestrator
- remix-frontend
- redis-data

### docker-compose.dev.yml

**Chemin:** `/workspaces/cahier-des-charge/orchestration/docker/docker-compose.dev.yml`

**Services:**
- postgres
- redis
- supabase
- n8n
- mcp-server
- frontend
- backend
- postgres-data
- redis-data
- supabase-data
- n8n-data
- node_modules

### docker-compose.mcp.yml

**Chemin:** `/workspaces/cahier-des-charge/orchestration/docker/docker-compose.mcp.yml`

**Services:**
- redis
- ollama
- mcp-server
- supabase
- temporal-server
- temporal-worker
- trigger-dev
- remix-dashboard
- nestjs-backend
- n8n
- postgres
- pgadmin
- redis-data
- ollama-data
- supabase-data
- postgres-data
- n8n-data
- trigger-data
- pgadmin-data
- mcp-network

### docker-compose.n8n.yml

**Chemin:** `/workspaces/cahier-des-charge/orchestration/docker/docker-compose.n8n.yml`

**Services:**
- n8n
- n8n_data

### docker-compose.yml

**Chemin:** `/workspaces/cahier-des-charge/orchestration/docker/docker-compose.yml`

**Services:**
- mongo
- n8n
- agents-api
- dashboard
- mongo_data
- n8n_data

