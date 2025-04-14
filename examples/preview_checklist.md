# Checklist de prévisualisation - PR #42

URL: https://pr-42.preview.mysite.io

## À vérifier manuellement

- [ ] L'interface utilisateur correspond à la maquette
- [ ] Les fonctionnalités clés sont opérationnelles
- [ ] La navigation fonctionne correctement
- [ ] Le design est responsive (mobile, tablette, desktop)
- [ ] Les performances sont satisfaisantes

## Vérifications automatiques

- [x] Balises SEO correctement configurées
- [x] Captures d'écran générées
- [x] Rapport SEO généré

## Routes testées

- /
- /produits
- /produits/detail/123
- /contact

## Notes techniques

- Le déploiement utilise Docker + Traefik
- Base de données : PostgreSQL temporaire
- Authentification : Désactivée pour faciliter les tests

## Comment tester

1. Ouvrez l'URL de prévisualisation
2. Vérifiez chaque route listée ci-dessus
3. Testez les fonctionnalités sur desktop et mobile
4. Vérifiez la conformité des métadonnées SEO
5. Validez l'accessibilité avec l'outil de votre choix

## Captures d'écran

Les captures d'écran se trouvent dans le dossier `.preview/fiche-42/snapshots/`.

---

⚠️ Cet environnement de prévisualisation sera automatiquement supprimé après la fusion de la PR ou après 7 jours d'inactivité.