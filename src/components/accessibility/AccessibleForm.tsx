
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface AccessibleFormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
}

export const AccessibleFormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required,
  helpText,
  placeholder
}: AccessibleFormFieldProps) => {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      
      {type === 'textarea' ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={`${helpText ? helpId : ''} ${error ? errorId : ''}`.trim()}
          aria-invalid={!!error}
          aria-required={required}
          className={error ? 'border-red-500 focus:border-red-500' : ''}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={`${helpText ? helpId : ''} ${error ? errorId : ''}`.trim()}
          aria-invalid={!!error}
          aria-required={required}
          className={error ? 'border-red-500 focus:border-red-500' : ''}
        />
      )}
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 flex items-center space-x-1" role="alert">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
