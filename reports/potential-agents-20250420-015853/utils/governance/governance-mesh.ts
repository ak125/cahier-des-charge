/**
 * Mesh de gouvernance pour l'architecture à 3 couches
 * Permet la coordination des décisions critiques entre les couches
 */
import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import { configManager } from '../../config/core/unified-config';
import { TraceabilityService } from '../traceability/traceability-service';

// Événements du système de gouvernance
export enum GovernanceEvent {
  RULE_EVALUATION = 'rule-evaluation',
  DECISION_MADE = 'decision-made',
  ACTION_TAKEN = 'action-taken',
  ESCALATION = 'escalation',
  POLICY_VIOLATION = 'policy-violation',
  CONFLICT_DETECTED = 'conflict-detected',
  CONFLICT_RESOLVED = 'conflict-resolved'
}

// Types de décisions supportées
export enum DecisionType {
  CIRCUIT_BREAKER_ACTION = 'circuit-breaker-action',
  RETRY_POLICY = 'retry-policy',
  RESOURCE_ALLOCATION = 'resource-allocation',
  ISOLATION = 'isolation',
  QUALITY_GATE = 'quality-gate',
  DOMAIN_ROUTING = 'domain-routing',
  MIGRATION_APPROVAL = 'migration-approval',
  ERROR_HANDLING = 'error-handling'
}

// Niveaux de sévérité des décisions
export enum DecisionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interface pour les règles de décision
export interface DecisionRule {
  id: string;
  name: string;
  description: string;
  type: DecisionType;
  priority: number;
  conditions: string[];
  actions: string[];
  scope: {
    layers: Array<'orchestration' | 'agents' | 'business'>;
    specific?: {
      workflows?: string[];
      agents?: string[];
      domains?: string[];
    };
  };
  metadata?: Record<string, any>;
  enabled: boolean;
}

// Interface pour les demandes de décision
export interface DecisionRequest {
  type: DecisionType;
  context: Record<string, any>;
  severity: DecisionSeverity;
  layer: 'orchestration' | 'agents' | 'business';
  requestedBy: string;
  options?: string[];
  deadline?: Date;
  traceId?: string;
  metadata?: Record<string, any>;
}

// Interface pour les réponses de décision
export interface DecisionResponse {
  requestId: string;
  decision: string;
  actions: string[];
  reasoning: string;
  appliedRules: string[];
  timestamp: Date;
  traceId: string;
  escalated: boolean;
  overridden?: boolean;
  overrideReason?: string;
  metadata?: Record<string, any>;
}

// Interface pour les conflits de décision
export interface DecisionConflict {
  id: string;
  decisions: DecisionResponse[];
  conflictType: 'contradictory' | 'overlapping' | 'priority';
  severity: DecisionSeverity;
  status: 'detected' | 'escalated' | 'resolved';
  resolvedBy?: string;
  resolution?: string;
  timestamp: Date;
  traceId: string;
}

// Classe principale du Mesh de Gouvernance
export class GovernanceMesh extends EventEmitter {
  private static instance: GovernanceMesh;
  private logger: Logger;
  private rules: DecisionRule[] = [];
  private decisions: Map<string, DecisionResponse> = new Map();
  private conflicts: DecisionConflict[] = [];
  private evaluationContext: Map<string, any> = new Map();
  private traceabilityService: TraceabilityService;
  private enabled: boolean = true;
  
  private constructor() {
    super();
    this.logger = new Logger('GovernanceMesh');
    this.traceabilityService = new TraceabilityService({
      layer: 'orchestration',  // Le Mesh opère principalement au niveau orchestration
      enabled: true,
      idFormat: 'governance-{timestamp}-{random}',
      storageStrategy: 'hybrid'
    });
  }

  /**
   * Obtient l'instance unique du Mesh de Gouvernance
   */
  public static getInstance(): GovernanceMesh {
    if (!GovernanceMesh.instance) {
      GovernanceMesh.instance = new GovernanceMesh();
    }
    return GovernanceMesh.instance;
  }

  /**
   * Initialise le Mesh de Gouvernance avec les règles de configuration
   */
  public async initialize(): Promise<void> {
    try {
      // Charger la configuration
      const config = configManager.getConfig();
      this.enabled = config.governance.enabled;
      
      if (!this.enabled) {
        this.logger.log('Governance Mesh is disabled in configuration');
        return;
      }
      
      // Transformer les règles de la configuration en règles de décision
      this.rules = config.governance.decisionRules.map((rule, index) => ({
        id: `rule-${index + 1}`,
        name: rule.name,
        description: rule.description,
        type: this.inferDecisionType(rule.name, rule.actions),
        priority: rule.priority,
        conditions: rule.conditions,
        actions: rule.actions,
        scope: {
          layers: ['orchestration', 'agents', 'business'] // Par défaut toutes les couches
        },
        enabled: true
      }));
      
      this.logger.log(`Governance Mesh initialized with ${this.rules.length} rules`);
      
      // Journaliser l'initialisation
      const traceId = await this.traceabilityService.generateTraceId();
      await this.traceabilityService.logTrace({
        traceId,
        event: 'governance:initialized',
        context: { rulesCount: this.rules.length },
        timestamp: new Date(),
        success: true
      });
    } catch (error: any) {
      this.logger.error(`Error initializing governance mesh: ${error.message}`);
    }
  }

  /**
   * Infère le type de décision à partir du nom et des actions
   * @param ruleName Nom de la règle
   * @param actions Actions de la règle
   */
  private inferDecisionType(ruleName: string, actions: string[]): DecisionType {
    const name = ruleName.toLowerCase();
    const actionsStr = actions.join(' ').toLowerCase();
    
    if (name.includes('circuit') || actionsStr.includes('circuit')) {
      return DecisionType.CIRCUIT_BREAKER_ACTION;
    }
    if (name.includes('retry') || actionsStr.includes('retry')) {
      return DecisionType.RETRY_POLICY;
    }
    if (name.includes('quality') || actionsStr.includes('quality')) {
      return DecisionType.QUALITY_GATE;
    }
    if (name.includes('migrat') || actionsStr.includes('migrat')) {
      return DecisionType.MIGRATION_APPROVAL;
    }
    if (name.includes('isolat') || actionsStr.includes('isolat')) {
      return DecisionType.ISOLATION;
    }
    if (name.includes('domain') || actionsStr.includes('domain')) {
      return DecisionType.DOMAIN_ROUTING;
    }
    if (name.includes('resource') || actionsStr.includes('resource')) {
      return DecisionType.RESOURCE_ALLOCATION;
    }
    
    // Par défaut
    return DecisionType.ERROR_HANDLING;
  }

  /**
   * Ajoute ou met à jour une règle de décision
   * @param rule Règle à ajouter ou mettre à jour
   */
  public async addRule(rule: DecisionRule): Promise<void> {
    if (!this.enabled) return;
    
    // Vérifier si la règle existe déjà
    const existingRuleIndex = this.rules.findIndex(r => r.id === rule.id);
    
    if (existingRuleIndex >= 0) {
      // Mettre à jour la règle existante
      this.rules[existingRuleIndex] = rule;
      this.logger.log(`Rule ${rule.id} updated: ${rule.name}`);
    } else {
      // Ajouter la nouvelle règle
      this.rules.push(rule);
      this.logger.log(`Rule ${rule.id} added: ${rule.name}`);
    }
    
    // Journaliser la modification
    const traceId = await this.traceabilityService.generateTraceId();
    await this.traceabilityService.logTrace({
      traceId,
      event: 'governance:rule:updated',
      context: { ruleId: rule.id, ruleName: rule.name },
      timestamp: new Date(),
      success: true
    });
    
    // Émettre l'événement
    this.emit('rule-updated', { rule });
  }

  /**
   * Désactive une règle de décision
   * @param ruleId ID de la règle à désactiver
   */
  public async disableRule(ruleId: string): Promise<boolean> {
    if (!this.enabled) return false;
    
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.rules[ruleIndex].enabled = false;
      this.logger.log(`Rule ${ruleId} disabled`);
      
      // Journaliser la désactivation
      const traceId = await this.traceabilityService.generateTraceId();
      await this.traceabilityService.logTrace({
        traceId,
        event: 'governance:rule:disabled',
        context: { ruleId },
        timestamp: new Date(),
        success: true
      });
      
      return true;
    }
    
    this.logger.warn(`Rule ${ruleId} not found, cannot disable`);
    return false;
  }

  /**
   * Prend une décision basée sur les règles et le contexte
   * @param request Requête de décision
   */
  public async makeDecision(request: DecisionRequest): Promise<DecisionResponse> {
    if (!this.enabled) {
      return this.createNullDecision(request, 'Governance disabled');
    }
    
    const startTime = Date.now();
    const traceId = request.traceId || await this.traceabilityService.generateTraceId();
    
    try {
      // Journaliser la demande de décision
      await this.traceabilityService.logTrace({
        traceId,
        event: 'governance:decision:requested',
        context: {
          type: request.type,
          layer: request.layer,
          severity: request.severity,
          requestedBy: request.requestedBy
        },
        timestamp: new Date()
      });
      
      // Filtrer les règles applicables
      const applicableRules = this.rules.filter(rule => {
        // Vérifier si la règle est activée
        if (!rule.enabled) return false;
        
        // Vérifier si le type correspond
        if (rule.type !== request.type && rule.type !== '*') return false;
        
        // Vérifier si la couche est dans le scope
        if (!rule.scope.layers.includes(request.layer)) return false;
        
        // Vérifier les scopes spécifiques si définis
        if (rule.scope.specific) {
          if (
            (request.layer === 'orchestration' &&
             rule.scope.specific.workflows &&
             rule.scope.specific.workflows.length > 0 &&
             request.context.workflowId &&
             !rule.scope.specific.workflows.includes(request.context.workflowId)) ||
            (request.layer === 'agents' &&
             rule.scope.specific.agents &&
             rule.scope.specific.agents.length > 0 &&
             request.context.agentId &&
             !rule.scope.specific.agents.includes(request.context.agentId)) ||
            (request.layer === 'business' &&
             rule.scope.specific.domains &&
             rule.scope.specific.domains.length > 0 &&
             request.context.domainId &&
             !rule.scope.specific.domains.includes(request.context.domainId))
          ) {
            return false;
          }
        }
        
        return true;
      });
      
      // Trier les règles par priorité (plus haute en premier)
      const sortedRules = applicableRules.sort((a, b) => b.priority - a.priority);
      
      // Préparer le contexte d'évaluation
      const evaluationContext = {
        ...request.context,
        layer: request.layer,
        severity: request.severity,
        timestamp: new Date(),
        requestedBy: request.requestedBy
      };
      
      // Évaluer les règles
      const matchedRules: DecisionRule[] = [];
      for (const rule of sortedRules) {
        if (this.evaluateConditions(rule.conditions, evaluationContext)) {
          matchedRules.push(rule);
          
          // Émettre l'événement d'évaluation
          this.emit(GovernanceEvent.RULE_EVALUATION, {
            rule,
            matched: true,
            context: evaluationContext
          });
        }
      }
      
      if (matchedRules.length === 0) {
        // Aucune règle ne correspond, décision par défaut
        const nullDecision = this.createNullDecision(request, 'No matching rules');
        
        await this.traceabilityService.logTrace({
          traceId,
          event: 'governance:decision:default',
          context: {
            type: request.type,
            layer: request.layer,
            severity: request.severity,
            decision: nullDecision.decision
          },
          timestamp: new Date(),
          duration: Date.now() - startTime,
          success: true
        });
        
        return nullDecision;
      }
      
      // Extraire les actions de la règle la plus prioritaire
      const highestPriorityRule = matchedRules[0];
      const actions = highestPriorityRule.actions;
      
      // Construire la réponse
      const decisionId = `decision-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const decision: DecisionResponse = {
        requestId: decisionId,
        decision: this.inferDecisionFromActions(actions),
        actions,
        reasoning: `Based on rule "${highestPriorityRule.name}" with priority ${highestPriorityRule.priority}`,
        appliedRules: matchedRules.map(r => r.id),
        timestamp: new Date(),
        traceId,
        escalated: false
      };
      
      // Stocker la décision
      this.decisions.set(decisionId, decision);
      
      // Vérifier les conflits potentiels
      await this.checkForConflicts(decision, request);
      
      // Journaliser la décision prise
      await this.traceabilityService.logTrace({
        traceId,
        event: 'governance:decision:made',
        context: {
          type: request.type,
          layer: request.layer,
          severity: request.severity,
          decision: decision.decision,
          actions: decision.actions,
          appliedRules: decision.appliedRules
        },
        timestamp: new Date(),
        duration: Date.now() - startTime,
        success: true
      });
      
      // Émettre l'événement de décision
      this.emit(GovernanceEvent.DECISION_MADE, {
        decision,
        request,
        matchedRules
      });
      
      return decision;
    } catch (error: any) {
      this.logger.error(`Error making decision: ${error.message}`);
      
      // Journaliser l'erreur
      await this.traceabilityService.logTrace({
        traceId,
        event: 'governance:decision:error',
        context: {
          type: request.type,
          layer: request.layer,
          severity: request.severity,
          error: error.message
        },
        timestamp: new Date(),
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      });
      
      return this.createNullDecision(request, `Error: ${error.message}`);
    }
  }

  /**
   * Évalue les conditions d'une règle dans un contexte donné
   * @param conditions Conditions à évaluer
   * @param context Contexte d'évaluation
   */
  private evaluateConditions(conditions: string[], context: Record<string, any>): boolean {
    if (conditions.length === 0) return true;
    
    try {
      // Préparer les variables pour l'évaluation
      const contextWithThis = {
        ...context,
        this: context // Permettre l'accès via this.xyz
      };
      
      // Évaluer chaque condition
      for (const condition of conditions) {
        // Créer une fonction d'évaluation sécurisée
        const evalFn = new Function(
          ...Object.keys(contextWithThis),
          `try { return Boolean(${condition}); } catch (e) { return false; }`
        );
        
        // Exécuter la fonction avec le contexte
        const result = evalFn(...Object.values(contextWithThis));
        
        if (!result) {
          return false; // Une condition non satisfaite suffit
        }
      }
      
      return true; // Toutes les conditions sont satisfaites
    } catch (error: any) {
      this.logger.error(`Error evaluating conditions: ${error.message}`);
      return false;
    }
  }

  /**
   * Crée une décision par défaut lorsqu'aucune règle ne s'applique
   * @param request Requête originale
   * @param reason Raison de la décision par défaut
   */
  private createNullDecision(request: DecisionRequest, reason: string): DecisionResponse {
    const decisionId = `null-decision-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    let defaultDecision = 'proceed';
    if (request.severity === DecisionSeverity.CRITICAL) {
      defaultDecision = 'abort';
    } else if (request.severity === DecisionSeverity.HIGH) {
      defaultDecision = 'warn';
    }
    
    const nullDecision: DecisionResponse = {
      requestId: decisionId,
      decision: defaultDecision,
      actions: [defaultDecision],
      reasoning: reason,
      appliedRules: [],
      timestamp: new Date(),
      traceId: request.traceId || `governance-${Date.now()}`,
      escalated: false
    };
    
    return nullDecision;
  }

  /**
   * Infère une décision à partir des actions
   * @param actions Liste d'actions
   */
  private inferDecisionFromActions(actions: string[]): string {
    const actionsStr = actions.join(' ').toLowerCase();
    
    if (actionsStr.includes('abort') || actionsStr.includes('reject')) {
      return 'abort';
    }
    if (actionsStr.includes('escalate')) {
      return 'escalate';
    }
    if (actionsStr.includes('warn')) {
      return 'warn';
    }
    if (actionsStr.includes('retry')) {
      return 'retry';
    }
    if (actionsStr.includes('isolate')) {
      return 'isolate';
    }
    
    return 'proceed';
  }

  /**
   * Vérifie les conflits potentiels avec les décisions précédentes
   * @param decision Nouvelle décision
   * @param request Requête associée
   */
  private async checkForConflicts(decision: DecisionResponse, request: DecisionRequest): Promise<void> {
    if (!this.enabled) return;
    
    // Rechercher les décisions récentes contradictoires
    const recentDecisions = Array.from(this.decisions.values())
      .filter(d => 
        // Même type et couche
        d.timestamp.getTime() > Date.now() - 1000 * 60 * 5 && // 5 dernières minutes
        d.requestId !== decision.requestId &&
        // Avec contexte similaire mais décision différente
        this.hasRelatedContext(request.context, d)
      );
    
    if (recentDecisions.length === 0) return;
    
    // Vérifier les conflits directs (décisions opposées)
    const conflictingDecisions = recentDecisions.filter(d => 
      this.areDecisionsConflicting(decision.decision, d.decision)
    );
    
    if (conflictingDecisions.length === 0) return;
    
    // Créer un conflit
    const conflict: DecisionConflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      decisions: [decision, ...conflictingDecisions],
      conflictType: 'contradictory',
      severity: request.severity,
      status: 'detected',
      timestamp: new Date(),
      traceId: decision.traceId
    };
    
    this.conflicts.push(conflict);
    
    // Journaliser le conflit
    await this.traceabilityService.logTrace({
      traceId: decision.traceId,
      event: 'governance:conflict:detected',
      context: {
        conflictId: conflict.id,
        type: conflict.conflictType,
        severity: conflict.severity,
        decisionsCount: conflict.decisions.length
      },
      timestamp: new Date()
    });
    
    // Émettre l'événement de conflit
    this.emit(GovernanceEvent.CONFLICT_DETECTED, { conflict });
    
    // Si critique, escalader automatiquement
    if (request.severity === DecisionSeverity.CRITICAL || request.severity === DecisionSeverity.HIGH) {
      await this.escalateConflict(conflict.id);
    }
  }

  /**
   * Vérifie si deux décisions sont en conflit
   * @param decision1 Première décision
   * @param decision2 Seconde décision
   */
  private areDecisionsConflicting(decision1: string, decision2: string): boolean {
    // Définir les paires de décisions conflictuelles
    const conflictPairs = [
      ['abort', 'proceed'],
      ['isolate', 'proceed'],
      ['escalate', 'proceed']
    ];
    
    return conflictPairs.some(pair => 
      (pair[0] === decision1 && pair[1] === decision2) || 
      (pair[0] === decision2 && pair[1] === decision1)
    );
  }

  /**
   * Vérifie si une décision a un contexte lié à une requête
   * @param context1 Contexte de la requête
   * @param decision Décision à comparer
   */
  private hasRelatedContext(context1: Record<string, any>, decision: DecisionResponse): boolean {
    // Extrait les clés importantes du contexte
    const importantKeys = ['workflowId', 'agentId', 'domainId', 'migrationId'];
    
    // Si aucune des clés importantes n'est présente, considérer non-lié
    const hasImportantKey = importantKeys.some(key => key in context1);
    if (!hasImportantKey) return false;
    
    // Vérifier si le contexte de la décision contient des clés similaires
    if (!decision.metadata || !decision.metadata.context) return false;
    
    const context2 = decision.metadata.context;
    
    // Vérifier les correspondances sur les clés importantes
    for (const key of importantKeys) {
      if (context1[key] && context2[key] && context1[key] === context2[key]) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Escalade un conflit pour résolution manuelle
   * @param conflictId ID du conflit à escalader
   */
  public async escalateConflict(conflictId: string): Promise<boolean> {
    if (!this.enabled) return false;
    
    const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex < 0) {
      this.logger.warn(`Conflict ${conflictId} not found, cannot escalate`);
      return false;
    }
    
    // Mettre à jour le statut du conflit
    this.conflicts[conflictIndex].status = 'escalated';
    
    // Journaliser l'escalade
    await this.traceabilityService.logTrace({
      traceId: this.conflicts[conflictIndex].traceId,
      event: 'governance:conflict:escalated',
      context: {
        conflictId,
        severity: this.conflicts[conflictIndex].severity
      },
      timestamp: new Date()
    });
    
    // Émettre l'événement d'escalade
    this.emit(GovernanceEvent.ESCALATION, {
      conflict: this.conflicts[conflictIndex]
    });
    
    return true;
  }

  /**
   * Résout un conflit avec une décision manuelle
   * @param conflictId ID du conflit à résoudre
   * @param resolution Décision de résolution
   * @param resolvedBy Identifiant de la personne/système ayant résolu
   */
  public async resolveConflict(
    conflictId: string, 
    resolution: string, 
    resolvedBy: string
  ): Promise<boolean> {
    if (!this.enabled) return false;
    
    const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex < 0) {
      this.logger.warn(`Conflict ${conflictId} not found, cannot resolve`);
      return false;
    }
    
    // Mettre à jour le conflit
    this.conflicts[conflictIndex].status = 'resolved';
    this.conflicts[conflictIndex].resolvedBy = resolvedBy;
    this.conflicts[conflictIndex].resolution = resolution;
    
    // Journaliser la résolution
    await this.traceabilityService.logTrace({
      traceId: this.conflicts[conflictIndex].traceId,
      event: 'governance:conflict:resolved',
      context: {
        conflictId,
        resolution,
        resolvedBy
      },
      timestamp: new Date()
    });
    
    // Émettre l'événement de résolution
    this.emit(GovernanceEvent.CONFLICT_RESOLVED, {
      conflict: this.conflicts[conflictIndex],
      resolution,
      resolvedBy
    });
    
    return true;
  }

  /**
   * Obtient toutes les règles de décision
   */
  public getRules(): DecisionRule[] {
    return [...this.rules];
  }

  /**
   * Obtient l'historique des décisions
   * @param limit Limite du nombre de décisions
   */
  public getDecisionHistory(limit: number = 50): DecisionResponse[] {
    const decisions = Array.from(this.decisions.values());
    return decisions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Obtient les conflits actifs
   * @param includeResolved Inclure les conflits résolus
   */
  public getConflicts(includeResolved: boolean = false): DecisionConflict[] {
    if (includeResolved) {
      return [...this.conflicts]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    
    return this.conflicts
      .filter(c => c.status !== 'resolved')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Export du singleton
export const governanceMesh = GovernanceMesh.getInstance();