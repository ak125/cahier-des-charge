import React from 'react';
import { AgentFormSchema, AgentFormData, defaultAgentFormValues } from './schemas';
import { useTypeBoxForm } from '../../hooks/useTypeBoxForm';
import { agentService } from '../../services/agentService';

interface AgentFormProps {
    onSuccess?: (agent: AgentFormData) => void;
    onError?: (error: Error) => void;
    initialValues?: Partial<AgentFormData>;
}

export const AgentFormWithHook: React.FC<AgentFormProps> = ({
    onSuccess,
    onError,
    initialValues = {}
}) => {
    // Utiliser notre hook personnalisé avec TypeBox
    const form = useTypeBoxForm<AgentFormData>(
        AgentFormSchema,
        { ...defaultAgentFormValues, ...initialValues }
    );

    // Gestion des capacités (tableau de strings)
    const handleCapabilitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const capabilities = e.target.value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);

        form.setValue('capabilities', capabilities);
    };

    // Soumission du formulaire
    const submitForm = async (values: AgentFormData) => {
        try {
            // Envoyer les données à l'API
            const createdAgent = await agentService.createAgent(values);

            // Appeler le callback de succès si défini
            if (onSuccess) {
                onSuccess(values);
            }

            // Réinitialiser le formulaire
            form.resetForm();

            return createdAgent;
        } catch (error) {
            // Appeler le callback d'erreur si défini
            if (onError && error instanceof Error) {
                onError(error);
            }

            // Log l'erreur
            console.error('Erreur lors de la création de l\'agent:', error);

            throw error;
        }
    };

    return (
        <form onSubmit={form.handleSubmit(submitForm)} className="agent-form">
            {form.errors.form && (
                <div className="error-message form-error">{form.errors.form}</div>
            )}

            <div className="form-group">
                <label htmlFor="name">Nom de l'agent*</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.values.name}
                    onChange={form.handleChange}
                    onBlur={() => form.validateField('name')}
                    className={form.errors.name && form.touched.name ? 'input-error' : ''}
                />
                {form.errors.name && form.touched.name && (
                    <div className="error-message">{form.errors.name}</div>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="description">Description*</label>
                <textarea
                    id="description"
                    name="description"
                    value={form.values.description}
                    onChange={form.handleChange}
                    onBlur={() => form.validateField('description')}
                    className={form.errors.description && form.touched.description ? 'input-error' : ''}
                    rows={4}
                />
                {form.errors.description && form.touched.description && (
                    <div className="error-message">{form.errors.description}</div>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="version">Version*</label>
                <input
                    type="text"
                    id="version"
                    name="version"
                    value={form.values.version}
                    onChange={form.handleChange}
                    onBlur={() => form.validateField('version')}
                    className={form.errors.version && form.touched.version ? 'input-error' : ''}
                    placeholder="1.0.0"
                />
                {form.errors.version && form.touched.version && (
                    <div className="error-message">{form.errors.version}</div>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="type">Type*</label>
                <select
                    id="type"
                    name="type"
                    value={form.values.type}
                    onChange={form.handleChange}
                    onBlur={() => form.validateField('type')}
                    className={form.errors.type && form.touched.type ? 'input-error' : ''}
                >
                    <option value="analyzer">Analyseur</option>
                    <option value="generator">Générateur</option>
                    <option value="transformer">Transformateur</option>
                    <option value="validator">Validateur</option>
                </select>
                {form.errors.type && form.touched.type && (
                    <div className="error-message">{form.errors.type}</div>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="capabilities">Capacités* (séparées par des virgules)</label>
                <input
                    type="text"
                    id="capabilities"
                    name="capabilities"
                    value={form.values.capabilities.join(', ')}
                    onChange={handleCapabilitiesChange}
                    onBlur={() => form.validateField('capabilities')}
                    className={form.errors.capabilities && form.touched.capabilities ? 'input-error' : ''}
                />
                {form.errors.capabilities && form.touched.capabilities && (
                    <div className="error-message">{form.errors.capabilities}</div>
                )}
            </div>

            <div className="form-group checkbox-group">
                <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={form.values.isActive}
                    onChange={form.handleChange}
                />
                <label htmlFor="isActive">Agent actif</label>
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    onClick={() => form.resetForm()}
                    className="button secondary"
                    disabled={form.isSubmitting}
                >
                    Réinitialiser
                </button>

                <button
                    type="submit"
                    className="button primary"
                    disabled={form.isSubmitting}
                >
                    {form.isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>

            {/* Indicateur de validation du formulaire */}
            <div className="form-status">
                {form.isValid && (
                    <span className="validation-status valid">Formulaire valide</span>
                )}
            </div>
        </form>
    );
};