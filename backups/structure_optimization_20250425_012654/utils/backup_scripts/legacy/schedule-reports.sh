#!/bin/bash

# Script pour configurer la planification des rapports automatiques
# Ce script configure les tâches cron pour exécuter generate-reports.js

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Configuration des rapports automatiques de migration =====${NC}"

# Vérifier que le script de génération de rapports existe
if [ ! -f "./scripts/generate-reports.js" ]; then
  echo -e "${RED}Erreur: Le script generate-reports.js n'existe pas dans ./scripts/${NC}"
  exit 1
fi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
  echo -e "${RED}Erreur: Node.js n'est pas installé${NC}"
  exit 1
fi

# Installer les dépendances requises
echo -e "${YELLOW}Installation des dépendances requises...${NC}"
npm install --no-save nodemailer ejs @supabase/supabase-js

# Rendre le script exécutable
chmod +x ./scripts/generate-reports.js

# Chemin absolu vers le projet
PROJECT_PATH=$(pwd)

# Créer un fichier temporaire pour crontab
TEMP_CRONTAB=$(mktemp)

# Exporter la configuration actuelle de crontab
crontab -l > "$TEMP_CRONTAB" 2>/dev/null

# Vérifier si les entrées pour nos rapports existent déjà
if grep -q "generate-reports.js --type=daily" "$TEMP_CRONTAB"; then
  echo -e "${YELLOW}Les tâches cron pour les rapports existent déjà${NC}"
else
  # Ajouter les nouvelles entrées cron
  echo -e "${GREEN}Ajout des tâches cron pour les rapports...${NC}"
  
  # Rapport quotidien à 7h00 du matin
  echo "0 7 * * 1-6 cd $PROJECT_PATH && node scripts/generate-reports.js --type=daily" >> "$TEMP_CRONTAB"
  
  # Rapport hebdomadaire le dimanche à 9h00 du matin
  echo "0 9 * * 0 cd $PROJECT_PATH && node scripts/generate-reports.js --type=weekly" >> "$TEMP_CRONTAB"
  
  # Mettre à jour crontab
  crontab "$TEMP_CRONTAB"
  echo -e "${GREEN}Tâches cron ajoutées avec succès${NC}"
fi

# Supprimer le fichier temporaire
rm "$TEMP_CRONTAB"

echo -e "${GREEN}===== Configuration terminée =====${NC}"
echo -e "Rapports planifiés :"
echo -e "  - ${BLUE}Rapport quotidien${NC} : tous les jours (lundi-samedi) à 7h00"
echo -e "  - ${BLUE}Rapport hebdomadaire${NC} : tous les dimanches à 9h00"
echo -e "  - Les rapports seront sauvegardés dans ${BLUE}$PROJECT_PATH/reports/${NC}"
echo -e ""

# Vérifier la configuration des emails
if [ -z "$EMAIL_USER" ] || [ -z "$EMAIL_PASS" ]; then
  echo -e "${YELLOW}Avertissement: La configuration email n'est pas définie${NC}"
  echo -e "Pour activer l'envoi des rapports par email, configurez les variables d'environnement suivantes :"
  echo -e "  export EMAIL_ENABLED=true"
  echo -e "  export EMAIL_HOST=smtp.example.com"
  echo -e "  export EMAIL_PORT=587"
  echo -e "  export EMAIL_SECURE=false"
  echo -e "  export EMAIL_USER=votre_email@example.com"
  echo -e "  export EMAIL_PASS=votre_mot_de_passe"
  echo -e "  export EMAIL_FROM=pipeline-mcp@votre-domaine.com"
  echo -e "  export EMAIL_TO=equipe@votre-domaine.com"
fi

# Vérifier la configuration Supabase
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${YELLOW}Avertissement: La configuration Supabase n'est pas définie${NC}"
  echo -e "Pour activer la synchronisation avec Supabase, configurez les variables d'environnement suivantes :"
  echo -e "  export SUPABASE_URL=https://votre-projet.supabase.co"
  echo -e "  export SUPABASE_KEY=votre-cle-api-supabase"
fi

# Exécuter un rapport test pour vérifier que tout fonctionne
echo -e "${BLUE}Génération d'un rapport test...${NC}"
node scripts/generate-reports.js --type=daily