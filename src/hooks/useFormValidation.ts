
import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FormField {
  name: string;
  rules: ValidationRule;
  value: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: z.ZodSchema<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name: string, value: any, rules?: ValidationRule) => {
    let error = '';

    if (rules?.required && (!value || value.toString().trim() === '')) {
      error = 'This field is required';
    } else if (rules?.minLength && value.toString().length < rules.minLength) {
      error = `Minimum length is ${rules.minLength} characters`;
    } else if (rules?.maxLength && value.toString().length > rules.maxLength) {
      error = `Maximum length is ${rules.maxLength} characters`;
    } else if (rules?.pattern && !rules.pattern.test(value.toString())) {
      error = 'Invalid format';
    } else if (rules?.custom) {
      const customError = rules.custom(value);
      if (customError) error = customError;
    }

    return error;
  }, []);

  const validateWithSchema = useCallback((data: T) => {
    if (!validationSchema) return {};
    
    try {
      validationSchema.parse(data);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        return fieldErrors;
      }
      return {};
    }
  }, [validationSchema]);

  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldTouched = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const validateForm = useCallback(() => {
    const schemaErrors = validateWithSchema(values);
    setErrors(schemaErrors);
    return Object.keys(schemaErrors).length === 0;
  }, [values, validateWithSchema]);

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    const isValid = validateForm();
    
    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [values, validateForm]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setFieldTouched,
    validateForm,
    handleSubmit,
    resetForm
  };
};
