import fs from 'fs';
import path from 'path';
import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';

// Import agent types
import { Agent, AgentContext, AgentResponse } from './types/agent';

// Configuration
const config = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../configDoDotmcp-server-config.json'), 'utf8')
);

// Création de l'instance Fastify
const app: FastifyInstance = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true
      }
    }
  }
});
const PORT = config.server.port || 3000;

// Middleware
app.register(fastifyCors, config.server.cors || {});

// Agent registry by category
const agentRegistry: Record<string, Record<string, Agent>> = {
  analysis: {},
  core: {},
  migration: {},
  quality: {},
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
app.get('/api/agents', async (_request, reply) => {
  const result = Object.values(agents).map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    category: agent.category,
    capabilities: agent.capabilities || [],
  }));

  reply.send(result);
});

// Get agents by category
app.get<{
  Params: { category: string };
}>('/api/agents/category/:category', async (request, reply) => {
  const category = request.params.category;

  if (!agentRegistry[category]) {
    return reply.code(404).send({ error: `Category not found: ${category}` });
  }

  const result = Object.values(agentRegistry[category]).map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    capabilities: agent.capabilities || [],
  }));

  reply.send(result);
});

// Get a specific agent by ID
app.get<{
  Params: { id: string };
}>('/api/agents/:id', async (request, reply) => {
  const agentId = request.params.id;
  const agent = agents[agentId];

  if (!agent) {
    return reply.code(404).send({ error: `Agent not found: ${agentId}` });
  }

  reply.send({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    category: agent.category,
    capabilities: agent.capabilities || [],
  });
});

// Create or update a context for an agent
interface CreateContextBody {
  contextId?: string;
  data?: Record<string, any>;
}

app.post<{
  Params: { id: string };
  Body: CreateContextBody;
}>('/api/agents/:id/context', async (request, reply) => {
  const agentId = request.params.id;
  const agent = agents[agentId];

  if (!agent) {
    return reply.code(404).send({ error: `Agent not found: ${agentId}` });
  }

  const contextId =
    request.body.contextId || `context-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const context: AgentContext = {
    id: contextId,
    agentId,
    data: request.body.data || {},
    history: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  agentContexts[contextId] = context;

  reply.send({ contextId, message: 'Context created successfully' });
});

// Process an agent request
interface ProcessAgentBody {
  contextId: string;
  input: any;
}

app.post<{
  Params: { id: string };
  Body: ProcessAgentBody;
}>('/api/agents/:id/process', async (request, reply) => {
  const agentId = request.params.id;
  const agent = agents[agentId];

  if (!agent) {
    return reply.code(404).send({ error: `Agent not found: ${agentId}` });
  }

  const { contextId, input } = request.body;

  if (!contextId || !agentContexts[contextId]) {
    return reply.code(400).send({ error: 'Invalid or missing contextId' });
  }

  if (!input) {
    return reply.code(400).send({ error: 'Input is required' });
  }

  const context = agentContexts[contextId];

  try {
    // Process the input using the agent
    const response = await agent.process(input, context);

    // Update context
    context.history.push({
      input,
      response,
      timestamp: new Date(),
    });
    context.updatedAt = new Date();

    reply.send({
      response,
      contextId,
    });
  } catch (error) {
    console.error(`Error processing agent ${agentId}:`, error);
    reply.code(500).send({
      error: 'Error processing agent request',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check endpoint
app.get('/health', async (_request, reply) => {
  reply.send({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    agentsLoaded: Object.keys(agents).length,
  });
});

// Start the server
const startServer = async () => {
  try {
    await initializeAgents();

    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`MCP Server started on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
};

startServer();

export { agents, agentRegistry, app };
