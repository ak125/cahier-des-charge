# Documentation des commandes disponibles

## Scripts de mise à jour et de vérification

| Script | Description | Utilisation |
|--------|-------------|-------------|
| `update-cahier.sh` | Met à jour le cahier des charges complet | `./update-cahier.sh` |
| `verify-cahier.sh` | Vérifie la cohérence et la structure du cahier des charges | `./verify-cahier.sh` |

### Utilisation typique du workflow de mise à jour

```bash
# 1. Mettre à jour le cahier des charges
./update-cahier.sh

# 2. Vérifier la cohérence du cahier
./verify-cahier.sh

# 3. En cas de problèmes détectés, corriger puis revérifier
vim cahier-des-charges/[fichier-problématique].md
./verify-cahier.sh
```

Le script `update-cahier.sh` effectue plusieurs opérations:
- Met à jour les références croisées entre les documents
- Régénère la table des matières du sommaire
- Met à jour les numéros de version si nécessaire
- Synchronise les métadonnées entre les fichiers

Le script `verify-cahier.sh` vérifie:
- La présence de tous les fichiers requis
- La cohérence des liens internes
- La validité des formats markdown
- La conformité avec les standards du projet
- L'absence de sections obligatoires manquantes