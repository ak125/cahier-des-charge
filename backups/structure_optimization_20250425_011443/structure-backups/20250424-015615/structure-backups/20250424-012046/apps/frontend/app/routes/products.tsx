import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from @remix-run/nodestructure-agent";
import { Form, useActionData, useLoaderData } from @remix-run/reactstructure-agent";
import { conform, useForm } from @conform-to/reactstructure-agent";
import { getFieldsetConstraint, parse } from @conform-to/zodstructure-agent";
import { ProductCreateSchema, ProductSchema, type Product } from @schemas/zod-schemasstructure-agent";

/**
 * Loader pour récupérer les produits
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const products = await fetch(`${process.env.API_URL}/products`).then(res => res.json());
  return json({ products });
}

/**
 * Action pour créer un nouveau produit
 */
export async function action({ request }: ActionFunctionArgs) {
  // Récupération des données du formulaire
  const formData = await request.formData();

  // Parse et validation avec Zod via conform
  const submission = parse(formData, {
    schema: ProductCreateSchema,
  });

  // Si la validation échoue, on renvoie les erreurs
  if (!submission.value || submission.intent !== "submit") {
    return json({ status: "error", submission }, { status: 400 });
  }

  try {
    // Envoi des données validées à l'API
    const response = await fetch(`${process.env.API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission.value),
    });

    if (!response.ok) {
      const error = await response.json();
      return json({ status: "error", error, submission }, { status: response.status });
    }

    const product = await response.json();
    return json({ status: "success", product, submission });

  } catch (error) {
    return json({ status: "error", error: { message: "Une erreur s'est produite lors de la création du produit" }, submission }, { status: 500 });
  }
}

export default function ProductsPage() {
  // Récupération des données du loader
  const { products } = useLoaderData<typeof loader>();
  
  // Récupération des données de l'action
  const actionData = useActionData<typeof action>();
  
  // Initialisation du formulaire avec conform et notre schéma Zod
  const [form, fields] = useForm({
    id: "product-form",
    constraint: getFieldsetConstraint(ProductCreateSchema),
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: ProductCreateSchema });
    },
    shouldRevalidate: "onInput",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des produits</h1>
      
      {/* Formulaire de création de produit */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Créer un nouveau produit</h2>
        
        {actionData?.status === "success" && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Produit créé avec succès !
          </div>
        )}
        
        <Form method="post" {...form.props}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom du produit */}
            <div>
              <label htmlFor={fields.name.id} className="block mb-1 font-medium">
                Nom du produit
              </label>
              <input
                {...conform.input(fields.name)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Nom du produit"
              />
              {fields.name.error && (
                <p className="text-red-500 text-sm mt-1">{fields.name.error}</p>
              )}
            </div>
            
            {/* Prix */}
            <div>
              <label htmlFor={fields.price.id} className="block mb-1 font-medium">
                Prix
              </label>
              <input
                {...conform.input(fields.price, { type: "number" })}
                step="0.01"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
              />
              {fields.price.error && (
                <p className="text-red-500 text-sm mt-1">{fields.price.error}</p>
              )}
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor={fields.description.id} className="block mb-1 font-medium">
                Description
              </label>
              <textarea
                {...conform.textarea(fields.description)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Description du produit"
              />
              {fields.description.error && (
                <p className="text-red-500 text-sm mt-1">{fields.description.error}</p>
              )}
            </div>
            
            {/* Stock */}
            <div>
              <label htmlFor={fields.stock.id} className="block mb-1 font-medium">
                Stock
              </label>
              <input
                {...conform.input(fields.stock, { type: "number" })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0"
              />
              {fields.stock.error && (
                <p className="text-red-500 text-sm mt-1">{fields.stock.error}</p>
              )}
            </div>
            
            {/* Catégorie */}
            <div>
              <label htmlFor={fields.categoryId.id} className="block mb-1 font-medium">
                Catégorie
              </label>
              <select
                {...conform.select(fields.categoryId)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="cat_01">Électronique</option>
                <option value="cat_02">Vêtements</option>
                <option value="cat_03">Alimentation</option>
              </select>
              {fields.categoryId.error && (
                <p className="text-red-500 text-sm mt-1">{fields.categoryId.error}</p>
              )}
            </div>
            
            {/* URL des images (pour simplifier, on utilise un simple champ texte) */}
            <div className="md:col-span-2">
              <label htmlFor={fields.images.id} className="block mb-1 font-medium">
                URL des images (séparées par des virgules)
              </label>
              <input
                {...conform.input(fields.images)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
              {fields.images.error && (
                <p className="text-red-500 text-sm mt-1">{fields.images.error}</p>
              )}
            </div>
            
            {/* Actif/Inactif */}
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  {...conform.input(fields.isActive, { type: "checkbox" })}
                  className="mr-2"
                />
                <span>Produit actif</span>
              </label>
              {fields.isActive.error && (
                <p className="text-red-500 text-sm mt-1">{fields.isActive.error}</p>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Créer le produit
            </button>
          </div>
        </Form>
      </div>
      
      {/* Liste des produits */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Liste des produits</h2>
        
        {products.length === 0 ? (
          <p className="text-gray-500">Aucun produit disponible</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product: Product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.price.toFixed(2)} €</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`/products/${product.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                        Modifier
                      </a>
                      <Form method="delete" action={`/products/${product.id}`} className="inline">
                        <button type="submit" className="text-red-600 hover:text-red-900">
                          Supprimer
                        </button>
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}