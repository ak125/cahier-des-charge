import React, { useState } from 'react';
import { AgentFormSchema, AgentFormData, defaultAgentFormValues } from './schemas';
import { createValidator } from '../../lib/validation';

// Créer un validateur optimisé pour ce formulaire
const agentValidator = createValidator<AgentFormData>(AgentFormSchema);

interface AgentFormProps {
    onSubmit: (data: AgentFormData) => Promise<void>;
    initialValues?: Partial<AgentFormData>;
}

export const AgentForm: React.FC<AgentFormProps> = ({
    onSubmit,
    initialValues = {}
}) => {
    // État du formulaire
    const [formData, setFormData] = useState<AgentFormData>({
        ...defaultAgentFormValues,
        ...initialValues
    });

    // État des erreurs
    const [errors, setErrors] = useState<Record<string, string>>({});

    // État de soumission
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Gestion des changements de champ
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : value
        }));

        // Effacer l'erreur pour ce champ quand il change
        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    // Gestion des capacités (tableau de strings)
    const handleCapabilitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const capabilities = e.target.value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);

        setFormData(prev => ({
            ...prev,
            capabilities
        }));
    };

    // Validation du formulaire à la soumission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Valider avec TypeBox
        const validation = agentValidator.validate(formData);

        if (!validation.isValid) {
            setErrors(validation.errors || {});
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit(formData);
            // Réinitialiser le formulaire après succès?
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            setErrors({
                form: 'Une erreur est survenue lors de la sauvegarde'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="agent-form">
            {errors.form && (
                <div className="error-message form-error">{errors.form}</div>
            )}

            <div className="form-group">
                <label htmlFor="name">Nom de l'agent*</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="description">Description*</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={errors.description ? 'input-error' : ''}
                    rows={4}
                />
                {errors.description && <div className="error-message">{errors.description}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="version">Version*</label>
                <input
                    type="text"
                    id="version"
                    name="version"
                    value={formData.version}
                    onChange={handleChange}
                    className={errors.version ? 'input-error' : ''}
                    placeholder="1.0.0"
                />
                {errors.version && <div className="error-message">{errors.version}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="type">Type*</label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={errors.type ? 'input-error' : ''}
                >
                    <option value="analyzer">Analyseur</option>
                    <option value="generator">Générateur</option>
                    <option value="transformer">Transformateur</option>
                    <option value="validator">Validateur</option>
                </select>
                {errors.type && <div className="error-message">{errors.type}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="capabilities">Capacités* (séparées par des virgules)</label>
                <input
                    type="text"
                    id="capabilities"
                    name="capabilities"
                    value={formData.capabilities.join(', ')}
                    onChange={handleCapabilitiesChange}
                    className={errors.capabilities ? 'input-error' : ''}
                />
                {errors.capabilities && <div className="error-message">{errors.capabilities}</div>}
            </div>

            <div className="form-group checkbox-group">
                <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                />
                <label htmlFor="isActive">Agent actif</label>
            </div>

            <div className="form-actions">
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
};