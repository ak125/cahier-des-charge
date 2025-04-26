#!/bin/bash

# Script pour configurer ESLint et les règles TypeScript
# Date: 21 avril 2025

echo "🛠️ Configuration d'ESLint pour TypeScript"

# Création d'un journal d'installation
REPORT_DIR="/workspaces/cahier-des-charge/reports"
mkdir -p "$REPORT_DIR"
ESLINT_LOG="$REPORT_DIR/eslint-setup-$(date +"%Y%m%d-%H%M%S").log"

echo "Configuration d'ESLint - $(date)" > "$ESLINT_LOG"
echo "=================================" >> "$ESLINT_LOG"

# Installer les dépendances ESLint si elles ne sont pas déjà installées
if ! npm list --depth=0 eslint > /dev/null 2>&1; then
  echo "📦 Installation d'ESLint et des plugins..." | tee -a "$ESLINT_LOG"
  npm install --save-dev eslint@8.56.0 \
    @typescript-eslint/eslint-plugin@6.15.0 \
    @typescript-eslint/parser@6.15.0 \
    eslint-plugin-import@2.29.1 \
    eslint-config-prettier@9.1.0 \
    eslint-plugin-react@7.33.2 \
    eslint-plugin-react-hooks@4.6.0 \
    >> "$ESLINT_LOG" 2>&1
fi

# Créer la configuration ESLint
echo "📝 Création du fichier .eslintrc.js..." | tee -a "$ESLINT_LOG"
cat > "/workspaces/cahier-des-charge/.eslintrc.js" << EOL
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'import', 'react', 'react-hooks'],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // Désactivé car utilisé dans les interfaces d'agents
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'class',
        format: ['PascalCase'],
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      {
        selector: 'typeParameter',
        format: ['PascalCase'],
      },
    ],
    
    // Imports
    'import/no-unresolved': 'off', // TypeScript gère déjà cela
    'import/order': [
      'error',
      {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        'alphabetize': { order: 'asc', caseInsensitive: true }
      },
    ],
    
    // React
    'react/prop-types': 'off', // TypeScript gère les props
    'react/react-in-jsx-scope': 'off', // React >17 n'a plus besoin d'importer React 
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Général
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'no-duplicate-imports': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true, // On laisse import/order s'en occuper
        ignoreMemberSort: false,
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};
EOL

echo "✅ Fichier .eslintrc.js créé" | tee -a "$ESLINT_LOG"

# Créer .eslintignore
echo "📝 Création du fichier .eslintignore..." | tee -a "$ESLINT_LOG"
cat > "/workspaces/cahier-des-charge/.eslintignore" << EOL
node_modules/
dist/
build/
.next/
coverage/
*.d.ts
*.js.map
EOL

echo "✅ Fichier .eslintignore créé" | tee -a "$ESLINT_LOG"

# Ajouter des scripts npm
echo "📝 Mise à jour des scripts npm dans package.json..." | tee -a "$ESLINT_LOG"
node -e "
const fs = require('fs');
const pkgPath = '/workspaces/cahier-des-charge/package.json';

if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  pkg.scripts = pkg.scripts || {};
  pkg.scripts['lint'] = 'eslint . --ext .ts,.tsx';
  pkg.scripts['lint:fix'] = 'eslint . --ext .ts,.tsx --fix';
  pkg.scripts['type-check'] = 'tsc --noEmit';
  pkg.scripts['validate'] = 'npm run lint && npm run type-check';
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('Scripts mis à jour dans package.json');
} else {
  console.error('package.json non trouvé');
}
" 2>> "$ESLINT_LOG"

# Créer le script de validation pour la CI
echo "📝 Création du script de validation CI..." | tee -a "$ESLINT_LOG"
cat > "/workspaces/cahier-des-charge/ci-validate.sh" << EOL
#!/bin/bash

# Script de validation CI pour TypeScript et ESLint
# Date: 21 avril 2025

echo "🔍 Validation du code avant commit/push"

# Exécuter la vérification des types TypeScript
echo "⌛ Vérification des types TypeScript..."
npm run type-check
if [ \$? -ne 0 ]; then
  echo "❌ Erreur: La vérification des types TypeScript a échoué."
  exit 1
fi
echo "✅ Vérification des types TypeScript réussie"

# Exécuter ESLint
echo "⌛ Vérification des règles ESLint..."
npm run lint
if [ \$? -ne 0 ]; then
  echo "❌ Erreur: La validation ESLint a échoué."
  exit 1
fi
echo "✅ Vérification ESLint réussie"

echo "🎉 Validation complète réussie!"
exit 0
EOL

chmod +x "/workspaces/cahier-des-charge/ci-validate.sh"

echo "✅ Script ci-validate.sh créé" | tee -a "$ESLINT_LOG"

# Créer un pre-commit hook git si .git existe
GIT_DIR="/workspaces/cahier-des-charge/.git"
if [ -d "$GIT_DIR" ]; then
  echo "📝 Création du hook pre-commit Git..." | tee -a "$ESLINT_LOG"
  
  mkdir -p "$GIT_DIR/hooks"
  cat > "$GIT_DIR/hooks/pre-commit" << EOL
#!/bin/bash

# Hook pre-commit pour vérifier TypeScript et ESLint
echo "🔍 Vérification du code avant commit..."

# Stocker les fichiers TypeScript modifiés
FILES=\$(git diff --cached --name-only --diff-filter=ACMRTUXB | grep "\.tsx\?$")

if [ -n "\$FILES" ]; then
  echo "⌛ Vérification des types TypeScript sur les fichiers modifiés..."
  npx tsc --noEmit 
  if [ \$? -ne 0 ]; then
    echo "❌ Erreur: La vérification des types TypeScript a échoué. Commit annulé."
    exit 1
  fi
  
  echo "⌛ Vérification des règles ESLint sur les fichiers modifiés..."
  npx eslint \$FILES
  if [ \$? -ne 0 ]; then
    echo "❌ Erreur: La validation ESLint a échoué. Commit annulé."
    exit 1
  fi
fi

echo "✅ Validation réussie"
exit 0
EOL

  chmod +x "$GIT_DIR/hooks/pre-commit"
  echo "✅ Hook pre-commit créé" | tee -a "$ESLINT_LOG"
else
  echo "⚠️ Dépôt Git non trouvé, hook pre-commit non créé" | tee -a "$ESLINT_LOG"
fi

# Ajouter une section à ARCHITECTURE.md sur la validation du code
ARCHITECTURE_MD="/workspaces/cahier-des-charge/ARCHITECTURE.md"
if [ -f "$ARCHITECTURE_MD" ]; then
  echo "📝 Mise à jour du document ARCHITECTURE.md..." | tee -a "$ESLINT_LOG"
  
  if ! grep -q "## 🔍 Validation du code" "$ARCHITECTURE_MD"; then
    cat >> "$ARCHITECTURE_MD" << EOL

## 🔍 Validation du code TypeScript

Pour maintenir la qualité du code et éviter les erreurs TypeScript, un système de validation automatique a été mis en place.

### Outils de validation

- **TypeScript** : Vérification statique des types
- **ESLint** : Analyse statique pour détecter les problèmes de code
- **Hooks Git** : Validation automatique avant commit

### Règles appliquées

- Nommage standardisé des agents (CamelCase)
- Implémentation correcte des interfaces
- Pas de caractères spéciaux dans les noms de fichiers
- Conventions d'import rigoureuses

### Commandes disponibles

- \`npm run type-check\` : Vérification des types uniquement
- \`npm run lint\` : Vérification des règles ESLint
- \`npm run lint:fix\` : Correction automatique des problèmes ESLint
- \`npm run validate\` : Exécution de toutes les vérifications

### Intégration CI/CD

Le script \`ci-validate.sh\` est exécuté automatiquement dans le pipeline CI pour s'assurer que tout le code respecte les normes définies.

EOL
    echo "✅ Document ARCHITECTURE.md mis à jour" | tee -a "$ESLINT_LOG"
  else
    echo "⚠️ Section de validation déjà présente dans ARCHITECTURE.md" | tee -a "$ESLINT_LOG"
  fi
else
  echo "⚠️ Fichier ARCHITECTURE.md non trouvé" | tee -a "$ESLINT_LOG"
fi

echo "✅ Configuration d'ESLint terminée"
echo "📋 Journal de configuration : $ESLINT_LOG"