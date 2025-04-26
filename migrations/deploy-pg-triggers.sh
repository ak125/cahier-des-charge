#!/bin/bash
# Script pour appliquer la migration SQL des triggers PostgreSQL pour le système NOTIFY
# À exécuter depuis la racine du projet

set -e
echo "🔧 Déploiement des triggers PostgreSQL LISTEN/NOTIFY pour MCP Jobs..."

# Récupération des variables d'environnement (ou utilisation des valeurs par défaut)
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-remix_nestjs_dev}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}

# Affichage des informations de connexion
echo "📊 Connexion à PostgreSQL: $DB_HOST:$DB_PORT/$DB_NAME (user: $DB_USER)"

# Exécution du script SQL
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ./migration-toolkit/mcp-jobs-notify-trigger.sql

# Vérification du résultat
if [ $? -eq 0 ]; then
    echo "✅ Migration SQL appliquée avec succès!"
    echo "🚀 Le système LISTEN/NOTIFY est maintenant configuré pour les jobs MCP."
else
    echo "❌ Erreur lors de l'application de la migration SQL."
    exit 1
fi

# Information supplémentaire
echo "💡 Pour tester, vous pouvez utiliser cette commande:"
echo "   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"UPDATE mcp_jobs SET status = 'done' WHERE job_id = 'test-job-123';\""