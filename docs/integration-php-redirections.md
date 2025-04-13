# Guide d'intégration du middleware de redirection PHP

Ce guide explique comment intégrer le middleware de redirection des anciennes URLs PHP dans votre application NestJS existante.

## Prérequis

- Application NestJS fonctionnelle
- Accès aux fichiers de configuration
- Accès au fichier .htaccess de l'ancienne application PHP (optionnel)

## Étapes d'intégration

### 1. Intégration du middleware dans une application NestJS existante

Si vous avez déjà une application NestJS, vous devez modifier votre `app.module.ts` pour y intégrer le middleware :

```typescript
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { LegacyPhpRedirectMiddleware } from './common/middleware/legacyPhpRedirect.middleware';
// Vos autres imports...

@Module({
  imports: [
    // Vos modules existants...
  ],
  controllers: [
    // Vos contrôleurs existants...
  ],
  providers: [
    // Vos providers existants...
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Appliquer le middleware aux routes contenant '.php'
    consumer
      .apply(LegacyPhpRedirectMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    
    // Vos autres middlewares...
  }
}
```

### 2. Configuration dans Docker / Codespaces

Si vous utilisez Docker ou Codespaces, assurez-vous que le fichier `routing_patch.json` est correctement monté :

```yaml
# Dans votre docker-compose.yml
volumes:
  - ./routing_patch.json:/app/routing_patch.json
  - ./logs:/app/logs
  - ./reports:/app/reports
```

### 3. Automatisation avec n8n

Nous avons mis en place un workflow n8n qui automatise la gestion des routes PHP :

1. Lance l'audit des routes PHP
2. Personnalise le fichier `routing_patch.json`
3. Génère des tests automatisés
4. Analyse les rapports et envoie des notifications

Pour exécuter ce workflow :

```bash
./start_php_routes_manager.sh [chemin_htaccess] [base_url] [chemin_routing_patch]
```

Par exemple :
```bash
./start_php_routes_manager.sh ./examples/.htaccess http://votre-site.com ./routing_patch.json
```

### 4. Personnalisation des règles de redirection

Pour personnaliser les règles de redirection, vous pouvez :

1. **Modifier directement le fichier `routing_patch.json`** :
   ```json
   [
     {
       "from": "/chemin/vers/page.php",
       "to": "/nouvelle-route",
       "type": "redirect",
       "status": 301,
       "queryParams": ["id", "ref"],
       "description": "Redirection de l'ancienne page"
     }
   ]
   ```

2. **Modifier le workflow n8n** :
   - Ouvrez l'interface n8n
   - Recherchez le workflow "PHP Routes Migration Manager"
   - Modifiez le nœud "Personnaliser les règles"

### 5. Types de règles disponibles

Le middleware supporte plusieurs types de règles :

- `redirect` : Redirection permanente (301) ou temporaire (302)
- `rewrite` : Réécriture interne de l'URL sans redirection visible
- `dynamic` : Redirection dynamique en fonction des paramètres
- `removed` : Page supprimée (retourne un code 410 Gone)

### 6. Surveillance et maintenance

Pour surveiller l'efficacité des redirections :

1. Examinez régulièrement les rapports générés dans le dossier `reports/`
2. Vérifiez le fichier `logs/missed_legacy_routes.log` pour les routes non mappées
3. Exécutez les tests automatisés pour vous assurer que les redirections fonctionnent
4. Mettez à jour le fichier `routing_patch.json` en fonction des besoins

### 7. Ajout de nouvelles règles de redirection

Pour ajouter de nouvelles règles:

1. Identifiez l'ancienne URL PHP et la nouvelle URL de destination
2. Déterminez le type de redirection (301, 302, 410)
3. Ajoutez une entrée dans `routing_patch.json`
4. Exécutez le workflow n8n pour appliquer les changements et générer les tests

## Dépannage

### Redirections qui ne fonctionnent pas

1. Vérifiez que le fichier `routing_patch.json` est correctement formaté
2. Assurez-vous que le middleware est bien intégré dans votre application
3. Vérifiez les journaux pour détecter des erreurs
4. Lancez les tests automatisés pour identifier les problèmes

### Le rapport des routes manquantes est vide

1. Vérifiez que votre application reçoit des requêtes pour des URLs PHP
2. Assurez-vous que les dossiers `logs/` et `reports/` sont accessibles en écriture
3. Vérifiez que le middleware est correctement configuré

## Ressources

- [Documentation NestJS sur les middlewares](https://docs.nestjs.com/middleware)
- [SEO et redirections 301](https://developers.google.com/search/docs/advanced/crawling/301-redirects)
- [Documentation n8n](https://docs.n8n.io/)

## Assistance

Si vous avez des questions ou rencontrez des problèmes, contactez l'équipe de migration à migrationphp@example.com.