#!/bin/bash
# Script pour configurer des alertes sur les URLs fréquemment manquées
# configure-missed-urls-alerts.sh

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
LOG_FILE="./logs/missed_legacy_routes.log"
THRESHOLD=10
EMAIL_TO="admin@example.com"
WEBHOOK_URL=""
CHECK_INTERVAL="daily" # daily, hourly, weekly
SEND_EMAIL=true
SEND_WEBHOOK=false
CONFIG_FILE="./config/missed-urls-alerts.json"

# Afficher l'aide
function show_help {
  echo -e "${BLUE}Configuration des alertes pour les URLs manquées${NC}"
  echo ""
  echo "Ce script configure des alertes pour surveiller les URLs fréquemment manquées"
  echo "et vous avertir lorsque des seuils sont dépassés."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -l, --log-file PATH      Chemin vers le fichier de log des routes manquées (défaut: $LOG_FILE)"
  echo "  -t, --threshold NUM      Seuil de détections avant alerte (défaut: $THRESHOLD)"
  echo "  -e, --email EMAIL        Email pour les alertes (défaut: $EMAIL_TO)"
  echo "  -w, --webhook URL        URL du webhook pour les alertes (défaut: aucun)"
  echo "  -i, --interval PERIOD    Intervalle de vérification (daily, hourly, weekly, défaut: $CHECK_INTERVAL)"
  echo "  --no-email               Désactiver les alertes par email"
  echo "  --webhook-only           Envoyer les alertes uniquement par webhook"
  echo "  -c, --config FILE        Fichier de configuration (défaut: $CONFIG_FILE)"
  echo "  --install                Installer la tâche cron de vérification"
  echo "  --help                   Afficher cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 -t 5 -i hourly --install"
  exit 0
}

# Traiter les arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--log-file)
      LOG_FILE="$2"
      shift 2
      ;;
    -t|--threshold)
      THRESHOLD="$2"
      shift 2
      ;;
    -e|--email)
      EMAIL_TO="$2"
      shift 2
      ;;
    -w|--webhook)
      WEBHOOK_URL="$2"
      SEND_WEBHOOK=true
      shift 2
      ;;
    -i|--interval)
      CHECK_INTERVAL="$2"
      if [[ ! "$CHECK_INTERVAL" =~ ^(daily|hourly|weekly)$ ]]; then
        echo -e "${RED}Intervalle invalide. Utilisez 'daily', 'hourly' ou 'weekly'.${NC}"
        exit 1
      fi
      shift 2
      ;;
    --no-email)
      SEND_EMAIL=false
      shift
      ;;
    --webhook-only)
      SEND_EMAIL=false
      SEND_WEBHOOK=true
      shift
      ;;
    -c|--config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    --install)
      INSTALL_CRON=true
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo -e "${RED}Option inconnue: $1${NC}"
      show_help
      ;;
  esac
done

# Vérifier que le fichier de log existe ou peut être créé
mkdir -p $(dirname "$LOG_FILE")
touch "$LOG_FILE" 2>/dev/null || {
  echo -e "${RED}❌ Impossible d'accéder au fichier de log: $LOG_FILE${NC}"
  exit 1
}

# Créer le répertoire de configuration si nécessaire
CONFIG_DIR=$(dirname "$CONFIG_FILE")
mkdir -p "$CONFIG_DIR"

# Créer le fichier de configuration
echo -e "${BLUE}Création du fichier de configuration...${NC}"
cat > "$CONFIG_FILE" << EOL
{
  "logFile": "$LOG_FILE",
  "threshold": $THRESHOLD,
  "checkInterval": "$CHECK_INTERVAL",
  "notifications": {
    "email": {
      "enabled": $SEND_EMAIL,
      "recipient": "$EMAIL_TO"
    },
    "webhook": {
      "enabled": $SEND_WEBHOOK,
      "url": "${WEBHOOK_URL}"
    }
  },
  "lastCheck": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "alertedUrls": []
}
EOL

# Créer le script de vérification
CHECK_SCRIPT="./scripts/check-missed-urls.sh"
mkdir -p $(dirname "$CHECK_SCRIPT")

echo -e "${BLUE}Création du script de vérification...${NC}"
cat > "$CHECK_SCRIPT" << 'EOL'
#!/bin/bash
# Script pour vérifier les URLs fréquemment manquées et envoyer des alertes

set -e

# Charger la configuration
CONFIG_FILE=${1:-"./config/missed-urls-alerts.json"}

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Fichier de configuration non trouvé: $CONFIG_FILE"
  exit 1
fi

# Extraire les paramètres de configuration
LOG_FILE=$(jq -r ".logFile" "$CONFIG_FILE")
THRESHOLD=$(jq -r ".threshold" "$CONFIG_FILE")
EMAIL_ENABLED=$(jq -r ".notifications.email.enabled" "$CONFIG_FILE")
EMAIL_TO=$(jq -r ".notifications.email.recipient" "$CONFIG_FILE")
WEBHOOK_ENABLED=$(jq -r ".notifications.webhook.enabled" "$CONFIG_FILE")
WEBHOOK_URL=$(jq -r ".notifications.webhook.url" "$CONFIG_FILE")
LAST_CHECK=$(jq -r ".lastCheck" "$CONFIG_FILE")
ALERTED_URLS=$(jq -r ".alertedUrls" "$CONFIG_FILE")

if [ ! -f "$LOG_FILE" ]; then
  echo "⚠️ Fichier de log non trouvé: $LOG_FILE"
  exit 0
fi

# Vérifier si des URLs dépassent le seuil
echo "Analyse du fichier de log: $LOG_FILE"
echo "Seuil d'alerte: $THRESHOLD occurrences"

# Extraire et compter les URLs
declare -A url_counts
while IFS='|' read -r date method url rest; do
  url=$(echo "$url" | xargs) # Trim whitespace
  if [ -n "$url" ]; then
    ((url_counts["$url"]++))
  fi
done < <(cat "$LOG_FILE")

# Identifier les nouvelles URLs à surveiller
NEW_ALERTS=()
for url in "${!url_counts[@]}"; do
  count=${url_counts["$url"]}
  
  # Vérifier si l'URL dépasse le seuil et n'a pas déjà été signalée
  if [ "$count" -ge "$THRESHOLD" ] && ! echo "$ALERTED_URLS" | jq -e '.[] | select(. == "'"$url"'")' > /dev/null; then
    echo "⚠️ URL fréquemment manquée: $url ($count occurrences)"
    NEW_ALERTS+=("$url")
    
    # Ajouter à la liste des URLs déjà signalées
    ALERTED_URLS=$(echo "$ALERTED_URLS" | jq '. + ["'"$url"'"]')
  fi
done

# Mettre à jour le fichier de configuration
jq --arg lastCheck "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
   --argjson alertedUrls "$ALERTED_URLS" \
   '.lastCheck = $lastCheck | .alertedUrls = $alertedUrls' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && \
   mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

# Envoyer des alertes si nécessaire
if [ ${#NEW_ALERTS[@]} -gt 0 ]; then
  ALERT_MESSAGE="Alerte: ${#NEW_ALERTS[@]} nouvelles URLs fréquemment manquées détectées.\n\n"
  
  for url in "${NEW_ALERTS[@]}"; do
    count=${url_counts["$url"]}
    ALERT_MESSAGE+="- $url: $count occurrences\n"
  done
  
  ALERT_MESSAGE+="\nCes URLs devraient être examinées et potentiellement ajoutées à votre système de redirection.\n"
  ALERT_MESSAGE+="Vérifiez le tableau de bord pour plus de détails: http://localhost:3000/dashboard/htaccess\n"
  
  # Envoyer email si activé
  if [ "$EMAIL_ENABLED" = "true" ] && [ -n "$EMAIL_TO" ]; then
    echo -e "$ALERT_MESSAGE" | mail -s "Alerte: URLs manquées fréquemment" "$EMAIL_TO"
    echo "✅ Alerte envoyée par email à $EMAIL_TO"
  fi
  
  # Envoyer webhook si activé
  if [ "$WEBHOOK_ENABLED" = "true" ] && [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"message\": \"$ALERT_MESSAGE\", \"urls\": $(echo "${NEW_ALERTS[@]}" | jq -R -s -c 'split(" ")')}" \
         --silent
    echo "✅ Alerte envoyée par webhook"
  fi
else
  echo "✅ Aucune nouvelle URL fréquemment manquée détectée"
fi
EOL

# Rendre le script exécutable
chmod +x "$CHECK_SCRIPT"

# Installer la tâche cron si demandé
if [ "$INSTALL_CRON" = true ]; then
  echo -e "${BLUE}Installation de la tâche cron...${NC}"
  
  CRON_SCHEDULE=""
  case "$CHECK_INTERVAL" in
    hourly)
      CRON_SCHEDULE="0 * * * *"
      ;;
    daily)
      CRON_SCHEDULE="0 0 * * *"
      ;;
    weekly)
      CRON_SCHEDULE="0 0 * * 0"
      ;;
  esac
  
  # Créer une entrée crontab temporaire
  TEMP_CRON=$(mktemp)
  crontab -l > "$TEMP_CRON" 2>/dev/null || echo "" > "$TEMP_CRON"
  
  # Vérifier si l'entrée existe déjà
  if ! grep -q "$CHECK_SCRIPT" "$TEMP_CRON"; then
    echo "$CRON_SCHEDULE $CHECK_SCRIPT $CONFIG_FILE >> ./logs/missed-urls-check.log 2>&1" >> "$TEMP_CRON"
    crontab "$TEMP_CRON"
    echo -e "${GREEN}✅ Tâche cron installée avec succès (exécution $CHECK_INTERVAL)${NC}"
  else
    echo -e "${YELLOW}⚠️ Une tâche cron pour ce script existe déjà${NC}"
  fi
  
  rm "$TEMP_CRON"
fi

# Résumé de la configuration
echo -e "\n${GREEN}✅ Configuration des alertes terminée !${NC}"
echo -e "Fichier de log: ${BLUE}$LOG_FILE${NC}"
echo -e "Seuil d'alerte: ${BLUE}$THRESHOLD occurrences${NC}"
echo -e "Intervalle de vérification: ${BLUE}$CHECK_INTERVAL${NC}"

if [ "$SEND_EMAIL" = true ]; then
  echo -e "Alertes par email: ${GREEN}Activées${NC} ($EMAIL_TO)"
else
  echo -e "Alertes par email: ${YELLOW}Désactivées${NC}"
fi

if [ "$SEND_WEBHOOK" = true ]; then
  echo -e "Alertes par webhook: ${GREEN}Activées${NC} ($WEBHOOK_URL)"
else
  echo -e "Alertes par webhook: ${YELLOW}Désactivées${NC}"
fi

echo -e "\nPour modifier la configuration, éditez le fichier: ${BLUE}$CONFIG_FILE${NC}"
echo -e "Pour exécuter une vérification manuelle: ${BLUE}$CHECK_SCRIPT $CONFIG_FILE${NC}"

if [ "$INSTALL_CRON" != true ]; then
  echo -e "\nPour installer la tâche cron: ${YELLOW}$0 --install${NC}"
fi