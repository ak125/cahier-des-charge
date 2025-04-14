<?php
/**
 * Fiche produit
 * 
 * Affiche les détails d'un produit à partir de son ID
 * Les métadonnées SEO sont générées dynamiquement
 */

// Configuration de la base de données MySQL
$db_host = "localhost";
$db_user = "admin";
$db_pass = "password";
$db_name = "catalogue_produits";

// Connexion à la base de données
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    die("Connexion échouée: " . $conn->connect_error);
}

// Récupération de l'ID du produit depuis l'URL
$product_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($product_id <= 0) {
    header("Location: /catalogue.php");
    exit;
}

// Récupération des détails du produit
$sql = "SELECT * FROM produits WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $product_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows == 0) {
    header("HTTP/1.0 404 Not Found");
    include "404.php";
    exit;
}

$product = $result->fetch_assoc();

// Récupération des catégories associées
$sql_categories = "SELECT c.nom FROM categories c 
                  JOIN produit_categories pc ON c.id = pc.categorie_id 
                  WHERE pc.produit_id = ?";
$stmt_categories = $conn->prepare($sql_categories);
$stmt_categories->bind_param("i", $product_id);
$stmt_categories->execute();
$result_categories = $stmt_categories->get_result();

$categories = [];
while ($cat = $result_categories->fetch_assoc()) {
    $categories[] = $cat['nom'];
}

// Fonction pour générer la description SEO
function generateSeoDescription($product) {
    return "Découvrez " . $product['nom'] . " - " . substr(strip_tags($product['description']), 0, 150) . "...";
}

// Métadonnées pour le SEO
$page_title = $product['nom'] . " | Notre Catalogue";
$meta_description = generateSeoDescription($product);
$canonical_url = "https://www.notre-site.fr/fiche.php?id=" . $product_id;

// URL de l'image principale
$image_url = !empty($product['image_principale']) 
    ? "/images/produits/" . $product['image_principale'] 
    : "/images/default-product.jpg";

// Fermeture des connexions
$stmt->close();
$stmt_categories->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($page_title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($meta_description); ?>">
    <link rel="canonical" href="<?php echo htmlspecialchars($canonical_url); ?>">
    <link rel="stylesheet" href="/css/styles.css">
    <!-- Open Graph tags -->
    <meta property="og:title" content="<?php echo htmlspecialchars($product['nom']); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($meta_description); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($image_url); ?>">
    <meta property="og:url" content="<?php echo htmlspecialchars($canonical_url); ?>">
    <meta property="og:type" content="product">
</head>
<body>
    <header>
        <?php include "includes/header.php"; ?>
    </header>
    
    <main class="container product-page">
        <nav class="breadcrumb">
            <ul>
                <li><a href="/">Accueil</a></li>
                <li><a href="/catalogue.php">Catalogue</a></li>
                <?php if (!empty($categories)): ?>
                <li><a href="/catalogue.php?cat=<?php echo urlencode($categories[0]); ?>"><?php echo htmlspecialchars($categories[0]); ?></a></li>
                <?php endif; ?>
                <li class="active"><?php echo htmlspecialchars($product['nom']); ?></li>
            </ul>
        </nav>

        <div class="product-container">
            <div class="product-gallery">
                <img src="<?php echo htmlspecialchars($image_url); ?>" alt="<?php echo htmlspecialchars($product['nom']); ?>" class="main-image">
                
                <?php if (!empty($product['images_supplementaires'])): ?>
                <div class="thumbnail-container">
                    <?php foreach (explode(',', $product['images_supplementaires']) as $image): ?>
                    <img src="/images/produits/<?php echo htmlspecialchars(trim($image)); ?>" alt="<?php echo htmlspecialchars($product['nom']); ?>" class="thumbnail">
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
            </div>
            
            <div class="product-details">
                <h1><?php echo htmlspecialchars($product['nom']); ?></h1>
                
                <div class="product-categories">
                    <?php foreach ($categories as $category): ?>
                    <span class="category-tag"><?php echo htmlspecialchars($category); ?></span>
                    <?php endforeach; ?>
                </div>
                
                <div class="product-price">
                    <?php if ($product['prix_promo'] > 0): ?>
                    <span class="original-price"><?php echo number_format($product['prix'], 2, ',', ' '); ?> €</span>
                    <span class="promo-price"><?php echo number_format($product['prix_promo'], 2, ',', ' '); ?> €</span>
                    <?php else: ?>
                    <span class="current-price"><?php echo number_format($product['prix'], 2, ',', ' '); ?> €</span>
                    <?php endif; ?>
                </div>
                
                <div class="product-availability">
                    <?php if ($product['stock'] > 0): ?>
                    <span class="in-stock">En stock (<?php echo $product['stock']; ?>)</span>
                    <?php else: ?>
                    <span class="out-of-stock">Rupture de stock</span>
                    <?php endif; ?>
                </div>
                
                <div class="product-reference">
                    Référence: <?php echo htmlspecialchars($product['reference']); ?>
                </div>
                
                <?php if ($product['stock'] > 0): ?>
                <form action="/panier.php" method="post" class="add-to-cart-form">
                    <input type="hidden" name="product_id" value="<?php echo $product_id; ?>">
                    <div class="quantity-control">
                        <label for="quantity">Quantité:</label>
                        <input type="number" id="quantity" name="quantity" value="1" min="1" max="<?php echo $product['stock']; ?>">
                    </div>
                    <button type="submit" class="add-to-cart-button">Ajouter au panier</button>
                </form>
                <?php endif; ?>
                
                <div class="product-description">
                    <h2>Description</h2>
                    <?php echo $product['description']; ?>
                </div>
                
                <?php if (!empty($product['specifications'])): ?>
                <div class="product-specifications">
                    <h2>Caractéristiques techniques</h2>
                    <table>
                        <?php 
                        $specs = json_decode($product['specifications'], true);
                        if (is_array($specs)): 
                            foreach ($specs as $key => $value): 
                        ?>
                        <tr>
                            <th><?php echo htmlspecialchars($key); ?></th>
                            <td><?php echo htmlspecialchars($value); ?></td>
                        </tr>
                        <?php 
                            endforeach; 
                        endif; 
                        ?>
                    </table>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <?php if (!empty($product['produits_associes'])): ?>
        <div class="related-products">
            <h2>Produits associés</h2>
            <div class="products-grid">
                <?php
                $related_ids = explode(',', $product['produits_associes']);
                $placeholders = str_repeat('?,', count($related_ids) - 1) . '?';
                $sql_related = "SELECT id, nom, prix, prix_promo, image_principale FROM produits WHERE id IN ($placeholders)";
                
                $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
                $stmt_related = $conn->prepare($sql_related);
                
                $types = str_repeat('i', count($related_ids));
                $stmt_related->bind_param($types, ...$related_ids);
                $stmt_related->execute();
                $result_related = $stmt_related->get_result();
                
                while ($related = $result_related->fetch_assoc()):
                    $related_image = !empty($related['image_principale']) 
                        ? "/images/produits/" . $related['image_principale'] 
                        : "/images/default-product.jpg";
                ?>
                <div class="product-card">
                    <a href="/fiche.php?id=<?php echo $related['id']; ?>">
                        <img src="<?php echo htmlspecialchars($related_image); ?>" alt="<?php echo htmlspecialchars($related['nom']); ?>">
                        <h3><?php echo htmlspecialchars($related['nom']); ?></h3>
                        <div class="product-price">
                            <?php if ($related['prix_promo'] > 0): ?>
                            <span class="original-price"><?php echo number_format($related['prix'], 2, ',', ' '); ?> €</span>
                            <span class="promo-price"><?php echo number_format($related['prix_promo'], 2, ',', ' '); ?> €</span>
                            <?php else: ?>
                            <span class="current-price"><?php echo number_format($related['prix'], 2, ',', ' '); ?> €</span>
                            <?php endif; ?>
                        </div>
                    </a>
                    <button class="quick-view-button" data-product-id="<?php echo $related['id']; ?>">Aperçu rapide</button>
                </div>
                <?php 
                endwhile;
                $stmt_related->close();
                $conn->close();
                ?>
            </div>
        </div>
        <?php endif; ?>
    </main>
    
    <footer>
        <?php include "includes/footer.php"; ?>
    </footer>
    
    <script src="/js/product.js"></script>
</body>
</html>