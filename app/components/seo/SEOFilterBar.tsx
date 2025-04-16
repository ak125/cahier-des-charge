import { Form, useSubmit } from "@remix-run/react";
import { useEffect, useRef } from "react";

interface SEOFilterBarProps {
  currentFilters: {
    status: string;
    score: string;
    sort: string;
    dir: string;
  };
}

export function SEOFilterBar({ currentFilters }: SEOFilterBarProps) {
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);

  // Soumettre automatiquement le formulaire quand les filtres changent
  const handleFilterChange = () => {
    if (formRef.current) {
      submit(formRef.current);
    }
  };

  return (
    <Form ref={formRef} method="get" className="flex flex-wrap gap-4 mb-4">
      {/* Filtre par statut */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Statut
        </label>
        <select
          id="status"
          name="status"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          defaultValue={currentFilters.status}
          onChange={handleFilterChange}
        >
          <option value="all">Tous les statuts</option>
          <option value="success">Optimisé</option>
          <option value="warning">Avertissements</option>
          <option value="error">Problèmes critiques</option>
          <option value="pending">En attente</option>
        </select>
      </div>

      {/* Filtre par score */}
      <div>
        <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
          Score SEO
        </label>
        <select
          id="score"
          name="score"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          defaultValue={currentFilters.score}
          onChange={handleFilterChange}
        >
          <option value="all">Tous les scores</option>
          <option value="90-100">Excellent (90-100)</option>
          <option value="70-89">Bon (70-89)</option>
          <option value="50-69">Moyen (50-69)</option>
          <option value="0-49">Faible (0-49)</option>
        </select>
      </div>

      {/* Tri */}
      <div>
        <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
          Trier par
        </label>
        <select
          id="sort"
          name="sort"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          defaultValue={currentFilters.sort}
          onChange={handleFilterChange}
        >
          <option value="url">URL</option>
          <option value="score">Score SEO</option>
          <option value="issues">Nombre de problèmes</option>
          <option value="lastChecked">Date de vérification</option>
        </select>
      </div>

      {/* Direction du tri */}
      <div>
        <label htmlFor="dir" className="block text-sm font-medium text-gray-700 mb-1">
          Ordre
        </label>
        <select
          id="dir"
          name="dir"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          defaultValue={currentFilters.dir}
          onChange={handleFilterChange}
        >
          <option value="asc">Ascendant</option>
          <option value="desc">Descendant</option>
        </select>
      </div>

      <div className="self-end ml-auto">
        <button
          type="button"
          onClick={() => {
            // Réinitialiser les filtres
            if (formRef.current) {
              const form = formRef.current;
              form.querySelector<HTMLSelectElement>('[name="status"]')!.value = 'all';
              form.querySelector<HTMLSelectElement>('[name="score"]')!.value = 'all';
              form.querySelector<HTMLSelectElement>('[name="sort"]')!.value = 'url';
              form.querySelector<HTMLSelectElement>('[name="dir"]')!.value = 'asc';
              submit(form);
            }
          }}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-md"
        >
          Réinitialiser
        </button>
      </div>
    </Form>
  );
}