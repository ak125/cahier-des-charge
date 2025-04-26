/**
 * Exemple d'utilisation du serveur MCP PostgreSQL dans un workflowDotn8N
 * 
 * Ce fichier montre comment utiliser le serveur MCP PostgreSQL dans un workflowDotn8N
 * pour analyser une base de données PostgreSQL et générer des modèles Prisma.
 */

// Exemple de configuration dansDotn8N - Workflow JSON
constDotn8NWorkflowExample = {
  "nodes": [
    {
      "parameters": {
        "command": "npx -y @modelcontextprotocol/server-postgres postgresql://user:password@host:port/database --export-schema schema_map.json"
      },
      "name": "Export PostgreSQL Schema",
      "type": Dotn8N-nodes-base.executeCommand",
      "position": [600, 300]
    },
    {
      "parameters": {
        "path": "schema_map.json",
        "options": {}
      },
      "name": "Read Schema Map",
      "type": Dotn8N-nodes-base.readBinaryFile",
      "position": [800, 300]
    },
    {
      "parameters": {
        "authentication": "basicAuth",
        "url": "http://localhost:3050DoDotmcp",
        "method": "POST",
        "bodyParametersUi": {
          "parameter": [
            {
              "name": "tool",
              "value": "suggest_prisma_model"
            },
            {
              "name": "params",
              "value": "={{ {\"tableName\": \"users\"} }}"
            }
          ]
        }
      },
      "name": "Generate Prisma Model",
      "type": Dotn8N-nodes-base.httpRequest",
      "position": [1000, 300]
    },
    {
      "parameters": {
        "operation": "write",
        "path": "models/user.prisma",
        "content": "={{ $json.data.schema }}"
      },
      "name": "Save Prisma Model",
      "type": Dotn8N-nodes-base.fileOperations",
      "position": [1200, 300]
    },
    {
      "parameters": {
        "url": "={{ $node[\"GitHub Integration\"].json.data.url }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{ $env.GITHUB_TOKEN }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "name": "Push to GitHub",
      "type": Dotn8N-nodes-base.httpRequest",
      "position": [1400, 300]
    }
  ],
  "connections": {
    "Export PostgreSQL Schema": {
      "main": [
        [
          {
            "node": "Read Schema Map",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Read Schema Map": {
      "main": [
        [
          {
            "node": "Generate Prisma Model",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate Prisma Model": {
      "main": [
        [
          {
            "node": "Save Prisma Model",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Save Prisma Model": {
      "main": [
        [
          {
            "node": "Push to GitHub",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

// Exemple d'intégration avec Claude Desktop (DoDotmcp.json)
constDoDotmcpConfig = {
  DoDotmcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost:5432/yourdb"]
    }
  }
};

// Exemple d'appel d'outil MCP via requête HTTP
const httpRequestExample = `
# Exemple d'appel d'outil via curl
curl -X POST http://localhost:3050DoDotmcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "describe_table",
    "params": {
      "tableName": "users"
    }
  }'

# Exemple de réponse
{
  "success": true,
  "data": {
    "name": "users",
    "schema": "public",
    "columns": {
      "id": {
        "name": "id",
        "type": "uuid",
        "nullable": false,
        "isPrimary": true,
        "isUnique": true,
        "defaultValue": "gen_random_uuid()"
      },
      "email": {
        "name": "email",
        "type": "character varying",
        "maxLength": 255,
        "nullable": false,
        "isPrimary": false,
        "isUnique": true
      },
      "created_at": {
        "name": "created_at",
        "type": "timestamp with time zone",
        "nullable": false,
        "isPrimary": false,
        "isUnique": false,
        "defaultValue": "now()"
      }
    },
    "primaryKey": ["id"],
    "indexes": [
      {
        "name": "users_pkey",
        "columns": ["id"],
        "isUnique": true,
        "type": "btree"
      },
      {
        "name": "users_email_idx",
        "columns": ["email"],
        "isUnique": true,
        "type": "btree"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-04-12T10:15:30.456Z",
    "duration": 42,
    "tool": "describe_table",
    "params": {
      "tableName": "users"
    }
  }
}
`;

// Exemple de schema_map.json
const schemaMapExample = {
  "name": "PostgreSQL Schema (public)",
  "timestamp": "2025-04-12T10:15:30.456Z",
  "tables": {
    "users": {
      "name": "users",
      "schema": "public",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "isPrimary": true,
          "isUnique": true,
          "defaultValue": "gen_random_uuid()"
        },
        "email": {
          "name": "email",
          "type": "character varying",
          "maxLength": 255,
          "nullable": false,
          "isPrimary": false,
          "isUnique": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "nullable": false,
          "isPrimary": false,
          "isUnique": false,
          "defaultValue": "now()"
        }
      },
      "primaryKey": ["id"],
      "indexes": [
        {
          "name": "users_pkey",
          "columns": ["id"],
          "isUnique": true,
          "type": "btree"
        },
        {
          "name": "users_email_idx",
          "columns": ["email"],
          "isUnique": true,
          "type": "btree"
        }
      ]
    },
    "sessions": {
      "name": "sessions",
      "schema": "public",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "isPrimary": true,
          "isUnique": true,
          "defaultValue": "gen_random_uuid()"
        },
        "user_id": {
          "name": "user_id",
          "type": "uuid",
          "nullable": false,
          "isPrimary": false,
          "isUnique": false
        },
        "token": {
          "name": "token",
          "type": "character varying",
          "maxLength": 255,
          "nullable": false,
          "isPrimary": false,
          "isUnique": true
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "nullable": false,
          "isPrimary": false,
          "isUnique": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "nullable": false,
          "isPrimary": false,
          "isUnique": false,
          "defaultValue": "now()"
        }
      },
      "primaryKey": ["id"],
      "indexes": [
        {
          "name": "sessions_pkey",
          "columns": ["id"],
          "isUnique": true,
          "type": "btree"
        },
        {
          "name": "sessions_token_idx",
          "columns": ["token"],
          "isUnique": true,
          "type": "btree"
        },
        {
          "name": "sessions_user_id_idx",
          "columns": ["user_id"],
          "isUnique": false,
          "type": "btree"
        }
      ]
    }
  },
  "foreignKeys": [
    {
      "name": "fk_sessions_user_id",
      "sourceTable": "sessions",
      "sourceColumns": ["user_id"],
      "targetTable": "users",
      "targetColumns": ["id"],
      "onDelete": "CASCADE",
      "onUpdate": "NO ACTION"
    }
  ]
};

// Exemple de schema_migration_diff.json
const schemaMigrationDiffExample = {
  "timestamp": "2025-04-12T10:15:30.456Z",
  "sourceName": "MySQL Schema (old_db)",
  "targetName": "PostgreSQL Schema (public)",
  "changes": [
    {
      "type": "table_added",
      "tableName": "api_tokens",
      "impact": "medium",
      "description": "La table api_tokens existe dans le schéma cible mais pas dans la source"
    },
    {
      "type": "column_type_changed",
      "tableName": "users",
      "columnName": "id",
      "oldValue": "INT",
      "newValue": "uuid",
      "impact": "high",
      "description": "Le type de la colonne users.id a changé: INT -> uuid"
    },
    {
      "type": "column_constraint_changed",
      "tableName": "sessions",
      "columnName": "expires_at",
      "oldValue": "NULL",
      "newValue": "NOT NULL",
      "impact": "medium",
      "description": "La contrainte de nullabilité de sessions.expires_at a changé: NULL -> NOT NULL"
    },
    {
      "type": "foreign_key_added",
      "tableName": "sessions",
      "foreignKeyName": "fk_sessions_user_id",
      "impact": "low",
      "description": "La clé étrangère fk_sessions_user_id (sessions.user_id -> users.id) existe dans le schéma cible mais pas dans la source"
    }
  ],
  "statistics": {
    "total": 4,
    "tables": {
      "added": 1,
      "removed": 0,
      "modified": 2
    },
    "columns": {
      "added": 0,
      "removed": 0,
      "typeChanged": 1,
      "constraintChanged": 1
    },
    "indexes": {
      "added": 0,
      "removed": 0
    },
    "foreignKeys": {
      "added": 1,
      "removed": 0
    }
  }
};

// Exemple de modèle Prisma généré
const prismaModelExample = `model User {
  id        String    @id @default(uuid())
  email     String    @unique
  createdAt DateTime  @default(now()) @map("created_at")
  sessions  Session[]
  
  @@map("users")
}

model Session {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@map("sessions")
}`;

// Exportation des exemples pour documentation
export {
 Dotn8NWorkflowExample,
 DoDotmcpConfig,
  httpRequestExample,
  schemaMapExample,
  schemaMigrationDiffExample,
  prismaModelExample
};