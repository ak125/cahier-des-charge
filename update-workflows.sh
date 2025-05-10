#!/bin/bash

# Script pour mettre à jour les chemins dans les workflows GitHub Actions
# pour refléter la nouvelle structure en 3 couches

echo "Mise à jour des workflows GitHub Actions pour la structure en 3 couches..."

# 1. Mise à jour de agents.yml
sed -i '/paths:/,/pull_request:/ {
  s/- '\''packages\/agents\/\*\*'\''$/- '\''packages\/agents\/\*\*'\''\\n      - '\''packages\/business\/src\/\*\*\/agent\*.ts'\''\\n      - '\''packages\/coordination\/\*\*\/agent\*.ts'\''\\n      - '\''packages\/orchestration\/src\/\*\*\/agent\*.ts'\''/
}' .github/workflows/agents.yml

echo "✅ agents.yml mis à jour"

# 2. Mise à jour de migration-pipeline.yml
sed -i '/paths:/,/workflow_dispatch:/ {
  s/- '\''config\/\*\*'\''$/- '\''config\/\*\*'\''\\n      - '\''packages\/business\/src\/migration\/\*\*'\''\\n      - '\''packages\/coordination\/migration\/\*\*'\''\\n      - '\''packages\/orchestration\/src\/migration\/\*\*'\''/
}' .github/workflows/migration-pipeline.yml

echo "✅ migration-pipeline.yml mis à jour"

# 3. Mise à jour de monitoring.yml
if [ -f .github/workflows/monitoring.yml ]; then
  sed -i '/paths:/,/schedule:/ {
    s/- '\''monitoring\/\*\*'\''$/- '\''monitoring\/\*\*'\''\\n      - '\''packages\/business\/src\/monitoring\/\*\*'\''\\n      - '\''packages\/coordination\/monitoring\/\*\*'\''\\n      - '\''packages\/orchestration\/src\/monitoring\/\*\*'\''/
  }' .github/workflows/monitoring.yml
  echo "✅ monitoring.yml mis à jour"
fi

# 4. Mise à jour de preview.yml
if [ -f .github/workflows/preview.yml ]; then
  sed -i '/paths:/,/workflow_dispatch:/ {
    s/- '\''agents\/\*\*'\''$/- '\''agents\/\*\*'\''\\n      - '\''packages\/business\/src\/\*\*'\''\\n      - '\''packages\/coordination\/\*\*'\''\\n      - '\''packages\/orchestration\/src\/\*\*'\''/
  }' .github/workflows/preview.yml
  echo "✅ preview.yml mis à jour"
fi

# 5. Mise à jour de security-checks.yml
if [ -f .github/workflows/security-checks.yml ]; then
  sed -i 's/agents\/\*\*\/\*\.ts/agents\/\*\*\/\*\.ts packages\/business\/src\/\*\*\/\*\.ts packages\/coordination\/\*\*\/\*\.ts packages\/orchestration\/src\/\*\*\/\*\.ts/g' .github/workflows/security-checks.yml
  echo "✅ security-checks.yml mis à jour"
fi

# 6. Mise à jour de seo-agents.yml
if [ -f .github/workflows/seo-agents.yml ]; then
  sed -i 's/packages\/seo-\*\/\*\*/packages\/seo-\*\/\*\* packages\/business\/src\/seo\/\*\* packages\/coordination\/seo\/\*\* packages\/orchestration\/src\/seo\/\*\*/g' .github/workflows/seo-agents.yml
  echo "✅ seo-agents.yml mis à jour"
fi

echo "Terminé! Les workflows GitHub Actions ont été mis à jour pour la structure en 3 couches."
