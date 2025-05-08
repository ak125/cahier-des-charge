# Rapport de performance Lighthouse - PR #42

URL de prévisualisation: https://pr-42.preview.mysite.io

Date de génération: 13/04/2025 14:30:22

## Résumé des performances

| Route | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | CLS | TTI |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| / | 🟢 92 | 🟡 88 | 🟢 93 | 🟢 98 | 0.7s | 1.2s | 0.023 | 1.8s |
| /produits | 🟡 85 | 🟡 85 | 🟡 89 | 🟢 95 | 0.8s | 1.4s | 0.015 | 2.1s |
| /produits/detail/123 | 🟡 78 | 🟢 90 | 🟡 88 | 🟢 97 | 1.0s | 1.8s | 0.032 | 2.5s |
| /contact | 🟢 95 | 🟢 92 | 🟢 94 | 🟢 100 | 0.6s | 1.0s | 0.010 | 1.5s |

## Explication des métriques

- **Performance**: Score global de performance (0-100)
- **Accessibilité**: Conformité aux normes d'accessibilité (0-100)
- **Bonnes pratiques**: Respect des bonnes pratiques web (0-100)
- **SEO**: Optimisation pour les moteurs de recherche (0-100)
- **FCP (First Contentful Paint)**: Temps jusqu'au premier affichage de contenu
- **LCP (Largest Contentful Paint)**: Temps jusqu'à l'affichage du plus grand élément visible
- **CLS (Cumulative Layout Shift)**: Mesure de la stabilité visuelle (plus c'est bas, mieux c'est)
- **TTI (Time to Interactive)**: Temps jusqu'à ce que la page soit interactive

## Classification des performances

| Score | Évaluation | Description |
| --- | --- | --- |
| 90-100 | 🟢 Excellent | La page est optimale |
| 70-89 | 🟡 Bon | La page présente quelques opportunités d'amélioration |
| 50-69 | 🟠 Moyen | La page présente des problèmes de performance importants |
| 0-49 | 🔴 Faible | La page présente des problèmes critiques de performance |

## Détails complets

Les rapports Lighthouse complets sont disponibles dans le dossier `.preview/fiche-42/lighthouse/`.

## Problèmes identifiés et recommandations

### Route: /produits/detail/123

- ⚠️ Performance à améliorer (78/100)
- ⚠️ LCP légèrement lent (1.8s)

### Recommandations générales

1. **Optimisation des images**
   - Utiliser des formats modernes (WebP, AVIF)
   - Appliquer une compression adaptée
   - Utiliser le lazy loading pour les images hors écran

2. **Optimisation JavaScript**
   - Réduire la taille des bundles JavaScript
   - Utiliser le code splitting pour ne charger que le nécessaire
   - Implémenter une stratégie de cache efficace

3. **CSS critique**
   - Extraire et intégrer le CSS critique dans la page
   - Différer le chargement du CSS non essentiel

4. **Optimisation des polices**
   - Utiliser font-display: swap
   - Précharger les polices essentielles

Ces améliorations devraient permettre d'atteindre un score de performance supérieur à 90 sur l'ensemble des pages.