/**
 * Route AI pour Remix - Intégration de l'IA locale dans Remix
 * 
 * Cette route fournit une API RESTful pour interagir avec le service d'IA locale
 * via Remix. Elle permet de générer du texte, d'analyser du code et de transformer
 * du code PHP en composants Remix.
 */

import { json } from @remix-run/nodestructure-agent';
import { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from @remix-run/nodestructure-agent';
import { useLoaderData, Form, useActionData, useNavigation } from @remix-run/reactstructure-agent';
import { useState } from reactstructure-agent';
import { createLocalAiService, LocalAiServiceConfig } from ../../../../packages/shared/ai/local-ai.servicestructure-agent';
import { z } from zodstructure-agent';

// Schéma de validation pour les requêtes d'IA
const AIRequestSchema = z.object({
  prompt: z.string().min(1, "Le prompt est requis"),
  model: z.string().default("deepseek-coder"),
  systemPrompt: z.string().optional(),
  context: z.string().optional(),
  temperature: z.number().min(0).max(1).default(0.2).optional(),
  action: z.enum(["generate", "analyze", "transform"]).default("generate")
});

// Config du service d'IA
const aiConfig: LocalAiServiceConfig = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'deepseek-coder',
  cacheExpiry: parseInt(process.env.CACHE_EXPIRY || '3600'),
  useCache: process.env.USE_CACHE !== 'false'
};

// Métadonnées de la page
export const meta: MetaFunction = () => {
  return [
    { title: "IA Assistant - Migration PHP vers Remix" },
    { name: "description", content: "Assistant d'IA pour l'analyse et la transformation de code PHP vers Remix" }
  ];
};

// Loader pour initialiser la page
export async function loader({ request }: LoaderFunctionArgs) {
  // Modèles disponibles
  const availableModels = [
    { id: "deepseek-coder", name: "DeepSeek Coder" },
    { id: "codellama", name: "Code Llama" },
    { id: "llama3", name: "Llama 3" },
    { id: "mistral", name: "Mistral" }
  ];

  // Actions disponibles
  const availableActions = [
    { id: "generate", name: "Générer du texte" },
    { id: "analyze", name: "Analyser du code" },
    { id: "transform", name: "Transformer PHP → Remix" }
  ];

  return json({
    modèles: availableModels,
    actions: availableActions,
    config: {
      model: aiConfig.model,
      useCache: aiConfig.useCache
    }
  });
}

// Action pour traiter les requêtes
export async function action({ request }: ActionFunctionArgs) {
  // Récupérer les données du formulaire
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData.entries());
  
  try {
    // Valider les données avec Zod
    const validatedData = AIRequestSchema.parse({
      ...rawData,
      temperature: rawData.temperature ? parseFloat(rawData.temperature as string) : undefined
    });
    
    // Initialiser le service d'IA
    const aiService = createLocalAiService(aiConfig);
    
    let result: string;
    
    // Effectuer l'action demandée
    switch (validatedData.action) {
      case "analyze":
        result = await aiService.analyzeCode(
          validatedData.prompt,
          "php", // Langage par défaut (PHP)
          validatedData.context,
          {
            systemPrompt: validatedData.systemPrompt,
            temperature: validatedData.temperature
          }
        );
        break;
        
      case "transform":
        result = await aiService.transformPhpToRemix(
          validatedData.prompt,
          validatedData.context,
          {
            systemPrompt: validatedData.systemPrompt,
            temperature: validatedData.temperature
          }
        );
        break;
        
      case "generate":
      default:
        result = await aiService.generate(
          validatedData.prompt,
          {
            systemPrompt: validatedData.systemPrompt,
            temperature: validatedData.temperature
          }
        );
    }
    
    // Fermer proprement les connexions
    await aiService.close();
    
    // Retourner le résultat
    return json({
      success: true,
      result,
      request: validatedData
    });
    
  } catch (error: any) {
    console.error("Erreur IA:", error);
    
    return json({
      success: false,
      error: error.message || "Une erreur s'est produite",
      validationErrors: error.errors || null
    }, { status: 400 });
  }
}

// Composant React
export default function AIAssistantRoute() {
  // Récupérer les données du loader et de l'action
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  // États locaux
  const [action, setAction] = useState("generate");
  
  // Déterminer si le formulaire est en cours de soumission
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <div className="ai-assistant-container">
      <h1>Assistant IA - Migration PHP vers Remix</h1>
      
      <div className="card">
        <Form method="post" className="ai-form">
          <div className="form-group">
            <label htmlFor="action">Action</label>
            <select 
              id="action" 
              name="action" 
              onChange={(e) => setAction(e.target.value)}
              disabled={isSubmitting}
            >
              {loaderData.actions.map(actionOption => (
                <option key={actionOption.id} value={actionOption.id}>
                  {actionOption.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="model">Modèle</label>
            <select 
              id="model" 
              name="model" 
              defaultValue={loaderData.config.model}
              disabled={isSubmitting}
            >
              {loaderData.modèles.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="temperature">Température</label>
            <input 
              type="range" 
              id="temperature" 
              name="temperature" 
              min="0" 
              max="1" 
              step="0.1" 
              defaultValue="0.2"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="prompt">
              {action === "generate" ? "Prompt" : 
               action === "analyze" ? "Code à analyser" : 
               "Code PHP à transformer"}
            </label>
            <textarea 
              id="prompt" 
              name="prompt" 
              rows={10} 
              placeholder={
                action === "generate" ? "Entrez votre prompt ici..." : 
                action === "analyze" ? "Collez le code PHP à analyser ici..." : 
                "Collez le code PHP à transformer en Remix ici..."
              }
              disabled={isSubmitting}
              required
            />
          </div>
          
          {(action === "analyze" || action === "transform") && (
            <div className="form-group">
              <label htmlFor="context">Contexte / Informations supplémentaires</label>
              <textarea 
                id="context" 
                name="context" 
                rows={4} 
                placeholder={
                  action === "analyze" ? "Informations sur le contexte du code..." : 
                  "Informations sur la route, les comportements attendus..."
                }
                disabled={isSubmitting}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="systemPrompt">Prompt système (avancé)</label>
            <textarea 
              id="systemPrompt" 
              name="systemPrompt" 
              rows={2} 
              placeholder="Instructions système pour l'IA..."
              disabled={isSubmitting}
            />
          </div>
          
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Traitement en cours..." : "Soumettre"}
          </button>
        </Form>
      </div>
      
      {actionData?.success && (
        <div className="result-card">
          <h2>Résultat</h2>
          <pre>{actionData.result}</pre>
        </div>
      )}
      
      {actionData && !actionData.success && (
        <div className="error-card">
          <h2>Erreur</h2>
          <p>{actionData.error}</p>
          {actionData.validationErrors && (
            <ul>
              {Object.entries(actionData.validationErrors).map(([field, error]) => (
                <li key={field}>{field}: {error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}