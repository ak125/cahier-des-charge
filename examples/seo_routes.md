# 📈 Routes SEO Critiques

| URL legacy | Cible migrée | Action | Impact SEO |
|------------|--------------|--------|------------|
| ^article-([0-9]+)\.html$ | /blog/$1 | Redirection 301 | 🔴 high |
| ^corepanel/blog-([0-9]+)\.html$ | /blog/$1 | Redirection 301 | 🔴 high |
| ^pieces/([a-z0-9-]+)/([a-z0-9-]+)$ | /core/_seo/pieces.gamme.php?marque=$1&type=$2 | Rewrite | 🔴 high |
| ^pieces/([a-z0-9-]+)$ | /core/_seo/marque.php?slug=$1 | Rewrite | 🔴 high |
| /blog.php | /blog | Redirection 301 | 🔴 high |
| ^produit/([a-z0-9-]+)$ | /produits.php?slug=$1 | Rewrite | 🔴 high |
| ^categorie/([a-z0-9-]+)$ | /categories/$1 | Redirection 301 | 🟠 medium |
| /ancien-page.html | /nouvelle-page | Redirection 301 | 🟠 medium |
| /promo.php | /promotions | Redirection 301 | 🟠 medium |

## 🚨 Priorité : Ces routes génèrent du trafic important

## 🧩 Suggestions de routes Remix à générer

- `routes/blog_.$id.tsx` → pour correspondre à `^article-([0-9]+)\.html$`
- `routes/blog_.$id.tsx` → pour correspondre à `^corepanel/blog-([0-9]+)\.html$`
- `routes/pieces_.$marque_.$type.tsx` → pour correspondre à `^pieces/([a-z0-9-]+)/([a-z0-9-]+)$`
- `routes/pieces_.$slug.tsx` → pour correspondre à `^pieces/([a-z0-9-]+)$`
