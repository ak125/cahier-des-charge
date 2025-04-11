# ✅ 2. Vérification et validation de l'environnement de test

🎯 Objectif : S'assurer que tous les outils critiques de migration sont opérationnels, interconnectés, et correctement configurés avant le lancement du pipeline.

---

## 🔍 Vérification de l'environnement

| Outil                      | Objectif |
|----------------------------|----------|
| **n8n**                    | Orchestrateur d'agents IA. Doit être déployé avec accès au filesystem pour lecture/écriture. |
| **Docker / Code Server**  | Nécessaires pour l'exécution des agents, tâches automatisées, scripts de conversion et analyse. |
| **MCP**                    | Doit être configuré avec un token GitHub valide pour créer/valider des PR automatisées. |
| **Supabase** ou **CSV centralisé** | Base de données ou fichier de suivi des fichiers PHP migrés (statut, date, responsable, delta). |
| **Coolify** ou **Netlify Preview** | Permet la prévisualisation automatique des PR (version migrée vs legacy) via une URL unique. |

---

## ✅ Checklist de validation

- [ ] n8n est opérationnel, accessible via navigateur
- [ ] Les agents de test s'exécutent correctement via Code Server/Docker
- [ ] MCP répond à une requête de test avec le token GitHub
- [ ] Supabase contient une table `migration_status` ou CSV accessible
- [ ] Chaque PR de migration génère un lien de preview Netlify ou Coolify

💡 Cette vérification peut être automatisée dans `n8n` via un agent `env-tester.ts`
et déclenchée avant chaque exécution majeure du pipeline de migration.
