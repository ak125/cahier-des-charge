#!/bin/bash

# Script wrapper pour exécuter Earthly dans un environnement conteneurisé
# Ce script ajoute des options qui fonctionnent mieux dans des environnements comme GitHub Codespaces

# Exécuter Earthly avec des options adaptées aux environnements conteneurisés
earthly --no-output --no-cache "$@"
