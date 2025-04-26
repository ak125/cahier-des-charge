#!/bin/bash

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Définir les ports pour chaque dashboard
MIGRATION_PORT=3000
AUDIT_PORT=3002
AGENTS_PORT=3003
UNIFIED_PORT=3001

echo -e "${YELLOW}🚀 Démarrage des tableaux de bord...${NC}"

# Fonction pour vérifier si un port est libre
check_port() {
  local port=$1
  if netstat -tuln | grep -q ":$port " &> /dev/null; then
    return 1 # Port est occupé
  else
    return 0 # Port est libre
  fi
}

# Fonction pour libérer un port
free_port() {
  local port=$1
  echo -e "${YELLOW}🔄 Tentative de libération du port $port...${NC}"
  
  # Essayer d'abord sans sudo
  fuser -k "${port}/tcp" 2>/dev/null
  
  # Vérifier si le port est maintenant libre
  if check_port "$port"; then
    echo -e "${GREEN}✅ Port $port libéré avec succès!${NC}"
    return 0
  fi
  
  # Essayer avec sudo
  echo -e "${YELLOW}⚠️ Le port $port est toujours occupé. Tentative avec sudo...${NC}"
  sudo fuser -k "${port}/tcp" 2>/dev/null
  
  # Vérifier à nouveau
  if check_port "$port"; then
    echo -e "${GREEN}✅ Port $port libéré avec succès!${NC}"
    return 0
  else
    echo -e "${RED}❌ Impossible de libérer le port $port.${NC}"
    return 1
  fi
}

# Libérer les ports utilisés
echo -e "${BLUE}🧹 Nettoyage initial des ports...${NC}"

# Tableau pour stocker les ports libérés avec succès
FREED_PORTS=()

# Nettoyer chaque port
for port in $MIGRATION_PORT $AUDIT_PORT $AGENTS_PORT $UNIFIED_PORT; do
  if ! check_port "$port"; then
    if free_port "$port"; then
      FREED_PORTS+=("$port")
    fi
  else
    echo -e "${GREEN}✅ Port $port est déjà libre${NC}"
    FREED_PORTS+=("$port")
  fi
done

# Attendre un peu pour être sûr que les ports sont libérés
sleep 2

# Tableau pour stocker les dashboards lancés avec succès
LAUNCHED_DASHBOARDS=()

# Fonction pour lancer un dashboard et renvoyer 0 si succès, 1 si échec
launch_dashboard() {
  local name=$1
  local port=$2
  local command=$3
  
  echo -e "${YELLOW}🔄 Lancement du tableau de bord $name sur le port $port...${NC}"
  
  # Vérifier si le port est disponible
  if ! check_port "$port"; then
    echo -e "${RED}❌ Le port $port est toujours occupé. Impossible de lancer le tableau de bord $name.${NC}"
    return 1
  fi
  
  # Lancer le processus en arrière-plan et le détacher
  nohup $command > "/tmp/dashboard-$name.log" 2>&1 &
  local pid=$!
  
  echo -e "${BLUE}⚡️ Tableau de bord $name lancé avec PID $pid${NC}"
  
  # Attendre un moment pour s'assurer que le processus démarre
  sleep 5
  
  # Vérifier si le processus est toujours en vie
  if kill -0 $pid 2>/dev/null; then
    echo -e "${GREEN}✅ Tableau de bord $name démarré avec succès sur http://localhost:$port${NC}"
    echo "$pid" > "/tmp/dashboard-$name.pid"
    LAUNCHED_DASHBOARDS+=("$name:$port:$pid")
    return 0
  else
    echo -e "${RED}❌ Échec du démarrage du tableau de bord $name${NC}"
    return 1
  fi
}

# Lancer les tableaux de bord

# 1. Tableau de bord de migration
if [[ " ${FREED_PORTS[@]} " =~ " $MIGRATION_PORT " ]]; then
  launch_dashboard "migration" "$MIGRATION_PORT" "node --loader ts-node/esm scripts/dashboard.js"
fi

# 2. Tableau de bord d'audit
if [[ " ${FREED_PORTS[@]} " =~ " $AUDIT_PORT " ]]; then
  launch_dashboard "audit" "$AUDIT_PORT" "node -r ts-node/register agents/agent-audit.ts --dashboard"
fi

# 3. Tableau de bord des agents
if [[ " ${FREED_PORTS[@]} " =~ " $AGENTS_PORT " ]]; then
  launch_dashboard "agents" "$AGENTS_PORT" "node scripts/dashboard.js --view=agents"
fi

# 4. Tableau de bord unifié
if [[ " ${FREED_PORTS[@]} " =~ " $UNIFIED_PORT " ]]; then
  launch_dashboard "unifié" "$UNIFIED_PORT" "node scripts/unified-dashboard.js"
fi

# Résumé
echo ""
if [ ${#LAUNCHED_DASHBOARDS[@]} -gt 0 ]; then
  echo -e "${GREEN}✅ Tableaux de bord lancés :${NC}"
  for dashboard in "${LAUNCHED_DASHBOARDS[@]}"; do
    IFS=':' read -r name port pid <<< "$dashboard"
    echo -e "${BLUE}📊 $name: http://localhost:$port (PID: $pid)${NC}"
  done
else
  echo -e "${RED}❌ Aucun tableau de bord n'a pu être lancé.${NC}"
  exit 1
fi

# Instructions pour arrêter les tableaux de bord
echo ""
echo -e "${YELLOW}Pour arrêter les tableaux de bord, exécutez :${NC}"
echo -e "${BLUE}scripts/stop-dashboards.sh${NC}"

# Créer le script pour arrêter les tableaux de bord
cat > "scripts/stop-dashboards.sh" <<EOF
#!/bin/bash

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "\${YELLOW}🛑 Arrêt des tableaux de bord...${NC}"

# Arrêter chaque dashboard
EOF

for dashboard in "${LAUNCHED_DASHBOARDS[@]}"; do
  IFS=':' read -r name port pid <<< "$dashboard"
  echo "if [ -f \"/tmp/dashboard-$name.pid\" ]; then" >> "scripts/stop-dashboards.sh"
  echo "  pid=\$(cat \"/tmp/dashboard-$name.pid\")" >> "scripts/stop-dashboards.sh"
  echo "  if kill -0 \$pid 2>/dev/null; then" >> "scripts/stop-dashboards.sh"
  echo "    echo -e \"\${YELLOW}🔄 Arrêt du tableau de bord $name (PID: \$pid)...${NC}\"" >> "scripts/stop-dashboards.sh"
  echo "    kill \$pid" >> "scripts/stop-dashboards.sh"
  echo "    echo -e \"\${GREEN}✅ Tableau de bord $name arrêté.${NC}\"" >> "scripts/stop-dashboards.sh"
  echo "  else" >> "scripts/stop-dashboards.sh"
  echo "    echo -e \"\${RED}⚠️ Le processus du tableau de bord $name n'est plus en cours d'exécution.${NC}\"" >> "scripts/stop-dashboards.sh"
  echo "  fi" >> "scripts/stop-dashboards.sh"
  echo "  rm -f \"/tmp/dashboard-$name.pid\"" >> "scripts/stop-dashboards.sh"
  echo "else" >> "scripts/stop-dashboards.sh"
  echo "  echo -e \"\${RED}⚠️ Fichier PID pour le tableau de bord $name non trouvé.${NC}\"" >> "scripts/stop-dashboards.sh"
  echo "fi" >> "scripts/stop-dashboards.sh"
  echo "" >> "scripts/stop-dashboards.sh"
done

# Ajouter les commandes pour tuer tous les processus restants sur les ports
echo "# S'assurer que tous les ports sont libérés" >> "scripts/stop-dashboards.sh"
echo "echo -e \"\${YELLOW}🧹 Nettoyage des ports...${NC}\"" >> "scripts/stop-dashboards.sh"
echo "fuser -k 3000/tcp 3001/tcp 3002/tcp 3003/tcp 2>/dev/null" >> "scripts/stop-dashboards.sh"
echo "echo -e \"\${GREEN}✅ Tous les tableaux de bord ont été arrêtés.${NC}\"" >> "scripts/stop-dashboards.sh"

# Rendre le script d'arrêt exécutable
chmod +x scripts/stop-dashboards.sh

echo -e "${GREEN}✅ Script d'arrêt créé : scripts/stop-dashboards.sh${NC}"