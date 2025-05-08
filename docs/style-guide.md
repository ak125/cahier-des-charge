# Guide de Style du Projet

Ce guide définit les conventions de code et de nommage à suivre dans le projet. L'adhésion à ces conventions améliore la lisibilité, la cohérence et la maintenabilité du code.

## Conventions de nommage

### Fichiers et répertoires

Tous les fichiers et répertoires du projet doivent suivre la convention kebab-case :
- Les noms sont en minuscules
- Les mots sont séparés par des tirets
- Pas d'espaces ni de caractères spéciaux

**Exemples corrects :**
```
user-profile.ts
api-client.js
auth-middleware.ts
core-services/
data-models/
```

**Exemples incorrects :**
```
UserProfile.ts     // PascalCase, non conforme
apiClient.js       // camelCase, non conforme
Auth_Middleware.ts // snake_case, non conforme
CoreServices/      // PascalCase, non conforme
```

### Exceptions

Les exceptions suivantes sont autorisées :
- `index.ts`/`index.js` (fichiers d'entrée)
- `README.md`, `LICENSE` (fichiers standards)
- `Dockerfile`, `Earthfile` (fichiers avec conventions spécifiques)
- `package.json`, `tsconfig.json` (fichiers de configuration standards)
- Les fichiers commençant par un `.` (ex. `.gitignore`)

## Vérification et Application

### Vérification automatique

Un hook pre-commit vérifie automatiquement que tous les nouveaux fichiers ou modifications respectent la convention kebab-case. Pour installer ce hook :

```bash
node scripts/install-git-hooks.js
```

### Normalisation

Pour standardiser les noms de fichiers et dossiers existants vers kebab-case :

```bash
# Mode simulation (n'effectue aucun changement)
node scripts/standardize-naming.js --dry-run --verbose

# Application des changements
node scripts/standardize-naming.js --verbose
```

### Analyse périodique

Exécutez régulièrement le script `fix-case-duplications.js` pour détecter les doublons potentiels liés à différentes conventions de nommage :

```bash
node scripts/fix-case-duplications.js --dry-run
```

## Autres conventions de code

À venir...