/**
 * Utilitaires pour la manipulation des dates
 */

/**
 * Formate une date en format relatif (ex: "il y a 5 minutes", "il y a 2 heures")
 * @param dateString - Chaîne de date au format ISO
 * @returns Chaîne formatée
 */
export function formatDateRelative(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return "À l'instant";
  }
  if (minutes < 60) {
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (hours < 24) {
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  if (days < 30) {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
  // Format date complète pour les dates plus anciennes
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formate une date en format court
 * @param dateString - Chaîne de date au format ISO
 * @returns Chaîne formatée
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formate une date et heure
 * @param dateString - Chaîne de date au format ISO
 * @returns Chaîne formatée
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-dDoDogit',
    minute: '2-dDoDogit',
  });
}
