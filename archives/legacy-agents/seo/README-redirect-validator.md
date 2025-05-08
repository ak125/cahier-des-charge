# Validateur de Redirections SEO

Cet outil permet de valider automatiquement les redirections SEO pour s'assurer que vos anciennes URLs redirigent correctement vers les nouvelles destinations lors d'une migration de site ou d'une refonte.

## Fonctionnalités

- ✅ Validation des redirections 301 (permanentes)
- ✅ Gestion des statuts 410 (ressource supprimée) et 412 (précondition échouée)
- ✅ Import de règles depuis différentes sources (.htaccess, NGINX, JSON)
- ✅ Export vers Caddyfile pour faciliter la migration
- ✅ Rapports détaillés en formats JSON et HTML
- ✅ Possibilité de tester des URLs provenant d'exports Google Search Console

## Installation

```bash
# Installation des dépendances
npm install

# Ou avec pnpm
pnpm install
```

## Exemples d'utilisation

### 1. Valider des URLs indexées par Google

```bash
npx ts-node agents/seo/tools/test-redirects.ts --source=agents/seo/examples/legacy-urls.txt --base-url=https://example.com --type=urls --map=agents/seo/examples/seo-redirects-map.json --output=./reports
```

### 2. Valider des règles .htaccess migrées vers un Caddyfile

```bash
npx ts-node agents/seo/tools/test-redirects.ts --source=legacy/.htaccess --type=htaccess --base-url=https://example.com --caddy-export=./Caddyfile --output=./reports
```

### 3. Valider des règles NGINX

```bash
npx ts-node agents/seo/tools/test-redirects.ts --source=legacy/nginx.conf --type=nginx --base-url=https://example.com --output=./reports
```

## Options de la ligne de commande

| Option | Description | Par défaut |
|--------|-------------|------------|
| `-s, --source <path>` | Fichier source contenant les URLs ou règles de redirection | (requis) |
| `-m, --map <path>` | Fichier de mappage des redirections au format JSON | (optionnel) |
| `-b, --base-url <url>` | URL de base pour les tests | http://localhost:3000 |
| `-o, --output <dir>` | Répertoire pour les rapports | ./redirect-reports |
| `-t, --type <type>` | Type de source: urls, htaccess, nginx ou json | urls |
| `--timeout <ms>` | Délai d'attente pour les requêtes HTTP (ms) | 5000 |
| `--html-export` | Générer un rapport HTML | true |
| `--caddy-export <path>` | Exporter les règles en format Caddyfile | (optionnel) |
| `--verbose` | Mode verbeux | false |

## Formats de fichiers

### Fichier de mappage JSON (seo-redirects-map.json)

```json
{
  "/ancienne-url": {
    "target": "/nouvelle-url",
    "type": 301
  },
  "/url-supprimee": {
    "target": "",
    "type": 410
  }
}
```

Types de redirections supportés:
- `301`: Redirection permanente
- `302`: Redirection temporaire
- `303`: See Other
- `307`: Temporary Redirect
- `308`: Permanent Redirect
- `410`: Gone (ressource supprimée)
- `412`: Precondition Failed

### Fichier de liste d'URLs (legacy-urls.txt)

```
https://example.com/ancienne-page1
https://example.com/ancienne-page2
/chemin-relatif1
/chemin-relatif2
```

## Cas d'usage courants

### Cas 1: Migration d'un site PHP vers un site moderne

Pour valider que toutes les anciennes URLs PHP redirigent correctement vers les nouvelles destinations :

1. Exportez les URLs indexées depuis Google Search Console
2. Créez un fichier de mappage JSON avec les correspondances d'URLs
3. Exécutez le validateur pour vérifier que toutes les redirections fonctionnent comme prévu

### Cas 2: Migration d'un serveur web

Lors d'un changement de serveur web (ex: Apache → NGINX ou NGINX → Caddy) :

1. Exportez les règles de redirection existantes
2. Générez un nouveau fichier de configuration (ex: Caddyfile)
3. Testez les redirections avant la mise en production

### Cas 3: Audit SEO périodique

Pour assurer que vos redirections restent fonctionnelles dans le temps :

1. Programmez une tâche automatique qui exécute le validateur régulièrement
2. Configurez des alertes en cas d'échecs de redirection
3. Intégrez la validation dans votre processus de déploiement continu