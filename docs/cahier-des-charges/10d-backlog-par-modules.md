# ✅ 4. Organiser le backlog de migration par modules fonctionnels

🎯 Objectif : Structurer le backlog de migration selon des **domaines fonctionnels clairs**, facilitant la gestion des dépendances, le versioning progressif et la coordination multi-équipe.

---

## 🧩 Exemples de groupes de modules fonctionnels

| Groupe                        | Modules inclus                              | Avantages |
|------------------------------|---------------------------------------------|-----------|
| **Authentification**         | Login, inscription, mot de passe oublié     | Découplé, peu dépendant |
| **Compte utilisateur**       | Données personnelles, historique commandes  | Migration autonome |
| **Panier / Commande**        | Shopping Cart, étapes de commande, paiement | Bloc logique complet |
| **Produits**                 | Fiche produit, variantes, stocks            | Optimisé pour les tests UI/API |
| **Recherche & navigation**   | Moteur, filtres, redirections SEO           | Impact SEO immédiat |
| **SEO / Réécriture**         | Meta, URLs legacy, page 404/410/412         | Préserve l'indexation |
| **Admin & backoffice**       | Gestion catalogue, comptes, logs            | Utilisateurs internes |

---

## 📦 Avantages de cette approche

- ✅ Migration **modulaire** et **rollbackable**
- ✅ Moins de conflits entre branches ou fichiers
- ✅ Permet une PR par bloc fonctionnel
- ✅ Adapté à une gestion Kanban dans `backlog.md`
- ✅ Revue ciblée, déploiement par tranche

---

## ✅ À faire

- [ ] Lier chaque ligne de `13-backlog.md` à un groupe fonctionnel
- [ ] Ajouter un tag dans le tableau : `fonction=auth / produits / seo`
- [ ] Créer une **vue par groupe fonctionnel** dans Notion ou GitHub Projects
- [ ] Utiliser un agent IA `backlog-classifier.ts` pour classer automatiquement les fichiers

💡 Cette stratégie est idéale pour synchroniser le backlog avec les fichiers PHP legacy et les blocs Remix/NestJS modernes.
