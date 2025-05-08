#!/bin/bash

echo "Nettoyage des dossiers vides dans le projet..."

# Fonction pour supprimer récursivement les dossiers vides
clean_empty_dirs() {
  # Trouver tous les dossiers vides et les supprimer, en excluant node_modules et .git
  find "$1" -type d -empty -not -path "*/node_modules/*" -not -path "*/.git/*" -print -delete
}

# Nettoyer les dossiers vides dans le projet principal
clean_empty_dirs "/workspaces/cahier-des-charge"

echo "Nettoyage des dossiers vides terminé!"