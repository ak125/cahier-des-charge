#!/usr/bin/env node
/**
 * Script de test pour envoyer une requête à l'API MCP
 */
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Configuration de la requête
const requestId = uuidv4();
const sessionId = uuidv4();
const timestamp = new Date().toISOString();

// Construction du contexte MCP selon les standards
const mcpContext = {
    requestId,
    timestamp,
    version: '2.0',
    agent: {
        id: 'example-agent',
        name: 'Agent Exemple'
    },
    session: {
        id: sessionId
    },
    input: {
        query: 'Analyser ce texte et me donner un résumé',
        parameters: {
            analyze: true
        },
        format: 'markdown'
    }
};

// Options pour la requête HTTP
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/mcp/process',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

// Envoi de la requête
console.log('Envoi de la requête MCP...');
const req = http.request(options, (res) => {
    console.log(`Statut de la réponse: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Réponse reçue:');
        console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
});

req.on('error', (error) => {
    console.error('Erreur lors de la requête:', error);
});

// Envoi des données
req.write(JSON.stringify(mcpContext));
req.end();