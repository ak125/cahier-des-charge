import { useState } from reactstructure-agent";

interface FilterPanelProps {
  filters: {
    category: string;
    status: string;
    debtThreshold: number;
    searchTerm: string;
    module: string;
  };
  setFilters: (filters: any) => void;
  categories: Record<string, string[]>; // Catégories de tables métier
}

export default function FilterPanel({ filters, setFilters, categories }: FilterPanelProps) {
  // Extraire toutes les catégories métier disponibles
  const businessCategories = Object.keys(categories || {});
  
  // Liste des statuts possibles
  const statuses = [
    { id: "all", name: "Tous les statuts" },
    { id: "pending", name: "En attente" },
    { id: "in_progress", name: "En cours" },
    { id: "completed", name: "Terminée" },
    { id: "blocked", name: "Bloquée" },
    { id: "skipped", name: "Ignorée" }
  ];
  
  // Gestion des changements de filtres
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, category: e.target.value });
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, status: e.target.value });
  };
  
  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, module: e.target.value });
  };
  
  const handleDebtThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, debtThreshold: Number(e.target.value) });
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchTerm: e.target.value });
  };
  
  const resetFilters = () => {
    setFilters({
      category: "all",
      status: "all",
      debtThreshold: 0,
      searchTerm: "",
      module: "all"
    });
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Filtre par catégorie métier */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Catégorie de table
          </label>
          <select
            id="category"
            name="category"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filters.category}
            onChange={handleCategoryChange}
          >
            <option value="all">Toutes les catégories</option>
            <option value="business">Tables métier</option>
            <option value="junction">Tables de jointure</option>
            <option value="reference">Tables de référence</option>
            <option value="technical">Tables techniques</option>
            <option value="view">Vues</option>
            {businessCategories.map(category => (
              <option key={category} value={`business_${category}`}>
                Métier: {category}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filtre par statut */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Statut de migration
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filters.status}
            onChange={handleStatusChange}
          >
            {statuses.map(status => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filtre par module */}
        <div>
          <label htmlFor="module" className="block text-sm font-medium text-gray-700">
            Module fonctionnel
          </label>
          <select
            id="module"
            name="module"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filters.module}
            onChange={handleModuleChange}
          >
            <option value="all">Tous les modules</option>
            <option value="utilisateurs">Utilisateurs</option>
            <option value="commandes">Commandes</option>
            <option value="produits">Produits</option>
            <option value="factures">Factures</option>
            <option value="statistiques">Statistiques</option>
          </select>
        </div>
        
        {/* Filtre par seuil de dette technique */}
        <div>
          <label htmlFor="debtThreshold" className="block text-sm font-medium text-gray-700">
            Score minimal de dette
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="range"
              id="debtThreshold"
              name="debtThreshold"
              min="0"
              max="100"
              step="5"
              value={filters.debtThreshold}
              onChange={handleDebtThresholdChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-2 text-sm text-gray-700 w-8 text-right">
              {filters.debtThreshold}
            </span>
          </div>
        </div>
        
        {/* Recherche textuelle */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Recherche
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              name="search"
              id="search"
              value={filters.searchTerm}
              onChange={handleSearchChange}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
              placeholder="Nom de table ou modèle"
            />
            {filters.searchTerm && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                onClick={() => setFilters({ ...filters, searchTerm: "" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Bouton de réinitialisation */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  );
}