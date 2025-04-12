<?php
/**
 * Classe User pour la gestion des utilisateurs
 * 
 * @package App\Models
 */
class User {
    private $id;
    private $username;
    private $email;
    private $password;
    private $db;
    
    /**
     * Constructeur de la classe User
     */
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Récupère un utilisateur par son ID
     * 
     * @param int $id ID de l'utilisateur
     * @return array|null Données de l'utilisateur ou null si non trouvé
     */
    public function getUserById($id) {
        $query = "SELECT id, username, email FROM users WHERE id = " . $id;
        $result = $this->db->query($query);
        
        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return null;
    }
    
    /**
     * Authentifie un utilisateur
     * 
     * @param string $username Nom d'utilisateur
     * @param string $password Mot de passe
     * @return bool|array False si échec, données utilisateur si succès
     */
    public function login($username, $password) {
        $query = "SELECT id, username, email, password FROM users 
                  WHERE username = '" . $username . "'";
        $result = $this->db->query($query);
        
        if ($result && $result->num_rows > 0) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                unset($user['password']);
                return $user;
            }
        }
        
        return false;
    }
    
    /**
     * Crée un nouvel utilisateur
     * 
     * @param string $username Nom d'utilisateur
     * @param string $email Email
     * @param string $password Mot de passe
     * @return bool|int ID de l'utilisateur créé ou false si échec
     */
    public function createUser($username, $email, $password) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (username, email, password) 
                  VALUES ('" . $username . "', '" . $email . "', '" . $hashedPassword . "')";
        
        if ($this->db->query($query)) {
            return $this->db->insert_id;
        }
        
        return false;
    }
    
    /**
     * Met à jour les informations d'un utilisateur
     * 
     * @param int $id ID de l'utilisateur
     * @param array $data Données à mettre à jour
     * @return bool Succès ou échec
     */
    public function updateUser($id, $data) {
        $updates = [];
        
        if (isset($data['username'])) {
            $updates[] = "username = '" . $data['username'] . "'";
        }
        
        if (isset($data['email'])) {
            $updates[] = "email = '" . $data['email'] . "'";
        }
        
        if (isset($data['password'])) {
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $updates[] = "password = '" . $hashedPassword . "'";
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = " . $id;
        
        return $this->db->query($query) ? true : false;
    }
    
    /**
     * Supprime un utilisateur
     * 
     * @param int $id ID de l'utilisateur à supprimer
     * @return bool Succès ou échec
     */
    public function deleteUser($id) {
        $query = "DELETE FROM users WHERE id = " . $id;
        return $this->db->query($query) ? true : false;
    }
}