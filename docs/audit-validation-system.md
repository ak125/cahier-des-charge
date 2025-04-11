# Système de Validation d'Audit dans n8n

Ce document explique comment utiliser le système automatisé de validation et correction des fichiers d'audit qui a été intégré dans votre pipeline n8n.

## Vue d'ensemble

Le système de validation d'audit vous permet de :
- Vérifier automatiquement la cohérence des fichiers générés lors de chaque audit
- Détecter les fichiers manquants, les incohérences et les doublons
- Corriger automatiquement les problèmes détectés
- Visualiser les résultats dans un tableau de bord Remix

## Composants du système

1. **Scripts de validation** (`/utils/validate-audit-outputs.ts` et `/utils/recheck-missing-outputs.ts`)
   - Vérifient l'existence et la cohérence des fichiers d'audit
   - Génèrent des rapports détaillés
   - Proposent des corrections automatiques

2. **Nœud personnalisé n8n** (`/custom-nodes/audit-validator/`)
   - Intègre les scripts de validation directement dans n8n
   - Offre une interface graphique pour paramétrer les validations
   - S'intègre avec le reste de votre pipeline

3. **Workflow "Audit Validator"** dans le pipeline n8n
   - S'exécute automatiquement toutes les 30 minutes
   - Envoie des alertes en cas de problème détecté
   - Déclenche les corrections automatiques si nécessaire

4. **Tableau de bord Remix** (`/dashboard/AuditDashboard.tsx`)
   - Affiche tous les audits et leurs métadonnées
   - Met en évidence les problèmes détectés
   - Permet de filtrer et rechercher les audits

## Installation du nœud personnalisé

Pour installer le nœud personnalisé "Audit Validator" dans n8n :

1. Assurez-vous que n8n est arrêté
2. Exécutez le script d'installation :
   ```bash
   cd /workspaces/cahier-des-charge/custom-nodes/audit-validator
   ./install-audit-validator-node.sh
   ```
3. Redémarrez n8n

Le nœud sera alors disponible dans l'interface de n8n sous le nom "Audit Validator".

## Utilisation du nœud Audit Validator

Le nœud Audit Validator propose trois modes d'opération :

1. **Valider les audits** : Vérifie la cohérence des fichiers d'audit et génère un rapport
2. **Corriger automatiquement** : Tente de résoudre les problèmes détectés en regénérant les fichiers manquants
3. **Vérifier et corriger** : Combine les deux opérations précédentes

### Paramètres disponibles

- **Chemin de base** : Répertoire racine du projet
- **Mode verbeux** : Active les logs détaillés
- **Force la correction** : Force la correction même si aucun problème n'est détecté
- **Dossier de rapports** : Chemin où les rapports seront générés

## Workflow "Audit Validator"

Ce workflow est déjà configuré dans votre pipeline n8n. Il s'exécute automatiquement toutes les 30 minutes et :

1. Lance la validation des audits
2. Détermine s'il y a des problèmes
3. Essaie de corriger automatiquement si nécessaire
4. Envoie des notifications avec le résumé des opérations

## Visualisation dans le tableau de bord

Le tableau de bord Remix (`/dashboard/AuditDashboard.tsx`) vous permet de :

1. Voir tous vos audits et leur statut
2. Filtrer par nom, type ou statut
3. Identifier rapidement les problèmes détectés
4. Accéder directement aux différents fichiers d'audit
5. Consulter des statistiques globales sur vos audits

Pour accéder au tableau de bord :

```
http://localhost:3000/audit-dashboard
```

## Exécution manuelle de la validation

Vous pouvez lancer manuellement la validation des audits de plusieurs façons :

1. Via n8n en déclenchant le workflow "Audit Validator"
2. En ligne de commande :
   ```bash
   cd /workspaces/cahier-des-charge
   npx ts-node utils/validate-audit-outputs.ts --verbose
   ```
3. Pour la correction automatique :
   ```bash
   cd /workspaces/cahier-des-charge
   npx ts-node utils/recheck-missing-outputs.ts --force
   ```

## Gestion des rapports

Les rapports générés sont stockés dans le dossier `/reports/` :

- `audit_consistency_report.json` : Résultat de la validation des audits
- `recheck_report.json` : Résultat des tentatives de correction
- `latest_validation_status.json` : État de la dernière validation

## Dépannage

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans n8n pour le workflow "Audit Validator"
2. Consultez les rapports générés dans `/reports/`
3. Exécutez manuellement les scripts pour des logs plus détaillés
4. Assurez-vous que les chemins configurés sont corrects

## Prochaines améliorations

- Intégration avec GitHub Actions pour validation automatique lors des PR
- Ajout de métriques de qualité des audits
- Notifications Slack/Discord personnalisables
- Support pour d'autres types de fichiers d'analyse