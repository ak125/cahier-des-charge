#!/bin/bash
# Script pour tester le système de notifications LISTEN/NOTIFY pour les jobs MCP
# À exécuter depuis la racine du projet

set -e
echo "🧪 Test du système de notifications LISTEN/NOTIFY pour les jobs MCP..."

# Récupération des variables d'environnement (ou utilisation des valeurs par défaut)
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-remix_nestjs_dev}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}

# Générer un ID de job unique pour le test
JOB_ID="test-job-$(date +%s)"
FILE_PATH="/legacy/src/test-${RANDOM}.php"

# Insertion d'un nouveau job
echo "📝 Insertion d'un nouveau job avec l'ID: $JOB_ID..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
INSERT INTO mcp_jobs (job_id, status, file_path, created_at, updated_at) 
VALUES ('$JOB_ID', 'pending', '$FILE_PATH', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"

echo "⏱️ Attente de 3 secondes avant de mettre à jour le statut..."
sleep 3

# Mise à jour du statut pour déclencher la notification
echo "🔄 Mise à jour du statut du job vers 'done'..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
UPDATE mcp_jobs SET status = 'done', 
  result = '{\"success\": true, \"message\": \"Analyse terminée avec succès\", \"timestamp\": \"'$(date -Iseconds)'\"}', 
  updated_at = CURRENT_TIMESTAMP 
WHERE job_id = '$JOB_ID';"

echo "✅ Test terminé! Le système de notification devrait avoir été déclenché."
echo "💡 Vérifiez les logs du serveur NestJS et l'interface utilisateur Remix pour confirmer la réception de la notification."
echo "🔍 Pour voir le job inséré dans la base de données, exécutez:"
echo "   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT * FROM mcp_jobs WHERE job_id = '$JOB_ID';\""