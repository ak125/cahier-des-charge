/**
 * Interfaces pour la Couche de coordination - Communication entre les agents et intégration
 */

import { AdapterAgent, AdapterOptions, AdapterResult } from './adapter/adapter-agent';
import { BridgeAgent, BridgeOptions, BridgeResult } from './bridge/bridge-agent';
import { CoordinationAgent, CoordinationOptions, CoordinationResult, ConnectionStatus } from './coordination-agent';
import { MediatorAgent, MediatorOptions, MediatorResult } from './mediator/mediator-agent';

export {
  CoordinationAgent,
  CoordinationOptions,
  CoordinationResult,
  ConnectionStatus,
  BridgeAgent,
  BridgeOptions,
  BridgeResult,
  AdapterAgent,
  AdapterOptions,
  AdapterResult,
  MediatorAgent,
  MediatorOptions,
  MediatorResult,
};
