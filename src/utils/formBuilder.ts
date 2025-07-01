
import { z } from 'zod';
import { DynamicFormField } from '@/components/forms/DynamicForm';

export interface FormBuilderConfig {
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string; // Function name for custom validation
  };
}

export class FormBuilder {
  private config: FormBuilderConfig;
  private customValidators: Record<string, (value: any) => string | null> = {};

  constructor(config: FormBuilderConfig) {
    this.config = config;
  }

  addCustomValidator(name: string, validator: (value: any) => string | null) {
    this.customValidators[name] = validator;
    return this;
  }

  buildFields(): DynamicFormField[] {
    return this.config.fields.map(fieldConfig => {
      const field: DynamicFormField = {
        name: fieldConfig.name,
        label: fieldConfig.label,
        type: fieldConfig.type,
        placeholder: fieldConfig.placeholder,
        description: fieldConfig.description,
        required: fieldConfig.required,
        options: fieldConfig.options
      };

      // Add validation if specified
      if (fieldConfig.validation || fieldConfig.required) {
        field.validation = {
          required: fieldConfig.required,
          ...fieldConfig.validation
        };

        // Convert pattern string to RegExp
        if (fieldConfig.validation?.pattern) {
          field.validation.pattern = new RegExp(fieldConfig.validation.pattern);
        }

        // Add custom validator if specified
        if (fieldConfig.validation?.custom && this.customValidators[fieldConfig.validation.custom]) {
          field.validation.custom = this.customValidators[fieldConfig.validation.custom];
        }
      }

      return field;
    });
  }

  buildZodSchema(): z.ZodSchema<any> {
    const schemaObject: Record<string, z.ZodTypeAny> = {};

    this.config.fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Invalid email format');
          break;
        case 'number':
          fieldSchema = z.coerce.number();
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        default:
          fieldSchema = z.string();
      }

      // Apply validation rules
      if (field.validation?.minLength) {
        fieldSchema = (fieldSchema as z.ZodString).min(field.validation.minLength);
      }
      if (field.validation?.maxLength) {
        fieldSchema = (fieldSchema as z.ZodString).max(field.validation.maxLength);
      }

      // Make optional if not required
      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaObject[field.name] = fieldSchema;
    });

    return z.object(schemaObject);
  }

  getConfig() {
    return this.config;
  }
}

// Utility functions for common form patterns
export const createContactForm = (): FormBuilder => {
  return new FormBuilder({
    title: 'Contact Us',
    description: 'Send us a message and we\'ll get back to you soon.',
    fields: [
      {
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: true,
        validation: { minLength: 2 }
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        required: true
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        required: true,
        validation: { minLength: 10 }
      }
    ]
  });
};

export const createRegistrationForm = (): FormBuilder => {
  return new FormBuilder({
    title: 'Create Account',
    description: 'Fill out the form below to create your account.',
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        validation: { minLength: 8 }
      },
      {
        name: 'confirmPassword',
        label: 'Confirm Password',
        type: 'password',
        required: true
      },
      {
        name: 'agreeToTerms',
        label: 'I agree to the Terms and Conditions',
        type: 'checkbox',
        required: true
      }
    ]
  });
};
