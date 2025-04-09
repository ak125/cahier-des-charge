# 🔁 Migration Plan – {{FILE_NAME}}

## 📊 Analyse IA
- 📁 Fichier source : `{{FILE_PATH}}`
- 🧠 Score de priorité : {{PRIORITY_SCORE}}/10
- 🔍 Type : {{FILE_ROLE}}

## 🧱 Composants générés
{{#COMPONENTS}}
- `{{NAME}}` {{STATUS_EMOJI}}
{{/COMPONENTS}}

## 🔄 Base de données
- Tables mappées : {{SQL_TABLES}}
- Migration SQL : {{SQL_MIGRATION_STATUS}}

## 🧪 QA
- Tests unitaires : {{UNIT_TESTS_STATUS}}
- Tests E2E : {{E2E_TESTS_STATUS}}
- Validation SEO : {{SEO_VALIDATION_STATUS}}

## 📌 PR GitHub
- Branche : `{{BRANCH_NAME}}`
- Labels : {{LABELS}}
- Statut : {{PR_STATUS}}

## 📋 Tâches restantes
{{#PENDING_TASKS}}
- {{DESCRIPTION}} ({{TYPE}})
{{/PENDING_TASKS}}

## 📈 Progression
{{PROGRESS_BAR}} {{PROGRESS_PERCENTAGE}}%
