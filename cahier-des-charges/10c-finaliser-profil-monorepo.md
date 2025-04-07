# ✅ 3. Finaliser le profil du monorepo (profil de référence)

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

## 📌 Utilisation

- Tous ces fichiers sont utilisés par les agents IA (dev-generator, audit-checker, route-mapper) pour :
  - Garantir une migration **cohérente avec l'existant**
  - Détecter automatiquement les anomalies ou divergences
  - Générer du code conforme aux pratiques internes

---

## ✅ Checklist

- [ ] Les fichiers ci-dessus sont présents dans `/profil/`
- [ ] Tous les fichiers ont été validés à partir du code existant
- [ ] Chaque agent IA les référence au chargement
- [ ] Le changelog contient la date de création du profil de référence
- [ ] Une PR `profil-initialisation` est créée avec les fichiers de base

💡 Ces fichiers peuvent être générés automatiquement via l'agent `monorepo-analyzer.ts`
et intégrés dans un pipeline `n8n` déclenché à chaque mise à jour majeure.
