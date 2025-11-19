/**
 * Form Validation Utilities
 * Reusable validation functions for all forms
 */

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export const validators = {
  required: (value: string, fieldName: string = 'This field'): ValidationResult => {
    const trimmed = value?.trim() || '';
    return {
      isValid: trimmed.length > 0,
      error: trimmed.length > 0 ? '' : `${fieldName} is required`,
    };
  },

  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    return {
      isValid,
      error: isValid ? '' : 'Please enter a valid email address',
    };
  },

  minLength: (value: string, min: number, fieldName: string = 'This field'): ValidationResult => {
    const isValid = value?.length >= min;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be at least ${min} characters`,
    };
  },

  maxLength: (value: string, max: number, fieldName: string = 'This field'): ValidationResult => {
    const isValid = value?.length <= max;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must not exceed ${max} characters`,
    };
  },

  numeric: (value: string, fieldName: string = 'This field'): ValidationResult => {
    const numValue = Number(value);
    const isValid = !isNaN(numValue) && value?.trim().length > 0;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be a valid number`,
    };
  },

  positiveNumber: (value: string, fieldName: string = 'This field'): ValidationResult => {
    const numValue = Number(value);
    const isValid = !isNaN(numValue) && numValue > 0;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be a positive number`,
    };
  },

  minValue: (value: string, min: number, fieldName: string = 'This field'): ValidationResult => {
    const numValue = Number(value);
    const isValid = !isNaN(numValue) && numValue >= min;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be at least ${min}`,
    };
  },

  maxValue: (value: string, max: number, fieldName: string = 'This field'): ValidationResult => {
    const numValue = Number(value);
    const isValid = !isNaN(numValue) && numValue <= max;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must not exceed ${max}`,
    };
  },

  transactionId: (value: string): ValidationResult => {
    const trimmed = value?.trim() || '';
    const isValid = trimmed.length >= 6;
    return {
      isValid,
      error: isValid ? '' : 'Transaction ID must be at least 6 characters',
    };
  },

  phone: (value: string): ValidationResult => {
    const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
    const isValid = phoneRegex.test(value);
    return {
      isValid,
      error: isValid ? '' : 'Please enter a valid phone number',
    };
  },
};

/**
 * Validate multiple fields at once
 */
export const validateForm = (
  validations: Array<{ value: string; rules: Array<(value: string) => ValidationResult> }>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  validations.forEach(({ value, rules }) => {
    rules.forEach((rule) => {
      const result = rule(value);
      if (!result.isValid) {
        errors.push(result.error);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Real-time validation hook
 */
export const useFormValidation = () => {
  return {
    validateField: (value: string, rules: Array<(value: string) => ValidationResult>) => {
      for (const rule of rules) {
        const result = rule(value);
        if (!result.isValid) {
          return result.error;
        }
      }
      return '';
    },
  };
};
