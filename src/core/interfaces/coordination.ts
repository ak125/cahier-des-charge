/**
 * Couche de coordination - Enregistrement des agents, logs, propagation de statut, fallback
 * 
 * Responsabilité: Assurer la communication entre les agents, gérer l'enregistrement, et coordonner les interactions du système
 */

import { BaseAgent } from '../base-agent';

/**
 * Agent responsable de l'intégration et de la communication entre différents systèmes
 */
export interface BridgeAgent extends BaseAgent {
  /**
   * Établit une connexion avec un système externe
   *
   * @param connectionConfig La configuration de connexion
   * @returns La connexion établie
   */
  connect(connectionConfig: ConnectionConfig): Promise<Connection>;

  /**
   * Ferme une connexion avec un système externe
   *
   * @param connectionId L'identifiant de la connexion
   * @returns Vrai si la connexion a été fermée avec succès
   */
  disconnect(connectionId: string): Promise<boolean>;

  /**
   * Transfère des données d'un système à un autre
   *
   * @param sourceConnectionId L'identifiant de la connexion source
   * @param targetConnectionId L'identifiant de la connexion cible
   * @param data Les données à transférer
   * @returns Le résultat du transfert
   */
  transfer(sourceConnectionId: string, targetConnectionId: string, data: any): Promise<TransferResult>;

}

/**
 * Agent responsable de l'adaptation des interfaces entre différents systèmes
 */
export interface AdapterAgent extends BaseAgent {
  /**
   * Adapte des données d'un format à un autre
   *
   * @param sourceData Les données sources à adapter
   * @param targetFormat Le format cible
   * @returns Les données adaptées
   */
  adapt(sourceData: any, targetFormat: string): Promise<any>;

  /**
   * Récupère la liste des formats supportés par l'adaptateur
   *
   * @returns La liste des formats supportés
   */
  getSupportedFormats(): Promise<string[]>;

}

/**
 * Agent responsable de l'enregistrement et du suivi des services et agents disponibles
 */
export interface RegistryAgent extends BaseAgent {
  /**
   * Enregistre un agent ou un service dans le registre
   *
   * @param serviceInfo Les informations sur le service à enregistrer
   * @returns L'identifiant d'enregistrement
   */
  register(serviceInfo: ServiceInfo): Promise<string>;

  /**
   * Désinscrit un agent ou un service du registre
   *
   * @param serviceId L'identifiant du service
   * @returns Vrai si le service a été désinscrit avec succès
   */
  unregister(serviceId: string): Promise<boolean>;

  /**
   * Découvre des services selon des critères spécifiques
   *
   * @param criteria Les critères de découverte
   * @returns La liste des services correspondant aux critères
   */
  discover(criteria: DiscoveryCriteria): Promise<ServiceInfo[]>;

}

