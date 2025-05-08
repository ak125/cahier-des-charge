import { useState, useCallback, ChangeEvent } from 'react';
import { TSchema } from '@sinclair/typebox';
import { createValidator } from '../lib/validation';

/**
 * Hook personnalisé pour gérer les formulaires avec validation TypeBox
 * 
 * @param schema Le schéma TypeBox à utiliser pour la validation
 * @param initialValues Valeurs initiales du formulaire
 */
export function useTypeBoxForm<T extends Record<string, any>>(
    schema: TSchema,
    initialValues: T
) {
    // États du formulaire
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValid, setIsValid] = useState(false);

    // Créer un validateur optimisé pour ce schéma
    const validator = createValidator<T>(schema);

    // Réinitialiser le formulaire
    const resetForm = useCallback((newValues?: T) => {
        setValues(newValues || initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    // Gérer les changements de champs
    const handleChange = useCallback((
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';

        setValues(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
        }));

        // Marquer le champ comme touché
        if (!touched[name]) {
            setTouched(prev => ({
                ...prev,
                [name]: true
            }));
        }

        // Effacer l'erreur pour ce champ
        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    }, [errors, touched]);

    // Mettre à jour une valeur spécifique
    const setValue = useCallback((name: string, value: any) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));

        // Marquer comme touché
        if (!touched[name]) {
            setTouched(prev => ({
                ...prev,
                [name]: true
            }));
        }

        // Effacer l'erreur
        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    }, [errors, touched]);

    // Valider le formulaire entier
    const validateForm = useCallback(() => {
        const result = validator.validate(values);
        setIsValid(result.isValid);

        if (!result.isValid && result.errors) {
            setErrors(result.errors);
            return false;
        }

        setErrors({});
        return true;
    }, [values, validator]);

    // Valider un champ spécifique
    const validateField = useCallback((name: string) => {
        const result = validator.validate(values);

        if (!result.isValid && result.errors && result.errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: result.errors![name]
            }));
            return false;
        }

        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }

        return true;
    }, [values, errors, validator]);

    // Gérer la soumission
    const handleSubmit = useCallback((
        onSubmit: (values: T) => void | Promise<void>
    ) => async (e: React.FormEvent) => {
        e.preventDefault();

        // Marquer tous les champs comme touchés
        const allTouched = Object.keys(values).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as Record<string, boolean>);

        setTouched(allTouched);

        // Valider le formulaire
        const isFormValid = validateForm();

        if (!isFormValid) {
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit(values);
        } finally {
            setIsSubmitting(false);
        }
    }, [values, validateForm]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        handleChange,
        setValue,
        validateForm,
        validateField,
        handleSubmit,
        resetForm
    };
}