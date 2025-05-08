/**
 * Exemple d'intégration du système de validation et signature sécurisée
 * avec l'architecture MCP (Model Context Protocol)
 * 
 * Ce fichier montre comment intégrer le SafeMigrationValidator et la signature
 * Sigstore dans un workflow de génération de code par IA.
 */

import { safeMigrationValidator } from '../core/SafeMigrationValidator';
import { validateAndSignCode, validateAndSignFile } from '../utils/validate-and-sign';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Simuler un module MCP
interface McpAgent {
    id: string;
    generateCode: (prompt: string) => Promise<string>;
}

interface McpContext {
    runId: string;
    workingDirectory: string;
    outputDirectory: string;
    signatureDirectory: string;
}

/**
 * Fonction hook pour MCP qui vérifie et signe le code après sa génération
 * Cette fonction serait utilisée comme un middleware dans le pipeline MCP
 */
export async function postAgentGenerate(
    code: string,
    agent: McpAgent,
    context: McpContext
): Promise<{ code: string; validationPassed: boolean; signed: boolean }> {
    // Créer les répertoires si nécessaire
    if (!fs.existsSync(context.outputDirectory)) {
        fs.mkdirSync(context.outputDirectory, { recursive: true });
    }

    if (!fs.existsSync(context.signatureDirectory)) {
        fs.mkdirSync(context.signatureDirectory, { recursive: true });
    }

    // Générer un identifiant unique pour cette sortie d'agent
    const codeHash = crypto.createHash('sha256').update(code).digest('hex').substring(0, 8);
    const outputFilePath = path.join(context.outputDirectory, `${agent.id}-${codeHash}.ts`);

    // Sauvegarder le code original (non validé)
    fs.writeFileSync(outputFilePath + '.original', code, 'utf8');

    console.log(`🤖 Code généré par l'agent ${agent.id} (${code.length} caractères)`);
    console.log(`📁 Sauvegardé dans ${outputFilePath}.original`);

    // Valider et signer le code
    console.log('🔍 Validation et signature du code...');

    const result = await validateAndSignCode(code, {
        agentId: agent.id,
        runId: context.runId,
        outputDir: context.signatureDirectory,
        generateReport: true,
        fileType: 'ts' // Supposer que c'est du TypeScript par défaut
    });

    if (!result.valid) {
        console.error('❌ Le code généré n\'a pas passé les validations de sécurité!');

        // Sauvegarder le code comme rejeté
        fs.writeFileSync(outputFilePath + '.rejected', code, 'utf8');

        // Optionnellement, on peut générer un rapport détaillé du rejet
        const validationReport = await safeMigrationValidator.getValidationReport(code);
        fs.writeFileSync(
            path.join(context.signatureDirectory, `validation-failure-${agent.id}-${codeHash}.md`),
            validationReport.report,
            'utf8'
        );

        return {
            code: '',
            validationPassed: false,
            signed: false
        };
    }

    // Le code est valide, le sauvegarder
    fs.writeFileSync(outputFilePath, code, 'utf8');

    console.log('✅ Code validé avec succès!');

    // Vérifier si le code a bien été signé
    if (result.signed) {
        console.log('📝 Code signé avec succès!');
        console.log(`🔏 Signature: ${result.signatureInfo?.signaturePath}`);

        // Sauvegarder les informations de signature dans un fichier JSON pour référence
        fs.writeFileSync(
            path.join(context.signatureDirectory, `signature-info-${agent.id}-${codeHash}.json`),
            JSON.stringify(result.signatureInfo, null, 2),
            'utf8'
        );
    } else {
        console.warn('⚠️ La signature du code a échoué, mais le code est valide');
    }

    if (result.reportPath) {
        console.log(`📋 Rapport de validation: ${result.reportPath}`);
    }

    return {
        code,
        validationPassed: true,
        signed: result.signed
    };
}

/**
 * Démonstration d'utilisation dans un workflow MCP
 */
async function demoPipeline() {
    // Simuler un agent IA
    const agent: McpAgent = {
        id: 'typescript-generator',
        generateCode: async (prompt: string) => {
            // Dans un cas réel, ceci appellerait un LLM ou un autre système de génération
            console.log(`⚙️ Génération de code à partir du prompt: "${prompt}"...`);

            // Retourner un exemple de code (sécurisé ou non selon le prompt)
            if (prompt.includes('unsafe')) {
                // Code non sécurisé avec une faille potentielle
                return `
        // Exemple de code non sécurisé
        import * as fs from 'fs';
        import * as child_process from 'child_process';
        
        export function processUserInput(input: string): string {
          // Faille: exécution arbitraire de commandes
          const result = child_process.execSync('echo ' + input);
          return result.toString();
        }
        
        export function saveData(filename: string, data: string): void {
          // Faille: traversée de chemin
          fs.writeFileSync(filename, data);
        }`;
            } else {
                // Code sécurisé
                return `
        // Exemple de code sécurisé
        import { v4 as uuidv4 } from 'uuid';
        
        interface User {
          id: string;
          name: string;
          email: string;
        }
        
        export class UserService {
          private users: User[] = [];
          
          createUser(name: string, email: string): User {
            const newUser: User = {
              id: uuidv4(),
              name,
              email
            };
            
            this.users.push(newUser);
            return newUser;
          }
          
          getUserById(id: string): User | undefined {
            return this.users.find(user => user.id === id);
          }
        }`;
            }
        }
    };

    // Configurer le contexte MCP
    const context: McpContext = {
        runId: `run-${Date.now()}`,
        workingDirectory: process.cwd(),
        outputDirectory: path.join(process.cwd(), 'generated'),
        signatureDirectory: path.join(process.cwd(), 'signatures')
    };

    console.log('=== 📝 Test de génération de code sécurisé ===');

    // Générer du code sécurisé
    const safeCode = await agent.generateCode('Créer une classe UserService en TypeScript');

    // Valider et signer avec notre hook
    const safeResult = await postAgentGenerate(safeCode, agent, context);

    console.log(`\n=== Résultat code sécurisé: ${safeResult.validationPassed ? '✅ VALIDÉ' : '❌ REJETÉ'} ===\n`);

    console.log('=== 🚨 Test de génération de code non sécurisé ===');

    // Générer du code non sécurisé
    const unsafeCode = await agent.generateCode('Créer une fonction unsafe qui exécute des commandes shell');

    // Valider et signer avec notre hook
    const unsafeResult = await postAgentGenerate(unsafeCode, agent, context);

    console.log(`\n=== Résultat code non sécurisé: ${unsafeResult.validationPassed ? '✅ VALIDÉ' : '❌ REJETÉ'} ===\n`);
}

// Exécuter la démo si ce fichier est appelé directement
if (require.main === module) {
    demoPipeline().catch(error => {
        console.error('Erreur dans le pipeline de démo:', error);
        process.exit(1);
    });
}