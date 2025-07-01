
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormField, FormFieldProps } from './FormField';
import { useFormValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

export interface DynamicFormField extends Omit<FormFieldProps, 'value' | 'onChange' | 'onBlur' | 'error'> {
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export interface DynamicFormProps {
  title?: string;
  description?: string;
  fields: DynamicFormField[];
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  validationSchema?: z.ZodSchema<any>;
}

export const DynamicForm = ({
  title,
  description,
  fields,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  className = '',
  validationSchema
}: DynamicFormProps) => {
  // Create initial values from fields
  const initialValues = fields.reduce((acc, field) => {
    acc[field.name] = field.type === 'checkbox' ? false : '';
    return acc;
  }, {} as Record<string, any>);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setFieldTouched,
    handleSubmit,
    resetForm
  } = useFormValidation(initialValues, validationSchema);

  const validateField = (field: DynamicFormField, value: any): string => {
    const { validation } = field;
    if (!validation) return '';

    if (validation.required && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`;
    }

    if (validation.minLength && value.toString().length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }

    if (validation.maxLength && value.toString().length > validation.maxLength) {
      return `${field.label} must be no more than ${validation.maxLength} characters`;
    }

    if (validation.pattern && !validation.pattern.test(value.toString())) {
      return `${field.label} format is invalid`;
    }

    if (validation.custom) {
      const customError = validation.custom(value);
      if (customError) return customError;
    }

    return '';
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setValue(fieldName, value);
    
    // Validate field in real-time if it has been touched
    if (touched[fieldName]) {
      const field = fields.find(f => f.name === fieldName);
      if (field) {
        const error = validateField(field, value);
        // Handle field-level error setting would go here
      }
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setFieldTouched(fieldName);
    
    // Validate field on blur
    const field = fields.find(f => f.name === fieldName);
    if (field) {
      const error = validateField(field, values[fieldName]);
      // Handle field-level error setting would go here
    }
  };

  const onFormSubmit = async (formData: Record<string, any>) => {
    await onSubmit(formData);
  };

  const renderFields = () => {
    return fields.map((field) => (
      <FormField
        key={field.name}
        {...field}
        value={values[field.name]}
        onChange={(value) => handleFieldChange(field.name, value)}
        onBlur={() => handleFieldBlur(field.name)}
        error={errors[field.name]}
      />
    ));
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onFormSubmit);
        }} className="space-y-4">
          {renderFields()}
          
          <div className="flex justify-between pt-6">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {cancelLabel}
              </Button>
            )}
            <div className={onCancel ? '' : 'ml-auto'}>
              <Button 
                type="submit" 
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? 'Submitting...' : submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
