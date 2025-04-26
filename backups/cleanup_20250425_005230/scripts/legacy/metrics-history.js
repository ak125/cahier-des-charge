/**
 * Module de gestion de l'historique des métriques
 * 
 * Ce module permet de stocker et récupérer l'historique des métriques
 * des différents tableaux de bord pour suivre leur évolution dans le temps.
 */

const fs = require('fs-extra');
const path = require('path');
const { loadConfig } = require('../config/config');

// Charger la configuration
const config = loadConfig();
const { PATHS } = config;

// Dossier pour stocker l'historique des métriques
const METRICS_HISTORY_DIR = path.join(PATHS.METRICS_REPORTS, 'history');

// S'assurer que le dossier existe
fs.mkdirSync(METRICS_HISTORY_DIR, { recursive: true });

/**
 * Stocke les métriques actuelles dans l'historique
 * @param {string} dashboardName - Le nom du tableau de bord (migration, audit, agents)
 * @param {Object} metrics - Les métriques à stocker
 * @returns {Promise<void>}
 */
async function storeMetrics(dashboardName, metrics) {
    try {
        const timestamp = new Date().toISOString();
        const historyFilePath = path.join(METRICS_HISTORY_DIR, `${dashboardName}-history.json`);

        // Créer une entrée avec horodatage
        const entry = {
            timestamp,
            date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
            metrics
        };

        // Charger l'historique existant ou créer un nouveau tableau
        let history = [];
        if (await fs.pathExists(historyFilePath)) {
            history = await fs.readJson(historyFilePath);
        }

        // Limiter l'historique à 100 entrées (environ 3 mois avec une mise à jour quotidienne)
        if (history.length >= 100) {
            history.shift(); // Supprimer l'entrée la plus ancienne
        }

        // Ajouter la nouvelle entrée
        history.push(entry);

        // Sauvegarder l'historique mis à jour
        await fs.writeJson(historyFilePath, history, { spaces: 2 });

        return true;
    } catch (error) {
        console.error(`Erreur lors du stockage des métriques pour ${dashboardName}: ${error.message}`);
        return false;
    }
}

/**
 * Récupère l'historique des métriques pour un tableau de bord
 * @param {string} dashboardName - Le nom du tableau de bord
 * @param {number} days - Nombre de jours d'historique à récupérer (0 pour tout l'historique)
 * @returns {Promise<Array>}
 */
async function getMetricsHistory(dashboardName, days = 0) {
    try {
        const historyFilePath = path.join(METRICS_HISTORY_DIR, `${dashboardName}-history.json`);

        if (!await fs.pathExists(historyFilePath)) {
            return [];
        }

        const history = await fs.readJson(historyFilePath);

        // Si days est 0 ou non spécifié, retourner tout l'historique
        if (days === 0) {
            return history;
        }

        // Filtrer par période
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffTimestamp = cutoffDate.toISOString();

        return history.filter(entry => entry.timestamp >= cutoffTimestamp);
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'historique pour ${dashboardName}: ${error.message}`);
        return [];
    }
}

/**
 * Récupère les métriques agrégées par jour pour faciliter les visualisations
 * @param {string} dashboardName - Le nom du tableau de bord
 * @param {number} days - Nombre de jours d'historique
 * @param {string[]} metricKeys - Les clés des métriques à inclure
 * @returns {Promise<Object>}
 */
async function getDailyMetrics(dashboardName, days = 30, metricKeys = []) {
    try {
        // Récupérer l'historique
        const history = await getMetricsHistory(dashboardName, days);

        // Regrouper par jour
        const dailyData = {};

        history.forEach(entry => {
            const day = entry.date;

            if (!dailyData[day]) {
                dailyData[day] = { entries: 0 };

                // Initialiser les métriques à 0
                if (metricKeys.length > 0) {
                    metricKeys.forEach(key => {
                        dailyData[day][key] = 0;
                    });
                }
            }

            // Incrémenter le compteur d'entrées pour ce jour
            dailyData[day].entries++;

            // Ajouter les métriques de cette entrée
            Object.entries(entry.metrics).forEach(([key, value]) => {
                // Si aucune clé spécifique n'est demandée ou si cette clé est demandée
                if (metricKeys.length === 0 || metricKeys.includes(key)) {
                    if (typeof value === 'number') {
                        if (!dailyData[day][key]) {
                            dailyData[day][key] = value;
                        } else {
                            dailyData[day][key] += value;
                        }
                    }
                }
            });
        });

        // Calculer les moyennes pour chaque jour
        Object.keys(dailyData).forEach(day => {
            const entryCount = dailyData[day].entries;

            Object.keys(dailyData[day]).forEach(key => {
                if (key !== 'entries' && typeof dailyData[day][key] === 'number') {
                    dailyData[day][key] = Math.round((dailyData[day][key] / entryCount) * 100) / 100;
                }
            });
        });

        // Convertir en tableau pour faciliter le traitement côté client
        const result = Object.keys(dailyData).map(day => {
            const dayData = { date: day };

            Object.keys(dailyData[day]).forEach(key => {
                if (key !== 'entries') {
                    dayData[key] = dailyData[day][key];
                }
            });

            return dayData;
        });

        // Trier par date
        result.sort((a, b) => a.date.localeCompare(b.date));

        return result;
    } catch (error) {
        console.error(`Erreur lors de la récupération des métriques quotidiennes pour ${dashboardName}: ${error.message}`);
        return [];
    }
}

module.exports = {
    storeMetrics,
    getMetricsHistory,
    getDailyMetrics
};