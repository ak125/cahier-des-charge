import { useCallback, useState } from 'react';

type ValidationRules<T> = {
  [K in keyof T]?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: T[K]) => boolean;
    message?: string;
  };
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: ValidationRules<T>
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setIsDirty(true);

      // Validation en temps réel
      const fieldRules = validationRules[name];
      if (fieldRules) {
        let error = '';

        if (fieldRules.required && !value) {
          error = fieldRules.message || 'Ce champ est requis';
        } else if (fieldRules.minLength && String(value).trim().length < fieldRules.minLength) {
          error = fieldRules.message || `Minimum ${fieldRules.minLength} caractères requis`;
        } else if (fieldRules.maxLength && String(value).trim().length > fieldRules.maxLength) {
          error = fieldRules.message || `Maximum ${fieldRules.maxLength} caractères autorisés`;
        } else if (fieldRules.pattern && !fieldRules.pattern.test(String(value))) {
          error = fieldRules.message || 'Format invalide';
        } else if (fieldRules.custom && !fieldRules.custom(value)) {
          error = fieldRules.message || 'Validation échouée';
        }

        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validationRules]
  );

  const validateForm = useCallback(() => {
    const newErrors: ValidationErrors<T> = {};
    let isValid = true;

    // Valider tous les champs selon les règles définies
    Object.entries(validationRules).forEach(([field, rules]) => {
      const key = field as keyof T;
      const value = formData[key];
      let error = '';

      if (rules?.required && !value) {
        error = rules.message || 'Ce champ est requis';
      } else if (rules?.minLength && String(value).trim().length < rules.minLength) {
        error = rules.message || `Minimum ${rules.minLength} caractères requis`;
      } else if (rules?.maxLength && String(value).trim().length > rules.maxLength) {
        error = rules.message || `Maximum ${rules.maxLength} caractères autorisés`;
      } else if (rules?.pattern && !rules.pattern.test(String(value || ''))) {
        error = rules.message || 'Format invalide';
      } else if (rules?.custom && !rules.custom(value)) {
        error = rules.message || 'Validation échouée';
      }

      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validationRules]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsDirty(false);
  }, [initialData]);

  return {
    formData,
    errors,
    isDirty,
    handleChange,
    validateForm,
    resetForm,
    setFormData,
  };
}
