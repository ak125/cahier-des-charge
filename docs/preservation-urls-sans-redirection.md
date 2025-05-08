# Préservation des URLs Legacy sans Redirection

Ce document explique comment configurer le système pour préserver les anciennes URLs PHP sans faire de redirections HTTP, conformément à votre stratégie SEO.

## Avantages de cette approche

Cette approche offre plusieurs avantages par rapport à l'utilisation de redirections 301 :

1. **Aucun "saut de redirection"** : Les moteurs de recherche accèdent directement au contenu sans passer par une redirection
2. **Conservation totale du "jus SEO"** : Pas de perte de valeur SEO qui peut parfois survenir avec des redirections, même 301
3. **Expérience utilisateur améliorée** : Le temps de chargement est légèrement réduit en évitant une redirection
4. **Meilleures performances** : Le serveur a une charge moins importante car il n'a pas à gérer les redirections

## Prérequis

- Node.js 16+ et npm/pnpm
- Un fichier contenant la liste des URLs legacy à préserver
- Accès à la configuration du serveur web (Nginx, Caddy, etc.)

## Installation et configuration

### 1. Générer la configuration de préservation des URLs

Le script `preserve-legacy-urls.js` permet de générer la configuration nécessaire pour préserver les anciennes URLs PHP.

```bash
# Installer les dépendances requises si ce n'est pas déjà fait
npm install commander chalk

# Exécuter le script
node scripts/preserve-legacy-urls.js --urls=./legacy-urls.txt --output=./url-preservation-map.json
```

Options disponibles :
- `--urls <chemin>` : Chemin vers le fichier contenant les anciennes URLs à préserver
- `--output <chemin>` : Chemin de sortie pour le fichier de configuration (par défaut: ./url-preservation-map.json)
- `--config-path <chemin>` : Chemin vers le dossier de configuration (par défaut: ./app/config)
- `--type <type>` : Type de configuration à générer: remix, next, ou caddy (par défaut: remix)

### 2. Fichier d'URLs d'entrée

Le fichier d'entrée doit contenir une URL par ligne.
Exemple de contenu du fichier `legacy-urls.txt` :

```
/produit.php?id=123
/categorie.php?id=456
/fiche.php?id=789&ref=abc
/recherche.php?q=moteur
```

### 3. Configurer le framework

#### Pour Remix.js

Le script générera automatiquement les fichiers de routes nécessaires dans le dossier `app/routes/legacy`. Assurez-vous que ce dossier existe ou qu'il peut être créé.

Ensuite, ajoutez la configuration suivante à votre `remix.config.js` :

```js
module.exports = {
  // ...autres configurations
  routes: async (defineRoutes) => {
    return defineRoutes((route) => {
      // Routes normales
      // ...

      // Routes legacy
      const legacyRoutes = require('./url-preservation-map.json').routes;
      
      Object.entries(legacyRoutes).forEach(([phpPath, config]) => {
        route(phpPath, config.component, {
          id: `legacy-${phpPath.replace(/\W+/g, '-')}`,
        });
      });
    });
  },
};
```

#### Pour Next.js

Ajoutez les rewrites générés à votre fichier `next.config.js` :

```js
// next.config.js
const legacyRewrites = require('./url-preservation-map.json').rewrites;

module.exports = {
  // ...autres configurations
  async rewrites() {
    return [
      ...legacyRewrites,
      // ...autres rewrites si nécessaire
    ];
  },
};
```

#### Pour Caddy

Ajoutez le contenu du fichier généré à votre Caddyfile :

```bash
cat ./config/caddy/legacy-urls.caddy >> ./Caddyfile
```

#### Pour NGINX

Incluez le fichier de configuration généré dans votre configuration NGINX :

```nginx
# Dans votre fichier de configuration principal
include /chemin/vers/config/nginx/legacy-urls.conf;
```

### 4. Utiliser l'agent UrlPreservationAgent

Si vous utilisez l'architecture d'agents MCP, vous pouvez utiliser l'agent de préservation d'URLs :

```typescript
import { urlPreservationAgent } from './agents/agent-registry';

// Exécuter l'agent avec le chemin vers la configuration SEO
await urlPreservationAgent.run('/chemin/vers/app/config/seo-config.json');
```

## Vérification des URLs préservées

Pour vérifier que les anciennes URLs sont correctement préservées sans redirection, utilisez le script de test de redirection :

```bash
node scripts/test-urls.js --urls=./legacy-urls.txt --expect=200 --no-redirect
```

Ce script vérifiera que les URLs renvoient un statut HTTP 200 directement, sans passer par une redirection.

## Considérations SEO importantes

### Balise canonique

Lorsque vous utilisez cette approche, il est crucial que chaque page ait une balise `<link rel="canonical">` correctement configurée. 

Les handlers de routes générés par l'agent `UrlPreservationAgent` ajoutent automatiquement cette balise, mais vérifiez toujours qu'elle est présente dans votre HTML.

### Cohérence interne des liens

Pour améliorer la cohérence de votre site, assurez-vous que les liens internes de votre site pointent vers la version canonique des URLs. Cela aide les moteurs de recherche à identifier la structure préférée de votre site, même si vous servez le contenu sur plusieurs URLs.

### Suivi des performances SEO

Utilisez Google Search Console pour surveiller les performances de vos URLs. Comme il n'y a pas de redirections, vous ne devriez pas observer de changements majeurs dans vos classements si la transition est effectuée correctement.

## Dépannage

### Les anciennes URLs renvoient une erreur 404

1. Vérifiez que le fichier de configuration a bien été généré
2. Assurez-vous que la configuration du serveur web a été correctement mise à jour
3. Validez que les handlers de route ont été générés au bon endroit

### Problèmes avec les paramètres de requête

Si certains paramètres de requête ne sont pas correctement traités :

1. Vérifiez la configuration des `allowedQueryParams` dans `seo-config.json`
2. Modifiez les handlers de route générés pour traiter spécifiquement ces paramètres

## Conclusion

La préservation des anciennes URLs sans redirection est une approche efficace pour maintenir votre référencement SEO lors d'une migration. Cette méthode garantit que le "jus SEO" accumulé au fil des années reste intact, tout en vous permettant de moderniser votre architecture technique.

N'hésitez pas à adapter cette stratégie en fonction de vos besoins spécifiques et à consulter un expert SEO pour des cas particuliers.