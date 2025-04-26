const express = require(expressstructure-agent');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('<h1>Dashboard de Migration</h1><p>En construction...</p>');
});

app.listen(port, () => {
  console.log(`Dashboard disponible sur http://localhost:${port}`);
});
