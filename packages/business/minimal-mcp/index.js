const express = require('express');
const app = express();
const port = process.env.PORT || 3333;
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', version: '1.0.0', mode: 'minimal' });
});
app.listen(port, () => console.log('Minimal MCP server running on port '));
