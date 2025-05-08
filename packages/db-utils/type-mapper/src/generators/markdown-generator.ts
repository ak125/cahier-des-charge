/**
 * Module de génération de documentation Markdown
 */
import { 
  TableMappingResult,
  TypeAnomalies,
  MarkdownDocOptions
} from '../types';

/**
 * Classe pour générer une documentation Markdown des mappings de types
 */
export class MarkdownGenerator {
  /**
   * Génère une documentation Markdown complète des mappings
   * @param tables Tables mappées 
   * @param anomalies Anomalies détectées
   * @param options Options de génération
   */
  public generateDocumentation(
    tables: TableMappingResult[],
    anomalies: TypeAnomalies[] = [],
    options: MarkdownDocOptions = {}
  ): string {
    const {
      includeTypeMapping = true,
      includeAnomalies = true,
      includeColumnDetails = true,
      includeRelations = true
    } = options;
    
    // Initialiser la documentation
    let doc = this.generateHeader();
    
    // Table des matières
    doc += this.generateTableOfContents(
      includeTypeMapping, 
      includeAnomalies, 
      includeColumnDetails,
      tables
    );
    
    // Résumé du mapping
    if (includeTypeMapping) {
      doc += this.generateTypeMappingsSection();
    }
    
    // Anomalies détectées
    if (includeAnomalies && anomalies.length > 0) {
      doc += this.generateAnomaliesSection(anomalies);
    }
    
    // Détails par table
    if (includeColumnDetails) {
      doc += this.generateTablesDetailsSection(
        tables, 
        includeRelations
      );
    }
    
    return doc;
  }
  
  /**
   * Génère l'en-tête de la documentation Markdown
   */
  private generateHeader(): string {
    const now = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `# Documentation du Mapping MySQL vers PostgreSQL/Prisma

*Document généré le ${now}*

Ce document décrit le mapping des types entre MySQL, PostgreSQL et Prisma, et fournit des détails sur les tables, colonnes et potentiels problèmes à résoudre lors de la migration.

`;
  }
  
  /**
   * Génère la table des matières
   */
  private generateTableOfContents(
    includeTypeMapping: boolean,
    includeAnomalies: boolean,
    includeColumnDetails: boolean,
    tables: TableMappingResult[]
  ): string {
    let toc = `## Table des matières\n\n`;
    
    let sectionNumber = 1;
    
    if (includeTypeMapping) {
      toc += `${sectionNumber}. [Mapping des types](#mapping-des-types)\n`;
      sectionNumber++;
    }
    
    if (includeAnomalies) {
      toc += `${sectionNumber}. [Anomalies détectées](#anomalies-détectées)\n`;
      sectionNumber++;
    }
    
    if (includeColumnDetails) {
      toc += `${sectionNumber}. [Détails des tables](#détails-des-tables)\n`;
      
      // Ajouter les sous-sections pour chaque table
      tables.forEach(table => {
        toc += `   - [${table.mysqlName}](#${this.createAnchor(table.mysqlName)})\n`;
      });
    }
    
    return toc + '\n';
  }
  
  /**
   * Génère la section de mapping des types
   */
  private generateTypeMappingsSection(): string {
    let section = `## Mapping des types

Le tableau suivant présente le mapping standard des types de données entre MySQL, PostgreSQL et Prisma:

| Type MySQL | Type PostgreSQL | Type Prisma | Remarques |
|-----------|----------------|-------------|-----------|
| TINYINT | SMALLINT | Int | |
| TINYINT(1) | BOOLEAN | Boolean | Utilisé pour les booléens |
| SMALLINT | SMALLINT | Int | |
| MEDIUMINT | INTEGER | Int | |
| INT | INTEGER | Int | |
| BIGINT | BIGINT | BigInt | |
| FLOAT | REAL | Float | Attention à la précision |
| DOUBLE | DOUBLE PRECISION | Float | Attention à la précision |
| DECIMAL | DECIMAL | Decimal | Conserve la précision et l'échelle |
| NUMERIC | NUMERIC | Decimal | |
| CHAR | CHAR | String | |
| VARCHAR | VARCHAR | String | |
| TEXT | TEXT | String | |
| TINYTEXT | TEXT | String | PostgreSQL n'a pas d'équivalent direct |
| MEDIUMTEXT | TEXT | String | PostgreSQL n'a pas d'équivalent direct |
| LONGTEXT | TEXT | String | PostgreSQL n'a pas d'équivalent direct |
| BINARY | BYTEA | Bytes | |
| VARBINARY | BYTEA | Bytes | |
| BLOB | BYTEA | Bytes | |
| DATE | DATE | DateTime | |
| TIME | TIME | DateTime | |
| DATETIME | TIMESTAMP | DateTime | |
| TIMESTAMP | TIMESTAMP | DateTime | |
| YEAR | SMALLINT | Int | PostgreSQL n'a pas de type YEAR |
| JSON | JSONB | Json | |
| ENUM | Type personnalisé ou TEXT | Enum ou String | Conversion à gérer spécifiquement |
| SET | TEXT[] | String[] | Utiliser un tableau ou une table de jointure |
| BIT | BIT | Int | |
| BOOLEAN | BOOLEAN | Boolean | |
| GEOMETRY | GEOMETRY (PostGIS) | String | Nécessite l'extension PostGIS |

### Attention particulière pour les types suivants

- **UNSIGNED**: PostgreSQL ne supporte pas les types non signés. Il est recommandé d'utiliser un type de taille supérieure ou d'ajouter une contrainte CHECK.
- **ENUM**: Les énumérations MySQL doivent être converties en types ENUM Prisma ou en tables de référence.
- **SET**: Les ensembles MySQL doivent être convertis en tableaux PostgreSQL ou en tables de jointure.
- **Types monétaires**: Pour les montants financiers, utiliser DECIMAL avec précision appropriée plutôt que FLOAT ou DOUBLE.

`;
    
    return section;
  }
  
  /**
   * Génère la section des anomalies détectées
   */
  private generateAnomaliesSection(anomalies: TypeAnomalies[]): string {
    let section = `## Anomalies détectées

Les problèmes suivants ont été identifiés dans le schéma et doivent être traités lors de la migration:

`;

    // Regrouper les anomalies par sévérité
    const bySeverity: Record<string, TypeAnomalies[]> = {
      high: anomalies.filter(a => a.severity === 'high'),
      medium: anomalies.filter(a => a.severity === 'medium'),
      low: anomalies.filter(a => a.severity === 'low')
    };
    
    // Générer les tableaux par sévérité
    if (bySeverity.high.length > 0) {
      section += `### Anomalies critiques (priorité haute)

| Table | Colonne | Type MySQL | Problème | Recommandation |
|-------|---------|------------|----------|---------------|
${bySeverity.high.map(a => 
  `| ${a.table} | ${a.column} | ${a.mysqlType} | ${a.issue} | ${a.recommendation} |`
).join('\n')}

`;
    }
    
    if (bySeverity.medium.length > 0) {
      section += `### Anomalies importantes (priorité moyenne)

| Table | Colonne | Type MySQL | Problème | Recommandation |
|-------|---------|------------|----------|---------------|
${bySeverity.medium.map(a => 
  `| ${a.table} | ${a.column} | ${a.mysqlType} | ${a.issue} | ${a.recommendation} |`
).join('\n')}

`;
    }
    
    if (bySeverity.low.length > 0) {
      section += `### Anomalies mineures (priorité basse)

| Table | Colonne | Type MySQL | Problème | Recommandation |
|-------|---------|------------|----------|---------------|
${bySeverity.low.map(a => 
  `| ${a.table} | ${a.column} | ${a.mysqlType} | ${a.issue} | ${a.recommendation} |`
).join('\n')}

`;
    }
    
    return section;
  }
  
  /**
   * Génère la section de détails des tables
   */
  private generateTablesDetailsSection(
    tables: TableMappingResult[],
    includeRelations: boolean
  ): string {
    let section = `## Détails des tables

Cette section détaille le mapping pour chaque table du schéma.

`;
    
    tables.forEach(table => {
      section += this.generateTableDetailSection(table, includeRelations);
    });
    
    return section;
  }
  
  /**
   * Génère une section détaillée pour une table
   */
  private generateTableDetailSection(
    table: TableMappingResult,
    includeRelations: boolean
  ): string {
    let section = `### ${table.mysqlName}

**Mapping:** MySQL \`${table.mysqlName}\` -> PostgreSQL \`${table.postgresName}\` -> Prisma \`${table.prismaModel}\`

#### Colonnes

| Colonne MySQL | Type MySQL | Colonne PostgreSQL | Type PostgreSQL | Champ Prisma | Type Prisma |
|--------------|-----------|-------------------|---------------|-------------|------------|
`;
    
    // Ajouter les détails de chaque colonne
    table.columns.forEach(col => {
      section += `| ${col.mysqlName} | ${col.mysqlType} | ${col.postgresName} | ${col.postgresType} | ${col.prismaField} | ${col.prismaType} |\n`;
    });
    
    // Ajouter les index si disponibles
    if (table.indexes && table.indexes.length > 0) {
      section += `
#### Index

| Nom MySQL | Nom PostgreSQL | Colonnes | Unique |
|-----------|----------------|----------|--------|
`;
      
      table.indexes.forEach(idx => {
        section += `| ${idx.mysqlName} | ${idx.postgresName} | ${idx.columns.join(', ')} | ${idx.unique ? 'Oui' : 'Non'} |\n`;
      });
    }
    
    // Ajouter les relations si demandé et disponibles
    if (includeRelations && table.foreignKeys && table.foreignKeys.length > 0) {
      section += `
#### Relations

| Nom | Colonnes locales | Table référencée | Colonnes référencées | Sur mise à jour | Sur suppression |
|-----|-----------------|-----------------|-------------------|---------------|---------------|
`;
      
      table.foreignKeys.forEach(fk => {
        section += `| ${fk.mysqlName} | ${fk.columns.join(', ')} | ${fk.referencedTable} | ${fk.referencedColumns.join(', ')} | ${fk.onUpdate || 'NO ACTION'} | ${fk.onDelete || 'NO ACTION'} |\n`;
      });
    }
    
    // Ajouter les anomalies si présentes
    if (table.anomalies && table.anomalies.length > 0) {
      section += `
#### Anomalies détectées

| Colonne | Type | Problème | Recommandation | Sévérité |
|---------|------|---------|---------------|----------|
`;
      
      table.anomalies.forEach(anomaly => {
        section += `| ${anomaly.column} | ${anomaly.mysqlType} | ${anomaly.issue} | ${anomaly.recommendation} | ${anomaly.severity} |\n`;
      });
    }
    
    section += '\n';
    return section;
  }
  
  /**
   * Crée un identifiant d'ancre Markdown à partir d'un texte
   */
  private createAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
  }
}