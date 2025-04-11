<?php
/**
 * Exemple de fichier PHP pour tester l'agent de migration
 */

// Connexion à la base de données
$db = new PDO('mysql:host=localhost;dbname=test', 'user', 'password');

// Fonction pour récupérer un utilisateur par ID
function getUserById($id) {
    global $db;
    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Affichage des données utilisateur
$user = getUserById(1);
?>

<!DOCTYPE html>
<html>
<head>
    <title>Profil utilisateur</title>
</head>
<body>
    <h1>Profil de <?php echo $user['name']; ?></h1>
    <p>Email: <?php echo $user['email']; ?></p>
</body>
</html>
