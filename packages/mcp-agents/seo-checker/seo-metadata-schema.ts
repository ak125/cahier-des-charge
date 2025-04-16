import { z } from 'zod';

/**
 * Schéma Zod pour la validation des métadonnées SEO
 * Ce schéma standardise les métadonnées SEO et permet leur validation
 * automatique dans la chaîne CI/CD
 */

// Schéma pour les balises Meta standard
export const StandardMetaSchema = z.object({
  title: z.string()
    .min(10, "Le titre doit contenir au moins 10 caractères")
    .max(60, "Le titre ne doit pas dépasser 60 caractères"),
  description: z.string()
    .min(50, "La description doit contenir au moins 50 caractères")
    .max(160, "La description ne doit pas dépasser 160 caractères"),
  canonical: z.string().url("L'URL canonique doit être une URL valide").optional(),
  robots: z.string().optional().default("index, follow"),
  keywords: z.string().optional(),
  lang: z.string().optional().default("fr"),
});

// Schéma pour les balises OpenGraph
export const OpenGraphSchema = z.object({
  title: z.string().min(5, "Le titre OG doit contenir au moins 5 caractères").optional(),
  description: z.string().optional(),
  image: z.string().url("L'image OG doit être une URL valide").optional(),
  type: z.enum(["website", "article", "profile", "book", "music", "video"]).default("website"),
  url: z.string().url("L'URL OG doit être une URL valide").optional(),
  site_name: z.string().optional(),
  locale: z.string().optional().default("fr_FR"),
});

// Schéma pour les balises Twitter Card
export const TwitterCardSchema = z.object({
  card: z.enum(["summary", "summary_large_image", "app", "player"]).default("summary"),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url("L'image Twitter doit être une URL valide").optional(),
  creator: z.string().optional(),
  site: z.string().optional(),
});

// Schéma pour JSON-LD (Schema.org)
export const SchemaOrgTypes = z.enum([
  "Article", 
  "BreadcrumbList", 
  "WebPage", 
  "Organization", 
  "Product", 
  "FAQPage", 
  "Event", 
  "Person", 
  "LocalBusiness"
]);

export const SchemaOrgSchema = z.object({
  type: SchemaOrgTypes,
  data: z.record(z.any()).refine(data => Object.keys(data).length > 0, {
    message: "Les données Schema.org ne peuvent pas être vides"
  })
});

// Schéma complet regroupant tous les types de métadonnées
export const SEOMetadataSchema = z.object({
  standard: StandardMetaSchema,
  openGraph: OpenGraphSchema.optional(),
  twitterCard: TwitterCardSchema.optional(),
  schemaOrg: z.array(SchemaOrgSchema).optional(),
  createdAt: z.date().optional().default(() => new Date()),
  updatedAt: z.date().optional().default(() => new Date()),
  migrationSource: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  url: z.string().url("L'URL doit être valide").optional(),
});

export type SEOMetadata = z.infer<typeof SEOMetadataSchema>;

/**
 * Fonction utilitaire pour valider les métadonnées SEO
 * @param metadata Les métadonnées à valider
 * @returns Le résultat de la validation avec les erreurs éventuelles
 */
export const validateSEOMetadata = (metadata: unknown) => {
  try {
    return {
      success: true,
      data: SEOMetadataSchema.parse(metadata),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.format()
      };
    }
    
    return {
      success: false,
      data: null,
      errors: { _errors: ['Une erreur inconnue est survenue lors de la validation'] }
    };
  }
};