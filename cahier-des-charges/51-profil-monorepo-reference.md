# 🏗️ Finaliser le profil du monorepo (profil de référence)

🎯 Objectif : Créer un profil d'analyse du monorepo **avant migration**, utilisé comme référence dans tous les agents IA (générateurs, validateurs, synchronisateurs, etc.)

---

## 🗂️ Fichiers de profil à générer et valider

| Fichier                         | Description |
|--------------------------------|-------------|
| `code_style_profile.json`      | Représente les conventions de code en vigueur : indentation, noms de classes, importations, typage |
| `monorepo_dependencies.json`   | Liste des packages utilisés dans le projet (Remix, NestJS, Prisma, DTOs, tailwind, etc.) |
| `nestjs_module_patterns.json`  | Exemple type d'un module NestJS avec structure `controller/service/dto/module` |
| `remix_component_patterns.json`| Exemples des composants Remix utilisés : `loader.ts`, `meta.ts`, `layout.tsx`, `form.tsx` |
| `tailwind_tokens.json`         | Liste des classes Tailwind custom utilisées (couleurs, spacings, breakpoints) |

---

## 📌 Rôle dans la cohérence des agents IA

Ces fichiers de profil jouent un rôle essentiel pour garantir la cohérence du processus de migration:

1. **Référence normative**: Établissent les standards et conventions que les agents doivent suivre
2. **Contextualisation**: Fournissent le contexte spécifique du projet aux modèles génériques
3. **Paramétrage dynamique**: Permettent d'ajuster les prompts et configurations des agents
4. **Contrôle qualité**: Servent de base pour la vérification automatique des résultats
5. **Évolution contrôlée**: Documentent l'évolution des pratiques de développement

Les agents IA utilisent ces fichiers pour:
- Générer du code structurellement cohérent avec l'existant
- Adopter les conventions de nommage et de style du projet
- Intégrer les bonnes dépendances et versions
- Reproduire les patterns architecturaux établis
- Respecter la hiérarchie des composants et modules

---

## ✅ Checklist de validation

- [ ] **Extraction** - Les fichiers sont extraits d'un monorepo existant et représentatif
- [ ] **Exhaustivité** - Tous les modèles essentiels sont capturés (NestJS, Remix, Prisma)
- [ ] **Précision** - Les conventions décrites correspondent à la réalité du code
- [ ] **Structures** - Les structures de fichiers reflètent l'organisation actuelle
- [ ] **Validation technique** - Les profils ont été revus par un lead développeur
- [ ] **Emplacement** - Les fichiers sont disponibles dans le dossier `/profil/`
- [ ] **Versionnement** - Une version initiale est établie et documentée
- [ ] **Intégration** - Les agents IA sont configurés pour utiliser ces fichiers
- [ ] **Testabilité** - Des tests de cohérence avec le profil sont implémentés
- [ ] **Documentation** - Le profil et son utilisation sont documentés

---

## 🔧 Génération automatique avec monorepo-analyzer.ts

Le script `monorepo-analyzer.ts` permet de générer automatiquement les fichiers de profil:
