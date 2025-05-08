import * as fs from 'fs';
import * as path from 'path';
import { ActionFunctionArgs, json } from '@remix-run/node';

/**
 * API pour enregistrer les routes PHP manquantes ou problématiques
 * Utilisée par la route fallback pour signaler les URL non gérées
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Extraire les données de la requête
    const data = await request.json();
    const { path: url, params, referrer } = data;

    // Valider les données
    if (!url) {
      return json({ success: false, error: 'URL manquante' }, { status: 400 });
    }

    // Définir le chemin du fichier de log
    const logDir = path.resolve(process.cwd(), 'logs');
    const logPath = path.join(logDir, 'missed_legacy_routes.log');

    // Créer le répertoire de logs s'il n'existe pas
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Formater l'entrée de log
    const now = new Date().toISOString();
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const paramsStr = params ? JSON.stringify(params) : '';

    const logEntry = `${now} | API | ${url} | ${userAgent} | ${
      referrer || 'Direct'
    } | ${paramsStr}\n`;

    // Écrire dans le fichier de log
    fs.appendFileSync(logPath, logEntry, 'utf8');

    // Répondre avec succès
    return json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la route manquante:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
