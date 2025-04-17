# Tableaux de Bord à 3 Couches

Ce module fournit une solution complète de tableaux de bord pour l'architecture à 3 couches (orchestration, agents, métier), permettant une visualisation unifiée et une supervision efficace de tout l'écosystème.

## Caractéristiques

- **Vue unifiée**: Intégration des 3 tableaux de bord spécifiques dans une interface cohérente
- **Circuit Breaker multicouche**: Détection et isolation des problèmes à chaque niveau
- **Traçabilité centralisée**: Suivi des événements et des transactions à travers les couches
- **Gouvernance**: Application des règles et résolution des conflits entre couches
- **Supervision des interconnexions**: Mesure des performances des communications entre couches

## Structure

```
layered-dashboards/
├── index.tsx                   # Point d'entrée de l'application des tableaux de bord
├── unified-layered-dashboard.tsx # Composant principal intégrant les 3 tableaux de bord
├── orchestration-dashboard.tsx  # Tableau de bord spécifique à la couche orchestration
├── agents-dashboard.tsx         # Tableau de bord spécifique à la couche agents
├── business-dashboard.tsx       # Tableau de bord spécifique à la couche métier
└── base-dashboard.tsx           # Composant de base partagé par les tableaux de bord
```

## Installation

Pour installer les dépendances et configurer l'environnement, utilisez le script de déploiement fourni :

```bash
cd scripts
chmod +x deploy-layered-dashboards.sh
./deploy-layered-dashboards.sh
```

Ce script :
1. Vérifie les prérequis (Node.js, gestionnaire de paquets, Docker)
2. Configure l'environnement avec les fichiers nécessaires
3. Installe les dépendances
4. Démarre les services backend (via Docker ou en mode local)
5. Vérifie la santé des services
6. Lance l'application des tableaux de bord

## Configuration

La configuration des tableaux de bord est définie dans `config/dashboards/dashboard-config.json`. Les principales sections sont :

- **api**: Configuration des endpoints API
- **dashboards**: Paramètres généraux des tableaux de bord
- **layers**: Configuration spécifique à chaque couche
- **authentication**: Options d'authentification

Exemple :

```json
{
  "api": {
    "baseUrl": "http://localhost:3001/api",
    "timeout": 30000
  },
  "dashboards": {
    "refreshInterval": 30,
    "traceability": {
      "enabled": true
    }
  },
  "layers": {
    "orchestration": { "enabled": true },
    "agents": { "enabled": true },
    "business": { "enabled": true }
  }
}
```

## Gouvernance

La gouvernance entre couches est configurée dans `config/dashboards/governance-rules.json`. Ce fichier définit :

- Les règles de décision pour les différentes couches
- Les conditions qui déclenchent ces règles
- Les actions à prendre en cas de déclenchement
- La priorité et la portée des règles

## Utilisation

### Navigation entre couches

Le tableau de bord unifié permet de naviguer facilement entre les trois couches :

- **Vue Unifiée** : Affiche un aperçu global avec des indicateurs pour chaque couche
- **Vue Orchestration** : Détails spécifiques à la couche d'orchestration
- **Vue Agents** : Détails spécifiques à la couche des agents
- **Vue Métier** : Détails spécifiques à la couche métier

### Supervision des connexions

Le tableau de bord affiche l'état des connexions entre les couches :
- Orchestration → Agents
- Agents → Métier
- Métier → Orchestration

Pour chaque connexion, vous pouvez voir :
- État (actif, dégradé)
- Latence
- Erreurs récentes

### Traçabilité

La fonctionnalité de traçabilité permet de suivre les transactions à travers les couches :

1. Cliquez sur "Traces" dans la barre d'outils
2. Consultez les événements récents
3. Filtrez par ID de trace pour suivre une transaction spécifique

### Circuit Breaker

Le système de circuit breaker protège chaque couche contre les défaillances :

- **Circuit fermé** : Fonctionnement normal
- **Circuit ouvert** : Couche isolée suite à des défaillances répétées
- **Circuit semi-ouvert** : Phase de test pour rétablir la connexion

## Personnalisation

Pour personnaliser l'apparence des tableaux de bord, modifiez le thème dans `index.tsx` :

```tsx
const theme = extendTheme({
  colors: {
    // Couleurs personnalisées
  },
  components: {
    // Styles de composants
  }
});
```

## Dépannage

### Le tableau de bord ne se charge pas

1. Vérifiez que les services backend sont opérationnels
2. Assurez-vous que les fichiers de configuration existent
3. Consultez les logs dans la console du navigateur

### Les données ne sont pas à jour

1. Cliquez sur "Actualiser" dans la barre d'outils
2. Vérifiez la connexion réseau
3. Assurez-vous que les services API répondent correctement

### Erreurs de circuit breaker

1. Vérifiez l'état des services concernés
2. Consultez les logs pour identifier la cause racine
3. Réinitialisez manuellement le circuit breaker si nécessaire

## Maintenance et évolution

Pour ajouter de nouvelles fonctionnalités ou adapter les tableaux de bord :

1. Les composants sont modulaires et peuvent être étendus
2. Ajoutez de nouvelles règles de gouvernance selon les besoins
3. Personnalisez la collecte de métriques pour les indicateurs spécifiques

## Licence

Propriétaire - Usage interne uniquement