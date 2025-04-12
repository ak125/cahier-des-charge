# 🧠 Cartographie Sémantique des Tables

## 🧩 Entités métier détectées

### Module produit

- **PIECES**
- **PIECES_GAMME**

### Module catalogue

- **AUTO_MARQUE**
- **AUTO_MODELE**

### Module user

- **USERS**

### Module commande

- **COMMANDES**

### Module paiement

- **PAIEMENTS**

### Module livraison

- **LIVRAISONS**

## 🔗 Liaisons détectées

### Via tables de liaison

- **USERS** <--> **COMMANDES** via *USERS_COMMANDES*
- **PIECES** <--> **COMMANDES** via *PIECES_COMMANDES*
- **PIECES** <--> **AUTO_MODELE** via *PIECES_COMPATIBILITE*

### Liaisons directes

- **AUTO_MODELE** --> **AUTO_MARQUE**
- **COMMANDES** --> **PAIEMENTS**
- **COMMANDES** --> **LIVRAISONS**
- **PIECES** --> **PIECES_GAMME**

## 🛠️ Tables techniques

- **CONFIG_LOG**
- **TRACKING_STATS**
- **SESSIONS_TEMP**

## ⚠️ Tables orphelines suspectes

- **TMP_IMPORT2020**
- **OLD_CLIENTS_IMPORT**

## 📊 Statistiques

- Total des tables: **16**
- Entités métier: **8**
- Tables de liaison: **3**
- Tables techniques: **3**
- Tables orphelines: **2**
- Relations identifiées: **7**