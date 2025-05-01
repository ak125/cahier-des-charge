/**
 * Interfaces pour la Couche de coordination - Communication entre les agents et intégration
 */

import { AdapterAgent, AdapterOptions, AdapterResult } from './adapter/adapter-agent';
import { BridgeAgent, BridgeOptions, BridgeResult } from './bridge/bridge-agent';
import { MediatorAgent, MediatorOptions, MediatorResult } from './mediator/mediator-agent';

export {
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
