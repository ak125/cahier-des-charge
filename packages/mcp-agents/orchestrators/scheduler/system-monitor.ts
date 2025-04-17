import * as os from 'os';
import { createLogger } from '../../utils/logger';

/**
 * Métriques système collectées par le moniteur
 */
export interface SystemMetrics {
  cpuUsagePercent: number;        // Pourcentage d'utilisation du CPU (0-100)
  memoryUsagePercent: number;     // Pourcentage d'utilisation de la mémoire (0-100)
  memoryFreeBytes: number;        // Mémoire libre en octets
  memoryTotalBytes: number;       // Mémoire totale en octets
  loadAverage: number;            // Charge système moyenne sur 1 minute
  processCount: number;           // Nombre de processus en cours d'exécution
  timestamp: Date;                // Horodatage de la collecte des métriques
  uptime: number;                 // Uptime du système en secondes
  networkStats?: {                // Statistiques réseau (optionnelles)
    bytesIn: number;
    bytesOut: number;
    connectionsCount: number;
  };
}

/**
 * Historique des métriques système
 */
interface MetricsHistory {
  timeframe: number;              // Durée en millisecondes
  samples: SystemMetrics[];       // Échantillons collectés
  maxSamples: number;             // Nombre maximum d'échantillons à conserver
}

/**
 * Moniteur de ressources système
 * Collecte et analyse les métriques de performance système
 */
export class SystemMonitor {
  private logger = createLogger('SystemMonitor');
  private currentMetrics: SystemMetrics;
  private collectionInterval: NodeJS.Timeout | null = null;
  private history: MetricsHistory = {
    timeframe: 60 * 60 * 1000, // 1 heure
    samples: [],
    maxSamples: 120 // Un échantillon toutes les 30 secondes
  };
  private previousCpuInfo: { idle: number; total: number } | null = null;
  private isCollecting = false;

  constructor() {
    this.currentMetrics = this.createDefaultMetrics();
    this.logger.info('System monitor initialized');
  }

  /**
   * Démarre la collecte des métriques
   * @param intervalMs Intervalle de collecte en millisecondes
   */
  async start(intervalMs = 30000): Promise<void> {
    // Collecter immédiatement les premières métriques
    await this.collectMetrics();
    
    // Configurer la collecte périodique
    this.collectionInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);
    
    this.logger.info(`System monitoring started with ${intervalMs}ms interval`);
  }

  /**
   * Arrête la collecte des métriques
   */
  async stop(): Promise<void> {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    this.logger.info('System monitoring stopped');
  }

  /**
   * Récupère les métriques actuelles
   */
  getCurrentMetrics(): SystemMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Récupère l'historique des métriques
   * @param lastMinutes Nombre de minutes à inclure (par défaut toutes)
   */
  getMetricsHistory(lastMinutes?: number): SystemMetrics[] {
    if (!lastMinutes) {
      return [...this.history.samples];
    }
    
    const cutoffTime = Date.now() - (lastMinutes * 60 * 1000);
    return this.history.samples.filter(m => m.timestamp.getTime() > cutoffTime);
  }

  /**
   * Collecte les métriques système actuelles
   */
  private async collectMetrics(): Promise<void> {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    
    try {
      // Mesurer l'utilisation du CPU
      const cpuUsage = await this.calculateCpuUsage();
      
      // Mesurer l'utilisation de la mémoire
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = (usedMem / totalMem) * 100;
      
      // Collecte des métriques
      const metrics: SystemMetrics = {
        cpuUsagePercent: cpuUsage,
        memoryUsagePercent: memoryUsagePercent,
        memoryFreeBytes: freeMem,
        memoryTotalBytes: totalMem,
        loadAverage: os.loadavg()[0], // Charge système sur 1 minute
        processCount: this.getProcessCount(),
        timestamp: new Date(),
        uptime: os.uptime(),
        networkStats: await this.getNetworkStats()
      };
      
      // Mettre à jour les métriques actuelles
      this.currentMetrics = metrics;
      
      // Ajouter aux échantillons historiques
      this.history.samples.push(metrics);
      
      // Limiter la taille de l'historique
      if (this.history.samples.length > this.history.maxSamples) {
        this.history.samples.shift();
      }
      
      // Journaliser les infos principales
      this.logger.debug(`System metrics - CPU: ${cpuUsage.toFixed(1)}%, Memory: ${memoryUsagePercent.toFixed(1)}%, Load: ${metrics.loadAverage.toFixed(2)}`);
    } catch (error) {
      this.logger.error('Error collecting system metrics:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * Calcule l'utilisation du CPU avec une approche différentielle
   */
  private async calculateCpuUsage(): Promise<number> {
    // Obtenir les infos CPU actuelles
    const cpus = os.cpus();
    let idleMs = 0;
    let totalMs = 0;
    
    // Calculer le temps total et le temps d'inactivité
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalMs += cpu.times[type as keyof typeof cpu.times];
      }
      idleMs += cpu.times.idle;
    }
    
    // Si c'est la première fois, impossible de calculer l'utilisation
    if (this.previousCpuInfo === null) {
      this.previousCpuInfo = { idle: idleMs, total: totalMs };
      return 0;
    }
    
    // Calculer la différence depuis la dernière mesure
    const idleDiff = idleMs - this.previousCpuInfo.idle;
    const totalDiff = totalMs - this.previousCpuInfo.total;
    
    // Mettre à jour les valeurs pour la prochaine mesure
    this.previousCpuInfo = { idle: idleMs, total: totalMs };
    
    // Calculer l'utilisation en pourcentage
    const usage = 100 - ((idleDiff / totalDiff) * 100);
    
    return usage;
  }

  /**
   * Obtient le nombre approximatif de processus en cours
   */
  private getProcessCount(): number {
    try {
      // Cette implémentation est spécifique à Linux et nécessite
      // des permissions pour accéder à /proc
      const { execSync } = require('child_process');
      const output = execSync('ps -e | wc -l').toString();
      return parseInt(output.trim(), 10);
    } catch (error) {
      // Fallback - retourner une valeur par défaut
      return -1;
    }
  }

  /**
   * Obtient les statistiques réseau actuelles (si disponibles)
   */
  private async getNetworkStats(): Promise<{ bytesIn: number; bytesOut: number; connectionsCount: number } | undefined> {
    try {
      // Cette implémentation est spécifique à Linux et nécessite
      // des permissions pour accéder aux statistiques réseau
      const { execSync } = require('child_process');
      
      // Nombre de connexions
      const connectionsOutput = execSync('netstat -an | grep ESTABLISHED | wc -l').toString();
      const connectionsCount = parseInt(connectionsOutput.trim(), 10);
      
      // Statistiques d'octets envoyés/reçus
      // Ceci est une implémentation basique pour Linux - le format peut varier selon l'OS
      const bytesInOutput = execSync('cat /proc/net/dev | grep -v lo | awk \'{print $2}\' | tail -n +3 | paste -sd+ | bc').toString();
      const bytesOutOutput = execSync('cat /proc/net/dev | grep -v lo | awk \'{print $10}\' | tail -n +3 | paste -sd+ | bc').toString();
      
      return {
        bytesIn: parseInt(bytesInOutput.trim(), 10) || 0,
        bytesOut: parseInt(bytesOutOutput.trim(), 10) || 0,
        connectionsCount
      };
    } catch (error) {
      // Si les commandes échouent (permissions, OS non Linux, etc.), retourner undefined
      return undefined;
    }
  }

  /**
   * Crée des métriques par défaut
   */
  private createDefaultMetrics(): SystemMetrics {
    return {
      cpuUsagePercent: 0,
      memoryUsagePercent: 0,
      memoryFreeBytes: os.freemem(),
      memoryTotalBytes: os.totalmem(),
      loadAverage: os.loadavg()[0],
      processCount: 0,
      timestamp: new Date(),
      uptime: os.uptime()
    };
  }

  /**
   * Analyse les métriques pour produire des insights
   */
  analyzeMetrics(): { alerts: string[]; recommendations: string[] } {
    const metrics = this.currentMetrics;
    const alerts: string[] = [];
    const recommendations: string[] = [];
    
    // Vérifications haute charge CPU
    if (metrics.cpuUsagePercent > 90) {
      alerts.push('ALERTE CRITIQUE: Utilisation CPU très élevée (> 90%)');
      recommendations.push('Réduire le nombre de workflows parallèles');
    } else if (metrics.cpuUsagePercent > 75) {
      alerts.push('ALERTE: Utilisation CPU élevée (> 75%)');
      recommendations.push('Considérer une réduction du nombre de workflows simultanés');
    }
    
    // Vérifications haute utilisation mémoire
    if (metrics.memoryUsagePercent > 85) {
      alerts.push('ALERTE CRITIQUE: Utilisation mémoire très élevée (> 85%)');
      recommendations.push('Libérer de la mémoire en terminant certains workflows non prioritaires');
    } else if (metrics.memoryUsagePercent > 70) {
      alerts.push('ALERTE: Utilisation mémoire élevée (> 70%)');
    }
    
    // Vérifications charge système
    if (metrics.loadAverage > 4) {
      alerts.push(`ALERTE: Charge système élevée (${metrics.loadAverage.toFixed(2)})`);
    }
    
    return { alerts, recommendations };
  }
}