import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import fs from 'fs';
import path from 'path';

// Import agent types
import { Agent, AgentContext, AgentResponse } from './types/agent';

// Configuration
const config = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../config/mcp-server-config.json'), 'utf8')
);

const app = express();
const PORT = config.server.port || 3000;

// Middleware
app.use(json());
app.use(cors(config.server.cors));

// Agent registry by category
const agentRegistry: Record<string, Record<string, Agent>> = {
  analysis: {},
  core: {},
  migration: {},
  quality: {}
};
// Flat agent registry for backward compatibility
const agents: Record<string, Agent> = {};

// Load agents from a specific category directory
const loadAgentCategory = async (category: string) => {
  const categoryDir = path.resolve(__dirname, `../../../agents/${category}`);
  
  if (!fs.existsSync(categoryDir)) {
    console.warn(`Category directory not found: ${categoryDir}`);
    return;
  }

  const files = fs.readdirSync(categoryDir);
  
  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      try {
        const agentPath = path.join(categoryDir, file);
        const agentModule = await import(agentPath);
        
        if (agentModule.default && typeof agentModule.default === 'object') {
          const agent = agentModule.default as Agent;
          
          if (agent.id && agent.name && typeof agent.process === 'function') {
            agentRegistry[category][agent.id] = agent;
            agents[agent.id] = agent; // Also add to flat registry
            
            console.log(`Loaded agent: ${agent.name} (${agent.id}) in category ${category}`);
          } else {
            console.warn(`Invalid agent format in file: ${file}`);
          }
        }
      } catch (error) {
        console.error(`Error loading agent from ${file}:`, error);
      }
    }
  }
};

// Initialize agents
const initializeAgents = async () => {
  const categories = Object.keys(agentRegistry);
  
  for (const category of categories) {
    await loadAgentCategory(category);
  }
  
  console.log(`Loaded ${Object.keys(agents).length} agents in total`);
};

// Context management
const agentContexts: Record<string, AgentContext> = {};

// API Routes
// Get all available agents
app.get('/api/agents', (req, res) => {
  const result = Object.values(agents).map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    category: agent.category,
    capabilities: agent.capabilities || []
  }));
  
  res.json(result);
});

// Get agents by category
app.get('/api/agents/category/:category', (req, res) => {
  const category = req.params.category;
  
  if (!agentRegistry[category]) {
    return res.status(404).json({ error: `Category not found: ${category}` });
  }
  
  const result = Object.values(agentRegistry[category]).map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    capabilities: agent.capabilities || []
  }));
  
  res.json(result);
});

// Get a specific agent by ID
app.get('/api/agents/:id', (req, res) => {
  const agentId = req.params.id;
  const agent = agents[agentId];
  
  if (!agent) {
    return res.status(404).json({ error: `Agent not found: ${agentId}` });
  }
  
  res.json({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    category: agent.category,
    capabilities: agent.capabilities || []
  });
});

// Create or update a context for an agent
app.post('/api/agents/:id/context', (req, res) => {
  const agentId = req.params.id;
  const agent = agents[agentId];
  
  if (!agent) {
    return res.status(404).json({ error: `Agent not found: ${agentId}` });
  }
  
  const contextId = req.body.contextId || `context-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const context: AgentContext = {
    id: contextId,
    agentId,
    data: req.body.data || {},
    history: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  agentContexts[contextId] = context;
  
  res.json({ contextId, message: 'Context created successfully' });
});

// Process an agent request
app.post('/api/agents/:id/process', async (req, res) => {
  const agentId = req.params.id;
  const agent = agents[agentId];
  
  if (!agent) {
    return res.status(404).json({ error: `Agent not found: ${agentId}` });
  }
  
  const { contextId, input } = req.body;
  
  if (!contextId || !agentContexts[contextId]) {
    return res.status(400).json({ error: 'Invalid or missing contextId' });
  }
  
  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }
  
  const context = agentContexts[contextId];
  
  try {
    // Process the input using the agent
    const response = await agent.process(input, context);
    
    // Update context
    context.history.push({
      input,
      response,
      timestamp: new Date()
    });
    context.updatedAt = new Date();
    
    res.json({
      response,
      contextId
    });
  } catch (error) {
    console.error(`Error processing agent ${agentId}:`, error);
    res.status(500).json({ 
      error: 'Error processing agent request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    agentsLoaded: Object.keys(agents).length
  });
});

// Start the server
const startServer = async () => {
  try {
    await initializeAgents();
    
    app.listen(PORT, () => {
      console.log(`MCP Server started on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
};

startServer();

export { agents, agentRegistry, app };