import React, { useState } from 'react';

interface FilterPanelProps {
  categories: string[];
  statuses: string[];
  modules: string[];
  debtRanges: Array<{ min: number; max: number; label: string }>;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  categories: string[];
  statuses: string[];
  modules: string[];
  debtRange: { min: number; max: number } | null;
  searchTerm: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  statuses,
  modules,
  debtRanges,
  onFilterChange,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    statuses: [],
    modules: [],
    debtRange: null,
    searchTerm: '',
  });

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    updateFilters({ ...filters, categories: newCategories });
  };

  const handleStatusChange = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];

    updateFilters({ ...filters, statuses: newStatuses });
  };

  const handleModuleChange = (module: string) => {
    const newModules = filters.modules.includes(module)
      ? filters.modules.filter((m) => m !== module)
      : [...filters.modules, module];

    updateFilters({ ...filters, modules: newModules });
  };

  const handleDebtRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const rangeValue = event.target.value;
    if (rangeValue === '') {
      updateFilters({ ...filters, debtRange: null });
      return;
    }

    const [min, max] = rangeValue.split('-').map(Number);
    updateFilters({ ...filters, debtRange: { min, max } });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ ...filters, searchTerm: event.target.value });
  };

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      categories: [],
      statuses: [],
      modules: [],
      debtRange: null,
      searchTerm: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Traduction des catégories
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'business':
        return 'Métier';
      case 'pivot':
        return 'Pivot (N:N)';
      case 'technical':
        return 'Technique';
      default:
        return category;
    }
  };

  // Traduction des statuts
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'blocked':
        return 'Bloquée';
      case 'in_progress':
        return 'En cours';
      case 'migrated':
        return 'Migrée';
      case 'validated':
        return 'Validée';
      case 'ignored':
        return 'Ignorée';
      default:
        return status;
    }
  };

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h2>Filtres</h2>
        <button className="clear-filters-btn" onClick={clearFilters}>
          Réinitialiser
        </button>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Rechercher une table..."
          value={filters.searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="filter-section">
        <h3>Catégories</h3>
        <div className="filter-options">
          {categories.map((category) => (
            <label key={category} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => handleCategoryChange(category)}
              />
              {getCategoryLabel(category)}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Statut</h3>
        <div className="filter-options">
          {statuses.map((status) => (
            <label key={status} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.statuses.includes(status)}
                onChange={() => handleStatusChange(status)}
              />
              {getStatusLabel(status)}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Modules</h3>
        <div className="filter-options">
          {modules.map((module) => (
            <label key={module} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.modules.includes(module)}
                onChange={() => handleModuleChange(module)}
              />
              {module}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Niveau de Dette Technique</h3>
        <select
          className="debt-range-select"
          value={filters.debtRange ? `${filters.debtRange.min}-${filters.debtRange.max}` : ''}
          onChange={handleDebtRangeChange}
        >
          <option value="">Tous</option>
          {debtRanges.map((range) => (
            <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
              {range.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterPanel;
