# Hub de Tableaux de Bord MCP

Ce document explique comment utiliser le hub centralisé des tableaux de bord MCP.

## Introduction

Le **Dashboard Hub** est un point d'entrée centralisé qui permet d'accéder à tous les tableaux de bord du pipeline de migration IA. Il offre une vue cohérente des différents aspects du processus de migration et permet de naviguer facilement entre les tableaux de bord spécialisés.

## Installation

Le hub de tableaux de bord est déjà configuré dans votre projet. Si vous venez d'installer le projet, assurez-vous d'exécuter :

```bash
npm install
```

## Utilisation

### Option 1 : Interface interactive

Pour lancer le hub des tableaux de bord avec interface interactive :

```bash
npm run dashboard
```

Cette commande affiche un menu qui vous permet de sélectionner le tableau de bord à lancer parmi les options disponibles.

### Option 2 : Lancement direct

Pour lancer directement un tableau de bord spécifique :

```bash
npm run dashboard:migration    # Tableau de bord des migrations
npm run dashboard:audit        # Tableau de bord d'audit
npm run dashboard:agents       # Tableau de bord des agents
npm run dashboard:unified      # Tableau de bord unifié à 3 couches
```

### Option 3 : Via ligne de commande

```bash
# Lancer le tableau de bord des migrations
node scripts/launch-dashboard.js migration

# Lancer le tableau de bord d'audit
node scripts/launch-dashboard.js audit

# Afficher l'aide
node scripts/launch-dashboard.js --help
```

### Option 4 : Tous les tableaux de bord

Pour lancer tous les tableaux de bord simultanément :

```bash
npm run dashboard:all
```

## Tableaux de bord disponibles

1. **Migrations** - Visualisation des performances et métriques du pipeline de migration
   - Progressions des migrations
   - Statistiques par module
   - Historique des migrations
   - Analyse des erreurs

2. **Audit** - Audit et vérification de conformité des migrations
   - Résultats des audits
   - Alertes et problèmes détectés
   - Recommandations

3. **Agents** - Supervision et configuration des agents
   - État des agents
   - Performances
   - Configuration
   - Logs d'exécution

4. **Tableau de bord unifié** - Vue synthétique des 3 couches
   - Orchestration
   - Agents
   - Métier
   - Métriques d'interconnexion

## Architecture

Le hub de tableaux de bord s'intègre avec l'architecture existante :

- Il utilise les tableaux de bord spécifiques existants
- Il fournit une interface unifiée pour y accéder
- Il permet la visualisation des interconnexions entre les différentes couches

## Personnalisation

Pour ajouter un nouveau tableau de bord au hub, modifiez le fichier `scripts/launch-dashboard.js` en ajoutant une entrée dans le tableau `dashboards` :

```javascript
{
  id: 'mon-dashboard',
  name: 'Mon Tableau de Bord',
  command: 'npm run mon-script',
  description: 'Description de mon tableau de bord',
  category: 'core' // 'core', 'agents' ou 'advanced'
}
```

Puis ajoutez un script correspondant dans `package.json` :

```json
"dashboard:mon-dashboard": "npm run mon-script"
```

## Dépannage

Si vous rencontrez des problèmes avec le hub de tableaux de bord :

1. Vérifiez que tous les tableaux de bord sous-jacents fonctionnent correctement
2. Assurez-vous que le package `concurrently` est installé : `npm install --save-dev concurrently`
3. Vérifiez les logs pour identifier les erreurs potentielles : `npm run logs`