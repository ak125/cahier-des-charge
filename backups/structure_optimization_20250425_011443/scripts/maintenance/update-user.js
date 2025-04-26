#!/usr/bin/env node

const https = require(httpsstructure-agent');
const http = require(httpstructure-agent');

// Configuration
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';

// Informations utilisateur à mettre à jour
const userData = {
  firstName: 'fafa',
  lastName: 'mass',
  email: 'automecanik.seo@gmail.com',
  password: '63@Amg2025'
};

// Fonction pour faire une requête HTTP
function makeRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}${endpoint}`;
    console.log(`🔄 Requête ${method} vers ${url}`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers
    };

    const req = (N8N_PROTOCOL === 'https' ? https : http).request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          console.log(`Erreur HTTP ${res.statusCode}: ${responseData}`);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }

    req.end();
  });
}

// Fonction alternative pour créer un nouvel utilisateur
async function createUser() {
  try {
    console.log('👤 Création d\'un nouvel utilisateur...');

    // Vérification du statut d'installation
    try {
      console.log('🔍 Vérification du statut d\'installation de n8n...');
      const setupStatus = await makeRequest('GET', '/rest/setup');
      
      if (setupStatus && setupStatus.setupStatus === false) {
        console.log('🔧 n8n n\'est pas encore configuré. Configuration initiale...');
        
        // Création du premier utilisateur (setup)
        const setupData = {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: userData.password
        };
        
        const setupResult = await makeRequest('POST', '/rest/setup', setupData);
        console.log('✅ Configuration initiale de n8n réussie!');
        console.log(`📊 Utilisateur créé: ${setupResult.email || setupResult.firstName}`);
        
        return true;
      } else {
        console.log('ℹ️ n8n est déjà configuré.');
        return false;
      }
    } catch (error) {
      console.log('ℹ️ Impossible de vérifier le statut d\'installation:', error.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la création de l'utilisateur: ${error.message}`);
    return false;
  }
}

// Fonction pour se connecter à n8n
async function login() {
  try {
    console.log('🔑 Tentative de connexion à n8n...');
    
    // Format de connexion mis à jour pour n8n 1.88.0
    const credentials = {
      emailOrLdapLoginId: userData.email,
      password: userData.password
    };

    // Essayons d'abord de nous connecter avec les nouvelles informations
    try {
      const loginResult = await makeRequest('POST', '/rest/login', credentials);
      console.log('✅ Connexion réussie avec les nouvelles informations!');
      return loginResult.token;
    } catch (loginError) {
      console.log('⚠️ Échec de connexion avec les nouvelles informations:', loginError.message);
      
      // Si la connexion échoue, essayons avec les identifiants par défaut
      try {
        console.log('🔑 Tentative de connexion avec les identifiants par défaut (admin@example.com)...');
        const defaultCredentials = {
          emailOrLdapLoginId: 'admin@example.com',
          password: 'cahier-des-charges-migrator'
        };
        const loginResult = await makeRequest('POST', '/rest/login', defaultCredentials);
        console.log('✅ Connexion réussie avec les identifiants par défaut!');
        return loginResult.token;
      } catch (defaultLoginError) {
        console.error('❌ Échec de connexion avec les identifiants par défaut:', defaultLoginError.message);
        throw new Error('Impossible de se connecter à n8n');
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la connexion à n8n: ${error.message}`);
    throw error;
  }
}

// Fonction pour mettre à jour l'utilisateur
async function updateUser(token) {
  try {
    console.log('👤 Récupération des informations sur l\'utilisateur actuel...');
    const me = await makeRequest('GET', '/rest/me', null, token);
    console.log(`✅ Utilisateur trouvé: ${me.email} (ID: ${me.id})`);
    
    console.log('📝 Mise à jour des informations utilisateur...');
    const updateData = {
      id: me.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email
    };
    
    const updatedUser = await makeRequest('PATCH', `/rest/users/${me.id}`, updateData, token);
    console.log(`✅ Informations utilisateur mises à jour: ${updatedUser.email}`);
    
    // Mise à jour du mot de passe
    console.log('🔑 Mise à jour du mot de passe...');
    const passwordData = {
      currentPassword: 'cahier-des-charges-migrator', // Mot de passe actuel
      newPassword: userData.password
    };
    
    await makeRequest('POST', `/rest/users/${me.id}/password`, passwordData, token);
    console.log('✅ Mot de passe mis à jour avec succès!');
    
    return updatedUser;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
    throw error;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Démarrage de la mise à jour des informations utilisateur...');
    
    // Essayer de créer un utilisateur si l'installation n'est pas terminée
    const userCreated = await createUser();
    
    if (userCreated) {
      console.log('✅ Utilisateur créé avec succès!');
      console.log(`📊 Nouvel utilisateur: ${userData.email}`);
      console.log(`   Prénom: ${userData.firstName}`);
      console.log(`   Nom: ${userData.lastName}`);
      console.log('🌐 Vous pouvez maintenant vous connecter à n8n avec ces informations.');
      return;
    }
    
    // Si l'utilisateur n'a pas été créé, essayer de mettre à jour
    console.log('📝 Tentative de mise à jour de l\'utilisateur existant...');
    
    // Se connecter à n8n
    const token = await login();
    
    // Mettre à jour l'utilisateur
    const updatedUser = await updateUser(token);
    
    console.log('✅ Mise à jour des informations utilisateur terminée!');
    console.log(`📊 Utilisateur mis à jour: ${updatedUser.email}`);
    console.log(`   Prénom: ${updatedUser.firstName}`);
    console.log(`   Nom: ${updatedUser.lastName}`);
    
    console.log('🔒 Le mot de passe a été mis à jour selon votre demande.');
    console.log('🌐 Vous pouvez maintenant vous connecter à n8n avec ces informations.');
    
    return updatedUser;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
main();