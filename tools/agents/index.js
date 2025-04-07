// Point d'entrée principal pour les agents IA
console.log('Agents IA prêts à être utilisés');

// Importation des agents
const PhpAnalyzer = require('./php-analyzer');
const DevGenerator = require('./dev-generator');
const SqlMapper = require('./sql-mapper');
const SeoRewriter = require('./seo-rewriter');

module.exports = {
  PhpAnalyzer,
  DevGenerator,
  SqlMapper,
  SeoRewriter
};
