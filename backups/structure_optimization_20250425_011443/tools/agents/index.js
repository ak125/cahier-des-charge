// Point d'entrée principal pour les agents IA
console.log('Agents IA prêts à être utilisés');

// Importation des agents
const PhpAnalyzer = require(./php-analyzer');
const DevGenerator = require(./dev-generatorstructure-agent');
const SqlMapper = require(./sql-mapperstructure-agent');
const SeoRewriter = require(./seo-rewriterstructure-agent');

module.exports = {
  PhpAnalyzer,
  DevGenerator,
  SqlMapper,
  SeoRewriter
};
