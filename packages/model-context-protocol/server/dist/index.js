"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
// Stub implementation for Model Context Protocol Server
const express_1 = __importStar(require("express"));
const core_1 = require("@model-context-protocol/core");
/**
 * Classe d'implémentation du serveur MCP
 */
class MCPServer {
    constructor(options) {
        this.app = (0, express_1.default)();
        this.port = (options === null || options === void 0 ? void 0 : options.port) || 3333;
        this.basePath = (options === null || options === void 0 ? void 0 : options.basePath) || '/api/mcp';
        // Configuration de base
        this.app.use(express_1.default.json({ limit: '50mb' }));
        // Activer CORS si demandé
        if (options === null || options === void 0 ? void 0 : options.enableCors) {
            this.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                next();
            });
        }
        // Configurer les routes de base
        this.setupDefaultRoutes();
    }
    /**
     * Configure les routes par défaut du serveur MCP
     */
    setupDefaultRoutes() {
        const router = (0, express_1.Router)();
        // Route d'info
        router.get('/info', (req, res) => {
            res.json({
                name: 'Model Context Protocol Server',
                version: core_1.mcpCore.version,
                status: 'running'
            });
        });
        // Route pour lister les agents
        router.get('/agents', (req, res) => {
            res.json({
                // Dans cette implémentation stub, nous retournons une liste vide
                agents: []
            });
        });
        // Route pour exécuter un agent
        router.post('/execute/:agentName', async (req, res) => {
            try {
                const { agentName } = req.params;
                const context = req.body;
                // Dans cette implémentation stub, nous simulons une réponse
                res.json({
                    success: true,
                    agentName,
                    result: {
                        message: `Stub execution of ${agentName}`,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        // Monter le routeur sur le chemin de base
        this.app.use(this.basePath, router);
    }
    /**
     * Enregistre un nouvel agent dans le serveur MCP
     */
    registerAgent(agentName, agent) {
        core_1.mcpCore.registerAgent(agentName, agent);
        console.log(`Agent ${agentName} enregistré dans le serveur MCP`);
    }
    /**
     * Démarre le serveur MCP
     */
    start() {
        this.app.listen(this.port, () => {
            console.log(`Serveur MCP démarré sur http://localhost:${this.port}${this.basePath}`);
        });
    }
    /**
     * Récupère l'instance Express sous-jacente
     */
    getExpressApp() {
        return this.app;
    }
}
exports.MCPServer = MCPServer;
// Export de la classe principale
exports.default = MCPServer;
